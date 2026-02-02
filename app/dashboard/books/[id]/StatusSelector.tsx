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
  'gelezen': 'Gelezen',
  'gestopt': 'Gestopt'
}

const statusColors: Record<ReadingStatus, string> = {
  'verlanglijst': 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  'wil_lezen': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  'bezig': 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  'gelezen': 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  'gestopt': 'bg-red-100 text-red-700 hover:bg-red-200'
}

interface StatusSelectorProps {
  bookId: string
  currentStatus: ReadingStatus
}

export default function StatusSelector({ bookId, currentStatus }: StatusSelectorProps) {
  const [status, setStatus] = useState<ReadingStatus>(currentStatus)
  const [updating, setUpdating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [pagesRead, setPagesRead] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const updateStatus = async (newStatus: ReadingStatus, pages?: number) => {
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
    if (newStatus === 'gestopt') {
      updates.end_date = new Date().toISOString().split('T')[0]
      if (pages !== undefined) {
        updates.pages_read = pages
      }
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

  const handleStatusClick = (newStatus: ReadingStatus) => {
    if (newStatus === 'gestopt') {
      setShowDropdown(false)
      setShowStopDialog(true)
    } else {
      updateStatus(newStatus)
    }
  }

  const handleStopSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pages = pagesRead ? parseInt(pagesRead) : undefined
    await updateStatus('gestopt', pages)
    setShowStopDialog(false)
    setPagesRead('')
  }

  const statuses: ReadingStatus[] = ['verlanglijst', 'wil_lezen', 'bezig', 'gelezen', 'gestopt']

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
                onClick={() => handleStatusClick(s)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 transition-colors ${
                  s === status ? 'bg-neutral-50 font-medium' : ''
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  s === 'verlanglijst' ? 'bg-purple-500' :
                  s === 'wil_lezen' ? 'bg-blue-500' :
                  s === 'bezig' ? 'bg-amber-500' :
                  s === 'gelezen' ? 'bg-teal-500' :
                  'bg-red-500'
                }`} />
                {statusLabels[s]}
                {s === status && ' ✓'}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Stop Dialog */}
      {showStopDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Boek stoppen
            </h2>
            <form onSubmit={handleStopSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tot welke pagina ben je gekomen? (optioneel)
                </label>
                <input
                  type="number"
                  min="0"
                  value={pagesRead}
                  onChange={(e) => setPagesRead(e.target.value)}
                  placeholder="Bijv. 150"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#155e68] focus:border-transparent"
                />
                <p className="text-sm text-neutral-600 mt-2">
                  Deze pagina's tellen mee voor het leaderboard
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStopDialog(false)
                    setPagesRead('')
                  }}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Bezig...' : 'Stoppen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
