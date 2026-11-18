<?php
$path = __DIR__ . '/../app/Http/Controllers/HistoryController.php';
$code = file_get_contents($path);
$balance = 0;
$line = 1;
foreach (str_split($code) as $c) {
    if ($c === "\n") {
        $line++;
    }
    if ($c === '{') {
        $balance++;
    }
    if ($c === '}') {
        $balance--;
    }
}
echo "balance={$balance}\n";
