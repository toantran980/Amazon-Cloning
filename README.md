# Amazon Clone — React + TypeScript

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)

A full-featured Amazon storefront clone built with **React 19, TypeScript, and Vite** on the frontend, and **Express + PostgreSQL + Prisma** on the backend. Includes product browsing, a shopping cart, checkout flow, order tracking, JWT authentication, and a guest-to-logged-in cart merge.

> ⚠️ **Demo mode** — this is a portfolio demonstration. No real payments are processed and your data is not stored.

---

## ✨ Features

- 🛒 **Product listing** with debounced search and a virtualized grid
- 🛍️ **Shopping cart** with quantity and delivery option management
- 💳 **Checkout** with a mock card payment step (demo-only, no real payments) and payment summary
- 📦 **Order history** and package tracking with a status lifecycle (preparing → shipped → delivered), including an in-app status control when signed in
- 🔐 **JWT authentication** — register / sign in / sign out
- 🔄 **Guest cart merge** — local guest cart is merged into the server cart on login
- 💾 **Save for later** — park cart items in a saved list and move them back to the cart anytime
- 🌐 API-backed cart and orders when logged in, with localStorage fallback for guests
- 🧪 Unit tests (Vitest + Testing Library), Playwright end-to-end tests, and CI via GitHub Actions
- 🚦 **Rate limiting** on auth routes to prevent brute-force attacks
- 🪪 **Idempotent order creation** to prevent duplicate orders

---

## 🧱 Tech Stack

### Frontend
- **React 19** with React Router v7
- **TypeScript** + Vite 8
- **Tailwind CSS v4** for styling (via `@tailwindcss/vite`)
- **Day.js** for date formatting
- **Vitest** + Testing Library for tests
- **ESLint** for linting

### Backend
- **Express** (Node.js) REST API
- **PostgreSQL** database
- **Prisma** ORM with migrations and seeding
- **JWT** authentication (jsonwebtoken + bcryptjs)
- **Zod** for request validation
- **express-rate-limit** for brute-force protection
- **Helmet** for security headers and CSP
- **Pino** for structured JSON logging

---

## 📁 Project Structure

```
├── server/                  # Express backend
│   ├── prisma/
│   │   ├── schema.prisma    # DB models: User, Product, CartItem, Order, OrderItem
│   │   └── seed.ts          # Seeds all 42 products
│   └── src/
│       ├── middleware/auth.ts
│       ├── routes/          # auth, cart, orders, products
│       ├── orderStatus.ts   # preparing → shipped → delivered lifecycle
│       ├── index.ts         # Express entry point (port 3001)
│       └── prismaClient.ts
├── shared/
│   └── types.ts             # Shared TypeScript interfaces
├── .github/workflows/       # GitHub Actions CI (lint → test → build)
└── src/                     # React frontend
    ├── components/          # CartItem, Header, PaymentSummary, ProductCard, DemoModeBanner
    ├── context/             # AuthContext, CartContext (with guest cart merge)
    ├── pages/               # Amazon, Checkout, Login, Orders, Tracking
    ├── services/            # api, authService, cartService, orderService, productService
    ├── data/                # Static product and delivery option data
    ├── types/               # Frontend type definitions
    └── utils/               # Money formatting, order helpers
```

---

## 🚀 Getting Started

### 🐳 Docker Quickstart (Recommended)

Run the complete app (PostgreSQL, Express API, and Nginx SPA) with a single command:

```bash
docker compose up --build
```

- **Frontend Application**: `http://localhost` (Port 80)
- **Express API Server**: `http://localhost:3001`
- **PostgreSQL Database**: `localhost:5432`

To stop and remove containers:
```bash
docker compose down
```

---

### Local Development (Without Docker)

#### Frontend

```bash
npm install
npm run dev        # http://localhost:5173
```

### Backend

```bash
# 1. Copy and fill in environment variables
cp server/.env.example server/.env

# 2. Install dependencies and generate Prisma client
cd server
npm install
npx prisma generate

# 3. Run migrations (requires DATABASE_URL in server/.env)
npx prisma migrate dev --name init

# 4. (Optional) Verify DB connection from server folder
npx prisma db pull

# 5. Seed products
npx prisma db seed

# 6. Start the API server
npm run dev        # http://localhost:3001
```

> **Important:** Run Prisma commands from `server/` only. Running `npx prisma ...` from the repo root can prompt to install a different Prisma version.

---

## 🔑 Environment Variables

Create `server/.env` based on `server/.env.example`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/amazon_clone?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3001
CLIENT_ORIGIN="http://localhost:5173"
```

If your DB password contains special URL characters (`@`, `&`, `#`, `/`, `%`), URL-encode the password portion in `DATABASE_URL`.

---

## 🧪 Testing

```bash
npm run test        # Frontend unit tests (Vitest)
npm run test:e2e    # Playwright E2E (static demo mode, hermetic)
cd server && npm test       # Server unit + DB integration tests
```

The frontend suite covers the cart reducer, order helpers, and the debounced search hook. The server suite covers order-total math, idempotency payload hashing, delivery-date estimation, order-status lifecycle, and shared-vs-server constant parity, plus DB-backed `supertest` tests (auth/refresh rotation, cart merge, stock limits, order placement) that self-skip unless `TEST_DATABASE_URL` points at a throwaway Postgres.

Additional browser coverage against the **real backend** is opt-in (files ending in `live.spec.ts`):

```bash
# 1. Start the backend with the same test database:
#    DATABASE_URL=postgresql://.../amazon_clone_test npm run dev  (cd server)
# 2. Run the live suite:
set E2E_LIVE=1
set TEST_DATABASE_URL=postgresql://.../amazon_clone_test
npx playwright test e2e/live.spec.ts
```

The project is wired for **continuous integration** via GitHub Actions (see `.github/workflows/ci.yml`). On every push/PR to `main`, the pipeline runs:

1. `npm ci`
2. `npm run lint`
3. `npm run test`
4. `npm run build`

The server CI job also runs `npm test` against a temporary Postgres service container (the DB-backed integration tests run there automatically).

---

## 🔌 API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account (rate-limited) |
| POST | `/api/auth/login` | — | Sign in, returns JWT (rate-limited) |
| GET | `/api/products` | — | List/search products (`?search=`, `?page=`, `?pageSize=`) |
| GET | `/api/cart` | ✅ | Get cart items |
| POST | `/api/cart` | ✅ | Add item to cart |
| PATCH | `/api/cart/:productId` | ✅ | Update quantity/delivery |
| DELETE | `/api/cart/:productId` | ✅ | Remove item |
| DELETE | `/api/cart` | ✅ | Clear cart |
| GET | `/api/orders` | ✅ | Get order history |
| GET | `/api/orders/:id` | ✅ | Get one order |
| POST | `/api/orders` | ✅ | Place order, clears cart, supports `Idempotency-Key` |
| PATCH | `/api/orders/:id/status` | ✅ | Update status (`preparing`/`shipped`/`delivered`) |

- `POST /api/orders` calculates order totals from **database product prices** instead of trusting client-sent pricing, decrements product stock, and computes the delivery estimate server-side.
- Repeating `POST /api/orders` with the same `Idempotency-Key` and matching payload returns the existing order (200); a changed payload with the same key returns **409**.
- Orders that would exceed available stock are rejected with **400** before any inventory changes.
- Auth routes are rate-limited (20 requests / 15 minutes) to prevent brute-force attacks.

---

## 🧑‍💻 Scripts

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run Playwright E2E (static demo mode) |
| `npm run preview` | Preview the production build |

### Backend (`cd server`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:generate` | Regenerate Prisma client |
| `npm test` | Run unit tests + DB integration tests (integration skipped without `TEST_DATABASE_URL`) |

---

## 🗺️ Roadmap

See [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) for the production-readiness checklist and roadmap. Refresh token rotation with HttpOnly cookies, auth rate limiting, Playwright E2E tests, server-side search, stock tracking, and CI/CD are implemented; remaining items are payment integration (Stripe/PayPal) and monitoring/observability.

## 📄 License

This project is for educational/portfolio purposes only.
