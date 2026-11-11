<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/domain.php';
handlePreflight();
requireMethod('GET');

try {
    getPdo()->query('SELECT 1');
    jsonResponse(['status' => 'ok', 'service' => 'araujo-landscaping', 'db' => 'ok']);
} catch (Throwable $error) {
    jsonResponse(['status' => 'error', 'service' => 'araujo-landscaping', 'db' => 'error', 'message' => $error->getMessage()], 500);
}
