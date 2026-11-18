<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

echo "🧪 Test de notifications temps réel\n";
echo "=================================\n";

$before = \App\Models\Notification::count();
echo "📊 Notifications avant: {$before}\n";

$task = \App\Models\Task::create([
    'title' => 'Test Real Time ' . time(),
    'description' => 'Test de notifications temps réel',
    'status' => 'en cours',
    'createdBy' => 'Test'
]);

echo "✅ Tâche créée (ID: {$task->id})\n";

// Dispatcher le job
\App\Jobs\SendTaskNotifications::dispatch($task, 1);
echo "📤 Job envoyé\n";

// Attendre un peu pour que le job soit traité
sleep(3);

$after = \App\Models\Notification::count();
$added = $after - $before;

echo "📊 Notifications après: {$after}\n";
echo "➕ Notifications ajoutées: {$added}\n";

if ($added > 0) {
    echo "✅ SUCCÈS: Les notifications sont créées en temps réel!\n";

    // Vérifier les dernières notifications
    $latest = \App\Models\Notification::latest()->first();
    echo "🔔 Dernière notification: {$latest->title}\n";
} else {
    echo "❌ ÉCHEC: Aucune notification créée\n";
}