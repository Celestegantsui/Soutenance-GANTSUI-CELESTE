<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_female_technician_account(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'actif',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Technicienne Test',
                'email' => 'technicienne@example.test',
                'password' => 'password123',
                'role' => 'technician',
                'gender' => 'female',
                'status' => 'active',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.gender', 'female')
            ->assertJsonPath('data.role', 'technician');
        $this->assertDatabaseHas('users', [
            'email' => 'technicienne@example.test',
            'gender' => 'female',
            'role' => 'technicien',
        ]);
    }
}