# QuickServices Frontend

This is a Next.js frontend scaffold for the QuickServices platform.

## Run

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Notes

- Paste a real backend access token into the UI to test OTP booking flow.
- API base URL is controlled by `NEXT_PUBLIC_API_BASE_URL`.
- Current page is a polished booking UI scaffold, not a full auth app yet.
