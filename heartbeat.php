<?php
/**
 * Heartbeat Endpoint
 * Aktif dinleyen kullanıcıları takip eder
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$listenersFile = __DIR__ . '/active_listeners.json';
$timeoutSeconds = 120; // 2 dakika timeout

// GET: Aktif kullanıcı sayısını döndür
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $count = 0;
    
    if (file_exists($listenersFile)) {
        $listeners = json_decode(file_get_contents($listenersFile), true) ?: [];
        $now = time();
        
        // Timeout'a uğramış kayıtları temizle ve say
        $activeListeners = [];
        foreach ($listeners as $channelId => $data) {
            if (($now - $data['last_ping']) <= $timeoutSeconds) {
                $activeListeners[$channelId] = $data;
                $count++;
            }
        }
        
        // Temizlenmiş listeyi kaydet
        file_put_contents($listenersFile, json_encode($activeListeners, JSON_PRETTY_PRINT), LOCK_EX);
    }
    
    echo json_encode(['online_count' => $count]);
    exit;
}

// POST: Heartbeat kaydet
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $channelId = $data['channel_id'] ?? null;
    $channelName = $data['channel_name'] ?? '';
    
    if (!$channelId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'channel_id gerekli']);
        exit;
    }
    
    $listeners = [];
    if (file_exists($listenersFile)) {
        $listeners = json_decode(file_get_contents($listenersFile), true) ?: [];
    }
    
    // Bu kanalı aktif olarak kaydet
    $listeners[$channelId] = [
        'channel_id' => $channelId,
        'channel_name' => $channelName,
        'last_ping' => time(),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    file_put_contents($listenersFile, json_encode($listeners, JSON_PRETTY_PRINT), LOCK_EX);
    
    // Timeout'a uğramış kullanıcıları say
    $now = time();
    $onlineCount = 0;
    foreach ($listeners as $listener) {
        if (($now - $listener['last_ping']) <= $timeoutSeconds) {
            $onlineCount++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'online_count' => $onlineCount
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
