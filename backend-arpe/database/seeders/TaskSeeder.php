<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer les IDs des utilisateurs
        $admin   = DB::table('users')->where('email', 'lesmasta05@gmail.com')->first();
        $marvy   = DB::table('users')->where('email', 'gwlad.marvy@gmail.com')->first();
        $celeste = DB::table('users')->where('email', 'celestegantsui44@gmail.com')->first();

        $adminId   = $admin   ? $admin->id   : 1;
        $marvyId   = $marvy   ? $marvy->id   : 2;
        $celesteId = $celeste ? $celeste->id : 3;

        // Liste des tâches de test
        $tasks = [
            [
                'title'       => 'Mise à jour du parc IT',
                'description' => 'Mise à jour des imprimantes et des postes de travail du service comptabilité.',
                'status'      => 'terminé',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-04-14',
                'end_date'    => '2026-04-17',
                'created_at'  => Carbon::parse('2026-04-14 08:00:00'),
                'updated_at'  => Carbon::parse('2026-04-17 17:00:00'),
                'technicians' => [$adminId],
            ],
            [
                'title'       => 'Problème d\'IP phone',
                'description' => 'Aucune connexion internet sur les téléphones IP du bureau 24.',
                'status'      => 'terminé',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-04-15',
                'end_date'    => '2026-04-16',
                'created_at'  => Carbon::parse('2026-04-15 09:00:00'),
                'updated_at'  => Carbon::parse('2026-04-16 15:00:00'),
                'technicians' => [$celesteId, $adminId],
            ],
            [
                'title'       => 'Mise à jour du parc IT',
                'description' => 'De pnr la mise à jour des cartouches d\'imprimante.',
                'status'      => 'en cours',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-04-22',
                'end_date'    => '2026-04-23',
                'created_at'  => Carbon::parse('2026-04-22 08:30:00'),
                'updated_at'  => Carbon::parse('2026-04-22 08:30:00'),
                'technicians' => [$adminId],
            ],
            [
                'title'       => 'Problème d\'imprimante',
                'description' => 'L\'imprimante du 3ème étage bourre régulièrement. Diagnostic et remplacement de la cartouche.',
                'status'      => 'en cours',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-04-23',
                'end_date'    => '2026-04-24',
                'created_at'  => Carbon::parse('2026-04-23 10:00:00'),
                'updated_at'  => Carbon::parse('2026-04-23 10:00:00'),
                'technicians' => [$adminId],
            ],
            [
                'title'       => 'Finale',
                'description' => 'Préparation et vérification finale avant la mise en production.',
                'status'      => 'terminé',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-04-22',
                'end_date'    => '2026-04-23',
                'created_at'  => Carbon::parse('2026-04-22 14:00:00'),
                'updated_at'  => Carbon::parse('2026-04-23 18:00:00'),
                'technicians' => [$celesteId, $adminId],
            ],
            [
                'title'       => 'Hdehyueu',
                'description' => 'Nnccn - Analyse et traitement de la demande.',
                'status'      => 'en cours',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-04-22',
                'end_date'    => '2026-04-23',
                'created_at'  => Carbon::parse('2026-04-22 16:00:00'),
                'updated_at'  => Carbon::parse('2026-04-22 16:00:00'),
                'technicians' => [$celesteId, $marvyId],
            ],
            [
                'title'       => 'Installation réseau salle de conférence',
                'description' => 'Installation et configuration du réseau Wi-Fi dans la nouvelle salle de conférence.',
                'status'      => 'terminé',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-03-10',
                'end_date'    => '2026-03-12',
                'created_at'  => Carbon::parse('2026-03-10 08:00:00'),
                'updated_at'  => Carbon::parse('2026-03-12 17:00:00'),
                'technicians' => [$marvyId],
            ],
            [
                'title'       => 'Sauvegarde des données serveur',
                'description' => 'Sauvegarde complète des données du serveur principal avant migration.',
                'status'      => 'terminé',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-03-15',
                'end_date'    => '2026-03-15',
                'created_at'  => Carbon::parse('2026-03-15 07:00:00'),
                'updated_at'  => Carbon::parse('2026-03-15 12:00:00'),
                'technicians' => [$adminId, $marvyId],
            ],
            [
                'title'       => 'Remplacement switch réseau',
                'description' => 'Remplacement du switch défectueux au 2ème étage du bâtiment administratif.',
                'status'      => 'terminé',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-03-20',
                'end_date'    => '2026-03-21',
                'created_at'  => Carbon::parse('2026-03-20 09:00:00'),
                'updated_at'  => Carbon::parse('2026-03-21 16:00:00'),
                'technicians' => [$celesteId],
            ],
            [
                'title'       => 'Configuration VPN employés',
                'description' => 'Mise en place et configuration du VPN pour les employés en télétravail.',
                'status'      => 'en cours',
                'createdBy'   => 'lesmasta05',
                'start_date'  => '2026-05-05',
                'end_date'    => '2026-05-10',
                'created_at'  => Carbon::parse('2026-05-05 08:00:00'),
                'updated_at'  => Carbon::parse('2026-05-05 08:00:00'),
                'technicians' => [$adminId, $celesteId],
            ],
        ];

        foreach ($tasks as $taskData) {
            $technicians = $taskData['technicians'];
            unset($taskData['technicians']);

            // Insérer la tâche
            $taskId = DB::table('tasks')->insertGetId($taskData);

            // Lier les techniciens dans task_user
            foreach ($technicians as $userId) {
                DB::table('task_user')->insert([
                    'task_id' => $taskId,
                    'user_id' => $userId,
                ]);
            }

            // Historique : création de la tâche
            DB::table('task_histories')->insert([
                'task_id'    => $taskId,
                'title'      => $taskData['title'],
                'status'     => 'en cours',
                'createdBy'  => $taskData['createdBy'],
                'event_type' => 'created',
                'event_data' => json_encode([
                    'action'  => 'Tâche créée',
                    'by'      => $taskData['createdBy'],
                    'status'  => 'en cours',
                ]),
                'created_at' => $taskData['created_at'],
                'updated_at' => $taskData['created_at'],
            ]);

            // Historique : tâche terminée (uniquement pour les tâches terminées)
            if ($taskData['status'] === 'terminé') {
                DB::table('task_histories')->insert([
                    'task_id'    => $taskId,
                    'title'      => $taskData['title'],
                    'status'     => 'terminé',
                    'createdBy'  => $taskData['createdBy'],
                    'event_type' => 'status_changed',
                    'event_data' => json_encode([
                        'action'      => 'Statut mis à jour',
                        'by'          => $taskData['createdBy'],
                        'old_status'  => 'en cours',
                        'new_status'  => 'terminé',
                    ]),
                    'created_at' => $taskData['updated_at'],
                    'updated_at' => $taskData['updated_at'],
                ]);
            }
        }
    }
}
