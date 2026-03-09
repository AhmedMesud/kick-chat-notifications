<?php
/**
 * Kick Events Subscription
 * Kick API'ye events subscribe isteği gönderir
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
$channelId = $data['channel_id'] ?? null;

if (!$token || !$channelId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token ve kanal ID gerekli']);
    exit;
}

// Events subscription oluştur
// Kick API endpoint: /public/v1/events/subscriptions
$subscribeUrl = 'https://api.kick.com/public/v1/events/subscriptions';
$subscribeData = [
    'broadcaster_user_id' => (int)$channelId,
    'events' => [
        [
            'name' => 'chat.message.sent',
            'version' => 1
        ]
    ],
    'method' => 'webhook'
];

$ch = curl_init($subscribeUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($subscribeData),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json'
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$responseData = json_decode($response, true);

if ($httpCode === 200 || $httpCode === 201) {
    echo json_encode([
        'success' => true,
        'subscription' => $responseData,
        'channel_id' => $channelId
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Subscription başarısız',
        'http_code' => $httpCode,
        'response' => $responseData
    ]);
}
