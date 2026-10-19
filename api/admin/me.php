<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

session_start();

if (!empty($_SESSION["admin_id"])) {
  echo json_encode([
    "ok" => true,
    "username" => (string)($_SESSION["admin_username"] ?? ""),
  ]);
  exit;
}

// 200 + ok:false — front i dalje zna da nisi admin; Safari ne prikazuje crveni 401 u konzoli
echo json_encode(["ok" => false]);

