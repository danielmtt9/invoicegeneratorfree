<?php
declare(strict_types=1);

[$pdo, $cfg] = require __DIR__ . '/../api/_db.php';

function windowToSql(string $w): string {
  return match ($w) {
    '24h' => 'NOW() - INTERVAL 24 HOUR',
    '7d' => 'NOW() - INTERVAL 7 DAY',
    '30d' => 'NOW() - INTERVAL 30 DAY',
    default => 'NOW() - INTERVAL 24 HOUR',
  };
}

$w = isset($_GET['window']) ? (string)$_GET['window'] : '24h';
$sinceExpr = windowToSql($w);

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="events-' . $w . '.csv"');

$out = fopen('php://output', 'w');
fputcsv($out, ['ts', 'event', 'path', 'referrer', 'vid']);

$stmt = $pdo->query("SELECT ts, event, path, referrer, vid FROM events WHERE ts > ($sinceExpr) ORDER BY ts DESC LIMIT 5000");
foreach ($stmt as $r) {
  fputcsv($out, [(string)$r['ts'], (string)$r['event'], (string)$r['path'], (string)$r['referrer'], (string)$r['vid']]);
}
fclose($out);
exit;

