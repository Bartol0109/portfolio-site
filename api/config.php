<?php
declare(strict_types=1);

/**
 * Učitava prave vjerodajnice iz config.local.php (samo na serveru).
 * Za deploy: kopiraj config.example.php → config.local.php i ispuni.
 * Ovaj config.php je siguran za Git (bez lozinki).
 */
$local = __DIR__ . "/config.local.php";
if (is_file($local)) {
  return require $local;
}

return require __DIR__ . "/config.example.php";
