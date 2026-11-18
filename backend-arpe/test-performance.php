<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

// Test rapide de performance
echo "🚀 Test de performance - Création de tâche\n";
echo "=======================================\n";

$startTime = microtime(true);

// Simuler une requête API
$requestData = [
    'title' => 'Performance Test Task ' . time(),
    'description' => 'Test de performance API',
    'status' => 'en cours',
    'technician_ids' => [2, 3]
];

$request = \Illuminate\Http\Request::create('/api/tasks', 'POST', $requestData);
$request->headers->set('Accept', 'application/json');
$request->headers->set('Content-Type', 'application/json');

// Simuler un token d'authentification (nécessaire pour Sanctum)
$user = \App\Models\User::find(1);
$token = $user->createToken('test-token')->plainTextToken;
$request->headers->set('Authorization', 'Bearer ' . $token);

try {
    $response = $app->handle($request);
    $statusCode = $response->getStatusCode();
    $content = json_decode($response->getContent(), true);

    $endTime = microtime(true);
    $duration = round(($endTime - $startTime) * 1000, 2); // en millisecondes

    echo "⏱️  Temps de réponse: {$duration}ms\n";
    echo "📊 Status Code: {$statusCode}\n";

    if ($statusCode === 201 && isset($content['id'])) {
        echo "✅ Tâche créée avec succès (ID: {$content['id']})\n";

        // Vérifier les jobs
        $jobsCount = \Illuminate\Support\Facades\DB::table('jobs')->count();
        echo "📋 Jobs en queue: {$jobsCount}\n";

        if ($jobsCount > 0) {
            echo "✅ Notifications envoyées de manière ASYNCHRONE\n";
            echo "🎉 PERFORMANCE AMÉLIORÉE !\n";
        } else {
            echo "❌ Aucun job en queue\n";
        }

        if ($duration < 1000) { // Moins d'1 seconde
            echo "🚀 TRÈS RAPIDE !\n";
        } elseif ($duration < 5000) { // Moins de 5 secondes
            echo "⚡ RAPIDE !\n";
        } else {
            echo "🐌 Encore lent...\n";
        }

    } else {
        echo "❌ Échec de création: " . ($content['message'] ?? 'Erreur inconnue') . "\n";
    }

} catch (\Exception $e) {
    $endTime = microtime(true);
    $duration = round(($endTime - $startTime) * 1000, 2);
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "⏱️  Temps avant erreur: {$duration}ms\n";
}