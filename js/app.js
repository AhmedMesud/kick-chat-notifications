// ========== KICK CHAT SES UYGULAMASI ==========

// Kick OAuth Ayarları
const KICK_AUTH_URL = 'https://id.kick.com/oauth/authorize';
const CLIENT_ID = '01KK4FR27QK1SZV1F0HSRJ5FE6';
const REDIRECT_URI = 'https://ahmedmesud.com/kick-callback/kick-callback.php';
const SCOPE = 'user:read channel:read events:subscribe chat:write moderation:chat_message:manage';

// Uygulama State
let accessToken = localStorage.getItem('kick_access_token');
let refreshToken = localStorage.getItem('kick_refresh_token');
let tokenExpires = localStorage.getItem('kick_token_expires');
let audioContext = null;
let volume = 0.5;
let isListening = false;
let pollInterval = null;
let lastMessageId = null;
let recentUsers = new Map();
let currentChannelId = null;
let currentChannelName = '';
let selectedSound = parseInt(localStorage.getItem('kick_selected_sound') || '0');
let notificationsEnabled = localStorage.getItem('kick_notifications') === 'true';
let smartDelayMinutes = parseInt(localStorage.getItem('kick_smart_delay') || '5');
let lastMessageTime = 0;
const COOLDOWN_MS = 2000;

// Chat mesajları
let chatMessages = [];
let processedMessageIds = new Set();
let heartbeatInterval = null;
let onlineCountInterval = null;
const HEARTBEAT_INTERVAL_MS = 30000; // 30 saniye
const ONLINE_COUNT_INTERVAL_MS = 10000; // 10 saniye

// Bilinen botlar
const BOTS = new Set(['streamelements', 'nightbot', 'moobot', 'botrix', 'kickbot', 'kick', 'streamlabs']);

// Ses çalma fonksiyonları listesi
const SOUND_FUNCTIONS = [
    playDoubleBeep,
    playTripleBeep,
    playLongBeep,
    playHighBell,
    playLowBass,
    playMarimba
];

// ========== OAUTH FONKSİYONLARI ==========

// PKCE için code_verifier üret
function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Code challenge üret (SHA256)
async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Kick'e yönlendir
async function redirectToKick() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = Math.random().toString(36).substring(7);

    localStorage.setItem('pkce_code_verifier', codeVerifier);
    localStorage.setItem('oauth_state', state);

    const authUrl = `${KICK_AUTH_URL}?` +
        `response_type=code&` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(SCOPE)}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256&` +
        `state=${state}`;

    window.location.href = authUrl;
}

// ========== SES FONKSİYONLARI ==========

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playSound() {
    SOUND_FUNCTIONS[selectedSound]();
}

// 0: Çift Bip
function playDoubleBeep() {
    if (!audioContext) initAudio();
    const now = audioContext.currentTime;

    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.frequency.value = 523;
    gain1.gain.setValueAtTime(volume * 0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.frequency.value = 659;
    gain2.gain.setValueAtTime(volume * 0.2, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
}

// 1: Üçlü Tekrar
function playTripleBeep() {
    if (!audioContext) initAudio();
    const now = audioContext.currentTime;

    for (let i = 0; i < 3; i++) {
        const delay = i * 0.2;

        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.frequency.value = 523;
        gain1.gain.setValueAtTime(volume * 0.3, now + delay);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.start(now + delay);
        osc1.stop(now + delay + 0.15);

        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.frequency.value = 659;
        gain2.gain.setValueAtTime(volume * 0.2, now + delay + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.start(now + delay + 0.05);
        osc2.stop(now + delay + 0.2);
    }
}

// 2: Tek Uzun Bip
function playLongBeep() {
    if (!audioContext) initAudio();
    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.5);
}

// 3: Yüksek Zil
function playHighBell() {
    if (!audioContext) initAudio();
    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.15);
}

// 4: Düşük Bas
function playLowBass() {
    if (!audioContext) initAudio();
    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    const gain = audioContext.createGain();
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.25);
}

// 5: Marimba
function playMarimba() {
    if (!audioContext) initAudio();
    const now = audioContext.currentTime;
    const notes = [523, 659, 784];

    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume * 0.3, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
    });
}

// Ses seçimi
function selectSound(index) {
    selectedSound = index;
    localStorage.setItem('kick_selected_sound', index);

    for (let i = 0; i < 6; i++) {
        const el = document.getElementById('sound' + i);
        if (el) el.classList.remove('active');
    }

    const selectedEl = document.getElementById('sound' + index);
    if (selectedEl) selectedEl.classList.add('active');

    initAudio();
    SOUND_FUNCTIONS[index]();
}

// Sesi güncelle
function updateVolume(val) {
    volume = val / 100;
    const volumeValue = document.getElementById('volumeValue');
    if (volumeValue) volumeValue.textContent = val + '%';
}

// ========== BİLDİRİM FONKSİYONLARI ==========

// Akıllı bildirim gecikmesi güncelle
function updateSmartDelay() {
    const select = document.getElementById('smartDelay');
    if (!select) return;

    smartDelayMinutes = parseInt(select.value);
    localStorage.setItem('kick_smart_delay', smartDelayMinutes);

    // translations.js'deki fonksiyonu çağır
    if (typeof updateSmartNotificationLabels === 'function') {
        updateSmartNotificationLabels();
    }
}

// Akıllı bildirim kontrolü
function shouldShowSmartNotification() {
    if (!notificationsEnabled) return true;

    const now = Date.now();
    const delayMs = smartDelayMinutes * 60 * 1000;

    if (lastMessageTime === 0 || (now - lastMessageTime) >= delayMs) {
        lastMessageTime = now;
        return true;
    }

    lastMessageTime = now;
    return false;
}

// Bildirim toggle
async function toggleNotifications() {
    const checkbox = document.getElementById('notificationToggle');
    const statusDiv = document.getElementById('notificationStatus');

    if (!checkbox || !statusDiv) return;

    // translations.js'den mevcut çeviriyi al
    const t = typeof getCurrentTranslation === 'function' ? getCurrentTranslation() : {};

    if (checkbox.checked) {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
            notificationsEnabled = true;
            localStorage.setItem('kick_notifications', 'true');
            statusDiv.textContent = t.on || 'Aktif';
            statusDiv.style.color = '#27ae60';
            showTestNotification();
        } else {
            checkbox.checked = false;
            notificationsEnabled = false;
            localStorage.setItem('kick_notifications', 'false');
            statusDiv.textContent = t.denied || 'İzin reddedildi';
            statusDiv.style.color = '#e74c3c';
            alert('Bildirim izni verilmedi. Windows Ayarlar > Sistem > Bildirimler bölümünden izin verebilirsiniz.');
        }
    } else {
        notificationsEnabled = false;
        localStorage.setItem('kick_notifications', 'false');
        statusDiv.textContent = t.off || 'Kapalı';
        statusDiv.style.color = '#888';
    }
}

// Bildirim izni iste
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Tarayıcınız bildirimleri desteklemiyor.');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        alert('Bildirim izni daha önce reddedilmiş. Windows Ayarlar > Sistem > Bildirimler bölümünden izin vermeniz gerekiyor.');
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
}

// Bildirim göster
function showNotification(username, message) {
    if (!notificationsEnabled || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notification = new Notification('💬 ' + username, {
        body: message,
        icon: 'https://ahmedmesud.com/favicon.ico',
        tag: 'kick-chat-' + Date.now(),
        requireInteraction: false,
        silent: false
    });

    notification.onclick = function() {
        window.focus();
        notification.close();
    };

    setTimeout(() => notification.close(), 5000);
}

// Test bildirimi göster
function showTestNotification() {
    showNotification('Test', 'Windows bildirimleri aktif! 🎉');
}

// ========== KANAL FONKSİYONLARI ==========

// Kendi kanalını getir ve göster
async function loadMyChannel() {
    if (!accessToken) return;

    try {
        const response = await fetch('get-user-channel.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: accessToken })
        });

        const data = await response.json();

        if (data.success && data.channel_slug) {
            currentChannelName = data.channel_slug;
            const channelNameEl = document.getElementById('channelName');
            if (channelNameEl) channelNameEl.textContent = currentChannelName;

            if (data.channel_id) {
                currentChannelId = data.channel_id;
                console.log('✅ Kanal yüklendi:', data.channel_slug, 'ID:', data.channel_id);
            } else {
                console.error('❌ Kanal ID alınamadı!');
                if (channelNameEl) channelNameEl.textContent = currentChannelName + ' (ID alınamadı)';
            }
        } else {
            const channelNameEl = document.getElementById('channelName');
            if (channelNameEl) channelNameEl.textContent = 'Alınamadı';
            console.log('Kanal bilgisi alınamadı:', data.error);
        }
    } catch (e) {
        const channelNameEl = document.getElementById('channelName');
        if (channelNameEl) channelNameEl.textContent = 'Hata';
        console.error('Kanal yükleme hatası:', e);
    }
}

// ========== CHAT DİNLEME FONKSİYONLARI ==========

// Chat dinlemeyi başlat
async function startListening() {
    const t = typeof getCurrentTranslation === 'function' ? getCurrentTranslation() : {};

    if (!currentChannelId) {
        alert((t.loading || 'Yükleniyor...') + ' - Channel info failed. Please login again.');
        return;
    }

    if (!accessToken) {
        alert((t.loginBtn || 'Login') + ' - ' + (t.notConnected || 'Not connected'));
        return;
    }

    initAudio();
    playSound();

    const statusEl = document.getElementById('status');
    const toggleBtn = document.getElementById('toggleListenBtn');
    const lastMessageEl = document.getElementById('lastMessage');

    if (statusEl) {
        statusEl.textContent = t.loading || 'Yükleniyor...';
        statusEl.className = 'status waiting';
    }
    if (toggleBtn) toggleBtn.textContent = '⏳ ' + (t.loading || 'Yükleniyor...');
    if (lastMessageEl) lastMessageEl.innerHTML = '<span>Events subscription...</span>';

    try {
        const response = await fetch('events-subscribe.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: accessToken,
                channel_id: currentChannelId
            })
        });

        const data = await response.json();
        console.log('Subscription response:', data);

        if (!data.success) {
            console.log('Subscription uyarı:', data.error);
        }

        if (statusEl) {
            statusEl.textContent = t.listening || 'Dinleniyor...';
            statusEl.className = 'status connected';
        }
        if (toggleBtn) toggleBtn.textContent = t.stopListening || 'Durdur';
        if (lastMessageEl) lastMessageEl.innerHTML = '<span>' + (t.channelListening || 'Kanal dinleniyor') + '</span>';

        isListening = true;
        startHeartbeat(); // Heartbeat başlat
        startWebhookPolling();

    } catch (error) {
        console.error('Hata:', error);
        if (statusEl) {
            statusEl.textContent = t.error || 'Hata';
            statusEl.className = 'status error';
        }
        if (toggleBtn) toggleBtn.textContent = t.startListening || 'Başla';
        if (lastMessageEl) lastMessageEl.innerHTML = '<span>' + (t.error || 'Hata') + ': ' + error.message + '</span>';
        isListening = false;
    }
}

// Webhook mesajlarını kontrol et
function startWebhookPolling() {
    console.log('🟢 Polling başlatıldı');
    
    if (!currentChannelId) {
        console.error('❌ Polling başlatılamadı: currentChannelId yok');
        return;
    }
    
    console.log('📁 Kanal:', currentChannelId, '- Dosya pattern: sound_trigger_' + currentChannelId + '_*.txt');

    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.style.display = 'block';

    // Kanala özel endpoint - PHP wrapper ile (404 yerine boş JSON döner)
    const messagesEndpoint = 'get-messages.php?channel_id=' + currentChannelId;

    pollInterval = setInterval(async () => {
        try {
            const response = await fetch(messagesEndpoint + '&t=' + Date.now(), {
                method: 'GET',
                cache: 'no-store'
            });
            
            // HTTP hatası varsa sessizce devam et (console temiz kalsın)
            if (!response.ok) {
                return;
            }
            
            const apiResult = await response.json();
            
            // API başarısız veya data yoksa sessizce devam et
            if (!apiResult.success || !apiResult.data) {
                return;
            }
            
            // Data'yı eski formata uygun hale getir (geriye uyumluluk)
            const trigger = apiResult.data;

            if (!trigger.message_id) return;
            if (processedMessageIds.has(trigger.message_id)) return;

            processedMessageIds.add(trigger.message_id);

            if (processedMessageIds.size > 100) {
                const iterator = processedMessageIds.values();
                for (let i = 0; i < 50; i++) {
                    processedMessageIds.delete(iterator.next().value);
                }
            }

            console.log('✅ YENİ MESAJ:', trigger.username, trigger.message);

            // Ses çal
            try {
                const t = typeof getCurrentTranslation === 'function' ? getCurrentTranslation() : {};
                playSound();

                const soundStatus = document.getElementById('soundStatus');
                if (soundStatus) {
                    soundStatus.textContent = t.soundPlayed || 'ÇALDI!';
                    soundStatus.style.color = '#27ae60';

                    setTimeout(() => {
                        soundStatus.textContent = t.soundWaiting || 'Bekliyor...';
                        soundStatus.style.color = '#888';
                    }, 3000);
                }
            } catch (soundError) {
                console.error('❌ Ses çalma hatası:', soundError);
            }

            // Akıllı bildirim kontrolü
            const shouldNotify = shouldShowSmartNotification();
            if (shouldNotify) {
                showNotification(trigger.username, trigger.message);
            }

            // Mesajı listeye ekle (emojilerle birlikte)
            chatMessages.unshift({
                username: trigger.username,
                message: trigger.message,
                emotes: trigger.emotes, // Emoji metadata'sını da kaydet
                time: new Date().toLocaleTimeString()
            });

            if (chatMessages.length > 10) {
                chatMessages = chatMessages.slice(0, 10);
            }

            updateChatBox();

            const lastMessageEl = document.getElementById('lastMessage');
            if (lastMessageEl) {
                // renderEmotes içinde HTML escape yapılıyor
                const renderedLastMessage = renderEmotes(trigger.message, trigger.emotes);
                lastMessageEl.innerHTML =
                    '<span class="time">' + new Date().toLocaleTimeString() + '</span><br>' +
                    '<strong>' + escapeHtml(trigger.username) + ':</strong> ' + renderedLastMessage;
            }

        } catch (e) {
            console.log('❌ Polling hatası:', e.message);
        }
    }, 1500);
}

// Emoji kodlarını görsel emojilere dönüştür (HTML güvenli)
function renderEmotes(message, emotes) {
    // Emotes array'i yoksa veya boşsa, eski formatı regex ile dene
    if (!emotes || emotes.length === 0) {
        return message.replace(/\[emote:(\d+):([^\]]+)\]/g, function(match, emoteId, emoteName) {
            return `<img src="https://files.kick.com/emotes/${emoteId}/fullsize" 
                         alt="${emoteName}" 
                         title="${emoteName}"
                         style="width: 28px; height: 28px; vertical-align: middle; display: inline-block;"
                         onerror="this.style.display='none'">`;
        });
    }
    
    // Kick API formatı: {emote_id, positions: [{s, e}, ...]}
    // Pozisyonlara göre sondan başa sırala (indeks kaymasını önlemek için)
    const sortedEmotes = [];
    emotes.forEach((emote, emoteIndex) => {
        if (emote.positions && emote.positions.length > 0) {
            emote.positions.forEach((pos, posIndex) => {
                sortedEmotes.push({
                    emote_id: emote.emote_id,
                    name: emote.name || 'emoji',
                    start: pos.s,
                    end: pos.e,
                    originalIndex: emoteIndex,
                    posIndex: posIndex
                });
            });
        }
    });
    
    // Sondan başa sırala (büyük indeksten küçüğe)
    sortedEmotes.sort((a, b) => b.start - a.start);
    
    // Geçici placeholder'lar kullan
    let placeholders = [];
    let result = message;
    
    sortedEmotes.forEach((item, index) => {
        const placeholder = `__EMOTE_${item.originalIndex}_${item.posIndex}__`;
        
        placeholders.push({
            placeholder: placeholder,
            emote_id: item.emote_id,
            name: item.name
        });
        
        // Pozisyonlara göre değiştir (düzeltme: substring kullanımı)
        const before = result.substring(0, item.start);
        const after = result.substring(item.end + 1);
        result = before + placeholder + after;
    });
    
    // Kalan metni HTML escape et (güvenlik)
    const div = document.createElement('div');
    div.textContent = result;
    result = div.innerHTML;
    
    // Placeholder'ları img tag'lerine dönüştür
    placeholders.forEach(p => {
        const emoteHtml = `<img src="https://files.kick.com/emotes/${p.emote_id}/fullsize" 
                               alt="${p.name}" 
                               title="${p.name}"
                               style="width: 28px; height: 28px; vertical-align: middle; display: inline-block;"
                               onerror="this.style.display='none'">`;
        result = result.split(p.placeholder).join(emoteHtml);
    });
    
    return result;
}

// Basit HTML escape fonksiyonu
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Chat kutusunu güncelle
function updateChatBox() {
    const t = typeof getCurrentTranslation === 'function' ? getCurrentTranslation() : {};
    const chatDiv = document.getElementById('chatMessages');

    if (!chatDiv) return;

    if (chatMessages.length === 0) {
        chatDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">' + (t.noMessages || 'Henüz mesaj yok...') + '</div>';
        return;
    }

    chatDiv.innerHTML = chatMessages.map(msg => {
        // renderEmotes içinde HTML escape yapılıyor
        const renderedMessage = renderEmotes(msg.message, msg.emotes);
        return '<div style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">' +
            '<span style="color: #666; font-size: 11px;">' + msg.time + '</span><br>' +
            '<strong style="color: #e94560;">' + escapeHtml(msg.username) + ':</strong> ' +
            '<span style="color: #fff;">' + renderedMessage + '</span>' +
            '</div>';
    }).join('');

    chatDiv.scrollTop = 0;
}

// Dinlemeyi durdur
function stopListening() {
    const t = typeof getCurrentTranslation === 'function' ? getCurrentTranslation() : {};
    isListening = false;

    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    
    // Heartbeat'i durdur
    stopHeartbeat();

    const statusEl = document.getElementById('status');
    const toggleBtn = document.getElementById('toggleListenBtn');
    const lastMessageEl = document.getElementById('lastMessage');
    const chatBox = document.getElementById('chatBox');

    if (statusEl) {
        statusEl.textContent = t.stopped || 'Durduruldu';
        statusEl.className = 'status waiting';
    }
    if (toggleBtn) toggleBtn.textContent = t.resumeListening || 'Devam Et';
    if (lastMessageEl) lastMessageEl.innerHTML = '<span>' + (t.listeningStopped || 'Dinleme durduruldu') + '</span>';
    if (chatBox) chatBox.style.display = 'none';

    chatMessages = [];
    processedMessageIds.clear();
}

// Dinlemeyi başlat/durdur toggle
function toggleListening() {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

// ========== HEARTBEAT FONKSİYONLARI ==========

// Heartbeat gönder - sunucuya "ben hâlâ buradayım" sinyali
async function sendHeartbeat() {
    if (!currentChannelId) return;
    
    try {
        const response = await fetch('heartbeat.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel_id: currentChannelId,
                channel_name: currentChannelName
            })
        });
        
        const data = await response.json();
        if (data.success) {
            updateOnlineBadge(data.online_count);
        }
    } catch (e) {
        console.log('Heartbeat hatası:', e.message);
    }
}

// Aktif kullanıcı sayısını al ve göster
async function updateOnlineCount() {
    try {
        const response = await fetch('heartbeat.php', {
            method: 'GET',
            cache: 'no-store'
        });
        
        const data = await response.json();
        updateOnlineBadge(data.online_count);
    } catch (e) {
        console.log('Online sayı alma hatası:', e.message);
    }
}

// Online badge'i güncelle
function updateOnlineBadge(count) {
    const badge = document.getElementById('onlineBadge');
    if (badge) {
        badge.textContent = '👥 ' + count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Heartbeat'i başlat
function startHeartbeat() {
    // Hemen bir heartbeat gönder
    sendHeartbeat();
    
    // Her 30 saniyede bir tekrarla
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    
    // Her 10 saniyede bir online sayısını güncelle
    onlineCountInterval = setInterval(updateOnlineCount, ONLINE_COUNT_INTERVAL_MS);
}

// Heartbeat'i durdur
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (onlineCountInterval) {
        clearInterval(onlineCountInterval);
        onlineCountInterval = null;
    }
}

// ========== DİL DEĞİŞİKLİĞİ FONKSİYONU ==========

// Dil değiştiğinde infoBox'u güncelle (translations.js tarafından çağrılır)
function updateInfoBoxForLanguage() {
    const t = typeof getCurrentTranslation === 'function' ? getCurrentTranslation() : {};

    const infoBox = document.getElementById('infoBox');
    if (!infoBox) return;

    // Kullanıcı giriş yapmış mı kontrol et
    if (accessToken && tokenExpires && Date.now() < parseInt(tokenExpires)) {
        // Giriş yapmış kullanıcı için bağlantı mesajı
        infoBox.innerHTML = `<strong style="color: #27ae60;">✅ ${t.connected || 'Bağlandı'}</strong><br><span style="color: #27ae60;">✅</span> ${t.channelListening || 'Kanal dinleniyor'}`;
    } else {
        // Giriş yapmamış kullanıcı için bilgi mesajı
        infoBox.innerHTML = `<strong>${t.infoTitle || 'Bilgi'}</strong><br>${t.infoStep1 || ''}<br>${t.infoStep2 || ''}<br>${t.infoStep3 || ''}<br>${t.infoStep4 || ''}<br>${t.infoStep5 || ''}`;
    }

    // Status badge'i de güncelle
    const statusEl = document.getElementById('status');
    if (statusEl) {
        if (accessToken && tokenExpires && Date.now() < parseInt(tokenExpires)) {
            statusEl.textContent = t.authorized || 'Yetkilendirildi';
            statusEl.className = 'status connected';
        } else {
            statusEl.textContent = t.statusConnect || 'Bağlan';
            statusEl.className = 'status waiting';
        }
    }

    // Token info metnini güncelle
    const tokenInfo = document.getElementById('tokenInfo');
    if (tokenInfo && accessToken && tokenExpires && Date.now() < parseInt(tokenExpires)) {
        tokenInfo.textContent = (t.tokenValid || 'Token geçerli') + ' - ' + new Date(parseInt(tokenExpires)).toLocaleString();
    }

    // Dinleme butonunu güncelle (eğer varsa)
    const toggleBtn = document.getElementById('toggleListenBtn');
    if (toggleBtn && !isListening) {
        toggleBtn.textContent = '🎧 ' + (t.startListening || 'Dinlemeye Başla');
    }
}

// Global scope'a ekle (translations.js tarafından çağrılabilsin)
window.updateInfoBoxForLanguage = updateInfoBoxForLanguage;

// ========== ÇIKIŞ FONKSİYONU ==========

function logout() {
    const t = typeof getCurrentTranslation === 'function' ? getCurrentTranslation() : {};

    localStorage.removeItem('kick_access_token');
    localStorage.removeItem('kick_refresh_token');
    localStorage.removeItem('kick_token_expires');
    localStorage.removeItem('kick_channel_id');
    localStorage.removeItem('pkce_code_verifier');
    localStorage.removeItem('oauth_state');

    stopListening();
    stopHeartbeat();

    accessToken = null;
    refreshToken = null;
    tokenExpires = null;

    const kickLoginBtn = document.getElementById('kickLoginBtn');
    const chatControls = document.getElementById('chatControls');
    const infoBox = document.getElementById('infoBox');
    const statusEl = document.getElementById('status');
    const tokenInfo = document.getElementById('tokenInfo');
    const lastMessageEl = document.getElementById('lastMessage');

    if (kickLoginBtn) kickLoginBtn.classList.remove('hidden');
    if (chatControls) chatControls.classList.add('hidden');
    if (infoBox) {
        infoBox.innerHTML = `<strong>${t.infoTitle || 'Bilgi'}</strong><br>${t.infoStep1 || ''}<br>${t.infoStep2 || ''}<br>${t.infoStep3 || ''}<br>${t.infoStep4 || ''}<br>${t.infoStep5 || ''}`;
    }
    if (statusEl) {
        statusEl.textContent = t.statusConnect || 'Bağlan';
        statusEl.className = 'status waiting';
    }
    if (tokenInfo) tokenInfo.textContent = '';
    if (lastMessageEl) lastMessageEl.innerHTML = '<span>' + (t.loggedOut || 'Çıkış yapıldı') + '</span>';

    console.log(t.loggedOut || 'Çıkış yapıldı');
}

// ========== SAYFA YÜKLEME ==========

window.onload = async function() {
    // Online sayısını güncelle
    updateOnlineCount();
    
    // Çevirilerin yüklenmesini bekle
    await new Promise(resolve => {
        const checkTranslations = () => {
            if (typeof getCurrentTranslation === 'function' && typeof getCurrentLang === 'function') {
                const translations = getCurrentTranslation();
                // Çeviriler gerçekten yüklendi mi kontrol et
                if (translations && Object.keys(translations).length > 0) {
                    resolve();
                } else {
                    setTimeout(checkTranslations, 50);
                }
            } else {
                setTimeout(checkTranslations, 50);
            }
        };
        checkTranslations();
    });

    // Dil ayarını uygula (async)
    if (typeof setLanguage === 'function') {
        const lang = getCurrentLang();
        await setLanguage(lang);
    }

    const t = getCurrentTranslation();

    if (accessToken && tokenExpires && Date.now() < parseInt(tokenExpires)) {
        document.getElementById('kickLoginBtn')?.classList.add('hidden');
        document.getElementById('chatControls')?.classList.remove('hidden');

        const infoBox = document.getElementById('infoBox');
        if (infoBox) {
            infoBox.innerHTML = `<strong style="color: #27ae60;">✅ ${t.connected || 'Bağlandı'}</strong><br><span style="color: #27ae60;">✅</span> ${t.channelListening || 'Kanal dinleniyor'}`;
        }

        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = t.authorized || 'Yetkilendirildi';
            statusEl.className = 'status connected';
        }

        const tokenInfo = document.getElementById('tokenInfo');
        if (tokenInfo) {
            tokenInfo.textContent = (t.tokenValid || 'Token geçerli') + ' - ' + new Date(parseInt(tokenExpires)).toLocaleString();
        }

        const toggleBtn = document.getElementById('toggleListenBtn');
        if (toggleBtn) toggleBtn.textContent = '🎧 ' + (t.startListening || 'Dinlemeye Başla');

        await loadMyChannel();

        // Kaydedilmiş ses seçimini uygula
        for (let i = 0; i < 6; i++) {
            document.getElementById('sound' + i)?.classList.remove('active');
        }
        document.getElementById('sound' + selectedSound)?.classList.add('active');

        // Bildirim ayarını geri yükle
        const notificationToggle = document.getElementById('notificationToggle');
        const notificationStatus = document.getElementById('notificationStatus');

        if (notificationsEnabled && notificationToggle && notificationStatus) {
            notificationToggle.checked = true;
            notificationStatus.textContent = t.on || 'Aktif';
            notificationStatus.style.color = '#27ae60';

            if (Notification.permission !== 'granted' && typeof requestNotificationPermission === 'function') {
                requestNotificationPermission().then(permission => {
                    if (permission !== 'granted' && notificationToggle && notificationStatus) {
                        notificationToggle.checked = false;
                        notificationStatus.textContent = t.denied || 'İzin reddedildi';
                        notificationStatus.style.color = '#e74c3c';
                    }
                });
            }
        } else if (notificationStatus) {
            notificationStatus.textContent = t.off || 'Kapalı';
        }

        // Akıllı bildirim gecikmesini geri yükle
        const smartDelay = document.getElementById('smartDelay');
        const smartStatus = document.getElementById('smartStatus');
        if (smartDelay) smartDelay.value = smartDelayMinutes;
        if (smartStatus && typeof updateSmartNotificationLabels === 'function') {
            updateSmartNotificationLabels();
        }
    } else {
        localStorage.removeItem('kick_access_token');
        localStorage.removeItem('kick_refresh_token');
        localStorage.removeItem('kick_token_expires');
    }
};
