-- Fix: Allow users to delete friendships they're part of (both user_id and friend_id)
-- This allows rejecting friend requests and removing friends

-- Drop the old restrictive policy
DROP POLICY "Users can delete own friendship requests" ON friendships;

-- Create new policy that allows deletion if user is EITHER user_id OR friend_id
CREATE POLICY "Users can delete friendships they're part of"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
