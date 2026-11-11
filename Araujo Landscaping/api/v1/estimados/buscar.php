<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/lib/office.php';
handlePreflight();
requireMethod('GET');

try {
    $pdo = getPdo();
    $digits = phoneDigits((string) ($_GET['telefono'] ?? ''));
    if (strlen($digits) < 7) {
        jsonResponse(['status' => 'error', 'message' => 'Escribe el teléfono completo.'], 400);
    }
    $estimates = [];
    foreach (allEstimates($pdo) as $item) {
        if (phoneDigits($item['telefono']) === $digits) {
            $estimates[] = $item;
        }
    }
    $invoices = [];
    foreach (allInvoices($pdo) as $item) {
        if (phoneDigits($item['telefono']) === $digits) {
            $invoices[] = $item;
        }
    }
    if (!$estimates && !$invoices) {
        jsonResponse(['status' => 'error', 'message' => 'No hay nada con ese teléfono.'], 404);
    }
    jsonResponse(['status' => 'ok', 'estimados' => $estimates, 'invoices' => $invoices]);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'message' => $error->getMessage()], 500);
}
