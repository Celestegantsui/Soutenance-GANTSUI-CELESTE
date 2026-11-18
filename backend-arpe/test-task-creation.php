<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = \Illuminate\Http\Request::capture()
);

use App\Models\Task;
use App\Models\User;

// Get first user as creator
$creator = User::first();
echo "Creator: " . ($creator ? $creator->name . " (ID: " . $creator->id . ")" : 'null') . PHP_EOL;

// Get technicians
$technicians = User::where('role', 'technicien')->limit(2)->get();
echo "Technicians count: " . $technicians->count() . PHP_EOL;

// Create a test task
$task = Task::create([
    'title' => 'Test Task ' . now()->timestamp,
    'description' => 'Test task for email notifications',
    'status' => 'en cours',
    'createdBy' => $creator ? $creator->name : 'Unknown'
]);

if ($technicians->count() > 0) {
    $task->technicians()->attach($technicians->pluck('id')->toArray());
    echo "Attached " . $technicians->count() . " technicians" . PHP_EOL;
}

echo "Task created with ID: " . $task->id . PHP_EOL;
echo "Notifying all users..." . PHP_EOL;

// Reload technicians
$task = $task->fresh()->load('technicians');
$technicianNames = $task->technicians->pluck('name')->toArray();
$users = User::whereNotNull('email')->get();

echo "Technicians names: " . implode(', ', $technicianNames) . PHP_EOL;
echo "Users count: " . $users->count() . PHP_EOL;

if ($creator && !$users->isEmpty()) {
    \Illuminate\Support\Facades\Notification::send($users, new App\Notifications\TaskCreatedNotification(
        $task,
        $creator->name,
        $technicianNames
    ));
    echo "✓ Notifications sent successfully!" . PHP_EOL;
} else {
    echo "✗ ERROR: Could not send notifications" . PHP_EOL;
}

