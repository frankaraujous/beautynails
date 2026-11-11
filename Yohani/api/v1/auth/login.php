<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    $password = (string) (readJsonBody()['password'] ?? '');
    $hash = setting($pdo, 'admin_password_hash');
    if ($hash === '' || !password_verify($password, $hash)) {
        jsonResponse(['status' => 'error', 'message' => 'PIN incorrecto.'], 401);
    }
    jsonResponse(['status' => 'ok', 'token' => issueToken($pdo)]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
