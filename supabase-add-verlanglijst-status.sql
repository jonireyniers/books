-- Add 'verlanglijst' status to books table
-- This allows users to distinguish between:
-- - verlanglijst: books they want to acquire
-- - wil_lezen: books they own but haven't read yet

ALTER TABLE books DROP CONSTRAINT IF EXISTS books_status_check;

ALTER TABLE books ADD CONSTRAINT books_status_check 
CHECK (status IN ('verlanglijst', 'wil_lezen', 'bezig', 'gelezen'));
