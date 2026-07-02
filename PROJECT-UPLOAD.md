# POS System — Deployment Guide

## Architecture (What We Actually Use)

```
GitHub Repository (ishtiaq0302/tillora)
       │
       ├──► StackCP — tillora.store  (cPanel shared hosting)
       │         └── Frontend  → React build (static files in tillora/ folder)
       │
       ├──► Railway.app (free Node.js hosting)
       │         └── Backend   → Node.js + Express + Prisma
       │
       └──► Neon.tech (free cloud PostgreSQL)
                 └── Database  → PostgreSQL
```

> StackCP (cPanel) does NOT support Node.js. That is why the backend runs on Railway.

---

## CURRENT LIVE URLS

| Service  | URL                                          |
| -------- | -------------------------------------------- |
| Frontend | https://tillora.store                        |
| Backend  | https://tillora-production.up.railway.app    |
| Database | Neon → project: neondb (us-west-2)           |
| GitHub   | https://github.com/ishtiaq0302/tillora       |

---

## PART 1 — Set Up Database (Neon)

### Step 1.1 — Create Neon Account and Database

1. Go to **https://neon.tech** and sign up (free, no credit card)
2. Click **New Project** → give it a name
3. Choose a region close to your backend host
4. Click **Create Project**
5. Go to **Connection Details** → copy the connection string:
   ```
   postgresql://username:password@ep-xxxxxx.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
   Save this — you need it in every step below.

---

### Step 1.2 — Export Local PostgreSQL Database

Run in PowerShell (PostgreSQL is at `E:\postgresql\bin`):

```powershell
& "E:\postgresql\bin\pg_dump.exe" -h localhost -U postgres -d pos -Fc --no-owner --no-privileges -f "e:\wamp\www\pos\sql\pos_backup.dump"
```

Enter password: `postgres`

> `-Fc` creates a binary custom-format dump. Do NOT use plain SQL export from pgAdmin — it uses spaces instead of tabs and breaks COPY commands.

---

### Step 1.3 — Import Data into Neon

```powershell
& "E:\postgresql\bin\pg_restore.exe" --no-owner --no-privileges --clean --if-exists -d "YOUR_NEON_CONNECTION_STRING" "e:\wamp\www\pos\sql\pos_backup.dump"
```

No output = success.

---

### Step 1.4 — Verify Connection

```powershell
cd "e:\wamp\www\pos\backend"
npx prisma db pull
```

If it lists your models, the connection works.

---

## PART 2 — Set Up Backend (Railway)

### Step 2.1 — Update backend/.env

```env
# Local PostgreSQL (for local development)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos"

# Neon (cloud — used for production)
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

JWT_SECRET=pos-system-secret-key-jwt
PORT=5000
PADDLE_SANDBOX=true
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
```

---

### Step 2.2 — Deploy Backend to Railway

1. Go to **https://railway.app** → sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Set **Root Directory** to `backend`
5. Add Environment Variables in Railway dashboard:

```
DATABASE_URL = postgresql://neondb_owner:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET   = pos-system-secret-key-jwt
PORT         = 5000
PADDLE_SANDBOX = true
PADDLE_API_KEY = your_paddle_api_key
PADDLE_WEBHOOK_SECRET = your_paddle_webhook_secret
```

6. Click **Deploy** → wait for success
7. Go to **Settings → Domains → Generate Domain** → copy the URL
   e.g. `https://yourapp-production.up.railway.app`

---

## PART 3 — Set Up Frontend (StackCP — tillora.store)

### Step 3.1 — Update frontend/.env

```env
# Local development
# VITE_API_URL=http://localhost:5000/api

# Production (Railway backend URL)
VITE_API_URL=https://tillora-production.up.railway.app/api

VITE_PADDLE_SANDBOX=true
VITE_PADDLE_CLIENT_TOKEN=your_paddle_client_token
```

> `VITE_API_URL` must point to your Railway backend URL with `/api` at the end.

---

### Step 3.2 — Build the React App

```powershell
cd "e:\wamp\www\pos\frontend"
npm run build
```

This creates `frontend/dist/` with `index.html` and `assets/` folder.

---

### Step 3.3 — Upload to StackCP

1. Log in to **StackCP** → **File Manager**
2. Navigate to the **`tillora/`** folder (document root for tillora.store)
3. Delete old `index.html` and `assets/` folder inside `tillora/`
4. Upload from your local `frontend/dist/`:
   - `index.html` → into `tillora/`
   - `assets/` folder → into `tillora/`
5. Make sure `.htaccess` exists inside `tillora/` with:

```
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

6. Hard refresh browser: `Ctrl + Shift + R`

> **Important:** `softonxt.com` uses `public_html/`. `tillora.store` uses `tillora/`. Never mix them up.

---

## PART 4 — Push to GitHub

```powershell
cd "e:\wamp\www\pos"
git add .
git commit -m "your message here"
git push origin master
```

Railway auto-redeploys the backend on every push to master.

---

---

## HOW TO UPDATE AFTER CHANGES

### If you changed the DATABASE (new migration)

```powershell
cd "e:\wamp\www\pos\backend"
npx prisma migrate deploy
```

This runs pending migrations against Neon. Run this locally while `DATABASE_URL` in `backend/.env` points to Neon.

If you added a new model or changed the schema locally first:

```powershell
npx prisma migrate dev --name describe_your_change
npx prisma migrate deploy
```

---

### If you changed BACKEND FILES (Node.js / API)

Just push to GitHub — Railway auto-redeploys:

```powershell
cd "e:\wamp\www\pos"
git add .
git commit -m "Backend: describe your change"
git push origin master
```

Railway picks up the push and redeploys within ~1 minute. Check Railway dashboard for deploy status.

---

### If you changed FRONTEND FILES (React components, pages, styles)

**Step 1 — Rebuild:**
```powershell
cd "e:\wamp\www\pos\frontend"
npm run build
```

**Step 2 — Push to GitHub:**
```powershell
cd "e:\wamp\www\pos"
git add .
git commit -m "Frontend: describe your change"
git push origin master
```

**Step 3 — Upload new dist to StackCP:**
1. Go to StackCP → File Manager → `tillora/`
2. Delete old `assets/` folder and `index.html`
3. Upload new `frontend/dist/assets/` and `frontend/dist/index.html`
4. Hard refresh browser: `Ctrl + Shift + R`

---

### If you changed BOTH frontend and backend

1. Push to GitHub (backend auto-deploys via Railway)
2. Rebuild frontend and upload to StackCP manually

---

## Quick Reference

| What                  | Where / Command                                              |
| --------------------- | ------------------------------------------------------------ |
| Frontend files        | `tillora/` folder on StackCP                                 |
| Backend hosting       | Railway.app (auto-deploys from GitHub)                       |
| Database              | Neon.tech (cloud PostgreSQL)                                 |
| Local PostgreSQL bin  | `E:\postgresql\bin`                                          |
| Local database name   | `pos` (user: postgres, password: postgres)                   |
| Build frontend        | `cd frontend && npm run build`                               |
| Test DB connection    | `cd backend && npx prisma db pull`                           |
| Run migrations        | `cd backend && npx prisma migrate deploy`                    |
| Push to GitHub        | `git add . && git commit -m "msg" && git push origin master` |
| Live site             | https://tillora.store                                        |
| Backend API           | https://tillora-production.up.railway.app/api                |

---

## Troubleshooting

| Problem                        | Fix                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Site shows blank page          | Check `.htaccess` is in `tillora/` folder on StackCP                         |
| Login fails / API 404          | Check Railway backend is running — visit Railway dashboard                   |
| Still calling localhost:5000   | Rebuild frontend after updating `frontend/.env`, upload new dist to StackCP  |
| Database connection fails      | Verify `DATABASE_URL` in Railway environment variables matches Neon string   |
| CORS error in browser          | Add your domain to allowed origins in `backend/server.js`                    |
| Prisma schema mismatch         | Run `cd backend && npx prisma migrate deploy`                                |
| Old files still loading        | Hard refresh: `Ctrl + Shift + R` or clear browser cache                      |
| pg_restore errors on import    | Use `-Fc` format with `pg_dump`, never plain SQL export from pgAdmin         |
