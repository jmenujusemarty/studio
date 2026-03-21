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
$storeFile = $dataDir . '/projects.json';

function read_store(string $file): array {
  if (!is_file($file)) return ['updatedAt' => gmdate('c'), 'projects' => []];
  $raw = @file_get_contents($file);
  if (!is_string($raw) || $raw === '') return ['updatedAt' => gmdate('c'), 'projects' => []];
  $parsed = json_decode($raw, true);
  if (!is_array($parsed)) return ['updatedAt' => gmdate('c'), 'projects' => []];
  if (!isset($parsed['projects']) || !is_array($parsed['projects'])) $parsed['projects'] = [];
  if (!isset($parsed['updatedAt'])) $parsed['updatedAt'] = gmdate('c');
  return $parsed;
}

function write_store(string $file, array $payload): bool {
  $payload['updatedAt'] = gmdate('c');
  return @file_put_contents($file, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX) !== false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $store = read_store($storeFile);
  $id = trim((string)($_GET['id'] ?? ''));
  if ($id !== '') {
    if (!isset($store['projects'][$id])) {
      http_response_code(404);
      echo json_encode(['error' => 'Project not found'], JSON_UNESCAPED_UNICODE);
      exit;
    }
    echo json_encode(['ok' => true, 'project' => $store['projects'][$id]], JSON_UNESCAPED_UNICODE);
    exit;
  }
  echo json_encode(['ok' => true, 'updatedAt' => $store['updatedAt'], 'projects' => array_values($store['projects'])], JSON_UNESCAPED_UNICODE);
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

$action = (string)($in['action'] ?? 'upsert');
$store = read_store($storeFile);

if ($action === 'upsert') {
  $project = $in['project'] ?? null;
  if (!is_array($project)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing project'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $id = trim((string)($project['_projectId'] ?? $project['id'] ?? ''));
  if ($id === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing project id'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $project['_projectId'] = $id;
  $store['projects'][$id] = $project;
  if (!write_store($storeFile, $store)) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to persist project'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  echo json_encode(['ok' => true, 'id' => $id], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($action === 'delete') {
  $id = trim((string)($in['id'] ?? ''));
  if ($id === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing id'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  unset($store['projects'][$id]);
  if (!write_store($storeFile, $store)) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to persist deletion'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  echo json_encode(['ok' => true, 'id' => $id], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($action === 'replace_all') {
  $projects = $in['projects'] ?? [];
  if (!is_array($projects)) {
    http_response_code(400);
    echo json_encode(['error' => 'projects must be array'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $next = [];
  foreach ($projects as $project) {
    if (!is_array($project)) continue;
    $id = trim((string)($project['_projectId'] ?? $project['id'] ?? ''));
    if ($id === '') continue;
    $project['_projectId'] = $id;
    $next[$id] = $project;
  }
  $store['projects'] = $next;
  if (!write_store($storeFile, $store)) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to persist projects'], JSON_UNESCAPED_UNICODE);
    exit;
  }
  echo json_encode(['ok' => true, 'count' => count($next)], JSON_UNESCAPED_UNICODE);
  exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action'], JSON_UNESCAPED_UNICODE);
