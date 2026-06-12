2️⃣ Install Root Dependencies
npm install

3️⃣ Setup Frontend
cd frontend
npm install
npm run dev

4️⃣ Setup Backend
cd backend
npm install
nodemon server.js

🌍 Environment Variables
Backend .env

MONGO_URI=mongodb://localhost:27017/pos-system
JWT_SECRET=your_secret_key
PORT=5000

# Prisma Installation Process for Postgresql
npm install prisma @prisma/client
npx prisma init

# Change in .env file
DATABASE_URL="postgresql://postgres:password@localhost:5432/posdb"
JWT_SECRET=your_secret

🔐 Authentication System
Features:
User Registration
User Login
JWT Token Authentication
Protected Routes
Flow:

Register → Login → Token Generated → Stored in LocalStorage → Used in API Requests


🔑 API Endpoints
Register
POST /api/auth/register

Login
POST /api/auth/login

📦 API Service Layer
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;