// ========== DİL/TRANSLATION MODÜLÜ ==========

// Mevcut dil ve çeviri verileri
let currentLang = localStorage.getItem('kick_lang') || 'tr';
let TRANSLATIONS = {};
let translationsLoaded = false;

// Tüm dillerin listesi
const AVAILABLE_LANGUAGES = ['en', 'es', 'de', 'tr', 'ar', 'pt', 'zh', 'hi', 'ru'];

// Dil dosyalarını yükle
async function loadTranslations(lang) {
    try {
        const response = await fetch(`translations/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${lang}.json`);
        }
        TRANSLATIONS[lang] = await response.json();
        return TRANSLATIONS[lang];
    } catch (error) {
        console.error(`Translation load error for ${lang}:`, error);
        return null;
    }
}

// Varsayılan dili yükle (tr)
async function loadDefaultTranslations() {
    for (const lang of AVAILABLE_LANGUAGES) {
        await loadTranslations(lang);
    }
    translationsLoaded = true;
}

// Belirli bir dilin yüklü olup olmadığını kontrol et
function isTranslationLoaded(lang) {
    return TRANSLATIONS[lang] && Object.keys(TRANSLATIONS[lang]).length > 0;
}

// Çevirilerin yüklenmesini bekle
async function waitForTranslations() {
    if (translationsLoaded) return;

    return new Promise(resolve => {
        const check = () => {
            if (translationsLoaded) {
                resolve();
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}

// Dil değiştirme fonksiyonu
async function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('kick_lang', lang);

    // Çeviriler yüklenmediyse bekle
    await waitForTranslations();

    // Dil butonlarını güncelle
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });

    // Sayfa içeriğini güncelle
    updatePageLanguage();

    // InfoBox'u güncelle (eğer app.js yüklendiyse)
    if (typeof window.updateInfoBoxForLanguage === 'function') {
        window.updateInfoBoxForLanguage();
    }
}

// Sayfa dilini güncelle
function updatePageLanguage() {
    const t = TRANSLATIONS[currentLang];
    if (!t || Object.keys(t).length === 0) return;

    // data-i18n attribute'u olan tüm elementleri güncelle
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        // key var mı ve undefined değil mi kontrol et (falsy değerler için de çalışsın ama undefined için çalışmasın)
        if (key in t && t[key] !== undefined) {
            // Emoji ve HTML koruma
            if (key === 'logoutBtn' || key === 'loginBtn' || key === 'startListening') {
                // Bu butonlar emoji içeriyor, sadece metni değiştir
                const emoji = el.textContent.match(/^[\ud800-\udbff][\udc00-\udfff]|./gu)?.[0] || '';
                el.textContent = emoji + ' ' + t[key].replace(/^[\ud800-\udbff][\udc00-\udfff]\s*/gu, '');
            } else {
                el.textContent = t[key];
            }
        }
    });

    // HTML lang attribute'unu güncelle
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' :
                                  currentLang === 'ar' ? 'ar' : currentLang;

    // Smart notification etiketlerini güncelle
    updateSmartNotificationLabels();
}

// Sayfa dil değiştiğinde dropdown etiketini güncelle
function updateSmartNotificationLabels() {
    const t = TRANSLATIONS[currentLang];
    if (!t) return;

    const minutesLabel = document.getElementById('minutesLabel');
    const smartStatus = document.getElementById('smartStatus');
    const smartDelay = document.getElementById('smartDelay');

    if (minutesLabel) minutesLabel.textContent = t.minutesLabel || 'dakika';
    if (smartStatus && smartDelay) {
        smartStatus.textContent = smartDelay.value + ' ' + (t.selected || 'seçili');
    }
}

// Mevcut çeviri objesini al (app.js için)
function getCurrentTranslation() {
    // Önce mevcut dili dene, yoksa tr'yi dene, yoksa boş obje döndür
    const translations = TRANSLATIONS[currentLang] || TRANSLATIONS['tr'];
    // Eğer translations undefined veya null ise boş obje döndür
    return translations || {};
}

// Mevcut dili al
function getCurrentLang() {
    return currentLang;
}

// Sayfa yüklendiğinde çevirileri yükle
loadDefaultTranslations().then(() => {
    // Başlangıç dilini uygula
    setLanguage(currentLang);
});
