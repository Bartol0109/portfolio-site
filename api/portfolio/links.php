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

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

/** @var PDO $pdo */
$pdo = require __DIR__ . "/../db.php";

if ($method === "DELETE") {
    $id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["error" => "Missing id"]);
        exit;
    }
    try {
        $pdo->prepare("DELETE FROM portfolio_links WHERE id = ?")->execute([$id]);
        echo json_encode(["ok" => true]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["error" => "Delete failed"]);
    }
    exit;
}

if ($method !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$raw  = file_get_contents("php://input");
$data = json_decode($raw ?: "{}", true);
$portfolioId = (int)($data["portfolio_id"] ?? 0);
$type        = trim((string)($data["type"] ?? ""));
$url         = trim((string)($data["url"] ?? ""));

if ($portfolioId <= 0 || $type === "" || $url === "") {
    http_response_code(400);
    echo json_encode(["error" => "portfolio_id, type and url are required"]);
    exit;
}

$allowed = ["Website", "Github", "Drive"];
if (!in_array($type, $allowed, true)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid type (Website or Github)"]);
    exit;
}
if (mb_strlen($url) > 255) {
    http_response_code(400);
    echo json_encode(["error" => "URL too long (max 255)"]);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO portfolio_links (portfolio_id, type, url) VALUES (?, ?, ?)");
    $stmt->execute([$portfolioId, $type, $url]);
    $newId = (int)$pdo->lastInsertId();
    echo json_encode(["ok" => true, "id" => $newId, "type" => $type, "url" => $url]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error"]);
}
