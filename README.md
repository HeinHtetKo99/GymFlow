# GymFlow

GymFlow is a multi-tenant (multi-gym) gym management SaaS built as a portfolio project. Each gym is isolated by a **Gym Code** (tenant slug) and enforced at the API boundary via the `X-Gym` header. The app includes role-based staff workflows (billing/attendance/training) plus a member portal.

## Live Demo

- Web: https://gym-flow-smoky.vercel.app/

## Key Features

- Multi-gym isolation via `X-Gym` request header (gym code)
- Roles: owner, cashier, trainer, member (policies/gates at the API layer)
- Attendance: check-in/out + retention settings
- Payments: record payments + printable receipts
- Membership lifecycle: cancel + undo cancel, active/expired status tracking
- Plans: trainer assigns workout/food plans + gym-wide templates
- Owner analytics: revenue, member status counts, attendance stats, inactive members
- Demo dataset seeding (24 months of realistic payments/attendance/plans)

## Tech Stack

- Web: Next.js (App Router), TypeScript, Tailwind CSS
- API: Laravel 12, Sanctum token auth, Policies/Gates, Eloquent
- DB: MySQL (recommended for dev); tests use SQLite

## Repository Structure

- apps/web — Next.js frontend
- apps/api — Laravel API

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- PHP 8.2+
- Composer
- MySQL 8+ (or another MySQL-compatible database)

### 1) API (Laravel)

```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

API runs at `http://127.0.0.1:8000`.

Configure your database in `apps/api/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gymflow
DB_USERNAME=root
DB_PASSWORD=
```

On Windows, you can use XAMPP for MySQL and keep serving Laravel via `php artisan serve`.

If your system PHP is not set up, run Artisan via XAMPP:

```bash
C:\xampp\php\php.exe artisan serve
```

### 2) Web (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

Web runs at `http://localhost:3000`.

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_TENANT_SLUG=gymflow
```

`NEXT_PUBLIC_TENANT_SLUG` is the default gym code used by the web app when calling the API (sent as the `X-Gym` header).

## Demo Data / Reset DB

Reset and reseed the full demo dataset (recommended for testing analytics and flows):

```bash
cd apps/api
php artisan cache:clear
php artisan migrate:fresh --seed
```

The seed includes 24 months of payments, attendance, memberships, plans, templates, and member phone numbers.

## Key Pages (Web)

- Admin dashboard: `/admin/dashboard`
- Admin analytics (owner only): `/admin/analytics`
- Trainer plans: `/trainer`
- Member portal: `/member`

## Demo Accounts

After seeding (`php artisan migrate:fresh --seed`) with tenant `gymflow`:

- Gym code (tenant): `gymflow`
- Owner: `owner@gymflow.test` / `password`
- Cashier: `cashier@gymflow.test` / `password`
- Trainer: `trainer@gymflow.test` / `password`
- Trainer (2): `trainer2@gymflow.test` / `password`
- Member: `test@example.com` / `password`

## License

No license file is included yet.
