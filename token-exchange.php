<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Sadece POST']);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$code = $data['code'] ?? null;
$codeVerifier = $data['code_verifier'] ?? null;

if (!$code || !$codeVerifier) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'code ve code_verifier gerekli']);
    exit;
}

$CLIENT_ID = KICK_CLIENT_ID;
$CLIENT_SECRET = KICK_CLIENT_SECRET;
$REDIRECT_URI = KICK_REDIRECT_URI;

$postData = http_build_query([
    'grant_type' => 'authorization_code',
    'client_id' => $CLIENT_ID,
    'client_secret' => $CLIENT_SECRET,
    'redirect_uri' => $REDIRECT_URI,
    'code' => $code,
    'code_verifier' => $codeVerifier
]);

$ch = curl_init('https://id.kick.com/oauth/token');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $postData,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode([
        'success' => false,
        'error' => 'Token exchange başarısız',
        'http_code' => $httpCode,
        'response' => json_decode($response, true)
    ]);
    exit;
}

$tokenData = json_decode($response, true);

if (!isset($tokenData['access_token'])) {
    echo json_encode(['success' => false, 'error' => 'Token alınamadı']);
    exit;
}

echo json_encode([
    'success' => true,
    'access_token' => $tokenData['access_token'],
    'refresh_token' => $tokenData['refresh_token'] ?? null,
    'expires_in' => $tokenData['expires_in'] ?? 3600
]);
