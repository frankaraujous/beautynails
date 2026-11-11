<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    $body = readJsonBody();
    $codigo = trim((string) ($body['codigo'] ?? ''));
    if (($body['tipo'] ?? '') === 'admin') {
        assertPassword($pdo, $codigo);
        jsonResponse(['status' => 'ok', 'tipo' => 'admin']);
    }
    $id = (int) ($body['empleadoId'] ?? 0);
    $stmt = $pdo->prepare('SELECT id, nombre, codigo FROM empleados WHERE id = ?');
    $stmt->execute([$id]);
    $person = $stmt->fetch();
    if (!$person || $codigo === '' || $codigo !== (string) $person['codigo']) {
        jsonResponse(['status' => 'error', 'message' => 'Código incorrecto.'], 401);
    }
    jsonResponse(['status' => 'ok', 'tipo' => 'empleado', 'empleadoId' => (int) $person['id'], 'nombre' => $person['nombre']]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
