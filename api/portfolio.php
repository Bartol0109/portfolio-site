<?php
declare(strict_types=1);

/**
 * Usklađeno sa stvarnom shemom (phpMyAdmin):
 * id, category, title, body, project_url, image_path, author, created_at
 *
 * GET  — javno: { items: [{ id, category, title, description, image, project_url, author }] }
 *        ("description" u JSONu = stupac body u bazi)
 * POST — admin: FormData category, title, description (->body), optional project_url, optional id, optional image
 * DELETE — admin: ?id=
 */
function portfolio_uploads_basename(string $name): string
{
  $name = basename(str_replace(["\0"], "", $name));
  return $name !== "" ? $name : "file.bin";
}

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "GET") {
  header("Content-Type: application/json; charset=utf-8");
  header("Cache-Control: no-cache, must-revalidate");

  /** @var PDO $pdo */
  $pdo = require __DIR__ . "/db.php";

  try {
    $stmt = $pdo->query("
      SELECT id, category, title, body, tags, image_path, author, created_at
      FROM portfolio_items
      ORDER BY created_at DESC, id DESC
    ");
    $rows = $stmt->fetchAll();

    $ids = array_column($rows, "id");
    $gallery = [];
    $links   = [];

    if (!empty($ids)) {
      $in = implode(",", array_map("intval", $ids));

      $gStmt = $pdo->query("SELECT id, portfolio_id, image_path FROM portfolio_gallery WHERE portfolio_id IN ($in) ORDER BY sort_order ASC, id ASC");
      foreach ($gStmt->fetchAll() as $g) {
        $gallery[(int)$g["portfolio_id"]][] = ["id" => (int)$g["id"], "image" => (string)$g["image_path"]];
      }

      $lStmt = $pdo->query("SELECT id, portfolio_id, type, url FROM portfolio_links WHERE portfolio_id IN ($in) ORDER BY id ASC");
      foreach ($lStmt->fetchAll() as $l) {
        $links[(int)$l["portfolio_id"]][] = ["id" => (int)$l["id"], "type" => (string)$l["type"], "url" => (string)$l["url"]];
      }
    }
  } catch (Throwable $e) {
    error_log("portfolio.php GET: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
      "error" => "Could not load portfolio",
      "items" => [],
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $items = array_map(static function ($r) use ($gallery, $links) {
    $pid = (int)$r["id"];
    $img = (string)($r["image_path"] ?? "");
    $rawTags = trim((string)($r["tags"] ?? ""));
    $tags = $rawTags !== "" ? array_values(array_filter(array_map('trim', explode(',', $rawTags)))) : [];
    return [
      "id"          => $pid,
      "category"    => (string)$r["category"],
      "title"       => (string)$r["title"],
      "description" => (string)($r["body"] ?? ""),
      "tags"        => $tags,
      "image"       => $img !== "" ? $img : null,
      "author"      => (string)($r["author"] ?? ""),
      "gallery"     => $gallery[$pid] ?? [],
      "links"       => $links[$pid] ?? [],
    ];
  }, $rows);

  echo json_encode(["items" => $items], JSON_UNESCAPED_UNICODE);
  exit;
}

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

if ($method === "DELETE") {
  session_start();
  if (empty($_SESSION["admin_id"])) {
    http_response_code(401);
    echo json_encode(["error" => "Not authenticated"]);
    exit;
  }

  $id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Missing id"]);
    exit;
  }

  /** @var PDO $pdo */
  $pdo = require __DIR__ . "/db.php";
  try {
    $stmt = $pdo->prepare("DELETE FROM portfolio_items WHERE id = ?");
    $stmt->execute([$id]);
  } catch (Throwable $e) {
    error_log("portfolio.php DELETE: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Delete failed"]);
    exit;
  }

  echo json_encode(["ok" => true]);
  exit;
}

if ($method !== "POST") {
  http_response_code(405);
  echo json_encode(["error" => "Method not allowed"]);
  exit;
}

session_start();
if (empty($_SESSION["admin_id"])) {
  http_response_code(401);
  echo json_encode(["error" => "Not authenticated"]);
  exit;
}

$category = trim((string)($_POST["category"] ?? ""));
$title = trim((string)($_POST["title"] ?? ""));
$description = trim((string)($_POST["description"] ?? ""));
$tagsRaw = trim((string)($_POST["tags"] ?? ""));
$tags = implode(',', array_values(array_filter(array_map('trim', explode(',', $tagsRaw)))));
$id = (int)($_POST["id"] ?? 0);

$author = trim((string)($_SESSION["admin_username"] ?? "Admin"));
if ($author === "") {
  $author = "Admin";
}

$allowedCategories = ["Web Sites", "Mobile Apps", "Graphic Designs", "College Projects", "Game Development"];

if ($category === "" || $title === "") {
  http_response_code(400);
  echo json_encode(["error" => "category and title are required"]);
  exit;
}

if (!in_array($category, $allowedCategories, true)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid category"]);
  exit;
}

if (mb_strlen($title) > 200) {
  http_response_code(400);
  echo json_encode(["error" => "title too long (max 200)"]);
  exit;
}
if (mb_strlen($description) > 500) {
  http_response_code(400);
  echo json_encode(["error" => "description/body too long (max 500)"]);
  exit;
}
if (mb_strlen($author) > 64) {
  $author = mb_substr($author, 0, 64);
}

/** @var PDO $pdo */
$pdo = require __DIR__ . "/db.php";

$uploadsDir = realpath(__DIR__ . "/..") . "/portfolio-uploads";
if (!is_dir($uploadsDir)) {
  @mkdir($uploadsDir, 0755, true);
}

$newImagePath = null;
if (isset($_FILES["image"]) && is_array($_FILES["image"])) {
  $f = $_FILES["image"];
  if (($f["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    if (($f["error"] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
      http_response_code(400);
      echo json_encode(["error" => "Upload failed (file error)"]);
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
    if ($mime === "image/jpeg") {
      $ext = "jpg";
    } elseif ($mime === "image/png") {
      $ext = "png";
    } elseif ($mime === "image/webp") {
      $ext = "webp";
    }

    if ($ext === "") {
      http_response_code(400);
      echo json_encode(["error" => "Unsupported image type (jpg/png/webp)"]);
      exit;
    }

    if (!is_dir($uploadsDir) || !is_writable($uploadsDir)) {
      http_response_code(500);
      echo json_encode(["error" => "Upload dir not writable (create portfolio-uploads with 755)"]);
      exit;
    }

    $fname = portfolio_uploads_basename("pf_" . date("Ymd_His") . "_" . bin2hex(random_bytes(6)) . "." . $ext);
    $dest = rtrim($uploadsDir, "/") . "/" . $fname;
    if (!move_uploaded_file($tmp, $dest)) {
      http_response_code(500);
      echo json_encode(["error" => "Failed to save image"]);
      exit;
    }

    $newImagePath = "/portfolio-uploads/" . $fname;
  }
}

// image_path i project_url su NOT NULL u bazi — uvijek string (prazan ako nema slike / linka)
$imagePath = "";
$body = $description;

try {
  if ($id > 0) {
    $stmt = $pdo->prepare("SELECT image_path FROM portfolio_items WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) {
      http_response_code(404);
      echo json_encode(["error" => "Item not found"]);
      exit;
    }
    if ($newImagePath !== null) {
      $imagePath = $newImagePath;
    } else {
      $imagePath = (string)($existing["image_path"] ?? "");
    }

    $stmt = $pdo->prepare("
      UPDATE portfolio_items
      SET category = ?, title = ?, body = ?, tags = ?, image_path = ?, author = ?
      WHERE id = ?
    ");
    $stmt->execute([$category, $title, $body, $tags, $imagePath, $author, $id]);
  } else {
    if ($newImagePath !== null) {
      $imagePath = $newImagePath;
    }
    $stmt = $pdo->prepare("
      INSERT INTO portfolio_items (category, title, body, tags, image_path, author)
      VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$category, $title, $body, $tags, $imagePath, $author]);
  }
} catch (Throwable $e) {
  error_log("portfolio.php POST: " . $e->getMessage());
  http_response_code(500);
  echo json_encode([
    "error" => "Database error",
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

echo json_encode(["ok" => true]);
