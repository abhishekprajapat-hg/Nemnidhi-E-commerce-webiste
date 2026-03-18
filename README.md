# Nemnidhi

This repo now contains the website, backend API, and a new React Native mobile app.

## Apps

- `frontend/` - React + Vite website
- `backend/` - Express + MongoDB API
- `mobile/` - Expo React Native customer app

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
