/**
 * Cafe Owner API documentation (Gravly Figma screens).
 * Loaded by swagger-jsdoc — no runtime exports needed.
 */

/**
 * @swagger
 * tags:
 *   - name: Cafe Owner Auth
 *     description: |
 *       Login & session for the cafe owner mobile app.
 *       **Flow:** Login → read `meta.redirectTo` → route to registration / pending / dashboard.
 *   - name: Cafe Owner Registration
 *     description: |
 *       5-step onboarding (Figma). Use draft APIs for step-by-step save, or single-shot POST /cafes/register.
 *   - name: Cafe Owner
 *     description: |
 *       Post-approval owner portal: Active Orders, Menu, Transactions, Profile.
 *       Requires role `cafe_owner` and cafe `status=approved`.
 *   - name: Owner Socket
 *     description: Real-time events for Active Orders dashboard.
 */

/**
 * @swagger
 * /auth/cafe-owner/login:
 *   post:
 *     summary: Cafe owner login (Google / Apple)
 *     description: |
 *       **Figma:** Splash → Login screen ("Register with Google" / "Register with Apple").
 *
 *       New users are created as `student` until admin approves the cafe registration.
 *       Response `meta` tells the app which screen to open next.
 *     tags: [Cafe Owner Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [provider]
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, apple]
 *               token:
 *                 type: string
 *                 description: Google ID token (required when provider=google)
 *               identityToken:
 *                 type: string
 *                 description: Apple identity token (required when provider=apple)
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { type: object }
 *                     accessToken: { type: string }
 *                 meta:
 *                   $ref: '#/components/schemas/CafeOwnerLoginMeta'
 *       401:
 *         description: Invalid OAuth token
 */

/**
 * @swagger
 * /cafes/register/draft:
 *   get:
 *     summary: Load registration draft
 *     description: |
 *       **Figma:** Resume onboarding after app restart.
 *       Returns saved steps 1–5 and `currentStep`.
 *     tags: [Cafe Owner Registration]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Draft loaded (empty steps if none saved)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/CafeRegistrationDraft'
 *   delete:
 *     summary: Clear registration draft
 *     tags: [Cafe Owner Registration]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Draft cleared
 */

/**
 * @swagger
 * /cafes/register/draft/{step}:
 *   put:
 *     summary: Save registration step (1–5)
 *     description: |
 *       **Figma step mapping:**
 *       | step | Screen | Body fields |
 *       |------|--------|-------------|
 *       | 1 | Cafe Details | cafeName, ownerName, description, mobile, email |
 *       | 2 | Location | street, area, landmark, city, pincode, latitude, longitude |
 *       | 3 | Finance | gstId (optional), upiId, accountHolderName, accountNumber, confirmAccountNumber, bankName, ifscCode |
 *       | 4 | Documents & Media | multipart — fssaiCertificate, gallery (min 2), layoutPhotos, aadhar/pan docs |
 *       | 5 | Final | registrationFeedback, socialMedia.instagram, socialMedia.facebook, socialMedia.website |
 *
 *       After step 5, call `POST /cafes/register/draft/submit`.
 *     tags: [Cafe Owner Registration]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: step
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cafeName: { type: string }
 *               ownerName: { type: string }
 *               description: { type: string }
 *               mobile: { type: string }
 *               email: { type: string }
 *               gstId: { type: string, description: "Optional GST ID" }
 *               registrationFeedback: { type: string }
 *               gallery:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               layoutPhotos:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               fssaiCertificate:
 *                 type: string
 *                 format: binary
 *                 description: Cafe/Food License Photo
 *     responses:
 *       200:
 *         description: Step saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string, example: "Step 3 saved successfully" }
 *                 data:
 *                   $ref: '#/components/schemas/CafeRegistrationDraft'
 */

/**
 * @swagger
 * /cafes/register/draft/submit:
 *   post:
 *     summary: Submit application (Figma Step 5 — Submit Application)
 *     description: |
 *       Validates all steps are complete, creates cafe with `status=pending`, clears draft.
 *       **Figma:** "Application Submitted!" success screen → `meta.redirectTo = pending_approval`.
 *     tags: [Cafe Owner Registration]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Application submitted for admin review
 *       400:
 *         description: Draft incomplete
 */

/**
 * @swagger
 * /cafes/my-cafe:
 *   get:
 *     summary: Registration status (pre-approval)
 *     description: |
 *       Use while `cafe_owner` role is not yet granted.
 *       Returns pending/rejected message or full cafe when approved.
 *     tags: [Cafe Owner Registration]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cafe or status object
 */

/**
 * @swagger
 * /owners/dashboard:
 *   get:
 *     summary: Active Orders home stats
 *     description: |
 *       **Figma:** Home header — cafe name, online toggle state, order counts, revenue.
 *       Pair with `GET /owners/cafes/my-cafe/orders?status=pending` for order cards.
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
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
 *     description: "**Figma:** Online/Offline switch on Active Orders screen."
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Toggle successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string, example: "Cafe is now open" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     isOpen: { type: boolean }
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/orders:
 *   get:
 *     summary: List orders (Active + History)
 *     description: |
 *       **Figma screens:**
 *       - Active Orders: `?status=pending` (also accepted, preparing, ready)
 *       - Order History: `?status=completed`
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
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
 *         description: Orders list
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
 *     summary: Accept order
 *     description: "**Figma:** Accept Order button on pending card."
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order accepted
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/orders/{orderId}/reject:
 *   patch:
 *     summary: Reject / Decline order
 *     description: "**Figma:** Decline button. Requires `reason` in body."
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
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
 *             required: [reason]
 *             properties:
 *               reason: { type: string, maxLength: 500 }
 *     responses:
 *       200:
 *         description: Order rejected
 */

/**
 * @swagger
 * /owners/transactions:
 *   get:
 *     summary: Transaction history (last 30 days)
 *     description: |
 *       **Figma:** Transaction History screen.
 *       Shows Order ID, customer name, date, amount (+₹), and **Settled** badge via `settlementStatus`.
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
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
 *         description: Transactions with summary
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
 *                   $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/menus:
 *   get:
 *     summary: Manage Menu — list items
 *     description: "**Figma:** Manage Menu tab with item list and availability toggles."
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
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
 *     summary: Add menu item
 *     description: "**Figma:** + FAB → Add Item modal (name + price)."
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [category, name, price]
 *             properties:
 *               name: { type: string, example: "Butter Toast" }
 *               price: { type: number, example: 40 }
 *               category: { type: string, example: "Nasta" }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Item created
 */

/**
 * @swagger
 * /owners/cafes/my-cafe/menus/{itemId}/availability/toggle:
 *   patch:
 *     summary: Toggle item in-stock / out-of-stock
 *     description: "**Figma:** Availability switch on each menu row."
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Availability toggled
 */

/**
 * @swagger
 * /owners/cafes/my-cafe:
 *   get:
 *     summary: Owner cafe profile
 *     description: |
 *       **Figma:** Profile tab.
 *       Combine with `GET /auth/me` for owner user info (name, profileImage).
 *     tags: [Cafe Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/OwnerCafeProfile'
 */

/**
 * @swagger
 * /socket/owner/connection:
 *   get:
 *     summary: Cafe Owner Socket.IO (documentation only)
 *     description: |
 *       **Connect**
 *       ```js
 *       const socket = io(API_URL, {
 *         auth: { token: accessToken },
 *         transports: ["websocket"],
 *       });
 *       ```
 *
 *       **On connect (`cafe_owner` + approved cafe)**
 *       1. Auto-joins `cafe:{cafeId}` room
 *       2. Receives `owner:connected`
 *       3. Receives `owner:dashboard:updated` snapshot
 *
 *       **Server → Client events**
 *       | Event | Figma Screen | When |
 *       |-------|--------------|------|
 *       | `owner:connected` | — | On socket connect |
 *       | `owner:dashboard:updated` | Active Orders header | Stats change |
 *       | `owner:order:new` | Active Orders | New student order |
 *       | `owner:order:updated` | Active Orders | Status change (accepted, preparing…) |
 *       | `owner:order:cancelled` | Active Orders | Order cancelled |
 *
 *       **Envelope:** `{ meta: { eventId, event, timestamp, version }, data }`
 *     tags: [Owner Socket]
 *     responses:
 *       200:
 *         description: See event table above
 */

export {};
