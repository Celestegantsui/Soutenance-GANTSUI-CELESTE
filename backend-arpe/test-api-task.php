<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

// Simuler une requête API pour créer une tâche
$requestData = [
    'title' => 'Test API Task ' . time(),
    'description' => 'Test rapide via API',
    'status' => 'en cours',
    'technician_ids' => [2, 3] // IDs des techniciens
];

echo "Testing API task creation...\n";
echo "Request data: " . json_encode($requestData) . "\n";

// Créer une requête HTTP simulée
$request = \Illuminate\Http\Request::create('/api/tasks', 'POST', $requestData);
$request->headers->set('Accept', 'application/json');

// Simuler l'authentification (utilisateur ID 1)
auth()->loginUsingId(1);

try {
    $response = $app->handle($request);
    $statusCode = $response->getStatusCode();
    $content = $response->getContent();

    echo "Status Code: $statusCode\n";
    echo "Response: $content\n";

    if ($statusCode === 201) {
        echo "✅ Task created successfully!\n";

        // Vérifier les jobs dans la queue
        $jobsCount = DB::table('jobs')->count();
        echo "Jobs in queue: $jobsCount\n";

        if ($jobsCount > 0) {
            echo "✅ Jobs created asynchronously!\n";
        } else {
            echo "❌ No jobs in queue\n";
        }
    } else {
        echo "❌ Task creation failed\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}