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
        $stmt = $pdo->prepare("SELECT image_path FROM portfolio_gallery WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row && $row["image_path"] !== "") {
            $abs = realpath(__DIR__ . "/../..") . $row["image_path"];
            if ($abs && file_exists($abs)) @unlink($abs);
        }
        $pdo->prepare("DELETE FROM portfolio_gallery WHERE id = ?")->execute([$id]);
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

$portfolioId = (int)($_POST["portfolio_id"] ?? 0);
if ($portfolioId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Missing portfolio_id"]);
    exit;
}

$stmt = $pdo->prepare("SELECT COUNT(*) FROM portfolio_gallery WHERE portfolio_id = ?");
$stmt->execute([$portfolioId]);
if ((int)$stmt->fetchColumn() >= 5) {
    http_response_code(400);
    echo json_encode(["error" => "Maximum 5 gallery images allowed"]);
    exit;
}

if (!isset($_FILES["image"]) || ($_FILES["image"]["error"] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
    http_response_code(400);
    echo json_encode(["error" => "No image provided"]);
    exit;
}

$f = $_FILES["image"];
if (($f["error"] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["error" => "Upload error"]);
    exit;
}
if ((int)($f["size"] ?? 0) > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(["error" => "Image too large (max 5MB)"]);
    exit;
}

$tmp = (string)($f["tmp_name"] ?? "");
$mime = "";
if ($tmp !== "" && is_uploaded_file($tmp)) {
    $fi = finfo_open(FILEINFO_MIME_TYPE);
    if ($fi) { $mime = (string)finfo_file($fi, $tmp); finfo_close($fi); }
}

if ($mime === "image/jpeg") { $ext = "jpg"; }
elseif ($mime === "image/png")  { $ext = "png"; }
elseif ($mime === "image/webp") { $ext = "webp"; }
else { $ext = ""; }
if ($ext === "") {
    http_response_code(400);
    echo json_encode(["error" => "Unsupported image type (jpg/png/webp)"]);
    exit;
}

$uploadsDir = realpath(__DIR__ . "/../..") . "/portfolio-uploads";
if (!is_dir($uploadsDir)) @mkdir($uploadsDir, 0755, true);
if (!is_writable($uploadsDir)) {
    http_response_code(500);
    echo json_encode(["error" => "Upload dir not writable"]);
    exit;
}

$fname = "gallery_" . date("Ymd_His") . "_" . bin2hex(random_bytes(6)) . "." . $ext;
$dest  = $uploadsDir . "/" . $fname;
if (!move_uploaded_file($tmp, $dest)) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save image"]);
    exit;
}

$imagePath = "/portfolio-uploads/" . $fname;

try {
    $stmt = $pdo->prepare("INSERT INTO portfolio_gallery (portfolio_id, image_path) VALUES (?, ?)");
    $stmt->execute([$portfolioId, $imagePath]);
    $newId = (int)$pdo->lastInsertId();
    echo json_encode(["ok" => true, "id" => $newId, "image" => $imagePath]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error"]);
}
