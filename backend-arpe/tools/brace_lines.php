<?php
$path = __DIR__ . '/../app/Http/Controllers/HistoryController.php';
$lines = file($path);
$balance = 0;
foreach ($lines as $index => $line) {
    $open = substr_count($line, '{');
    $close = substr_count($line, '}');
    $balance += $open - $close;
    echo ($index + 1) . ": open={$open} close={$close} balance={$balance} line=" . trim($line) . PHP_EOL;
}
