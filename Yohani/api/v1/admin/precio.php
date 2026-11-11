<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    $body = readJsonBody();
    $nombre = trim((string) ($body['nombre'] ?? ''));
    $precio = max(0, (float) ($body['precio'] ?? 0));
    $exists = $pdo->prepare('SELECT id FROM servicios WHERE nombre = ?');
    $exists->execute([$nombre]);
    if (!$exists->fetch()) {
        jsonResponse(['status' => 'error', 'message' => 'Ese servicio no está'], 404);
    }
    $pdo->prepare('UPDATE servicios SET precio = ? WHERE nombre = ?')->execute([$precio, $nombre]);
    jsonResponse(adminPayload($pdo));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
