'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout } = useAuthStore()

  useEffect(() => {
    // Auth state is already restored from localStorage by Zustand persist
    // No additional logic needed here
  }, [])

  return <>{children}</>
}
