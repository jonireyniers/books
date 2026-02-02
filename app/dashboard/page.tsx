import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BookCard from './BookCard'
import FriendBookCard from './FriendBookCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch books
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate stats
  const readBooks = books?.filter(book => book.status === 'gelezen') || []
  const totalBooks = readBooks.length
  const currentYear = new Date().getFullYear()
  const booksThisYear = readBooks.filter(book => 
    book.end_date && new Date(book.end_date).getFullYear() === currentYear
  ).length || 0
  const averageRating = readBooks.length > 0
    ? (readBooks.reduce((acc, book) => acc + (book.rating || 0), 0) / readBooks.filter(b => b.rating).length).toFixed(1)
    : '0'

  const currentlyReading = books?.filter(book => book.status === 'bezig') || []
  const wantToRead = books?.filter(book => book.status === 'wil_lezen') || []
  const wishlist = books?.filter(book => book.status === 'verlanglijst') || []

  // Get friends list
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const friendIds = friendships?.map(f => 
    f.user_id === user.id ? f.friend_id : f.user_id
  ) || []

  // Leaderboard - pages read this year
  const { data: leaderboardData } = await supabase
    .from('books')
    .select('user_id, status, end_date, page_count, pages_read')
    .in('user_id', [...friendIds, user.id])
    .in('status', ['gelezen', 'gestopt'])

  const leaderboard = [...friendIds, user.id].map(userId => {
    const userBooks = leaderboardData?.filter(b => {
      if (b.user_id !== userId) return false
      
      // Als er een end_date is, check of het dit jaar is
      if (b.end_date) {
        return new Date(b.end_date).getFullYear() === currentYear
      }
      
      // Als er geen end_date is maar wel status gelezen, tel het mee (recent toegevoegd)
      return b.status === 'gelezen'
    }) || []
    
    // Voor gelezen boeken: tel de volledige page_count
    // Voor gestopte boeken: tel de pages_read
    const totalPages = userBooks.reduce((sum, book) => {
      if (book.status === 'gestopt' && book.pages_read) {
        return sum + book.pages_read
      }
      return sum + (book.page_count || 0)
    }, 0)
    
    const bookCount = userBooks.filter(b => b.status === 'gelezen').length
    return { userId, pages: totalPages, bookCount }
  })
    .sort((a, b) => b.pages - a.pages)
    .slice(0, 5)

  // Get profiles for leaderboard
  const { data: leaderboardProfiles } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', leaderboard.map(l => l.userId))

  const leaderboardWithNames = leaderboard.map(entry => {
    const profile = leaderboardProfiles?.find(p => p.id === entry.userId)
    return {
      ...entry,
      name: profile?.display_name || profile?.username || 'Onbekend',
      isCurrentUser: entry.userId === user.id
    }
  })

  // Friends currently reading
  const { data: friendsReading } = await supabase
    .from('books')
    .select('id, title, author, user_id, cover_image_url')
    .in('user_id', friendIds)
    .eq('status', 'bezig')
    .order('updated_at', { ascending: false })
    .limit(6)

  // Get profiles for friends reading
  const friendsReadingUserIds = [...new Set(friendsReading?.map(b => b.user_id) || [])]
  const { data: friendsReadingProfiles } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', friendsReadingUserIds)

  const friendsReadingWithProfiles = friendsReading?.map(book => {
    const profile = friendsReadingProfiles?.find(p => p.id === book.user_id)
    return {
      ...book,
      readerName: profile?.display_name || profile?.username || 'Onbekend'
    }
  }) || []

  // Activity Feed - recent activities from friends
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .in('user_id', friendIds)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get profiles and books for activities
  const activityUserIds = [...new Set(activities?.map(a => a.user_id) || [])]
  const activityBookIds = [...new Set(activities?.map(a => a.book_id).filter(Boolean) || [])]

  const { data: activityProfiles } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', activityUserIds)

  const { data: activityBooks } = await supabase
    .from('books')
    .select('id, title, author')
    .in('id', activityBookIds)

  const activitiesWithData = activities?.map(activity => {
    const profile = activityProfiles?.find(p => p.id === activity.user_id)
    const book = activityBooks?.find(b => b.id === activity.book_id)
    return { ...activity, profile, book }
  }) || []

  return (
    <div className="space-y-16">
      {/* Hero Section - Modern eye-catcher */}
      <div className="pt-8 pb-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-cyan-500 to-blue-500 p-1">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-blue-400/20 animate-pulse"></div>
          <div className="relative bg-white rounded-[22px] p-12 md:p-16">
            <div className="space-y-2">
              <h1 className="text-6xl md:text-7xl font-black tracking-tight text-neutral-900">
                Welkom terug,
              </h1>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                {profile?.display_name || profile?.username}
              </h2>
              <p className="text-xl text-neutral-600 pt-4">
                Elk boek is een nieuw avontuur.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Minimal and clean */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-xl border transition-all hover:shadow-lg" style={{ borderColor: '#155e68' }}>
          <p className="text-sm font-medium mb-3 uppercase tracking-wide" style={{ color: '#155e68' }}>
            Totaal gelezen
          </p>
          <div className="text-4xl font-semibold mb-1" style={{ color: '#155e68' }}>{totalBooks}</div>
          <p className="text-sm text-neutral-400">boeken</p>
        </div>
        
        <div className="bg-white p-8 rounded-xl border transition-all hover:shadow-lg" style={{ borderColor: '#155e68' }}>
          <p className="text-sm font-medium mb-3 uppercase tracking-wide" style={{ color: '#155e68' }}>
            Dit jaar
          </p>
          <div className="text-4xl font-semibold mb-1" style={{ color: '#155e68' }}>{booksThisYear}</div>
          <p className="text-sm text-neutral-400">boeken</p>
        </div>
        
        <div className="bg-white p-8 rounded-xl border transition-all hover:shadow-lg" style={{ borderColor: '#155e68' }}>
          <p className="text-sm font-medium mb-3 uppercase tracking-wide" style={{ color: '#155e68' }}>
            Gemiddelde
          </p>
          <div className="text-4xl font-semibold mb-1" style={{ color: '#155e68' }}>{averageRating}</div>
          <p className="text-sm text-neutral-400">sterren</p>
        </div>
        
        <div className="bg-white p-8 rounded-xl border transition-all hover:shadow-lg" style={{ borderColor: '#155e68' }}>
          <p className="text-sm font-medium mb-3 uppercase tracking-wide" style={{ color: '#155e68' }}>
            Momenteel
          </p>
          <div className="text-4xl font-semibold mb-1" style={{ color: '#155e68' }}>{currentlyReading.length}</div>
          <p className="text-sm text-neutral-400">aan het lezen</p>
        </div>
      </div>

      {/* Current Reading */}
      {currentlyReading.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#155e68' }}>
            Momenteel aan het lezen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentlyReading.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author}
                href={`/dashboard/books/${book.id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Wishlist */}
      {wishlist.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#155e68' }}>
            Verlanglijst
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wishlist.slice(0, 6).map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author}
                href={`/dashboard/books/${book.id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard/catalog"
          className="inline-flex items-center justify-center px-6 py-3.5 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#155e68' }}
        >
          Boek toevoegen
        </Link>
        <Link
          href="/dashboard/books"
          className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-sm font-medium rounded-lg border transition-colors hover:shadow-md"
          style={{ borderColor: '#155e68', color: '#155e68' }}
        >
          Alle boeken bekijken
        </Link>
      </div>

      {/* Friends Currently Reading */}
      {friendsReadingWithProfiles.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#155e68' }}>
            Vrienden lezen nu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friendsReadingWithProfiles.map((book) => (
              <FriendBookCard
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author}
                userId={book.user_id}
                coverImageUrl={book.cover_image_url}
                readerName={book.readerName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard */}
        {leaderboardWithNames.length > 0 && (
          <div className="bg-white p-8 rounded-2xl border" style={{ borderColor: '#155e68' }}>
            <h2 className="text-xl font-bold mb-6 tracking-tight" style={{ color: '#155e68' }}>
              Leaderboard {currentYear}
            </h2>
            <div className="space-y-3">
              {leaderboardWithNames.map((entry, index) => (
                <div 
                  key={entry.userId}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md`}
                  style={entry.isCurrentUser ? { 
                    backgroundColor: '#f0f9f9',
                    borderColor: '#155e68'
                  } : {
                    backgroundColor: '#f9fafb',
                    borderColor: '#e5e7eb'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold`}
                      style={{
                        color: index === 0 ? '#fbbf24' : 
                              index === 1 ? '#9ca3af' : 
                              index === 2 ? '#f97316' : '#155e68'
                      }}>
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <span className="font-medium" style={{ color: entry.isCurrentUser ? '#155e68' : '#374151' }}>
                        {entry.isCurrentUser ? 'Jij' : entry.name}
                      </span>
                      <p className="text-xs text-gray-500">{entry.bookCount} boeken</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg" style={{ color: '#155e68' }}>{entry.pages.toLocaleString('nl-NL')}</span>
                    <p className="text-xs text-gray-500">pagina's</p>
                  </div>
                </div>
              ))}
            </div>
            {leaderboardWithNames.length === 1 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Voeg vrienden toe om de leaderboard te vullen!
              </p>
            )}
          </div>
        )}

        {/* Activity Feed */}
        <div className="bg-white p-6 rounded-lg border" style={{ borderColor: '#155e68' }}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: '#155e68' }}>
            📰 Vrienden activiteit
          </h2>
          {activitiesWithData.length > 0 ? (
            <div className="space-y-4">
              {activitiesWithData.map((activity) => (
                <div key={activity.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#e6f2f3' }}>
                    <span className="text-sm">
                      {activity.activity_type === 'finished_book' ? '✅' :
                       activity.activity_type === 'started_book' ? '📖' :
                       activity.activity_type === 'rated_book' ? '⭐' :
                       activity.activity_type === 'added_review' ? '💬' : '📚'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.profile?.display_name || activity.profile?.username}</span>
                      {' '}
                      {activity.activity_type === 'finished_book' && 'heeft een boek uitgelezen'}
                      {activity.activity_type === 'started_book' && 'is begonnen met lezen'}
                      {activity.activity_type === 'rated_book' && 'heeft een boek beoordeeld'}
                      {activity.activity_type === 'added_review' && 'heeft een review geschreven'}
                      {activity.activity_type === 'added_friend' && 'heeft een nieuwe vriend toegevoegd'}
                    </p>
                    {activity.book && (
                      <p className="text-sm text-gray-600 truncate">
                        <span className="font-medium">{activity.book.title}</span>
                        {' '} door {activity.book.author}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              Nog geen activiteit van vrienden.
              <br />
              <Link href="/dashboard/friends" className="hover:underline" style={{ color: '#155e68' }}>
                Voeg vrienden toe
              </Link> om hun leesactiviteit te zien!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
