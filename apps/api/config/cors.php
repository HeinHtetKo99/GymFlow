<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter(array_map(
        fn ($v) => is_string($v) ? rtrim(trim($v), '/') : '',
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:3000'))
    ))),
    'allowed_origins_patterns' => array_values(array_filter(array_map(
        fn ($v) => is_string($v) ? trim($v) : '',
        array_merge(
            ['^https://.*\\.vercel\\.app$'],
            explode(',', (string) env('FRONTEND_URL_PATTERNS', ''))
        )
    ))),
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
