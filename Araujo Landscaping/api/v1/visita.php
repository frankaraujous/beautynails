<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/office.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    $body = readJsonBody();
    $clienteId = (int) ($body['clienteId'] ?? 0);
    $fecha = trim((string) ($body['fecha'] ?? today()));
    $fase = (string) ($body['fase'] ?? '');
    $empleadoId = (int) ($body['empleadoId'] ?? 0);
    $client = $pdo->prepare('SELECT * FROM clientes WHERE id = ?');
    $client->execute([$clienteId]);
    $row = $client->fetch();
    if (!$row) {
        jsonResponse(['status' => 'error', 'message' => 'No está ese cliente'], 404);
    }
    $photo = saveImage($body['foto'] ?? '');
    $existing = $pdo->prepare('SELECT * FROM visitas WHERE cliente_id = ? AND fecha = ?');
    $existing->execute([$clienteId, $fecha]);
    $visit = $existing->fetch();
    if ($fase === 'fin') {
        if ($visit) {
            $pdo->prepare('UPDATE visitas SET foto_despues = IF(? = "", foto_despues, ?), empleado_id = ?, iniciada = 1, terminada = 1 WHERE id = ?')
                ->execute([$photo, $photo, $empleadoId ?: null, (int) $visit['id']]);
        } else {
            $pdo->prepare('INSERT INTO visitas (cliente_id, fecha, foto_despues, empleado_id, iniciada, terminada) VALUES (?, ?, ?, ?, 1, 1)')
                ->execute([$clienteId, $fecha, $photo, $empleadoId ?: null]);
        }
        $dup = $pdo->prepare('SELECT id FROM invoices WHERE cliente_id = ? AND emitido = ? AND origen = "ruta"');
        $dup->execute([$clienteId, $fecha]);
        if (!$dup->fetch()) {
            insertInvoice($pdo, [
                'emitido' => $fecha,
                'nombre' => $row['nombre'],
                'telefono' => $row['telefono'],
                'direccion' => $row['direccion'],
                'origen' => 'ruta',
                'clienteId' => $clienteId,
            ], [['desc' => $row['servicio'], 'qty' => 1, 'precio' => (float) $row['precio']]]);
        }
    } else {
        if ($visit) {
            $pdo->prepare('UPDATE visitas SET foto_antes = IF(? = "", foto_antes, ?), empleado_id = IFNULL(empleado_id, ?), iniciada = 1 WHERE id = ?')
                ->execute([$photo, $photo, $empleadoId ?: null, (int) $visit['id']]);
        } else {
            $pdo->prepare('INSERT INTO visitas (cliente_id, fecha, foto_antes, empleado_id, iniciada, terminada) VALUES (?, ?, ?, ?, 1, 0)')
                ->execute([$clienteId, $fecha, $photo, $empleadoId ?: null]);
        }
    }
    jsonResponse(['status' => 'ok']);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
