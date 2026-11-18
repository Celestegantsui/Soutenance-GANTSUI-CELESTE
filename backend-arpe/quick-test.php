<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

echo "🚀 Test de performance rapide\n";
echo "============================\n";

$start = microtime(true);

// Créer une tâche
$task = \App\Models\Task::create([
    'title' => 'Performance Test ' . time(),
    'description' => 'Test rapide',
    'status' => 'en cours',
    'createdBy' => 'Test'
]);

// Dispatcher le job
\App\Jobs\SendTaskNotifications::dispatch($task, 1);

$end = microtime(true);
$duration = round(($end - $start) * 1000, 2);

echo "⏱️  Temps: {$duration}ms\n";
echo "📋 Jobs en queue: " . \Illuminate\Support\Facades\DB::table('jobs')->count() . "\n";

if ($duration < 100) {
    echo "🚀 EXTRÊMEMENT RAPIDE !\n";
} elseif ($duration < 500) {
    echo "⚡ TRÈS RAPIDE !\n";
} else {
    echo "🐌 Lent\n";
}