<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Export des tâches - ARPCE</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #222;
            margin: 0;
            padding: 0;
        }
        .page {
            padding: 20px;
        }
        .header {
            margin-bottom: 24px;
        }
        .header h1 {
            font-size: 24px;
            margin: 0 0 6px;
        }
        .header p {
            margin: 0;
            color: #555;
            font-size: 12px;
        }
        .section-title {
            margin: 24px 0 12px;
            font-size: 18px;
            color: #111;
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 12px;
        }
        table th,
        table td {
            border: 1px solid #dcdcdc;
            padding: 8px 10px;
            vertical-align: top;
            text-align: left;
        }
        table th {
            background: #f6f6f6;
            font-weight: bold;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
        }
        .completed {
            background: #d4edda;
            color: #155724;
        }
        .pending {
            background: #fff3cd;
            color: #856404;
        }
        .task-description {
            margin: 8px 0 0;
            font-size: 11px;
            color: #444;
        }
        .no-data {
            font-size: 12px;
            color: #555;
            padding: 10px 0;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <h1>Export des tâches</h1>
            <p>Date d'export : {{ now()->format('d/m/Y H:i') }}</p>
        </div>

        <div>
            <div class="section-title">Tâches terminées</div>
            @if($completedTasks->isEmpty())
                <div class="no-data">Aucune tâche terminée.</div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Titre</th>
                            <th>Créé par</th>
                            <th>Début</th>
                            <th>Fin</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($completedTasks as $task)
                            <tr>
                                <td>{{ $task->title }}</td>
                                <td>{{ $task->createdBy ?? 'Inconnu' }}</td>
                                <td>{{ $task->start_date ? $task->start_date->format('d/m/Y') : '-' }}</td>
                                <td>{{ $task->end_date ? $task->end_date->format('d/m/Y') : '-' }}</td>
                                <td>{{ $task->description ?: '-' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

        <div>
            <div class="section-title">Tâches non terminées</div>
            @if($pendingTasks->isEmpty())
                <div class="no-data">Aucune tâche non terminée.</div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Titre</th>
                            <th>Statut</th>
                            <th>Créé par</th>
                            <th>Début</th>
                            <th>Fin</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($pendingTasks as $task)
                            <tr>
                                <td>{{ $task->title }}</td>
                                <td>
                                    <span class="status-badge pending">{{ $task->status ?: 'Non terminé' }}</span>
                                </td>
                                <td>{{ $task->createdBy ?? 'Inconnu' }}</td>
                                <td>{{ $task->start_date ? $task->start_date->format('d/m/Y') : '-' }}</td>
                                <td>{{ $task->end_date ? $task->end_date->format('d/m/Y') : '-' }}</td>
                                <td>{{ $task->description ?: '-' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>
</body>
</html>
