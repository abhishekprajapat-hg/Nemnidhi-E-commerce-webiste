# Nemnidhi

This repo now contains the website, backend API, and a new React Native mobile app.

## Apps

- `frontend/` - React + Vite website
- `backend/` - Express + MongoDB API
- `mobile/` - Expo React Native customer app

## Centralized Backend

The backend is the shared API layer for both clients:

- web frontend -> same `/api/...` routes
- mobile app -> same `/api/...` routes

For production, deploy the backend on a public URL and build the website before starting the server:

```bash
cd frontend
npm install
npm run build

cd ../backend
npm install
npm start
```

In production the backend now serves the web build from `../frontend/dist` by default, so the website and API can live on one domain.

Set allowed web origins with `FRONTEND_URLS` in `backend/.env`.

## Mobile App

The mobile app reuses the existing backend for:

- authentication with OTP
- products and product details
- cart
- saved addresses
- wishlist
- orders

Current mobile checkout is `Cash on Delivery` only. The web Razorpay flow is browser-based and would need a separate native payment integration for the app.

See [mobile/README.md](./mobile/README.md) for setup.
