<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = \Illuminate\Http\Request::capture()
);

use App\Models\User;

$user = User::first();
$token = $user->createToken("api-test")->plainTextToken;

echo "Token for user {$user->name}: {$token}" . PHP_EOL;
