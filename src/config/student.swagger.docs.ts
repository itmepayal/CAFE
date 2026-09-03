/**
 * Student app API — Gravly Figma-aligned OpenAPI docs.
 * @see student.swagger.schemas.ts for reusable component schemas.
 */

/**
 * @swagger
 * tags:
 *   - name: Student Auth
 *     description: |
 *       Figma — Splash, Student Sign In / Sign Up (Google, Apple).
 *   - name: Student Discovery
 *     description: |
 *       Figma — Home (cafe list), Select Hostel, Order Food search.
 *   - name: Student Menu
 *     description: |
 *       Figma — Cafe menu screen with categories, Add (+/-), View Cart bar.
 *   - name: Student Cart
 *     description: |
 *       Figma — Your Cart (add/update items before checkout).
 *   - name: Student Orders
 *     description: |
 *       Figma — Checkout (delivery/pickup, address, payment), Active Orders, Online Orders, Order Details.
 *       Delivery fee: **₹29** when orderType is `delivery`.
 *   - name: Student Profile
 *     description: |
 *       Figma — Profile tab, Personal Information, My Orders link.
 *   - name: Student Socket
 *     description: |
 *       Real-time order tracking (Figma Track Order / status updates).
 */

/**
 * @swagger
 * /socket/student/connection:
 *   get:
 *     summary: Student Socket.IO events (documentation)
 *     tags: [Student Socket]
 *     description: |
 *       **Connect**
 *       ```js
 *       const socket = io(API_URL, { auth: { token: accessToken } });
 *       socket.emit("join:student", { userId });
 *       socket.emit("join:order", { orderId });
 *       ```
 *
 *       | Event | Figma Screen | Payload |
 *       |-------|--------------|---------|
 *       | `order:statusChanged` | Active Orders / Details | orderId, status, message |
 *       | `order:ready` | Order Details | orderId, pickupCode |
 *       | `order:cancelled` | Active Orders | orderId, reason |
 *     responses:
 *       200:
 *         description: See event table above
 */

export {};
