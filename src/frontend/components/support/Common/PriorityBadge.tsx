'use client'

import React from 'react'

interface PriorityBadgeProps {
  priority: string
  size?: 'sm' | 'md' | 'lg'
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Thấp', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Trung bình', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-600' },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base'
}

export default function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  )
}
