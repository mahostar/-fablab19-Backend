# FabLab19 Backend Server

Node.js/Express backend for the FabLab reservation system with Firebase Firestore and email notifications.

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

**🚀 QUICK SETUP (Windows):**

Double-click `create-env.bat` or run in PowerShell:
```powershell
.\create-env.ps1
```

This creates a `.env` file with **SendGrid** pre-configured!

**📝 Manual Setup:**

Copy `.env.example` to `.env` or see `CREATE_ENV.md` for step-by-step instructions.

**⚠️ IMPORTANT:** Open `.env` and update `SMTP_FROM` with your verified SendGrid email!

**SMTP Configuration (for email notifications):**
- `SMTP_HOST=smtp.sendgrid.net` ✅ Already set
- `SMTP_PORT=587` ✅ Already set
- `SMTP_USER=apikey` ✅ Already set
- `SMTP_PASS=<your-sendgrid-api-key>` ✅ Already set
- `SMTP_FROM=<your-verified-email>` ⚠️ **YOU MUST UPDATE THIS!**

**Firebase Configuration:**
- Uses `serviceAccountKey.json` for local development (already in folder)
- For production, set `FIREBASE_*` environment variables (see `ENV_SETUP.md`)

### 3. Run the Server

```bash
npm start
```

The server will run on `http://localhost:3000` (or the port specified in your `.env` file).

## ⚠️ IMPORTANT - Security

The `.env` file contains sensitive credentials and is **NOT** pushed to GitHub (it's in `.gitignore`).

## 📝 Quick Answers

**Q: What is `PUBLIC_API_URL`?**
A: That's for the **FRONTEND** `.env` file (not backend). It tells your frontend app where to send API requests. Example: `PUBLIC_API_URL=http://localhost:3000/api` for local development.

**Q: Do I need the frontend domain in backend `.env`?**
A: No. The backend doesn't need to know the frontend URL.

## 🚀 Deployment

For production:
- Use your hosting platform's environment variable settings (Render, Railway, Heroku, etc.)
- Never commit `.env` files to version control
- All sensitive data is in `.env` - just set these on your hosting platform
