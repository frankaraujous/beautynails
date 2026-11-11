<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/office.php';
handlePreflight();

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        $meta = max(0, (float) (readJsonBody()['meta'] ?? 0));
        setSetting($pdo, 'meta_mensual', (string) $meta);
    } else {
        requireMethod('GET');
    }
    jsonResponse(summaryPayload($pdo));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
