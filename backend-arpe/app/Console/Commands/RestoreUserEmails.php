<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class RestoreUserEmails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:restore-user-emails';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Restore individual email addresses for all users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $emails = [
            'Prince MASSISSA' => 'Prince.massissa@arpce.cg',
            'Celeste GANTSUI' => 'Celestegantsui44@gmail.com',
            'lesmasta05' => 'lesmasta05@gmail.com',
            'leslie' => 'leslie1405@gmail.com',
            'Test Admin' => 'admin@test.com',
            'Test Technicien' => 'tech@test.com',
        ];

        foreach ($emails as $name => $email) {
            User::where('name', $name)->update(['email' => $email]);
            $this->info("Updated $name to $email");
        }

        $this->info('All user emails restored!');
    }
}
