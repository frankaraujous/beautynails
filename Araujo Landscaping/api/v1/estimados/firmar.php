<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/office.php';
handlePreflight();
requireMethod('POST');

try {
    $pdo = getPdo();
    $body = readJsonBody();
    $id = (int) ($body['id'] ?? 0);
    $nombre = trim((string) ($body['nombre'] ?? ''));
    $stmt = $pdo->prepare('SELECT * FROM estimados WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row || $row['estado'] !== 'enviado') {
        jsonResponse(['status' => 'error', 'message' => 'Ese estimado no está listo para firmar'], 409);
    }
    if ($nombre === '') {
        jsonResponse(['status' => 'error', 'message' => 'Escribe tu nombre'], 400);
    }
    $firma = saveImage($body['firma'] ?? '');
    if ($firma === '') {
        jsonResponse(['status' => 'error', 'message' => 'Firma para aceptar el estimado.'], 400);
    }
    $pdo->prepare('UPDATE estimados SET estado = "firmado", firma = ?, firmo_nombre = ?, firmado_en = ? WHERE id = ?')
        ->execute([$firma, $nombre, today(), $id]);
    jsonResponse(['status' => 'ok', 'estimado' => mapEstimate($pdo, array_merge($row, [
        'estado' => 'firmado',
        'firma' => $firma,
        'firmo_nombre' => $nombre,
        'firmado_en' => today(),
    ]))]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
