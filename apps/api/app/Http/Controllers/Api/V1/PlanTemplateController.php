<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PlanTemplate;
use App\Support\TenantContext;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Gate;

final class PlanTemplateController extends Controller
{
    private function validateTemplateJson(string $content, string $type): ?string
    {
        $decoded = json_decode($content, true);

        if (! is_array($decoded)) {
            return 'Template content must be valid JSON.';
        }

        if (($decoded['schema_version'] ?? null) !== 1) {
            return 'Template content must have schema_version = 1.';
        }

        if (($decoded['type'] ?? null) !== $type) {
            return 'Template content type mismatch.';
        }

        $sections = $decoded['sections'] ?? null;

        if (! is_array($sections)) {
            return 'Template content must include sections.';
        }

        return null;
    }

    public function index(TenantContext $tenant)
    {
        Gate::authorize('viewAny', PlanTemplate::class);

        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $type = request()->query('type');

        $query = PlanTemplate::query()
            ->where('gym_id', $gymId)
            ->orderBy('name');

        if (is_string($type) && $type !== '') {
            $type = strtolower(trim($type));
            if (! in_array($type, ['workout', 'food'], true)) {
                return response()->json(['message' => 'Invalid plan type.'], 422);
            }
            $query->where('type', $type);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(TenantContext $tenant)
    {
        Gate::authorize('create', PlanTemplate::class);

        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $payload = request()->validate([
            'type' => ['required', 'string', 'in:workout,food'],
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'content' => ['required', 'string', 'max:20000'],
        ]);

        $type = strtolower(trim($payload['type']));
        $name = trim($payload['name']);
        $content = trim($payload['content']);

        $jsonError = $this->validateTemplateJson($content, $type);
        if ($jsonError !== null) {
            return response()->json(['message' => $jsonError], 422);
        }

        $actorId = request()->user()?->getKey();

        try {
            $template = PlanTemplate::query()->create([
                'gym_id' => $gymId,
                'type' => $type,
                'name' => $name,
                'content' => $content,
                'created_by_user_id' => $actorId,
                'updated_by_user_id' => $actorId,
            ]);
        } catch (QueryException $e) {
            if (str_contains(strtolower($e->getMessage()), 'unique')) {
                return response()->json(['message' => 'Template name already exists.'], 422);
            }
            throw $e;
        }

        return response()->json([
            'data' => $template,
        ], 201);
    }

    public function update(int $id, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $template = PlanTemplate::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($template === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        Gate::authorize('update', $template);

        $payload = request()->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'content' => ['sometimes', 'string', 'max:20000'],
        ]);

        if (array_key_exists('name', $payload)) {
            $template->name = trim((string) $payload['name']);
        }

        if (array_key_exists('content', $payload)) {
            $content = trim((string) $payload['content']);
            $jsonError = $this->validateTemplateJson($content, (string) $template->type);
            if ($jsonError !== null) {
                return response()->json(['message' => $jsonError], 422);
            }
            $template->content = $content;
        }

        $template->updated_by_user_id = request()->user()?->getKey();

        try {
            $template->save();
        } catch (QueryException $e) {
            if (str_contains(strtolower($e->getMessage()), 'unique')) {
                return response()->json(['message' => 'Template name already exists.'], 422);
            }
            throw $e;
        }

        return response()->json([
            'data' => $template,
        ]);
    }

    public function destroy(int $id, TenantContext $tenant)
    {
        $gymId = $tenant->gymId();

        if ($gymId === null) {
            return response()->json(['message' => 'Tenant not resolved.'], 500);
        }

        $template = PlanTemplate::query()
            ->where('gym_id', $gymId)
            ->whereKey($id)
            ->first();

        if ($template === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        Gate::authorize('delete', $template);

        $template->delete();

        return response()->json([
            'message' => 'Deleted.',
        ]);
    }
}

