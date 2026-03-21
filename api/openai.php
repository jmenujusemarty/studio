<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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

$apiKey = getenv('OPENAI_API_KEY') ?: ($config['OPENAI_API_KEY'] ?? '');
if (!$apiKey || str_starts_with($apiKey, 'sk-REPLACE_ME')) {
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
echo json_encode([
  'ok' => true,
  'taskType' => $taskType,
  'model' => $model,
  'text' => $text,
]);
