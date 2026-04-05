# GymFlow API (Laravel)

This folder contains the Laravel API for GymFlow.

GymFlow is multi-tenant: every request must include the `X-Gym` header (gym slug) so the tenant can be resolved.

For full setup instructions, demo accounts, and endpoint overview, see:

- ../../README.md

## Run locally

```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

## Tenant header

Example:

```http
X-Gym: gymflow
Authorization: Bearer <token>
```
