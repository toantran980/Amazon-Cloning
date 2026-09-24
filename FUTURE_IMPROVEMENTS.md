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
- [X] Unit tests pass (41/41 Vitest tests green, incl. cart reducer, order helpers, product filter/sort, highlight)
- [X] Error boundary exists
- [X] Accessible labels added to key controls
- [X] Tailwind CSS v4 styling
- [X] Backend scaffolded with auth, cart, orders, products routes
- [X] Containerization ready (`Dockerfile`, `docker-compose.yml`, `nginx.conf`)

### Required for Real Production (not done yet)

- [ ] Payment provider integration (Stripe / PayPal) — **removed from the codebase**: `POST /api/payments/create-intent` & `/webhook` were deleted; checkout is now a simulated demo with server-trusted totals.
- [x] ~~Rate limiting and brute-force protection on auth routes (`express-rate-limit`)~~
- [x] ~~Refresh token rotation with HttpOnly cookies (`POST /api/auth/refresh`)~~
- [ ] Production monitoring/observability (Sentry + health checks + centralized uptime logs)
- [x] CI/CD pipeline with quality gates (`.github/workflows/ci.yml`: frontend lint/test/build, server tests against Postgres service, hermetic Playwright E2E, and a full-stack live E2E job)
- [x] E2E tests for shopping, checkout, order tracking (Playwright hermetic + opt-in live backend suite, `e2e/`)
- [x] ~~Security headers and CSP (`helmet`)~~
- [ ] Database automated backup & point-in-time recovery (PITR) strategy
- [x] ~~CartContext sync with API on login (guest cart auto-merge endpoint `/api/cart/merge`)~~


## Recommended Roadmap

### Phase 1: Deploy as Portfolio Demo ✅ Ready

- Deploy frontend to Vercel / Netlify
- Deploy backend to Render (PostgreSQL managed cluster)
- Set environment variables on hosting provider
- Production container deployments via Docker Compose or Kubernetes manifests

### Phase 2: Real Backend Foundation ✅ Done

> ⚠️ **Before running the backend:** Copy `server/.env.example` to `server/.env` and fill in your PostgreSQL connection string:
>
> ```env
> DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/amazon_clone"
> JWT_SECRET="replace-with-a-long-random-secret"
> PORT=3001
> NODE_ENV="development"
> ```
>
> You need a running PostgreSQL instance locally or a hosted one (e.g. [Render](https://render.com), [Supabase](https://supabase.com), [Neon](https://neon.tech)).

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

- ~~**GitHub Actions CI Workflow**: Routed to README TODO — no `.github/workflows/ci.yml` exists in the repo.~~
- ~~**Security & Protection**: Added `helmet` security headers, custom CSP rules, and `express-rate-limit` rate limiters on sensitive auth routes (`/login`, `/register`).~~
- ~~**Structured JSON Logging**: Implemented Pino logger (`server/src/logger.ts`) for formatted, high-performance structured backend output.~~
- ~~**Caching & Pagination**: Integrated in-memory caching for products (`GET /api/products`) and orders pagination support (`GET /api/orders?page=1&pageSize=10`).~~
- ~~**Containerization & DevOps**: Added multi-stage `Dockerfile`, `docker-compose.yml` (PostgreSQL + Express + Nginx), and `nginx.conf` reverse-proxy setup for local containerized development and cloud readiness.~~
- ~~**UX Polish**: Added `DemoModeBanner` informing users about the non-production payment sandbox status.~~

---

### Upcoming Phases & Technical Specifications

### Phase 5: Payment Integration & Advanced Auth — Removed & Done

> Stripe payment integration was later **removed** during a cleanup (closed #... / deleted `server/src/routes/payments.ts` & `src/services/paymentService.ts`). Checkout is a simulated demo. Auth hardening below remains.

#### 1. ~~Stripe PaymentIntents & Server-Side Verification~~ (Removed)
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
- **Sentry Integration**: `@sentry/react` for frontend error boundary tracking; `@sentry/node` for unhandled Express endpoint exceptions. _(Sprint H)_

---

### Phase 7: Advanced E-Commerce Capabilities (5-7 days)

| Feature Area | Technical Approach & Architecture |
| :--- | :--- |
| **Product Search & Filtering** | ~~PostgreSQL full-text search (`tsvector` index on title/description) or Algolia integration for fast fuzzy search, category facets, and price range filters.~~ Basic server-side search (name + keywords) shipped: `GET /api/products?search=`, plus a client results toolbar (sort by price/rating, "in stock only") with highlighted query matches in the grid. |
| **Product Reviews & Ratings** | Database models `Review` and `Rating` with user constraints (1 review per product per verified purchase). Average rating calculation trigger/cached field. |
| **Inventory Management** | ~~Stock quantity tracking per SKU. Pessimistic lock during checkout flow (`SELECT ... FOR UPDATE`) to prevent double-selling limited stock items.~~ Basic stock tracking + optimistic decrement shipped: `Product.stock` column, gated/decreemented in the order transaction. |
| **Wishlist & Save for Later** | ~~User `Wishlist` and `CartItem.savedForLater` boolean flag support in frontend UI and backend Prisma schema.~~ Done: `Save for later` / `Move to cart` on the checkout page, persisted in the guest cart and server `CartItem.savedForLater`. |
| **Transactional Email** | Nodemailer / Resend service integration to dispatch automated HTML order confirmation receipts and tracking updates. |

---

### Phase 8: Developer Experience & Quality Gates (DX)

| Feature | Proposed Approach |
| :--- | :--- |
| **Pre-commit hooks** | Add `lint-staged` + `husky` so `eslint`, `vitest run` (fast subset), and `tsc` run on staged files before every commit — catches issues before they hit CI. |
| **Playwright browser matrix** | Enable the `firefox` project in `playwright.config.ts` (and optionally `webkit`) alongside `chromium` so cross-browser regressions surface in the hermetic suite. Cheap, high signal. |
| **Visual regression snapshots** | Add Playwright `toHaveScreenshot()` on the key pages (home, product detail, checkout) with a `--update-snapshots` CI lane to rebase intentional UI changes. |
| **Accessibility checks** | Inject an axe-core scan (via `@axe-core/playwright`) into the checkout and orders flows to assert no critical WCAG violations (contrast, focus order, labels). |
| **Coverage thresholds** | Enable Vitest `coverage.thresholds` (e.g. 80% on `src/utils` and `src/reducers`) so the unit suite can't silently shrink, plus a `coverage` npm script + artifact upload. |
| **Dependency hygiene** | Weekly `npm audit` step in CI and Dependabot for `minor`/`patch` updates so the small dependency graph stays current. |

### Phase 9: Catalog & Search Depth

| Feature | Proposed Approach |
| :--- | :--- |
| **Category facets** | Add a `category` column to `Product`, expose `GET /api/products?category=` + facet counts, and render clickable filter chips in the results toolbar alongside the existing sort/in-stock controls. |
| **Full-text ranking** | Upgrade the server-side search from `ILIKE` to PostgreSQL `tsvector` (title weight A, keywords weight B) returning relevance-ranked results; keep the current substring fallback for short queries. |
| **Recently viewed** | Persist a capped list of last-viewed product IDs (`localStorage` for guests, `Prisma` view table for signed-in users) and render a horizontal strip on the home page. |
| **Product images** | Migrate the static `public/images/**` assets to an object store/CDN (Cloudinary/S3) with responsive `srcset` widths, since the catalog is image-heavy (this is the biggest page-weight lever). |

### Phase 10: Commerce & Account Features

| Feature | Proposed Approach |
| :--- | :--- |
| **Shipping addresses** | `Address` model (1:N with `User`), multi-address book, and address selection + validation (Zod) at checkout. |
| **Order cancellation / returns** | `Order.cancelledAt` + `ReturnRequest` models, cancel button active during `preparing` (restores stock), plus a returns form for `delivered` orders. |
| **Product reviews** | `Review` model (userId+productId unique, stars 1-5, optional body); average recomputed in the order transaction; 1-review-per-verified-purchase enforcement. |
| **Transactional emails** | Resend/Nodemailer queue keyed off order creation to send confirmations; no-op email transport in dev (log to console/pino). |
| **Password reset** | Signed reset tokens (`/api/auth/forgot-password`, `/api/auth/reset-password`) with expiry + reuse detection, mirroring the refresh-token hardening. |
| **Admin surface** | `role` enum on `User`; minimal admin-only routes for inventory (`PATCH /api/products/:id/stock`) and order fulfillment — avoids one-off scripts. |

### Phase 11: Observability, Security & Ops

| Feature | Proposed Approach |
| :--- | :--- |
| **Error tracking** | `@sentry/react` hooked into `ErrorBoundary` + `@sentry/node` for Express; exclude non-live requests in dev. |
| **Health & uptime** | Keep `/healthz`; add `GET /healthz/ready` checking DB + migrations, wire into the Docker compose healthchecks, and add an uptime monitor (UptimeRobot/StatusCake). |
| **Backups & PITR** | Enable automated Postgres backups (e.g. nightly `pg_dump` to object storage or managed PITR if using Supabase/Neon) and document the restore runbook. |
| **CSRF defense** | State-changing routes currently rely on `SameSite=Lax` + rate limits; add a CSRF token check (double-submit cookie pattern) if cross-site origin risks grow. |
| **API documentation** | Add `openapi.yaml` (or Hono/Routes-generated docs) so the API contract is explorable and the shared server/client types stay in sync. |
| **Deploy previews** | Vercel/Netlify PR previews for the frontend tied to the CI check, so reviewers test the actual bundle instead of just reading test output. |

---

### ✅ Completed Milestones

1. **Backend & Persistence**: Real Express backend, PostgreSQL database, Prisma ORM schema, JWT Authentication, Zod API validation.
2. **Checkout Safety**: Trusted server-side order calculation, idempotency key header handling, order status lifecycle management.
3. **Cart Integration**: Automated guest cart local-to-server sync (`POST /api/cart/merge`) on authentication.
4. **CI/CD Quality Gates**: ✅ GitHub Actions pipeline (`.github/workflows/ci.yml`) with four jobs: frontend lint/test/build, server tests against a Postgres service, hermetic Playwright E2E, and a full-stack live E2E job that starts the built backend. Includes Playwright browser caching and artifact upload on failure.
5. **Security & Hardening**: Helmet security headers, CSP rules, Express auth rate limiting, Pino structured logging.
6. **Container Infrastructure**: Production-ready multi-stage `Dockerfile`, `docker-compose.yml`, and `nginx.conf` reverse proxy configuration.
7. **Payment Gateway Integration (Sprint A)**: ~~Stripe PaymentIntents endpoint (`POST /api/payments/create-intent`), demo payment intent sandbox fallback, webhook signature verification~~ — **removed during cleanup**; orders instead use server-trusted totals with idempotency.
8. **Auth Hardening & Token Rotation (Sprint B)**: HttpOnly, SameSite, Secure cookie-based refresh token rotation (`POST /api/auth/refresh`), token family breach mitigation, and silent frontend token renewal client wrapper.
9. **Container Health Readiness (Sprint D)**: Probe endpoint (`GET /healthz`) testing PostgreSQL connectivity via Prisma and reporting uptime and status.
10. **E2E Test Suite (Sprint C)**: Playwright suite with **7/7 hermetic tests** (static demo mode) plus an opt-in **live backend suite (7/7)** covering search, detail, add-to-cart, guest checkout with the demo card, save-for-later, and signed-in order status control. The live suite runs serially against a throwaway Postgres and is executed in CI.
11. **Quality Validation**: Frontend lint clean (0 errors), Server TypeScript clean (0 errors), 41/41 Vitest unit tests, 7/7 hermetic + 7/7 live Playwright E2E tests passing.
12. **Search & Browse UX**: Results toolbar (sort by price/rating, "in stock only"), `<mark>` query highlighting in product cards, and a skeleton loader while server-side search is in flight.
13. **Resilience**: Idempotent GET requests auto-retry once on transient network errors (timeouts/logouts excluded), plus refresh-token flow and per-request timeout/abort handling in `src/services/api.ts`.
14. **Dev Ergonomics**: Root scripts (`npm run dev:server`, `test:server`, `test:e2e:live`), `server/.env.example`, and a seeded demo account (`demo@example.com` / `password123`).

### ⏳ Remaining Sprints

- [x] ~~**Sprint A**: Stripe PaymentIntents & Webhook handler implementation — *removed; checkout is a simulated demo with server-trusted totals*.**~~
- [x] ~~**Sprint B**: HttpOnly cookie-based Refresh Token Rotation with token reuse detection.~~
- [x] ~~**Sprint C**: Playwright E2E test suite covering shopping and order workflows.~~
- [x] ~~**Sprint D**: Health monitoring & `/healthz` readiness probe integration.~~
- [ ] **Sprint E**: Catalog depth (category facets, `tsvector` ranking, recently viewed, CDN images) — see Phase 9.
- [ ] **Sprint F**: Commerce features (address book, order cancellation/returns, product reviews, password reset, admin surface) — see Phase 10.
- [ ] **Sprint G**: Developer experience (lint-staged/husky, Playwright browser matrix, visual regression, axe accessibility, coverage thresholds, Dependabot) — see Phase 8.
- [ ] **Sprint H**: Observability & ops (Sentry, `/healthz/ready`, backups/PITR, CSRF, OpenAPI docs, deploy previews) — see Phase 11.

## Final Advice

If your goal is to showcase a feature-complete portfolio project, **deploy now** using the provided Docker compose or Render configs.
Your app features HttpOnly token rotation security, health probes, complete API cart sync, and a simulated checkout with server-trusted order totals.


