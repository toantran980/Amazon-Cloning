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
- 💳 **Checkout** and payment summary
- 📦 **Order history** and package tracking with a status lifecycle (preparing → shipped → delivered)
- 🔐 **JWT authentication** — register / sign in / sign out
- 🔄 **Guest cart merge** — local guest cart is merged into the server cart on login
- 🌐 API-backed cart and orders when logged in, with localStorage fallback for guests
- 🧪 Unit tests (Vitest + Testing Library) and CI via GitHub Actions
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

### Frontend

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
npm run test        # Run unit tests (Vitest)
npm run test:watch  # Watch mode
```

The test suite covers the cart reducer, order helpers, and the debounced search hook.

The project is wired for **continuous integration** via GitHub Actions (see `.github/workflows/ci.yml`). On every push/PR to `main`, the pipeline runs:

1. `npm ci`
2. `npm run lint`
3. `npm run test`
4. `npm run build`

---

## 🔌 API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account (rate-limited) |
| POST | `/api/auth/login` | — | Sign in, returns JWT (rate-limited) |
| GET | `/api/products` | — | List all products |
| GET | `/api/cart` | ✅ | Get cart items |
| POST | `/api/cart` | ✅ | Add item to cart |
| PATCH | `/api/cart/:productId` | ✅ | Update quantity/delivery |
| DELETE | `/api/cart/:productId` | ✅ | Remove item |
| DELETE | `/api/cart` | ✅ | Clear cart |
| GET | `/api/orders` | ✅ | Get order history |
| POST | `/api/orders` | ✅ | Place order, clears cart, supports `Idempotency-Key` |

- `POST /api/orders` calculates order totals from **database product prices** instead of trusting client-sent pricing.
- Repeating `POST /api/orders` with the same `Idempotency-Key` returns the existing order instead of creating a duplicate.
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
| `npm run preview` | Preview the production build |

### Backend (`cd server`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:generate` | Regenerate Prisma client |

---

## 🗺️ Roadmap

See [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) for the production-readiness checklist and roadmap. The next major items are payment integration (Stripe/PayPal), refresh token rotation, monitoring/observability, and E2E tests.

## 📄 License

This project is for educational/portfolio purposes only.
