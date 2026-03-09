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
    
    // Ses çalma komutunu dosyaya yaz
    $soundTriggerFile = __DIR__ . '/sound_trigger.txt';
    
    $triggerData = json_encode([
        'timestamp' => $timestamp,
        'username' => $sender,
        'message' => substr($content, 0, 100),
        'message_id' => $messageId,
        'event_time' => time()
    ]);
    
    @file_put_contents($soundTriggerFile, $triggerData, LOCK_EX);
}

// 200 OK dön
header('Content-Type: application/json');
http_response_code(200);
echo json_encode(['status' => 'ok']);
