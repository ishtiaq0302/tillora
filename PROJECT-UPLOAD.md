# POS System — Deployment Guide (tillora.store on StackCP)

## Overview

```
GitHub Repository
       │
       ├──► StackCP (tillora.store)
       │         ├── Frontend  → React build (static files)
       │         └── Backend   → Node.js + Express + Prisma
       │
       └──► Neon (cloud PostgreSQL, free)
                 └── Database  → PostgreSQL (StackCP has no PostgreSQL)
```

---

## PART 1 — Set Up Cloud PostgreSQL Database (Neon)

StackCP only supports MySQL. Your project uses PostgreSQL, so you need a free cloud database.

### Step 1.1 — Create Neon Account and Database

1. Go to **https://neon.tech** and sign up (free, no credit card)
2. Click **New Project**
3. Set project name: `tillora-pos`
4. Choose region: **EU West** (closest to UK StackCP servers)
5. Click **Create Project**
6. On the dashboard, go to **Connection Details**
7. Copy the **Connection string** — it looks like:
   ```
   postgresql://username:password@ep-xxxxxx.eu-west-2.aws.neon.tech/neondb?sslmode=require
   ```
   **Save this — you will need it in multiple steps below.**

---

### Step 1.2 — Export Your Local PostgreSQL Database

Open a terminal on your local machine (WAMP is running):

```bash
cd C:\Program Files\PostgreSQL\<version>\bin

pg_dump -U postgres -d pos -F p -f C:\pos_backup.sql
```

> If asked for a password, enter your local PostgreSQL password (default is `postgres`).

This creates a full backup file at `C:\pos_backup.sql`.

---

### Step 1.3 — Import Your Data into Neon

**Option A — Command line (psql):**

```bash
psql "postgresql://username:password@ep-xxxxxx.eu-west-2.aws.neon.tech/neondb?sslmode=require" -f C:\pos_backup.sql
```

**Option B — Neon SQL Editor (easier, no tools needed):**

1. In Neon dashboard, click **SQL Editor**
2. Open `C:\pos_backup.sql` in Notepad
3. Copy all contents, paste into Neon SQL Editor
4. Click **Run**

---

## PART 2 — Prepare Backend for Production

### Step 2.1 — Update backend/.env

Open `backend/.env` and replace the DATABASE_URL line:

```env
PORT=5000

DATABASE_URL="postgresql://username:password@ep-xxxxxx.eu-west-2.aws.neon.tech/neondb?sslmode=require"

JWT_SECRET=pos-system-secret-key-jwt

PADDLE_SANDBOX=true
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
```

> Replace the DATABASE_URL with the connection string you copied from Neon in Step 1.1.

---

### Step 2.2 — Verify Prisma Connects to Neon

Run in your local terminal:

```bash
cd backend
npx prisma db pull
```

If it prints your schema successfully, the connection to Neon is working.

---

### Step 2.3 — Check backend/package.json Has a Start Script

Open `backend/package.json` and make sure there is a `start` script:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

> StackCP needs `npm start` to run your backend.

---

## PART 3 — Build the Frontend

### Step 3.1 — Set Production API URL

Open `frontend/.env` and set the backend URL to your live domain:

```env
VITE_API_URL=https://tillora.store/api
```

> If your backend runs on a subdomain (e.g. api.tillora.store), use that instead.

---

### Step 3.2 — Build the React App

```bash
cd frontend
npm run build
```

This creates a `frontend/dist/` folder with all static files ready to deploy.

---

## PART 4 — Deploy to StackCP (tillora.store)

### Step 4.1 — Push All Changes to GitHub

```bash
git add .
git commit -m "Production build and Neon database config"
git push origin master
```

---

### Step 4.2 — Deploy Frontend (Static Files)

1. Log in to **StackCP** → go to **File Manager** or use **FTP**
2. Navigate to `public_html/` (this is your web root for tillora.store)
3. Upload everything inside `frontend/dist/` into `public_html/`
   - The files to upload: `index.html`, `assets/` folder, etc.
4. Make sure `index.html` is directly inside `public_html/`

**For React Router to work**, create a `.htaccess` file inside `public_html/`:

```
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

---

### Step 4.3 — Deploy Backend (Node.js App)

1. In StackCP, find **Node.js** or **Web Applications** section
2. Create a new Node.js application:
   - **Domain:** tillora.store (or api.tillora.store if using subdomain)
   - **Application root:** `/backend` (or the path where you uploaded backend files)
   - **Startup file:** `server.js`
   - **Node version:** 18 or higher
3. Upload your `backend/` folder to the application root using File Manager or FTP
   - **Do NOT upload `node_modules/`** — StackCP will install them

4. In the Node.js app settings in StackCP, add these **Environment Variables**:

   ```
   DATABASE_URL = postgresql://username:password@ep-xxxxxx.eu-west-2.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET = pos-system-secret-key-jwt
   PORT = 5000
   PADDLE_SANDBOX = true
   PADDLE_API_KEY = your_paddle_api_key
   PADDLE_WEBHOOK_SECRET = your_paddle_webhook_secret
   ```

   > Set these in StackCP's UI — do NOT rely on the .env file on the server for secrets.

5. Click **Run NPM Install** (or SSH and run `npm install`)
6. Click **Start Application**

---

### Step 4.4 — Run Prisma Migrations on the Server

After the backend is deployed, run migrations so the database schema is up to date.

If StackCP gives you SSH access:

```bash
cd /path/to/backend
npx prisma migrate deploy
```

If no SSH access, you can run this locally while DATABASE_URL points to Neon:

```bash
cd backend
npx prisma migrate deploy
```

---

## PART 5 — Verify Everything Works

### Checklist

- [ ] Visit `https://tillora.store` — frontend loads
- [ ] Login page works — JWT auth connects to backend
- [ ] Products, Sales, and other pages load data from the database
- [ ] Check browser console for any API errors (wrong URL, CORS, etc.)
- [ ] Check StackCP Node.js app logs if backend is not responding

---

## PART 6 — CORS Fix (if API calls fail)

If you see CORS errors in the browser, open `backend/server.js` (or wherever CORS is configured) and make sure your domain is allowed:

```js
app.use(
  cors({
    origin: ["https://tillora.store", "http://localhost:5173"],
    credentials: true,
  }),
);
```

---

## PART 7 — GitHub Auto-Deploy (Optional)

If StackCP supports Git deployment (20i does):

1. In StackCP → **Git** or **Deployments**, connect your GitHub repository
2. Set branch to `master`
3. Set deploy path to `public_html/` for frontend, or backend app root for backend
4. Enable auto-deploy on push

For frontend, you still need to **build locally** (`npm run build`) and push the `dist/` files, OR set up a GitHub Action to build and push automatically.

---

## Quick Reference

| What               | Where                                        |
| ------------------ | -------------------------------------------- |
| Frontend files     | `public_html/` on StackCP                    |
| Backend files      | Node.js app root on StackCP                  |
| Database           | Neon (cloud PostgreSQL)                      |
| DATABASE_URL       | Set in StackCP Node.js environment variables |
| Build frontend     | `cd frontend && npm run build`               |
| Test DB connection | `cd backend && npx prisma db pull`           |
| Live site          | https://tillora.store                        |

---

## Troubleshooting

| Problem                   | Fix                                                              |
| ------------------------- | ---------------------------------------------------------------- |
| Site shows blank page     | Check `.htaccess` is in `public_html/`                           |
| API calls return 404      | Check backend Node.js app is running in StackCP                  |
| Database connection fails | Verify DATABASE_URL in StackCP env variables matches Neon string |
| CORS error in browser     | Add `https://tillora.store` to allowed origins in backend        |
| Prisma schema mismatch    | Run `npx prisma migrate deploy` pointing to Neon                 |
| Node modules missing      | Run NPM Install in StackCP Node.js app panel                     |
