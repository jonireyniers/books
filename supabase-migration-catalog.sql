-- Add ISBN and cover_url columns to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Create index for ISBN lookups
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
