<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    $body = readJsonBody();
    $fecha = trim((string) ($body['fecha'] ?? ''));
    $hora = hourKey(trim((string) ($body['hora'] ?? '')));
    $accion = (string) ($body['accion'] ?? '');
    if ($fecha < today()) {
        jsonResponse(['status' => 'error', 'message' => 'Ese día ya pasó.'], 400);
    }
    if ($accion === 'hora') {
        if (!in_array($hora, WORK_HOURS, true)) {
            jsonResponse(['status' => 'error', 'message' => 'Esa hora no existe'], 400);
        }
        $open = $pdo->prepare('SELECT id FROM disponibilidad WHERE fecha = ? AND hora = ?');
        $open->execute([$fecha, $hora . ':00']);
        if ($open->fetch()) {
            $busy = $pdo->prepare('SELECT id FROM citas WHERE fecha = ? AND hora = ? AND terminada = 0');
            $busy->execute([$fecha, $hora . ':00']);
            if ($busy->fetch()) {
                jsonResponse(['status' => 'error', 'message' => 'Esa hora ya tiene una cita. No se puede cerrar.'], 409);
            }
            $pdo->prepare('DELETE FROM disponibilidad WHERE fecha = ? AND hora = ?')->execute([$fecha, $hora . ':00']);
            $left = $pdo->prepare('SELECT id FROM disponibilidad WHERE fecha = ?');
            $left->execute([$fecha]);
            if (!$left->fetch()) {
                $pdo->prepare('INSERT IGNORE INTO dias_libres (fecha) VALUES (?)')->execute([$fecha]);
            }
        } else {
            $pdo->prepare('DELETE FROM dias_libres WHERE fecha = ?')->execute([$fecha]);
            $pdo->prepare('INSERT IGNORE INTO disponibilidad (fecha, hora) VALUES (?, ?)')->execute([$fecha, $hora . ':00']);
        }
    } elseif ($accion === 'libre') {
        $busy = $pdo->prepare('SELECT id FROM citas WHERE fecha = ? AND terminada = 0');
        $busy->execute([$fecha]);
        if ($busy->fetch()) {
            jsonResponse(['status' => 'error', 'message' => 'Ese día ya tiene citas. No se puede dejar libre.'], 409);
        }
        $already = $pdo->prepare('SELECT fecha FROM dias_libres WHERE fecha = ?');
        $already->execute([$fecha]);
        if ($already->fetch()) {
            $pdo->prepare('DELETE FROM dias_libres WHERE fecha = ?')->execute([$fecha]);
            $insert = $pdo->prepare('INSERT IGNORE INTO disponibilidad (fecha, hora) VALUES (?, ?)');
            foreach (WORK_HOURS as $hour) {
                $insert->execute([$fecha, $hour . ':00']);
            }
        } else {
            $pdo->prepare('INSERT IGNORE INTO dias_libres (fecha) VALUES (?)')->execute([$fecha]);
            $pdo->prepare('DELETE FROM disponibilidad WHERE fecha = ?')->execute([$fecha]);
        }
    } else {
        jsonResponse(['status' => 'error', 'message' => 'Acción desconocida'], 400);
    }
    jsonResponse(adminPayload($pdo));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
