-- Add new columns to personas table
ALTER TABLE personas ADD COLUMN title TEXT;
ALTER TABLE personas ADD COLUMN industry TEXT;

-- Make title and industry required for new records
ALTER TABLE personas ALTER COLUMN title SET NOT NULL;
ALTER TABLE personas ALTER COLUMN industry SET NOT NULL;

-- Add default values for existing records
UPDATE personas SET title = 'Product User', industry = 'Technology' WHERE title IS NULL OR industry IS NULL; 