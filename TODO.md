# Task Progress

## Easy Wins (from FUTURE_IMPROVEMENTS.md)

- [x] 1. Add GitHub Actions CI workflow (lint/test/build on every PR)
- [x] 2. Add "Demo mode" banner so visitors know no real payments are processed

## Medium Improvements

- [x] 3. Merge guest cart into user cart on login (CartContext sync with API)
- [x] 4. Add order status lifecycle (preparing → shipped → delivered)
- [x] 5. Add rate limiting (express-rate-limit) on auth routes
- [x] 6. Add security headers and CSP (Helmet)
- [x] 7. Add structured JSON logging (Pino)
- [x] 8. Add caching and pagination for product and order lists

## Verification

- [x] Frontend tests pass (9 tests, 3 files)
- [x] Frontend lint clean (0 errors)
- [x] Frontend build succeeds
- [x] Server TypeScript clean (0 errors)

## Remaining (future work)

- [ ] Playwright E2E smoke tests for home, checkout, and orders
- [ ] Stripe/PayPal payment provider integration with server-side verification
- [ ] JWT refresh token rotation with revocation
- [ ] Sentry error tracking
- [ ] Data backup/retention strategy
</content>
