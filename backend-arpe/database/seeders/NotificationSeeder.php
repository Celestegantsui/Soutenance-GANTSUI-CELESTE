<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Notification;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer des notifications de test pour les utilisateurs
        $users = User::all();

        foreach ($users as $user) {
            // Créer quelques notifications pour chaque utilisateur
            Notification::create([
                'type' => 'task_created',
                'title' => 'Nouvelle tâche assignée',
                'message' => 'Vous avez été assigné à une nouvelle tâche : "Maintenance serveur"',
                'user_id' => $user->id,
                'sender_id' => $users->where('role', 'admin')->first()?->id ?? 1,
                'action_url' => '/tasks/1',
                'is_read' => rand(0, 1) // Aléatoirement lu ou non lu
            ]);

            Notification::create([
                'type' => 'system',
                'title' => 'Bienvenue',
                'message' => 'Bienvenue sur la plateforme ARPE !',
                'user_id' => $user->id,
                'action_url' => '/tasks',
                'is_read' => true
            ]);

            // Une notification non lue pour tester
            Notification::create([
                'type' => 'task_updated',
                'title' => 'Tâche mise à jour',
                'message' => 'La tâche "Installation logiciel" a été mise à jour',
                'user_id' => $user->id,
                'sender_id' => $users->where('role', 'admin')->first()?->id ?? 1,
                'action_url' => '/tasks/2',
                'is_read' => false
            ]);
        }
    }
}
