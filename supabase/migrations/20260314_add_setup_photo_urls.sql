-- Add setup_photo_urls column to rentals table
-- Stores up to 3 URLs of setup/arrangement photos
ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS setup_photo_urls text[] DEFAULT '{}';
