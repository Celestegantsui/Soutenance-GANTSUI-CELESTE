<?php

require_once __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "Utilisateurs dans la base de données:\n";
$users = User::all();
foreach ($users as $user) {
    echo $user->name . ' - ' . $user->email . "\n";
}

echo "\nTotal: " . $users->count() . " utilisateurs\n";