<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    assertPassword($pdo, (string) (readJsonBody()['password'] ?? ''));
    jsonResponse(['status' => 'ok', 'token' => issueToken($pdo)]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
