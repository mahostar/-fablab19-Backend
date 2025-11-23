# FabLab19 Backend Server

Node.js/Express backend for the FabLab reservation system with Firebase Firestore and email notifications.

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then edit `.env` and fill in:

**SMTP Configuration (for email notifications):**
- `SMTP_HOST` - Your email provider's SMTP server (e.g., smtp.gmail.com)
- `SMTP_PORT` - Usually 587 for TLS
- `SMTP_USER` - Your email address
- `SMTP_PASSWORD` - Your email password or app-specific password

**Firebase Configuration:**
- All `FIREBASE_*` variables are already filled in `.env.example` with your project credentials
- Just copy them to your `.env` file (already done if you copied .env.example)

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
