'use client'

import { usePermissionCheck } from '@/hooks/usePermissionCheck'
import { type Position, POSITION_NAMES } from '@/lib/permissions'
import { FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredPosition: Position | Position[]
  mode?: 'hide' | 'disable' | 'show-message'
  fallback?: React.ReactNode
}

export default function PermissionGuard({ 
  children, 
  requiredPosition,
  mode = 'hide',
  fallback 
}: PermissionGuardProps) {
  const { checkPermission } = usePermissionCheck()
  
  const hasAccess = checkPermission(requiredPosition)
  
  if (hasAccess) {
    return <>{children}</>
  }

  // If no access
  if (mode === 'hide') {
    return fallback ? <>{fallback}</> : null
  }

  if (mode === 'disable') {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-5 rounded-lg">
          <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200 flex items-center space-x-2">
            <FiLock className="text-gray-500" size={14} />
            <span className="text-xs text-gray-600">Không có quyền</span>
          </div>
        </div>
      </div>
    )
  }

  return fallback ? <>{fallback}</> : null
}

// Component for action buttons with permission check
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  requiredPosition: Position | Position[]
  showTooltip?: boolean
}

export function PermissionButton({ 
  requiredPosition, 
  showTooltip = true,
  children,
  onClick,
  className = '',
  ...props 
}: PermissionButtonProps) {
  const { checkPermission, getEmployeePosition } = usePermissionCheck()
  const hasAccess = checkPermission(requiredPosition)
  const currentPosition = getEmployeePosition()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasAccess) {
      e.preventDefault()
      const requiredPositions = Array.isArray(requiredPosition) ? requiredPosition : [requiredPosition]
      const requiredNames = requiredPositions.map(pos => POSITION_NAMES[pos]).join(', ')
      
      toast.error(
        `Chức năng này chỉ dành cho: ${requiredNames}\nVị trí của bạn: ${currentPosition ? POSITION_NAMES[currentPosition] : 'Chưa xác định'}`,
        { duration: 4000 }
      )
      return
    }
    
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={!hasAccess || props.disabled}
      className={`${className} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!hasAccess && showTooltip ? 'Bạn không có quyền sử dụng chức năng này' : props.title}
    >
      {!hasAccess && (
        <FiLock className="inline-block mr-1" size={14} />
      )}
      {children}
    </button>
  )
}
