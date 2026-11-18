<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\TaskComment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    // Les colonnes que Laravel peut remplir automatiquement
    protected $fillable = [
        'title',
        'description',
        'status',
        'createdBy',
        'start_date',
        'end_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string,string>
     */
    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Retourne le statut affiché, avec une valeur dynamique pour les tâches en retard.
     */
    public function getStatusAttribute(): string
    {
        $status = $this->getRawOriginal('status');

        if ($this->isOverdue()) {
            return 'en retard';
        }

        return $status;
    }

    public function isOverdue(): bool
    {
        return $this->getRawOriginal('status') !== 'terminé'
            && $this->end_date !== null
            && $this->end_date->lt(today());
    }

    /**
     * Relation avec les techniciens
     */
    public function technicians()
    {
        return $this->belongsToMany(User::class, 'task_user');
    }

    /**
     * Relation avec les commentaires
     */
    public function comments()
    {
        return $this->hasMany(TaskComment::class)->with('user')->orderBy('created_at', 'asc');
    }

    /**
     * Relation avec les notifications liées à cette tâche
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'data->task_id', 'id');
    }
}