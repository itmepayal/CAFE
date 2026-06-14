POST /cart
GET /cart
PATCH /cart/:cartItemId
DELETE /cart/:cartItemId
DELETE /cart

POST /orders
GET /orders/my-orders
GET /orders/:id
PATCH /orders/:id/cancel

GET /owner/orders
PATCH /owner/orders/:id/accept
PATCH /owner/orders/:id/reject
PATCH /owner/orders/:id/preparing
PATCH /owner/orders/:id/ready
PATCH /owner/orders/:id/completed 3. Payment Module (3 APIs)
POST /payments/create-order
POST /payments/verify
GET /payments/my-payments

4. Menu Categories (4 APIs)
   POST /categories
   GET /categories/:cafeId
   PUT /categories/:id
   DELETE /categories/:id
5. Cafe Owner Order Dashboard Summary (Optional but Useful)
   GET /owner/orders/stats
