# GymFlow

GymFlow is a multi-gym (tenant-aware) gym management app built as a portfolio-grade SaaS. Each gym is isolated by a **Gym code** (sent via `X-Gym` header), and users have role-based permissions for billing, attendance, accounts, and training plans.

## Features

- Multi-gym isolation using **Gym code** (`X-Gym` header)
- Roles and permissions
  - **Owner**: manages staff + membership plans + billing settings
  - **Cashier**: manages members + payments + attendance
  - **Trainer**: manages workout & food plans for members
  - **Member**: views own plans and membership status
- Membership lifecycle
  - Supports “One-time membership (30 days)” and standard plans
  - Cancel and “Undo cancel” while the membership is still active
- Payments + printable receipts
- Attendance check-in/check-out (only Owner/Cashier)
- Attendance retention setting (30/90 days) + scheduled pruning
- Modern UI (Next.js App Router + Tailwind) with a dark green theme

## Tech Stack

- **Web**: Next.js (App Router), TypeScript, Tailwind CSS
- **API**: Laravel + Sanctum tokens, Policies/Gates, Eloquent
- **DB**: MySQL (dev via Docker)

## Repo Structure

- `apps/web` — Next.js frontend
- `apps/api` — Laravel API
- `infra/docker` — local MySQL (Docker Compose)

## Local Development

### 1) Start MySQL (Docker)

```bash
cd infra/docker
docker compose up -d
```

This exposes MySQL at `localhost:3306`.

Default credentials from `infra/docker/docker-compose.yml`:

- Database: `gymflow`
- User: `gymflow`
- Password: `gymflow`
- Root password: `root`

### 2) Run the API (Laravel)

Laravel dependencies install fastest when PHP has `ext-zip` enabled and an unzip tool available.

- Enable the `zip` extension in your `php.ini`
- Install one of: `unzip` or `7z` (7-Zip) so Composer can use distribution archives

```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

API defaults to `http://127.0.0.1:8000`.

If you use the Docker MySQL user, update `apps/api/.env`:

```env
DB_DATABASE=gymflow
DB_USERNAME=gymflow
DB_PASSWORD=gymflow
```

### 3) Run the Web (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

Web defaults to `http://localhost:3000`.

## Environment Variables

### Web

`apps/web` reads:

- `NEXT_PUBLIC_API_URL` (default: `http://127.0.0.1:8000`)
- `NEXT_PUBLIC_TENANT_SLUG` (default: `gymflow`)  
  Used as the default **Gym code** if one isn’t selected yet.

Example `.env.local` in `apps/web`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_TENANT_SLUG=gymflow
```

### API

See `apps/api/.env.example`. The key one is your DB connection (MySQL).

## Demo Accounts (Seeder)

After `php artisan migrate --seed`:

- Owner: `owner@gymflow.test` / `password`
- Cashier: `cashier@gymflow.test` / `password`
- Trainer: `trainer@gymflow.test` / `password`
- Member: `test@example.com` / `password`
- Default gym code: `gymflow`

## Gym Registration Flow (SaaS-style)

Instead of manually creating the first owner in the DB, GymFlow supports a SaaS flow:

- Register → system creates a new gym + owner account → user is logged in → onboarding wizard starts

## Key Operational Commands

### Run API tests

```bash
cd apps/api
php artisan test
```

### Attendance retention pruning

Prune old attendance:

```bash
cd apps/api
php artisan attendance:prune
```

Scheduled daily at `03:10` via `apps/api/routes/console.php`.

## Notes

- Multi-gym isolation is enforced at the API boundary via a request header (`X-Gym`) and tenant middleware.
- Passwords in seed data are for local/demo only.
