<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    ensureSchedule($pdo);
    $body = readJsonBody();
    $nombre = trim((string) ($body['nombre'] ?? ''));
    $telefono = preg_replace('/\D+/', '', trim((string) ($body['telefono'] ?? ''))) ?? '';
    $servicio = trim((string) ($body['servicio'] ?? ''));
    $pago = trim((string) ($body['pago'] ?? ''));
    $serviceNames = array_values(array_unique(array_filter(array_map('trim', explode(',', $servicio)), static fn (string $name): bool => $name !== '')));
    $payNames = array_values(array_unique(array_filter(array_map('trim', explode(',', $pago)), static fn (string $name): bool => in_array($name, ['Efectivo', 'Transferencia'], true))));
    $color = trim((string) ($body['color'] ?? ''));
    $fecha = trim((string) ($body['fecha'] ?? ''));
    $hora = hourKey(trim((string) ($body['hora'] ?? '')));
    $alergia = trim((string) ($body['alergia'] ?? ''));
    if ($nombre === '' || $telefono === '') {
        jsonResponse(['status' => 'error', 'message' => 'Escribe tu nombre y teléfono.'], 400);
    }
    if ($serviceNames === []) {
        jsonResponse(['status' => 'error', 'message' => 'Elige un tipo de servicio.'], 400);
    }
    $known = $pdo->prepare('SELECT nombre, precio FROM servicios WHERE nombre = ?');
    foreach ($serviceNames as $serviceName) {
        $known->execute([$serviceName]);
        if (!$known->fetch()) {
            jsonResponse(['status' => 'error', 'message' => 'Elige un tipo de servicio.'], 400);
        }
    }
    $servicio = implode(', ', $serviceNames);
    if ($payNames === []) {
        jsonResponse(['status' => 'error', 'message' => 'Elige cómo vas a pagar.'], 400);
    }
    $pago = implode(', ', $payNames);
    if ($color === '') {
        jsonResponse(['status' => 'error', 'message' => 'Elige el color para tu cita, o indica que traes el tuyo.'], 400);
    }
    if ($fecha < today()) {
        jsonResponse(['status' => 'error', 'message' => 'Ese día ya pasó.'], 400);
    }
    if ($fecha === today() && $hora <= (new DateTimeImmutable('now', appTimezone()))->format('H:i')) {
        jsonResponse(['status' => 'error', 'message' => 'Ese horario acaba de ocuparse. Elige otro.'], 409);
    }
    $off = $pdo->prepare('SELECT fecha FROM dias_libres WHERE fecha = ?');
    $off->execute([$fecha]);
    if ($off->fetch()) {
        jsonResponse(['status' => 'error', 'message' => 'Ese día no hay horas.'], 409);
    }
    $open = $pdo->prepare('SELECT id FROM disponibilidad WHERE fecha = ? AND hora = ?');
    $open->execute([$fecha, $hora . ':00']);
    if (!$open->fetch()) {
        jsonResponse(['status' => 'error', 'message' => 'Elige un horario libre.'], 409);
    }
    $taken = $pdo->prepare('SELECT id FROM citas WHERE fecha = ? AND hora = ? AND terminada = 0');
    $taken->execute([$fecha, $hora . ':00']);
    if ($taken->fetch()) {
        jsonResponse(['status' => 'error', 'message' => 'Ese horario acaba de ocuparse. Elige otro.'], 409);
    }
    $foto1 = saveImage($body['foto1'] ?? '');
    $foto2 = saveImage($body['foto2'] ?? '');
    $codigo = in_array('Transferencia', $payNames, true) ? nextTransferCode($pdo) : '';
    $stmt = $pdo->prepare('INSERT INTO citas (nombre, telefono, servicio, pago, color, codigo_transferencia, fecha, hora, foto1, foto2, alergia, creada_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
    $stmt->execute([$nombre, $telefono, $servicio, $pago, $color, $codigo, $fecha, $hora . ':00', $foto1, $foto2, $alergia]);
    $id = (int) $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM citas WHERE id = ?');
    $row->execute([$id]);
    jsonResponse([
        'status' => 'ok',
        'cita' => mapCita($row->fetch()),
        'textTo' => setting($pdo, 'text_to'),
    ]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
