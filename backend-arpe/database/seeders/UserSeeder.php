<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Liste des vrais techniciens et administrateurs
        $users = [
           
            
           ['name' => 'Marvy', 'email' => 'gwlad.marvy@gmail.com', 'password' => 'marvy@123456', 'role' => 'technicien'],
            ['name' => 'Celeste GANTSUI', 'email' => 'celestegantsui44@gmail.com', 'password' => 'Celeste@123456', 'role' => 'technicien'],
            ['name' => 'lesmasta05', 'email' => 'lesmasta05@gmail.com', 'password' => 'lesmasta05@123456', 'role' => 'admin'],
            
        ];

        foreach ($users as $u) {
            $userData = [
                'name' => $u['name'],
                'password' => Hash::make($u['password']),
                'role' => $u['role'],
            ];

            // Pour les techniciens, réinitialiser les couleurs aux NULL (pour utiliser les défauts)
            if ($u['role'] === 'technicien') {
                $userData['primary_color'] = null;
                $userData['secondary_color'] = null;
                $userData['background_color'] = null;
                $userData['text_color'] = null;
            }

            User::updateOrCreate(
                ['email' => $u['email']],
                $userData
            );
        }
    }
}