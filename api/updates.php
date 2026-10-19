<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
if ($method !== "GET") {
  http_response_code(405);
  echo json_encode(["error" => "Method not allowed"]);
  exit;
}

/** @var PDO $pdo */
$pdo = require __DIR__ . "/db.php";

$rows = [];
try {
  $stmt = $pdo->query("SELECT id, title, body, tags, image_path, created_at FROM updates ORDER BY created_at DESC, id DESC");
  $rows = $stmt->fetchAll();
} catch (Throwable $e) {
  // Backwards compatible if image_path column doesn't exist yet.
  $stmt = $pdo->query("SELECT id, title, body, tags, created_at FROM updates ORDER BY created_at DESC, id DESC");
  $rows = $stmt->fetchAll();
}

$updates = array_map(function ($r) {
  $tags = [];
  $author = 'Admin';
  if (!empty($r["tags"])) {
    $parts = array_map("trim", explode(",", (string)$r["tags"]));
    $tags = array_values(array_filter($parts, function ($t) {
      return $t !== "";
    }));
    if (!empty($tags)) {
      $author = (string)$tags[0];
    }
  }
  return [
    "id" => (int)$r["id"],
    "date" => substr((string)$r["created_at"], 0, 10),
    "title" => (string)$r["title"],
    "body" => (string)$r["body"],
    "tags" => $tags,
    "author" => $author,
    "image" => isset($r["image_path"]) ? (string)$r["image_path"] : null,
  ];
}, $rows);

echo json_encode(["updates" => $updates]);

