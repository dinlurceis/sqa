'use client'

import React from 'react'
import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'

interface SupportCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  badge?: string
}

export default function SupportCard({ title, description, icon, href, badge }: SupportCardProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 group block"
    >
      <div className="flex items-start gap-4">
        <div className="text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            {badge && (
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          <div className="flex items-center gap-1 mt-3 text-sm text-blue-600">
            <span>Xem chi tiết</span>
            <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  )
}
