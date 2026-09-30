/**
 * Cafe Owner API — Gravly Figma-aligned OpenAPI paths.
 * @see owner.swagger.schemas.ts for reusable component schemas.
 */

/**
 * @swagger
 * tags:
 *   - name: Cafe Owner Auth
 *     description: OAuth login and session for the cafe owner mobile app.
 *   - name: Cafe Owner Registration
 *     description: |
 *       5-step Figma onboarding via draft APIs.
 *       | Submit | Application Submitted | POST /cafes/register |
 *   - name: Cafe Owner
 *     description: Post-approval portal — orders, menu, transactions, profile.
 *   - name: Owner Socket
 *     description: Real-time Socket.IO events for the Active Orders screen.
 */

/**
 * @swagger
 * /auth/cafe-owner/login:
 *   post:
 *     summary: Login or sign up (Google / Apple)
 *     tags: [Cafe Owner Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - title: Google Login
 *                 type: object
 *                 required: [provider, token]
 *                 properties:
 *                   provider: { type: string, enum: [google] }
 *                   token:
 *                     type: string
 *                     example: "<GOOGLE_ID_TOKEN>"
 *                     description: |
 *                       Authentication credential used for Google login.
 *                       For provider=google, this field contains the Google ID Token verified by the backend.
 *                       Do not confuse this with an OAuth access token.
 *               - title: Apple Login
 *                 type: object
 *                 required: [provider, identityToken]
 *                 properties:
 *                   provider: { type: string, enum: [apple] }
 *                   identityToken:
 *                     type: string
 *                     example: "<APPLE_IDENTITY_TOKEN>"
 *                     description: |
 *                       Identity token used for Apple login.
 *                       For provider=apple, this field contains the Apple Identity Token verified by the backend.
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 meta:
 *                   $ref: '#/components/schemas/CafeOwnerLoginMeta'
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { type: object }
 *                     accessToken: { type: string }
 *                     portal: { type: string }
 *                     redirectTo: { type: string }
 *                     cafeStatus: { type: string }
 *                     cafeId: { type: string, nullable: true }
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Current user (Profile tab — owner info)
 *     tags: [Cafe Owner Auth]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: User profile
 */

/**
 * @swagger
 * /cafes/my-cafe:
 *   get:
 *     summary: Registration status (pre-approval)
 *     tags: [Cafe Owner Registration]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: pending | rejected message or full cafe
 */

/**
 * @swagger
 * /owners/dashboard:
 *   get:
 *     summary: Active Orders — header stats
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/CafeOwnerDashboard'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/toggle-open:
 *   patch:
 *     summary: Online / Offline toggle
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: isOpen flipped
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/orders:
 *   get:
 *     summary: List orders (active + history)
 *     description: |
 *       - Active Orders tab (Figma): `?active=true` — pending, accepted, preparing, ready
 *       - Single status: `?status=pending`
 *       - History: `?status=completed`
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *         description: All in-progress orders for Active Orders screen
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, preparing, ready, completed, rejected, cancelled]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OwnerOrder'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/orders/{orderId}/accept:
 *   patch:
 *     summary: Accept pending order
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estimatedReadyTime: { type: string, format: date-time }
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/orders/{orderId}/reject:
 *   patch:
 *     summary: Decline pending order
 *     description: Reason is optional — defaults to "Declined by cafe owner" when omitted.
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, maxLength: 500 }
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/orders/{orderId}/ready:
 *   patch:
 *     summary: Mark order ready for pickup
 *     description: Allowed from accepted or preparing (Figma "Ready for Pickup").
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/orders/{orderId}/preparing:
 *   patch:
 *     summary: Mark order as preparing (optional step)
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/orders/{orderId}/complete:
 *   patch:
 *     summary: Complete pickup order with pickup code
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupCode]
 *             properties:
 *               pickupCode: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 */

/**
 * @swagger
 * /owners/transactions:
 *   get:
 *     summary: Transaction history (All Time / date range)
 *     description: |
 *       Figma Transaction History — no `from`/`to` returns all-time data.
 *       Optional `from` and `to` (YYYY-MM-DD) filter by date range.
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: settlementStatus
 *         schema: { type: string, enum: [pending, settled] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 summary:
 *                   $ref: '#/components/schemas/OwnerTransactionSummary'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OwnerTransaction'
 *                 pagination:
 *                   $ref: '#/components/schemas/OwnerPagination'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/menus:
 *   get:
 *     summary: Manage Menu — list items
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OwnerMenuItem'
 *   post:
 *     summary: Add menu item (Figma + modal)
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name: { type: string, example: Butter Toast }
 *               price: { type: number, example: 30 }
 *               category: { type: string, example: General, description: Optional — defaults to General }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/menus/{itemId}:
 *   put:
 *     summary: Update menu item
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 *   delete:
 *     summary: Delete menu item
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/menus/{itemId}/availability/toggle:
 *   patch:
 *     summary: Toggle in-stock / out-of-stock
 *     description: No request body — flips current isAvailable value.
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe:
 *   get:
 *     summary: Cafe profile (Profile tab)
 *     description: Combine with GET /auth/me for owner name and avatar.
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 *   put:
 *     summary: Update cafe profile
 *     tags: [Cafe Owner]
 *     security: [{ bearerAuth: [] }, { cookieAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/OwnerSuccessResponse'
 */

/**
 * @swagger
 * /socket/owner/connection:
 *   get:
 *     summary: Owner Socket.IO events (documentation)
 *     tags: [Owner Socket]
 *     description: |
 *       Connect: `io(API_URL, { auth: { token } })`
 *
 *       | Event | Screen | Payload |
 *       |-------|--------|---------|
 *       | owner:connected | — | cafeId, rooms |
 *       | owner:dashboard:updated | Home header | CafeOwnerDashboard |
 *       | owner:order:new | Active Orders | OwnerOrder |
 *       | owner:order:updated | Active Orders | OwnerOrder |
 *       | owner:order:cancelled | Active Orders | orderId, reason |
 *     responses:
 *       200:
 *         description: See table above
 */

export {};
