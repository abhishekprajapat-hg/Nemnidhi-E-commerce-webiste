# Nemnidhi Mobile

Expo React Native app for the customer-facing Nemnidhi shopping experience.

## Included in this first build

- home screen
- product listing
- product details with variant and size selection
- cart
- checkout with saved addresses
- login, register, and OTP verification
- profile, wishlist, and orders

## Payment

Mobile checkout currently supports `Cash on Delivery`.

The website's Razorpay flow uses browser JavaScript, so native online payments should be added later with a dedicated React Native / Expo integration.

## Setup

1. Start the backend API.
2. In `mobile/`, create an `.env` file from `.env.example`.
3. Set `EXPO_PUBLIC_API_URL` to your backend URL.

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
```

Use your machine's local network IP when testing on a physical device.

For a centralized production setup, point the app to your public backend URL instead:

```env
EXPO_PUBLIC_API_URL=https://your-domain.com
```

With a public backend URL, the mobile app no longer depends on the phone being on the same Wi-Fi as your laptop.

## Run

```bash
cd mobile
npm install
npm start
```

Then open the app in Expo Go or run:

```bash
npm run android
npm run ios
```

## Verification

The app structure was verified by running:

```bash
npx expo export --platform android
```
