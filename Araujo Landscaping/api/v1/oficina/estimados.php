<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/office.php';
handlePreflight();

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        $body = readJsonBody();
        $accion = (string) ($body['accion'] ?? 'crear');
        $id = (int) ($body['id'] ?? 0);
        if ($accion === 'terminar') {
            $pdo->prepare('UPDATE estimados SET estado = "terminado" WHERE id = ? AND estado = "firmado"')->execute([$id]);
        } elseif ($accion === 'invoice') {
            $stmt = $pdo->prepare('SELECT * FROM estimados WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row || $row['estado'] !== 'terminado') {
                jsonResponse(['status' => 'error', 'message' => 'Primero marca el trabajo terminado'], 409);
            }
            $items = itemsOf($pdo, 'estimado_partidas', 'estimado_id', $id);
            insertInvoice($pdo, [
                'nombre' => $row['nombre'],
                'telefono' => $row['telefono'],
                'direccion' => $row['direccion'],
                'origen' => 'estimado',
                'estimadoId' => $id,
                'clienteId' => $row['cliente_id'],
            ], $items);
            $pdo->prepare('UPDATE estimados SET estado = "facturado" WHERE id = ?')->execute([$id]);
        } else {
            $items = is_array($body['partidas'] ?? null) ? $body['partidas'] : [];
            $nombre = trim((string) ($body['nombre'] ?? ''));
            $telefono = trim((string) ($body['telefono'] ?? ''));
            $direccion = trim((string) ($body['direccion'] ?? ''));
            $clean = array_values(array_filter($items, static fn ($item): bool => trim((string) ($item['desc'] ?? '')) !== ''));
            if ($nombre === '' || $telefono === '' || $direccion === '' || !$clean) {
                jsonResponse(['status' => 'error', 'message' => 'Falta el nombre, el teléfono, la dirección o una partida.'], 400);
            }
            $numero = nextNumber($pdo, 'seq_est', 'EST');
            $pdo->prepare('INSERT INTO estimados (numero, cliente_id, nombre, telefono, direccion, nota, creado, estado) VALUES (?, ?, ?, ?, ?, ?, ?, "enviado")')
                ->execute([
                    $numero,
                    ($body['clienteId'] ?? null) ? (int) $body['clienteId'] : null,
                    $nombre,
                    $telefono,
                    $direccion,
                    trim((string) ($body['nota'] ?? '')),
                    today(),
                ]);
            replaceItems($pdo, 'estimado_partidas', 'estimado_id', (int) $pdo->lastInsertId(), $clean);
        }
    } else {
        requireMethod('GET');
    }
    jsonResponse(['status' => 'ok', 'estimados' => allEstimates($pdo), 'clientes' => allClients($pdo), 'invoices' => allInvoices($pdo)]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
