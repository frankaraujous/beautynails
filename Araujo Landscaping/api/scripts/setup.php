<?php
declare(strict_types=1);

$root = dirname(__DIR__, 2);
$sample = $root . '/api/config/db.sample.php';
$configPath = $root . '/api/config/db.php';
if (!is_file($configPath)) {
    copy($sample, $configPath);
}
$config = require $configPath;
$mysqli = new mysqli((string) $config['host'], (string) $config['username'], (string) $config['password']);
if ($mysqli->connect_error) {
    fwrite(STDERR, $mysqli->connect_error . PHP_EOL);
    exit(1);
}
$mysqli->set_charset('utf8mb4');
$name = (string) $config['database'];
$mysqli->query("CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$mysqli->select_db($name);

function runSqlFile(mysqli $mysqli, string $path): void
{
    $sql = file_get_contents($path);
    if ($sql === false) {
        throw new RuntimeException('No se encontró ' . $path);
    }
    if (!$mysqli->multi_query($sql)) {
        throw new RuntimeException($mysqli->error);
    }
    do {
        if ($result = $mysqli->store_result()) {
            $result->free();
        }
    } while ($mysqli->more_results() && $mysqli->next_result());
    if ($mysqli->errno) {
        throw new RuntimeException($mysqli->error);
    }
}

$exists = $mysqli->query("SHOW TABLES LIKE 'ajustes'");
if (!$exists || $exists->num_rows === 0) {
    runSqlFile($mysqli, $root . '/database/schema.sql');
}
$count = $mysqli->query('SELECT COUNT(*) AS c FROM ajustes');
$row = $count ? $count->fetch_assoc() : ['c' => 0];
if ((int) ($row['c'] ?? 0) === 0) {
    runSqlFile($mysqli, $root . '/database/seed.sql');
}
echo "Base lista: {$name}\n";
