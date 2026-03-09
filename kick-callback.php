<?php
/**
 * Kick OAuth Callback Handler
 */

require_once 'config.php';

$CLIENT_ID = KICK_CLIENT_ID;
$CLIENT_SECRET = KICK_CLIENT_SECRET;

$code = $_GET['code'] ?? null;
$error = $_GET['error'] ?? null;

if ($error) {
    echo "Hata: " . htmlspecialchars($error);
    exit;
}

if (!$code) {
    echo "Authorization code bulunamadı";
    exit;
}

// HTML çıktı - JavaScript token alacak
?>
<!DOCTYPE html>
<html>
<head>
    <title>Kick Auth - Token Alınıyor</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #1a1a2e;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 30px;
            background: #16213e;
            border-radius: 10px;
        }
        .loading { font-size: 18px; }
        .error { color: #e74c3c; }
        .success { color: #27ae60; }
    </style>
</head>
<body>
    <div class="container">
        <div id="message" class="loading">Token alınıyor...</div>
    </div>

    <script>
        const CODE = '<?php echo $code; ?>';
        const CLIENT_ID = '<?php echo $CLIENT_ID; ?>';
        const CLIENT_SECRET = '<?php echo $CLIENT_SECRET; ?>';
        
        async function exchangeToken() {
            const codeVerifier = localStorage.getItem('pkce_code_verifier');
            
            if (!codeVerifier) {
                document.getElementById('message').innerHTML = 
                    '<span class="error">Giriş bilgisi bulunamadı.</span><br><br>' +
                    '<a href="kick-oauth-chat.html" style="color:#53fc18;text-decoration:none;">' +
                    '← Ana sayfaya dönüp tekrar deneyin</a>';
                return;
            }
            
            try {
                const response = await fetch('token-exchange.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        code: CODE,
                        code_verifier: codeVerifier
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('kick_access_token', data.access_token);
                    localStorage.setItem('kick_refresh_token', data.refresh_token || '');
                    
                    // Token süresini hesapla (şu an + expires_in saniye)
                    const expiresAt = Date.now() + (data.expires_in * 1000);
                    localStorage.setItem('kick_token_expires', expiresAt.toString());
                    
                    localStorage.removeItem('pkce_code_verifier');
                    
                    document.getElementById('message').innerHTML = 
                        '<span class="success">Başarılı! Ana sayfaya yönlendiriliyor...</span>';
                    
                    setTimeout(() => {
                        window.location.href = 'kick-oauth-chat.html';
                    }, 1500);
                } else {
                    document.getElementById('message').innerHTML = 
                        '<span class="error">Hata: ' + (data.error || 'Token alınamadı') + '</span>';
                }
            } catch (e) {
                document.getElementById('message').innerHTML = 
                    '<span class="error">Hata: ' + e.message + '</span>';
            }
        }
        
        exchangeToken();
    </script>
</body>
</html>
