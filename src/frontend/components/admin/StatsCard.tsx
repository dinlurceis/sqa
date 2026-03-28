import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  color: 'green' | 'orange' | 'red' | 'blue'
  trend?: {
    value: number
    isPositive: boolean
  }
}

const colorClasses = {
  green: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    icon: 'bg-emerald-500',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    icon: 'bg-orange-500',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    icon: 'bg-red-500',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    icon: 'bg-blue-500',
  },
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color,
  trend 
}: StatsCardProps) {
  const colors = colorClasses[color]

  return (
    <div className={`${colors.bg} rounded-lg p-6 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <h3 className={`${colors.text} text-3xl font-bold`}>{value}</h3>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${colors.icon} p-3 rounded-lg text-white`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center text-xs">
          <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-gray-500 ml-2">so với tháng trước</span>
        </div>
      )}
    </div>
  )
}
