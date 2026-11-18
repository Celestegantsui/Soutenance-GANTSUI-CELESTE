@extends('layouts.app')

@section('title', 'Historique & Statistiques')

@section('content')
<style>
    .hist-page { color: #0f3d3e; }
    .hist-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 22px; }
    .hist-header h1 { font-size: 28px; margin: 0 0 6px; color: #0b3b3c; }
    .hist-header p { margin: 0; color: #6b7c7c; }
    .hist-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .hist-select, .hist-btn {
        border: 1px solid #d7e3e3; background: #fff; border-radius: 10px;
        padding: 10px 14px; font-size: 14px; color: #234;
    }
    .hist-btn-primary { background: #0f766e; color: #fff; border-color: #0f766e; cursor: pointer; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px; }
    .kpi-card { background: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 8px 24px rgba(15, 118, 110, 0.06); }
    .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .kpi-label { font-size: 13px; color: #6b7c7c; }
    .kpi-icon { width: 36px; height: 36px; border-radius: 999px; display: grid; place-items: center; font-weight: 700; }
    .kpi-value { font-size: 32px; font-weight: 700; margin: 8px 0 4px; }
    .kpi-delta { font-size: 12px; color: #6b7c7c; }
    .kpi-delta.up { color: #16a34a; }
    .kpi-delta.down { color: #dc2626; }
    .charts-grid, .details-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; margin-bottom: 18px; }
    .panel { background: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 8px 24px rgba(15, 118, 110, 0.06); }
    .panel h3 { margin: 0 0 14px; font-size: 16px; }
    .mini-kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
    .mini-kpi { background: #f4fbfb; border-radius: 12px; padding: 12px; text-align: center; }
    .mini-kpi b { display: block; font-size: 20px; margin-top: 4px; }
    .tech-table { width: 100%; border-collapse: collapse; }
    .tech-table th, .tech-table td { padding: 10px 8px; text-align: left; font-size: 13px; border-bottom: 1px solid #eef3f3; }
    .progress { height: 8px; background: #e6f2f1; border-radius: 99px; overflow: hidden; min-width: 90px; }
    .progress span { display: block; height: 100%; background: #0f766e; }
    .avatar { width: 28px; height: 28px; border-radius: 50%; display: inline-grid; place-items: center; color: #fff; font-size: 11px; font-weight: 700; margin-right: 8px; }
    .activity-table { width: 100%; border-collapse: collapse; }
    .activity-table th, .activity-table td { padding: 12px 8px; font-size: 13px; border-bottom: 1px solid #eef3f3; text-align: left; }
    .badge { padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 600; }
    .badge-created { background: #ecfdf3; color: #15803d; }
    .badge-done { background: #ecfdf3; color: #166534; }
    .badge-updated { background: #fff7ed; color: #c2410c; }
    .badge-meeting { background: #eff6ff; color: #1d4ed8; }
    @media (max-width: 1100px) {
        .kpi-grid, .charts-grid, .details-grid, .mini-kpis { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 700px) {
        .kpi-grid, .charts-grid, .details-grid, .mini-kpis { grid-template-columns: 1fr; }
    }
</style>

<div class="hist-page">
    <div class="hist-header">
        <div>
            <h1>Historique & Statistiques</h1>
            <p>Analyse de l'activité et des performances de votre équipe.</p>
        </div>
        <form class="hist-actions" method="GET" action="{{ route('history.index') }}">
            <select name="month" class="hist-select" onchange="this.form.submit()">
                @for ($i = 0; $i < 12; $i++)
                    @php $option = now()->startOfMonth()->subMonths($i); @endphp
                    <option value="{{ $option->format('Y-m') }}" @selected($month === $option->format('Y-m'))>
                        {{ ucfirst($option->translatedFormat('F Y')) }}
                    </option>
                @endfor
            </select>
            <select name="technician_id" class="hist-select" onchange="this.form.submit()">
                <option value="">Technicien · Tous</option>
                @foreach ($technicians as $tech)
                    <option value="{{ $tech->id }}" @selected((string) $filters['technician_id'] === (string) $tech->id)>{{ $tech->name }}</option>
                @endforeach
            </select>
            <select name="status" class="hist-select" onchange="this.form.submit()">
                <option value="tous" @selected($filters['status'] === 'tous')>Statut · Tous</option>
                <option value="en cours" @selected($filters['status'] === 'en cours')>En cours</option>
                <option value="terminé" @selected($filters['status'] === 'terminé')>Terminé</option>
                <option value="en attente" @selected($filters['status'] === 'en attente')>En attente</option>
                <option value="en retard" @selected($filters['status'] === 'en retard')>En retard</option>
            </select>
            <a class="hist-btn hist-btn-primary" href="{{ route('tasks.export.pdf') }}">Exporter PDF</a>
        </form>
    </div>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-top">
                <div class="kpi-label">Taux de réalisation</div>
                <div class="kpi-icon" style="background:#ecfdf3;color:#16a34a;">✓</div>
            </div>
            <div class="kpi-value">{{ $kpis['completionRate'] }} %</div>
            <div class="kpi-delta {{ $kpis['completionRateDelta'] >= 0 ? 'up' : 'down' }}">
                {{ $kpis['completionRateDelta'] >= 0 ? '+' : '' }}{{ $kpis['completionRateDelta'] }} % vs {{ $previousMonthLabel }}
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-top">
                <div class="kpi-label">Tâches totales</div>
                <div class="kpi-icon" style="background:#eff6ff;color:#2563eb;">☰</div>
            </div>
            <div class="kpi-value">{{ $kpis['totalTasks'] }}</div>
            <div class="kpi-delta {{ $kpis['totalTasksDelta'] >= 0 ? 'up' : 'down' }}">
                {{ $kpis['totalTasksDelta'] >= 0 ? '+' : '' }}{{ $kpis['totalTasksDelta'] }} % vs {{ $previousMonthLabel }}
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-top">
                <div class="kpi-label">Temps moyen de traitement</div>
                <div class="kpi-icon" style="background:#f5f3ff;color:#7c3aed;">◷</div>
            </div>
            <div class="kpi-value">{{ $kpis['averageCompletionTime'] }} jours</div>
            <div class="kpi-delta">{{ $kpis['averageCompletionTimeDelta'] }} jour vs {{ $previousMonthLabel }}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-top">
                <div class="kpi-label">Tâches en retard</div>
                <div class="kpi-icon" style="background:#fff7ed;color:#ea580c;">!</div>
            </div>
            <div class="kpi-value">{{ $kpis['overdueTasks'] }}</div>
            <div class="kpi-delta {{ $kpis['overdueTasksDelta'] <= 0 ? 'up' : 'down' }}">
                {{ $kpis['overdueTasksDelta'] >= 0 ? '+' : '' }}{{ $kpis['overdueTasksDelta'] }} % vs {{ $previousMonthLabel }}
            </div>
        </div>
    </div>

    <div class="charts-grid">
        <div class="panel">
            <h3>Évolution du taux de réalisation</h3>
            <canvas id="rateChart" height="120"></canvas>
        </div>
        <div class="panel">
            <h3>Volume de tâches par mois</h3>
            <canvas id="volumeChart" height="120"></canvas>
        </div>
    </div>

    <div class="details-grid">
        <div class="panel">
            <h3>Détails – {{ ucfirst($monthLabel) }}</h3>
            <div class="mini-kpis">
                <div class="mini-kpi">Taux de réalisation<b>{{ $details['completionRate'] }} %</b></div>
                <div class="mini-kpi">Tâches restantes<b>{{ $details['remainingTasksRate'] }} %</b></div>
                <div class="mini-kpi">Temps moyen<b>{{ $details['averageCompletionTime'] }} jours</b></div>
                <div class="mini-kpi">Tâches totales<b>{{ $details['totalTasks'] }}</b></div>
                <div class="mini-kpi">Réunions<b>{{ $details['meetings'] }}</b></div>
            </div>
        </div>
        <div class="panel">
            <h3>Répartition par technicien</h3>
            <table class="tech-table">
                <thead>
                    <tr>
                        <th>Technicien</th>
                        <th>Assignées</th>
                        <th>Terminées</th>
                        <th>Taux</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($technicianStats as $row)
                        <tr>
                            <td>
                                <span class="avatar" style="background: hsl({{ ($row['id'] * 47) % 360 }}, 45%, 42%)">{{ $row['initials'] }}</span>
                                {{ $row['name'] }}
                            </td>
                            <td>{{ $row['assigned'] }}</td>
                            <td>{{ $row['completed'] }}</td>
                            <td>
                                <div style="display:flex;align-items:center;gap:8px;">
                                    <div class="progress"><span style="width: {{ $row['completionRate'] }}%"></span></div>
                                    {{ $row['completionRate'] }} %
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="4">Aucune assignation ce mois-ci.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <div class="panel">
        <h3>Tâches actuellement en retard · tous les mois ({{ $details['currentOverdueTasks'] }})</h3>
        <table class="activity-table">
            <thead>
                <tr>
                    <th>Tâche</th>
                    <th>Échéance</th>
                    <th>Statut</th>
                    <th>Techniciens</th>
                    <th>Créée par</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($overdueTaskDetails as $task)
                    <tr>
                        <td>{{ $task['title'] }}</td>
                        <td>{{ $task['endDate'] }}</td>
                        <td>{{ $task['status'] }}</td>
                        <td>{{ $task['technicians'] }}</td>
                        <td>{{ $task['createdBy'] }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5">Aucune tâche en retard pour cette sélection.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="panel">
        <h3>Historique des activités</h3>
        <table class="activity-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Élément concerné</th>
                    <th>Auteur</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($activities as $activity)
                    @php
                        $action = $activity['action'] ?? '';
                        $badgeClass = str_contains(mb_strtolower($action), 'termin') ? 'badge-done'
                            : (str_contains(mb_strtolower($action), 'modif') ? 'badge-updated'
                            : (str_contains(mb_strtolower($action), 'réunion') ? 'badge-meeting' : 'badge-created'));
                    @endphp
                    <tr>
                        <td>{{ $activity['date'] }}</td>
                        <td><span class="badge {{ $badgeClass }}">{{ $action }}</span></td>
                        <td>{{ $activity['event'] }}</td>
                        <td>{{ $activity['author'] }}</td>
                    </tr>
                @empty
                    <tr><td colspan="4">Aucune activité enregistrée pour le moment.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    const rateLabels = @json(collect($completionEvolution)->pluck('label'));
    const rateValues = @json(collect($completionEvolution)->pluck('rate'));
    const volumeLabels = @json(collect($volumeByMonth)->pluck('label'));
    const volumeValues = @json(collect($volumeByMonth)->pluck('count'));

    new Chart(document.getElementById('rateChart'), {
        type: 'line',
        data: {
            labels: rateLabels,
            datasets: [{
                label: 'Taux de réalisation (%)',
                data: rateValues,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.08)',
                tension: 0.35,
                fill: true,
                pointRadius: 4
            }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }
    });

    new Chart(document.getElementById('volumeChart'), {
        type: 'bar',
        data: {
            labels: volumeLabels,
            datasets: [{
                label: 'Tâches',
                data: volumeValues,
                backgroundColor: '#0f766e',
                borderRadius: 8
            }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
</script>
@endsection
