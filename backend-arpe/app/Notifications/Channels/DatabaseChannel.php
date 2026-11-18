<?php

namespace App\Notifications\Channels;

use App\Models\Notification as NotificationModel;

class DatabaseChannel
{
    /**
     * Send the given notification.
     */
    public function send(object $notifiable, object $notification): void
    {
        $data = method_exists($notification, 'toDatabase')
            ? $notification->toDatabase($notifiable)
            : $notification->toArray();

        NotificationModel::create([
            'user_id' => $notifiable->getKey(),
            'type' => $data['type'] ?? 'notification',
            'title' => $data['title'] ?? 'Notification',
            'message' => $data['message'] ?? '',
            'data' => $data['data'] ?? [],
            'action_url' => $data['action_url'] ?? null,
            'sender_id' => null,
            'is_read' => false
        ]);
    }
}
