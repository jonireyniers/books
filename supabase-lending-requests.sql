-- Lending Requests Table
CREATE TABLE IF NOT EXISTS lending_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, book_id, status)
);

-- Enable RLS
ALTER TABLE lending_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own requests"
  ON lending_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create lending requests"
  ON lending_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Book owners can update requests"
  ON lending_requests FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own pending requests"
  ON lending_requests FOR DELETE
  USING (auth.uid() = requester_id AND status = 'pending');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lending_requests_requester ON lending_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_lending_requests_owner ON lending_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_lending_requests_book ON lending_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_lending_requests_status ON lending_requests(status);
