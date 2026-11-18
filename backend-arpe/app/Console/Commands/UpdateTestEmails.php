<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class UpdateTestEmails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:update-test-emails {email=celestegantsui44@gmail.com}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update all user emails to a test email address';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $testEmail = $this->argument('email');
        
        $count = User::query()->update(['email' => $testEmail]);
        
        $this->info("Updated {$count} users with email: {$testEmail}");
    }
}
