/**
 * @swagger
 * tags:
 *   name: Socket
 *   description: >
 *     Production Socket.IO events for the Super Admin portal.
 *     All server events use an envelope: `{ meta: { eventId, event, timestamp, version, reason? }, data }`.
 *     Connect with JWT via `auth.token` or `accessToken` cookie.
 *     `super_admin` users are auto-joined to the `admins` room and receive an initial snapshot.
 */

/**
 * @swagger
 * /socket/admin/connection:
 *   get:
 *     summary: Admin Socket.IO connection (documentation only)
 *     description: |
 *       **Connect**
 *       ```js
 *       const socket = io(API_URL, {
 *         auth: { token: accessToken },
 *         transports: ["websocket"],
 *       });
 *       ```
 *
 *       **On connect (super_admin only)**
 *       1. Auto-joins `admins` room
 *       2. Receives `admin:connected` (to this socket only)
 *       3. Receives initial `admin:dashboard:updated` snapshot
 *       4. Receives initial `admin:payment:update` summary
 *
 *       **Envelope shape (all events)**
 *       ```json
 *       {
 *         "meta": {
 *           "eventId": "uuid",
 *           "event": "admin:dashboard:updated",
 *           "timestamp": "2026-09-02T14:00:00.000Z",
 *           "version": 1,
 *           "reason": "order"
 *         },
 *         "data": { }
 *       }
 *       ```
 *
 *       **Server → Client events**
 *       | Event | Figma Screen | data |
 *       |-------|--------------|------|
 *       | `admin:connected` | — | `AdminConnectedPayload` |
 *       | `admin:dashboard:updated` | Dashboard | `{ stats }` |
 *       | `admin:cafe:request` | New Cafe Requests | `AdminCafeSocketPayload` |
 *       | `admin:cafe:updated` | Manage Cafe | `AdminCafeSocketPayload` |
 *       | `admin:payment:update` | Payments | `{ transaction, summary }` |
 *       | `admin:user:registered` | All Users | `AdminUserRegisteredPayload` |
 *       | `admin:order:*` | All Orders | order payload |
 *     tags: [Socket]
 *     responses:
 *       200:
 *         description: See event table above
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminSocketDocumentation'
 */

export {};
