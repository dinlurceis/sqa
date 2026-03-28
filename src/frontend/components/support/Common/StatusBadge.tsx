'use client'

import React from 'react'
import { FiClock, FiCheckCircle, FiAlertCircle, FiMessageCircle } from 'react-icons/fi'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Đang mở', color: 'bg-blue-100 text-blue-800', icon: <FiMessageCircle className="w-3 h-3" /> },
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: <FiClock className="w-3 h-3" /> },
  in_progress: { label: 'Đang xử lý', color: 'bg-orange-100 text-orange-800', icon: <FiAlertCircle className="w-3 h-3" /> },
  resolved: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800', icon: <FiCheckCircle className="w-3 h-3" /> },
  closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-800', icon: <FiCheckCircle className="w-3 h-3" /> }
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base'
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.open

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      {config.icon}
      {config.label}
    </span>
  )
}
