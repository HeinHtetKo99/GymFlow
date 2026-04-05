# Plan: Trainer Structured Plans + Templates

## Summary
Refactor the Trainer “Plans” UI to support **structured workout/food plans** (daily/weekly sections instead of plain text), add **gym-shared reusable templates**, improve usability with **member search**, **selected member highlight**, **current plan preview**, and clear **last updated** info. Plans will be stored as **JSON encoded in `member_plans.content`** (no migration for member plans), and the Member portal will render structured plans safely (no raw JSON shown).

## Current State Analysis (Repo Facts)
- Trainer plans UI is a single page: [trainer/page.tsx](file:///d:/Projects/GymFlow/apps/web/src/app/trainer/page.tsx)
  - Lists members via `GET /api/v1/members` (no server-side filtering) and highlights the selected member.
  - Loads plans via `GET /api/v1/members/{id}/plans` and saves via `PUT /api/v1/members/{id}/plans/{workout|food}` with `{ content: string }`.
  - Plans are edited as two plain-text `<textarea>` drafts (workout/food) and saved as plain string `content`.
  - Shows “Last updated” using `updated_at`.
- Member portal displays plan `content` as plain text: [member/page.tsx](file:///d:/Projects/GymFlow/apps/web/src/app/member/page.tsx#L437-L471). If the trainer starts saving JSON, members would see raw JSON unless we update rendering.
- API stores member plans in `member_plans` with a unique (gym_id, member_id, type) and a `longText content`: [create_member_plans_table.php](file:///d:/Projects/GymFlow/apps/api/database/migrations/2026_04_04_121000_create_member_plans_table.php)
- API controller for plans: [MemberPlanController.php](file:///d:/Projects/GymFlow/apps/api/app/Http/Controllers/Api/V1/MemberPlanController.php)
  - Validates `type` is `workout|food`; validates `content` string.
  - Uses `updateOrCreate` and sets `created_by_trainer_user_id` every time (acts like “last editor” today).
- Members have an assignment field `assigned_trainer_user_id` returned by `GET /members`: [MemberController@index](file:///d:/Projects/GymFlow/apps/api/app/Http/Controllers/Api/V1/MemberController.php#L17-L51).

## Decisions (From User)
- Structure: **Simple sections** (daily/weekly sections with titled blocks + ordered items; no deep exercise/macros fields)
- Storage: **JSON stored in `member_plans.content`** (no new column; include a schema/version)
- Templates: **Per gym (shared)**
- Member list scope: **Assigned only** (members where `assigned_trainer_user_id = current trainer`)

## Proposed Changes

### 1) Define a structured plan schema (client + server compatible)
**Goal:** A stable JSON format that supports daily/weekly sections and can be rendered both in trainer and member portals.

**Schema (stored as JSON string inside `member_plans.content`)**
- Top-level:
  - `schema_version: 1`
  - `type: "workout" | "food"`
  - `title?: string`
  - `updated_note?: string` (optional short note, e.g., “deload week”)
  - `sections: Array<{ id: string, label: string, items: string[] }>`
    - `label` examples: `Monday`, `Day 1`, `Week 1`, `Breakfast`, `Macros`
    - `items` are plain strings (ordered list)

**Backward compatibility**
- If `content` is not valid JSON or does not match `schema_version: 1`, treat it as legacy plain text and render as a single section:
  - `label: "Notes"`, `items: [each non-empty line]` or one item with the full text (decision: split by newlines for readability).
- Trainer UI will load legacy text into the structured editor (single “Notes” section) and on next save will write JSON.

### 2) API: Member list filter for “assigned only”
**Goal:** Avoid fetching all members for trainers; keep UX snappy and reduce accidental edits.

**File**
- Update [MemberController@index](file:///d:/Projects/GymFlow/apps/api/app/Http/Controllers/Api/V1/MemberController.php#L17-L51)

**Behavior**
- Add optional query param: `assigned_trainer=me|all`
  - If `assigned_trainer=me` and authenticated role is trainer:
    - filter: `assigned_trainer_user_id = request()->user()->id`
  - If missing or `all`, current behavior remains unchanged.
- Trainer UI will call: `GET /api/v1/members?assigned_trainer=me`

**Authorization**
- No changes to policy: trainers already pass `viewAny` on members.

### 3) API: Gym-shared plan templates (CRUD)
**Goal:** Allow trainers/owners to save and reuse templates for workout/food structured plans.

**DB**
- Add migration creating `plan_templates` table:
  - `id`
  - `gym_id` (FK)
  - `type` (`workout|food`)
  - `name` (string, max 120)
  - `content` (longText JSON string, schema_version 1)
  - `created_by_user_id` (FK nullable)
  - `updated_by_user_id` (FK nullable)
  - timestamps
  - indexes: `(gym_id, type)`, unique `(gym_id, type, name)`

**API routes**
- Add routes in [api.php](file:///d:/Projects/GymFlow/apps/api/routes/api.php):
  - `GET /api/v1/plan-templates?type=workout|food`
  - `POST /api/v1/plan-templates`
  - `PATCH /api/v1/plan-templates/{id}`
  - `DELETE /api/v1/plan-templates/{id}`

**Controller + policy**
- New controller: `apps/api/app/Http/Controllers/Api/V1/PlanTemplateController.php`
- New policy: `apps/api/app/Policies/PlanTemplatePolicy.php`
  - Allow: owner + trainer (same gym)
  - Deny: cashier/member

**Validation**
- `type`: `workout|food`
- `name`: required, trimmed, 2–120 chars
- `content`: required string (JSON); server validates it is valid JSON and contains `schema_version: 1` + `sections` array

### 4) Web: Refactor Trainer Plans UI (structured editor + templates + preview + search)
**Goal:** Make it easy to pick a member, apply a template, edit structured sections, preview, and save.

**Files**
- Update trainer page: [trainer/page.tsx](file:///d:/Projects/GymFlow/apps/web/src/app/trainer/page.tsx)
- Add reusable UI helpers (small, no new deps):
  - `apps/web/src/lib/plan-schema.ts` (parse/serialize helpers + types)
  - `apps/web/src/components/plans/structured-plan-editor.tsx`
  - `apps/web/src/components/plans/structured-plan-preview.tsx`
  - `apps/web/src/components/plans/template-picker.tsx`

**UI layout changes**
- Left panel:
  - Search input (filters assigned members by name/email/id)
  - Member list items show selected highlight (keep existing highlight), plus small “Last updated” badges if available for that member’s workout/food plan (based on loaded plan metadata).
- Right panel:
  - Header shows selected member name + status
  - Tabs or segmented switch: Workout / Food
  - Template controls:
    - Select a template (filtered by type)
    - “Apply template” button (loads template into editor)
    - “Save as template” (name input + save)
    - “Delete template” (owner/trainer only; UI shows confirm)
  - Structured editor:
    - Add/remove sections
    - Rename section label
    - Add/remove/reorder items (simple up/down controls)
  - Side-by-side preview:
    - Render the structured plan as the member would see it
  - Footer:
    - Save button
    - “Last updated: …” using plan `updated_at`

**Data loading flow**
- Members:
  - `GET /api/v1/members?assigned_trainer=me`
- On member select:
  - `GET /api/v1/members/{id}/plans`
  - Parse each plan `content` using `plan-schema.ts`
- Templates:
  - `GET /api/v1/plan-templates?type={workout|food}`
  - Cache in state; refetch after create/update/delete.
- Save plan:
  - Serialize structured plan to JSON string
  - `PUT /api/v1/members/{id}/plans/{type}` with `{ content: jsonString }`

### 5) Web: Update Member portal plan rendering to support structured JSON
**Goal:** Ensure members never see raw JSON and get a clean daily/weekly section view.

**File**
- Update [member/page.tsx](file:///d:/Projects/GymFlow/apps/web/src/app/member/page.tsx#L437-L471)

**Behavior**
- Attempt to parse plan `content` using the same `plan-schema.ts`
  - If structured: render sections + bullet/ordered list
  - If legacy: fallback to current `whitespace-pre-wrap` display

### 6) Tests + Verification
**API tests**
- Add tests for:
  - `GET /members?assigned_trainer=me` returns only assigned members for trainer
  - Plan templates CRUD enforces tenant and role permissions

**Web verification**
- Lint + build for `apps/web`
- Manual UX checks:
  - Trainer sees only assigned members + can search
  - Selecting a member shows current plan preview + last updated
  - Applying template populates editor
  - Saving writes JSON and member portal renders it nicely

## Assumptions & Constraints
- Structured plans remain “simple”: sections + ordered item strings (no exercise/macro objects).
- Templates are stored server-side per gym and are shared across trainers.
- Member plans remain one per type per member (existing unique constraint).
- No new external UI libraries (stick to existing Tailwind + current UI primitives).

## Step-by-Step Implementation Checklist (Executor-Ready)
1) Add `plan-schema.ts` parsing/serialization + shared types (web).
2) Update API `MemberController@index` to support `assigned_trainer=me`.
3) Add `plan_templates` migration + model + policy + controller + routes.
4) Refactor trainer UI:
   - member search + assigned-only fetch
   - structured editor + preview
   - templates picker + CRUD
   - last updated and selected member clarity
5) Update member portal plan rendering to support structured JSON.
6) Add API tests; run `php artisan test`.
7) Run `apps/web` lint + build; verify manually in browser.

