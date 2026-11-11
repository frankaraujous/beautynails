<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    $body = readJsonBody();
    $id = (int) ($body['id'] ?? 0);
    $accion = (string) ($body['accion'] ?? '');
    $stmt = $pdo->prepare('SELECT * FROM citas WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        jsonResponse(['status' => 'error', 'message' => 'No está esa cita'], 404);
    }
    if ($accion === 'confirmar') {
        $pdo->prepare('UPDATE citas SET confirmada = 1 WHERE id = ?')->execute([$id]);
    } elseif ($accion === 'cancelar') {
        if ((int) $row['terminada'] === 1) {
            jsonResponse(['status' => 'error', 'message' => 'Esa cita ya no se puede cancelar'], 409);
        }
        $pdo->prepare('UPDATE citas SET cancelada = 1 WHERE id = ?')->execute([$id]);
    } elseif ($accion === 'reprogramar') {
        if ((int) $row['confirmada'] !== 1 || (int) ($row['cancelada'] ?? 0) === 1 || (int) $row['terminada'] === 1) {
            jsonResponse(['status' => 'error', 'message' => 'Solo se reprograma una cita confirmada'], 409);
        }
        $fecha = trim((string) ($body['fecha'] ?? ''));
        $hora = hourKey(trim((string) ($body['hora'] ?? '')));
        if ($fecha === '' || $hora === '') {
            jsonResponse(['status' => 'error', 'message' => 'Elige el día y la hora.'], 400);
        }
        if ($fecha < today()) {
            jsonResponse(['status' => 'error', 'message' => 'Ese día ya pasó.'], 400);
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
        $taken = $pdo->prepare('SELECT id FROM citas WHERE fecha = ? AND hora = ? AND terminada = 0 AND cancelada = 0 AND id <> ?');
        $taken->execute([$fecha, $hora . ':00', $id]);
        if ($taken->fetch()) {
            jsonResponse(['status' => 'error', 'message' => 'Ese horario acaba de ocuparse. Elige otro.'], 409);
        }
        $pdo->prepare('UPDATE citas SET fecha = ?, hora = ? WHERE id = ?')->execute([$fecha, $hora . ':00', $id]);
    } elseif ($accion === 'terminar') {
        if ((int) $row['confirmada'] !== 1 || (int) $row['terminada'] === 1) {
            jsonResponse(['status' => 'error', 'message' => 'Primero confirma la cita'], 409);
        }
        $monto = (float) ($body['monto'] ?? 0);
        if ($monto < 0) {
            $monto = 0;
        }
        $pdo->prepare('UPDATE citas SET terminada = 1, monto = ? WHERE id = ?')->execute([$monto, $id]);
    } elseif ($accion === 'monto') {
        $monto = max(0, (float) ($body['monto'] ?? 0));
        $pdo->prepare('UPDATE citas SET monto = ? WHERE id = ?')->execute([$monto, $id]);
    } else {
        jsonResponse(['status' => 'error', 'message' => 'Acción desconocida'], 400);
    }
    jsonResponse(adminPayload($pdo));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
