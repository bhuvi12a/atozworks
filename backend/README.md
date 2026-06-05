# AtoZ Works Backend - API & Architecture Documentation

This is the production-grade, highly scalable Node.js + Express + TypeScript backend for **AtoZ Works**, an Urban Company–style home services marketplace.

---

## 🚀 Tech Stack
- **Runtime**: Node.js (v20)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database ORM**: PostgreSQL via Prisma ORM
- **In-Memory Cache & Lock**: Redis (ioredis)
- **Real-Time Communication**: Socket.io
- **Payment Processor**: Razorpay
- **Push Notification Gateway**: Firebase Cloud Messaging (FCM)
- **Containerization**: Docker & Docker Compose

---

## 📂 Project Directory Structure
```text
backend/
├── prisma/
│   ├── schema.prisma          # Database schemas & relationships
│   └── seed.ts                # Seed script for initial setup
├── src/
│   ├── config/                # DB, Redis, Razorpay, Firebase connections
│   ├── controllers/           # HTTP Controllers containing business logic
│   ├── middlewares/           # JWT authenticators, RBAC limits, error handlers
│   ├── routes/                # Endpoint router registries
│   ├── services/              # Matchmaking Engine, geolocation, FCM, Razorpay API integrations
│   ├── types/                 # Express Request types declarations
│   ├── utils/                 # Winston Logger, Custom AppError wrapper
│   └── index.ts               # Server startup bootstrapper
├── Dockerfile                 # Multi-stage production container setup
├── docker-compose.yml         # Container services orchestrator
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🛠️ Getting Started & Local Setup

### Prerequisite
Ensure Docker and Node.js are installed on your machine.

### Option 1: Quick Start with Docker (Recommended)
1. In the `/backend` directory, create a `.env` file matching `.env.example`.
2. Boot all services (PostgreSQL, Redis, Express API) with one command:
   ```bash
   docker-compose up --build -d
   ```
3. Run database migrations and seed default values:
   ```bash
   docker exec -it atozworks-api npx prisma migrate dev --name init
   docker exec -it atozworks-api npm run prisma:seed
   ```
The API Gateway will be available at `http://localhost:5000/api/v1`.

### Option 2: Running Locally
1. Start local Postgres and Redis instances.
2. Update the `DATABASE_URL` and `REDIS_HOST` variables in your backend `.env` file.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run migrations, generate prisma types, and seed records:
   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```
5. Run the dev environment:
   ```bash
   npm run dev
   ```

---

## 🧠 Core System Workflows

### 1. Geospatial Matchmaking Engine (`Haversine Formula`)
When a customer submits a booking, the system:
1. Translates the target address to latitude/longitude.
2. Filters all verified, KYC-approved providers who offer the requested category.
3. Validates scheduling calendars to confirm they are available for the day/time.
4. Performs a Haversine radius lookup check to ensure the customer location is inside the provider's active service area:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
5. Ranks qualified technicians using a composite scoring mechanism:
   - `Rating Score` (Weight: 40%)
   - `Proximity Score` (Weight: 30% - closer receives higher priority)
   - `Completed Jobs Experience` (Weight: 30%)
6. Sequentially dispatches notifications to the best-matching providers.

### 2. Double-Booking Protection (Redis Concurrency Locking)
When a provider accepts a job dispatch request, the system claims a lock key `booking_lock:{bookingId}` in Redis for 10 seconds. This guarantees that if multiple providers attempt to click "Accept" concurrently, only the first transaction is successfully written, and the others receive a graceful `409 Conflict` error.

---

## 📡 Live Socket.io Events Reference
Clients connect to the Socket server at `http://localhost:5000`.

| Event Name | Direction | Payload Schema | Description |
| :--- | :--- | :--- | :--- |
| `join_user` | Client -> Server | `userId: string` | Enters a private room to receive notifications. |
| `join_booking` | Client -> Server | `bookingId: string` | Enters a room to track live progress and GPS paths. |
| `update_location` | Provider -> Server | `{ providerId, bookingId, latitude, longitude }` | Provider broadcasts real-time GPS coordinates. |
| `location_changed` | Server -> Customer | `{ providerId, latitude, longitude, timestamp }` | Pushes updated coordinates to the customer. |
| `status_updated` | Server -> Room | `{ bookingId, status }` | Alerts changes in state (e.g., ARRIVED, COMPLETED). |

---

## 🔗 REST API Endpoint Specifications

All endpoints are prefixed with `/api/v1`.

### 🔑 Authentication Routes (`/auth`)

#### 1. Register User
- **POST** `/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "9876543210",
    "password": "SecurePassword123",
    "role": "CUSTOMER", // or "PROVIDER"
    "experience": 4 // optional for providers
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "User registered successfully."
  }
  ```

#### 2. User Login
- **POST** `/auth/login`
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    },
    "user": { "id": "uuid", "role": "CUSTOMER" }
  }
  ```

---

### 📍 Customer Routes (`/users`)
*Requires Bearer Token: `Authorization: Bearer <AccessToken>`*

#### 1. Add Saved Address
- **POST** `/users/addresses`
- **Request Body**:
  ```json
  {
    "houseNo": "42",
    "street": "High Street",
    "landmark": "Near Central Mall",
    "city": "Hosur",
    "state": "Tamil Nadu",
    "pincode": "635109",
    "latitude": 12.7408,
    "longitude": 77.8253,
    "isDefault": true
  }
  ```

#### 2. Get Saved Addresses
- **GET** `/users/addresses`
- **Response** (200 OK): Lists all coordinates, names, and defaults.

---

### 💼 Service Provider Routes (`/providers`)
*Requires Bearer Token. Restricted to `PROVIDER` role.*

#### 1. Define Service Area
- **POST** `/providers/service-area`
- **Request Body**:
  ```json
  {
    "latitude": 12.7408,
    "longitude": 77.8253,
    "serviceRadiusKm": 15
  }
  ```

#### 2. Update Availability
- **POST** `/providers/availability`
- **Request Body**:
  ```json
  {
    "schedule": [
      { "day": 1, "startTime": "09:00", "endTime": "18:00", "available": true },
      { "day": 2, "startTime": "09:00", "endTime": "18:00", "available": true }
    ]
  }
  ```

#### 3. Accept/Reject Booking
- **PATCH** `/providers/bookings/:bookingId/respond`
- **Request Body**:
  ```json
  {
    "action": "ACCEPT" // or "REJECT"
  }
  ```

---

### 📅 Booking Routes (`/bookings`)
*Requires Bearer Token.*

#### 1. Book Home Service
- **POST** `/bookings`
- **Request Body**:
  ```json
  {
    "serviceId": "service-uuid",
    "addressId": "address-uuid",
    "bookingDate": "2026-06-15",
    "bookingTime": "14:30",
    "couponCode": "WELCOME50"
  }
  ```
- **Response** (210 Created): Returns computed price breakdown invoice and initiates matching in the background.

#### 2. Update Booking Status (State Machine Flow)
- **PATCH** `/bookings/:bookingId/status`
- **Request Body**:
  ```json
  {
    "status": "ON_THE_WAY" // "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  }
  ```

---

### 💳 Payment Routes (`/payments`)

#### 1. Create Checkout Order
- **POST** `/payments/order`
- **Request Body**:
  ```json
  {
    "bookingId": "booking-uuid"
  }
  ```
- **Response** (200 OK): Returns Razorpay `orderId` and currency variables for the SDK.

#### 2. Confirm signature
- **POST** `/payments/verify`
- **Request Body**:
  ```json
  {
    "bookingId": "booking-uuid",
    "razorpayOrderId": "order_id",
    "razorpayPaymentId": "payment_id",
    "razorpaySignature": "signature"
  }
  ```

---

### 🛡️ Admin Routes (`/admin`)
*Requires Bearer Token. Restricted to `ADMIN` role.*

- **GET** `/admin/analytics`: Aggregates active users count, cancellation metrics, revenue totals, and top-selling services.
- **PATCH** `/admin/kyc/:providerId`: Approves provider documents and sets verification status.
- **POST** `/admin/refunds`: Initiates a Razorpay refund for cancelled bookings.
- **POST** `/admin/coupons`: Registers new coupons (`PERCENTAGE` / `FIXED`).
- **POST** `/admin/categories`: Inserts new service categories.
- **POST** `/admin/services`: Registers new service packages.
