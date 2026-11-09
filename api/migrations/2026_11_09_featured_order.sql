-- Run once in cPanel phpMyAdmin on the portfolio database.
-- Safe to skip if the column already exists.
-- The public site keeps working before this runs. Save order in Studio needs it.

ALTER TABLE portfolio_items
  ADD COLUMN featured_order INT NULL DEFAULT NULL;
