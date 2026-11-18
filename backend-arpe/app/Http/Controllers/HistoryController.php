<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class HistoryController extends Controller
{
    public function __construct()
    {
        Carbon::setLocale('fr');
    }

    /**
     * Archives mensuelles calculées à partir des tâches planifiées.
     * Compatible avec MonthlyArchive du frontend.
     */
    public function monthly(Request $request)
    {
        try {
            $payload = $this->buildDashboard($request);

            return response()->json($payload['archives']);
        } catch (\Throwable $e) {
            \Log::error('Erreur chargement historique: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([]);
        }
    }

    /**
     * Données pour la page Historique & Statistiques (API Next.js).
     */
    public function dashboard(Request $request)
    {
        try {
            return response()->json($this->buildDashboard($request));
        } catch (\Throwable $e) {
            \Log::error('Erreur dashboard historique: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json(['message' => 'Impossible de charger l’historique'], 500);
        }
    }

    /**
     * Page web Historique & Statistiques.
     */
    public function webIndex(Request $request)
    {
        $dashboard = $this->buildDashboard($request);

        return view('history.index', $dashboard);
    }

    private function buildDashboard(Request $request): array
    {
        $monthKey = $request->query('month', now()->format('Y-m'));
        $technicianId = $request->query('technician_id');
        $statusFilter = $request->query('status');

        try {
            $selectedMonth = Carbon::createFromFormat('Y-m', $monthKey)->startOfMonth();
        } catch (\Throwable $e) {
            $selectedMonth = now()->startOfMonth();
            $monthKey = $selectedMonth->format('Y-m');
        }

        $previousMonth = $selectedMonth->copy()->subMonth();

        $tasks = Task::with('technicians')->orderBy('created_at', 'asc')->get();

        $filtered = $tasks->filter(function (Task $task) use ($technicianId, $statusFilter) {
            if ($technicianId && !$task->technicians->contains('id', (int) $technicianId)) {
                return false;
            }

            if ($statusFilter && $statusFilter !== 'tous' && $task->status !== $statusFilter) {
                return false;
            }

            return true;
        });

        $monthTasks = $filtered->filter(function (Task $task) use ($selectedMonth) {
            return $this->taskMonth($task)->equalTo($selectedMonth);
        });

        $previousTasks = $filtered->filter(function (Task $task) use ($previousMonth) {
            return $this->taskMonth($task)->equalTo($previousMonth);
        });

        $kpis = $this->computeKpis($monthTasks);
        $previousKpis = $this->computeKpis($previousTasks);
        $currentOverdueTasks = $filtered->filter(fn (Task $task) => $task->isOverdue());

        $archives = $this->buildArchives($filtered);
        $volumeByMonth = $this->volumeByMonth($filtered, $selectedMonth);
        $completionEvolution = $this->completionEvolution($filtered, $selectedMonth);
        $technicianStats = $this->technicianStats($monthTasks);

        return [
            'month' => $monthKey,
            'monthLabel' => $selectedMonth->translatedFormat('F Y'),
            'year' => (int) $selectedMonth->format('Y'),
            'viewMode' => $request->query('view', 'month'),
            'filters' => [
                'technician_id' => $technicianId,
                'status' => $statusFilter ?: 'tous',
            ],
            'technicians' => User::query()
                ->where('role', 'technicien')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->values(),
            'kpis' => [
                'completionRate' => $kpis['completionRate'],
                'completionRateDelta' => $this->delta($kpis['completionRate'], $previousKpis['completionRate']),
                'totalTasks' => $kpis['totalTasks'],
                'totalTasksDelta' => $this->percentDelta($kpis['totalTasks'], $previousKpis['totalTasks']),
                'averageCompletionTime' => $kpis['averageCompletionTime'],
                'averageCompletionTimeDelta' => round($kpis['averageCompletionTime'] - $previousKpis['averageCompletionTime'], 1),
                'overdueTasks' => $kpis['overdueTasks'],
                'overdueTasksDelta' => $this->percentDelta($kpis['overdueTasks'], $previousKpis['overdueTasks']),
                'completedTasks' => $kpis['completedTasks'],
                'remainingTasks' => $kpis['remainingTasks'],
                'meetings' => $kpis['meetings'],
            ],
            'details' => [
                'completionRate' => $kpis['completionRate'],
                'remainingTasksRate' => $kpis['remainingTasksRate'],
                'averageCompletionTime' => $kpis['averageCompletionTime'],
                'totalTasks' => $kpis['totalTasks'],
                'overdueTasks' => $kpis['overdueTasks'],
                'currentOverdueTasks' => $currentOverdueTasks->count(),
                'meetings' => $kpis['meetings'],
            ],
            'volumeByMonth' => $volumeByMonth,
            'completionEvolution' => $completionEvolution,
            'technicianStats' => $technicianStats,
            'overdueTaskDetails' => $this->overdueTaskDetails($currentOverdueTasks),
            'activities' => $this->activities(),
            'archives' => $archives,
            'previousMonthLabel' => $previousMonth->translatedFormat('F'),
        ];
    }

    private function taskMonth(Task $task): Carbon
    {
        $date = $task->start_date ?? $task->created_at;

        return Carbon::parse($date)->startOfMonth();
    }

    private function computeKpis($tasks): array
    {
        $totalTasks = $tasks->count();
        $completedTasks = $tasks->where('status', 'terminé')->count();
        $remainingTasks = $totalTasks - $completedTasks;
        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;
        $remainingTasksRate = $totalTasks > 0 ? round(($remainingTasks / $totalTasks) * 100, 1) : 0;

        $times = $tasks
            ->filter(fn (Task $task) => $task->start_date && $task->end_date)
            ->map(fn (Task $task) => Carbon::parse($task->start_date)->diffInDays(Carbon::parse($task->end_date)))
            ->all();

        $averageCompletionTime = count($times) > 0
            ? round(array_sum($times) / count($times), 1)
            : 0;

        $overdueTasks = $tasks
            ->filter(fn (Task $task) => $task->isOverdue())
            ->count();

        $meetings = $tasks
            ->filter(fn (Task $task) => str_contains(mb_strtolower($task->title ?? ''), 'réunion')
                || str_contains(mb_strtolower($task->title ?? ''), 'reunion'))
            ->count();

        return [
            'totalTasks' => $totalTasks,
            'completedTasks' => $completedTasks,
            'remainingTasks' => $remainingTasks,
            'completionRate' => $completionRate,
            'remainingTasksRate' => $remainingTasksRate,
            'averageCompletionTime' => $averageCompletionTime,
            'overdueTasks' => $overdueTasks,
            'meetings' => $meetings,
        ];
    }

    private function overdueTaskDetails($tasks): array
    {
        return $tasks
            ->filter(fn (Task $task) => $task->isOverdue())
            ->sortBy(fn (Task $task) => Carbon::parse($task->end_date))
            ->map(function (Task $task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'endDate' => optional($task->end_date)->format('d M. Y'),
                    'createdBy' => $task->createdBy,
                    'technicians' => $task->technicians->pluck('name')->implode(', ') ?: 'Non assigné',
                ];
            })
            ->values()
            ->all();
    }

    private function delta($current, $previous): float
    {
        return round($current - $previous, 1);
    }

    private function percentDelta($current, $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function volumeByMonth($tasks, Carbon $selectedMonth): array
    {
        $start = $selectedMonth->copy()->subMonths(5)->startOfMonth();
        $points = [];

        for ($i = 0; $i < 6; $i++) {
            $month = $start->copy()->addMonths($i);
            $count = $tasks->filter(fn (Task $task) => $this->taskMonth($task)->equalTo($month))->count();
            $points[] = [
                'month' => $month->format('Y-m'),
                'label' => $month->translatedFormat('M'),
                'count' => $count,
            ];
        }

        return $points;
    }

    private function completionEvolution($tasks, Carbon $selectedMonth): array
    {
        $start = $selectedMonth->copy()->subMonths(5)->startOfMonth();
        $points = [];

        for ($i = 0; $i < 6; $i++) {
            $month = $start->copy()->addMonths($i);
            $monthTasks = $tasks->filter(fn (Task $task) => $this->taskMonth($task)->equalTo($month));
            $kpis = $this->computeKpis($monthTasks);
            $points[] = [
                'month' => $month->format('Y-m'),
                'label' => $month->translatedFormat('M'),
                'rate' => $kpis['completionRate'],
            ];
        }

        return $points;
    }

    private function technicianStats($monthTasks): array
    {
        $technicians = User::query()
            ->where('role', 'technicien')
            ->orderBy('name')
            ->get();

        return $technicians->map(function (User $user) use ($monthTasks) {
            $assigned = $monthTasks->filter(fn (Task $task) => $task->technicians->contains('id', $user->id));
            $assignedCount = $assigned->count();
            $completed = $assigned->where('status', 'terminé')->count();
            $rate = $assignedCount > 0 ? round(($completed / $assignedCount) * 100) : 0;
            $parts = preg_split('/\s+/', trim($user->name));
            $initials = strtoupper(mb_substr($parts[0] ?? '', 0, 1) . mb_substr($parts[1] ?? $parts[0] ?? '', 0, 1));

            return [
                'id' => $user->id,
                'name' => $user->name,
                'initials' => $initials,
                'assigned' => $assignedCount,
                'completed' => $completed,
                'completionRate' => $rate,
            ];
        })->filter(fn ($row) => $row['assigned'] > 0)->values()->all();
    }

    private function activities(): array
    {
        if (!Schema::hasTable('task_histories')) {
            return Task::with('technicians')
                ->latest('updated_at')
                ->limit(10)
                ->get()
                ->map(function (Task $task) {
                    $action = $task->status === 'terminé' ? 'Tâche terminée' : 'Tâche créée';
                    $author = $task->technicians->pluck('name')->first() ?: ($task->createdBy ?: 'Système');

                    return [
                        'date' => optional($task->updated_at)->format('d M. Y H:i'),
                        'action' => $action,
                        'event' => $task->title,
                        'author' => $author,
                    ];
                })
                ->all();
        }

        return TaskHistory::query()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (TaskHistory $history) {
                $data = $history->event_data ?? [];
                $action = $data['action'] ?? $this->actionLabel($history->event_type);
                $author = $data['by'] ?? $history->createdBy ?? 'Système';

                return [
                    'date' => optional($history->created_at)->format('d M. Y H:i'),
                    'action' => $action,
                    'event' => $history->title,
                    'author' => $author,
                    'type' => $history->event_type,
                ];
            })
            ->all();
    }

    private function actionLabel(?string $type): string
    {
        return match ($type) {
            'created' => 'Tâche créée',
            'updated' => 'Tâche modifiée',
            'status_changed' => 'Tâche terminée',
            'deleted' => 'Tâche supprimée',
            'restored' => 'Tâche restaurée',
            default => 'Activité',
        };
    }

    private function buildArchives($tasks): array
    {
        if ($tasks->isEmpty()) {
            return [];
        }

        $grouped = $tasks->groupBy(fn (Task $task) => $this->taskMonth($task)->format('Y-m'));
        $archives = [];

        foreach ($grouped as $monthKey => $items) {
            $date = Carbon::createFromFormat('Y-m', $monthKey)->startOfMonth();
            $mappedTasks = $items->map(fn (Task $task) => $this->mapTask($task))->values()->all();
            $kpis = $this->computeKpis($items);

            $archives[] = [
                'month'       => $monthKey,
                'year'        => (int) $date->format('Y'),
                'monthNumber' => (int) $date->format('n'),
                'tasks'       => $mappedTasks,
                'meetings'    => [],
                'createdAt'   => $date->toIso8601String(),
                'stats'       => [
                    'completionRate'        => $kpis['completionRate'],
                    'remainingTasksRate'    => $kpis['remainingTasksRate'],
                    'averageCompletionTime' => $kpis['averageCompletionTime'],
                    'totalTasks'            => $kpis['totalTasks'],
                    'completedTasks'        => $kpis['completedTasks'],
                    'remainingTasks'        => $kpis['remainingTasks'],
                    'overdueTasks'          => $kpis['overdueTasks'],
                    'pendingTasks'          => $items->where('status', 'en attente')->count(),
                    'inProgressTasks'       => $items->where('status', 'en cours')->count(),
                    'totalMeetings'         => $kpis['meetings'],
                    'meetingCompletionRate' => 0,
                    'totalMeetingHours'     => 0,
                    'technicianStats'       => $this->technicianStats($items),
                    'formulas'              => [
                        'completionRate' => [
                            'label'   => 'Taux de réalisation des tâches',
                            'formula' => '(Nombre de tâches terminées ÷ Nombre de tâches planifiées) × 100',
                        ],
                        'remainingTasksRate' => [
                            'label'   => 'Taux de tâches restantes',
                            'formula' => '(Nombre de tâches non terminées ÷ Nombre total de tâches planifiées) × 100',
                        ],
                    ],
                ],
            ];
        }

        usort($archives, fn ($a, $b) => strcmp($b['month'], $a['month']));

        return $archives;
    }

    private function mapTask(Task $task): array
    {
        $frontendStatus = 'in-progress';
        if ($task->status === 'en retard') {
            $frontendStatus = 'overdue';
        } elseif ($task->status === 'terminé') {
            $frontendStatus = 'completed';
        } elseif ($task->status === 'en attente') {
            $frontendStatus = 'pending';
        }

        $daysToComplete = null;
        if ($task->start_date && $task->end_date) {
            $daysToComplete = Carbon::parse($task->start_date)->diffInDays(Carbon::parse($task->end_date));
        }

        $technicianNames = $task->technicians->pluck('name')->filter()->values()->all();
        $assignedTo = !empty($technicianNames)
            ? implode(', ', $technicianNames)
            : ($task->createdBy ?: 'Non affecté');

        return [
            'id'             => (string) $task->id,
            'title'          => $task->title ?? 'Sans titre',
            'status'         => $frontendStatus,
            'assignedTo'     => $assignedTo,
            'technicianIds'  => $task->technicians->pluck('id')->values()->all(),
            'createdDate'    => $task->created_at?->toDateString(),
            'endDate'        => $task->end_date?->toDateString(),
            'completedDate'  => $frontendStatus === 'completed' ? $task->updated_at?->toDateString() : null,
            'daysToComplete' => $daysToComplete,
        ];
    }
}
