import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ReadingStatus } from '@/lib/types'
import DeleteBookButton from './DeleteBookButton'
import StatusSelector from './StatusSelector'

const statusLabels: Record<ReadingStatus, string> = {
  'wil_lezen': 'Wil lezen',
  'bezig': 'Aan het lezen',
  'gelezen': 'Gelezen',
  'verlanglijst': 'Verlanglijst',
  'gestopt': 'Gestopt'
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!book) {
    notFound()
  }

  // Fetch tags
  const { data: bookTags } = await supabase
    .from('book_tags')
    .select('tag_id, tags(name)')
    .eq('book_id', book.id)

  const tags = bookTags?.map(bt => (bt.tags as any).name) || []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/books"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Terug naar overzicht
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {book.cover_image_url && (
          <div className="w-full h-64 bg-gray-100">
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <StatusSelector bookId={book.id} currentStatus={book.status as ReadingStatus} />
            <div className="flex gap-2">
              <Link
                href={`/dashboard/books/${book.id}/edit`}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
              >
                Bewerken
              </Link>
              <DeleteBookButton bookId={book.id} />
            </div>
          </div>

          <h1 className="text-3xl font-light text-neutral-900 mb-2">{book.title}</h1>
          <p className="text-lg text-neutral-600 mb-6">{book.author}</p>

          {book.description && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-neutral-700 mb-2">Beschrijving</h2>
              <p className="text-neutral-600">{book.description}</p>
            </div>
          )}

        {/* Book metadata */}
        {(book.isbn || book.page_count || book.published_date || book.publisher || book.language) && (
          <div className="mb-6 p-4 bg-neutral-50 rounded-lg space-y-2">
            <h2 className="text-sm font-medium text-neutral-700 mb-3">Boekgegevens</h2>
            {book.isbn && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">ISBN:</span>
                <span className="text-neutral-900 font-medium">{book.isbn}</span>
              </div>
            )}
            {book.page_count && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Aantal pagina's:</span>
                <span className="text-neutral-900 font-medium">{book.page_count}</span>
              </div>
            )}
            {book.published_date && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Gepubliceerd:</span>
                <span className="text-neutral-900 font-medium">{book.published_date}</span>
              </div>
            )}
            {book.publisher && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Uitgever:</span>
                <span className="text-neutral-900 font-medium">{book.publisher}</span>
              </div>
            )}
            {book.language && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Taal:</span>
                <span className="text-neutral-900 font-medium">
                  {book.language === 'nl' ? 'Nederlands' : 
                   book.language === 'en' ? 'Engels' : 
                   book.language === 'fr' ? 'Frans' : 
                   book.language === 'de' ? 'Duits' : book.language}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          {book.start_date && (
            <div>
              <h2 className="text-sm font-medium text-neutral-700 mb-1">Startdatum</h2>
              <p className="text-neutral-900">
                {new Date(book.start_date).toLocaleDateString('nl-NL')}
              </p>
            </div>
          )}

          {book.end_date && (
            <div>
              <h2 className="text-sm font-medium text-neutral-700 mb-1">Einddatum</h2>
              <p className="text-neutral-900">
                {new Date(book.end_date).toLocaleDateString('nl-NL')}
              </p>
            </div>
          )}
        </div>

        {book.rating && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-700 mb-2">Beoordeling</h2>
            <div className="text-2xl">
              {'⭐'.repeat(book.rating)}
            </div>
          </div>
        )}

        {book.review && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-700 mb-2">Persoonlijke opmerking</h2>
            <p className="text-neutral-600 bg-neutral-50 p-4 rounded-lg">{book.review}</p>
          </div>
        )}

        {book.status === 'gestopt' && book.pages_read && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-700 mb-2">Gelezen pagina's</h2>
            <p className="text-neutral-900">
              {book.pages_read} {book.page_count && `van ${book.page_count}`} pagina's
            </p>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-neutral-700 mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-neutral-200">
          <p className="text-sm text-neutral-600">
            {book.is_public ? '🌍 Zichtbaar voor vrienden' : '🔒 Privé'}
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
