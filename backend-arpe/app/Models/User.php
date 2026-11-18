<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'gender',
        'status',
        'primary_color',
        'secondary_color',
        'background_color',
        'text_color',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Vérifier si le compte est actif (peut recevoir mails et notifications)
     */
    public function isActive(): bool
    {
        return $this->status === 'actif';
    }

    /**
     * Limiter la requête aux comptes actifs
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'actif');
    }

    /**
     * Ne pas envoyer d'e-mail si le compte est inactif
     */
    public function routeNotificationForMail($notification = null)
    {
        return $this->isActive() ? $this->email : null;
    }

    /**
     * Vérifier si l'utilisateur est admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Vérifier si l'utilisateur est un technicien
     */
    public function isTechnician(): bool
    {
        return $this->role === 'technicien';
    }

    /**
     * Vérifier si l'utilisateur a un rôle spécifique
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Relation avec les tâches assignées
     */
    public function tasks()
    {
        return $this->belongsToMany(Task::class, 'task_user');
    }

    /**
     * Relation avec les notifications reçues
     */
    public function receivedNotifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }

    /**
     * Relation avec les notifications envoyées
     */
    public function sentNotifications()
    {
        return $this->hasMany(Notification::class, 'sender_id');
    }

    /**
     * Récupérer les notifications non lues
     */
    public function unreadNotifications()
    {
        if (!$this->isActive()) {
            return $this->receivedNotifications()->whereRaw('1 = 0');
        }

        return $this->receivedNotifications()->where('is_read', false);
    }

    /**
     * Compter les notifications non lues
     */
    public function unreadNotificationsCount()
    {
        if (!$this->isActive()) {
            return 0;
        }

        return $this->unreadNotifications()->count();
    }
}