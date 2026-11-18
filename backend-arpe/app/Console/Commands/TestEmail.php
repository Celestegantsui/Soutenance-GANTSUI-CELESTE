<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-email {--list-users : List all users} {--send-test : Send test email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email functionality and list users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('list-users')) {
            $this->listUsers();
        }

        if ($this->option('send-test')) {
            $this->sendTestEmail();
        }

        if (!$this->option('list-users') && !$this->option('send-test')) {
            $this->info('Use --list-users to list users or --send-test to send test email');
        }
    }

    private function listUsers()
    {
        $users = \App\Models\User::all();

        $this->info('Utilisateurs dans la base de données:');
        $this->table(
            ['ID', 'Nom', 'Email', 'Rôle'],
            $users->map(function ($user) {
                return [$user->id, $user->name, $user->email, $user->role];
            })
        );
    }

    private function sendTestEmail()
    {
        $users = \App\Models\User::where('email', 'like', '%@gmail.com%')->get();

        if ($users->isEmpty()) {
            $this->error('Aucun utilisateur Gmail trouvé');
            return;
        }

        foreach ($users as $user) {
            try {
                \Illuminate\Support\Facades\Mail::raw(
                    "Test de notification ARPE\n\nCeci est un email de test pour vérifier que le système de notifications fonctionne.\n\nDate: " . now()->format('Y-m-d H:i:s'),
                    function ($message) use ($user) {
                        $message->to($user->email)
                                ->subject('Test Notification ARPE');
                    }
                );

                $this->info("Email envoyé à {$user->email}");
            } catch (\Exception $e) {
                $this->error("Erreur envoi email à {$user->email}: {$e->getMessage()}");
            }
        }

        $this->info('Vérifiez les logs dans storage/logs/laravel.log pour voir les emails');
    }
}
