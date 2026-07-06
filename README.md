# GymFlow

GymFlow is a multi-tenant (multi-gym) gym management SaaS built as a portfolio project. Each gym is isolated by a **Gym Code** (tenant slug) and enforced at the API boundary via the `X-Gym` header. The app includes role-based staff workflows (billing, attendance, training) plus a member portal.

## Live Demo

- Web: https://gym-flow-smoky.vercel.app/

## Key Features

- **Multi-gym isolation** via `X-Gym` request header (gym code)
- **Roles:** owner, cashier, trainer, member (policies/gates at the API layer)
- **Membership plans (Silver & Gold):**
  - **Silver** — 45,000 MMK/month — gym access (check-in, membership status)
  - **Gold** — 200,000 MMK/month — includes a personal trainer, workout & meal plans, and progress tracking
- **Cashier billing:** record membership payments in Myanmar kyat; Gold checkout includes trainer assignment
- **Attendance:** check-in/out + retention settings
- **Payments:** receipts, plan changes (Silver ↔ Gold), membership renewals
- **Membership lifecycle:** cancel + undo cancel, active/expired status tracking
- **Trainer workspace:** assign plans to Gold members, log measurements, view progress summaries
- **Member portal:** membership status, trainer selection (Gold), plans, and progress charts
- **Owner analytics:** revenue, member status counts, attendance stats, inactive members
- **Demo dataset seeding** (~18 months of realistic payments, attendance, and plans)

## Membership model

| Plan   | Price (monthly) | Includes |
|--------|-----------------|----------|
| Silver | 45,000 MMK      | Gym access |
| Gold   | 200,000 MMK     | Personal trainer + workout/meal plans + progress tracking |

- Only **Silver** and **Gold** are sold (no Basic/Standard tier).
- **Cashiers** record payments to activate or change a member's plan.
- **Owners** define plan catalog (prices, tiers) in setup.
- Switching **Silver → Gold** takes effect immediately; **Gold → Silver** clears trainer assignment and coaching plans.
- Amounts are stored and displayed in **MMK** (whole kyat, not cents).

## Tech Stack

- Web: Next.js (App Router), TypeScript, Tailwind CSS
- API: Laravel 12, Sanctum token auth, Policies/Gates, Eloquent
- DB: MySQL (recommended for dev); tests use SQLite

## Repository Structure

- `apps/web` — Next.js frontend
- `apps/api` — Laravel API

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- PHP 8.2+
- Composer
- MySQL 8+ (or SQLite for quick local trials)

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

For a quick local setup with SQLite, set `DB_CONNECTION=sqlite` and ensure `database/database.sqlite` exists.

On Windows, you can use XAMPP for MySQL and keep serving Laravel via `php artisan serve`.

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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional — show one-click demo logins on `/login` (recommended for portfolio demos):

```env
NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true
```

`NEXT_PUBLIC_SITE_URL` is used for canonical URLs, Open Graph tags, `sitemap.xml`, and `robots.txt`.

`NEXT_PUBLIC_TENANT_SLUG` is the default gym code used by the web app when calling the API (sent as the `X-Gym` header).

## Demo Data / Reset DB

Reset and reseed the full demo dataset (recommended for testing analytics and flows):

```bash
cd apps/api
php artisan cache:clear
php artisan migrate:fresh --seed
```

The seed includes Silver/Gold plans (MMK), ~18 months of past payments, attendance, memberships, plan templates, and demo members with phone numbers.

## Key Pages (Web)

| Page | Path | Who |
|------|------|-----|
| Landing | `/` | Public |
| Admin dashboard | `/admin/dashboard` | Owner, cashier |
| Members | `/admin/members` | Owner, cashier |
| Payments | `/admin/payments` | Owner, cashier |
| Admin analytics | `/admin/analytics` | Owner only |
| Trainer hub | `/trainer` | Trainer |
| Member portal | `/member` | Member |

## Demo Accounts

After seeding (`php artisan migrate:fresh --seed`) with tenant `gymflow`:

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Gym code | `gymflow` | — | Tenant slug / `X-Gym` header |
| Owner | `owner@gymflow.test` | `password` | Analytics, setup, staff |
| Cashier | `cashier@gymflow.test` | `password` | Membership payments, attendance |
| Trainer | `trainer@gymflow.test` | `password` | Gold members only |
| Trainer (2) | `trainer2@gymflow.test` | `password` | Second trainer |
| Member (Gold) | `test@example.com` | `password` | Demo member with trainer |

## Typical cashier flow

1. Open **Members** → **New member** (name + phone; optional login).
2. Click **Record payment** on the member row.
3. Choose **Silver** or **Gold**, enter amount in MMK, select payment method.
4. For **Gold**, pick a personal trainer before confirming.

## License

No license file is included yet.
