'use client'

import Link from 'next/link'

interface FriendBookCardProps {
  id: number
  title: string
  author: string
  userId: string
  coverImageUrl?: string
  readerName: string
}

export default function FriendBookCard({ 
  id, 
  title, 
  author, 
  userId, 
  coverImageUrl, 
  readerName 
}: FriendBookCardProps) {
  return (
    <Link
      href={`/dashboard/friends/${userId}`}
      className="group flex gap-4 p-6 bg-white rounded-xl border border-neutral-200 transition-all hover:shadow-lg"
      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#155e68'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
    >
      {coverImageUrl && (
        <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
          <img 
            src={coverImageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-neutral-500 mb-2">{readerName}</p>
        <h3 className="text-sm font-medium text-neutral-900 truncate mb-1">
          {title}
        </h3>
        <p className="text-xs text-neutral-500 truncate">{author}</p>
      </div>
    </Link>
  )
}
