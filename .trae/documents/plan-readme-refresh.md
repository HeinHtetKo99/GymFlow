# Plan: README Refresh + Repo Description

## Summary
Update the repository documentation so it matches the current GymFlow implementation and is portfolio/GitHub ready:
- Refresh the root README.md with up-to-date features (analytics, structured plans, templates, phone capture, 24‑month seeding, tenant isolation).
- Replace boilerplate framework READMEs under `apps/api` and `apps/web` with short project-specific docs that point back to the root.
- Provide a short “repo description” snippet (1–2 lines) suitable for the GitHub “About” section.

## Current State Analysis (Repo Facts)
- Root README.md already documents multi-tenant isolation via `X-Gym`, roles, payments/attendance, retention pruning, and local dev steps: [README.md](file:///d:/Projects/GymFlow/README.md)
- `apps/api/README.md` is default Laravel boilerplate and does not describe GymFlow: [apps/api/README.md](file:///d:/Projects/GymFlow/apps/api/README.md)
- `apps/web/README.md` is default Next.js boilerplate and does not describe GymFlow: [apps/web/README.md](file:///d:/Projects/GymFlow/apps/web/README.md)
- New capabilities exist in code and should be reflected in docs:
  - Admin analytics dashboard + aggregated API endpoint: [admin/analytics/page.tsx](file:///d:/Projects/GymFlow/apps/web/src/app/admin/analytics/page.tsx), [AnalyticsController.php](file:///d:/Projects/GymFlow/apps/api/app/Http/Controllers/Api/V1/AnalyticsController.php)
  - Trainer structured plans + templates: [trainer/page.tsx](file:///d:/Projects/GymFlow/apps/web/src/app/trainer/page.tsx), [PlanTemplateController.php](file:///d:/Projects/GymFlow/apps/api/app/Http/Controllers/Api/V1/PlanTemplateController.php)
  - Demo seeding includes 24 months payments and phone numbers: [AnalyticsDemoSeeder.php](file:///d:/Projects/GymFlow/apps/api/database/seeders/AnalyticsDemoSeeder.php)
  - Cashier/owner member management UI includes phone requirement for member creation/login: [admin/members/page.tsx](file:///d:/Projects/GymFlow/apps/web/src/app/admin/members/page.tsx)

## Proposed Changes

### 1) Refresh root README.md (main project doc)
**File**
- Update [README.md](file:///d:/Projects/GymFlow/README.md)

**Edits**
- Update “Features” section to include:
  - Admin analytics dashboard (revenue trends, active vs expired members, attendance stats, inactive members)
  - Trainer structured workout/food plans (sections + items) and gym-shared templates
  - Member management improvements (phone stored for outreach/promotions)
  - Demo seeder includes realistic dataset (24 months payments, attendance, memberships, plans/templates)
- Update “Demo Accounts” to include the second trainer account if present in seeder.
- Add “Sample Data / Reset DB” section with:
  - `php artisan migrate:fresh --seed`
  - Note that this creates `gymflow` tenant and demo users + 24 months analytics data.
- Add small “Key Pages” section (URLs) for quicker evaluation:
  - `/admin/dashboard`, `/admin/analytics`, `/trainer`, `/member`
- Ensure wording matches current behavior:
  - Attendance is owner/cashier only
  - Trainer sees assigned members only
  - Plan templates are per gym (shared)
  - Member plan visibility respects assignment

### 2) Replace boilerplate app READMEs with GymFlow-specific ones
**Files**
- Update [apps/api/README.md](file:///d:/Projects/GymFlow/apps/api/README.md)
- Update [apps/web/README.md](file:///d:/Projects/GymFlow/apps/web/README.md)

**Edits**
- Replace each with:
  - A short description of that app (API vs Web)
  - How to run that app locally
  - Pointer to the root README for full setup
  - Mention tenant header (`X-Gym`) for API and required env vars for web (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_TENANT_SLUG`)

### 3) Add short repo description (GitHub “About”)
**Output**
- Provide 2–3 short options (one-line and two-line) for the GitHub repo description:
  - Product-focused
  - Technical/portfolio-focused
  - Hybrid

## Assumptions & Decisions
- The root README remains the single source of truth; sub-app READMEs are concise and link back to it.
- No new images or badges are required unless explicitly requested.

## Verification
- Re-read updated README text for correctness vs actual code/behavior.
- Ensure all referenced commands and URLs exist in the repo structure.
- Ensure demo accounts/seed details match `DatabaseSeeder` + `AnalyticsDemoSeeder`.

