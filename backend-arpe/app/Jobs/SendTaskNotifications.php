<?php

namespace App\Jobs;

use App\Models\Task;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use App\Notifications\TaskCreatedNotification;

class SendTaskNotifications implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $task;
    protected $creatorId;

    /**
     * Create a new job instance.
     */
    public function __construct(Task $task, $creatorId = null)
    {
        $this->task = $task;
        $this->creatorId = $creatorId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Récupérer le créateur
            $creator = null;
            if ($this->creatorId) {
                $creator = User::find($this->creatorId);
            } else {
                $creator = auth()->user() ?? User::where('name', $this->task->createdBy)->first();
            }

            $users = User::active()->whereNotNull('email')->get();
            $technicians = $this->task->technicians->pluck('name')->toArray();

            if ($creator && !$users->isEmpty()) {
                Log::info('Creating task notifications asynchronously', [
                    'task_id' => $this->task->id,
                    'creator_id' => $this->creatorId,
                    'creator_name' => $creator->name,
                    'users_count' => $users->count()
                ]);

                // 1. Créer les notifications en base de données
                foreach ($users as $user) {
                    Notification::create([
                        'type' => 'task_created',
                        'title' => 'Nouvelle tâche créée',
                        'message' => "Une nouvelle tâche '{$this->task->title}' a été créée par {$creator->name}",
                        'data' => [
                            'task_id' => $this->task->id,
                            'task_title' => $this->task->title,
                            'creator_name' => $creator->name,
                            'technicians' => $technicians,
                        ],
                        'user_id' => $user->id,
                        'sender_id' => $creator->id,
                        'is_read' => false,
                        'action_url' => "/tasks/{$this->task->id}",
                    ]);
                }

                Log::info('Database notifications created', [
                    'task_id' => $this->task->id,
                    'notifications_created' => $users->count()
                ]);

                // 2. Envoyer les emails de manière asynchrone
                NotificationFacade::send($users, new TaskCreatedNotification(
                    $this->task,
                    $creator->name,
                    $technicians
                ));

                Log::info('Task notifications sent asynchronously', [
                    'task_id' => $this->task->id,
                    'users_notified' => $users->count()
                ]);
            } else {
                Log::warning('Cannot send notifications: creator or users missing', [
                    'creator_found' => $creator ? true : false,
                    'creator_name' => $creator->name ?? null,
                    'users_count' => $users->count()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('SendTaskNotifications job failed: ' . $e->getMessage(), [
                'exception' => $e,
                'task_id' => $this->task->id
            ]);
        }
    }
}