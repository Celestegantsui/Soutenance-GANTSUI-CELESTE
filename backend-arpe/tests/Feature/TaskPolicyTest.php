<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskPolicyTest extends TestCase
{
	use RefreshDatabase;

	public function test_technician_cannot_create_task_assigned_only_to_another_technician(): void
	{
		$technician = User::factory()->create(['role' => 'technicien', 'status' => 'actif']);
		$otherTechnician = User::factory()->create(['role' => 'technicien', 'status' => 'actif']);

		$response = $this->actingAs($technician, 'sanctum')
			->postJson('/api/tasks', [
				'title' => 'Tâche d’équipe',
				'status' => 'en cours',
				'technician_ids' => [$otherTechnician->id],
			]);

		$response->assertUnprocessable()
			->assertJsonValidationErrors('technician_ids');
		$this->assertDatabaseMissing('tasks', ['title' => 'Tâche d’équipe']);
	}

	public function test_technician_can_create_task_assigned_to_himself(): void
	{
		$technician = User::factory()->create(['role' => 'technicien', 'status' => 'actif']);

		$response = $this->actingAs($technician, 'sanctum')
			->postJson('/api/tasks', [
				'title' => 'Tâche personnelle',
				'status' => 'en cours',
				'technician_ids' => [$technician->id],
			]);

		$response->assertCreated();
		$this->assertDatabaseHas('task_user', ['user_id' => $technician->id]);
	}

	public function test_technician_cannot_create_task_without_assigning_himself(): void
	{
		$technician = User::factory()->create(['role' => 'technicien', 'status' => 'actif']);

		$response = $this->actingAs($technician, 'sanctum')
			->postJson('/api/tasks', [
				'title' => 'Tâche sans assignation',
				'status' => 'en cours',
			]);

		$response->assertUnprocessable()
			->assertJsonValidationErrors('technician_ids');
		$this->assertDatabaseMissing('tasks', ['title' => 'Tâche sans assignation']);
	}

	public function test_admin_can_create_unassigned_task(): void
	{
		$admin = User::factory()->create(['role' => 'admin', 'status' => 'actif']);

		$response = $this->actingAs($admin, 'sanctum')
			->postJson('/api/tasks', [
				'title' => 'Tâche sans assignation admin',
				'status' => 'en cours',
			]);

		$response->assertCreated();
		$this->assertDatabaseHas('tasks', ['title' => 'Tâche sans assignation admin']);
	}

	public function test_technician_cannot_update_task_without_assigning_himself(): void
	{
		$technician = User::factory()->create(['role' => 'technicien', 'status' => 'actif']);
		$otherTechnician = User::factory()->create(['role' => 'technicien', 'status' => 'actif']);
		$task = Task::create([
			'title' => 'Tâche existante',
			'status' => 'en cours',
			'createdBy' => $technician->name,
		]);
		$task->technicians()->attach($technician);

		$response = $this->actingAs($technician, 'sanctum')
			->putJson('/api/tasks/' . $task->id, [
				'technician_ids' => [$otherTechnician->id],
			]);

		$response->assertUnprocessable()
			->assertJsonValidationErrors('technician_ids');
		$this->assertDatabaseHas('task_user', ['task_id' => $task->id, 'user_id' => $technician->id]);
	}

	public function test_technician_not_assigned_to_task_cannot_change_its_status(): void
	{
		$technician = User::factory()->create(['role' => 'technicien', 'status' => 'actif']);
		$assignedTechnician = User::factory()->create(['role' => 'technicien', 'status' => 'actif']);
		$task = Task::create([
			'title' => 'Tâche d’un collègue',
			'status' => 'en cours',
			'createdBy' => $assignedTechnician->name,
		]);
		$task->technicians()->attach($assignedTechnician);

		$response = $this->actingAs($technician, 'sanctum')
			->putJson('/api/tasks/' . $task->id, [
				'status' => 'terminé',
			]);

		$response->assertForbidden();
		$this->assertDatabaseHas('tasks', [
			'id' => $task->id,
			'status' => 'en cours',
		]);
	}
}
