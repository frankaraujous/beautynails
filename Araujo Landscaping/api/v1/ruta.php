<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/domain.php';
handlePreflight();

try {
    $pdo = getPdo();
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        $body = readJsonBody();
        $fecha = trim((string) ($body['fecha'] ?? today()));
        $cuadrilla = (int) ($body['cuadrillaId'] ?? 0);
        if ($cuadrilla > 0) {
            $pdo->prepare('INSERT INTO ruta_dia (fecha, cuadrilla_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE cuadrilla_id = VALUES(cuadrilla_id)')->execute([$fecha, $cuadrilla]);
        }
        jsonResponse(routePayload($pdo, $fecha, $cuadrilla, !empty($body['todas'])));
    }
    requireMethod('GET');
    $fecha = trim((string) ($_GET['fecha'] ?? today()));
    $cuadrilla = (int) ($_GET['cuadrillaId'] ?? 0);
    $todas = ($_GET['todas'] ?? '') === '1';
    jsonResponse(routePayload($pdo, $fecha, $cuadrilla, $todas));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
