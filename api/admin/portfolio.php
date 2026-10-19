<?php
declare(strict_types=1);

/**
 * Shims older admin UIs that POST to /api/admin/portfolio.php.
 * Same behaviour as /api/portfolio.php (GET/POST/DELETE).
 */
require __DIR__ . "/../portfolio.php";
