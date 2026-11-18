@extends('layouts.app')

@section('title', 'Tâches - ARPCE')

@section('content')

<div class="page-header">
    <h1>Gestion des tâches</h1>
    <p>Voir et gérer toutes les tâches du système</p>
</div>

<div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
    <a href="{{ route('tasks.create') }}" class="btn btn-primary">➕ Créer une tâche</a>
    <a href="{{ route('tasks.export.pdf') }}" class="btn btn-secondary">📄 Exporter en PDF</a>
</div>

<div class="card">
    @if(empty($tasks) || $tasks->isEmpty())
        <div class="no-data">Aucune tâche enregistrée. <a href="{{ route('tasks.create') }}">Créez-en une!</a></div>
    @else
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th style="width: 25%;">Titre</th>
                        <th style="width: 15%;">Statut</th>
                        <th style="width: 15%;">Créé par</th>
                        <th style="width: 15%;">Début</th>
                        <th style="width: 15%;">Fin</th>
                        <th style="width: 15%;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($tasks as $task)
                        <tr class="task-row" data-task-id="{{ $task->id }}" onclick="toggleTaskDetails({{ $task->id }})" style="cursor: pointer;">
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
                            <td>{{ $task->createdBy ?? 'Inconnu' }}</td>
                            <td>{{ $task->start_date ? $task->start_date->format('d/m/Y') : '-' }}</td>
                            <td>{{ $task->end_date ? $task->end_date->format('d/m/Y') : '-' }}</td>
                            <td><button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); toggleTaskDetails({{ $task->id }})">Voir</button></td>
                        </tr>
                        <tr id="details-{{ $task->id }}" class="task-details-row" style="display: none;">
                            <td colspan="6" style="padding: 20px; background: var(--light); border-top: 1px solid var(--border);">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div>
                                        <h4>Description</h4>
                                        <p>{{ $task->description ?? 'Aucune description fournie.' }}</p>
                                    </div>
                                    <div>
                                        <h4>Techniciens assignés</h4>
                                        @if($task->technicians && $task->technicians->isNotEmpty())
                                            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                                                @foreach($task->technicians as $technician)
                                                    <span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">{{ $technician->name }}</span>
                                                @endforeach
                                            </div>
                                        @else
                                            <p>Aucun technicien assigné.</p>
                                        @endif
                                    </div>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
</div>

<script>
    function toggleTaskDetails(taskId) {
        const detailsRow = document.getElementById('details-' + taskId);
        if (detailsRow.style.display === 'none' || detailsRow.style.display === '') {
            detailsRow.style.display = 'table-row';
        } else {
            detailsRow.style.display = 'none';
        }
    }
</script>

@endsection
