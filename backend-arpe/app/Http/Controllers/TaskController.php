<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TaskHistory;
use App\Models\User;
use App\Models\Notification;
use App\Notifications\TaskCreatedNotification;
use App\Jobs\SendTaskNotifications;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class TaskController extends Controller
{
    /**
     * Enregistrer un événement dans task_histories
     */
    protected function logHistory(Task $task, string $eventType, array $eventData = [])
    {
        try {
            TaskHistory::create([
                'task_id'    => $task->id,
                'title'      => $task->title,
                'status'     => $task->status,
                'createdBy'  => $task->createdBy,
                'event_type' => $eventType,
                'event_data' => $eventData,
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur enregistrement historique: ' . $e->getMessage());
        }
    }

    /**
     * Récupérer toutes les tâches avec les techniciens assignés
     */
    public function index()
    {
        try {
            $tasks = Task::with("technicians")->get();
            $user = auth()->user();

            return response()->json([
                'tasks' => $tasks,
                'tasks_count' => Task::where('status', '!=', 'terminé')->count(),
                'completed_tasks_count' => Task::where('status', 'terminé')->count(),
                'overdue_tasks_count' => Task::where('status', '!=', 'terminé')
                    ->whereNotNull('end_date')
                    ->whereDate('end_date', '<', today()->toDateString())
                    ->count(),
                'unread_notifications_count' => $user ? $user->unreadNotificationsCount() : 0,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching tasks: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to fetch tasks'], 500);
        }
    }

    /**
     * Créer une nouvelle tâche et assigner des techniciens
     */
    public function store(Request $request)
    {
        try {
            $creatorId = auth()->id();
            $task = $this->saveTask($request);

            // Enregistrer dans l'historique
            $this->logHistory($task, 'created', [
                'action'      => 'Tâche créée',
                'by'          => $task->createdBy,
                'status'      => $task->status,
                'start_date'  => $task->start_date,
                'end_date'    => $task->end_date,
                'technicians' => $task->technicians->pluck('name')->toArray(),
            ]);

            // Envoyer les notifications de manière ASYNCHRONE
            SendTaskNotifications::dispatch($task, $creatorId);

            return response()->json($task, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error("TaskController@store Error: " . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                "message" => "Erreur lors de la création de la tâche",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher la liste des tâches dans l'interface web
     */
    public function webIndex()
    {
        $tasks = Task::with("technicians")->get();
        return view('tasks.index', compact('tasks'));
    }

    /**
     * Afficher le formulaire de création de tâche
     */
    public function create()
    {
        $technicians = User::where('role', 'technicien')->get();
        return view('tasks.create', compact('technicians'));
    }

    /**
     * Enregistrer une tâche depuis le formulaire web
     */
    public function webStore(Request $request)
    {
        try {
            $creatorId = auth()->id();
            $task = $this->saveTask($request);

            // Enregistrer dans l'historique
            $this->logHistory($task, 'created', [
                'action'      => 'Tâche créée',
                'by'          => $task->createdBy,
                'status'      => $task->status,
                'start_date'  => $task->start_date,
                'end_date'    => $task->end_date,
                'technicians' => $task->technicians->pluck('name')->toArray(),
            ]);

            // Envoyer les notifications de manière ASYNCHRONE
            SendTaskNotifications::dispatch($task, $creatorId);

            return redirect()->route('tasks.index')->with('success', 'Tâche créée avec succès.');
        } catch (\Exception $e) {
            \Log::error('Error creating task: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Erreur lors de la création de la tâche: ' . $e->getMessage()]);
        }
    }

    /**
     * Afficher les détails d'une tâche dans l'interface web
     */
    public function webShow($id)
    {
        $task = Task::with(['technicians', 'comments.user'])->findOrFail($id);
        return view('tasks.show', compact('task'));
    }

    /**
     * Exporter toutes les tâches au format PDF
     */
    public function exportPdf(Request $request)
    {
        if (!auth()->check()) {
            $tokenString = $request->bearerToken() ?? $request->query('api_token');
            if ($tokenString) {
                $token = PersonalAccessToken::findToken($tokenString);
                if ($token && $token->tokenable) {
                    Auth::login($token->tokenable);
                }
            }
        }

        if (!auth()->check()) {
            abort(401, 'Non autorisé');
        }

        $tasks = Task::with('technicians')->get();
        $completedTasks = $tasks->where('status', 'terminé');
        $pendingTasks = $tasks->where('status', '!=', 'terminé');

        $pdf = PDF::loadView('tasks.pdf', compact('completedTasks', 'pendingTasks'))
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'defaultFont' => 'DejaVu Sans',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
            ]);

        return $pdf->download('taches-arpce.pdf');
    }

    /**
     * Afficher les détails d'une tâche via API
     */
    public function show($id)
    {
        try {
            $task = Task::with("technicians")->findOrFail($id);
            return response()->json($task);
        } catch (\Exception $e) {
            \Log::error('Error fetching task: ' . $e->getMessage());
            return response()->json([
                'error' => 'Cette tâche a été supprimée par l\'administrateur',
                'deleted' => true
            ], 404);
        }
    }

    protected function saveTask(Request $request)
    {
        $validated = $request->validate([
            "title" => "required|string|max:255",
            "description" => "nullable|string",
            "status" => "nullable|string|in:en cours,terminé,en attente",
            "start_date" => "nullable|date",
            "end_date" => "nullable|date",
            "technician_ids" => "nullable",
            "technicianIds" => "nullable",
        ]);

        $user = auth()->user();
        $validated["createdBy"] = $user ? $user->name : "Unknown";

        $technicianIds = $this->extractTechnicianIds($request);
        $this->validateTechnicianAssignments($technicianIds, $user);
        unset($validated["technician_ids"], $validated["technicianIds"]);

        $task = Task::create($validated);

        if (!empty($technicianIds)) {
            $task->technicians()->sync($technicianIds);
        }

        return $task->load("technicians");
    }

    /**
     * Créer les notifications en base de données et envoyer les emails
     */
    protected function notifyAllUsers(Task $task, $creatorId = null)
    {
        try {
            $creator = null;
            if ($creatorId) {
                $creator = User::find($creatorId);
            } else {
                $creator = auth()->user() ?? User::where('name', $task->createdBy)->first();
            }

            $users = User::active()->whereNotNull('email')->get();
            $technicians = $task->technicians->pluck('name')->toArray();

            if ($creator && !$users->isEmpty()) {
                foreach ($users as $user) {
                    Notification::create([
                        'type' => 'task_created',
                        'title' => 'Nouvelle tâche créée',
                        'message' => "Une nouvelle tâche '{$task->title}' a été créée par {$creator->name}",
                        'data' => [
                            'task_id' => $task->id,
                            'task_title' => $task->title,
                            'creator_name' => $creator->name,
                            'technicians' => $technicians,
                        ],
                        'user_id' => $user->id,
                        'sender_id' => $creator->id,
                        'is_read' => false,
                        'action_url' => "/tasks/{$task->id}",
                    ]);
                }

                NotificationFacade::send($users, new TaskCreatedNotification(
                    $task,
                    $creator->name,
                    $technicians
                ));
            }
        } catch (\Exception $notifyErr) {
            \Log::error('Notification error: ' . $notifyErr->getMessage(), [
                'exception' => $notifyErr,
                'task_id' => $task->id
            ]);
        }
    }

    /**
     * Mettre à jour une tâche via web (avec redirection)
     */
    public function webUpdate(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $this->ensureCanUpdateTask($task, auth()->user());
        $oldStatus = $task->status;

        $validated = $request->validate([
            "title" => "nullable|string|max:255",
            "description" => "nullable|string",
            "status" => "nullable|string|in:en cours,terminé,en attente",
            "start_date" => "nullable|date",
            "end_date" => "nullable|date",
            "technician_ids" => "nullable|array",
            "technician_ids.*" => "integer|exists:users,id",
        ]);

        $technicianIds = null;
        if ($request->has("technician_ids") || $request->has("technicianIds")) {
            $technicianIds = $this->extractTechnicianIds($request);
            $this->validateTechnicianAssignments($technicianIds, auth()->user());
        }

        unset($validated["technician_ids"], $validated["technicianIds"]);
        $task->update($validated);

        if ($technicianIds !== null) {
            $task->technicians()->sync($technicianIds);
        }

        // Enregistrer dans l'historique
        $eventType = ($oldStatus !== $task->status) ? 'status_changed' : 'updated';
        $this->logHistory($task, $eventType, [
            'action'     => $eventType === 'status_changed' ? 'Statut mis à jour' : 'Tâche modifiée',
            'by'         => auth()->user() ? auth()->user()->name : $task->createdBy,
            'old_status' => $oldStatus,
            'new_status' => $task->status,
        ]);

        return redirect()->back()->with('success', 'Statut de la tâche mis à jour avec succès.');
    }

    /**
     * Mettre à jour une tâche via API
     */
    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $this->ensureCanUpdateTask($task, auth()->user());
        $oldStatus = $task->status;

        $validated = $request->validate([
            "title" => "nullable|string|max:255",
            "description" => "nullable|string",
            "status" => "nullable|string|in:en cours,terminé,en attente",
            "start_date" => "nullable|date",
            "end_date" => "nullable|date",
            "technician_ids" => "nullable|array",
            "technician_ids.*" => "integer|exists:users,id",
        ]);

        $technicianIds = null;
        if ($request->has("technician_ids") || $request->has("technicianIds")) {
            $technicianIds = $this->extractTechnicianIds($request);
            $this->validateTechnicianAssignments($technicianIds, auth()->user());
        }

        unset($validated["technician_ids"], $validated["technicianIds"]);
        $task->update($validated);

        if ($technicianIds !== null) {
            $task->technicians()->sync($technicianIds);
        }

        // Enregistrer dans l'historique
        $eventType = ($oldStatus !== $task->status) ? 'status_changed' : 'updated';
        $this->logHistory($task, $eventType, [
            'action'     => $eventType === 'status_changed' ? 'Statut mis à jour' : 'Tâche modifiée',
            'by'         => auth()->user() ? auth()->user()->name : $task->createdBy,
            'old_status' => $oldStatus,
            'new_status' => $task->status,
        ]);

        return response()->json($task->load("technicians"));
    }

    private function extractTechnicianIds(Request $request): array
    {
        $raw = $request->input('technician_ids', $request->input('technicianIds', []));

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : explode(',', $raw);
        }

        return collect((array) $raw)
            ->map(function ($value) {
                if (is_array($value)) {
                    return (int) ($value['id'] ?? $value['value'] ?? 0);
                }

                return (int) $value;
            })
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function validateTechnicianAssignments(array $technicianIds, ?User $user): void
    {
        if (!$user || $user->role !== 'technicien') {
            return;
        }

        $technicianIds = array_map('intval', $technicianIds);
        if (!in_array((int) $user->id, $technicianIds, true)) {
            throw ValidationException::withMessages([
                'technician_ids' => ['Un technicien doit être assigné à la tâche.'],
            ]);
        }
    }

    private function ensureCanUpdateTask(Task $task, ?User $user): void
    {
        if (
            $user &&
            $user->role === 'technicien' &&
            !$task->technicians()->whereKey($user->id)->exists()
        ) {
            abort(403, 'Vous ne pouvez modifier que les tâches qui vous sont assignées.');
        }
    }

    /**
     * Supprimer une tâche (soft delete)
     */
    public function destroy($id)
    {
        $task = Task::findOrFail($id);

        // Enregistrer dans l'historique AVANT la suppression
        $this->logHistory($task, 'deleted', [
            'action'      => 'Tâche supprimée',
            'by'          => auth()->user() ? auth()->user()->name : $task->createdBy,
            'status'      => $task->status,
            'start_date'  => $task->start_date,
            'end_date'    => $task->end_date,
            'technicians' => $task->technicians->pluck('name')->toArray(),
        ]);

        $task->delete(); // Soft delete

        return response()->json(["message" => "Task deleted successfully"]);
    }

    /**
     * Récupérer l'historique des tâches supprimées (Admin only)
     */
    public function history()
    {
        $deletedTasks = Task::onlyTrashed()->with("technicians")->get();
        return response()->json($deletedTasks);
    }

    /**
     * Restaurer une tâche supprimée (Admin only)
     */
    public function restore($id)
    {
        $task = Task::withTrashed()->findOrFail($id);
        $task->restore();

        $restoredTask = Task::with('technicians')->findOrFail($id);

        // Enregistrer dans l'historique
        $this->logHistory($restoredTask, 'restored', [
            'action' => 'Tâche restaurée',
            'by'     => auth()->user() ? auth()->user()->name : $restoredTask->createdBy,
            'status' => $restoredTask->status,
        ]);

        return response()->json([
            "message" => "Task restored successfully",
            "task" => $restoredTask
        ]);
    }

    /**
     * Restaurer plusieurs tâches supprimées (Admin only)
     */
    public function restoreMany(Request $request)
    {
        $ids = $request->validate([
            "ids" => "required|array",
            "ids.*" => "integer|exists:tasks,id"
        ])["ids"];

        Task::withTrashed()->whereIn("id", $ids)->restore();

        $restoredTasks = Task::with('technicians')->whereIn('id', $ids)->get();

        foreach ($restoredTasks as $task) {
            $this->logHistory($task, 'restored', [
                'action' => 'Tâche restaurée',
                'by'     => auth()->user() ? auth()->user()->name : $task->createdBy,
                'status' => $task->status,
            ]);
        }

        return response()->json([
            "message" => "Tasks restored successfully",
            "count" => count($ids),
            "tasks" => $restoredTasks
        ]);
    }

    /**
     * Supprimer définitivement une tâche (Admin only)
     */
    public function forceDelete($id)
    {
        $task = Task::withTrashed()->findOrFail($id);

        // Enregistrer dans l'historique AVANT la suppression définitive
        $this->logHistory($task, 'force_deleted', [
            'action'      => 'Tâche supprimée définitivement',
            'by'          => auth()->user() ? auth()->user()->name : $task->createdBy,
            'status'      => $task->status,
            'technicians' => $task->technicians->pluck('name')->toArray(),
        ]);

        $task->technicians()->detach();
        $task->forceDelete();

        return response()->json(["message" => "Task permanently deleted"]);
    }

    /**
     * Supprimer définitivement plusieurs tâches (Admin only)
     */
    public function forceDeleteMany(Request $request)
    {
        $ids = $request->validate([
            "ids" => "required|array",
            "ids.*" => "integer|exists:tasks,id"
        ])["ids"];

        $controller = $this;
        Task::withTrashed()->whereIn("id", $ids)->each(function($task) use ($controller) {
            $controller->logHistory($task, 'force_deleted', [
                'action'      => 'Tâche supprimée définitivement',
                'by'          => auth()->user() ? auth()->user()->name : $task->createdBy,
                'status'      => $task->status,
                'technicians' => $task->technicians->pluck('name')->toArray(),
            ]);
            $task->technicians()->detach();
            $task->forceDelete();
        });

        return response()->json(["message" => "Tasks permanently deleted", "count" => count($ids)]);
    }

    /**
     * Store a new comment for a task (Web route)
     */
    public function webStoreComment(Request $request, $taskId)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $task = Task::findOrFail($taskId);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => auth()->id(),
            'content' => $request->content,
        ]);

        return redirect()->route('tasks.show-public', $task->id)->with('success', 'Commentaire ajouté avec succès');
    }

}