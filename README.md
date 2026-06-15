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
