'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiTruck, FiPackage, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

interface OrderItem {
  itemId: number
  productId: number
  productName: string
  productSku: string
  quantity: number
  reserved: boolean
  exported: boolean
  serialNumber?: string
}

interface Order {
  orderId: number
  orderCode: string
  status: string
  customerName: string
  customerPhone: string
  shippingAddress: string
  items: OrderItem[]
  total: number
  createdAt: string
  confirmedAt: string
}

export default function WarehouseOrdersPage() {
  const router = useRouter()
  const { employee } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canExport = hasPermission(employee?.position as Position, 'warehouse.export.create')

  useEffect(() => {
    if (employee) {
      fetchPendingOrders()
    }
    
    return () => {
      setOrders([])
    }
  }, [employee])

  const fetchPendingOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('http://localhost:8080/api/inventory/orders/pending-export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()
      
      if (result.success) {
        setOrders(result.data || [])
      } else {
        setError(result.message || 'Không thể tải danh sách đơn hàng')
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (orderId: number) => {
    router.push(`/employee/warehouse/orders/${orderId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đơn hàng cần xuất kho</h1>
            <p className="text-gray-600 mt-1">
              Danh sách đơn hàng đã xác nhận, cần chuẩn bị hàng và xuất kho
            </p>
          </div>
          <button
            onClick={fetchPendingOrders}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FiRefreshCw />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {!canExport && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiPackage className="text-yellow-500 mt-0.5 mr-3" size={20} />
            <div>
              <h3 className="text-sm font-medium text-yellow-900">Quyền hạn của bạn</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Bạn có thể xem danh sách đơn hàng nhưng không thể xuất kho.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiTruck size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Không có đơn hàng nào cần xuất kho
          </h3>
          <p className="text-gray-600">
            Các đơn hàng đã xác nhận sẽ hiển thị ở đây
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.orderId} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-600">
                      {order.orderCode}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Xác nhận: {new Date(order.confirmedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Chờ xuất kho
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      {order.total.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Khách hàng</p>
                      <p className="font-medium">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Số điện thoại</p>
                      <p className="font-medium">{order.customerPhone}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Địa chỉ giao hàng</p>
                    <p className="font-medium">{order.shippingAddress}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Sản phẩm cần xuất ({order.items.length})
                  </p>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.itemId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-lg font-bold text-blue-600">x{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          {item.reserved ? (
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              ✓ Đã giữ hàng
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              Chưa giữ
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => handleViewDetail(order.orderId)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {canExport ? 'Xem chi tiết & Xuất kho' : 'Xem chi tiết'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <p className="text-lg font-semibold text-blue-900">
              Tổng cộng: {orders.length} đơn hàng cần xuất kho
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
