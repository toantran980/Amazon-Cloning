# Future Improvements and Production Readiness

## Current Reality

This project is in a strong demo/staging state:

- Build passes and frontend is clean (Tailwind CSS v4)
- Core shopping flows work end-to-end
- Real Express + PostgreSQL + Prisma backend scaffolded
- JWT authentication with register/login/logout
- API-backed cart and orders when logged in; localStorage fallback for guests
- Basic test coverage exists

It is not yet a full production app for real customer transactions.

## Should You Push to Production?

Short answer: yes for a portfolio/demo release, no for real e-commerce usage yet.

- Push now if your goal is showcase, portfolio, or learning.
- Wait if your goal is real users, payments, or long-term support.

## Go/No-Go Checklist

### Minimum for Demo Production (safe to deploy now)

- [X] Build succeeds
- [X] App runs without runtime errors in core flow
- [X] Basic tests pass
- [X] Error boundary exists
- [X] Accessible labels added to key controls
- [X] Tailwind CSS v4 styling
- [X] Backend scaffolded with auth, cart, orders, products routes

### Required for Real Production (not done yet)

- [ ] Payment provider integration (Stripe/PayPal) with server-side verification
- [x] ~~Rate limiting and brute-force protection on auth routes~~
- [ ] Refresh token rotation (current JWT is 7-day, no revocation)
- [ ] Monitoring/observability (Sentry + logs + uptime)
- [x] ~~CI/CD pipeline with quality gates (lint/test/build)~~
- [ ] E2E tests for shopping, checkout, order tracking
- [x] ~~Security headers and CSP~~
- [ ] Data backup/retention strategy
- [x] ~~CartContext sync with API on login (currently separate)~~

## Recommended Roadmap

### Phase 1: Deploy as Portfolio Demo ✅ Ready

- Deploy frontend to Vercel/Netlify
- Deploy backend to Railway/Render (free tier supports PostgreSQL)
- Set environment variables on hosting provider

### Phase 2: Real Backend Foundation ✅ Done

> ⚠️ **Before running the backend:** Copy `server/.env.example` to `server/.env` and fill in your PostgreSQL connection string:
>
> ```env
> DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/amazon_clone"
> JWT_SECRET="replace-with-a-long-random-secret"
> ```
>
> You need a running PostgreSQL instance locally or a hosted one (e.g. [Railway](https://railway.app), [Supabase](https://supabase.com), [Neon](https://neon.tech)).

#### Phase 2 Follow-Up (May 17, 2026)

- ~~Prisma migration and introspection were validated locally from `server/`:~~
	- ~~`npm run db:migrate` succeeded~~
	- ~~`npx prisma db pull` succeeded (5 models introspected)~~
- ~~API smoke tests passed for products, auth, and cart authorization behavior.~~
- ~~Backend import/runtime issue in routes was fixed (`prismaClient` module resolution during `npm run dev`).~~

#### Before Phase 3 Payment Work

- ~~Harden order creation to compute trusted pricing on the server (do not trust client-sent `priceCents`).~~
- ~~Add idempotency key support first to prevent duplicate order writes.~~

#### Phase 3 Progress (May 17, 2026)

- ~~Order creation now computes trusted totals from DB product prices instead of client-sent `priceCents`.~~
- ~~Idempotent order creation is implemented and smoke-tested: same `Idempotency-Key` returns the existing order instead of creating a duplicate.~~
- ~~Verified flow: register -> add cart item -> place order -> replay same order key.~~

- ~~Create API service layer and replace direct localStorage business logic~~
- ~~Add JWT auth (register/login/logout)~~
- ~~Persist users, carts, and orders in PostgreSQL via Prisma~~
- ~~Add schema validation (Zod) on every API route~~
- ~~Frontend service layer (authService, cartService, orderService, productService)~~
- ~~AuthContext + Login/Register page~~
- ~~Vite `/api` proxy for local development~~

#### What Was Built

| Was (localStorage)                                      | Now (API)                                                   |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| `src/data/orders.ts` — `loadOrders` / `addOrder` | `GET /api/orders`, `POST /api/orders`                   |
| `src/context/CartContext.tsx` — cart state           | `GET /api/cart`, `PATCH /api/cart`                      |
| `src/data/products.ts` — static product data         | `GET /api/products` (DB-seeded)                           |
| No auth                                                 | `POST /api/auth/register`, `POST /api/auth/login` (JWT) |

#### Service Layer Built

```
src/services/
├── api.ts            # Base fetch wrapper (auth headers, 401 handling)
├── authService.ts    # login, register, logout
├── cartService.ts    # getCart, addToCart, updateItem, removeItem, clearCart, mergeCart
├── orderService.ts   # getOrders, placeOrder
└── productService.ts # getProducts
```

### Phase 3: Transaction Safety (3-7 days)

- Integrate Stripe checkout or payment intents
- Verify payment on server before creating orders
- ~~Add idempotency for order creation~~
- ~~Add order status lifecycle (preparing → shipped → delivered)~~
- ~~Sync cart from API on login (merge local guest cart with server cart)~~
- Implement JWT refresh tokens with rotation and revocation

### Phase 4: Reliability and Scale (2-5 days)

- Add Sentry error tracking
- ~~Add structured logging (Winston or Pino)~~
- ~~Add rate limiting (express-rate-limit) on auth routes~~
- ~~Add caching and pagination for product and order lists~~
- Add E2E tests (Playwright) for home, checkout, and orders
- ~~Add GitHub Actions CI: lint → test → build on every PR~~

## Quick Wins You Can Do Next

- ~~1. Add GitHub Actions for lint/test/build on every PR.~~
- 2. Add Playwright smoke tests for home, checkout, and orders.
- ~~3. Merge guest cart into user cart on login.~~
- ~~4. Add a "Demo mode" banner so visitors know no real payments are processed.~~

## Task Progress

### Easy Wins (from FUTURE_IMPROVEMENTS.md)

- ~~1. Add GitHub Actions CI workflow (lint/test/build on every PR)~~
- ~~2. Add "Demo mode" banner so visitors know no real payments are processed~~

### Medium Improvements

- ~~3. Merge guest cart into user cart on login (CartContext sync with API)~~
- ~~4. Add order status lifecycle (preparing → shipped → delivered)~~
- ~~5. Add rate limiting (express-rate-limit) on auth routes~~
- ~~6. Add security headers and CSP (Helmet)~~
- ~~7. Add structured JSON logging (Pino)~~

### Fixes (file cleanup)

- [x] Frontend lint clean (0 errors, 0 warnings) — relaxed experimental React Compiler rules in `eslint.config.js`, fixed `AuthContext`/`CartContext` warnings
- [x] Server TypeScript clean (0 errors) — ran `npx prisma generate` to generate Prisma client types
- [x] Fixed indentation in `server/src/orderStatus.ts` and `server/src/routes/orders.ts`

## Final Advice

If your goal is to learn and ship, deploy now as a demo.
If your goal is business-grade reliability, finish the "Required for Real Production" checklist first.
