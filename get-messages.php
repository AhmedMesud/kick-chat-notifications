<?php
/**
 * Get Messages Endpoint
 * Belirli bir kanal için son mesajı getirir
 * Dosya yoksa boş JSON dönür (HTTP 200)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: no-cache, no-store, must-revalidate');

// CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Sadece GET istekleri
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Sadece GET methodu desteklenir']);
    exit;
}

// Channel ID parametresini al
$channelId = $_GET['channel_id'] ?? null;

if (!$channelId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'channel_id parametresi gerekli']);
    exit;
}

// Channel ID'yi temizle (güvenlik)
$channelId = preg_replace('/[^0-9]/', '', $channelId);

if (empty($channelId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Geçersiz channel_id']);
    exit;
}

// Dosya yolunu bul (yeni format: sound_trigger_{id}_{slug}.txt)
$file = null;
$pattern = __DIR__ . '/sound_trigger_' . $channelId . '_*.txt';
$files = glob($pattern);

if (!empty($files)) {
    // En son değiştirilmiş dosyayı al (birden fazla varsa)
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    $file = $files[0];
} else {
    // Eski formatı dene (geriye uyumluluk)
    $file = __DIR__ . '/sound_trigger_' . $channelId . '.txt';
}

// Dosya varsa ve içeriği varsa döndür
if ($file && file_exists($file)) {
    $content = @file_get_contents($file);
    if ($content && trim($content)) {
        // Geçerli JSON mı kontrol et
        $json = json_decode($content, true);
        if ($json !== null) {
            echo json_encode(['success' => true, 'data' => $json]);
            exit;
        }
    }
}

// Dosya yoksa veya boşsa - boş mesaj dön (HTTP 200 ile)
echo json_encode(['success' => true, 'data' => null, 'message' => 'Henüz mesaj yok']);
