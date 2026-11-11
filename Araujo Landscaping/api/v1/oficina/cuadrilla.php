<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/office.php';
handlePreflight();

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        $body = readJsonBody();
        $accion = (string) ($body['accion'] ?? '');
        if ($accion === 'cuadrilla') {
            $id = (int) ($body['id'] ?? 0);
            $nombre = trim((string) ($body['nombre'] ?? ''));
            $notas = trim((string) ($body['notas'] ?? ''));
            if ($nombre === '') {
                jsonResponse(['status' => 'error', 'message' => 'Falta el nombre'], 400);
            }
            if ($id > 0) {
                $pdo->prepare('UPDATE cuadrillas SET nombre = ?, notas = ? WHERE id = ?')->execute([$nombre, $notas, $id]);
            } else {
                $pdo->prepare('INSERT INTO cuadrillas (nombre, notas) VALUES (?, ?)')->execute([$nombre, $notas]);
            }
        } elseif ($accion === 'borrar-cuadrilla') {
            $id = (int) ($body['id'] ?? 0);
            $pdo->prepare('DELETE FROM empleado_cuadrillas WHERE cuadrilla_id = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM cuadrillas WHERE id = ?')->execute([$id]);
        } elseif ($accion === 'borrar-empleado') {
            $id = (int) ($body['id'] ?? 0);
            $pdo->prepare('DELETE FROM empleado_cuadrillas WHERE empleado_id = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM empleados WHERE id = ?')->execute([$id]);
        } else {
            $id = (int) ($body['id'] ?? 0);
            $teams = array_values(array_unique(array_filter([
                (int) ($body['cuadrillaId'] ?? 0),
                (int) ($body['cuadrillaExtra'] ?? 0),
            ])));
            $previous = $id > 0 ? employeeTeams($pdo, $id) : [];
            if (count($teams) > 1 && count($previous) < 2) {
                assertPassword($pdo, (string) ($body['password'] ?? ''));
            }
            $codigo = trim((string) ($body['codigo'] ?? ''));
            $nombre = trim((string) ($body['nombre'] ?? ''));
            if ($nombre === '' || $codigo === '') {
                jsonResponse(['status' => 'error', 'message' => 'Falta el nombre o el código'], 400);
            }
            $dup = $pdo->prepare('SELECT id FROM empleados WHERE codigo = ? AND id <> ?');
            $dup->execute([$codigo, $id]);
            if ($dup->fetch()) {
                jsonResponse(['status' => 'error', 'message' => 'Ese código ya está usado'], 409);
            }
            $fields = [
                $nombre,
                trim((string) ($body['telefono'] ?? '')),
                trim((string) ($body['correo'] ?? '')),
                trim((string) ($body['direccion'] ?? '')),
                trim((string) ($body['puesto'] ?? 'Jardinero')),
                trim((string) ($body['notas'] ?? '')),
                max(0, (float) ($body['pagoHora'] ?? 0)),
                $codigo,
            ];
            if ($id > 0) {
                $pdo->prepare('UPDATE empleados SET nombre=?, telefono=?, correo=?, direccion=?, puesto=?, notas=?, pago_hora=?, codigo=? WHERE id=?')
                    ->execute([...$fields, $id]);
            } else {
                $pdo->prepare('INSERT INTO empleados (nombre, telefono, correo, direccion, puesto, notas, pago_hora, codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                    ->execute($fields);
                $id = (int) $pdo->lastInsertId();
            }
            $pdo->prepare('DELETE FROM empleado_cuadrillas WHERE empleado_id = ?')->execute([$id]);
            $link = $pdo->prepare('INSERT INTO empleado_cuadrillas (empleado_id, cuadrilla_id, orden) VALUES (?, ?, ?)');
            foreach (array_slice($teams, 0, 2) as $index => $teamId) {
                $link->execute([$id, $teamId, $index + 1]);
            }
        }
    } else {
        requireMethod('GET');
    }
    jsonResponse(crewPayload($pdo));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
