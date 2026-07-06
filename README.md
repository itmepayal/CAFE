# Gravli Backend API Documentation

**Version:** 1.0.0
**Base URL (Production):** `https://cafe-6icu.onrender.com/api/v1`
**API Docs (Swagger):** `https://cafe-myg2.onrender.com/docs`

Gravli is a university cafe ordering platform connecting **Students**, **Cafe Owners**, and a **Super Admin**. This document covers the full authentication flow, user roles, system flow, and a complete list of all API endpoints — including which are implemented and which are pending.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Roles](#2-user-roles)
3. [System Flow](#3-system-flow)
4. [API Reference](#4-api-reference)
   - [Auth APIs](#auth-apis)
   - [Cafe APIs](#cafe-apis)
   - [Menu APIs](#menu-apis)
   - [Owner APIs](#owner-apis)
   - [Cart APIs](#cart-apis)
   - [Order APIs](#order-apis)
   - [Complaint APIs](#complaint-apis)
   - [Super Admin APIs](#super-admin-apis)
5. [Pending / Missing APIs](#5-pending--missing-apis)
6. [Schemas](#6-schemas)

---

## 1. Authentication

Gravli does **not** use manual passwords. Authentication is fully delegated to **Google** and **Apple** sign-in.

### Frontend Flow

1. User signs in via Google or Apple SDK on the frontend.
2. Frontend receives: `name`, `email`, `profileImage`, `providerId`, `authToken`.
3. Frontend sends this data to the backend via the provider-specific endpoint (see [Auth APIs](#auth-apis)).
4. Backend checks if user exists:
   - If **not**, creates a new user with default role `student`.
   - If exists, logs them in.
5. Backend returns a **JWT token** + user object.
6. Frontend stores the token and sends it on every subsequent request:

```
Authorization: Bearer <jwt_token>
```

### Example Response

```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "role": "student"
  }
}
```

> **Note:** The original design doc referenced a single unified `POST /auth/social-login` endpoint. The actual implementation uses **two separate endpoints** — `/auth/google` and `/auth/apple` — instead of one generic endpoint with a `provider` field.

---

## 2. User Roles

| Role            | Created From                             | Description                                      |
| --------------- | ---------------------------------------- | ------------------------------------------------ |
| **Student**     | Frontend (default on signup)             | Can browse cafes, order food, register a cafe    |
| **Cafe Owner**  | Auto-upgraded after Super Admin approval | Manages own cafe, menu, and orders               |
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
Login → View Users (Students/Owners) → Approve/Reject/Block Cafes → Monitor Menus → Handle Complaints
```

---

## 4. API Reference

All endpoints below (except social login and cafe listing) require:

```
Authorization: Bearer <jwt_token>
```

### Auth APIs

| Method | Endpoint       | Description                    | Auth Required |
| ------ | -------------- | ------------------------------ | ------------- |
| POST   | `/auth/google` | Login/Signup with Google       | ❌ No         |
| POST   | `/auth/apple`  | Login/Signup with Apple        | ❌ No         |
| GET    | `/auth/me`     | Get current authenticated user | ✅ Yes        |
| POST   | `/auth/logout` | Logout current user            | ✅ Yes        |

---

### Cafe APIs

| Method | Endpoint          | Description            | Auth Required | Role    |
| ------ | ----------------- | ---------------------- | ------------- | ------- |
| GET    | `/cafes`          | Get all approved cafes | ✅ Yes        | Student |
| POST   | `/cafes/register` | Register a new cafe    | ✅ Yes        | Student |
| GET    | `/cafes/{id}`     | Get cafe details by ID | ✅ Yes        | Student |

---

### Menu APIs

| Method | Endpoint               | Description                  | Auth Required | Role    |
| ------ | ---------------------- | ---------------------------- | ------------- | ------- |
| GET    | `/menus/{cafeId}`      | Get all menu items of a cafe | ✅ Yes        | Student |
| GET    | `/menus/item/{itemId}` | Get single menu item details | ✅ Yes        | Student |

---

### Owner APIs

| Method | Endpoint                              | Description                      | Auth Required | Role       |
| ------ | ------------------------------------- | -------------------------------- | ------------- | ---------- |
| GET    | `/owners/cafes/my-cafe`               | Get logged-in owner's cafe       | ✅ Yes        | Cafe Owner |
| PUT    | `/owners/cafes/my-cafe`               | Update cafe details              | ✅ Yes        | Cafe Owner |
| PATCH  | `/owners/cafes/my-cafe/toggle-open`   | Open or close cafe               | ✅ Yes        | Cafe Owner |
| POST   | `/owners/menus`                       | Create menu item                 | ✅ Yes        | Cafe Owner |
| PUT    | `/owners/menus/{itemId}`              | Update menu item                 | ✅ Yes        | Cafe Owner |
| DELETE | `/owners/menus/{itemId}`              | Delete menu item                 | ✅ Yes        | Cafe Owner |
| PATCH  | `/owners/menus/{itemId}/availability` | Toggle menu item availability    | ✅ Yes        | Cafe Owner |
| GET    | `/owners/complaints/my-complaints`    | Get logged-in owner's complaints | ✅ Yes        | Cafe Owner |

---

### Cart APIs

| Method | Endpoint              | Description               | Auth Required | Role    |
| ------ | --------------------- | ------------------------- | ------------- | ------- |
| POST   | `/carts`              | Add item to cart          | ✅ Yes        | Student |
| GET    | `/carts`              | Get current cart          | ✅ Yes        | Student |
| DELETE | `/carts`              | Clear entire cart         | ✅ Yes        | Student |
| PATCH  | `/carts/{cartItemId}` | Update cart item quantity | ✅ Yes        | Student |
| DELETE | `/carts/{cartItemId}` | Remove item from cart     | ✅ Yes        | Student |

---

### Order APIs

| Method | Endpoint                   | Description                     | Auth Required | Role            |
| ------ | -------------------------- | ------------------------------- | ------------- | --------------- |
| POST   | `/orders`                  | Create a new order              | ✅ Yes        | Student         |
| GET    | `/orders/my-orders`        | Get logged-in student's orders  | ✅ Yes        | Student         |
| POST   | `/orders/{orderId}/rate`   | Rate a completed order          | ✅ Yes        | Student         |
| GET    | `/orders/cafe`             | Get all orders for owner's cafe | ✅ Yes        | Cafe Owner      |
| PATCH  | `/orders/{orderId}/status` | Update order status             | ✅ Yes        | Cafe Owner      |
| GET    | `/orders/{orderId}`        | Get order details by ID         | ✅ Yes        | Student / Owner |
| PATCH  | `/orders/{orderId}/cancel` | Cancel an order                 | ✅ Yes        | Student         |

---

### Complaint APIs

| Method | Endpoint      | Description        | Auth Required | Role            |
| ------ | ------------- | ------------------ | ------------- | --------------- |
| POST   | `/complaints` | Create a complaint | ✅ Yes        | Student / Owner |

---

### Super Admin APIs

| Method | Endpoint                        | Description                   | Auth Required | Role        |
| ------ | ------------------------------- | ----------------------------- | ------------- | ----------- |
| GET    | `/admin/users`                  | Get all users                 | ✅ Yes        | Super Admin |
| GET    | `/admin/cafes/pending`          | Get all pending cafe requests | ✅ Yes        | Super Admin |
| PATCH  | `/admin/cafes/{id}/approve`     | Approve cafe registration     | ✅ Yes        | Super Admin |
| PATCH  | `/admin/cafes/{id}/reject`      | Reject cafe registration      | ✅ Yes        | Super Admin |
| PATCH  | `/admin/cafes/{id}/block`       | Block or unblock a cafe       | ✅ Yes        | Super Admin |
| GET    | `/admin/complaints`             | Get all complaints            | ✅ Yes        | Super Admin |
| GET    | `/admin/complaints/{id}`        | Get complaint details by ID   | ✅ Yes        | Super Admin |
| PATCH  | `/admin/complaints/{id}/action` | Update complaint status       | ✅ Yes        | Super Admin |

---

## 5. Pending / Missing APIs

These are features mentioned in the product/design doc but **not yet present** in the current API implementation.

| #   | Feature                                                                            | Suggested Endpoint                       | Priority  |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------- | --------- |
| 1   | Search cafes by name/keyword                                                       | `GET /cafes?search=`                     | 🔴 High   |
| 2   | File upload for cafe registration (Aadhar, PAN, FSSAI, menu image, passbook photo) | `POST /uploads`                          | 🔴 High   |
| 3   | Payment order creation                                                             | `POST /payments/create-order`            | 🔴 High   |
| 4   | Payment verification                                                               | `POST /payments/verify`                  | 🔴 High   |
| 5   | Payment gateway webhook                                                            | `POST /payments/webhook`                 | 🔴 High   |
| 6   | Admin — view all menus across cafes                                                | `GET /admin/menus`                       | 🟡 Medium |
| 7   | Filter users by role in admin panel                                                | `GET /admin/users?role=student`          | 🟡 Medium |
| 8   | Student's own complaint history                                                    | `GET /students/complaints/my-complaints` | 🟡 Medium |
| 9   | Order status notifications (push/email)                                            | Event-based / `POST /notifications`      | 🟡 Medium |
| 10  | Refresh token or token-blacklist logic for logout                                  | Internal to `/auth/logout`               | 🟢 Low    |
| 11  | Confirm role auto-upgrade logic on cafe approval                                   | Internal to `/admin/cafes/{id}/approve`  | 🟢 Low    |
| 12  | Cafe owner dashboard analytics (orders, revenue)                                   | `GET /owners/dashboard/stats`            | 🟢 Low    |

---

## 6. Schemas

Defined in Swagger but not detailed here — refer to the live docs for full field-level schema definitions:

- `Cafe`
- `UpdateCafeStatus`
- `ErrorResponse`
- `SuccessResponse`
- `Complaint`
- `ComplaintAction`

> 💡 Recommend adding schemas for: `User`, `MenuItem`, `Order`, `CartItem`, and `Payment` since these are used across multiple endpoints but aren't currently documented as standalone schemas.

---

## Summary

| Category                       | Count                        |
| ------------------------------ | ---------------------------- |
| ✅ Total Implemented Endpoints | 33                           |
| ❌ Total Pending Features      | 12                           |
| 🔴 High Priority Pending       | 5 (Search, Upload, Payments) |

---

_Generated documentation based on Gravli App design spec + live Swagger API (v1.0.0)._
