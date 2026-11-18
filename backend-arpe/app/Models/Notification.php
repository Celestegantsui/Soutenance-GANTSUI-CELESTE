<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'user_id',
        'sender_id',
        'is_read',
        'read_at',
        'action_url'
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relations
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Scopes - Filtres de requête
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeTaskCreated($query)
    {
        return $query->where('type', 'task_created');
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Methods - Méthodes utiles
     */
    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now()
        ]);
    }

    public function markAsUnread()
    {
        $this->update([
            'is_read' => false,
            'read_at' => null
        ]);
    }

    /**
     * Vérifier si la notification est lue
     */
    public function isRead(): bool
    {
        return $this->is_read === true;
    }

    /**
     * Vérifier si la notification n'est pas lue
     */
    public function isUnread(): bool
    {
        return $this->is_read === false;
    }

    /**
     * Obtenir le titre de la notification
     */
    public function getTitle(): string
    {
        return $this->title ?? 'Notification';
    }

    /**
     * Obtenir le message de la notification
     */
    public function getMessage(): string
    {
        return $this->message ?? '';
    }
}