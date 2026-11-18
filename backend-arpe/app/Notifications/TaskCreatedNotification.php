<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $task;
    protected $creatorName;
    protected $technicians;

    /**
     * Créer une nouvelle instance de notification
     */
    public function __construct(Task $task, string $creatorName, array $technicians = [])
    {
        $this->task = $task;
        $this->creatorName = $creatorName;
        $this->technicians = $technicians;
    }

    /**
     * Obtenir les canaux de livraison de la notification.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        if (method_exists($notifiable, 'isActive') && !$notifiable->isActive()) {
            return [];
        }

        return ['mail', 'database'];
    }

    /**
     * Obtenir la représentation par courriel de la notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $techniciansList = !empty($this->technicians) 
            ? implode(', ', $this->technicians) 
            : 'Non spécifiés';

        return (new MailMessage)
            ->subject("Nouvelle tâche : {$this->task->title}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Une nouvelle tâche a été créée.")
            ->line("**Titre :** {$this->task->title}")
            ->line("**Créée par :** {$this->creatorName}")
            ->line("**Techniciens :** {$techniciansList}")
            ->action('Voir la tâche', url("/tasks/{$this->task->id}"));
    }

    /**
     * Obtenir la représentation de la notification dans la base de données.
     * ✅ MESSAGE COMPACT : "Kaspersky - Créé par Admin"
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'task_created',
            'title' => 'Nouvelle tâche créée',
            'message' => "{$this->task->title} - Créé par {$this->creatorName}",
            'data' => [
                'task_id' => $this->task->id,
                'task_title' => $this->task->title,
                'creator_name' => $this->creatorName,
                'technicians' => $this->technicians,
            ],
            'action_url' => "/tasks/{$this->task->id}",
        ];
    }

    /**
     * Obtenir la représentation sous forme de tableau de la notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'creator_name' => $this->creatorName,
            'technicians' => $this->technicians,
        ];
    }
}