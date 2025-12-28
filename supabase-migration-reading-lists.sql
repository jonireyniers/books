-- Add shared reading lists tables
CREATE TABLE reading_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books in lists (many-to-many)
CREATE TABLE reading_list_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES reading_lists(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, book_id)
);

-- Shared access (which friends can see which lists)
CREATE TABLE reading_list_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES reading_lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- Enable RLS
ALTER TABLE reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list_shares ENABLE ROW LEVEL SECURITY;

-- Policies for reading_lists
CREATE POLICY "Users can view their own lists"
  ON reading_lists FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view lists shared with them"
  ON reading_lists FOR SELECT
  USING (
    id IN (
      SELECT list_id FROM reading_list_shares WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own lists"
  ON reading_lists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own lists"
  ON reading_lists FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own lists"
  ON reading_lists FOR DELETE
  USING (auth.uid() = owner_id);

-- Policies for reading_list_books
CREATE POLICY "Users can view books in their lists"
  ON reading_list_books FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM reading_lists WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view books in shared lists"
  ON reading_list_books FOR SELECT
  USING (
    list_id IN (
      SELECT list_id FROM reading_list_shares WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add books to their lists"
  ON reading_list_books FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM reading_lists WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove books from their lists"
  ON reading_list_books FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM reading_lists WHERE owner_id = auth.uid()
    )
  );

-- Policies for reading_list_shares
CREATE POLICY "Users can view shares of their lists"
  ON reading_list_shares FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM reading_lists WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can see lists shared with them"
  ON reading_list_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can share their lists"
  ON reading_list_shares FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM reading_lists WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can unshare their lists"
  ON reading_list_shares FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM reading_lists WHERE owner_id = auth.uid()
    )
  );
