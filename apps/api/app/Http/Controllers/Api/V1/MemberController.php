<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Member\StoreMemberRequest;
use App\Http\Requests\Api\V1\Member\UpdateMemberRequest;
use App\Http\Requests\Api\V1\Member\UpdateMyMemberRequest;
use App\Models\Member;
use App\Models\MemberPlan;
use App\Models\Membership;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Gate;

final class MemberController extends Controller
{
    public function index(TenantContext $tenant)
    {
        Gate::authorize('viewAny', Member::class);

        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $assignedTrainer = request()->query('assigned_trainer');
        $actor = request()->user();

        $query = Member::query()
            ->where('gym_id', $gymId);

        if (is_string($assignedTrainer) && strtolower(trim($assignedTrainer)) === 'me' && $actor !== null && $actor->role === UserRole::Trainer) {
            $query->where('assigned_trainer_user_id', $actor->getKey());
        }

        $members = $query
            ->latest('id')
            ->get(['id', 'user_id', 'name', 'email', 'phone', 'status', 'assigned_trainer_user_id', 'created_at']);

        $memberIds = $members->pluck('id')->all();

        $memberships = Membership::query()
            ->where('gym_id', $gymId)
            ->whereIn('member_id', $memberIds)
            ->with(['plan:id,name'])
            ->orderByDesc('ends_at')
            ->get()
            ->groupBy('member_id')
            ->map(fn ($items) => $items->first());

        foreach ($members as $member) {
            $membership = $memberships->get($member->getKey());
            $member->setAttribute('membership', $this->membershipPayload($membership));
        }

        return response()->json([
            'data' => $members,
        ]);
    }

    public function store(StoreMemberRequest $request, TenantContext $tenant)
    {
        Gate::authorize('create', Member::class);

        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $member = Member::query()->create([
            'gym_id' => $gymId,
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'phone' => $request->validated('phone'),
            'status' => $request->validated('status', 'active'),
            'assigned_trainer_user_id' => $request->validated('assigned_trainer_user_id'),
        ]);

        return response()->json([
            'data' => $member,
        ], 201);
    }

    public function show(int $id, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        Gate::authorize('view', $member);

        $membership = $this->currentMembership($gymId, $member);
        $member->setAttribute('membership', $this->membershipPayload($membership));

        return response()->json([
            'data' => $member,
        ]);
    }

    public function update(int $id, UpdateMemberRequest $request, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        Gate::authorize('update', $member);

        $prevTrainerId = $member->assigned_trainer_user_id;

        $member->fill($request->validated());
        $member->save();

        $nextTrainerId = $member->assigned_trainer_user_id;
        if ((int) ($prevTrainerId ?? 0) !== (int) ($nextTrainerId ?? 0)) {
            MemberPlan::query()
                ->where('gym_id', $gymId)
                ->where('member_id', $member->getKey())
                ->delete();
        }

        return response()->json([
            'data' => $member,
        ]);
    }

    public function destroy(int $id, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        Gate::authorize('delete', $member);

        $member->delete();

        return response()->json([
            'message' => 'Deleted.',
        ]);
    }

    public function trainers(TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $trainers = User::query()
            ->where('gym_id', $gymId)
            ->where('role', 'trainer')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json([
            'data' => $trainers,
        ]);
    }

    public function me(TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $user = request()->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->where('user_id', $user->getKey())
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Member profile not found.'], 404);
        }

        Gate::authorize('view', $member);

        $membership = $this->currentMembership($gymId, $member);
        $member->setAttribute('membership', $this->membershipPayload($membership));

        return response()->json([
            'data' => $member,
        ]);
    }

    public function updateMe(UpdateMyMemberRequest $request, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $user = request()->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->where('user_id', $user->getKey())
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Member profile not found.'], 404);
        }

        Gate::authorize('assignTrainer', $member);

        $prevTrainerId = $member->assigned_trainer_user_id;

        $member->fill($request->validated());
        $member->save();

        $nextTrainerId = $member->assigned_trainer_user_id;
        if ((int) ($prevTrainerId ?? 0) !== (int) ($nextTrainerId ?? 0)) {
            MemberPlan::query()
                ->where('gym_id', $gymId)
                ->where('member_id', $member->getKey())
                ->delete();
        }

        return response()->json([
            'data' => $member,
        ]);
    }

    public function cancelMyMembership(TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $user = request()->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->where('user_id', $user->getKey())
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Member profile not found.'], 404);
        }

        $membership = Membership::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->whereIn('status', ['active', 'canceling'])
            ->orderByDesc('ends_at')
            ->first();

        if ($membership === null || $membership->ends_at === null || $membership->ends_at->lte(now())) {
            return response()->json(['message' => 'No active membership to cancel.'], 422);
        }

        Gate::authorize('requestCancel', $membership);

        $membership->update([
            'status' => 'canceling',
            'cancel_requested_at' => now(),
        ]);

        $membership->loadMissing('plan:id,name');

        return response()->json([
            'data' => $this->membershipPayload($membership),
        ]);
    }

    public function undoCancelMyMembership(TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $user = request()->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->where('user_id', $user->getKey())
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Member profile not found.'], 404);
        }

        $membership = Membership::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->where('status', 'canceling')
            ->orderByDesc('ends_at')
            ->first();

        if ($membership === null || $membership->ends_at === null || $membership->ends_at->lte(now())) {
            return response()->json(['message' => 'No cancel request to undo.'], 422);
        }

        Gate::authorize('undoCancel', $membership);

        $membership->update([
            'status' => 'active',
            'cancel_requested_at' => null,
        ]);

        $membership->loadMissing('plan:id,name');

        return response()->json([
            'data' => $this->membershipPayload($membership),
        ]);
    }

    public function cancelMembership(int $id, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $membership = Membership::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->whereIn('status', ['active', 'canceling'])
            ->orderByDesc('ends_at')
            ->first();

        if ($membership === null || $membership->ends_at === null || $membership->ends_at->lte(now())) {
            return response()->json(['message' => 'No active membership to cancel.'], 422);
        }

        Gate::authorize('cancel', $membership);

        $membership->update([
            'status' => 'canceling',
            'cancel_requested_at' => now(),
        ]);

        $membership->loadMissing('plan:id,name');

        return response()->json([
            'data' => $this->membershipPayload($membership),
        ]);
    }

    public function undoCancelMembership(int $id, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $membership = Membership::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->where('status', 'canceling')
            ->orderByDesc('ends_at')
            ->first();

        if ($membership === null || $membership->ends_at === null || $membership->ends_at->lte(now())) {
            return response()->json(['message' => 'No cancel request to undo.'], 422);
        }

        Gate::authorize('undoCancel', $membership);

        $membership->update([
            'status' => 'active',
            'cancel_requested_at' => null,
        ]);

        $membership->loadMissing('plan:id,name');

        return response()->json([
            'data' => $this->membershipPayload($membership),
        ]);
    }

    private function currentMembership(int $gymId, Member $member): ?Membership
    {
        return Membership::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->with(['plan:id,name'])
            ->orderByDesc('ends_at')
            ->first();
    }

    private function membershipPayload(?Membership $membership): ?array
    {
        if ($membership === null || $membership->ends_at === null) {
            return null;
        }

        $now = now();
        $seconds = $membership->ends_at->getTimestamp() - $now->getTimestamp();
        $daysRemaining = (int) ceil($seconds / 86400);

        if ($daysRemaining < 0) {
            $daysRemaining = 0;
        }

        $status = $membership->ends_at->lte($now) ? 'expired' : $membership->status;

        return [
            'id' => $membership->getKey(),
            'membership_plan_id' => $membership->membership_plan_id,
            'plan_name' => $membership->plan?->name,
            'starts_at' => $membership->starts_at,
            'ends_at' => $membership->ends_at,
            'status' => $status,
            'cancel_requested_at' => $membership->cancel_requested_at,
            'days_remaining' => $daysRemaining,
        ];
    }
}
