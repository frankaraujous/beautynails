<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

const WORK_HOURS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const BLOCKED_AFTERNOON = ['14:00', '15:00', '16:00', '17:00'];
const MAX_PHOTO = 500 * 1024;

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

function defaultHours(DateTimeImmutable $date): array
{
    $afternoonOff = in_array((int) $date->format('w'), [2, 3, 4], true);
    return array_values(array_filter(
        WORK_HOURS,
        static fn (string $hour): bool => !($afternoonOff && in_array($hour, BLOCKED_AFTERNOON, true))
    ));
}

function ensureCitaColumns(PDO $pdo): void
{
    static $ready = false;
    if ($ready) {
        return;
    }
    $column = $pdo->query("SHOW COLUMNS FROM citas LIKE 'cancelada'")->fetch();
    if (!$column) {
        $pdo->exec('ALTER TABLE citas ADD COLUMN cancelada TINYINT(1) NOT NULL DEFAULT 0 AFTER confirmada');
    }
    $ready = true;
}

function scheduleEnd(): string
{
    return (new DateTimeImmutable(today(), appTimezone()))->modify('+3 years')->format('Y-m-d');
}

function ensureSchedule(PDO $pdo): void
{
    ensureCitaColumns($pdo);
    $start = new DateTimeImmutable(today(), appTimezone());
    $end = new DateTimeImmutable(scheduleEnd(), appTimezone());
    $off = array_fill_keys(array_map('strval', $pdo->query('SELECT fecha FROM dias_libres')->fetchAll(PDO::FETCH_COLUMN)), true);
    $have = array_fill_keys(array_map('strval', $pdo->query('SELECT DISTINCT fecha FROM disponibilidad')->fetchAll(PDO::FETCH_COLUMN)), true);
    $rows = [];
    for ($cursor = $start; $cursor <= $end; $cursor = $cursor->modify('+1 day')) {
        $iso = $cursor->format('Y-m-d');
        if (isset($have[$iso]) || isset($off[$iso])) {
            continue;
        }
        foreach (defaultHours($cursor) as $hour) {
            $rows[] = [$iso, $hour . ':00'];
        }
    }
    foreach (array_chunk($rows, 400) as $chunk) {
        $marks = implode(',', array_fill(0, count($chunk), '(?, ?)'));
        $params = [];
        foreach ($chunk as $row) {
            $params[] = $row[0];
            $params[] = $row[1];
        }
        $pdo->prepare('INSERT IGNORE INTO disponibilidad (fecha, hora) VALUES ' . $marks)->execute($params);
    }
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
        jsonResponse(['status' => 'error', 'message' => 'La foto pesa más de 500 KB'], 400);
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

function mapCita(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'nombre' => $row['nombre'],
        'telefono' => $row['telefono'],
        'correo' => (string) ($row['correo'] ?? ''),
        'servicio' => $row['servicio'],
        'pago' => $row['pago'],
        'color' => $row['color'],
        'codigo' => $row['codigo_transferencia'],
        'fecha' => $row['fecha'],
        'hora' => hourKey((string) $row['hora']),
        'foto1' => mediaUrl((string) $row['foto1']),
        'foto2' => mediaUrl((string) $row['foto2']),
        'alergia' => $row['alergia'],
        'confirmada' => (bool) $row['confirmada'],
        'cancelada' => (bool) ($row['cancelada'] ?? 0),
        'terminada' => (bool) $row['terminada'],
        'monto' => $row['monto'] === null ? null : (float) $row['monto'],
    ];
}

function phoneDigits(string $phone): string
{
    return preg_replace('/\D/', '', $phone) ?? '';
}

function publicPayload(PDO $pdo): array
{
    ensureSchedule($pdo);
    $start = today();
    $end = scheduleEnd();
    $services = $pdo->query('SELECT nombre, precio FROM servicios ORDER BY orden, id')->fetchAll();
    $slots = $pdo->prepare('SELECT fecha, hora FROM disponibilidad WHERE fecha BETWEEN ? AND ? ORDER BY fecha, hora');
    $slots->execute([$start, $end]);
    $off = $pdo->query('SELECT fecha FROM dias_libres')->fetchAll(PDO::FETCH_COLUMN);
    $takenStmt = $pdo->prepare('SELECT fecha, hora FROM citas WHERE terminada = 0 AND cancelada = 0 AND fecha BETWEEN ? AND ?');
    $takenStmt->execute([$start, $end]);
    $taken = [];
    foreach ($takenStmt as $row) {
        $taken[$row['fecha'] . ' ' . hourKey((string) $row['hora'])] = true;
    }
    $byDay = [];
    foreach ($slots as $row) {
        $byDay[$row['fecha']][] = hourKey((string) $row['hora']);
    }
    $days = [];
    $cursor = new DateTimeImmutable($start, appTimezone());
    $last = new DateTimeImmutable($end, appTimezone());
    $offMap = array_fill_keys(array_map('strval', $off), true);
    for (; $cursor <= $last; $cursor = $cursor->modify('+1 day')) {
        $iso = $cursor->format('Y-m-d');
        $hours = [];
        foreach ($byDay[$iso] ?? [] as $hour) {
            $past = $iso === $start && $hour <= (new DateTimeImmutable('now', appTimezone()))->format('H:i');
            $hours[] = [
                'hora' => $hour,
                'libre' => !$past && !isset($taken[$iso . ' ' . $hour]),
            ];
        }
        $days[] = [
            'fecha' => $iso,
            'libre' => !isset($offMap[$iso]),
            'horas' => $hours,
        ];
    }
    $gallery = [];
    foreach ($pdo->query('SELECT nombre, servicio, foto1, foto2 FROM citas ORDER BY fecha DESC, hora DESC') as $row) {
        foreach (['foto1', 'foto2'] as $field) {
            if ($row[$field] === '') {
                continue;
            }
            $gallery[] = [
                'nombre' => $row['nombre'],
                'servicio' => $row['servicio'],
                'foto' => mediaUrl((string) $row[$field]),
            ];
        }
    }
    return [
        'status' => 'ok',
        'servicios' => array_map(static fn (array $row): array => [
            'nombre' => $row['nombre'],
            'precio' => (float) $row['precio'],
        ], $services),
        'pagos' => ['Efectivo', 'Transferencia', 'Tarjeta al llegar'],
        'colores' => [
            'gloss' => ['#f7d6e4', '#ff3d8e', '#c8102e', '#ff7a45', '#f6c945', '#7bc142', '#149e78', '#20c4d8', '#2a6bff', '#6a35d9', '#f6f1ea', '#c5c9d1', '#161616', '#d4894a', '#8e1d4a'],
            'matte' => ['#e6d3b3', '#5c3317', '#c6d63c', '#3f5c28', '#0c4f4a', '#b7dff2', '#e4c6f5', '#4a1840', '#e040fb', '#3d342f', '#a67c52', '#a34b32', '#1b3a4b', '#8d8478', '#6d7a86'],
        ],
        'dias' => $days,
        'galeria' => $gallery,
        'textTo' => setting($pdo, 'text_to'),
        'zelle' => setting($pdo, 'zelle_url'),
        'instagram' => setting($pdo, 'instagram'),
    ];
}

function adminPayload(PDO $pdo): array
{
    ensureSchedule($pdo);
    $start = today();
    $end = scheduleEnd();
    $citas = $pdo->query('SELECT * FROM citas ORDER BY fecha, hora, id')->fetchAll();
    $pending = [];
    $confirmed = [];
    $history = [];
    foreach ($citas as $row) {
        $item = mapCita($row);
        if ((int) $row['terminada'] === 1) {
            $history[] = $item;
            continue;
        }
        if ($row['fecha'] < $start || $row['fecha'] > $end) {
            continue;
        }
        if ((int) $row['confirmada'] === 1) {
            $confirmed[] = $item;
        } else {
            $pending[] = $item;
        }
    }
    $open = [];
    $slotStmt = $pdo->prepare('SELECT fecha, hora FROM disponibilidad WHERE fecha BETWEEN ? AND ?');
    $slotStmt->execute([$start, $end]);
    foreach ($slotStmt as $row) {
        $open[$row['fecha'] . ' ' . hourKey((string) $row['hora'])] = true;
    }
    $taken = [];
    foreach ($citas as $row) {
        if ((int) $row['terminada'] === 1 || (int) ($row['cancelada'] ?? 0) === 1) {
            continue;
        }
        $taken[$row['fecha'] . ' ' . hourKey((string) $row['hora'])] = true;
    }
    $off = array_map('strval', $pdo->query('SELECT fecha FROM dias_libres')->fetchAll(PDO::FETCH_COLUMN));
    $days = [];
    $cursor = new DateTimeImmutable($start, appTimezone());
    $last = new DateTimeImmutable($end, appTimezone());
    for (; $cursor <= $last; $cursor = $cursor->modify('+1 day')) {
        $iso = $cursor->format('Y-m-d');
        $hours = [];
        foreach (WORK_HOURS as $hour) {
            $hours[] = [
                'hora' => $hour,
                'abierta' => isset($open[$iso . ' ' . $hour]),
                'ocupada' => isset($taken[$iso . ' ' . $hour]),
            ];
        }
        $days[] = ['fecha' => $iso, 'libre' => !in_array($iso, $off, true), 'horas' => $hours];
    }
    $prices = $pdo->query('SELECT nombre, precio FROM servicios ORDER BY orden, id')->fetchAll();
    $expenses = $pdo->query('SELECT id, nombre, monto, fecha FROM gastos ORDER BY fecha, id')->fetchAll();
    $agenda = array_map(static fn (array $row): array => mapCita($row), $citas);
    usort($agenda, static fn (array $a, array $b): int => $a['id'] <=> $b['id']);
    $groups = [];
    foreach ($agenda as $item) {
        $key = phoneDigits($item['telefono']) !== '' ? phoneDigits($item['telefono']) : $item['nombre'];
        if (!isset($groups[$key])) {
            $groups[$key] = [
                'nombre' => $item['nombre'],
                'telefono' => $item['telefono'],
                'correo' => $item['correo'],
                'trabajos' => [],
                'total' => 0.0,
            ];
        }
        $groups[$key]['nombre'] = $item['nombre'];
        if ($item['correo'] !== '') {
            $groups[$key]['correo'] = $item['correo'];
        }
        $groups[$key]['trabajos'][] = [
            'fecha' => $item['fecha'],
            'servicio' => $item['servicio'],
            'monto' => (float) ($item['monto'] ?? 0),
        ];
        $groups[$key]['total'] += (float) ($item['monto'] ?? 0);
    }
    return [
        'status' => 'ok',
        'pendientes' => $pending,
        'confirmadas' => $confirmed,
        'historial' => $history,
        'agenda' => $agenda,
        'dias' => $days,
        'precios' => array_map(static fn (array $row): array => [
            'nombre' => $row['nombre'],
            'precio' => (float) $row['precio'],
        ], $prices),
        'gastos' => array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'nombre' => $row['nombre'],
            'monto' => (float) $row['monto'],
            'fecha' => $row['fecha'],
        ], $expenses),
        'clientas' => array_values($groups),
        'textTo' => setting($pdo, 'text_to'),
    ];
}

function nextTransferCode(PDO $pdo): string
{
    $seq = (int) setting($pdo, 'transfer_seq');
    if ($seq < 1) {
        $seq = 323;
    }
    $code = 'AM-' . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    setSetting($pdo, 'transfer_seq', (string) ($seq + 1));
    return $code;
}
