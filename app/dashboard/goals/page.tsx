'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GoalsPage() {
  const [currentYear] = useState(new Date().getFullYear())
  const [goal, setGoal] = useState<number | null>(null)
  const [targetBooks, setTargetBooks] = useState('')
  const [booksRead, setBooksRead] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadGoalAndProgress()
  }, [])

  const loadGoalAndProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load goal
    const { data: goalData } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', currentYear)
      .single()

    if (goalData) {
      setGoal(goalData.target_books)
      setTargetBooks(goalData.target_books.toString())
    }

    // Count books read this year
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'gelezen')

    const booksThisYear = books?.filter(b => {
      if (!b.end_date) return false
      return new Date(b.end_date).getFullYear() === currentYear
    }).length || 0

    setBooksRead(booksThisYear)
    setLoading(false)
  }

  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseInt(targetBooks)
    if (isNaN(target) || target < 1) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('reading_goals')
      .upsert({
        user_id: user.id,
        year: currentYear,
        target_books: target
      })

    if (!error) {
      setGoal(target)
    }
    setSaving(false)
  }

  const deleteGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('reading_goals')
      .delete()
      .eq('user_id', user.id)
      .eq('year', currentYear)

    setGoal(null)
    setTargetBooks('')
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Laden...</p>
      </div>
    )
  }

  const percentage = goal ? Math.min((booksRead / goal) * 100, 100) : 0
  const remaining = goal ? Math.max(goal - booksRead, 0) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-gray-900 mb-2">Leesdoelen</h1>
        <p className="text-gray-600">Stel een doel en houd je voortgang bij</p>
      </div>

      {goal ? (
        <>
          {/* Progress card */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-lg border border-teal-200">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-teal-900 mb-2">
                {booksRead}/{goal}
              </div>
              <div className="text-teal-700">
                boeken gelezen in {currentYear}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="w-full bg-white rounded-full h-4 overflow-hidden border border-teal-200">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-center mt-2 text-teal-800 font-medium">
                {percentage.toFixed(0)}% voltooid
              </div>
            </div>

            {/* Status message */}
            <div className="text-center">
              {booksRead >= goal ? (
                <div className="text-teal-900 font-semibold text-lg">
                  🎉 Gefeliciteerd! Je hebt je doel bereikt!
                </div>
              ) : (
                <div className="text-teal-800">
                  Nog <span className="font-bold">{remaining}</span> boek{remaining !== 1 ? 'en' : ''} te gaan!
                </div>
              )}
            </div>
          </div>

          {/* Motivation card */}
          {remaining > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">💪 Blijf gemotiveerd!</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Je moet gemiddeld <strong>{(remaining / (12 - new Date().getMonth())).toFixed(1)}</strong> boek{remaining > 1 ? 'en' : ''} per maand lezen</p>
                <p>• Dat is ongeveer <strong>{Math.ceil(remaining / ((365 - new Date().getDayOfYear()) / 7))}</strong> boek per week</p>
              </div>
            </div>
          )}

          {/* Edit goal */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Doel aanpassen</h3>
            <form onSubmit={saveGoal} className="flex gap-3">
              <input
                type="number"
                min="1"
                value={targetBooks}
                onChange={(e) => setTargetBooks(e.target.value)}
                placeholder="Aantal boeken"
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
              <button
                type="button"
                onClick={deleteGoal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Verwijderen
              </button>
            </form>
          </div>
        </>
      ) : (
        /* Set new goal */
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Stel een leesdoel voor {currentYear}
            </h2>
            <p className="text-gray-600">
              Hoeveel boeken wil je dit jaar lezen?
            </p>
          </div>

          <form onSubmit={saveGoal} className="max-w-md mx-auto">
            <div className="mb-6">
              <input
                type="number"
                min="1"
                value={targetBooks}
                onChange={(e) => setTargetBooks(e.target.value)}
                placeholder="Bijv. 50"
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-gray-900 text-center text-2xl placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-teal-600 text-white text-lg font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : 'Doel instellen'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Begin met een realistisch doel. Je kunt het altijd nog aanpassen!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
