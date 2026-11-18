<?php

namespace Tests\Unit;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_completed_task_with_expired_end_date_is_overdue(): void
    {
        $task = Task::create([
            'title' => 'Tâche en retard',
            'status' => 'en cours',
            'createdBy' => 'Administrateur',
            'end_date' => now()->subDay(),
        ]);

        $this->assertSame('en retard', $task->status);
        $this->assertSame('en cours', $task->getRawOriginal('status'));
    }

    public function test_completed_task_with_expired_end_date_is_not_overdue(): void
    {
        $task = Task::create([
            'title' => 'Tâche terminée',
            'status' => 'terminé',
            'createdBy' => 'Administrateur',
            'end_date' => now()->subDay(),
        ]);

        $this->assertSame('terminé', $task->status);
    }

    public function test_task_due_today_is_not_overdue(): void
    {
        $task = Task::create([
            'title' => 'Tâche échéance aujourd’hui',
            'status' => 'en cours',
            'createdBy' => 'Administrateur',
            'end_date' => today(),
        ]);

        $this->assertSame('en cours', $task->status);
    }
}
