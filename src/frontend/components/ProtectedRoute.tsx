'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  allowedPositions?: string[]
  requireAuth?: boolean
}

/**
 * Protected Route Component with Hydration Support
 * Prevents premature redirects before auth state is loaded from localStorage
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  allowedPositions = [],
  requireAuth = true,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand persist to hydrate
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    // Don't check auth until hydrated
    if (!isHydrated) return

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    // Check role/position authorization
    if (allowedRoles.length > 0 || allowedPositions.length > 0) {
      const hasRole = allowedRoles.includes(user?.role || '')
      const hasPosition = allowedPositions.includes(user?.position || '')
      
      if (!hasRole && !hasPosition) {
        toast.error('Bạn không có quyền truy cập trang này')
        router.push('/')
        return
      }
    }
  }, [isHydrated, isAuthenticated, user, requireAuth, allowedRoles, allowedPositions, router])

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  // Show loading while checking auth
  if (requireAuth && !isAuthenticated) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
