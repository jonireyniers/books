import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
    .select('user_id, status, end_date, page_count')
    .in('user_id', [...friendIds, user.id])
    .eq('status', 'gelezen')

  const leaderboard = [...friendIds, user.id].map(userId => {
    const userBooks = leaderboardData?.filter(b => {
      if (b.user_id !== userId) return false
      
      // Als er een end_date is, check of het dit jaar is
      if (b.end_date) {
        return new Date(b.end_date).getFullYear() === currentYear
      }
      
      // Als er geen end_date is maar wel status gelezen, tel het mee (recent toegevoegd)
      return true
    }) || []
    const totalPages = userBooks.reduce((sum, book) => sum + (book.page_count || 0), 0)
    const bookCount = userBooks.length
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
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Welkom terug, {profile?.display_name || profile?.username}
            </h1>
            <p className="text-gray-600 text-lg">
              Dashboard overzicht
            </p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Dit jaar</p>
              <p className="text-2xl font-bold text-teal-600">{booksThisYear}</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Totaal</p>
              <p className="text-2xl font-bold text-gray-900">{totalBooks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Totaal gelezen</p>
          <div className="text-3xl font-bold text-gray-900 mb-0.5">{totalBooks}</div>
          <p className="text-sm text-gray-500 font-medium">boeken</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-sm transition-all">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dit jaar</p>
          <div className="text-3xl font-bold text-teal-600 mb-0.5">{booksThisYear}</div>
          <p className="text-sm text-gray-500 font-medium">boeken</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Gemiddelde rating</p>
          <div className="text-3xl font-semibold text-gray-900 mb-1">{averageRating}</div>
          <p className="text-sm text-gray-600">sterren</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Momenteel</p>
          <div className="text-3xl font-semibold text-gray-900 mb-1">{currentlyReading.length}</div>
          <p className="text-sm text-gray-600">aan het lezen</p>
        </div>
      </div>

      {/* Current Reading */}
      {currentlyReading.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Momenteel aan het lezen</h2>
            <span className="text-sm text-gray-500">{currentlyReading.length} {currentlyReading.length === 1 ? 'boek' : 'boeken'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentlyReading.map((book) => (
              <Link
                key={book.id}
                href={`/dashboard/books/${book.id}`}
                className="group bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-teal-500 transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">{book.title}</h3>
                <p className="text-sm text-gray-600">{book.author}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist */}
      {wishlist.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Verlanglijst</h2>
            <span className="text-sm text-gray-500">{wishlist.length} {wishlist.length === 1 ? 'boek' : 'boeken'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wishlist.slice(0, 6).map((book) => (
              <Link
                key={book.id}
                href={`/dashboard/books/${book.id}`}
                className="group bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-teal-500 transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">{book.title}</h3>
                <p className="text-sm text-gray-600">{book.author}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/books/new"
          className="inline-flex items-center px-6 py-3 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          Boek toevoegen
        </Link>
        <Link
          href="/dashboard/books"
          className="inline-flex items-center px-6 py-3 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
        >
          Alle boeken bekijken
        </Link>
      </div>

      {/* Friends Currently Reading */}
      {friendsReadingWithProfiles.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📖 Vrienden lezen nu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friendsReadingWithProfiles.map((book) => (
              <Link
                key={book.id}
                href={`/dashboard/friends/${book.user_id}`}
                className="group flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-teal-500 hover:shadow-md transition-all"
              >
                {book.cover_image_url && (
                  <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                    <img 
                      src={book.cover_image_url} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-teal-600 font-medium mb-1">{book.readerName}</p>
                  <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 truncate">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard */}
        {leaderboardWithNames.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🏆 Leaderboard {currentYear}
            </h2>
            <div className="space-y-3">
              {leaderboardWithNames.map((entry, index) => (
                <div 
                  key={entry.userId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.isCurrentUser ? 'bg-teal-50 border border-teal-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-gray-400' : 
                      index === 2 ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <span className={`font-medium ${entry.isCurrentUser ? 'text-teal-700' : 'text-gray-700'}`}>
                        {entry.isCurrentUser ? 'Jij' : entry.name}
                      </span>
                      <p className="text-xs text-gray-500">{entry.bookCount} boeken</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-900 font-bold text-lg">{entry.pages.toLocaleString('nl-NL')}</span>
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
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📰 Vrienden activiteit
          </h2>
          {activitiesWithData.length > 0 ? (
            <div className="space-y-4">
              {activitiesWithData.map((activity) => (
                <div key={activity.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
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
              <Link href="/dashboard/friends" className="text-teal-600 hover:underline">
                Voeg vrienden toe
              </Link> om hun leesactiviteit te zien!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
