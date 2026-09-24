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

- 🛒 **Product listing** with debounced search, highlighted matches, a results toolbar (sort by price/rating, "in stock only"), and a virtualized grid
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
│   │   └── seed.ts          # Seeds 42 products + a demo user
│   └── src/
│       ├── middleware/auth.ts
│       ├── routes/          # auth, cart, orders, products
│       ├── orderStatus.ts   # preparing → shipped → delivered lifecycle
│       ├── index.ts         # Express entry point (port 3001)
│       └── prismaClient.ts
├── shared/
│   └── types.ts             # Shared TypeScript interfaces
├── e2e/                     # Playwright specs (static-demo + opt-in live)
├── .github/workflows/       # GitHub Actions CI (lint → test → build → e2e)
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

# 5. Seed products and a demo user
npx prisma db seed

# Demo login (created by the seed):
#   email:    demo@example.com
#   password: password123

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
npm run test:server # Server unit + DB integration tests
```

The frontend suite covers the cart reducer, order helpers, the debounced search hook, product filtering/sorting, and search match highlighting. The server suite covers order-total math, idempotency payload hashing, delivery-date estimation, order-status lifecycle, and shared-vs-server constant parity, plus DB-backed `supertest` tests (auth/refresh rotation, cart merge, stock limits, order placement) that self-skip unless a throwaway Postgres is reachable — locally `TEST_DATABASE_URL` is derived automatically from `DATABASE_URL` (e.g. `amazon_clone` → `amazon_clone_test`).

Additional browser coverage against the **real backend** is opt-in (files ending in `live.spec.ts`). Start the backend pointed at a throwaway database, then run:

```bash
# 1. Start the backend with the test database:
#    DATABASE_URL=postgresql://.../amazon_clone_test npm run dev  (cd server)
# 2. Run the live suite (requires E2E_LIVE + a matching TEST_DATABASE_URL):
set TEST_DATABASE_URL=postgresql://.../amazon_clone_test
npm run test:e2e:live
```

The live suite covers search, product detail, add-to-cart, guest checkout with the demo card, save-for-later, and signed-in order status control. It runs serially on a single worker because every test shares the same throwaway database.

The project is wired for **continuous integration** via GitHub Actions (see `.github/workflows/ci.yml`). On every push/PR to `main`, the pipeline runs:

1. `npm run lint`, `npm run test`, `npm run build` (frontend)
2. `npm test` against a temporary Postgres service container (server)
3. Hermetic Playwright E2E with cached browsers
4. **Full-stack live E2E**: a built backend is started against the Postgres service and `e2e/live.spec.ts` runs end-to-end (tests are skipped if `E2E_LIVE` isn't set, so this job is the only one that exercises them)

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

### Frontend (repo root)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run dev:server` | Start the Express API (alias for `npm run dev --prefix server`) |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:server` | Run server tests (alias for `cd server && npm test`) |
| `npm run test:e2e` | Run Playwright E2E (static demo mode) |
| `npm run test:e2e:live` | Run Playwright live E2E (requires E2E_LIVE + TEST_DATABASE_URL) |
| `npm run preview` | Preview the production build |

### Backend (`cd server`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed 42 products + the demo user |
| `npm run db:generate` | Regenerate Prisma client |
| `npm test` | Run unit tests + DB integration tests (integration skipped without a reachable Postgres) |

---

## 🗺️ Roadmap

See [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) for the production-readiness checklist and roadmap. Refresh token rotation with HttpOnly cookies, auth rate limiting, Playwright E2E tests (hermetic + live backend), server-side search with a results toolbar, stock tracking, save-for-later, GET retry-once, and CI/CD (including a full-stack live E2E job) are implemented; remaining items are payment integration (Stripe/PayPal) and monitoring/observability.

## 📄 License

This project is for educational/portfolio purposes only.
