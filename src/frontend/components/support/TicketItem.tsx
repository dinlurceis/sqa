'use client'

import React from 'react'

type Props = { id: string; title: string; status: string; updatedAt?: string }

const statusClasses = (status: string) =>
  status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'

const TicketItem: React.FC<Props> = ({ id, title, status, updatedAt }) => {
  return (
    <div className="ticket-item flex justify-between items-center p-3 hover:bg-gray-50 cursor-pointer">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-500">Cập nhật: {updatedAt}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-sm ${statusClasses(status)}`}>{status}</span>
      </div>
    </div>
  )
}

export default TicketItem
