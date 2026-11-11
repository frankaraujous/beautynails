<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/domain.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    $body = readJsonBody();
    $oldDigits = phoneDigits((string) ($body['telefono'] ?? ''));
    $oldName = trim((string) ($body['nombre'] ?? ''));
    $ids = [];
    $photos = [];
    foreach ($pdo->query('SELECT id, nombre, telefono, foto1, foto2 FROM citas') as $row) {
        $digits = phoneDigits((string) $row['telefono']);
        $same = $oldDigits !== ''
            ? $digits === $oldDigits
            : ($digits === '' && (string) $row['nombre'] === $oldName);
        if (!$same) {
            continue;
        }
        $ids[] = (int) $row['id'];
        $photos[] = (string) $row['foto1'];
        $photos[] = (string) $row['foto2'];
    }
    if ($ids === []) {
        jsonResponse(['status' => 'error', 'message' => 'No está esa clienta.'], 404);
    }
    $marks = implode(',', array_fill(0, count($ids), '?'));
    if (($body['accion'] ?? '') === 'borrar') {
        $pdo->prepare("DELETE FROM citas WHERE id IN ($marks)")->execute($ids);
        $dir = dirname(__DIR__, 2) . '/storage';
        foreach ($photos as $file) {
            if (preg_match('/^[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$/', $file) === 1) {
                $path = $dir . '/' . $file;
                if (is_file($path)) {
                    unlink($path);
                }
            }
        }
        jsonResponse(adminPayload($pdo));
    }
    $nombre = trim((string) ($body['nuevoNombre'] ?? ''));
    $telefono = phoneDigits((string) ($body['nuevoTelefono'] ?? ''));
    if ($nombre === '' || strlen($nombre) > 120) {
        jsonResponse(['status' => 'error', 'message' => 'Escribe el nombre.'], 400);
    }
    if (strlen($telefono) !== 10) {
        jsonResponse(['status' => 'error', 'message' => 'El teléfono necesita 10 números.'], 400);
    }

    $taken = false;
    foreach ($pdo->query('SELECT telefono FROM citas') as $row) {
        $digits = phoneDigits((string) $row['telefono']);
        if ($digits === $telefono && !in_array($digits, [$oldDigits], true)) {
            $taken = true;
        }
    }
    if ($oldDigits !== '' && $telefono === $oldDigits) {
        $taken = false;
    }
    if ($taken) {
        jsonResponse(['status' => 'error', 'message' => 'Ese teléfono ya pertenece a otra clienta.'], 409);
    }

    $update = $pdo->prepare("UPDATE citas SET nombre = ?, telefono = ? WHERE id IN ($marks)");
    $update->execute([$nombre, $telefono, ...$ids]);
    jsonResponse(adminPayload($pdo));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
