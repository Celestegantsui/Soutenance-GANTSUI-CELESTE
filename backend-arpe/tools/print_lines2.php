<?php
$path = __DIR__ . '/../app/Http/Controllers/TaskController.php';
$lines = file($path);
for ($i = 478; $i <= 520; $i++) {
    if (isset($lines[$i])) {
        echo ($i + 1) . ': ' . rtrim($lines[$i]) . PHP_EOL;
    }
}
