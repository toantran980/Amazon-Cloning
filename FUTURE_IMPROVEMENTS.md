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

- [X] Build succeeds (`npm run build` passing cleanly)
- [X] App runs without runtime errors in core flow
- [X] Basic unit tests pass (9/9 Vitest unit tests green)
- [X] Error boundary exists
- [X] Accessible labels added to key controls
- [X] Tailwind CSS v4 styling
- [X] Backend scaffolded with auth, cart, orders, products routes
- [X] Containerization ready (`Dockerfile`, `docker-compose.yml`, `nginx.conf`)

### Required for Real Production (not done yet)

- [x] ~~Payment provider integration (Stripe / PayPal) with server-side webhook verification (`POST /api/payments/create-intent` & `/webhook`)~~
- [x] ~~Rate limiting and brute-force protection on auth routes (`express-rate-limit`)~~
- [x] ~~Refresh token rotation with HttpOnly cookies (`POST /api/auth/refresh`)~~
- [ ] Production monitoring/observability (Sentry + health checks + centralized uptime logs)
- [x] ~~CI/CD pipeline with quality gates (GitHub Actions for lint/test/build)~~
- [ ] E2E tests for shopping, checkout, order tracking (Playwright integration)
- [x] ~~Security headers and CSP (`helmet`)~~
- [ ] Database automated backup & point-in-time recovery (PITR) strategy
- [x] ~~CartContext sync with API on login (guest cart auto-merge endpoint `/api/cart/merge`)~~


## Recommended Roadmap

### Phase 1: Deploy as Portfolio Demo ✅ Ready

- Deploy frontend to Vercel / Netlify
- Deploy backend to Railway / Render / Fly.io (PostgreSQL managed cluster)
- Set environment variables on hosting provider
- Production container deployments via Docker Compose or Kubernetes manifests

### Phase 2: Real Backend Foundation ✅ Done

> ⚠️ **Before running the backend:** Copy `server/.env.example` to `server/.env` and fill in your PostgreSQL connection string:
>
> ```env
> DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/amazon_clone"
> JWT_SECRET="replace-with-a-long-random-secret"
> PORT=5000
> NODE_ENV="development"
> ```
>
> You need a running PostgreSQL instance locally or a hosted one (e.g. [Railway](https://railway.app), [Supabase](https://supabase.com), [Neon](https://neon.tech)).

#### Phase 2 Follow-Up (May 17, 2026)

- ~~Prisma migration and introspection were validated locally from `server/`:~~
	- ~~`npm run db:migrate` succeeded~~
	- ~~`npx prisma db pull` succeeded (5 models introspected)~~
- ~~API smoke tests passed for products, auth, and cart authorization behavior.~~
- ~~Backend import/runtime issue in routes was fixed (`prismaClient` module resolution during `npm run dev`).~~

#### Phase 3 Progress: Transaction Safety & Cart Sync (May 17 - August 2026)

- ~~Order creation now computes trusted totals from DB product prices instead of client-sent `priceCents`.~~
- ~~Idempotent order creation is implemented and smoke-tested: same `Idempotency-Key` returns the existing order instead of creating a duplicate.~~
- ~~Verified flow: register → add cart item → place order → replay same order key.~~
- ~~Created API service layer and replaced direct localStorage business logic.~~
- ~~Added JWT auth (`POST /api/auth/register`, `POST /api/auth/login`).~~
- ~~Persisted users, carts, and orders in PostgreSQL via Prisma.~~
- ~~Added Zod runtime schema validation across API endpoints.~~
- ~~Implemented guest-to-account cart merging (`POST /api/cart/merge`) on login.~~

#### Phase 4 Progress: Reliability, Infrastructure & Security (August 2026 Update) ✅

- ~~**GitHub Actions CI Workflow**: Added `.github/workflows/ci.yml` running lint, vitest tests, and Vite build validation on all pushes and PRs.~~
- ~~**Security & Protection**: Added `helmet` security headers, custom CSP rules, and `express-rate-limit` rate limiters on sensitive auth routes (`/login`, `/register`).~~
- ~~**Structured JSON Logging**: Implemented Pino logger (`server/src/logger.ts`) for formatted, high-performance structured backend output.~~
- ~~**Caching & Pagination**: Integrated in-memory caching for products (`GET /api/products`) and orders pagination support (`GET /api/orders?page=1&limit=10`).~~
- ~~**Containerization & DevOps**: Added multi-stage `Dockerfile`, `docker-compose.yml` (PostgreSQL + Express + Nginx), and `nginx.conf` reverse-proxy setup for local containerized development and cloud readiness.~~
- ~~**UX Polish**: Added `DemoModeBanner` informing users about the non-production payment sandbox status.~~

---

### Upcoming Phases & Technical Specifications

### Phase 5: Payment Integration & Advanced Auth ✅ Done

#### 1. ~~Stripe PaymentIntents & Server-Side Verification~~
```
[Client] ---> POST /api/payments/create-intent ---> [Express Backend]
                                                            |
                                                   Calls Stripe API
                                                            v
[Client] <--- Returns clientSecret <---------------- [Stripe API]
   |
Executes Stripe.js confirmCardPayment()
   |
   +---> Webhook POST /api/payments/webhook --------> [Express Backend]
                                                            |
                                               Validates signature & status
                                                            v
                                               Creates Order in PostgreSQL
```
- ~~Endpoint `POST /api/payments/create-intent`: Accepts cart items, computes server-side trusted price, generates Stripe `PaymentIntent` (with demo sandbox intent fallback).~~
- ~~Endpoint `POST /api/payments/webhook`: Handles `payment_intent.succeeded` webhooks securely with signature verification (`stripe.webhooks.constructEvent`).~~
- ~~Atomic database updates: Transitions order state to paid upon verified webhook execution.~~

#### 2. ~~JWT Refresh Token Rotation Architecture~~
- ~~**AccessToken**: Short-lived (15 minutes), passed via `Authorization: Bearer <token>`.~~
- ~~**RefreshToken**: Long-lived (7 days), stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookie.~~
- ~~**Rotation Mechanism**: Every refresh request (`POST /api/auth/refresh`) issues a new access token AND a new refresh token, invalidating the old refresh token.~~
- ~~**Reuse Detection**: Tracks token families in PostgreSQL (`RefreshToken` table). If a revoked refresh token is re-used, invalidates all refresh tokens for that user immediately.~~

---

### Phase 6: Observability, E2E Testing & Performance ✅ Done

#### 1. ~~Automated E2E Test Suite (Playwright)~~
~~Set up `@playwright/test` for critical customer user journeys:~~
- ~~**E2E Shopping Flow**: Browse products → search filter → view product detail → add to cart.~~
- ~~**E2E Guest Checkout Flow**: Add items as guest → navigate to checkout → sign in → verify merged cart → complete simulated purchase.~~
- ~~**E2E Order History Flow**: View past orders → verify order status badge → navigate to tracking page.~~

#### 2. Health Monitoring & Observability Stack
- ~~**Health check probe (`GET /healthz`)**: Performs database ping and reports uptime for container orchestrator readiness probes.~~ ✅
- **Sentry Integration**: `@sentry/react` for frontend error boundary tracking; `@sentry/node` for unhandled Express endpoint exceptions. _(Sprint E)_

---

### Phase 7: Advanced E-Commerce Capabilities (5-7 days)

| Feature Area | Technical Approach & Architecture |
| :--- | :--- |
| **Product Search & Filtering** | PostgreSQL full-text search (`tsvector` index on title/description) or Algolia integration for fast fuzzy search, category facets, and price range filters. |
| **Product Reviews & Ratings** | Database models `Review` and `Rating` with user constraints (1 review per product per verified purchase). Average rating calculation trigger/cached field. |
| **Inventory Management** | Stock quantity tracking per SKU. Pessimistic lock during checkout flow (`SELECT ... FOR UPDATE`) to prevent double-selling limited stock items. |
| **Wishlist & Save for Later** | User `Wishlist` and `CartItem.savedForLater` boolean flag support in frontend UI and backend Prisma schema. |
| **Transactional Email** | Nodemailer / Resend service integration to dispatch automated HTML order confirmation receipts and tracking updates. |

---

### ✅ Completed Milestones

1. **Backend & Persistence**: Real Express backend, PostgreSQL database, Prisma ORM schema, JWT Authentication, Zod API validation.
2. **Checkout Safety**: Trusted server-side order calculation, idempotency key header handling, order status lifecycle management.
3. **Cart Integration**: Automated guest cart local-to-server sync (`POST /api/cart/merge`) on authentication.
4. **CI/CD Quality Gates**: GitHub Actions workflow (`.github/workflows/ci.yml`) enforcing lint checks, Vitest suite, and TypeScript build verification.
5. **Security & Hardening**: Helmet security headers, CSP rules, Express auth rate limiting, Pino structured logging.
6. **Container Infrastructure**: Production-ready multi-stage `Dockerfile`, `docker-compose.yml`, and `nginx.conf` reverse proxy configuration.
7. **Payment Gateway Integration (Sprint A)**: Stripe PaymentIntents endpoint (`POST /api/payments/create-intent`), demo payment intent sandbox fallback, and webhook signature verification (`POST /api/payments/webhook`).
8. **Auth Hardening & Token Rotation (Sprint B)**: HttpOnly, SameSite, Secure cookie-based refresh token rotation (`POST /api/auth/refresh`), token family breach mitigation, and silent frontend token renewal client wrapper.
9. **Container Health Readiness (Sprint D)**: Probe endpoint (`GET /healthz`) testing PostgreSQL connectivity via Prisma and reporting uptime and status.
10. **E2E Test Suite (Sprint C)**: Playwright test suite with 7/7 passing tests covering home page, search filtering, cart badge, auth flow, checkout navigation, and orders page routing. Fixed react-window pointer-event interception via JS dispatch.
11. **Quality Validation**: Frontend lint clean (0 errors), Server TypeScript clean (0 errors), 9/9 Vitest unit tests, 7/7 Playwright E2E tests passing.

### ⏳ Remaining Sprints

- [x] ~~**Sprint A**: Stripe PaymentIntents & Webhook handler implementation.~~
- [x] ~~**Sprint B**: HttpOnly cookie-based Refresh Token Rotation with token reuse detection.~~
- [x] ~~**Sprint C**: Playwright E2E test suite covering shopping and order workflows.~~
- [x] ~~**Sprint D**: Health monitoring & `/healthz` readiness probe integration.~~
- [ ] **Sprint E**: PostgreSQL full-text search, product review system, and transactional emails.

## Final Advice

If your goal is to showcase a feature-complete portfolio project, **deploy now** using the provided Docker compose or Railway configs.
Your app now features server-side payment processing foundation, HttpOnly token rotation security, health probes, and complete API cart sync.


