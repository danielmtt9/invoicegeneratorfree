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
$sinceExpr = windowToSql($w);

$total = (int)($pdo->query("SELECT COUNT(*) AS c FROM events WHERE ts > ($sinceExpr)")->fetch()['c'] ?? 0);
$pageViews = (int)($pdo->query("SELECT COUNT(*) AS c FROM events WHERE event = 'page_view' AND ts > ($sinceExpr)")->fetch()['c'] ?? 0);
$uniques = (int)($pdo->query("SELECT COUNT(DISTINCT vid) AS c FROM events WHERE ts > ($sinceExpr)")->fetch()['c'] ?? 0);

$topPagesStmt = $pdo->query("SELECT path, COUNT(*) AS c FROM events WHERE event = 'page_view' AND ts > ($sinceExpr) GROUP BY path ORDER BY c DESC LIMIT 20");
$topPages = [];
foreach ($topPagesStmt as $row) $topPages[] = ['path' => (string)$row['path'], 'count' => (int)$row['c']];

$topRefStmt = $pdo->query("SELECT referrer, COUNT(*) AS c FROM events WHERE event = 'page_view' AND ts > ($sinceExpr) GROUP BY referrer ORDER BY c DESC LIMIT 20");
$topRef = [];
foreach ($topRefStmt as $row) $topRef[] = ['referrer' => (string)$row['referrer'], 'count' => (int)$row['c']];

echo json_encode([
  'window' => $w,
  'total_events' => $total,
  'page_views' => $pageViews,
  'unique_visitors' => $uniques,
  'top_pages' => $topPages,
  'top_referrers' => $topRef,
]);

