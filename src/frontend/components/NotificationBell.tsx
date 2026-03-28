'use client'

import { useState, useEffect, useRef } from 'react'
import { FiBell, FiX, FiClock, FiAlertCircle, FiPackage } from 'react-icons/fi'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'

interface Notification {
  id: number
  type: 'ORDER' | 'STOCK' | 'OVERDUE' | 'PAYABLE'
  title: string
  message: string
  link?: string
  createdAt: string
  read: boolean
}

interface NotificationBellProps {
  floating?: boolean
}

export default function NotificationBell({ floating = false }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async () => {
    try {
      // For now, create mock notifications based on dashboard stats
      const statsResponse = await api.get('/dashboard/stats')
      const stats = statsResponse.data
      
      const mockNotifications: Notification[] = []
      
      // Add notification for pending orders
      if (stats.pendingOrders > 0) {
        mockNotifications.push({
          id: 1,
          type: 'ORDER',
          title: 'Đơn hàng chờ xử lý',
          message: `Có ${stats.pendingOrders} đơn hàng đang chờ xử lý`,
          link: '/orders',
          createdAt: new Date().toISOString(),
          read: false
        })
      }
      
      // Add notification for overdue orders
      if (stats.overdueOrders > 0) {
        mockNotifications.push({
          id: 2,
          type: 'OVERDUE',
          title: 'Đơn hàng quá hạn',
          message: `Có ${stats.overdueOrders} đơn hàng quá hạn giao`,
          link: '/orders',
          createdAt: new Date().toISOString(),
          read: false
        })
      }
      
      // Add notification for low stock
      if (stats.lowStockProducts > 0) {
        mockNotifications.push({
          id: 3,
          type: 'STOCK',
          title: 'Sản phẩm hết hàng',
          message: `Có ${stats.lowStockProducts} sản phẩm cần nhập thêm`,
          link: '/inventory',
          createdAt: new Date().toISOString(),
          read: false
        })
      }
      
      // Add notification for overdue payables
      if (stats.overduePayables > 0) {
        mockNotifications.push({
          id: 4,
          type: 'PAYABLE',
          title: 'Công nợ đến hạn',
          message: `Có ${stats.overduePayables} công nợ cần thanh toán`,
          link: '/accounting/payables',
          createdAt: new Date().toISOString(),
          read: false
        })
      }
      
      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <FiClock className="text-yellow-500" size={20} />
      case 'OVERDUE':
        return <FiAlertCircle className="text-red-500" size={20} />
      case 'STOCK':
        return <FiPackage className="text-orange-500" size={20} />
      case 'PAYABLE':
        return <FiAlertCircle className="text-blue-500" size={20} />
      default:
        return <FiBell className="text-gray-500" size={20} />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      // Determine if admin or employee route
      const currentPath = window.location.pathname
      const prefix = currentPath.startsWith('/admin') ? '/admin' : '/employee'
      router.push(prefix + notification.link)
    }
    setIsOpen(false)
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} ngày trước`
  }

  if (floating) {
    return (
      <div className="fixed top-6 right-6 z-50" ref={dropdownRef}>
        {/* Floating Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200"
        >
          <FiBell size={24} className="text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiBell size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>Không có thông báo mới</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Xem tất cả thông báo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Original inline version (for sidebar)
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <FiBell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Đánh dấu đã đọc
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FiBell size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Không có thông báo mới</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
