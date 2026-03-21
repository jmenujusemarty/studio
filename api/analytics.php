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

$action = (string)($in['action'] ?? 'snapshot');
if ($action !== 'snapshot') {
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

$range = (string)($in['range'] ?? '30d');
$hist = $in['generationHistory'] ?? [];
if (!is_array($hist)) $hist = [];
$titles = isset($hist['titles']) && is_array($hist['titles']) ? $hist['titles'] : [];
$descs = isset($hist['descriptions']) && is_array($hist['descriptions']) ? $hist['descriptions'] : [];
$clips = isset($hist['clips']) && is_array($hist['clips']) ? $hist['clips'] : [];

$titleUses = count($titles);
$descUses = count($descs);
$clipUses = count($clips);
$totalOps = $titleUses + $descUses + $clipUses;

$avgTitleScore = 0.0;
if ($titleUses > 0) {
  $sum = 0.0;
  $count = 0;
  foreach ($titles as $row) {
    $items = $row['payload']['items'] ?? [];
    if (!is_array($items)) continue;
    foreach ($items as $it) {
      $score = (float)($it['score'] ?? 0);
      if ($score <= 0) continue;
      $sum += $score;
      $count++;
    }
  }
  if ($count > 0) $avgTitleScore = $sum / $count;
}

$ctr = max(1.0, min(25.0, 4.0 + ($avgTitleScore / 12.0) + ($titleUses * 0.05)));
$retention = max(10.0, min(80.0, 28.0 + ($clipUses * 0.8) + ($descUses * 0.25)));

$series = [];
$days = $range === '7d' ? 7 : ($range === '90d' ? 12 : 10);
for ($i = $days - 1; $i >= 0; $i--) {
  $factor = ($days - $i) / max(1, $days);
  $series[] = [
    'label' => gmdate('Y-m-d', time() - ($i * 86400)),
    'ctr' => round(max(1.0, min(25.0, $ctr - 1 + $factor * 2)), 2),
    'retention' => round(max(10.0, min(80.0, $retention - 3 + $factor * 4)), 2)
  ];
}

append_audit($auditFile, [
  'ts' => gmdate('c'),
  'service' => 'analytics',
  'action' => 'snapshot',
  'projectId' => (string)($in['projectId'] ?? ''),
  'range' => $range,
  'total_generations' => $totalOps
]);

echo json_encode([
  'ok' => true,
  'kpi' => [
    'range' => $range,
    'total_generations' => $totalOps,
    'avg_title_score' => round($avgTitleScore, 2),
    'estimated_ctr' => round($ctr, 2),
    'estimated_retention' => round($retention, 2)
  ],
  'series' => $series,
  'source' => 'analytics-proxy-v1'
], JSON_UNESCAPED_UNICODE);
