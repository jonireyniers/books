'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ReadingStatus } from '@/lib/types'
import { logActivity } from '@/lib/activity-logger'

const statusLabels: Record<ReadingStatus, string> = {
  'verlanglijst': 'Verlanglijst',
  'wil_lezen': 'Wil lezen',
  'bezig': 'Aan het lezen',
  'gelezen': 'Gelezen'
}

const statusColors: Record<ReadingStatus, string> = {
  'verlanglijst': 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  'wil_lezen': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  'bezig': 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  'gelezen': 'bg-teal-100 text-teal-700 hover:bg-teal-200'
}

interface StatusSelectorProps {
  bookId: string
  currentStatus: ReadingStatus
}

export default function StatusSelector({ bookId, currentStatus }: StatusSelectorProps) {
  const [status, setStatus] = useState<ReadingStatus>(currentStatus)
  const [updating, setUpdating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const updateStatus = async (newStatus: ReadingStatus) => {
    setUpdating(true)
    setShowDropdown(false)
    
    const updates: any = { status: newStatus }
    
    // Automatisch datums instellen
    if (newStatus === 'bezig' && !status) {
      updates.start_date = new Date().toISOString().split('T')[0]
    }
    if (newStatus === 'gelezen') {
      if (!updates.start_date) {
        updates.start_date = new Date().toISOString().split('T')[0]
      }
      updates.end_date = new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)

    if (!error) {
      setStatus(newStatus)
      
      // Log activity
      if (newStatus === 'gelezen') {
        await logActivity('finished_book', bookId)
      } else if (newStatus === 'bezig' && currentStatus !== 'bezig') {
        await logActivity('started_book', bookId)
      }
      
      router.refresh()
    }
    
    setUpdating(false)
  }

  const statuses: ReadingStatus[] = ['verlanglijst', 'wil_lezen', 'bezig', 'gelezen']

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={updating}
        className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${statusColors[status]} ${
          updating ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {updating ? 'Bijwerken...' : statusLabels[status]} ▾
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full mt-2 left-0 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-20 min-w-[180px]">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition-colors ${
                  s === status ? 'bg-neutral-50 font-medium' : ''
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  s === 'verlanglijst' ? 'bg-purple-500' :
                  s === 'wil_lezen' ? 'bg-blue-500' :
                  s === 'bezig' ? 'bg-amber-500' :
                  'bg-teal-500'
                }`} />
                {statusLabels[s]}
                {s === status && ' ✓'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
