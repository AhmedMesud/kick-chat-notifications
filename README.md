# 🔔 Kick Chat Notifications

Real-time sound and Windows notifications for Kick streamers. Never miss a chat message again!

**🌐 Available in 9 Languages**: English, Español, Deutsch, Türkçe, العربية, Português, 中文, हिंदी, Русский

---

## 🛠️ Tech Stack

- **Backend**: PHP 8.x (REST API, file-based storage, heartbeat tracking)
- **Frontend**: Vanilla JavaScript ES6+, Web Audio API
- **External APIs**: Kick OAuth 2.0 PKCE, Kick Events API (Webhooks)
- **Real-time**: Polling with 1.5s intervals, Heartbeat system (30s ping, 2min timeout)
- **Storage**: File-based (JSON + TXT files per channel)
- **Security**: OAuth 2.0 PKCE, .htaccess protection, input sanitization

---

## 🎯 Purpose & Use Case

This application is designed for **growing streamers** who want to engage with every viewer and never miss an important chat message.

### Who is this for?
- ✅ Streamers with smaller, tight-knit communities
- ✅ Streamers without moderators
- ✅ Streamers who sometimes forget to check chat
- ✅ Streamers who want to build personal connections with viewers

### Who is this NOT for?
- ❌ Streamers with thousands of active viewers (chat moves too fast)
- ❌ Streamers with dedicated moderator teams

### Why?
Small streamers often struggle with "dead chat" - no messages for long periods, leading them to focus on gameplay and forget to check chat. When a viewer finally sends a message and gets no response, they leave. This app solves that by:

- 🔊 Playing **customizable sound alerts** for every new message
- 🔔 Showing **Windows native notifications** (even when window is minimized)
- 📱 Supporting **9 languages** for global accessibility

---

## ✨ Features

### 🔊 6 Custom Notification Sounds
- **Double Beep** - Classic notification
- **Triple** - 3 rapid beeps for urgent attention
- **Long Beep** - Extended tone (880Hz)
- **Bell** - High-pitched chime (1200Hz)
- **Bass** - Deep tone for low-frequency preference
- **Marimba** - Musical C5-E5-G5 arpeggio

Click any sound button to **preview** it instantly!

### 🔔 Windows Native Notifications
- Desktop toast notifications
- Works when browser is minimized
- Customizable on/off toggle
- 5-second auto-dismiss

### 😀 Emoji Support
- Emojis are automatically rendered as images from Kick's emote library
- Works with both `[emote:ID:NAME]` format and metadata-based emotes
- Clean, 28x28 pixel display inline with text
- All official Kick emojis supported

### ⏱️ Smart Notification Delay
- Configure delay: 1, 2, 3, 5, 10, or 15 minutes
- If no messages received within selected time → desktop notification shows for first message
- Prevents notification spam during active chat
- Perfect for "dead chat" scenarios
- Example: Set to 5 minutes → first message after 5+ minutes of silence triggers desktop notification

### 🏠 Multi-User Support
- **Channel-based isolation** - Each user only receives notifications for their own channel
- No cross-user message leakage - perfect for shared hosting
- Files are automatically created per channel: `sound_trigger_{channelId}.txt`

### 🌍 Multi-Language Support (9 Languages)
| Language | Flag | Code |
|----------|------|------|
| English | 🇬🇧 | EN |
| Español | 🇪🇸 | ES |
| Deutsch | 🇩🇪 | DE |
| Türkçe | 🇹🇷 | TR |
| العربية | 🇸🇦 | AR |
| Português | 🇵🇹 | PT |
| 中文 | 🇨🇳 | ZH |
| हिंदी | 🇮🇳 | HI |
| Русский | 🇷🇺 | RU |

### 👥 Online User Counter
- See how many streamers are actively listening in real-time
- Displayed as a badge in the top-right corner (👥 3)
- Updates every 10 seconds
- 2-minute timeout for inactive users

### 🔒 Security
- OAuth 2.0 PKCE flow for secure authentication
- `CLIENT_SECRET` excluded from GitHub (via `.gitignore`)
- `.htaccess` protection for sensitive files
- Token-based session management
- **User isolation** - Each user only sees messages from their own channel

---

## 📋 Requirements

- Web hosting with PHP support
- SSL certificate (HTTPS required for OAuth)
- Kick Developer Account with OAuth app credentials
- Modern browser with JavaScript enabled

---

## 🚀 Installation

### 1. Clone Repository
```bash
git clone https://github.com/AhmedMesud/kick-chat-notifications.git
cd kick-chat-notifications
```

### 2. Configure Kick OAuth
Create a file named `config.php` with your Kick credentials:

```php
<?php
// config.php - DO NOT COMMIT THIS FILE TO GIT
define('KICK_CLIENT_ID', 'YOUR_KICK_CLIENT_ID');
define('KICK_CLIENT_SECRET', 'YOUR_KICK_CLIENT_SECRET');
define('KICK_REDIRECT_URI', 'https://yourdomain.com/kick-callback/kick-callback.php');
```

### 3. Set Up Kick App
1. Go to [Kick Developers](https://kick.com/developers)
2. Create new OAuth app
3. Enable scopes:
   - `user:read`
   - `channel:read`
   - `events:subscribe`
   - `chat:write`
   - `moderation:chat_message:manage`
4. Enable webhooks in app settings
5. Add your webhook URL: `https://yourdomain.com/webhook.php`

### 4. Upload to Server
Upload all files to your web hosting (except `config.php` - create it on server).

### 5. Create Empty Files
Create these empty files with write permissions (666):
```bash
touch webhook_log.txt
chmod 666 webhook_log.txt
```

**Note:** `sound_trigger_{channelId}.txt` and `active_listeners.json` files are automatically created per channel when messages arrive or users go online.

---

## 🎮 Usage

1. **Login** - Click "Login with Kick" button
2. **Authorize** - Approve all permissions in Kick popup
3. **Select Sound** - Click any of 6 sound buttons to choose notification sound
4. **Enable Notifications** (Optional) - Check "Windows Notifications" toggle
5. **Start Listening** - Click "Start Listening" button
6. **Go Live** - When viewers chat, you'll hear the sound and see Windows notifications

---

## 🛠️ Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript, Web Audio API, Modular CSS
- **Backend**: PHP (cURL for API requests)
- **Authentication**: OAuth 2.0 PKCE
- **Real-time**: Webhook-based (Kick Events API) + File polling
- **Localization**: JSON-based translations, dynamically loaded

### API Endpoints Used

#### Kick API (External)
- `GET /public/v1/users` - Get user info
- `GET /public/v1/channels` - Get channel info
- `POST /public/v1/events/subscriptions` - Subscribe to chat events
- Webhook endpoint for `chat.message.sent` events

#### Local API (Internal)
- `GET get-messages.php?channel_id={id}` - Get latest message for specific channel
- `POST heartbeat.php` - Register/update active user status
- `GET heartbeat.php` - Get count of online users

---

## 📁 File Structure

```
kick-oauth-final/
├── kick-oauth-chat.html      # Main application UI
├── style.css                 # CSS styles (modular)
├── kick-callback.php         # OAuth callback handler (multi-language)
├── token-exchange.php        # OAuth token exchange
├── get-user-channel.php      # Fetch user's channel info
├── events-subscribe.php      # Subscribe to Kick events
├── webhook.php               # Webhook endpoint for chat messages
├── get-messages.php          # Channel-based message retrieval endpoint
├── heartbeat.php             # Online user tracking endpoint
├── index.php                 # Redirect to main page
├── .htaccess                 # Security configuration
├── config.php                # ⚠️ NOT IN GIT - Your secrets
├── sound_trigger.txt         # ⚠️ DEPRECATED - Legacy message file
├── sound_trigger_{id}.txt   # ⚠️ Per-channel message files (auto-created)
├── active_listeners.json     # ⚠️ Online users tracking (auto-created)
├── webhook_log.txt           # ⚠️ Webhook debug log
├── README.md                 # This file
├── translations/             # 🌍 JSON translation files
│   ├── en.json              # English
│   ├── tr.json              # Türkçe
│   ├── es.json              # Español
│   ├── de.json              # Deutsch
│   ├── ar.json              # العربية
│   ├── pt.json              # Português
│   ├── zh.json              # 中文
│   ├── hi.json              # हिंदी
│   └── ru.json              # Русский
└── js/                       # 📜 JavaScript modules
    ├── translations.js       # Translation system & language handling
    └── app.js                # Main application logic (OAuth, sounds, notifications, heartbeat)
```

---

## ⚠️ Important Notes

### Security
- **Never** commit `config.php` to Git - it contains your `CLIENT_SECRET`
- `.gitignore` is already configured to exclude sensitive files
- Always use HTTPS for OAuth redirects

### Kick API Limitations
- This app listens to **your own channel only** (not other streamers)
- Each user must log in with their own Kick account
- Webhook subscriptions persist until manually revoked

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Limited (notification API differences)

---

## 🐛 Troubleshooting

### "Kanal ID alınamadı" / "Channel ID not found"
- Ensure your Kick account has a channel created
- Check that OAuth scopes include `channel:read`

### No sound playing
- Check browser volume
- Click on page to initialize AudioContext (browser autoplay policy)
- Try different sound option

### Windows notifications not showing
- Enable notifications in browser permission popup
- Check Windows Settings > System > Notifications
- Ensure browser is allowed to send notifications

### Messages not appearing
- Verify webhook is enabled in Kick app settings
- Check `webhook_log.txt` for incoming events
- Ensure `sound_trigger_{channelId}.txt` files have write permissions (666)
- For multi-user setups, each channel gets its own file automatically

---

## 📝 Changelog

### v1.3.1 (Latest)
- ✅ **Emoji Support** - Kick emojis now render as images instead of plain text codes
- ✅ `webhook.php` updated to capture emote metadata
- ✅ `app.js` with `renderEmotes()` function for visual emoji display

### v1.3.0
- ✅ **User Isolation** - Each user only receives notifications for their own channel via `sound_trigger_{channelId}.txt` files
- ✅ **Online User Counter** - Real-time badge showing active listeners (👥 X) with 30-second heartbeat
- ✅ **get-messages.php** - New endpoint for clean channel-based message retrieval (no more 404 errors in console)
- ✅ **heartbeat.php** - Server-side tracking for active users with 2-minute timeout
- ✅ **Multi-user Ready** - Perfect for shared hosting - no message leakage between users

### v1.2.0
- ✅ **Modular Architecture** - CSS and JS separated into dedicated files
- ✅ **Translation System** - JSON-based translations in `translations/` folder
- ✅ **Callback Page** - Multi-language support for OAuth callback messages
- ✅ **Dynamic UI Updates** - Language changes apply without page refresh

### v1.1.0
- ✅ Smart Notification Delay feature (1-15 minutes configurable)
- ✅ Author signature and contact info in footer
- ✅ UI improvements with status indicators

### v1.0.0
- ✅ Initial release
- ✅ 6 customizable notification sounds
- ✅ Windows native notifications
- ✅ 9 language support
- ✅ OAuth 2.0 PKCE authentication
- ✅ Real-time chat monitoring

---

## 👨‍💻 Author

**Ahmed Mesud**

- 🌐 Website: [ahmedmesud.com](https://ahmedmesud.com)
- 📧 Email: [ahmedmesudb@gmail.com](mailto:ahmedmesudb@gmail.com)
- 💼 GitHub: [@AhmedMesud](https://github.com/AhmedMesud)

Feel free to reach out for questions, suggestions, or collaboration!

---

## 📄 License

This project is open source. Feel free to fork, modify, and distribute.

**Made with ❤️ for the streaming community**

---

## 🙏 Acknowledgments

- [Kick](https://kick.com) for providing the API
- The streaming community for feedback and feature requests
- All contributors and testers

---

**⭐ Star this repository if it helped your streaming journey!**
