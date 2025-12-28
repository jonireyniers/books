'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Book, Profile } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'

interface BookWithProfile extends Book {
  profile: Profile
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<BookWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')

    if (!friendships) {
      setLoading(false)
      return
    }

    // Extract friend IDs
    const friendIds = friendships.map(f => 
      f.user_id === user.id ? f.friend_id : f.user_id
    )

    if (friendIds.length === 0) {
      setLoading(false)
      return
    }

    // Get recommended books from friends
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .in('user_id', friendIds)
      .eq('recommend_to_friends', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (!books) {
      setLoading(false)
      return
    }

    // Get profiles for all book owners
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [...new Set(books.map(b => b.user_id))])

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    const booksWithProfiles = books.map(book => ({
      ...book,
      profile: profileMap.get(book.user_id)!
    }))

    setRecommendations(booksWithProfiles)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Laden...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-light text-gray-900 mb-2">Aanbevelingen van vrienden</h1>
        <p className="text-gray-600">Ontdek boeken die jouw vrienden aanraden</p>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nog geen aanbevelingen
          </h3>
          <p className="text-gray-600">
            Zodra je vrienden boeken markeren als aanbeveling, verschijnen ze hier.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/dashboard/friends/${book.user_id}`}>
                {book.cover_image_url ? (
                  <div className="relative h-64 bg-gray-100">
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                    <span className="text-6xl">📖</span>
                  </div>
                )}
              </Link>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                  </div>
                  <span className="text-2xl ml-2">⭐</span>
                </div>

                {book.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= book.rating! ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({book.rating}/5)</span>
                  </div>
                )}

                {book.review && (
                  <p className="text-sm text-gray-700 line-clamp-3 mb-3 italic">
                    "{book.review}"
                  </p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/friends/${book.user_id}`}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Aanbevolen door {book.profile.username}
                    </Link>
                  </div>
                  {book.available_for_lending && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      📚 Beschikbaar
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
