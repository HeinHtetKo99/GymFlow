# GymFlow

GymFlow is a multi-tenant (multi-gym) gym management SaaS built as a portfolio project. Each gym is isolated by a **Gym Code** (tenant slug) and enforced at the API boundary via the `X-Gym` header. The app includes role-based staff workflows (billing/attendance/training) plus a member portal.

## Key Features

- Multi-tenant isolation per gym via `X-Gym` request header
- Role-based access control
  - Owner: manages staff, membership plans, and analytics
  - Cashier: manages members, payments, and attendance (check-in/out)
  - Trainer: manages structured workout/food plans for assigned members + shared templates
  - Member: views own membership status, plans, payments, and attendance history
- Membership lifecycle (active/expired/canceling) with cancel + undo cancel flows
- Payments with receipts (printable receipt page in the web app)
- Attendance check-in/out (owner/cashier only) + retention setting + pruning command
- Analytics dashboard (owner only): monthly revenue trends, members status counts, attendance stats, inactive members
- Member outreach readiness: phone numbers stored for members (demo data includes phone numbers)
- Demo dataset seeding for realistic testing (24 months of payments + attendance + memberships + plans/templates)

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

Configure your database in `apps/api/.env` (example):

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gymflow
DB_USERNAME=root
DB_PASSWORD=
```

### Using XAMPP (Windows)

You can run GymFlow with XAMPP (most commonly for MySQL).

#### Option A: Use XAMPP MySQL (recommended)

1. Start XAMPP and turn on **MySQL**.
2. In phpMyAdmin (or MySQL CLI), create a database named `gymflow`.
3. Configure `apps/api/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gymflow
DB_USERNAME=root
DB_PASSWORD=
```

4. Run the API from `apps/api`:

```bash
php artisan migrate:fresh --seed
php artisan serve
```

If your system PHP is not set up, you can run Artisan using XAMPP’s PHP executable:

```bash
C:\xampp\php\php.exe artisan serve
```

#### Option B: Serve the API through XAMPP Apache (optional)

1. Start XAMPP and turn on **Apache** + **MySQL**.
2. Configure an Apache VirtualHost whose document root points to:
   - `apps/api/public`
3. Ensure Apache `mod_rewrite` is enabled.
4. Set `APP_URL` in `apps/api/.env` to match your local Apache URL.

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

## Demo Data / Reset DB

Reset everything and reseed the full demo dataset (recommended for testing analytics and flows):

```bash
cd apps/api
php artisan cache:clear
php artisan migrate:fresh --seed
```

The demo seed includes 24 months of payments (all marked as paid), member phone numbers, attendance, memberships, structured plans, and shared templates.

## Key Pages (Web)

- Admin dashboard: `/admin/dashboard`
- Admin analytics (owner only): `/admin/analytics`
- Trainer plans: `/trainer`
- Member portal: `/member`

## Demo Accounts

After seeding (`php artisan migrate:fresh --seed`) with tenant `gymflow`:

- Owner: `owner@gymflow.test` / `password`
- Cashier: `cashier@gymflow.test` / `password`
- Trainer: `trainer@gymflow.test` / `password`
- Trainer (2): `trainer2@gymflow.test` / `password`
- Member: `test@example.com` / `password`

## Usage Examples

All API endpoints are under `/api/v1`. Most endpoints require:

- `Authorization: Bearer <token>`
- `X-Gym: <gym-slug>`

### Login (get token)

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -H "X-Gym: gymflow" ^
  -d "{\"email\":\"owner@gymflow.test\",\"password\":\"password\"}"
```

### Fetch analytics overview (owner only)

```bash
curl http://127.0.0.1:8000/api/v1/analytics/overview?months=12&inactive_days=7 ^
  -H "Authorization: Bearer <token>" ^
  -H "X-Gym: gymflow"
```

### Create a member profile (cashier/owner)

```bash
curl -X POST http://127.0.0.1:8000/api/v1/members ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -H "X-Gym: gymflow" ^
  -d "{\"name\":\"Alice\",\"email\":\"alice@example.com\",\"phone\":\"+1 555-0101\",\"status\":\"active\"}"
```

## API Documentation (Overview)

### Health & Tenant

- `GET /api/v1/health`
- `GET /api/v1/tenant` (requires `X-Gym`)

### Auth

- `POST /api/v1/auth/register-gym` (creates a gym + owner account)
- `POST /api/v1/auth/register` (create user in tenant)
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

### Gym

- `GET /api/v1/gym`
- `PATCH /api/v1/gym` (includes attendance retention setting)

### Members

- `GET /api/v1/members`
  - Trainer-only filter: `?assigned_trainer=me`
- `POST /api/v1/members` (cashier/owner)
- `GET /api/v1/members/{id}`
- `PATCH /api/v1/members/{id}`
- `DELETE /api/v1/members/{id}` (owner/cashier rules apply)

### Membership Plans

- `GET /api/v1/membership-plans`
- `POST /api/v1/membership-plans` (owner)
- `PATCH /api/v1/membership-plans/{id}` (owner)

### Membership Actions

- `POST /api/v1/members/{id}/membership/cancel`
- `POST /api/v1/members/{id}/membership/undo-cancel`
- `POST /api/v1/members/me/membership/cancel`
- `POST /api/v1/members/me/membership/undo-cancel`

### Attendance

- `GET /api/v1/attendance?date=YYYY-MM-DD&member_id=...`
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/{id}/check-out`
- `GET /api/v1/attendance/me`

### Payments

- `GET /api/v1/payments?member_id=...&status=paid`
- `POST /api/v1/payments`
- `GET /api/v1/payments/{id}`
- `GET /api/v1/payments/me`

### Plans (Trainer + Member)

- `GET /api/v1/members/{id}/plans`
- `PUT /api/v1/members/{id}/plans/{workout|food}` (trainer/owner; trainer must be assigned)
- `GET /api/v1/members/me/plans`

### Plan Templates (Gym-shared)

- `GET /api/v1/plan-templates?type=workout|food`
- `POST /api/v1/plan-templates`
- `PATCH /api/v1/plan-templates/{id}`
- `DELETE /api/v1/plan-templates/{id}`

### Analytics (Owner only)

- `GET /api/v1/analytics/overview?months=6|12|24&inactive_days=7|14|30`

## Architecture Notes

- Tenant isolation: resolved by tenant middleware using `X-Gym` header (gym slug)
- Authorization: role-based policies/gates on API resources
- Data model: members, memberships, payments, attendance, member plans, plan templates
- Performance: analytics overview uses server-side aggregation and short-lived caching

## Contributing

Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Run tests and lint:
   - `cd apps/api && php artisan test`
   - `cd apps/web && npm run lint && npm run build`
4. Open a pull request with a clear description and screenshots (for UI changes)

## License

No license file is included yet. Add a `LICENSE` file if you plan to distribute or reuse this code outside of personal/portfolio use.
