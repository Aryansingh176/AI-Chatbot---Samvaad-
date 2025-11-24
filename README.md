# Project — Samvaad AI (Demo)

This repository is prepared for a college final-year project demo. It includes a React + Vite frontend and an Express + Mongoose backend.

Quick setup (Windows PowerShell)

1. Install dependencies

```powershell
cd "c:\Users\hp3\Desktop\ai integration\project-bolt-sb1-trmgcmbb (1)\project"
npm install
```

2. Configure environment

- Copy `.env.example` to `.env` (a `.env` already exists in this repo with local values).
- Ensure `MONGODB_URI` points to a reachable MongoDB instance. For local testing, install MongoDB locally or use Atlas.
- `JWT_SECRET` is already set to a strong value in `.env` for demo; rotate it for production.

3. Seed demo data (creates a demo user + conversation)

```powershell
npm run seed
```

Demo credentials created by the seeder:
- email: `student@college.edu`
- password: `password123`

4. Run both backend and frontend for the demo

```powershell
npm run dev:all
```

- Backend: http://localhost:5000 (API base: `/api`)
- Frontend (Vite): http://localhost:5174/ (it may choose a different port if 5173 is busy)

API health check

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

Notes & presentation tips

- The backend will serve APIs under `/api/*`. In production, you can `npm run build` and configure Express to serve the frontend `dist` directory.
- The repo includes Mongoose models in `server/models` and routes in `server/routes`.
- Keep `.env` secret — it's ignored by `.gitignore`.

If you'd like, I can also:
- Provision a free MongoDB Atlas cluster and place its connection string into your `.env`.
- Add a production-ready script that builds the frontend and serves static files from Express.

Production (single-port) build-and-serve

1. Build the frontend and serve it with the Express backend (single port):

```powershell
npm run build-and-serve
```

This runs `vite build` then starts the Express server with `SERVE_STATIC=true`, which tells Express to serve `dist` from the project root.

Notes:
- Before running `build-and-serve`, stop any running dev servers (it will conflict on ports).
- The server will still expose the API under `/api/*` and serve the frontend for other routes.

---

## ESM Auth System

This project includes a minimal, secure authentication system built with Node.js (ESM), Express, Mongoose, bcryptjs, and JWT.

### Features
- User signup with email/password
- User login with JWT token generation
- Protected routes using JWT middleware
- Secure password hashing (bcrypt with 12 salt rounds)
- MongoDB user storage with unique email constraint

### Setup

1. **Install dependencies** (already done if you ran `npm install`):
```powershell
npm install
```

2. **Configure environment variables** in `.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.wwp9ao9.mongodb.net/usersdb?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_strong_secret
PORT=5000
```

3. **Run the ESM auth server**:
```powershell
npm run auth:dev
```

The server will start on port 5000 (or the PORT in .env).

### API Endpoints

#### 1. **POST /api/auth/signup**
Create a new user account.

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"secret123\"}"
```

**Response (201):**
```json
{
  "message": "User created",
  "id": "507f1f77bcf86cd799439011"
}
```

**Error (400):**
```json
{
  "message": "User already exists"
}
```

#### 2. **POST /api/auth/login**
Login with existing credentials and receive a JWT token.

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"secret123\"}"
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):**
```json
{
  "message": "Invalid credentials"
}
```

#### 3. **GET /api/me**
Get current user information (requires authentication).

**Request:**
```bash
curl http://localhost:5000/api/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "test@example.com",
  "createdAt": "2025-11-20T10:30:00.000Z"
}
```

**Error (401):**
```json
{
  "message": "No token provided"
}
```

### Testing with PowerShell

**1. Signup:**
```powershell
$body = @{
    email = "test@example.com"
    password = "secret123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/signup" -Method POST -Body $body -ContentType "application/json"
```

**2. Login:**
```powershell
$body = @{
    email = "test@example.com"
    password = "secret123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.token
Write-Host "Token: $token"
```

**3. Get user info:**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/me" -Method GET -Headers $headers
```

### Security Notes
- Passwords are hashed with bcryptjs (12 salt rounds)
- JWT tokens expire after 1 hour
- MongoDB email field has unique constraint
- Sensitive errors are not exposed to clients
- Environment variables must be set before starting

### File Structure
```
server/
├── index.js              # ESM server entry point
├── models/
│   └── UserESM.js        # Mongoose User model
├── routes/
│   └── authESM.js        # Auth routes (signup, login, me)
└── middleware/
    └── authESM.js        # JWT verification middleware
```

---

## Chat API with Groq

Your app includes a fully functional chat endpoint powered by Groq's Llama model.

### Chat Endpoint

**POST** `/api/chat`

Accepts JSON:
```json
{
  "message": "Your question here"
}
```

Returns JSON:
```json
{
  "assistant": "AI response here"
}
```

### Testing the Chat API

**Using PowerShell:**
```powershell
$body = @{ message = "How do I make Groq act like a chatbot?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method POST -Body $body -ContentType "application/json"
```

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I make Groq act like a chatbot?"}'
```

### Environment Variables for Chat

Required in `.env`:
```env
GROQ_API_KEY=gsk_...              # Your Groq API key (already configured)
MONGODB_URI=mongodb+srv://...     # MongoDB connection (already configured)
JWT_SECRET=...                    # JWT secret (already configured)
PORT=5000                         # Server port (already configured)
```

### LLM Utility Helpers

Located in `utils/` folder for future extensibility:

- **`utils/groq.js`** - Helper functions for Groq API queries (retrieval/search)
- **`utils/llm.js`** - LLM abstraction layer with examples for OpenAI/Anthropic

To use OpenAI instead of Groq:
1. Install: `npm install openai`
2. Set env: `OPENAI_API_KEY=sk-...`
3. Uncomment OpenAI code in `utils/llm.js`

**Example OpenAI integration:**
```javascript
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Your message' }
  ],
  max_tokens: 300
});

const reply = completion.choices[0].message.content;
```

### Current Implementation

- **Model**: Llama 3.3 70B (via Groq)
- **Max tokens**: 300
- **Endpoint**: `/api/chat` (no auth required)
- **Features**: Multilingual support, conversation history, AI-powered responses

