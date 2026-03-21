<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
  exit;
}

$limit = (int)($_GET['limit'] ?? 80);
$limit = max(1, min(500, $limit));
$file = __DIR__ . '/data/audit-events.log';
if (!is_file($file)) {
  echo json_encode(['ok' => true, 'items' => []], JSON_UNESCAPED_UNICODE);
  exit;
}

$raw = @file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if (!is_array($raw)) $raw = [];
$rows = [];
foreach (array_reverse($raw) as $line) {
  $row = json_decode((string)$line, true);
  if (is_array($row)) $rows[] = $row;
  if (count($rows) >= $limit) break;
}

echo json_encode(['ok' => true, 'items' => $rows], JSON_UNESCAPED_UNICODE);
