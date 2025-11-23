# Backend Environment Variables

## 📋 Required Environment Variables

### Local Development

Create a `.env` file in the `Backend` directory:

```bash
# .env
PORT=3000
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

### Production (Render/Railway/Fly)

Set these environment variables in your hosting platform dashboard:

```bash
PORT=3000
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

## 🔑 Firebase Service Account

### Local Development
- Keep `serviceAccountKey.json` in the `Backend` directory
- Already in `.gitignore` (never commit this file!)

### Production

**Option 1: Upload as File (Render, Railway)**
- Upload `serviceAccountKey.json` directly in dashboard
- File will be available at runtime

**Option 2: Environment Variable (Fly.io)**
```bash
fly secrets set FIREBASE_SERVICE_ACCOUNT="$(cat serviceAccountKey.json)"
```

Then update `server.js`:
```javascript
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : await import('./serviceAccountKey.json', { with: { type: "json" } }).then(m => m.default);
```

## 📧 Gmail App Password Setup

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate new app password
5. Use this password (not your regular Gmail password)

## ⚠️ Security Notes

1. **Never commit `.env` or `serviceAccountKey.json`** to git
2. **Use app passwords**, not regular passwords
3. **Rotate credentials** periodically
4. **Limit Firebase permissions** to minimum required

