<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    $body = readJsonBody();
    $id = (int) ($body['empleadoId'] ?? 0);
    $codigo = trim((string) ($body['codigo'] ?? ''));
    $stmt = $pdo->prepare('SELECT id, codigo, nombre FROM empleados WHERE id = ?');
    $stmt->execute([$id]);
    $person = $stmt->fetch();
    if (!$person || $codigo === '' || $codigo !== (string) $person['codigo']) {
        jsonResponse(['status' => 'error', 'message' => 'Código incorrecto.'], 401);
    }
    $open = $pdo->prepare('SELECT id FROM fichajes WHERE empleado_id = ? AND salida IS NULL ORDER BY id DESC LIMIT 1');
    $open->execute([$id]);
    $shift = $open->fetch();
    $lat = isset($body['lat']) ? (float) $body['lat'] : null;
    $lng = isset($body['lng']) ? (float) $body['lng'] : null;
    if (($body['accion'] ?? '') === 'salida') {
        if (!$shift) {
            jsonResponse(['status' => 'error', 'message' => 'No hay una entrada abierta'], 409);
        }
        $pdo->prepare('UPDATE fichajes SET salida = NOW(), lat_salida = ?, lng_salida = ? WHERE id = ?')->execute([$lat, $lng, (int) $shift['id']]);
        $accion = 'salida';
    } else {
        if ($shift) {
            jsonResponse(['status' => 'error', 'message' => 'Ya está en turno'], 409);
        }
        $pdo->prepare('INSERT INTO fichajes (empleado_id, entrada, lat_entrada, lng_entrada) VALUES (?, NOW(), ?, ?)')->execute([$id, $lat, $lng]);
        $accion = 'entrada';
    }
    jsonResponse(['status' => 'ok', 'accion' => $accion, 'nombre' => $person['nombre']]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
