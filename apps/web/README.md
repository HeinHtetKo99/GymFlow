# GymFlow Web (Next.js)

This folder contains the Next.js frontend for GymFlow.

For full project setup, demo accounts, and API overview, see:

- ../../README.md

## Run locally

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_TENANT_SLUG=gymflow
```

Then:

```bash
cd apps/web
npm install
npm run dev
```
