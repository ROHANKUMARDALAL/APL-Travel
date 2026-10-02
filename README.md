# APL Travel (B2C frontend)

Next.js app for the APL Travel portal. API calls use same-origin `/api/v1/...`, rewritten to the APL backend.

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

Set the backend in `.env.local`:

```env
BACKEND_ORIGIN=https://apltravelbackend.onrender.com
```

For a local backend instead:

```env
BACKEND_ORIGIN=http://127.0.0.1:3000
```

Restart `npm run dev` after changing `.env.local`.

## Deploy on Vercel

Import the `APL-Travel` GitHub repo and add:

- `BACKEND_ORIGIN` = `https://apltravelbackend.onrender.com`

Then redeploy.
