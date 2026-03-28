import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'

/**
 * Custom hook to handle Zustand persist hydration
 * Prevents premature redirects before auth state is loaded from localStorage
 */
export function useHydratedAuth() {
  const { user, isAuthenticated } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated after first render
    setIsHydrated(true)
  }, [])

  return {
    user,
    isAuthenticated,
    isHydrated,
    // Only consider auth state valid after hydration
    isReady: isHydrated,
  }
}
