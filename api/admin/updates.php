<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

session_start();
if (empty($_SESSION["admin_id"])) {
  http_response_code(401);
  echo json_encode(["error" => "Unauthorized"]);
  exit;
}

/** @var PDO $pdo */
$pdo = require __DIR__ . "/../db.php";

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "POST") {
  $raw = file_get_contents("php://input");
  $data = json_decode($raw ?: "{}", true);
  $id = (int)($data["id"] ?? 0);
  $body = trim((string)($data["body"] ?? ""));

  if ($id <= 0 || $body === "") {
    http_response_code(400);
    echo json_encode(["error" => "Missing id or body"]);
    exit;
  }
  if (mb_strlen($body) > 500) {
    http_response_code(400);
    echo json_encode(["error" => "Body too long (max 500 chars)"]);
    exit;
  }

  $stmt = $pdo->prepare("UPDATE updates SET body = ? WHERE id = ?");
  $stmt->execute([$body, $id]);

  echo json_encode(["ok" => true]);
  exit;
}

if ($method === "DELETE") {
  $id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Missing id"]);
    exit;
  }

  $stmt = $pdo->prepare("DELETE FROM updates WHERE id = ?");
  $stmt->execute([$id]);

  echo json_encode(["ok" => true]);
  exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);

