<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$geo = strtoupper(trim((string)($_GET['geo'] ?? 'CZ')));
if (!preg_match('/^[A-Z]{2}$/', $geo)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid geo'], JSON_UNESCAPED_UNICODE);
  exit;
}

$url = 'https://trends.google.com/trending/rss?geo=' . rawurlencode($geo);
$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 12,
  CURLOPT_CONNECTTIMEOUT => 5,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_USERAGENT => 'eremstudio-trends-proxy/1.0',
]);
$xmlRaw = curl_exec($ch);
$err = curl_error($ch);
$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($xmlRaw === false || $code >= 400) {
  http_response_code(502);
  echo json_encode(['error' => 'Trend source unavailable', 'details' => $err ?: ('HTTP ' . $code)], JSON_UNESCAPED_UNICODE);
  exit;
}

libxml_use_internal_errors(true);
$xml = simplexml_load_string($xmlRaw);
if (!$xml || !isset($xml->channel->item)) {
  http_response_code(502);
  echo json_encode(['error' => 'Invalid RSS response'], JSON_UNESCAPED_UNICODE);
  exit;
}

$items = [];
foreach ($xml->channel->item as $item) {
  $title = trim((string)$item->title);
  if ($title !== '') $items[] = $title;
  if (count($items) >= 25) break;
}

echo json_encode([
  'geo' => $geo,
  'fetched_at' => gmdate('c'),
  'items' => $items
], JSON_UNESCAPED_UNICODE);
