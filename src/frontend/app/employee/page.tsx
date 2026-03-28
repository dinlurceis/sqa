'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FiPackage, 
  FiShoppingCart, 
  FiTrendingUp,
  FiClock,
  FiArrowRight,
  FiAlertTriangle,
  FiDollarSign,
  FiUsers
} from 'react-icons/fi'
import { useAuthStore } from '@/store/authStore'
import { POSITION_NAMES, type Position } from '@/lib/permissions'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalCustomers: number
  pendingOrders: number
  lowStockProducts: number
  overdueOrders: number
  overduePayables: number
}

interface RecentOrder {
  id: number
  orderCode: string
  totalAmount: number
  status: string
  createdAt: string
  customerName: string
}

export default function EmployeeDashboard() {
  const { user, employee } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    overdueOrders: 0,
    overduePayables: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    console.log('🔑 Token exists:', !!token)
    console.log('👤 User:', user)
    console.log('👔 Employee:', employee)
    
    if (!token) {
      console.warn('⚠️ No token found - user may need to login')
    }
    
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading dashboard data...')
      
      const statsResponse = await api.get('/dashboard/stats')
      console.log('📊 Stats response:', statsResponse)
      console.log('📊 Stats data:', statsResponse.data)
      
      // Backend trả về {success, message, data}, nên cần lấy data.data
      const statsData = statsResponse.data?.data || statsResponse.data
      if (statsData) {
        setStats(statsData)
      }

      const ordersResponse = await api.get('/dashboard/recent-orders?limit=5')
      console.log('📦 Orders response:', ordersResponse)
      console.log('📦 Orders data:', ordersResponse.data)
      console.log('📦 Orders data type:', typeof ordersResponse.data)
      console.log('📦 Is array?', Array.isArray(ordersResponse.data))
      
      // Backend trả về {success, message, data}, nên cần lấy data.data
      const ordersData = ordersResponse.data?.data || ordersResponse.data
      if (Array.isArray(ordersData)) {
        setRecentOrders(ordersData)
      } else {
        console.warn('⚠️ Orders data is not an array:', ordersData)
        setRecentOrders([])
      }
      
      console.log('✅ Dashboard data loaded successfully')
    } catch (error: any) {
      console.error('❌ Error loading dashboard data:', error)
      console.error('Error details:', error.response?.data)
      toast.error('Lỗi khi tải dữ liệu: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      READY_TO_SHIP: 'bg-purple-100 text-purple-800',
      SHIPPING: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING_PAYMENT: 'Chờ thanh toán',
      CONFIRMED: 'Đã xác nhận',
      READY_TO_SHIP: 'Sẵn sàng giao',
      SHIPPING: 'Đang giao',
      DELIVERED: 'Đã giao',
      CANCELLED: 'Đã hủy',
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chào mừng, {employee?.fullName || user?.email}
        </h1>
        <p className="text-gray-600">
          Vị trí: {employee?.position ? POSITION_NAMES[employee.position as Position] : 'Nhân viên'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="text-blue-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalOrders}</h3>
          <p className="text-gray-600 text-sm">Tổng đơn hàng</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-green-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatPrice(stats.totalRevenue)}
          </h3>
          <p className="text-gray-600 text-sm">Doanh thu</p>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiPackage className="text-purple-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalProducts}</h3>
          <p className="text-gray-600 text-sm">Sản phẩm</p>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-indigo-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalCustomers}</h3>
          <p className="text-gray-600 text-sm">Khách hàng</p>
        </div>
      </div>

      {/* Warning Alerts - Cảnh báo quan trọng */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Đơn hàng chờ xử lý */}
        <Link href="/employee/orders">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Đơn hàng chờ xử lý
                </h3>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-yellow-900">
                    {stats.pendingOrders}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Đơn hàng cần xác nhận và xử lý
                  </p>
                </div>
                <div className="mt-3">
                  <span className="text-sm text-yellow-800 hover:text-yellow-900 font-medium">
                    Xem chi tiết →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Đơn hàng quá hạn giao */}
        <Link href="/employee/orders">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Đơn hàng quá hạn giao
                </h3>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-red-900">
                    {stats.overdueOrders}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Đơn quá 4 ngày chưa giao xong
                  </p>
                </div>
                <div className="mt-3">
                  <span className="text-sm text-red-800 hover:text-red-900 font-medium">
                    Xem chi tiết →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Sản phẩm hết hàng */}
        <Link href="/employee/inventory">
          <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiPackage className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-orange-800">
                  Sản phẩm hết hàng
                </h3>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-orange-900">
                    {stats.lowStockProducts}
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Sản phẩm cần nhập thêm hàng
                  </p>
                </div>
                <div className="mt-3">
                  <span className="text-sm text-orange-800 hover:text-orange-900 font-medium">
                    Xem chi tiết →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
            <Link
              href="/employee/orders"
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Xem tất cả
              <FiArrowRight className="ml-1" size={16} />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!Array.isArray(recentOrders) || recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/employee/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {order.orderCode}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
