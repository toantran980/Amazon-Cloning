# Amazon Clone — React + TypeScript

A full-featured Amazon storefront clone built with React 19, TypeScript, and Vite. Includes product browsing, a shopping cart, checkout flow, order tracking, and a real Express + PostgreSQL backend with JWT authentication.

## Tech Stack

### Frontend
- **React 19** with React Router v7
- **TypeScript** + Vite
- **Tailwind CSS v4** for styling (via `@tailwindcss/vite`)
- **Day.js** for date formatting
- **ESLint** for linting

### Backend
- **Express** (Node.js) REST API
- **PostgreSQL** database
- **Prisma** ORM with migrations and seeding
- **JWT** authentication (jsonwebtoken + bcryptjs)
- **Zod** for request validation

## Features

- 🛒 Product listing with search
- 🛍️ Shopping cart with quantity and delivery option management
- 💳 Checkout and payment summary
- 📦 Order history and package tracking
- 🔐 User authentication (register / sign in / sign out)
- 🌐 API-backed cart and orders when logged in, localStorage fallback when guest

## Project Structure

```
├── server/                  # Express backend
│   ├── prisma/
│   │   ├── schema.prisma    # DB models: User, Product, CartItem, Order
│   │   └── seed.ts          # Seeds all 42 products
│   └── src/
│       ├── middleware/auth.ts
│       ├── routes/          # auth, cart, orders, products
│       ├── index.ts         # Express entry point (port 3001)
│       └── prismaClient.ts
├── shared/
│   └── types.ts             # Shared TypeScript interfaces
└── src/                     # React frontend
    ├── components/          # CartItem, Header, PaymentSummary, ProductCard
    ├── context/             # AuthContext, CartContext
    ├── pages/               # Amazon, Checkout, Login, Orders, Tracking
    ├── services/            # api.ts, authService, cartService, orderService
    ├── data/                # Static product and delivery option data
    ├── types/               # Frontend type definitions
    └── utils/               # Money formatting, order helpers
```

## Getting Started

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

# 4. Seed products
npx prisma db seed

# 5. Start the API server
npm run dev        # http://localhost:3001
```

## Environment Variables

Create `server/.env` based on `server/.env.example`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/amazon_clone"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3001
CLIENT_ORIGIN="http://localhost:5173"
```

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in, returns JWT |
| GET | `/api/products` | — | List all products |
| GET | `/api/cart` | ✅ | Get cart items |
| POST | `/api/cart` | ✅ | Add item to cart |
| PATCH | `/api/cart/:productId` | ✅ | Update quantity/delivery |
| DELETE | `/api/cart/:productId` | ✅ | Remove item |
| DELETE | `/api/cart` | ✅ | Clear cart |
| GET | `/api/orders` | ✅ | Get order history |
| POST | `/api/orders` | ✅ | Place order (clears cart) |

## Scripts

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

### Backend (`cd server`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:generate` | Regenerate Prisma client |
