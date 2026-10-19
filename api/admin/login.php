<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

if (($_SERVER["REQUEST_METHOD"] ?? "GET") !== "POST") {
  http_response_code(405);
  echo json_encode(["error" => "Method not allowed"]);
  exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw ?: "{}", true);
$username = (string)($data["username"] ?? "");
$password = (string)($data["password"] ?? "");

if ($username === "" || $password === "") {
  http_response_code(400);
  echo json_encode(["error" => "Missing username or password"]);
  exit;
}

/** @var PDO $pdo */
$pdo = require __DIR__ . "/../db.php";

$stmt = $pdo->prepare("SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1");
$stmt->execute([$username]);
$admin = $stmt->fetch();

if (!$admin) {
  http_response_code(401);
  echo json_encode(["error" => "Invalid credentials"]);
  exit;
}

$hash = (string)$admin["password_hash"];
$ok = false;

// Support both PHP password_hash() (recommended) and legacy SHA2('pw',256) used in SQL.
if (strpos($hash, "$2y$") === 0 || strpos($hash, "$argon2") === 0) {
  $ok = password_verify($password, $hash);
} else {
  $ok = hash("sha256", $password) === $hash;
}

if (!$ok) {
  http_response_code(401);
  echo json_encode(["error" => "Invalid credentials"]);
  exit;
}

session_start();
$_SESSION["admin_id"] = (int)$admin["id"];
$_SESSION["admin_username"] = (string)$admin["username"];

echo json_encode(["ok" => true, "username" => (string)$admin["username"]]);

