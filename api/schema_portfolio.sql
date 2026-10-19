-- Shema kakva je na produkciji (MyDataKnox / phpMyAdmin).
-- portfolio.php očekuje ove stupce:

CREATE TABLE IF NOT EXISTS portfolio_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category VARCHAR(40) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body VARCHAR(500) NOT NULL,
  project_url VARCHAR(255) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  author VARCHAR(64) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_category_created (category, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Napomena: INSERT mora zadovoljiti sve NOT NULL (prazan string je ok za body / project_url / image_path).
