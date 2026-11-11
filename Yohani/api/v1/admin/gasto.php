<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    $body = readJsonBody();
    if (($body['accion'] ?? '') === 'borrar') {
        $pdo->prepare('DELETE FROM gastos WHERE id = ?')->execute([(int) ($body['id'] ?? 0)]);
    } else {
        $nombre = trim((string) ($body['nombre'] ?? ''));
        $fecha = trim((string) ($body['fecha'] ?? ''));
        $monto = (float) ($body['monto'] ?? -1);
        if ($nombre === '' || $fecha === '' || $monto < 0) {
            jsonResponse(['status' => 'error', 'message' => 'Completa el gasto'], 400);
        }
        $pdo->prepare('INSERT INTO gastos (nombre, monto, fecha) VALUES (?, ?, ?)')->execute([$nombre, $monto, $fecha]);
    }
    jsonResponse(adminPayload($pdo));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
