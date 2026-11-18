@extends('layouts.app')

@section('title', 'Dashboard - ARPCE')

@section('content')

<div class="page-header">
    <h1>Tableau de bord</h1>
    <p>Bienvenue {{ Auth::user()?->name ?? 'Utilisateur' }}, voici un aperçu de vos tâches et notifications</p>
</div>

<!-- STATS CARDS -->
<div class="card-grid">
    <div class="stat-card">
        <div class="stat-card-label">Tâches en cours</div>
        <div class="stat-card-value">{{ $tasksCount ?? 0 }}</div>
    </div>

    <div class="stat-card success">
        <div class="stat-card-label">Tâches terminées</div>
        <div class="stat-card-value">{{ $completedTasksCount ?? 0 }}</div>
    </div>

    <div class="stat-card warning">
        <div class="stat-card-label">Notifications</div>
        <div class="stat-card-value">{{ $newNotificationsCount ?? 0 }}</div>
    </div>

    <div class="stat-card info">
        <div class="stat-card-label">Techniciens</div>
        <div class="stat-card-value">{{ $techniciansCount ?? 0 }}</div>
    </div>
</div>

<!-- ACTIONS RAPIDES -->
<div class="card" style="margin-bottom: 30px;">
    <h3 style="margin: 0 0 20px 0; color: var(--gray-dark);">Actions Rapides</h3>
    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
        <a href="{{ route('tasks.create') }}" class="btn btn-primary">➕ Créer une tâche</a>
        <a href="{{ route('tasks.index') }}" class="btn btn-secondary">📋 Voir toutes les tâches</a>
        <a href="{{ route('notifications.index') }}" class="btn btn-secondary">🔔 Voir les notifications</a>
    </div>
</div>

<!-- DERNIÈRES TÂCHES -->
<div class="card" style="margin-bottom: 30px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: var(--gray-dark);">📋 Dernières tâches</h3>
        <a href="{{ route('tasks.index') }}" style="color: var(--primary); font-size: 14px;">Voir toutes →</a>
    </div>

    @if(empty($recentTasks) || $recentTasks->isEmpty())
        <div class="no-data">Aucune tâche enregistrée. <a href="{{ route('tasks.create') }}">Créez-en une!</a></div>
    @else
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th style="width: 40%;">Titre</th>
                        <th style="width: 20%;">Statut</th>
                        <th style="width: 20%;">Date début</th>
                        <th style="width: 20%;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($recentTasks as $task)
                        <tr>
                            <td><strong>{{ $task->title }}</strong></td>
                            <td>
                                <span style="
                                    padding: 4px 10px;
                                    border-radius: 4px;
                                    font-size: 12px;
                                    font-weight: 600;
                                    @if($task->status === 'terminé') background: #f6ffed; color: #22863a;
                                    @elseif($task->status === 'en cours') background: #e6f7ff; color: #0050b3;
                                    @else background: #fffbe6; color: #9d6e00;
                                    @endif
                                ">
                                    {{ $task->status ?? '-' }}
                                </span>
                            </td>
                            <td>{{ $task->start_date ? $task->start_date->format('d/m/Y') : '-' }}</td>
                            <td><a href="{{ route('tasks.show', $task->id) }}" class="btn btn-primary btn-sm">Voir</a></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
</div>

