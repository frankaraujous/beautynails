<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'status' => 'ok',
    'service' => 'yohani',
    'health' => '/v1/health.php',
], JSON_UNESCAPED_UNICODE);
