# Gravli Backend API

Gravli is a university café ordering platform connecting **Students**, **Cafe Owners**, and a **Super Admin**. This README documents the authentication flow, user roles, system flow, and the complete API reference — matched against the live Swagger docs.

**Version:** 1.0.0
**Base URL:** `https://cafe-6icu.onrender.com/api/v1`
**Swagger Docs:** `https://cafe-myg2.onrender.com/docs`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Roles](#2-user-roles)
3. [System Flow](#3-system-flow)
4. [API Reference](#4-api-reference)
   - [Auth](#auth)
   - [Cafe](#cafe)
   - [Menu](#menu)
   - [Owner](#owner)
   - [Cart](#cart)
   - [Orders](#orders)
   - [Complaints](#complaints)
   - [Super Admin](#super-admin)
5. [Schemas](#5-schemas)
6. [Notes & Known Gaps](#6-notes--known-gaps)

---

## 1. Authentication

Gravli does **not** use manual passwords. Authentication is fully delegated to **Google** and **Apple** sign-in, and the backend issues its own auth cookies/JWTs after verifying the provider token.

### Frontend Flow

1. User signs in via the Google or Apple SDK on the frontend.
2. Frontend receives a provider token (`token` for Google, `identityToken` for Apple).
3. Frontend sends that token to the backend via the provider-specific endpoint.
4. Backend verifies the token with the provider, then:
   - If the user doesn't exist yet, creates a new user with default role `student`.
   - If the user exists, logs them in and updates their session (`lastLoginAt`, `loginCount`).
5. Backend sets `accessToken` / `refreshToken` as auth cookies and also returns them in the response body.
6. Frontend sends the access token on subsequent requests (via cookie, or `Authorization: Bearer <token>` depending on your client setup).

### Example Response

```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "student"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

> **Note:** An earlier design doc referenced a single unified `POST /auth/social-login` endpoint. The actual implementation uses **two separate endpoints** — `/auth/google` and `/auth/apple` — instead of one generic endpoint with a `provider` field.

---

## 2. User Roles

| Role            | Created From                             | Description                                      |
| --------------- | ---------------------------------------- | ------------------------------------------------ |
| **Student**     | Frontend (default on signup)             | Browse cafés, order food, register a café        |
| **Cafe Owner**  | Auto-upgraded after Super Admin approval | Manages own café, menu, and orders               |
| **Super Admin** | Manually in database only                | Full system control — never created via frontend |

---

## 3. System Flow

### Student Flow

```
Login → View Cafes → Search/Open Cafe → View Menu → Add to Cart → Checkout → Payment → Track Order
```

### Cafe Registration Flow

```
Student clicks "Register Your Cafe"
   ↓
Submits Cafe Details (image, owner info, Aadhar, PAN, FSSAI, menu, bank details, UPI)
   ↓
Status = Pending
   ↓
Super Admin Reviews
   ↓
Approve → Role upgraded to Cafe Owner, Cafe becomes active
Reject  → User remains Student, no cafe access
```

### Cafe Owner Flow

```
Login → Cafe Owner Dashboard → Manage Menu (Add/Update/Delete) → Open/Close Cafe → View & Accept Orders → Update Order Status
```

### Super Admin Flow

```
Login → View Users (Students/Owners) → Approve/Reject/Block Cafes → Monitor Menus → Handle Complaints → Manage Auto-Cancel Orders
```

---

## 4. API Reference

Unless marked otherwise, all endpoints require:

```
Cookie: accessToken=<jwt_token>
```

### Auth

| Method | Endpoint        | Description                     | Auth Required |
| ------ | --------------- | ------------------------------- | ------------- |
| POST   | `/auth/google`  | Login/Signup with Google        | ❌ No         |
| POST   | `/auth/apple`   | Login/Signup with Apple         | ❌ No         |
| GET    | `/auth/me`      | Get current authenticated user  | ✅ Yes        |
| PATCH  | `/auth/profile` | Update logged-in user's profile | ✅ Yes        |
| POST   | `/auth/logout`  | Logout current user             | ✅ Yes        |

---

### Cafe

| Method | Endpoint          | Description            | Auth Required | Role    |
| ------ | ----------------- | ---------------------- | ------------- | ------- |
| GET    | `/cafes`          | Get all approved cafes | ✅ Yes        | Student |
| POST   | `/cafes/register` | Register a new cafe    | ✅ Yes        | Student |
| GET    | `/cafes/{id}`     | Get cafe details by ID | ✅ Yes        | Student |

---

### Menu

| Method | Endpoint               | Description                  | Auth Required | Role    |
| ------ | ---------------------- | ---------------------------- | ------------- | ------- |
| GET    | `/menus/{cafeId}`      | Get all menu items of a cafe | ✅ Yes        | Student |
| GET    | `/menus/item/{itemId}` | Get single menu item details | ✅ Yes        | Student |

---

### Owner

All owner routes operate on the logged-in owner's own café (resolved server-side from the JWT — no `cafeId` is passed in the URL).

| Method | Endpoint                                                   | Description                      | Auth Required | Role       |
| ------ | ---------------------------------------------------------- | -------------------------------- | ------------- | ---------- |
| GET    | `/owners/cafes/my-cafe`                                    | Get logged-in owner's cafe       | ✅ Yes        | Cafe Owner |
| PUT    | `/owners/cafes/my-cafe`                                    | Update cafe details              | ✅ Yes        | Cafe Owner |
| PATCH  | `/owners/cafes/my-cafe/toggle-open`                        | Open or close cafe               | ✅ Yes        | Cafe Owner |
| GET    | `/owners/cafes/my-cafe/menus`                              | Get all menu items of the cafe   | ✅ Yes        | Cafe Owner |
| POST   | `/owners/cafes/my-cafe/menus`                              | Create menu item                 | ✅ Yes        | Cafe Owner |
| PUT    | `/owners/cafes/my-cafe/menus/{itemId}`                     | Update menu item                 | ✅ Yes        | Cafe Owner |
| DELETE | `/owners/cafes/my-cafe/menus/{itemId}`                     | Delete menu item                 | ✅ Yes        | Cafe Owner |
| PATCH  | `/owners/cafes/my-cafe/menus/{itemId}/availability/toggle` | Toggle menu item availability    | ✅ Yes        | Cafe Owner |
| GET    | `/owners/cafes/my-cafe/orders`                             | Get all orders for the cafe      | ✅ Yes        | Cafe Owner |
| GET    | `/owners/cafes/my-cafe/orders/{orderId}`                   | Get order details                | ✅ Yes        | Cafe Owner |
| PATCH  | `/owners/cafes/my-cafe/orders/{orderId}/status`            | Update order status              | ✅ Yes        | Cafe Owner |
| GET    | `/owners/cafes/my-cafe/complaints`                         | Get logged-in owner's complaints | ✅ Yes        | Cafe Owner |

---

### Cart

| Method | Endpoint              | Description               | Auth Required | Role    |
| ------ | --------------------- | ------------------------- | ------------- | ------- |
| POST   | `/carts`              | Add item to cart          | ✅ Yes        | Student |
| GET    | `/carts`              | Get current cart          | ✅ Yes        | Student |
| DELETE | `/carts`              | Clear entire cart         | ✅ Yes        | Student |
| PATCH  | `/carts/{cartItemId}` | Update cart item quantity | ✅ Yes        | Student |
| DELETE | `/carts/{cartItemId}` | Remove item from cart     | ✅ Yes        | Student |

---

### Orders

Student-facing order endpoints (café-owner order actions live under [Owner](#owner) above).

| Method | Endpoint                         | Description                    | Auth Required | Role    |
| ------ | -------------------------------- | ------------------------------ | ------------- | ------- |
| POST   | `/orders`                        | Create a new order             | ✅ Yes        | Student |
| GET    | `/orders/my-orders`              | Get logged-in student's orders | ✅ Yes        | Student |
| POST   | `/orders/{orderId}/rate`         | Rate a completed order         | ✅ Yes        | Student |
| PATCH  | `/orders/{orderId}/cancellation` | Cancel an order                | ✅ Yes        | Student |

---

### Complaints

| Method | Endpoint      | Description        | Auth Required | Role            |
| ------ | ------------- | ------------------ | ------------- | --------------- |
| POST   | `/complaints` | Create a complaint | ✅ Yes        | Student / Owner |

> Retrieval is role-specific: students/owners view their own via [`/owners/cafes/my-cafe/complaints`](#owner) or admin endpoints; there is no generic "my complaints" route for students in the current API.

---

### Super Admin

| Method | Endpoint                                      | Description                               | Auth Required | Role        |
| ------ | --------------------------------------------- | ----------------------------------------- | ------------- | ----------- |
| GET    | `/admin/users`                                | Get all users                             | ✅ Yes        | Super Admin |
| GET    | `/admin/cafes/pending`                        | Get all pending cafe requests             | ✅ Yes        | Super Admin |
| PATCH  | `/admin/cafes/{id}/approve`                   | Approve cafe registration                 | ✅ Yes        | Super Admin |
| PATCH  | `/admin/cafes/{id}/reject`                    | Reject cafe registration                  | ✅ Yes        | Super Admin |
| PATCH  | `/admin/cafes/{id}/block`                     | Block or unblock a cafe                   | ✅ Yes        | Super Admin |
| GET    | `/admin/complaints`                           | Get all complaints                        | ✅ Yes        | Super Admin |
| GET    | `/admin/complaints/{id}`                      | Get complaint details by ID               | ✅ Yes        | Super Admin |
| PATCH  | `/admin/complaints/{id}/action`               | Update complaint status                   | ✅ Yes        | Super Admin |
| POST   | `/admin/orders/auto-cancel/trigger/{orderId}` | Manually trigger auto-cancel for an order | ✅ Yes        | Super Admin |

---

## 5. Schemas

Defined in Swagger — refer to the [live docs](https://cafe-myg2.onrender.com/docs) for full field-level definitions:

- `Cafe`
- `UpdateCafeStatus`
- `ErrorResponse`
- `SuccessResponse`
- `Complaint`
- `ComplaintAction`

> 💡 Recommend also documenting standalone schemas for `User`, `MenuItem`, `Order`, `CartItem`, and `Payment`, since these are used across multiple endpoints but aren't yet defined as reusable Swagger schemas.

---

## 6. Notes & Known Gaps

Compared against an earlier design spec, a few things worth flagging for the team:

| #   | Item                                                                                                                                                              | Status                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | Search cafés by name/keyword (`GET /cafes?search=`)                                                                                                               | 🔴 Not implemented                                                    |
| 2   | Dedicated file-upload endpoint for café registration docs (Aadhar, PAN, FSSAI, passbook, menu image)                                                              | 🔴 Not implemented                                                    |
| 3   | Payment order creation / verification / webhook                                                                                                                   | 🔴 Not implemented                                                    |
| 4   | Admin — view all menus across cafés (`GET /admin/menus`)                                                                                                          | 🟡 Not implemented                                                    |
| 5   | Filter users by role in admin panel (`GET /admin/users?role=`)                                                                                                    | 🟡 Not implemented                                                    |
| 6   | Order status notifications (push/email)                                                                                                                           | 🟡 Not implemented                                                    |
| 7   | Refresh-token session store / token blacklist for logout                                                                                                          | 🟢 Not implemented — logout currently only clears cookies client-side |
| 8   | Cafe owner dashboard analytics (orders, revenue)                                                                                                                  | 🟢 Not implemented                                                    |
| 9   | Auto-cancel trigger exists (`/admin/orders/auto-cancel/trigger/{orderId}`) — confirm there's a corresponding scheduled/automatic job, not just the manual trigger | 🟢 Verify                                                             |

---

_Generated from the Gravli design spec cross-checked against the live Swagger API (v1.0.0)._
