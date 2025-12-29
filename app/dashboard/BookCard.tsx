'use client'

import Link from 'next/link'

interface BookCardProps {
  id: number
  title: string
  author: string
  href: string
}

export default function BookCard({ id, title, author, href }: BookCardProps) {
  return (
    <Link
      href={href}
      className="group bg-white p-6 rounded-xl border border-neutral-200 transition-all hover:shadow-lg"
      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#155e68'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
    >
      <h3 className="font-medium text-neutral-900 mb-2 transition-colors">{title}</h3>
      <p className="text-sm text-neutral-500">{author}</p>
    </Link>
  )
}
