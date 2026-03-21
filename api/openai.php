<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$config = [];
$configPath = __DIR__ . '/config.php';
if (is_file($configPath)) {
  $config = require $configPath;
}
$allowedOrigins = $config['ALLOWED_ORIGINS'] ?? ['https://eremvole.cz'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
  http_response_code(403);
  echo json_encode(['error' => 'Origin not allowed']);
  exit;
}
if ($origin !== '') {
  header('Access-Control-Allow-Origin: ' . $origin);
}

$apiAccessToken = (string)($config['API_ACCESS_TOKEN'] ?? '');
if ($apiAccessToken !== '') {
  $incomingToken = (string)($_SERVER['HTTP_X_API_TOKEN'] ?? '');
  if (!hash_equals($apiAccessToken, $incomingToken)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
  }
}

$rateLimitPerMin = (int)($config['RATE_LIMIT_PER_MIN'] ?? 60);
if ($rateLimitPerMin > 0) {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  $bucket = date('YmdHi');
  $f = sys_get_temp_dir() . '/eremstudio_rate_' . md5($ip . '_' . $bucket) . '.txt';
  $count = 0;
  if (is_file($f)) {
    $count = (int)@file_get_contents($f);
  }
  $count++;
  @file_put_contents($f, (string)$count);
  if ($count > $rateLimitPerMin) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit;
  }
}

$apiKey = getenv('OPENAI_API_KEY') ?: ($config['OPENAI_API_KEY'] ?? '');
$isPlaceholder = (substr((string)$apiKey, 0, 13) === 'sk-REPLACE_ME');
if (!$apiKey || $isPlaceholder) {
  http_response_code(500);
  echo json_encode(['error' => 'Missing OPENAI_API_KEY in api/config.php or env']);
  exit;
}

$raw = file_get_contents('php://input');
$in = json_decode($raw, true);
if (!is_array($in)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid JSON']);
  exit;
}

$taskType = (string)($in['taskType'] ?? 'titles');
$prompt = trim((string)($in['prompt'] ?? ''));
$temperature = isset($in['temperature']) ? (float)$in['temperature'] : 0.7;

if ($prompt === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Missing prompt']);
  exit;
}

$modelByTask = [
  'titles' => $config['OPENAI_MODEL_TITLES'] ?? 'gpt-4.1',
  'descriptions' => $config['OPENAI_MODEL_DESCRIPTIONS'] ?? 'gpt-4.1-mini',
  'growth' => $config['OPENAI_MODEL_GROWTH'] ?? 'gpt-4.1',
];
$model = $modelByTask[$taskType] ?? ($config['OPENAI_MODEL_DEFAULT'] ?? 'gpt-4.1');

$payload = [
  'model' => $model,
  'temperature' => $temperature,
  'messages' => [
    ['role' => 'system', 'content' => 'Return valid JSON only. No markdown fences.'],
    ['role' => 'user', 'content' => $prompt],
  ],
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey,
  ],
  CURLOPT_POSTFIELDS => json_encode($payload),
  CURLOPT_TIMEOUT => 60,
]);

$out = curl_exec($ch);
$err = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($out === false) {
  http_response_code(502);
  echo json_encode(['error' => 'OpenAI request failed', 'details' => $err]);
  exit;
}

$decoded = json_decode($out, true);
if (!is_array($decoded)) {
  http_response_code(502);
  echo json_encode(['error' => 'Invalid OpenAI response', 'raw' => $out]);
  exit;
}

if ($code >= 400) {
  http_response_code($code);
  echo json_encode(['error' => 'OpenAI API error', 'response' => $decoded]);
  exit;
}

$text = $decoded['choices'][0]['message']['content'] ?? '';
$payload = json_decode($text, true);
if (!is_array($payload)) {
  http_response_code(502);
  echo json_encode(['error' => 'Model did not return valid JSON', 'text' => $text]);
  exit;
}

if ($taskType === 'titles') {
  $isList = array_keys($payload) === range(0, count($payload) - 1);
  if (!$isList) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid titles payload']);
    exit;
  }
  $normalized = [];
  foreach ($payload as $row) {
    if (!is_array($row) || !isset($row['title'])) continue;
    $normalized[] = [
      'title' => (string)$row['title'],
      'category' => (string)($row['category'] ?? 'Curiosity Gap'),
      'score' => max(1, min(100, (int)($row['score'] ?? 70))),
    ];
  }
  $payload = $normalized;
}
if ($taskType === 'descriptions') {
  $payload = [
    'youtube_description' => (string)($payload['youtube_description'] ?? ''),
    'spotify_html' => (string)($payload['spotify_html'] ?? ''),
  ];
}
if ($taskType === 'growth') {
  $clips = [];
  if (isset($payload['clips']) && is_array($payload['clips'])) {
    foreach ($payload['clips'] as $c) {
      if (!is_array($c)) continue;
      $clips[] = [
        'start' => (string)($c['start'] ?? '00:00'),
        'hook' => (string)($c['hook'] ?? ''),
        'reason' => (string)($c['reason'] ?? ''),
      ];
    }
  }
  $payload = [
    'clips' => $clips,
    'retention_tip' => (string)($payload['retention_tip'] ?? ''),
  ];
}

echo json_encode([
  'ok' => true,
  'taskType' => $taskType,
  'model' => $model,
  'payload' => $payload,
]);
