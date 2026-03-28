import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

/**
 * Hook để force logout khi mở tab mới
 * Chỉ tab đăng nhập đầu tiên được giữ auth
 */
export const useTabAuth = () => {
  const { logout, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check nếu đây là tab mới (không có flag trong sessionStorage)
    const isOriginalTab = sessionStorage.getItem('is_original_tab')
    
    if (!isOriginalTab && isAuthenticated) {
      // Đây là tab mới, logout
      console.log('New tab detected, logging out...')
      logout()
    } else if (!isOriginalTab) {
      // Đánh dấu đây là tab gốc
      sessionStorage.setItem('is_original_tab', 'true')
    }

    // Cleanup khi tab đóng
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('is_original_tab')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isAuthenticated, logout])
}
