<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Attendance\CheckInRequest;
use App\Http\Requests\Api\V1\Attendance\CheckOutRequest;
use App\Models\Attendance;
use App\Models\Member;
use App\Support\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class AttendanceController extends Controller
{
    public function index(TenantContext $tenant)
    {
        Gate::authorize('viewAny', Attendance::class);

        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $date = request()->query('date');
        $memberId = request()->query('member_id');

        $query = Attendance::query()
            ->where('gym_id', $gymId)
            ->with(['member:id,name', 'checkedInBy:id,name'])
            ->latest('checked_in_at');

        if (is_string($date) && $date !== '') {
            $query->whereDate('checked_in_at', $date);
        }

        if (is_numeric($memberId)) {
            $query->where('member_id', (int) $memberId);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function checkIn(CheckInRequest $request, TenantContext $tenant)
    {
        Gate::authorize('create', Attendance::class);

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

        $checkedInAt = $request->validated('checked_in_at', now());

        $result = DB::transaction(function () use ($gymId, $member, $checkedInAt) {
            $existing = Attendance::query()
                ->where('gym_id', $gymId)
                ->where('member_id', $member->getKey())
                ->whereNull('checked_out_at')
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                return ['already_checked_in' => true, 'attendance' => $existing];
            }

            $attendance = Attendance::query()->create([
                'gym_id' => $gymId,
                'member_id' => $member->getKey(),
                'checked_in_by_user_id' => request()->user()?->getKey(),
                'checked_in_at' => $checkedInAt,
            ]);

            return ['already_checked_in' => false, 'attendance' => $attendance];
        });

        /** @var array{already_checked_in: bool, attendance: Attendance} $result */
        if ($result['already_checked_in']) {
            return response()->json([
                'message' => 'Member is already checked in.',
                'data' => $result['attendance'],
            ], 422);
        }

        return response()->json([
            'data' => $result['attendance'],
        ], 201);
    }

    public function checkOut(int $id, CheckOutRequest $request, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $attendance = Attendance::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($attendance === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        Gate::authorize('checkOut', $attendance);

        if ($attendance->checked_out_at !== null) {
            return response()->json(['message' => 'Already checked out.'], 422);
        }

        $attendance->update([
            'checked_out_at' => $request->validated('checked_out_at', now()),
        ]);

        return response()->json([
            'data' => $attendance,
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

        $attendances = Attendance::query()
            ->where('gym_id', $gymId)
            ->where('member_id', $member->getKey())
            ->latest('checked_in_at')
            ->get();

        return response()->json([
            'data' => $attendances,
        ]);
    }
}
