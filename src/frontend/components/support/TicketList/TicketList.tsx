'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { supportApi } from '@/lib/api'
import TicketItem from '../TicketItem'
import '@/styles/support.css'

type Ticket = {
  id: string
  title: string
  status: string
  updatedAt?: string
}

const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await supportApi.listTickets()
        if (res.success && mounted) setTickets(res.data || [])
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải tickets')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Đang tải tickets…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="support-ticket-list bg-white rounded shadow-sm p-4 divide-y divide-gray-200">
      {tickets.length === 0 ? (
        <div className="p-4 text-gray-600">Không có tickets</div>
      ) : (
        tickets.map((t) => (
          <Link key={t.id} href={`/support/tickets/${t.id}`} className="block">
            <TicketItem id={t.id} title={t.title} status={t.status} updatedAt={t.updatedAt || ''} />
          </Link>
        ))
      )}
    </div>
  )
}

export default TicketList
