<?php
declare(strict_types=1);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'method_not_allowed']);
  exit;
}

// Basic origin/referrer check (best effort). If you deploy on a different domain, update SITE_HOST in _config.php.
[$pdo, $cfg] = require __DIR__ . '/_db.php';

function hostAllowlist(array $cfg): array {
  // Back-compat: support a single SITE_HOST (string) or SITE_HOSTS (array).
  $hosts = [];
  if (isset($cfg['SITE_HOSTS']) && is_array($cfg['SITE_HOSTS'])) {
    $hosts = $cfg['SITE_HOSTS'];
  } elseif (isset($cfg['SITE_HOST']) && is_string($cfg['SITE_HOST'])) {
    $hosts = [$cfg['SITE_HOST']];
  }
  $out = [];
  foreach ($hosts as $h) {
    if (!is_string($h)) continue;
    $h = strtolower(trim($h));
    if ($h === '') continue;
    $out[] = $h;
  }
  return array_values(array_unique($out));
}

$siteHosts = hostAllowlist($cfg);

function hostFromUrl(?string $url): string {
  if (!$url) return '';
  $parts = parse_url($url);
  return is_array($parts) && isset($parts['host']) ? strtolower((string)$parts['host']) : '';
}

$originHost = hostFromUrl($_SERVER['HTTP_ORIGIN'] ?? null);
$refHost = hostFromUrl($_SERVER['HTTP_REFERER'] ?? null);
if ($originHost && $siteHosts && !in_array($originHost, $siteHosts, true)) {
  http_response_code(403);
  echo json_encode(['error' => 'bad_origin']);
  exit;
}
if (!$originHost && $refHost && $siteHosts && !in_array($refHost, $siteHosts, true)) {
  http_response_code(403);
  echo json_encode(['error' => 'bad_referrer']);
  exit;
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid_json']);
  exit;
}

$event = isset($data['event']) ? (string)$data['event'] : '';
$allowed = ['page_view', 'invoice_pdf_download'];
if (!in_array($event, $allowed, true)) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid_event']);
  exit;
}

$path = isset($data['path']) ? (string)$data['path'] : '';
$referrer = isset($data['referrer']) ? (string)$data['referrer'] : '';
$vid = isset($data['vid']) ? (string)$data['vid'] : '';
$meta = isset($data['meta']) ? $data['meta'] : null;

function clampStr(string $s, int $max): string {
  if (strlen($s) <= $max) return $s;
  return substr($s, 0, $max);
}

$path = clampStr($path, (int)$cfg['PATH_MAX_LEN']);
$referrer = clampStr($referrer, (int)$cfg['REF_MAX_LEN']);
$vid = clampStr($vid, (int)$cfg['VID_MAX_LEN']);
if ($vid === '' || strlen($vid) < 12) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid_vid']);
  exit;
}

$ua = clampStr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), (int)$cfg['UA_MAX_LEN']);

// Hash IP to avoid storing raw IP.
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
$ipHash = $ip ? hash('sha256', (string)$cfg['IP_HASH_SALT'] . '|' . $ip) : null;

// Lightweight bot filter: skip obvious bots.
$uaLower = strtolower($ua);
$botMarkers = ['bot', 'crawler', 'spider', 'headless'];
foreach ($botMarkers as $m) {
  if ($uaLower && strpos($uaLower, $m) !== false) {
    http_response_code(204);
    exit;
  }
}

// Rate limit per IP hash per minute using events table (simple, cheap win).
if ($ipHash) {
  $stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM events WHERE ip_hash = ? AND ts > (NOW() - INTERVAL 60 SECOND)');
  $stmt->execute([$ipHash]);
  $c = (int)($stmt->fetch()['c'] ?? 0);
  if ($c >= (int)$cfg['RATE_LIMIT_MAX_PER_MIN']) {
    http_response_code(429);
    echo json_encode(['error' => 'rate_limited']);
    exit;
  }
}

$metaJson = '';
if ($meta !== null) {
  $metaJson = json_encode($meta);
  if ($metaJson === false) $metaJson = '';
  $metaJson = clampStr($metaJson, (int)$cfg['META_MAX_LEN']);
}

$stmt = $pdo->prepare('INSERT INTO events (vid, event, path, referrer, ua, ip_hash, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([$vid, $event, $path, $referrer, $ua, $ipHash, $metaJson]);

http_response_code(204);
exit;
