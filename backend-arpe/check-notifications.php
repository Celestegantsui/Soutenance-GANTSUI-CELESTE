<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = \Illuminate\Http\Request::capture()
);

use App\Models\Notification;

echo "Notifications count: " . Notification::count() . PHP_EOL;
echo "Last 3 notifications:" . PHP_EOL;
Notification::latest()->limit(3)->get()->each(function($n) {
    echo "- ID: {$n->id}, User: {$n->user->name}, Title: {$n->title}, Is Read: " . ($n->is_read ? "Yes" : "No") . PHP_EOL;
});
