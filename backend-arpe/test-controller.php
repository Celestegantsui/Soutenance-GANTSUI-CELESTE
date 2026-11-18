<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

echo "🚀 Test de performance du contrôleur\n";
echo "===================================\n";

$start = microtime(true);

// Créer le contrôleur et la requête
$controller = new \App\Http\Controllers\TaskController();
$request = new \Illuminate\Http\Request([
    'title' => 'Test Controller ' . time(),
    'description' => 'Test de performance',
    'status' => 'en cours',
    'technician_ids' => [2]
]);

// Simuler l'authentification
auth()->loginUsingId(1);

try {
    $response = $controller->store($request);
    $end = microtime(true);
    $duration = round(($end - $start) * 1000, 2);

    echo "⏱️  Temps total: {$duration}ms\n";
    echo "📊 Status: " . $response->getStatusCode() . "\n";

    $jobsCount = \Illuminate\Support\Facades\DB::table('jobs')->count();
    echo "📋 Jobs en queue: {$jobsCount}\n";

    if ($duration < 200) {
        echo "🚀 EXTRÊMEMENT RAPIDE !\n";
    } elseif ($duration < 1000) {
        echo "⚡ TRÈS RAPIDE !\n";
    } elseif ($duration < 5000) {
        echo "✅ Acceptable\n";
    } else {
        echo "🐌 Lent\n";
    }

} catch (\Exception $e) {
    $end = microtime(true);
    $duration = round(($end - $start) * 1000, 2);
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "⏱️  Temps avant erreur: {$duration}ms\n";
}