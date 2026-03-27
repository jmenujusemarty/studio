<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) @mkdir($dataDir, 0775, true);
$storeFile = $dataDir . '/queues.json';
$auditFile = $dataDir . '/audit-events.log';

function append_audit(string $file, array $event): void {
  @file_put_contents($file, json_encode($event, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
}
function read_store(string $file): array {
  if (!is_file($file)) return ['updatedAt' => gmdate('c'), 'projects' => []];
  $raw = @file_get_contents($file);
  if (!is_string($raw) || $raw === '') return ['updatedAt' => gmdate('c'), 'projects' => []];
  $parsed = json_decode($raw, true);
  if (!is_array($parsed)) return ['updatedAt' => gmdate('c'), 'projects' => []];
  if (!isset($parsed['projects']) || !is_array($parsed['projects'])) $parsed['projects'] = [];
  return $parsed;
}
function write_store(string $file, array $payload): bool {
  $payload['updatedAt'] = gmdate('c');
  return @file_put_contents($file, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX) !== false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $projectId = trim((string)($_GET['projectId'] ?? ''));
  if ($projectId === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing projectId'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $store = read_store($storeFile);
  $queue = $store['projects'][$projectId] ?? [];
  echo json_encode(['ok' => true, 'projectId' => $projectId, 'queue' => $queue], JSON_UNESCAPED_UNICODE);
  exit;
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

$projectId = trim((string)($in['projectId'] ?? ''));
if ($projectId === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Missing projectId'], JSON_UNESCAPED_UNICODE);
  exit;
}

$action = (string)($in['action'] ?? 'enqueue');
$store = read_store($storeFile);
$queue = $store['projects'][$projectId] ?? [];
if (!is_array($queue)) $queue = [];

if ($action === 'enqueue') {
  $payload = $in['payload'] ?? null;
  if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing payload'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $job = [
    'id' => 'job-' . base_convert((string)time(), 10, 36) . '-' . substr(md5((string)microtime(true)), 0, 4),
    'createdAt' => gmdate('c'),
    'scheduleAt' => (string)($in['scheduleAt'] ?? gmdate('c')),
    'status' => 'queued',
    'retryCount' => 0,
    'payload' => $payload
  ];
  $queue[] = $job;
  $store['projects'][$projectId] = $queue;
  if (!write_store($storeFile, $store)) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to persist queue'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  append_audit($auditFile, ['ts'=>gmdate('c'),'service'=>'queue','action'=>'enqueue','projectId'=>$projectId,'jobId'=>$job['id']]);
  echo json_encode(['ok' => true, 'projectId' => $projectId, 'job' => $job, 'queue' => $queue], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($action === 'update_status') {
  $jobId = trim((string)($in['jobId'] ?? ''));
  $status = (string)($in['status'] ?? 'queued');
  if ($jobId === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing jobId'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $allowed = ['queued','running','done','failed','canceled'];
  if (!in_array($status, $allowed, true)) $status = 'queued';

  foreach ($queue as &$job) {
    if (!is_array($job)) continue;
    if ((string)($job['id'] ?? '') !== $jobId) continue;
    $job['status'] = $status;
    $job['updatedAt'] = gmdate('c');
    break;
  }
  unset($job);

  $store['projects'][$projectId] = $queue;
  if (!write_store($storeFile, $store)) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to persist queue'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  append_audit($auditFile, ['ts'=>gmdate('c'),'service'=>'queue','action'=>'update_status','projectId'=>$projectId,'jobId'=>$jobId,'status'=>$status]);
  echo json_encode(['ok' => true, 'projectId' => $projectId, 'queue' => $queue], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($action === 'retry') {
  $jobId = trim((string)($in['jobId'] ?? ''));
  $scheduleAt = (string)($in['scheduleAt'] ?? gmdate('c'));
  if ($jobId === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing jobId'], JSON_UNESCAPED_UNICODE);
    exit;
  }

  foreach ($queue as &$job) {
    if (!is_array($job)) continue;
    if ((string)($job['id'] ?? '') !== $jobId) continue;
    $job['status'] = 'queued';
    $job['scheduleAt'] = $scheduleAt;
    $job['retryCount'] = (int)($job['retryCount'] ?? 0) + 1;
    $job['updatedAt'] = gmdate('c');
    break;
  }
  unset($job);

  $store['projects'][$projectId] = $queue;
  if (!write_store($storeFile, $store)) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to persist queue'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  append_audit($auditFile, ['ts'=>gmdate('c'),'service'=>'queue','action'=>'retry','projectId'=>$projectId,'jobId'=>$jobId,'scheduleAt'=>$scheduleAt]);
  echo json_encode(['ok' => true, 'projectId' => $projectId, 'queue' => $queue], JSON_UNESCAPED_UNICODE);
  exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action'], JSON_UNESCAPED_UNICODE);
