<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$config = [];
$configPath = __DIR__ . '/config.php';
if (is_file($configPath)) $config = require $configPath;

$allowedOrigins = $config['ALLOWED_ORIGINS'] ?? ['https://eremvole.cz'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
  http_response_code(403);
  echo json_encode(['error' => 'Origin not allowed'], JSON_UNESCAPED_UNICODE);
  exit;
}
if ($origin !== '') header('Access-Control-Allow-Origin: ' . $origin);

$apiAccessToken = (string)($config['API_ACCESS_TOKEN'] ?? '');
if ($apiAccessToken !== '') {
  $incomingToken = (string)($_SERVER['HTTP_X_API_TOKEN'] ?? '');
  if (!hash_equals($apiAccessToken, $incomingToken)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
    exit;
  }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
  exit;
}

$raw = file_get_contents('php://input');
$in = json_decode((string)$raw, true);
if (!is_array($in)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid JSON'], JSON_UNESCAPED_UNICODE);
  exit;
}

$action = (string)($in['action'] ?? 'run_due');
if ($action !== 'run_due') {
  http_response_code(400);
  echo json_encode(['error' => 'Unknown action'], JSON_UNESCAPED_UNICODE);
  exit;
}

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) @mkdir($dataDir, 0775, true);
$auditFile = $dataDir . '/audit-events.log';
function append_audit(string $file, array $event): void {
  @file_put_contents($file, json_encode($event, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
}

$queue = $in['queue'] ?? [];
if (!is_array($queue)) {
  http_response_code(400);
  echo json_encode(['error' => 'queue must be array'], JSON_UNESCAPED_UNICODE);
  exit;
}

$nowRaw = (string)($in['nowIso'] ?? '');
$now = $nowRaw !== '' ? strtotime($nowRaw) : time();
if ($now === false) $now = time();

$processed = 0;
$out = [];
foreach ($queue as $job) {
  if (!is_array($job)) continue;
  $status = (string)($job['status'] ?? 'queued');
  if ($status !== 'queued') {
    $out[] = $job;
    continue;
  }
  $atRaw = (string)($job['scheduleAt'] ?? $job['createdAt'] ?? gmdate('c'));
  $at = strtotime($atRaw);
  if ($at === false) $at = $now;
  if ($at <= $now) {
    $job['status'] = 'done';
    $job['updatedAt'] = gmdate('c');
    $processed++;
  }
  $out[] = $job;
}

append_audit($auditFile, [
  'ts' => gmdate('c'),
  'service' => 'scheduler',
  'action' => 'run_due',
  'projectId' => (string)($in['projectId'] ?? ''),
  'processed' => $processed,
  'total' => count($out)
]);

echo json_encode([
  'ok' => true,
  'processed' => $processed,
  'total' => count($out),
  'queue' => $out,
  'executedAt' => gmdate('c')
], JSON_UNESCAPED_UNICODE);
