'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface LendingRequest {
  id: string
  requester_id: string
  book_id: string
  message: string | null
  response_message?: string | null
  status: 'pending' | 'approved' | 'rejected' | 'returned'
  created_at: string
  requester: {
    username: string
    display_name: string | null
  }
  book: {
    title: string
    author: string
    cover_image_url: string | null
  }
}

export default function LendingRequestsPage() {
  const [requests, setRequests] = useState<LendingRequest[]>([])
  const [myRequests, setMyRequests] = useState<LendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseMessage, setResponseMessage] = useState('')
  const [responseType, setResponseType] = useState<'approved' | 'rejected' | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadRequests()
    
    // Reload when returning to this page
    const interval = setInterval(() => {
      loadRequests()
    }, 5000) // Check every 5 seconds
    
    return () => clearInterval(interval)
  }, [])

  const loadRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get requests received (where I'm the owner)
    const { data: receivedData, error: receivedError } = await supabase
      .from('lending_requests')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    // Get requests sent (where I'm the requester)
    const { data: sentData, error: sentError } = await supabase
      .from('lending_requests')
      .select('*')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false })

    // Manually fetch related data
    if (receivedData && receivedData.length > 0) {
      const requesterIds = [...new Set(receivedData.map(r => r.requester_id))]
      const bookIds = [...new Set(receivedData.map(r => r.book_id))]

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', requesterIds)

      const { data: books } = await supabase
        .from('books')
        .select('id, title, author, cover_image_url')
        .in('id', bookIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
      const bookMap = new Map(books?.map(b => [b.id, b]) || [])

      const enrichedReceived = receivedData.map(req => ({
        ...req,
        requester: profileMap.get(req.requester_id) || { username: 'Unknown', display_name: null },
        book: bookMap.get(req.book_id) || { title: 'Unknown', author: 'Unknown', cover_image_url: null }
      }))

      setRequests(enrichedReceived)
    } else {
      setRequests([])
    }

    // Same for sent requests
    if (sentData && sentData.length > 0) {
      const bookIds = [...new Set(sentData.map(r => r.book_id))]

      const { data: books } = await supabase
        .from('books')
        .select('id, title, author, cover_image_url')
        .in('id', bookIds)

      const bookMap = new Map(books?.map(b => [b.id, b]) || [])

      const enrichedSent = sentData.map(req => ({
        ...req,
        requester: { username: '', display_name: null }, // Not needed for sent
        book: bookMap.get(req.book_id) || { title: 'Unknown', author: 'Unknown', cover_image_url: null }
      }))

      setMyRequests(enrichedSent)
    } else {
      setMyRequests([])
    }

    setLoading(false)
  }

  const handleResponse = async (requestId: string, newStatus: 'approved' | 'rejected', message?: string) => {
    const updateData: any = { 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    }
    
    if (message) {
      updateData.response_message = message
    }

    const { data, error } = await supabase
      .from('lending_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()

    if (error) {
      console.error('Error updating request:', error)
      if (error.message.includes('duplicate key')) {
        alert('Er is al een actief verzoek voor dit boek.')
      } else {
        alert('Fout bij updaten: ' + error.message)
      }
      setRespondingTo(null)
      setResponseMessage('')
      setResponseType(null)
      return
    }

    setRespondingTo(null)
    setResponseMessage('')
    setResponseType(null)
    loadRequests()
  }

  const openResponseDialog = (requestId: string, type: 'approved' | 'rejected') => {
    setRespondingTo(requestId)
    setResponseType(type)
    setResponseMessage('')
  }

  const submitResponse = () => {
    if (respondingTo && responseType) {
      handleResponse(respondingTo, responseType, responseMessage)
    }
  }

  const handleMarkReturned = async (requestId: string) => {
    const { data, error } = await supabase
      .from('lending_requests')
      .update({ status: 'returned', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()

    if (!error) {
      loadRequests()
    } else {
      alert('Fout bij updaten: ' + error.message)
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    returned: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    pending: 'In behandeling',
    approved: 'Goedgekeurd',
    rejected: 'Afgewezen',
    returned: 'Teruggegeven',
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Laden...</p>
      </div>
    )
  }

  const pendingReceived = requests.filter(r => r.status === 'pending').length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-light text-gray-900 mb-2">Uitlenen boeken</h1>
        <p className="text-gray-600">Beheer verzoeken om boeken te lenen</p>
      </div>

      {/* Response Modal */}
      {respondingTo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {responseType === 'approved' ? 'Verzoek goedkeuren' : 'Verzoek afwijzen'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {responseType === 'approved' 
                ? 'Je kunt een optioneel bericht toevoegen met details over wanneer het boek opgehaald kan worden.'
                : 'Je kunt een optioneel bericht toevoegen waarom je dit verzoek afwijst.'}
            </p>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Optioneel bericht..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setRespondingTo(null)
                  setResponseMessage('')
                  setResponseType(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={submitResponse}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  responseType === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {responseType === 'approved' ? 'Goedkeuren' : 'Afwijzen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'received'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ontvangen
          {pendingReceived > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-teal-600 text-white rounded-full">
              {pendingReceived}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'sent'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Verzonden
        </button>
      </div>

      {/* Received Requests */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Geen verzoeken ontvangen
              </h3>
              <p className="text-gray-600">
                Als vrienden je boeken willen lenen, verschijnen de verzoeken hier.
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-gray-900 text-xl">{request.book.title}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColors[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </div>
                    <p className="text-base text-gray-600 mb-3 font-medium">door {request.book.author}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-500">Verzoek van</span>
                      <span className="font-bold text-teal-600 text-base">
                        {request.requester.display_name || request.requester.username}
                      </span>
                    </div>
                    {request.message && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-blue-900 leading-relaxed">"{request.message}"</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <span>📅</span>
                      {new Date(request.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[220px]">
                    {request.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => openResponseDialog(request.id, 'approved')}
                          className="w-full px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all text-base font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                          <span className="text-xl">✓</span>
                          <span>Goedkeuren</span>
                        </button>
                        <button
                          onClick={() => openResponseDialog(request.id, 'rejected')}
                          className="w-full px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all text-base font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                          <span className="text-xl">✗</span>
                          <span>Afwijzen</span>
                        </button>
                      </>
                    ) : request.status === 'approved' ? (
                      <button
                        onClick={() => handleMarkReturned(request.id)}
                        className="w-full px-6 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all text-base font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105"
                      >
                        <span className="text-xl">✓</span>
                        <span>Teruggebracht</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent Requests */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Geen verzoeken verzonden
              </h3>
              <p className="text-gray-600">
                Wanneer je een boek wilt lenen van een vriend, zie je de status hier.
              </p>
            </div>
          ) : (
            myRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{request.book.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">door {request.book.author}</p>
                    {request.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">Jouw bericht: "{request.message}"</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Verzonden op {new Date(request.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    
                    {request.status === 'approved' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 font-medium">
                          ✅ Goedgekeurd! Je mag dit boek ophalen.
                        </p>
                        {request.response_message && (
                          <p className="text-sm text-green-700 mt-2">
                            <strong>Bericht van eigenaar:</strong> "{request.response_message}"
                          </p>
                        )}
                      </div>
                    )}
                    
                    {request.status === 'rejected' && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-800">
                          Dit verzoek is afgewezen.
                        </p>
                        {request.response_message && (
                          <p className="text-sm text-red-700 mt-2">
                            <strong>Reden:</strong> "{request.response_message}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
