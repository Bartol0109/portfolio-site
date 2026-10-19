<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

if (($_SERVER["REQUEST_METHOD"] ?? "GET") !== "POST") {
  http_response_code(405);
  echo json_encode(["error" => "Method not allowed"]);
  exit;
}

session_start();
if (!isset($_SESSION["admin_id"])) {
  http_response_code(401);
  echo json_encode(["error" => "Not authenticated"]);
  exit;
}

$body = (string)($_POST["body"] ?? "");
$body = trim($body);
if ($body === "") {
  http_response_code(400);
  echo json_encode(["error" => "Body is required"]);
  exit;
}
if (mb_strlen($body) > 500) {
  http_response_code(400);
  echo json_encode(["error" => "Body too long (max 500 chars)"]);
  exit;
}

$title = trim((string)($_POST["title"] ?? ""));
// title u bazi je NOT NULL — ako je prazan, uzmi početak bodyja
if ($title === "") {
  $title = mb_substr($body, 0, 80);
  if (mb_strlen($body) > 80) {
    $title .= "…";
  }
}
if ($title === "") {
  $title = "Update";
}
if (mb_strlen($title) > 200) {
  $title = mb_substr($title, 0, 200);
}

// store author username in tags field so frontend može prikazati tko je objavio
$author = (string)($_SESSION["admin_username"] ?? "Admin");
$tags = $author;

/** @var PDO $pdo */
$pdo = require __DIR__ . "/../db.php";

$imagePath = null;
if (isset($_FILES["image"]) && is_array($_FILES["image"])) {
  $f = $_FILES["image"];
  if (($f["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    if (($f["error"] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
      http_response_code(400);
      echo json_encode(["error" => "Upload failed"]);
      exit;
    }

    $size = (int)($f["size"] ?? 0);
    if ($size > 5 * 1024 * 1024) {
      http_response_code(400);
      echo json_encode(["error" => "Image too large (max 5MB)"]);
      exit;
    }

    $tmp = (string)($f["tmp_name"] ?? "");
    $mime = "";
    if ($tmp !== "" && is_uploaded_file($tmp)) {
      $fi = finfo_open(FILEINFO_MIME_TYPE);
      if ($fi) {
        $mime = (string)finfo_file($fi, $tmp);
        finfo_close($fi);
      }
    }

    $ext = "";
    if ($mime === "image/jpeg") $ext = "jpg";
    elseif ($mime === "image/png") $ext = "png";
    elseif ($mime === "image/webp") $ext = "webp";

    if ($ext === "") {
      http_response_code(400);
      echo json_encode(["error" => "Unsupported image type (jpg/png/webp)"]);
      exit;
    }

    // Save into public_html/blog-uploads (sibling of /api).
    $uploadsDir = realpath(__DIR__ . "/..") . "/../blog-uploads";
    if (!is_dir($uploadsDir)) {
      @mkdir($uploadsDir, 0755, true);
    }
    if (!is_dir($uploadsDir) || !is_writable($uploadsDir)) {
      http_response_code(500);
      echo json_encode(["error" => "Upload dir not writable"]);
      exit;
    }

    $fname = "blog_" . date("Ymd_His") . "_" . bin2hex(random_bytes(6)) . "." . $ext;
    $dest = rtrim($uploadsDir, "/") . "/" . $fname;
    if (!move_uploaded_file($tmp, $dest)) {
      http_response_code(500);
      echo json_encode(["error" => "Failed to save image"]);
      exit;
    }

    $imagePath = "/blog-uploads/" . $fname;
  }
}

// Insert with/without image_path depending on schema.
try {
  $stmt = $pdo->prepare("INSERT INTO updates (title, body, tags, image_path) VALUES (?, ?, ?, ?)");
  $stmt->execute([$title, $body, $tags, $imagePath]);
} catch (Throwable $e) {
  $stmt = $pdo->prepare("INSERT INTO updates (title, body, tags) VALUES (?, ?, ?)");
  $stmt->execute([$title, $body, $tags]);
}

echo json_encode(["ok" => true]);

