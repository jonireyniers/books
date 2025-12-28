export type ReadingStatus = 'verlanglijst' | 'wil_lezen' | 'bezig' | 'gelezen'
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Book {
  id: string
  user_id: string
  title: string
  author: string
  description: string | null
  cover_image_url: string | null
  cover_url: string | null
  isbn: string | null
  status: ReadingStatus
  start_date: string | null
  end_date: string | null
  rating: number | null
  review: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  user_id: string
  created_at: string
}

export interface BookTag {
  book_id: string
  tag_id: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export interface BookWithTags extends Book {
  tags?: Tag[]
}

export interface ReadingStats {
  total_books: number
  books_this_year: number
  average_rating: number
  most_used_tags: { name: string; count: number }[]
  average_reading_days: number
}
