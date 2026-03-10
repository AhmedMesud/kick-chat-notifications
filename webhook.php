<?php
/**
 * Kick Events Webhook Endpoint
 * Kick buraya chat mesajlarını POST eder
 */

// Gelen veriyi al
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$timestamp = date('Y-m-d H:i:s');

// Event tipini kontrol et
$eventType = $_SERVER['HTTP_KICK_EVENT_TYPE'] ?? 'unknown';

// Sadece chat mesajlarını işle
if ($eventType === 'chat.message.sent') {
    $sender = $data['sender']['username'] ?? 'Bilinmeyen';
    $content = $data['content'] ?? '';
    $messageId = $data['message_id'] ?? 'N/A';
    $broadcasterId = $data['broadcaster']['user_id'] ?? null;
    $broadcasterSlug = $data['broadcaster']['channel_slug'] ?? 'unknown';
    $emotes = $data['emotes'] ?? [];
    
    // Dosya adını oluştur: sound_trigger_{ID}_{slug}.txt
    $fileSuffix = $broadcasterId ? '_' . $broadcasterId . '_' . $broadcasterSlug : '';
    $soundTriggerFile = __DIR__ . '/sound_trigger' . $fileSuffix . '.txt';
    
    $triggerData = json_encode([
        'timestamp' => $timestamp,
        'username' => $sender,
        'message' => substr($content, 0, 100),
        'message_id' => $messageId,
        'event_time' => time(),
        'broadcaster_id' => $broadcasterId,
        'broadcaster_slug' => $broadcasterSlug,
        'emotes' => $emotes
    ]);
    
    @file_put_contents($soundTriggerFile, $triggerData, LOCK_EX);
}

// 200 OK dön
header('Content-Type: application/json');
http_response_code(200);
echo json_encode(['status' => 'ok']);
