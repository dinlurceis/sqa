'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { FiPackage, FiTruck, FiCheck, FiAlertCircle, FiSearch, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { hasPermission, type Position } from '@/lib/permissions'

interface OrderItem {
  productId: number
  productName: string
  quantity: number
  price: number
  subtotal: number
}

interface Order {
  orderId: number
  orderCode: string
  customerName: string
  customerPhone: string
  shippingAddress: string
  status: string
  total: number
  createdAt: string
  items: OrderItem[]
}

export default function EmployeeExportPage() {
  const router = useRouter()
  const { user, employee, isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [exporting, setExporting] = useState<number | null>(null)

  // Check permissions - all employees can VIEW, but only warehouse staff can EXPORT
  const canExport = hasPermission(employee?.position as Position, 'warehouse.export.create')

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập trang này')
      router.push('/')
      return
    }

    loadOrders()
  }, [isAuthenticated, user, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
      
      const response = await fetch('http://localhost:8080/api/orders?status=CONFIRMED', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success && result.data) {
        setOrders(result.data)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Lỗi khi tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (orderId: number) => {
    if (!canExport) {
      toast.error('Bạn không có quyền xuất kho')
      return
    }

    if (!confirm('Xác nhận xuất kho cho đơn hàng này?')) {
      return
    }

    try {
      setExporting(orderId)
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
      
      const response = await fetch(`http://localhost:8080/api/orders/${orderId}/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Xuất kho thành công!')
        loadOrders()
      } else {
        toast.error(result.message || 'Lỗi khi xuất kho')
      }
    } catch (error) {
      console.error('Error exporting order:', error)
      toast.error('Lỗi khi xuất kho')
    } finally {
      setExporting(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredOrders = orders.filter(order => 
    order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerPhone.includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FiTruck className="mr-3 text-blue-600" />
            Xuất kho bán hàng
          </h1>
          <p className="mt-2 text-gray-600">Quản lý xuất kho cho đơn hàng đã xác nhận</p>
        </div>

        {!canExport && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FiFileText className="text-blue-500 mt-0.5 mr-3" size={20} />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Quyền hạn của bạn</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Bạn chỉ có quyền xem danh sách đơn hàng, không thể thực hiện xuất kho.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn, tên khách hàng, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ xuất kho</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{orders.length}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <FiAlertCircle className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng giá trị</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatPrice(orders.reduce((sum, order) => sum + order.total, 0))}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiPackage className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiCheck className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiPackage size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Không tìm thấy đơn hàng' : 'Không có đơn hàng nào cần xuất kho'}
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Tất cả đơn hàng đã được xử lý'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.orderId} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{order.orderCode}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        Đã xác nhận
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Khách hàng:</span> {order.customerName}
                      </div>
                      <div>
                        <span className="font-medium">SĐT:</span> {order.customerPhone}
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium">Địa chỉ:</span> {order.shippingAddress}
                      </div>
                      <div>
                        <span className="font-medium">Ngày đặt:</span> {formatDate(order.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">Số lượng SP:</span> {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </div>
                    </div>
                  </div>

                  {/* Total & Action */}
                  <div className="flex flex-col items-end space-y-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tổng tiền</p>
                      <p className="text-2xl font-bold text-red-600">{formatPrice(order.total)}</p>
                    </div>
                    {canExport && (
                      <button
                        onClick={() => handleExport(order.orderId)}
                        disabled={exporting === order.orderId}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {exporting === order.orderId ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Đang xử lý...</span>
                          </>
                        ) : (
                          <>
                            <FiTruck />
                            <span>Xuất kho</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Sản phẩm:</p>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.productName} x {item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">{formatPrice(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
