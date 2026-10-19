<?php
declare(strict_types=1);

$cfg = require __DIR__ . "/config.php";

$dsn = "mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset=utf8mb4";

try {
  $pdo = new PDO($dsn, $cfg["db_user"], $cfg["db_pass"], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  header("Content-Type: application/json; charset=utf-8");
  echo json_encode([
    "error" => "DB connection failed",
    "message" => $e->getMessage(),
  ]);
  exit;
}

return $pdo;