import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ReadingStatus } from '@/lib/types'
import LendingRequestButton from './LendingRequestButton'

const statusLabels: Record<ReadingStatus, string> = {
  'wil_lezen': 'Wil lezen',
  'bezig': 'Aan het lezen',
  'gelezen': 'Gelezen',
  'verlanglijst': 'Verlanglijst',
  'gestopt': 'Gestopt'
}

const statusColors: Record<ReadingStatus, string> = {
  'wil_lezen': 'bg-blue-100 text-blue-800',
  'bezig': 'bg-yellow-100 text-yellow-800',
  'gelezen': 'bg-green-100 text-green-800',
  'verlanglijst': 'bg-purple-100 text-purple-800',
  'gestopt': 'bg-red-100 text-red-800'
}

export default async function FriendProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Check if they are friends
  const { data: friendship } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${user.id})`)
    .eq('status', 'accepted')
    .single()

  if (!friendship) {
    notFound()
  }

  // Get friend's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    notFound()
  }

  // Get friend's public books
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // Stats
  const totalBooks = books?.length || 0
  const readBooks = books?.filter(b => b.status === 'gelezen') || []
  const averageRating = readBooks.length > 0
    ? (readBooks.reduce((acc, book) => acc + (book.rating || 0), 0) / readBooks.filter(b => b.rating).length).toFixed(1)
    : '0'
  
  const currentYear = new Date().getFullYear()
  const booksThisYear = books?.filter(book => 
    book.end_date && new Date(book.end_date).getFullYear() === currentYear
  ).length || 0

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <Link
          href="/dashboard/friends"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Terug naar vrienden
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg border border-neutral-200">
        <h1 className="text-3xl font-light text-neutral-900 mb-1">
          {profile.display_name || profile.username}
        </h1>
        <p className="text-neutral-600">@{profile.username}</p>
        {profile.bio && (
          <p className="text-neutral-600 mt-4">{profile.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="text-3xl font-light text-neutral-900">{totalBooks}</div>
          <div className="text-sm text-neutral-600 mt-1">Gedeelde boeken</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="text-3xl font-light text-neutral-900">{booksThisYear}</div>
          <div className="text-sm text-neutral-600 mt-1">Dit jaar gelezen</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="text-3xl font-light text-neutral-900">{averageRating}</div>
          <div className="text-sm text-neutral-600 mt-1">Gemiddelde beoordeling</div>
        </div>
      </div>

      {/* Books */}
      <div>
        <h2 className="text-xl font-light text-neutral-900 mb-4">Boeken</h2>
        {books && books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white p-5 rounded-lg border border-neutral-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[book.status as ReadingStatus]}`}>
                      {statusLabels[book.status as ReadingStatus]}
                    </span>
                    {book.recommend_to_friends && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        ⭐ Aangeraden
                      </span>
                    )}
                    {book.available_for_lending && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        📚 Beschikbaar
                      </span>
                    )}
                  </div>
                  {book.rating && (
                    <div className="text-sm text-neutral-600">
                      {'⭐'.repeat(book.rating)}
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-neutral-900 mb-1">{book.title}</h3>
                <p className="text-sm text-neutral-600 mb-2">{book.author}</p>
                
                {book.description && (
                  <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{book.description}</p>
                )}

                {book.review && (
                  <p className="text-sm text-neutral-600 italic bg-neutral-50 p-3 rounded mt-3">
                    "{book.review}"
                  </p>
                )}
                
                {book.end_date && (
                  <p className="text-xs text-neutral-500 mt-3">
                    Gelezen op {new Date(book.end_date).toLocaleDateString('nl-NL')}
                  </p>
                )}

                {book.available_for_lending && (
                  <LendingRequestButton
                    bookId={book.id}
                    ownerId={id}
                    bookTitle={book.title}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
            <p className="text-neutral-600">Geen openbare boeken gedeeld</p>
          </div>
        )}
      </div>
    </div>
  )
}
