# Plan: Analytics Dashboard (GymFlow)

## Summary
Add an owner-only analytics dashboard in the Admin area that shows:
- Monthly revenue trend (paid payments only)
- Active vs expired members (based on each member’s current membership end date)
- Attendance statistics (30-day daily check-ins + unique members checked-in; plus today/open check-ins)
- Inactive members list (active members with no check-in in the last N days; default 7)

Implementation is optimized for performance by introducing a single aggregated API endpoint (tenant-scoped, cached, index-friendly queries) and a lightweight UI (no new chart dependencies; simple SVG charts).

## Current State Analysis (Repo Facts)
- Web app is Next.js App Router with client-side pages fetching via [apiFetch](file:///d:/Projects/GymFlow/apps/web/src/lib/api.ts), always `cache: "no-store"`.
- Admin pages live under [apps/web/src/app/admin](file:///d:/Projects/GymFlow/apps/web/src/app/admin) and use Tailwind + small UI primitives ([Card](file:///d:/Projects/GymFlow/apps/web/src/components/ui/card.tsx), [Badge](file:///d:/Projects/GymFlow/apps/web/src/components/ui/badge.tsx), [Button](file:///d:/Projects/GymFlow/apps/web/src/components/ui/button.tsx), etc.).
- Admin access is currently constrained by [AdminLayout](file:///d:/Projects/GymFlow/apps/web/src/app/admin/layout.tsx): members and trainers are redirected away; owner/cashier remain.
- API is Laravel (Sanctum auth) with tenant scoping via `X-Gym` header in [ResolveTenant](file:///d:/Projects/GymFlow/apps/api/app/Http/Middleware/ResolveTenant.php) and `TenantContext`.
- Attendance, payments, memberships have helpful composite indexes in migrations:
  - Payments: (gym_id,status,paid_at), (gym_id,member_id,paid_at)
  - Attendance: (gym_id,checked_in_at), (gym_id,member_id,checked_in_at)
  - Memberships: (gym_id,status,ends_at), (gym_id,member_id,ends_at)
- There is an attendance retention/pruning mechanism (gym-specific retention days + command) that can remove old attendance records; 30-day attendance stats remain reliable.

## Decisions (From User)
- Analytics dashboard access: **Owner only**
- Revenue definition: **Paid payments only**
- Inactive definition: **Active members only** (membership valid: ends_at > now)
- Attendance stats: **Daily check-ins** (30-day trend + unique members checked-in; plus today/open check-ins)

## Proposed Changes

### 1) API: Add an aggregated analytics endpoint (single round trip)
**Goal:** Return all analytics data needed by the UI in one request; keep payload small and computed server-side.

**Files**
- Update [api.php](file:///d:/Projects/GymFlow/apps/api/routes/api.php)
  - Add route under authenticated tenant group:
    - `GET /api/v1/analytics/overview`
- Add new controller:
  - `apps/api/app/Http/Controllers/Api/V1/AnalyticsController.php`
- Add request validation:
  - `apps/api/app/Http/Requests/Api/V1/Analytics/OverviewRequest.php`

**Endpoint contract (JSON response)**
- `range`
  - `months`: number (requested window)
  - `from_month`: `YYYY-MM-01` (start, inclusive)
  - `to_month`: `YYYY-MM-01` (end, inclusive; last month bucket)
- `revenue`
  - `currency`: string (e.g. `USD`; derived from paid payments in range; if mixed currencies, return `MIXED`)
  - `series`: `{ month: "YYYY-MM", amount_cents: number }[]` length = `months` (missing months filled with 0)
  - `total_cents`: number (sum over series)
- `members`
  - `active`: number (current membership `ends_at > now`)
  - `expired`: number (current membership `ends_at <= now`)
  - `no_membership`: number (no memberships exist for member)
- `attendance`
  - `daily_checkins`: `{ date: "YYYY-MM-DD", count: number }[]` length = 30 (missing days filled with 0)
  - `total_checkins_30d`: number
  - `unique_members_30d`: number
  - `today_checkins`: number
  - `open_checkins`: number (checked_out_at is null)
- `inactive_members`
  - `inactive_days`: number (requested cutoff, default 7)
  - `total`: number (count of inactive active-members)
  - `data`: `{ id: number, name: string, last_check_in_at: string | null }[]` limited (e.g. 50)

**Query approach (performance-focused)**
- Authorization: **Owner only**
  - In controller, verify `request()->user()` is present and that:
    - `user->role === Owner` OR `tenant->gym()->owner_user_id === user->id`
  - Return 403 otherwise.
- Tenant scoping: always `where('gym_id', $gymId)`; `$gymId` read from `TenantContext`.
- Monthly revenue series:
  - Query payments with `status = 'paid'` and `paid_at` within range; group by month bucket:
    - MySQL-style month key using `DATE_FORMAT(paid_at, '%Y-%m')`
  - Fill missing months in PHP to keep chart stable.
  - Currency:
    - If more than one currency appears in range, set `currency = 'MIXED'` and still sum `amount_cents` per currency? (Decision: keep response simple and set `MIXED`; UI displays “Multiple currencies”.)
- Active/expired/no-membership counts:
  - Use a derived “current membership per member” subquery (max ends_at per member), joined to members.
  - Count buckets using the derived `max_ends_at` vs `now()`.
- Attendance daily series (30 days):
  - Group attendances by `DATE(checked_in_at)` within [today-29, today]; return counts, fill missing days in PHP.
  - Compute unique members in 30d via `COUNT(DISTINCT member_id)` over same range.
  - Today check-ins via date range [today start, tomorrow start).
  - Open check-ins via `checked_out_at IS NULL`.
- Inactive members (active-members only):
  - Compute `current_membership_end` per member; filter `> now()`.
  - Left join last attendance per member (derived `MAX(checked_in_at)`), then filter:
    - `last_check_in_at IS NULL OR last_check_in_at < now()->subDays(inactive_days)`
  - Order by `last_check_in_at` ascending with nulls first; limit 50; also return total count.
- Caching:
  - Wrap computed payload in `cache()->remember()` keyed by gym + months + inactive_days (short TTL, e.g. 60s) to reduce repeated heavy aggregation.

**Request params (validated)**
- `months`: integer, allowed {6, 12, 24}, default 12
- `inactive_days`: integer, allowed {7, 14, 30}, default 7

### 2) Web: Add a clean analytics page with lightweight charts
**Goal:** Add `/admin/analytics` with a clean, consistent UI, minimal JS, and no new dependencies.

**Files**
- Add page:
  - `apps/web/src/app/admin/analytics/page.tsx`
- Update admin navigation:
  - [apps/web/src/app/admin/layout.tsx](file:///d:/Projects/GymFlow/apps/web/src/app/admin/layout.tsx)
    - Add “Analytics” nav item shown only when `isOwner` is true.
- Add chart primitives (simple SVG; reusable):
  - `apps/web/src/components/ui/chart-line.tsx`
  - `apps/web/src/components/ui/chart-bars.tsx`

**UI layout**
- Header: title + small subtitle, plus controls:
  - Month window select: 6 / 12 / 24
  - Inactive cutoff select: 7 / 14 / 30 days
- Top row cards (KPIs):
  - Total revenue (range)
  - Active members
  - Expired members
  - 30-day check-ins + unique members
- Charts:
  - Revenue trend (line chart; months on x-axis; hover tooltip optional but not required)
  - Attendance 30-day trend (bar chart)
- Inactive members:
  - Table listing up to 50 inactive active-members: name + last check-in (formatted) + quick link to Members page filtered (optional)

**Data loading**
- Client-side fetch via `apiFetch("/api/v1/analytics/overview?months=...&inactive_days=...")` with token.
- Display loading skeleton (simple) and error banner consistent with other admin pages.

### 3) Tests (API)
**Goal:** Ensure tenant isolation + owner-only access and basic payload shape.

**Files**
- Add new feature test file:
  - `apps/api/tests/Feature/AnalyticsOverviewTest.php`

**Test coverage**
- 403 for cashier accessing `/api/v1/analytics/overview`
- 200 for owner; response includes expected keys
- Tenant isolation: data from gym A doesn’t leak into gym B (create payments/attendances/members in both and assert series totals only reflect the requested tenant)

## Assumptions
- “Active member” means: member has at least one membership row and their **current** membership end date (`MAX(ends_at)`) is in the future.
- Attendance retention may prune older data, so the analytics dashboard focuses on a 30-day attendance window.
- Revenue is presented in cents and displayed as currency on the client; if multiple currencies exist in-range, revenue is flagged as `MIXED` (UI explains).

## Verification Steps (Post-Implementation)
- API
  - Run API test suite; confirm `AnalyticsOverviewTest` passes.
  - Manually call `GET /api/v1/analytics/overview` with correct `X-Gym` and owner token; verify response sizes and that missing buckets are filled with zeros.
- Web
  - Run `apps/web` lint + build.
  - Start web + api locally; verify:
    - Owner sees “Analytics” in nav and the dashboard renders with correct cards/charts.
    - Cashier does not see nav item; direct navigation to `/admin/analytics` shows a friendly “not authorized” state (or redirects).
    - Controls update charts without layout shift and without extra unnecessary requests (debounce not required; selects are discrete).

