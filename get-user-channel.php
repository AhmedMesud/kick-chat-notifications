<?php
/**
 * Kick Kullanıcı Kanal Bilgisi
 * OAuth token ile kendi kanal bilgisini alır
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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

$token = $data['token'] ?? null;

if (!$token) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token gerekli']);
    exit;
}

// 1. Kullanıcı bilgisini al
$userUrl = 'https://api.kick.com/public/v1/users';
$ch = curl_init($userUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]
]);
$userResponse = curl_exec($ch);
$userHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($userHttpCode !== 200) {
    echo json_encode([
        'success' => false,
        'error' => 'Kullanıcı bilgisi alınamadı',
        'http_code' => $userHttpCode,
        'response' => json_decode($userResponse, true)
    ]);
    exit;
}

$userData = json_decode($userResponse, true);
$userId = $userData['data'][0]['user_id'] ?? null;
$username = $userData['data'][0]['name'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'error' => 'Kullanıcı ID bulunamadı']);
    exit;
}

// 2. Kullanıcının kanal bilgisini al
$channelUrl = 'https://api.kick.com/public/v1/channels?user_id=' . urlencode($userId);
$ch = curl_init($channelUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]
]);
$channelResponse = curl_exec($ch);
$channelHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($channelHttpCode !== 200) {
    echo json_encode([
        'success' => false,
        'error' => 'Kanal bilgisi alınamadı',
        'http_code' => $channelHttpCode,
        'response' => json_decode($channelResponse, true)
    ]);
    exit;
}

$channelData = json_decode($channelResponse, true);
$channelSlug = $channelData['data'][0]['slug'] ?? null;

// Kick API'de 'channel_id' yerine 'broadcaster_user_id' geliyor
// Bu değer subscription için kullanılabilir
$channelId = $channelData['data'][0]['broadcaster_user_id'] ?? null;

echo json_encode([
    'success' => true,
    'username' => $username,
    'channel_slug' => $channelSlug,
    'channel_id' => $channelId,
    'user_id' => $userId
]);
