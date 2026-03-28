'use client'

import React, { useState } from 'react'
import { supportApi } from '@/lib/api'

type Props = { ticketId?: string; onSent?: () => void }

const TicketComposer: React.FC<Props> = ({ ticketId, onSent }) => {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      if (ticketId) {
        await supportApi.replyTicket(ticketId, { content: message })
      } else {
        await supportApi.createTicket({ title: message.slice(0, 40) || 'New ticket', content: message })
      }
      setMessage('')
      onSent?.()
    } catch (err: any) {
      setError(err.message || 'Gửi thất bại')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ticket-composer">
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <textarea className="w-full search-input mb-2" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
      <div className="flex justify-end gap-2">
        <button type="submit" className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={sending || !message.trim()}>
          {sending ? 'Đang gửi...' : ticketId ? 'Gửi trả lời' : 'Tạo ticket'}
        </button>
      </div>
    </form>
  )
}

export default TicketComposer
