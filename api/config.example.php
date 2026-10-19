<?php
declare(strict_types=1);

/**
 * Predložak baze. Na serveru:
 *   cp config.example.php config.local.php
 *   uredi config.local.php (pravo ime baze, korisnik, lozinka).
 */
return [
  "db_host" => "127.0.0.1",
  "db_name" => "YOUR_DATABASE_NAME",
  "db_user" => "YOUR_DATABASE_USER",
  "db_pass" => "YOUR_DATABASE_PASSWORD",
];
