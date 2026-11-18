<?php

require_once __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Notification;

try {
    $user = User::where('email', 'tech@test.com')->first();

    if ($user) {
        $notification = Notification::create([
            'type' => 'task_created',
            'title' => 'Test Notification',
            'message' => 'Ceci est une notification de test pour vérifier le système',
            'user_id' => $user->id,
            'sender_id' => 1,
            'action_url' => '/notifications'
        ]);

        echo 'Notification créée avec ID: ' . $notification->id . PHP_EOL;
    } else {
        echo 'Utilisateur test non trouvé' . PHP_EOL;
    }
} catch (Exception $e) {
    echo 'Erreur: ' . $e->getMessage() . PHP_EOL;
}