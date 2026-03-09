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
        <div id="message" class="loading">Loading...</div>
    </div>

    <script>
        const CODE = '<?php echo $code; ?>';
        const CLIENT_ID = '<?php echo $CLIENT_ID; ?>';
        const CLIENT_SECRET = '<?php echo $CLIENT_SECRET; ?>';

        // Çeviriler
        const TRANSLATIONS = {
            en: {
                loading: 'Getting token...',
                noSession: 'Session info not found.',
                backToHome: '← Back to home and try again',
                success: 'Success! Redirecting to homepage...',
                error: 'Error:',
                tokenFailed: 'Could not get token'
            },
            tr: {
                loading: 'Token alınıyor...',
                noSession: 'Giriş bilgisi bulunamadı.',
                backToHome: '← Ana sayfaya dönüp tekrar deneyin',
                success: 'Başarılı! Ana sayfaya yönlendiriliyor...',
                error: 'Hata:',
                tokenFailed: 'Token alınamadı'
            },
            es: {
                loading: 'Obteniendo token...',
                noSession: 'Información de sesión no encontrada.',
                backToHome: '← Volver al inicio e intentar de nuevo',
                success: '¡Éxito! Redirigiendo a la página principal...',
                error: 'Error:',
                tokenFailed: 'No se pudo obtener el token'
            },
            de: {
                loading: 'Token wird abgerufen...',
                noSession: 'Sitzungsinformationen nicht gefunden.',
                backToHome: '← Zurück zur Startseite und erneut versuchen',
                success: 'Erfolg! Weiterleitung zur Startseite...',
                error: 'Fehler:',
                tokenFailed: 'Token konnte nicht abgerufen werden'
            },
            ar: {
                loading: 'جاري الحصول على الرمز...',
                noSession: 'لم يتم العثور على معلومات الجلسة.',
                backToHome: '← العودة إلى الصفحة الرئيسية والمحاولة مرة أخرى',
                success: 'نجاح! إعادة التوجيه إلى الصفحة الرئيسية...',
                error: 'خطأ:',
                tokenFailed: 'تعذر الحصول على الرمز'
            },
            pt: {
                loading: 'Obtendo token...',
                noSession: 'Informação de sessão não encontrada.',
                backToHome: '← Voltar para a página inicial e tentar novamente',
                success: 'Sucesso! Redirecionando para a página inicial...',
                error: 'Erro:',
                tokenFailed: 'Não foi possível obter o token'
            },
            zh: {
                loading: '正在获取令牌...',
                noSession: '未找到会话信息。',
                backToHome: '← 返回首页并重试',
                success: '成功！正在重定向到首页...',
                error: '错误：',
                tokenFailed: '无法获取令牌'
            },
            hi: {
                loading: 'टोकन प्राप्त हो रहा है...',
                noSession: 'सेशन जानकारी नहीं मिली।',
                backToHome: '← होमपेज पर वापस जाएं और फिर से कोशिश करें',
                success: 'सफल! होमपेज पर रीडायरेक्ट हो रहा है...',
                error: 'त्रुटि:',
                tokenFailed: 'टोकन प्राप्त नहीं हो सका'
            },
            ru: {
                loading: 'Получение токена...',
                noSession: 'Информация о сессии не найдена.',
                backToHome: '← Вернуться на главную и попробовать снова',
                success: 'Успех! Перенаправление на главную страницу...',
                error: 'Ошибка:',
                tokenFailed: 'Не удалось получить токен'
            }
        };

        // Mevcut dili al
        const currentLang = localStorage.getItem('kick_lang') || 'tr';
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS['tr'];

        // İlk mesajı göster
        document.getElementById('message').textContent = t.loading;

        async function exchangeToken() {
            const codeVerifier = localStorage.getItem('pkce_code_verifier');

            if (!codeVerifier) {
                document.getElementById('message').innerHTML =
                    '<span class="error">' + t.noSession + '</span><br><br>' +
                    '<a href="kick-oauth-chat.html" style="color:#53fc18;text-decoration:none;">' +
                    t.backToHome + '</a>';
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
                        '<span class="success">' + t.success + '</span>';

                    setTimeout(() => {
                        window.location.href = 'kick-oauth-chat.html';
                    }, 1500);
                } else {
                    document.getElementById('message').innerHTML =
                        '<span class="error">' + t.error + ' ' + (data.error || t.tokenFailed) + '</span>';
                }
            } catch (e) {
                document.getElementById('message').innerHTML =
                    '<span class="error">' + t.error + ' ' + e.message + '</span>';
            }
        }

        exchangeToken();
    </script>
</body>
</html>
