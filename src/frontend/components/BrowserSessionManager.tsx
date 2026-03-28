'use client'

import { useEffect } from 'react'

/**
 * Component quản lý session browser
 * Sử dụng cơ chế đếm tab để xóa auth khi đóng browser hoàn toàn
 */
export default function BrowserSessionManager() {
  useEffect(() => {
    // Đánh dấu tab này đang active
    const tabId = Math.random().toString(36).substring(7)
    sessionStorage.setItem('tab_id', tabId)
    
    // Lấy danh sách tab đang mở từ localStorage
    const getActiveTabs = (): string[] => {
      const tabs = localStorage.getItem('active_tabs')
      return tabs ? JSON.parse(tabs) : []
    }
    
    const setActiveTabs = (tabs: string[]) => {
      localStorage.setItem('active_tabs', JSON.stringify(tabs))
    }
    
    // Cleanup các tab ID cũ (tab đã đóng nhưng không cleanup được)
    const cleanupStaleTabs = () => {
      const currentTabs = getActiveTabs()
      // Chỉ giữ lại tab hiện tại, xóa các tab cũ
      // (Vì khi reload, các tab cũ không còn tồn tại)
      setActiveTabs([tabId])
    }
    
    // Kiểm tra xem có phải tab đầu tiên trong session không
    const existingTabs = getActiveTabs()
    if (existingTabs.length === 0) {
      // Tab đầu tiên trong session mới
      setActiveTabs([tabId])
    } else {
      // Tab mới trong session đang có
      existingTabs.push(tabId)
      setActiveTabs(existingTabs)
    }
    
    // Khi tab đóng, xóa khỏi danh sách
    const handleBeforeUnload = () => {
      const tabs = getActiveTabs().filter(id => id !== tabId)
      
      if (tabs.length === 0) {
        // Đây là tab cuối cùng → Xóa auth
        localStorage.removeItem('auth-storage')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('token')
        localStorage.removeItem('active_tabs')
      } else {
        // Còn tab khác → Chỉ xóa tab này
        setActiveTabs(tabs)
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Cleanup khi component unmount (không phải beforeunload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // KHÔNG xóa tab khỏi danh sách ở đây vì unmount có thể do navigation
    }
  }, [])

  return null
}
