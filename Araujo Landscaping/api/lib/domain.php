<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

const MAX_PHOTO = 450 * 1024;

function setting(PDO $pdo, string $key): string
{
    $stmt = $pdo->prepare('SELECT valor FROM ajustes WHERE clave = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? (string) $row['valor'] : '';
}

function setSetting(PDO $pdo, string $key, string $value): void
{
    $stmt = $pdo->prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)');
    $stmt->execute([$key, $value]);
}

function requireAdmin(PDO $pdo): void
{
    $token = trim((string) ($_SERVER['HTTP_X_APP_TOKEN'] ?? ''));
    if ($token === '') {
        jsonResponse(['status' => 'error', 'message' => 'Contraseña requerida'], 401);
    }
    $stmt = $pdo->prepare('SELECT token FROM sesiones WHERE token = ? AND expira > NOW()');
    $stmt->execute([$token]);
    if (!$stmt->fetch()) {
        jsonResponse(['status' => 'error', 'message' => 'La sesión venció'], 401);
    }
}

function issueToken(PDO $pdo): string
{
    $token = bin2hex(random_bytes(32));
    $expira = (new DateTimeImmutable('now', appTimezone()))->modify('+12 hours')->format('Y-m-d H:i:s');
    $stmt = $pdo->prepare('INSERT INTO sesiones (token, expira) VALUES (?, ?)');
    $stmt->execute([$token, $expira]);
    return $token;
}

function assertPassword(PDO $pdo, string $password): void
{
    $hash = setting($pdo, 'admin_password_hash');
    if ($hash === '' || !password_verify($password, $hash)) {
        jsonResponse(['status' => 'error', 'message' => 'Contraseña incorrecta.'], 401);
    }
}

function phoneDigits(string $phone): string
{
    return preg_replace('/\D/', '', $phone) ?? '';
}

function saveImage(?string $data): string
{
    $data = trim((string) $data);
    if ($data === '') {
        return '';
    }
    if (!preg_match('#^data:image/(jpeg|jpg|png|webp|gif);base64,#i', $data, $match)) {
        jsonResponse(['status' => 'error', 'message' => 'La foto no es válida'], 400);
    }
    $raw = base64_decode(substr($data, (int) strpos($data, ',') + 1), true);
    if ($raw === false || strlen($raw) > MAX_PHOTO) {
        jsonResponse(['status' => 'error', 'message' => 'Esa foto pesa más de 450 KB'], 400);
    }
    $ext = strtolower($match[1]) === 'jpeg' ? 'jpg' : strtolower($match[1]);
    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    $dir = dirname(__DIR__) . '/storage';
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        jsonResponse(['status' => 'error', 'message' => 'No se pudo guardar la foto'], 500);
    }
    file_put_contents($dir . '/' . $name, $raw);
    return $name;
}

function mediaUrl(string $file): string
{
    return $file === '' ? '' : '/api/v1/media.php?f=' . rawurlencode($file);
}

function depot(PDO $pdo): array
{
    return [
        'label' => setting($pdo, 'depot_label') ?: 'Salida · centro de San José',
        'lat' => (float) setting($pdo, 'depot_lat'),
        'lng' => (float) setting($pdo, 'depot_lng'),
    ];
}

function miles(array $a, array $b): float
{
    $radius = 3958.8;
    $dLat = ((float) $b['lat'] - (float) $a['lat']) * M_PI / 180;
    $dLng = ((float) $b['lng'] - (float) $a['lng']) * M_PI / 180;
    $lat1 = (float) $a['lat'] * M_PI / 180;
    $lat2 = (float) $b['lat'] * M_PI / 180;
    $h = sin($dLat / 2) ** 2 + cos($lat1) * cos($lat2) * sin($dLng / 2) ** 2;
    return 2 * $radius * asin(min(1, sqrt($h)));
}

function weekNumber(string $iso): int
{
    $date = new DateTimeImmutable($iso);
    $start = new DateTimeImmutable($date->format('Y') . '-01-01');
    return (int) floor(($date->getTimestamp() - $start->getTimestamp()) / 604800);
}

function isDue(array $client, string $iso): bool
{
    $date = new DateTimeImmutable($iso);
    if ((int) $date->format('w') !== (int) ($client['dia'] ?? $client['dia_servicio'] ?? -1)) {
        return false;
    }
    if ($client['frecuencia'] === 'mensual') {
        return (int) $date->format('j') <= 7;
    }
    if ($client['frecuencia'] === 'quincenal') {
        return weekNumber($iso) % 2 === (int) $client['paridad'];
    }
    return true;
}

function mapClient(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'nombre' => $row['nombre'],
        'telefono' => $row['telefono'],
        'correo' => $row['correo'],
        'direccion' => $row['direccion'],
        'lat' => (float) $row['lat'],
        'lng' => (float) $row['lng'],
        'servicio' => $row['servicio'],
        'precio' => (float) $row['precio'],
        'frecuencia' => $row['frecuencia'],
        'dia' => (int) $row['dia_servicio'],
        'paridad' => (int) $row['paridad'],
        'notas' => $row['notas'],
        'activo' => (bool) $row['activo'],
    ];
}

function orderStops(array $clients, array $start): array
{
    $left = array_values($clients);
    $order = [];
    $current = $start;
    while ($left) {
        $best = 0;
        $bestMiles = INF;
        foreach ($left as $index => $client) {
            $distance = miles($current, $client);
            if ($distance < $bestMiles) {
                $bestMiles = $distance;
                $best = $index;
            }
        }
        $next = $left[$best];
        array_splice($left, $best, 1);
        $next['millas'] = round(miles($current, $next), 2);
        $order[] = $next;
        $current = $next;
    }
    return $order;
}

function mapsUrl(array $stops): string
{
    $houses = [];
    foreach ($stops as $stop) {
        $address = trim((string) $stop['direccion']);
        if ($address !== '') {
            $houses[] = $address;
        }
    }
    if (!$houses) {
        return '';
    }
    $destination = array_pop($houses);
    $params = [
        'api' => '1',
        'destination' => $destination,
        'travelmode' => 'driving',
        'dir_action' => 'navigate',
    ];
    if ($houses && count($houses) <= 9) {
        $params['waypoints'] = implode('|', $houses);
    }
    if (count($houses) > 9) {
        $all = array_merge($houses, [$destination]);
        return 'https://www.google.com/maps/dir/' . implode('/', array_map('rawurlencode', $all)) . '/';
    }
    return 'https://www.google.com/maps/dir/?' . http_build_query($params);
}

function nextNumber(PDO $pdo, string $key, string $prefix): string
{
    $seq = (int) setting($pdo, $key) + 1;
    setSetting($pdo, $key, (string) $seq);
    return $prefix . '-' . $seq;
}

function routePayload(PDO $pdo, string $fecha, int $cuadrillaId, bool $todas): array
{
    if ($fecha === '') {
        $fecha = today();
    }
    $crews = $pdo->query('SELECT id, nombre, notas FROM cuadrillas ORDER BY id')->fetchAll();
    $picked = $pdo->prepare('SELECT cuadrilla_id FROM ruta_dia WHERE fecha = ?');
    $picked->execute([$fecha]);
    $saved = $picked->fetch();
    if ($cuadrillaId === 0) {
        $cuadrillaId = $saved ? (int) $saved['cuadrilla_id'] : (int) ($crews[0]['id'] ?? 0);
    }
    $peopleStmt = $pdo->prepare('SELECT e.* FROM empleados e JOIN empleado_cuadrillas ec ON ec.empleado_id = e.id WHERE ec.cuadrilla_id = ? ORDER BY e.nombre');
    $peopleStmt->execute([$cuadrillaId]);
    $people = [];
    foreach ($peopleStmt as $row) {
        $open = $pdo->prepare('SELECT id, entrada FROM fichajes WHERE empleado_id = ? AND salida IS NULL ORDER BY id DESC LIMIT 1');
        $open->execute([(int) $row['id']]);
        $shift = $open->fetch();
        $people[] = [
            'id' => (int) $row['id'],
            'nombre' => $row['nombre'],
            'puesto' => $row['puesto'],
            'enTurno' => (bool) $shift,
            'entrada' => $shift['entrada'] ?? '',
        ];
    }
    $clients = array_map('mapClient', $pdo->query('SELECT * FROM clientes')->fetchAll());
    $active = array_values(array_filter($clients, static fn (array $client): bool => $client['activo']));
    $pool = $todas ? $active : array_values(array_filter($active, static fn (array $client): bool => isDue($client, $fecha)));
    $stops = orderStops($pool, depot($pdo));
    $visits = [];
    $visitStmt = $pdo->prepare('SELECT * FROM visitas WHERE fecha = ?');
    $visitStmt->execute([$fecha]);
    foreach ($visitStmt as $row) {
        $visits[(int) $row['cliente_id']] = [
            'antes' => mediaUrl((string) $row['foto_antes']),
            'despues' => mediaUrl((string) $row['foto_despues']),
            'empleadoId' => $row['empleado_id'] === null ? null : (int) $row['empleado_id'],
            'iniciada' => (bool) $row['iniciada'],
            'terminada' => (bool) $row['terminada'],
        ];
    }
    $named = [];
    foreach ($pdo->query('SELECT id, nombre FROM empleados') as $row) {
        $named[(int) $row['id']] = $row['nombre'];
    }
    foreach ($stops as &$stop) {
        $visit = $visits[$stop['id']] ?? null;
        $stop['visita'] = $visit;
        $stop['empleado'] = $visit && $visit['empleadoId'] ? ($named[$visit['empleadoId']] ?? '') : '';
    }
    unset($stop);
    return [
        'status' => 'ok',
        'fecha' => $fecha,
        'cuadrillaId' => $cuadrillaId,
        'cuadrillas' => array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'nombre' => $row['nombre'],
            'notas' => $row['notas'],
        ], $crews),
        'empleados' => $people,
        'salida' => depot($pdo),
        'paradas' => $stops,
        'millas' => round(array_sum(array_column($stops, 'millas')), 1),
        'maps' => mapsUrl($stops),
    ];
}
