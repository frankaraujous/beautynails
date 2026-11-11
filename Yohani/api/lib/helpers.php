<?php
declare(strict_types=1);

function appTimezone(): DateTimeZone
{
    return new DateTimeZone('America/Los_Angeles');
}

function jsonResponse(array $payload, int $statusCode = 200): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-App-Token');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function handlePreflight(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        jsonResponse(['status' => 'ok']);
    }
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function requireMethod(string $method): void
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        jsonResponse(['status' => 'error', 'message' => 'Método no permitido'], 405);
    }
}

function today(): string
{
    return (new DateTimeImmutable('now', appTimezone()))->format('Y-m-d');
}

function hourKey(string $time): string
{
    return substr($time, 0, 5);
}
