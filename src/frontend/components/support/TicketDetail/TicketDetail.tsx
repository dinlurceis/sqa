'use client'

import React, { useEffect, useState } from 'react'
import { supportApi } from '@/lib/api'
import TicketComposer from '../TicketComposer/TicketComposer'
import '@/styles/support.css'

type Props = { ticketId: string }

const TicketDetail: React.FC<Props> = ({ ticketId }) => {
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await supportApi.getById(ticketId)
        if (res.success && mounted) setTicket(res.data)
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải ticket')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [ticketId])

  if (loading) return <div>Đang tải…</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!ticket) return <div>Không tìm thấy ticket</div>

  return (
    <div className="support-ticket-detail bg-white rounded shadow-sm p-4">
      <h2 className="text-xl font-semibold mb-2">{ticket.title}</h2>
      <div className="text-sm text-gray-600 mb-4">Trạng thái: {ticket.status}</div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 font-medium mb-2">Trao đổi ({ticket.replies?.length || 0}):</p>
        {ticket.replies?.map((m: any, idx: number) => (
          <div key={idx} className={`mb-3 p-3 rounded border ${m.senderType === 'employee' ? 'bg-blue-50 border-blue-200 ml-4' : 'bg-white border-gray-200 mr-4'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold ${m.senderType === 'employee' ? 'text-blue-700' : 'text-gray-700'}`}>
                {m.senderType === 'employee' ? '👨‍💼 Hỗ trợ viên' : '👤 Khách hàng'}
              </span>
              <span className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString('vi-VN')}</span>
            </div>
            <div className="text-sm text-gray-800">{m.content}</div>
          </div>
        ))}
      </div>

      <TicketComposer ticketId={ticketId} onSent={() => {
        // refresh
        supportApi.getById(ticketId).then((r) => { if (r.success) setTicket(r.data) })
      }} />
    </div>
  )
}

export default TicketDetail
