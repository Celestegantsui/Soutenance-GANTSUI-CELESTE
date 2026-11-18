<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = \Illuminate\Http\Request::capture()
);

use App\Models\Task;
use App\Models\User;
use App\Models\Notification as NotificationModel;

// Compter avant
$notifBefore = NotificationModel::count();
echo "Notifications avant: " . $notifBefore . PHP_EOL;

// Créer une tâche de test
$task = Task::create([
    'title' => 'Test ' . time(),
    'description' => 'Test task',
    'status' => 'en cours',
    'createdBy' => 'Test User'
]);

echo "Task created: ID " . $task->id . PHP_EOL;

// Envoyer les notifications manuellement
$creator = User::first();
$users = User::whereNotNull('email')->get();

echo "Creator: " . ($creator ? $creator->name : 'null') . PHP_EOL;
echo "Users count: " . $users->count() . PHP_EOL;

if ($creator && !$users->isEmpty()) {
    try {
        \Illuminate\Support\Facades\Notification::send($users, new \App\Notifications\TaskCreatedNotification(
            $task,
            $creator->name,
            []
        ));
        echo "Notifications sent!" . PHP_EOL;
    } catch (\Exception $e) {
        echo "Error sending notifications: " . $e->getMessage() . PHP_EOL;
    }
}

// Compter après
$notifAfter = NotificationModel::count();
echo "Notifications après: " . $notifAfter . PHP_EOL;
echo "Créées: " . ($notifAfter - $notifBefore) . PHP_EOL;
