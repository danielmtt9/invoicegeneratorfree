<?php
declare(strict_types=1);

header('Content-Type: application/json');
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
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
if ($limit <= 0) $limit = 100;
if ($limit > 500) $limit = 500;

$sinceExpr = windowToSql($w);
$stmt = $pdo->prepare("SELECT ts, event, path, referrer, vid FROM events WHERE ts > ($sinceExpr) ORDER BY ts DESC LIMIT ?");
$stmt->bindValue(1, $limit, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll();

// Format time to ISO-like string.
$out = [];
foreach ($rows as $r) {
  $out[] = [
    'ts' => (string)$r['ts'],
    'event' => (string)$r['event'],
    'path' => (string)$r['path'],
    'referrer' => (string)$r['referrer'],
    'vid' => (string)$r['vid'],
  ];
}

echo json_encode($out);

