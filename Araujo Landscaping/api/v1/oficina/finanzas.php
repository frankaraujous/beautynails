<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/office.php';
handlePreflight();

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        $body = readJsonBody();
        $accion = (string) ($body['accion'] ?? 'gasto');
        if ($accion === 'cobrar') {
            $pago = trim((string) ($body['pago'] ?? ''));
            if (!in_array($pago, ['Efectivo', 'Cheque', 'Zelle', 'Tarjeta'], true)) {
                jsonResponse(['status' => 'error', 'message' => 'Elige cómo se cobró'], 400);
            }
            $pdo->prepare('UPDATE invoices SET estado = "pagado", pagado_en = ?, pago = ? WHERE id = ? AND estado = "por-cobrar"')
                ->execute([today(), $pago, (int) ($body['id'] ?? 0)]);
        } elseif ($accion === 'costos') {
            $id = (int) ($body['id'] ?? 0);
            $pdo->prepare('INSERT INTO invoice_costos (invoice_id, materiales, mano_obra, basurero, otros) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE materiales=VALUES(materiales), mano_obra=VALUES(mano_obra), basurero=VALUES(basurero), otros=VALUES(otros)')
                ->execute([
                    $id,
                    max(0, (float) ($body['materiales'] ?? 0)),
                    max(0, (float) ($body['manoObra'] ?? 0)),
                    max(0, (float) ($body['basurero'] ?? 0)),
                    max(0, (float) ($body['otros'] ?? 0)),
                ]);
        } else {
            $categoria = trim((string) ($body['categoria'] ?? ''));
            $monto = (float) ($body['monto'] ?? -1);
            $fecha = trim((string) ($body['fecha'] ?? ''));
            if ($categoria === '' || $fecha === '' || $monto < 0) {
                jsonResponse(['status' => 'error', 'message' => 'Completa el gasto'], 400);
            }
            $pdo->prepare('INSERT INTO gastos (fecha, categoria, descripcion, monto) VALUES (?, ?, ?, ?)')
                ->execute([$fecha, $categoria, trim((string) ($body['descripcion'] ?? '')), $monto]);
        }
    } else {
        requireMethod('GET');
    }
    jsonResponse(financePayload($pdo));
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
