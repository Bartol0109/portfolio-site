<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

session_start();
if (empty($_SESSION["admin_id"])) {
  http_response_code(401);
  echo json_encode(["error" => "Not authenticated"]);
  exit;
}

if (($_SERVER["REQUEST_METHOD"] ?? "GET") !== "POST") {
  http_response_code(405);
  echo json_encode(["error" => "Method not allowed"]);
  exit;
}

$data = json_decode(file_get_contents("php://input") ?: "{}", true);
$order = is_array($data) ? ($data["order"] ?? null) : null;
if (!is_array($order)) {
  http_response_code(400);
  echo json_encode(["error" => "Missing order"]);
  exit;
}

$ids = [];
foreach ($order as $rawId) {
  $id = (int)$rawId;
  if ($id > 0 && !in_array($id, $ids, true)) {
    $ids[] = $id;
  }
}
$ids = array_slice($ids, 0, 5);

/** @var PDO $pdo */
$pdo = require __DIR__ . "/../db.php";

try {
  $pdo->beginTransaction();
  $pdo->exec("UPDATE portfolio_items SET featured_order = NULL");
  $stmt = $pdo->prepare("UPDATE portfolio_items SET featured_order = ? WHERE id = ?");
  foreach ($ids as $index => $id) {
    $stmt->execute([$index + 1, $id]);
  }
  $pdo->commit();
  echo json_encode(["ok" => true, "order" => $ids]);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  error_log("featured.php: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(["error" => "Could not save order. Add the featured_order column first."]);
}
