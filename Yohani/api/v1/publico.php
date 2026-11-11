<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/domain.php';
handlePreflight();
requireMethod('GET');

try {
    jsonResponse(publicPayload(getPdo()));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
