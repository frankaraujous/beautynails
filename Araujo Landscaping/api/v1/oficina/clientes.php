<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/office.php';
handlePreflight();

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        $body = readJsonBody();
        assertPassword($pdo, (string) ($body['password'] ?? ''));
        $accion = (string) ($body['accion'] ?? 'guardar');
        $id = (int) ($body['id'] ?? 0);
        if ($accion === 'inactivo' || $accion === 'activar') {
            $pdo->prepare('UPDATE clientes SET activo = ? WHERE id = ?')->execute([$accion === 'activar' ? 1 : 0, $id]);
        } elseif ($accion === 'borrar') {
            $pdo->prepare('DELETE FROM clientes WHERE id = ?')->execute([$id]);
        } else {
            $fields = [
                trim((string) ($body['nombre'] ?? '')),
                trim((string) ($body['telefono'] ?? '')),
                trim((string) ($body['correo'] ?? '')),
                trim((string) ($body['direccion'] ?? '')),
                (float) ($body['lat'] ?? 0),
                (float) ($body['lng'] ?? 0),
                trim((string) ($body['servicio'] ?? '')),
                (float) ($body['precio'] ?? 0),
                in_array($body['frecuencia'] ?? '', ['semanal', 'quincenal', 'mensual'], true) ? $body['frecuencia'] : 'semanal',
                (int) ($body['dia'] ?? 1),
                trim((string) ($body['notas'] ?? '')),
            ];
            if ($fields[0] === '') {
                jsonResponse(['status' => 'error', 'message' => 'Falta el nombre'], 400);
            }
            if ($id > 0) {
                $pdo->prepare('UPDATE clientes SET nombre=?, telefono=?, correo=?, direccion=?, lat=?, lng=?, servicio=?, precio=?, frecuencia=?, dia_servicio=?, notas=? WHERE id=?')
                    ->execute([...$fields, $id]);
            } else {
                $pdo->prepare('INSERT INTO clientes (nombre, telefono, correo, direccion, lat, lng, servicio, precio, frecuencia, dia_servicio, paridad, notas, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)')
                    ->execute($fields);
            }
        }
    } else {
        requireMethod('GET');
    }
    jsonResponse(['status' => 'ok', 'clientes' => allClients($pdo)]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
