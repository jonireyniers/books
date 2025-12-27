import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function WishlistPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'wil_lezen')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light text-neutral-900">Verlanglijstje</h1>
          <p className="text-neutral-600 mt-1">Boeken die je nog wilt lezen</p>
        </div>
        <Link
          href="/dashboard/books/new"
          className="bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Boek toevoegen
        </Link>
      </div>

      {books && books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/dashboard/books/${book.id}`}
              className="bg-white p-5 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-all hover:shadow-sm group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Wil lezen
                </span>
                <span className="text-neutral-400 group-hover:text-neutral-600 transition-colors">→</span>
              </div>
              
              <h3 className="font-medium text-neutral-900 mb-1">{book.title}</h3>
              <p className="text-sm text-neutral-600 mb-2">{book.author}</p>
              
              {book.description && (
                <p className="text-sm text-neutral-500 line-clamp-2">{book.description}</p>
              )}
              
              <p className="text-xs text-neutral-500 mt-3">
                Toegevoegd op {new Date(book.created_at).toLocaleDateString('nl-NL')}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
          <p className="text-xl mb-2">📚</p>
          <p className="text-neutral-600 mb-4">Je verlanglijstje is nog leeg</p>
          <Link
            href="/dashboard/books/new"
            className="inline-block bg-neutral-900 text-white px-6 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Voeg je eerste boek toe
          </Link>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Als je een boek begint te lezen, wijzig dan de status naar "Aan het lezen" op de boekpagina.
        </p>
      </div>
    </div>
  )
}
