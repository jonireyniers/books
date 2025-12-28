'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReadingStatus } from '@/lib/types'
import { logActivity } from '@/lib/activity-logger'

const statusLabels: Record<ReadingStatus, string> = {
  'verlanglijst': 'Verlanglijst',
  'wil_lezen': 'Wil lezen',
  'bezig': 'Aan het lezen',
  'gelezen': 'Gelezen'
}

const statusColors: Record<ReadingStatus, string> = {
  'verlanglijst': 'bg-purple-50 text-purple-700 border-purple-200',
  'wil_lezen': 'bg-blue-50 text-blue-700 border-blue-200',
  'bezig': 'bg-amber-50 text-amber-700 border-amber-200',
  'gelezen': 'bg-teal-50 text-teal-700 border-teal-200'
}

interface QuickStatusChangeProps {
  bookId: string
  currentStatus: ReadingStatus
  onStatusChange: () => void
}

export default function QuickStatusChange({ bookId, currentStatus, onStatusChange }: QuickStatusChangeProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()

  const updateStatus = async (newStatus: ReadingStatus, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setUpdating(true)
    setShowDropdown(false)
    
    const updates: any = { status: newStatus }
    
    if (newStatus === 'bezig' && currentStatus === 'wil_lezen') {
      updates.start_date = new Date().toISOString().split('T')[0]
    }
    if (newStatus === 'gelezen') {
      updates.end_date = new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)

    if (!error) {
      // Log activity
      if (newStatus === 'gelezen') {
        await logActivity('finished_book', bookId)
      } else if (newStatus === 'bezig' && currentStatus !== 'bezig') {
        await logActivity('started_book', bookId)
      }
      
      onStatusChange()
    }
    
    setUpdating(false)
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDropdown(!showDropdown)
  }

  const statuses: ReadingStatus[] = ['verlanglijst', 'wil_lezen', 'bezig', 'gelezen']

  return (
    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleButtonClick}
        disabled={updating}
        className={`text-xs px-3 py-1 rounded-md font-medium border transition-all ${statusColors[currentStatus]} ${
          updating ? 'opacity-50' : 'hover:shadow-sm'
        }`}
      >
        {updating ? '...' : statusLabels[currentStatus]}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0" 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowDropdown(false)
            }}
          />
          <div className="absolute top-full mt-1 left-0 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden min-w-[160px]">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={(e) => updateStatus(s, e)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                  s === currentStatus ? 'bg-neutral-50 font-medium' : ''
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  s === 'verlanglijst' ? 'bg-purple-500' :
                  s === 'wil_lezen' ? 'bg-blue-500' :
                  s === 'bezig' ? 'bg-amber-500' :
                  'bg-teal-500'
                }`} />
                {statusLabels[s]}
                {s === currentStatus && ' ✓'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
