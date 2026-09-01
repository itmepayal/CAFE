# Cafe Mart Backend

Production-ready API for the Cafe Mart university café ordering platform.

**Base URL:** `/api/v1`  
**Health:** `GET /health`  
**Swagger (dev only):** `GET /docs`

---

## Features

- Google & Apple OAuth (student, cafe owner, super admin)
- Invite-only super admin registration
- Cafe registration + admin approval workflow
- Orders, cart, payments (Cashfree), real refunds
- Socket.IO real-time order updates (JWT authenticated)
- Session-based refresh tokens with logout revocation
- Helmet, rate limiting, Zod validation, Winston logging

---

## Quick Start

```bash
cp .env.example .env   # create and fill values
npm install
npm run dev
```

```bash
npm run build
npm start
```

```bash
npm test
```

---

## Required Environment Variables

```env
NODE_ENV=development
PORT=8000
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES=30d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
CLIENT_URL=http://localhost:3000
API_BASE_URL=http://localhost:8000
SERVER_URL=http://localhost:8000
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_ENV=SANDBOX
ADMIN_BOOTSTRAP_TOKEN=   # first super_admin only
```

---

## Auth Endpoints

| Role | Endpoint | Sign-up on screen? |
|------|----------|-------------------|
| Student | `POST /auth/google`, `POST /auth/apple` | Yes — auto on first login |
| Super Admin | `POST /auth/admin/login` | Yes — auto on first login |
| Cafe Owner | `POST /auth/cafe-owner/login` | Yes — auto on first login, then `POST /cafes/register` |

**Mobile auth:** Send `Authorization: Bearer <accessToken>` header.  
**Web auth:** httpOnly cookies set automatically.

---

## Docker

```bash
docker build -t cafe-mart-backend .
docker run -p 8000:8000 --env-file .env cafe-mart-backend
```

---

## Production Checklist

- [x] Bearer + cookie authentication
- [x] Cashfree payment + real refund API
- [x] Server-side pricing (no client discount)
- [x] Zod validation on auth, orders, carts
- [x] Socket JWT auth
- [x] Rate limiting + Helmet
- [x] CI pipeline (GitHub Actions)
- [x] Docker support
