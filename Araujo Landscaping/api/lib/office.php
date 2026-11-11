<?php
declare(strict_types=1);

require_once __DIR__ . '/domain.php';

function itemsOf(PDO $pdo, string $table, string $column, int $id): array
{
    $stmt = $pdo->prepare("SELECT descripcion, cantidad, precio FROM {$table} WHERE {$column} = ? ORDER BY orden, id");
    $stmt->execute([$id]);
    $items = [];
    foreach ($stmt as $row) {
        $items[] = [
            'desc' => $row['descripcion'],
            'qty' => (float) $row['cantidad'],
            'precio' => (float) $row['precio'],
        ];
    }
    return $items;
}

function replaceItems(PDO $pdo, string $table, string $column, int $id, array $items): void
{
    $pdo->prepare("DELETE FROM {$table} WHERE {$column} = ?")->execute([$id]);
    $insert = $pdo->prepare("INSERT INTO {$table} ({$column}, descripcion, cantidad, precio, orden) VALUES (?, ?, ?, ?, ?)");
    $order = 1;
    foreach ($items as $item) {
        $desc = trim((string) ($item['desc'] ?? ''));
        if ($desc === '') {
            continue;
        }
        $insert->execute([$id, $desc, (float) ($item['qty'] ?? 1), (float) ($item['precio'] ?? 0), $order]);
        $order += 1;
    }
}

function itemsTotal(array $items): float
{
    $sum = 0.0;
    foreach ($items as $item) {
        $sum += (float) ($item['qty'] ?? 0) * (float) ($item['precio'] ?? 0);
    }
    return round($sum, 2);
}

function mapEstimate(PDO $pdo, array $row): array
{
    return [
        'id' => (int) $row['id'],
        'numero' => $row['numero'],
        'clienteId' => $row['cliente_id'] === null ? null : (int) $row['cliente_id'],
        'nombre' => $row['nombre'],
        'telefono' => $row['telefono'],
        'direccion' => $row['direccion'],
        'nota' => $row['nota'],
        'firma' => mediaUrl((string) $row['firma']),
        'firmo' => $row['firmo_nombre'],
        'firmadoEn' => $row['firmado_en'],
        'creado' => $row['creado'],
        'estado' => $row['estado'],
        'partidas' => itemsOf($pdo, 'estimado_partidas', 'estimado_id', (int) $row['id']),
    ];
}

function mapInvoice(PDO $pdo, array $row): array
{
    $cost = $pdo->prepare('SELECT * FROM invoice_costos WHERE invoice_id = ?');
    $cost->execute([(int) $row['id']]);
    $costs = $cost->fetch() ?: ['materiales' => 0, 'mano_obra' => 0, 'basurero' => 0, 'otros' => 0];
    return [
        'id' => (int) $row['id'],
        'numero' => $row['numero'],
        'estado' => $row['estado'],
        'emitido' => $row['emitido'],
        'pagadoEn' => $row['pagado_en'],
        'pago' => $row['pago'],
        'nombre' => $row['nombre'],
        'telefono' => $row['telefono'],
        'direccion' => $row['direccion'],
        'subtotal' => (float) $row['subtotal'],
        'total' => (float) $row['total'],
        'origen' => $row['origen'],
        'estimadoId' => $row['estimado_id'] === null ? null : (int) $row['estimado_id'],
        'clienteId' => $row['cliente_id'] === null ? null : (int) $row['cliente_id'],
        'partidas' => itemsOf($pdo, 'invoice_partidas', 'invoice_id', (int) $row['id']),
        'costos' => [
            'materiales' => (float) $costs['materiales'],
            'manoObra' => (float) $costs['mano_obra'],
            'basurero' => (float) $costs['basurero'],
            'otros' => (float) $costs['otros'],
        ],
    ];
}

function allClients(PDO $pdo): array
{
    return array_map('mapClient', $pdo->query('SELECT * FROM clientes ORDER BY nombre')->fetchAll());
}

function allEstimates(PDO $pdo): array
{
    $rows = [];
    foreach ($pdo->query('SELECT * FROM estimados ORDER BY id DESC') as $row) {
        $rows[] = mapEstimate($pdo, $row);
    }
    return $rows;
}

function allInvoices(PDO $pdo): array
{
    $rows = [];
    foreach ($pdo->query('SELECT * FROM invoices ORDER BY id DESC') as $row) {
        $rows[] = mapInvoice($pdo, $row);
    }
    return $rows;
}

function employeeTeams(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare('SELECT cuadrilla_id FROM empleado_cuadrillas WHERE empleado_id = ? ORDER BY orden, cuadrilla_id');
    $stmt->execute([$id]);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function crewPayload(PDO $pdo): array
{
    $teams = $pdo->query('SELECT id, nombre, notas FROM cuadrillas ORDER BY id')->fetchAll();
    $people = [];
    foreach ($pdo->query('SELECT * FROM empleados ORDER BY nombre') as $row) {
        $people[] = [
            'id' => (int) $row['id'],
            'nombre' => $row['nombre'],
            'telefono' => $row['telefono'],
            'correo' => $row['correo'],
            'direccion' => $row['direccion'],
            'puesto' => $row['puesto'],
            'notas' => $row['notas'],
            'pagoHora' => (float) $row['pago_hora'],
            'codigo' => $row['codigo'],
            'cuadrillas' => employeeTeams($pdo, (int) $row['id']),
        ];
    }
    $punches = [];
    foreach ($pdo->query('SELECT f.*, e.nombre FROM fichajes f JOIN empleados e ON e.id = f.empleado_id ORDER BY f.entrada DESC LIMIT 80') as $row) {
        $punches[] = [
            'id' => (int) $row['id'],
            'empleadoId' => (int) $row['empleado_id'],
            'nombre' => $row['nombre'],
            'entrada' => $row['entrada'],
            'salida' => $row['salida'],
            'latEntrada' => $row['lat_entrada'],
            'lngEntrada' => $row['lng_entrada'],
            'latSalida' => $row['lat_salida'],
            'lngSalida' => $row['lng_salida'],
        ];
    }
    return [
        'status' => 'ok',
        'cuadrillas' => array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'nombre' => $row['nombre'],
            'notas' => $row['notas'],
        ], $teams),
        'empleados' => $people,
        'fichajes' => $punches,
    ];
}

function financePayload(PDO $pdo): array
{
    $expenses = [];
    foreach ($pdo->query('SELECT * FROM gastos ORDER BY fecha DESC, id DESC') as $row) {
        $expenses[] = [
            'id' => (int) $row['id'],
            'fecha' => $row['fecha'],
            'categoria' => $row['categoria'],
            'descripcion' => $row['descripcion'],
            'monto' => (float) $row['monto'],
        ];
    }
    $hours = (float) $pdo->query('SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, entrada, salida)), 0) / 60 AS h FROM fichajes WHERE salida IS NOT NULL')->fetch()['h'];
    return [
        'status' => 'ok',
        'invoices' => allInvoices($pdo),
        'gastos' => $expenses,
        'horas' => round($hours, 1),
    ];
}

function summaryPayload(PDO $pdo): array
{
    $month = (new DateTimeImmutable('now', appTimezone()))->format('Y-m');
    $invoices = allInvoices($pdo);
    $monthInvoices = array_values(array_filter($invoices, static fn (array $item): bool => str_starts_with((string) $item['emitido'], $month)));
    $collected = 0.0;
    $maintenance = 0.0;
    $due = 0.0;
    foreach ($monthInvoices as $item) {
        if ($item['estado'] === 'pagado') {
            $collected += $item['total'];
        }
        if ($item['origen'] === 'ruta') {
            $maintenance += $item['total'];
        }
    }
    foreach ($invoices as $item) {
        if ($item['estado'] !== 'pagado') {
            $due += $item['total'];
        }
    }
    $jobs = 0;
    foreach (allEstimates($pdo) as $item) {
        if (in_array($item['estado'], ['firmado', 'terminado', 'facturado'], true) && str_starts_with((string) $item['creado'], $month)) {
            $jobs += 1;
        }
    }
    $visitCount = $pdo->prepare('SELECT COUNT(*) FROM visitas WHERE fecha LIKE ?');
    $visitCount->execute([$month . '%']);
    $jobs += (int) $visitCount->fetchColumn();
    $clients = allClients($pdo);
    $active = array_values(array_filter($clients, static fn (array $client): bool => $client['activo']));
    $mrr = 0.0;
    foreach ($active as $client) {
        $price = $client['precio'];
        if ($client['frecuencia'] === 'quincenal') {
            $mrr += $price * (26 / 12);
        } elseif ($client['frecuencia'] === 'mensual') {
            $mrr += $price;
        } else {
            $mrr += $price * (52 / 12);
        }
    }
    $count = count($active);
    $average = $count ? $mrr / $count : 0;
    $goal = (float) setting($pdo, 'meta_mensual');
    $gap = max(0, $goal - $mrr);
    return [
        'status' => 'ok',
        'cobrado' => round($collected, 2),
        'mantenimiento' => round($maintenance, 2),
        'trabajos' => $jobs,
        'porCobrar' => round($due, 2),
        'clientes' => $count,
        'recurrente' => round($mrr, 2),
        'promedio' => round($average, 2),
        'meta' => $goal,
        'faltan' => $average > 0 ? (int) ceil($gap / $average) : 0,
    ];
}

function payrollRows(PDO $pdo, string $start): array
{
    $end = (new DateTimeImmutable($start))->modify('+7 days')->format('Y-m-d');
    $stmt = $pdo->prepare('SELECT empleado_id, entrada, salida FROM fichajes WHERE salida IS NOT NULL AND DATE(entrada) >= ? AND DATE(entrada) < ?');
    $stmt->execute([$start, $end]);
    $byPerson = [];
    foreach ($stmt as $row) {
        $day = substr((string) $row['entrada'], 0, 10);
        $hours = (strtotime((string) $row['salida']) - strtotime((string) $row['entrada'])) / 3600;
        $byPerson[(int) $row['empleado_id']][$day] = ($byPerson[(int) $row['empleado_id']][$day] ?? 0) + max(0, $hours);
    }
    $rows = [];
    foreach ($pdo->query('SELECT * FROM empleados ORDER BY nombre') as $person) {
        $days = $byPerson[(int) $person['id']] ?? [];
        $regular = 0.0;
        $overtime = 0.0;
        $double = 0.0;
        foreach ($days as $hours) {
            $regular += min(8, $hours);
            $overtime += min(4, max(0, $hours - 8));
            $double += max(0, $hours - 12);
        }
        if ($regular > 40) {
            $overtime += $regular - 40;
            $regular = 40;
        }
        if ($regular + $overtime + $double <= 0) {
            continue;
        }
        $rate = (float) $person['pago_hora'];
        $rows[] = [
            'nombre' => $person['nombre'],
            'pagoHora' => $rate,
            'normal' => round($regular, 2),
            'extra' => round($overtime, 2),
            'doble' => round($double, 2),
            'pago' => round($regular * $rate + $overtime * $rate * 1.5 + $double * $rate * 2, 2),
        ];
    }
    return $rows;
}

function insertInvoice(PDO $pdo, array $fields, array $items): int
{
    $total = itemsTotal($items);
    $numero = $fields['numero'] ?? nextNumber($pdo, 'seq_inv', 'INV');
    $stmt = $pdo->prepare('INSERT INTO invoices (numero, estado, emitido, nombre, telefono, direccion, subtotal, impuesto, total, origen, estimado_id, cliente_id) VALUES (?, "por-cobrar", ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)');
    $stmt->execute([
        $numero,
        $fields['emitido'] ?? today(),
        $fields['nombre'],
        $fields['telefono'] ?? '',
        $fields['direccion'] ?? '',
        $total,
        $total,
        $fields['origen'] ?? 'estimado',
        $fields['estimadoId'] ?? null,
        $fields['clienteId'] ?? null,
    ]);
    $id = (int) $pdo->lastInsertId();
    replaceItems($pdo, 'invoice_partidas', 'invoice_id', $id, $items);
    $pdo->prepare('INSERT INTO invoice_costos (invoice_id, materiales, mano_obra, basurero, otros) VALUES (?, 0, 0, 0, 0)')->execute([$id]);
    return $id;
}
