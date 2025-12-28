-- New Features Database Schema

-- 1. Genres for books (add column to existing books table)
ALTER TABLE books ADD COLUMN IF NOT EXISTS genre TEXT;

-- 2. Book Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  quote TEXT NOT NULL,
  page_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Book Recommendations (friend to friend)
CREATE TABLE IF NOT EXISTS book_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activity Feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('finished_book', 'started_book', 'rated_book', 'added_review', 'added_friend')),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Friend Book Reviews (reviews on friends' books)
CREATE TABLE IF NOT EXISTS friend_book_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  book_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, book_id)
);

-- Row Level Security Policies

-- Quotes policies
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotes"
  ON quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotes"
  ON quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Recommendations policies
CREATE POLICY "Users can view recommendations sent to them"
  ON book_recommendations FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can send recommendations"
  ON book_recommendations FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update recommendations sent to them"
  ON book_recommendations FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Activities policies
CREATE POLICY "Users can view friends' activities"
  ON activities FOR SELECT
  USING (
    auth.uid() = user_id OR
    user_id IN (
      SELECT friend_id FROM friendships
      WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friendships
      WHERE friend_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can create own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Friend reviews policies
CREATE POLICY "Users can view reviews on their books and reviews they wrote"
  ON friend_book_reviews FOR SELECT
  USING (
    auth.uid() = reviewer_id OR 
    auth.uid() = book_owner_id OR
    book_owner_id IN (
      SELECT friend_id FROM friendships
      WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friendships
      WHERE friend_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can write reviews on friends' public books"
  ON friend_book_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    book_owner_id IN (
      SELECT friend_id FROM friendships
      WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friendships
      WHERE friend_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON friend_book_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
  ON friend_book_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_book_reviews ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_book_id ON quotes(book_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_to_user ON book_recommendations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_from_user ON book_recommendations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_reviews_book_id ON friend_book_reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_friend_reviews_reviewer ON friend_book_reviews(reviewer_id);
