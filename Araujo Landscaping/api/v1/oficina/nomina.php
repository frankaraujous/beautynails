<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/office.php';
handlePreflight();
requireMethod('GET');

try {
    $pdo = getPdo();
    requireAdmin($pdo);
    $start = trim((string) ($_GET['semana'] ?? today()));
    $date = new DateTimeImmutable($start);
    $day = (int) $date->format('w');
    $monday = $date->modify($day === 0 ? '-6 days' : '-' . ($day - 1) . ' days')->format('Y-m-d');
    $rows = payrollRows($pdo, $monday);
    $total = 0.0;
    foreach ($rows as $row) {
        $total += $row['pago'];
    }
    jsonResponse(['status' => 'ok', 'semana' => $monday, 'filas' => $rows, 'total' => round($total, 2)]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
