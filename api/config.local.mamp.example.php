<?php
declare(strict_types=1);

/**
 * Lokalni MAMP (macOS): kopiraj u config.local.php dok testiraš:
 *   cp config.local.mamp.example.php config.local.php
 *
 * U MAMP-u: Preferences → Ports → provjeri Apache (npr. 8888) i MySQL (npr. 3306).
 * MySQL zadano: korisnik root, lozinka root (provjeri ako si mijenjao).
 */
return [
  "db_host" => "127.0.0.1",
  "db_name" => "visoradi_baza",
  "db_user" => "root",
  "db_pass" => "root",
];
