'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { 
  FiUsers, FiShoppingBag, FiPackage, FiAlertCircle,
  FiDollarSign, FiTrendingUp, FiClock, FiAlertTriangle
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import StatsCard from '@/components/admin/StatsCard'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProfit: number
  profitMargin: number
  totalProducts: number
  totalCustomers: number
  pendingOrders: number
  lowStockProducts: number
  overdueOrders: number
  overduePayables: number
  ordersChangePercent: number
  revenueChangePercent: number
  profitChangePercent: number
  productsChangePercent: number
  customersChangePercent: number
}

interface RecentOrder {
  id: number
  orderCode: string
  totalAmount: number
  status: string
  createdAt: string
  customerName: string
  customerEmail: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    overdueOrders: 0,
    overduePayables: 0,
    ordersChangePercent: 0,
    revenueChangePercent: 0,
    profitChangePercent: 0,
    productsChangePercent: 0,
    customersChangePercent: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    if (user?.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập trang này')
      router.push('/')
      return
    }

    loadDashboardData()
  }, [mounted, isAuthenticated, user, router])

  const loadDashboardData = async () => {
    try {
      const statsResponse = await api.get('/dashboard/stats')
      setStats(statsResponse.data.data || statsResponse.data)

      const ordersResponse = await api.get('/dashboard/recent-orders?limit=5')
      setRecentOrders(ordersResponse.data.data || ordersResponse.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Lỗi khi tải dữ liệu')
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

  if (!mounted || loading) {
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
        <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="text-gray-600 mt-2">Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* Stats Grid - 4 cards màu sắc */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="TỔNG KHÁCH HÀNG"
          value={stats.totalCustomers || 0}
          subtitle={`${stats.totalCustomers || 0} khách hàng đăng ký`}
          icon={<FiUsers size={24} />}
          color="green"
          trend={{
            value: stats.customersChangePercent || 0,
            isPositive: (stats.customersChangePercent || 0) >= 0
          }}
        />

        <StatsCard
          title="TỔNG ĐƠN HÀNG"
          value={stats.totalOrders || 0}
          subtitle={`${stats.totalOrders || 0} đơn hàng trong tháng`}
          icon={<FiShoppingBag size={24} />}
          color="orange"
          trend={{
            value: stats.ordersChangePercent || 0,
            isPositive: (stats.ordersChangePercent || 0) >= 0
          }}
        />

        <StatsCard
          title="SẢN PHẨM HẾT HÀNG"
          value={stats.lowStockProducts || 0}
          subtitle="Sản phẩm cần nhập thêm"
          icon={<FiAlertCircle size={24} />}
          color="red"
        />

        <StatsCard
          title="TỔNG SẢN PHẨM"
          value={stats.totalProducts || 0}
          subtitle="Sản phẩm đang bán"
          icon={<FiPackage size={24} />}
          color="blue"
        />
      </div>

      {/* Warning Alerts - Cảnh báo quan trọng */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Đơn hàng chờ xử lý */}
        <div 
          onClick={() => router.push('/admin/orders')}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
        >
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
                  {stats.pendingOrders || 0}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Đơn hàng cần xác nhận và xử lý
                </p>
              </div>
              <div className="mt-3">
                <button className="text-sm text-yellow-800 hover:text-yellow-900 font-medium">
                  Xem chi tiết →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Đơn hàng quá hạn giao */}
        <div 
          onClick={() => router.push('/admin/orders')}
          className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
        >
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
                  {stats.overdueOrders || 0}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Đơn quá 4 ngày chưa giao xong
                </p>
              </div>
              <div className="mt-3">
                <button className="text-sm text-red-800 hover:text-red-900 font-medium">
                  Xem chi tiết →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Công nợ đến hạn */}
        <div 
          onClick={() => router.push('/admin/accounting/payables')}
          className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiDollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Công nợ đến hạn thanh toán
              </h3>
              <div className="mt-2">
                <p className="text-3xl font-bold text-orange-900">
                  {stats.overduePayables || 0}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Công nợ NCC chưa thanh toán
                </p>
              </div>
              <div className="mt-3">
                <button className="text-sm text-orange-800 hover:text-orange-900 font-medium">
                  Xem chi tiết →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Profit Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Doanh thu</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {formatPrice(stats.totalRevenue)}
              </h3>
              <p className="text-gray-500 text-xs mt-1">Tổng doanh thu trong tháng</p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg text-white">
              <FiDollarSign size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className={stats.revenueChangePercent >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {stats.revenueChangePercent >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueChangePercent)}%
            </span>
            <span className="text-gray-500 ml-2">so với tháng trước</span>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Lợi nhuận</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {stats.totalProfit > 0 ? formatPrice(stats.totalProfit) : '(Sẽ được tính sau)'}
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                Tỷ suất: {stats.profitMargin != null ? stats.profitMargin.toFixed(1) : '0.0'}%
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg text-white">
              <FiTrendingUp size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-500">
              {stats.totalProfit > 0 ? 'Lợi nhuận ròng sau chi phí' : 'Cần tracking serial numbers'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
              <p className="text-gray-600 text-sm mt-1">Danh sách đơn hàng mới nhất</p>
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Xem tất cả →
            </button>
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
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {order.orderCode}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
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
