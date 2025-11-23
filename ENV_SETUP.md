# Backend Environment Variables

## 📋 Required Environment Variables

### Local Development

Create a `.env` file in the `Backend` directory:

```bash
# .env
PORT=3000

# SendGrid HTTP API Configuration
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=your-verified-email@domain.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Production (Render/Railway/Fly)

**⚠️ RENDER BLOCKS SMTP PORTS! Use SendGrid HTTP API instead:**

Set these environment variables in your hosting platform dashboard:

```bash
PORT=3000

# SendGrid HTTP API (NOT SMTP - SMTP is blocked on Render free tier!)
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=your-verified-email@domain.com

# Frontend URL
FRONTEND_URL=https://your-frontend-url.netlify.app
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

## 📧 SMTP Provider Setup

### Option 1: Gmail (Free, but may have issues on some hosting platforms)

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate new app password
5. Use this password (not your regular Gmail password)

**Configuration:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Option 2: SendGrid (Recommended for Production)

1. Sign up at [sendgrid.com](https://sendgrid.com) (100 emails/day free)
2. Create an API key in Settings → API Keys
3. Verify your sender email

**Configuration:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=your-verified-email@domain.com
```

### Option 3: Brevo (formerly Sendinblue) (Free tier: 300 emails/day)

1. Sign up at [brevo.com](https://brevo.com)
2. Go to SMTP & API → SMTP
3. Get your SMTP credentials

**Configuration:**
```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-email@domain.com
SMTP_PASS=your-brevo-smtp-key
SMTP_FROM=your-brevo-email@domain.com
```

### Option 4: Resend (Modern, Developer-Friendly)

1. Sign up at [resend.com](https://resend.com) (100 emails/day free)
2. Add and verify your domain
3. Create an API key

**Configuration:**
```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=your-resend-api-key
SMTP_FROM=noreply@yourdomain.com
```

## ⚠️ Security Notes

1. **Never commit `.env` or `serviceAccountKey.json`** to git
2. **Use app passwords**, not regular passwords
3. **Rotate credentials** periodically
4. **Limit Firebase permissions** to minimum required

