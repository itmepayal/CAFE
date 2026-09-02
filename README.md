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
| Super Admin | `POST /auth/admin/login` | `POST /auth/admin/register` + `inviteToken` |
| Cafe Owner | `POST /auth/cafe-owner/login` | Yes — auto on first login, then `POST /cafes/register` |

**Mobile auth:** Send `Authorization: Bearer <accessToken>` header.  
**Web auth:** httpOnly cookies set automatically.

---

## Admin Endpoints (Figma screens)

| Screen | Endpoint |
|--------|----------|
| Login | `POST /auth/admin/login` `{ email, password }` |
| Register | `POST /auth/admin/register` `{ name, email, password, inviteToken }` |
| Dashboard | `GET /admin/dashboard` |
| Payments | `GET /admin/payments` |
| New Cafe Requests | `GET /admin/cafes/pending` |
| Cafe Request Details | `GET /admin/cafes/:id` |
| Approve / Decline | `PATCH /admin/cafes/:id/approve` / `reject` |
| All Orders | `GET /admin/orders` |
| All Users | `GET /admin/users` |
| Manage Cafe list | `GET /admin/cafes` |
| Open / Close cafe | `PATCH /admin/cafes/:id/toggle-open` |
| Show / Hide cafe (VISIBLE) | `PATCH /admin/cafes/:id/toggle-visibility` |
| Block / Unblock cafe | `PATCH /admin/cafes/:id/block` |
| Profile | `GET /auth/me` |

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
