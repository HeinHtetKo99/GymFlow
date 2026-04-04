<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Payment\StorePaymentRequest;
use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Support\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class PaymentController extends Controller
{
    public function index(TenantContext $tenant)
    {
        Gate::authorize('viewAny', Payment::class);

        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $memberId = request()->query('member_id');
        $status = request()->query('status');

        $query = Payment::query()
            ->where('gym_id', $gymId)
            ->with(['member:id,name', 'recordedBy:id,name'])
            ->latest('paid_at');

        if (is_numeric($memberId)) {
            $query->where('member_id', (int) $memberId);
        }

        if (is_string($status) && $status !== '') {
            $query->where('status', $status);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(StorePaymentRequest $request, TenantContext $tenant)
    {
        Gate::authorize('create', Payment::class);

        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $member = Member::query()
            ->where('gym_id', $gymId)
            ->whereKey($request->validated('member_id'))
            ->first();

        if ($member === null) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        $membershipPlanId = $request->validated('membership_plan_id');

        $plan = null;

        if ($membershipPlanId !== null) {
            $plan = MembershipPlan::query()
                ->where('gym_id', $gymId)
                ->where('is_active', true)
                ->whereKey($membershipPlanId)
                ->first();

            if ($plan === null) {
                return response()->json(['message' => 'Membership plan not found.'], 404);
            }
        } else {
            $plan = MembershipPlan::query()->updateOrCreate(
                ['gym_id' => $gymId, 'name' => 'One-time'],
                [
                    'gym_id' => $gymId,
                    'name' => 'One-time',
                    'duration_days' => 30,
                    'price_cents' => 0,
                    'currency' => 'USD',
                    'is_active' => false,
                    'sort_order' => 0,
                ],
            );
        }

        [$payment, $membership] = DB::transaction(function () use ($request, $gymId, $member, $plan) {
            $payment = Payment::query()->create([
                'gym_id' => $gymId,
                'member_id' => $member->getKey(),
                'membership_plan_id' => $plan?->getKey(),
                'recorded_by_user_id' => request()->user()?->getKey(),
                'amount_cents' => $request->validated('amount_cents'),
                'currency' => strtoupper($request->validated('currency', 'USD')),
                'method' => $request->validated('method', 'cash'),
                'status' => 'paid',
                'paid_at' => $request->validated('paid_at', now()),
                'reference' => $request->validated('reference'),
                'notes' => $request->validated('notes'),
            ]);

            $now = now();

            $current = Membership::query()
                ->where('gym_id', $gymId)
                ->where('member_id', $member->getKey())
                ->whereIn('status', ['active', 'canceling'])
                ->orderByDesc('ends_at')
                ->first();

            if ($current !== null && $current->status === 'canceling' && $current->ends_at !== null && $current->ends_at->gt($now)) {
                $current->update([
                    'status' => 'active',
                    'cancel_requested_at' => null,
                ]);
            }

            $startsAt = $current !== null && $current->ends_at !== null && $current->ends_at->gt($now)
                ? $current->ends_at
                : $now;

            $membership = Membership::query()->create([
                'gym_id' => $gymId,
                'member_id' => $member->getKey(),
                'membership_plan_id' => $plan->getKey(),
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addDays((int) $plan->duration_days),
                'status' => 'active',
                'cancel_requested_at' => null,
            ]);

            $payment->update([
                'membership_plan_id' => $plan->getKey(),
                'membership_id' => $membership->getKey(),
            ]);

            return [$payment, $membership];
        });

        return response()->json([
            'data' => $payment,
            'membership' => $membership,
        ], 201);
    }

    public function show(int $id, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $payment = Payment::query()
            ->where('gym_id', $gymId)
            ->with([
                'member:id,name,user_id',
                'recordedBy:id,name',
                'membershipPlan:id,name,duration_days,price_cents,currency',
            ])
            ->whereKey($id)
            ->first();

        if ($payment === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        Gate::authorize('view', $payment);

        return response()->json([
            'data' => $payment,
        ]);
    }

    public function void(int $id, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $payment = Payment::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($payment === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        Gate::authorize('void', $payment);

        if ($payment->status !== 'paid') {
            return response()->json(['message' => 'Only paid payments can be voided.'], 422);
        }

        $payment->update([
            'status' => 'void',
        ]);

        return response()->json([
            'data' => $payment,
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

        $payments = Payment::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->latest('paid_at')
            ->get();

        return response()->json([
            'data' => $payments,
        ]);
    }
}
