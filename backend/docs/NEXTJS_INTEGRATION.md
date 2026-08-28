# Next.js Integration Guide

This backend is designed to work with a Next.js frontend using either the App Router or Pages Router.

## 1. Configure the frontend

Create `.env.local` in the Next.js app:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## 2. Registration and login flow

1. Call `POST /auth/register` with `name`, `phone` or `email`, optional `password`, and address.
2. Ask the user for the OTP.
3. Call `POST /auth/verify-otp` with `contact`, `purpose=register`, and `otp`.
4. For login, either:
   - send login OTP with `POST /auth/send-login-otp` then call `POST /auth/login`
   - or log in with `contact` and `password`
5. Store `accessToken` and `refreshToken`.

## 3. Booking flow

1. User fills booking form.
2. Call `POST /auth/send-booking-otp` with bearer token.
3. Show OTP modal.
4. User enters OTP.
5. For system booking, call `POST /bookings/system`.
6. For direct provider contact, call `POST /bookings/whatsapp-link`.
7. Redirect browser to returned `whatsappLink`.

## 4. Recommended frontend structure

```text
app/
  services/page.tsx
  bookings/page.tsx
  providers/[id]/page.tsx
components/
  booking-form.tsx
  otp-modal.tsx
lib/
  api.ts
```

## 5. Security notes

- Keep `refreshToken` in an httpOnly cookie if you add a BFF layer.
- Refresh `accessToken` on 401 by calling `/auth/refresh`.
- Do not let the frontend bypass booking OTP verification.
