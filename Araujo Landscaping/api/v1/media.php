<?php
declare(strict_types=1);

$file = basename((string) ($_GET['f'] ?? ''));
$path = dirname(__DIR__) . '/storage/' . $file;
if ($file === '' || !is_file($path)) {
    http_response_code(404);
    exit;
}
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$types = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];
header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
header('Cache-Control: public, max-age=86400');
readfile($path);
