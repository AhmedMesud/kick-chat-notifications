# 🔔 Kick Chat Notifications

Real-time sound and Windows notifications for Kick streamers. Never miss a chat message again!

**🌐 Available in 9 Languages**: English, Español, Deutsch, Türkçe, العربية, Português, 中文, हिंदी, Русский

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

### 🔒 Security
- OAuth 2.0 PKCE flow for secure authentication
- `CLIENT_SECRET` excluded from GitHub (via `.gitignore`)
- `.htaccess` protection for sensitive files
- Token-based session management

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
touch sound_trigger.txt webhook_log.txt
chmod 666 sound_trigger.txt webhook_log.txt
```

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
- **Frontend**: Vanilla JavaScript, Web Audio API
- **Backend**: PHP (cURL for API requests)
- **Authentication**: OAuth 2.0 PKCE
- **Real-time**: Webhook-based (Kick Events API) + File polling

### API Endpoints Used
- `GET /public/v1/users` - Get user info
- `GET /public/v1/channels` - Get channel info
- `POST /public/v1/events/subscriptions` - Subscribe to chat events
- Webhook endpoint for `chat.message.sent` events

---

## 📁 File Structure

```
kick-oauth-final/
├── kick-oauth-chat.html    # Main application UI
├── kick-callback.php       # OAuth callback handler
├── token-exchange.php      # OAuth token exchange
├── get-user-channel.php    # Fetch user's channel info
├── events-subscribe.php    # Subscribe to Kick events
├── webhook.php             # Webhook endpoint for chat messages
├── index.php               # Redirect to main page
├── .htaccess               # Security configuration
├── config.php              # ⚠️ NOT IN GIT - Your secrets
├── sound_trigger.txt       # ⚠️ Temporary message file
├── webhook_log.txt         # ⚠️ Webhook debug log
└── README.md               # This file
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
- Ensure `sound_trigger.txt` has write permissions

---

## 📝 Changelog

### v1.0.0 (Current)
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
