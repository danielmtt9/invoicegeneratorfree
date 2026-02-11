<?php
declare(strict_types=1);

header('Content-Type: application/json');
[$pdo, $cfg] = require __DIR__ . '/../api/_db.php';

// Protected by Basic Auth via .htaccess. Optional query param run=1 to confirm.
if (!isset($_GET['run']) || (string)$_GET['run'] !== '1') {
  echo json_encode(['ok' => true, 'hint' => 'add ?run=1 to execute cleanup']);
  exit;
}

$stmt = $pdo->prepare("DELETE FROM events WHERE ts < (NOW() - INTERVAL 90 DAY)");
$stmt->execute();

echo json_encode(['deleted' => $stmt->rowCount()]);

