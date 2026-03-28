'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiUsers, FiSearch, FiFileText, FiChevronRight, FiX, FiPackage, FiPhone, FiMail, FiMapPin } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { customerApi } from '@/lib/api'
import { hasPermission, type Position } from '@/lib/permissions'

export default function EmployeeCustomersPage() {
  const router = useRouter()
  const { user, employee, isAuthenticated } = useAuthStore()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  const canEdit = hasPermission(employee?.position as Position, 'customers.edit')

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập')
      router.push('/')
      return
    }

    loadCustomers()
  }, [isAuthenticated, user, router])

  const loadCustomers = async () => {
    try {
      const response = await customerApi.getAll()
      if (response.success) {
        setCustomers(response.data || [])
      } else {
        toast.error(response.error || 'Lỗi khi tải khách hàng')
      }
    } catch (error: any) {
      console.error('Error loading customers:', error)
      toast.error(error.message || 'Lỗi khi tải khách hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer)
    setLoadingOrders(true)
    
    try {
      const response = await customerApi.getOrdersByCustomerId(customer.id)
      if (response.success) {
        setCustomerOrders(response.data || [])
      } else {
        toast.error('Không thể tải đơn hàng')
        setCustomerOrders([])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      setCustomerOrders([])
    } finally {
      setLoadingOrders(false)
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'PENDING_PAYMENT': { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
      'CONFIRMED': { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
      'PROCESSING': { label: 'Đang xử lý', color: 'bg-indigo-100 text-indigo-800' },
      'READY_TO_SHIP': { label: 'Sẵn sàng giao', color: 'bg-purple-100 text-purple-800' },
      'SHIPPING': { label: 'Đang giao', color: 'bg-orange-100 text-orange-800' },
      'DELIVERED': { label: 'Đã giao', color: 'bg-green-100 text-green-800' },
      'COMPLETED': { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      'CANCELLED': { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    }
    const s = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${s.color}`}>{s.label}</span>
  }

  const filteredCustomers = customers.filter(customer =>
    customer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Danh sách khách hàng</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng khách hàng</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiUsers className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FiUsers size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có khách hàng nào</h3>
            <p className="text-gray-600">Danh sách khách hàng sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {customer.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{customer.fullName || 'Chưa cập nhật'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{customer.email || '-'}</div>
                        <div className="text-sm text-gray-500">{customer.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {customer.address ? (
                            `${customer.address}${customer.ward ? `, ${customer.ward}` : ''}${customer.district ? `, ${customer.district}` : ''}${customer.province ? `, ${customer.province}` : ''}`
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                          {customer.orderCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleSelectCustomer(customer)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center"
                        >
                          Xem đơn hàng
                          <FiChevronRight className="ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Đơn hàng của khách hàng</h2>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <FiUsers className="mr-1" />
                      {selectedCustomer.fullName || 'Chưa cập nhật'}
                    </span>
                    {selectedCustomer.phone && (
                      <span className="flex items-center">
                        <FiPhone className="mr-1" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.email && (
                      <span className="flex items-center">
                        <FiMail className="mr-1" />
                        {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null)
                    setCustomerOrders([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingOrders ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Khách hàng chưa có đơn hàng nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">#{order.orderCode}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">{formatPrice(order.total)}</p>
                          <p className="text-xs text-gray-500">
                            {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận' : 'Chuyển khoản'}
                          </p>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="text-sm text-gray-600 mb-3">
                        {order.items?.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span className="truncate max-w-xs">{item.productName} x{item.quantity}</span>
                            <span>{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <p className="text-gray-400">... và {order.items.length - 2} sản phẩm khác</p>
                        )}
                      </div>

                      {/* Shipping Address */}
                      <div className="flex items-start text-sm text-gray-500 mb-3">
                        <FiMapPin className="mr-1 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{order.shippingAddress}</span>
                      </div>

                      {/* View Detail Button */}
                      <div className="flex justify-end">
                        <Link
                          href={`/employee/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                        >
                          Xem chi tiết
                          <FiChevronRight className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setSelectedCustomer(null)
                  setCustomerOrders([])
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
