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
  const totalBooks = books?.length || 0
  const currentYear = new Date().getFullYear()
  const booksThisYear = books?.filter(book => 
    book.end_date && new Date(book.end_date).getFullYear() === currentYear
  ).length || 0
  
  const readBooks = books?.filter(book => book.status === 'gelezen') || []
  const averageRating = readBooks.length > 0
    ? (readBooks.reduce((acc, book) => acc + (book.rating || 0), 0) / readBooks.filter(b => b.rating).length).toFixed(1)
    : '0'

  const currentlyReading = books?.filter(book => book.status === 'bezig') || []
  const wantToRead = books?.filter(book => book.status === 'wil_lezen') || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light text-neutral-900">
          Hallo, {profile?.display_name || profile?.username}
        </h1>
        <p className="text-neutral-600 mt-1">
          Welkom op je persoonlijke leestraject
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="text-3xl font-light text-neutral-900">{totalBooks}</div>
          <div className="text-sm text-neutral-600 mt-1">Totaal boeken</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="text-3xl font-light text-neutral-900">{booksThisYear}</div>
          <div className="text-sm text-neutral-600 mt-1">Dit jaar gelezen</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="text-3xl font-light text-neutral-900">{averageRating}</div>
          <div className="text-sm text-neutral-600 mt-1">Gemiddelde beoordeling</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="text-3xl font-light text-neutral-900">{currentlyReading.length}</div>
          <div className="text-sm text-neutral-600 mt-1">Nu aan het lezen</div>
        </div>
      </div>

      {/* Current Reading */}
      {currentlyReading.length > 0 && (
        <div>
          <h2 className="text-xl font-light text-neutral-900 mb-4">Momenteel aan het lezen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentlyReading.map((book) => (
              <Link
                key={book.id}
                href={`/dashboard/books/${book.id}`}
                className="bg-white p-4 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors"
              >
                <h3 className="font-medium text-neutral-900">{book.title}</h3>
                <p className="text-sm text-neutral-600 mt-1">{book.author}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Want to Read */}
      {wantToRead.length > 0 && (
        <div>
          <h2 className="text-xl font-light text-neutral-900 mb-4">Wil ik lezen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wantToRead.slice(0, 6).map((book) => (
              <Link
                key={book.id}
                href={`/dashboard/books/${book.id}`}
                className="bg-white p-4 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors"
              >
                <h3 className="font-medium text-neutral-900">{book.title}</h3>
                <p className="text-sm text-neutral-600 mt-1">{book.author}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/books/new"
          className="bg-neutral-900 text-white px-6 py-3 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Boek toevoegen
        </Link>
        <Link
          href="/dashboard/books"
          className="bg-white text-neutral-900 px-6 py-3 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
        >
          Alle boeken bekijken
        </Link>
      </div>
    </div>
  )
}
