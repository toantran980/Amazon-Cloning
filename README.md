# Amazon Clone — React + TypeScript

A full-featured Amazon storefront clone built with React 19, TypeScript, and Vite. Includes product browsing, a shopping cart, checkout flow, and order tracking.

## Tech Stack

- **React 19** with React Router v7
- **TypeScript** + Vite
- **Tailwind CSS v4** for styling (via `@tailwindcss/vite`)
- **Day.js** for date formatting
- **ESLint** for linting

## Features

- 🛒 Product listing and detail pages
- 🛍️ Shopping cart with quantity management
- 💳 Checkout and payment summary
- 📦 Order history and tracking
- 🔄 Global state via React Context

## Project Structure

```
src/
├── assets/         # Static assets (images, icons)
├── components/     # Reusable UI components
│   ├── CartItem/
│   ├── Header/
│   ├── PaymentSummary/
│   └── ProductCard/
├── context/        # React Context providers
├── data/           # Static data / mock data
├── pages/          # Route-level page components
│   ├── Amazon/
│   ├── Checkout/
│   ├── Orders/
│   └── Tracking/
├── types/          # TypeScript type definitions
└── utils/          # Helper utilities
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start Vite dev server with HMR      |
| `npm run build`   | Type-check and build for production |
| `npm run lint`    | Run ESLint                          |
| `npm run preview` | Preview the production build        |
