-- Add recommendation and lending fields to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS recommend_to_friends BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS available_for_lending BOOLEAN DEFAULT false;
