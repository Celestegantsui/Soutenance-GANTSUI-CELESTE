<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HistoryOverdueTest extends TestCase
{
    use RefreshDatabase;

    public function test_history_displays_current_overdue_tasks(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'actif']);
        $technician = User::factory()->create(['role' => 'technicien', 'status' => 'actif']);

        $overdueTask = Task::create([
            'title' => 'Tâche en retard',
            'status' => 'en cours',
            'createdBy' => $admin->name,
            'start_date' => now()->startOfMonth()->addDay(),
            'end_date' => now()->startOfMonth()->subDay(),
        ]);
        $overdueTask->technicians()->attach($technician);

        Task::create([
            'title' => 'Tâche terminée',
            'status' => 'terminé',
            'createdBy' => $admin->name,
            'start_date' => now()->startOfMonth()->addDay(),
            'end_date' => now()->startOfMonth()->subDay(),
        ]);

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->get('/history?month=' . now()->format('Y-m'));

        $response->assertOk();
        $response->assertSee('Tâches actuellement en retard');
        $response->assertSee('Tâche en retard');
        $response->assertSee($technician->name);
        $response->assertDontSee('Tâche terminée');

        $this->getJson('/api/history/monthly?month=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('0.stats.overdueTasks', 1)
            ->assertJsonPath('0.tasks.0.status', 'overdue')
            ->assertJsonPath('0.tasks.0.endDate', now()->startOfMonth()->subDay()->toDateString());

        $this->getJson('/api/history/dashboard?month=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('kpis.overdueTasks', 1)
            ->assertJsonPath('details.overdueTasks', 1);
    }

    public function test_history_reports_zero_overdue_tasks_when_none_are_past_due(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'actif']);

        Task::create([
            'title' => 'Tâche à échéance aujourd’hui',
            'status' => 'en cours',
            'createdBy' => $admin->name,
            'start_date' => now()->startOfMonth()->addDay(),
            'end_date' => today(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/history/dashboard?month=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('kpis.overdueTasks', 0)
            ->assertJsonPath('details.overdueTasks', 0);
    }

    public function test_history_shows_current_overdue_tasks_from_previous_months(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'actif']);

        Task::create([
            'title' => 'Retard commencé le mois dernier',
            'status' => 'en cours',
            'createdBy' => $admin->name,
            'start_date' => now()->subMonth()->startOfMonth()->addDay(),
            'end_date' => now()->subMonth()->endOfMonth(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->get('/history?month=' . now()->format('Y-m'));

        $response->assertOk();
        $response->assertSee('Tâches actuellement en retard');
        $response->assertSee('Retard commencé le mois dernier');

        $this->getJson('/api/history/dashboard?month=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('kpis.totalTasks', 0)
            ->assertJsonPath('kpis.overdueTasks', 0)
            ->assertJsonPath('details.currentOverdueTasks', 1)
            ->assertJsonPath('overdueTaskDetails.0.title', 'Retard commencé le mois dernier');
    }
}
