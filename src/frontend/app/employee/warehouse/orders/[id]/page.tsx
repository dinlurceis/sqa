'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiPackage, FiUser, FiMapPin, FiPhone, FiCalendar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

interface OrderItem {
  itemId: number
  productId: number
  productName: string
  productSku: string
  quantity: number
  price: number
  reserved: boolean
  exported: boolean
}

interface OrderDetail {
  orderId: number
  orderCode: string
  status: string
  customerName: string
  customerPhone: string
  customerEmail: string
  shippingAddress: string
  province: string
  district: string
  ward: string
  address: string
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  confirmedAt: string
  note?: string
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { employee } = useAuthStore()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const canExport = hasPermission(employee?.position as Position, 'warehouse.export.create')
  const orderId = params.id as string

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportData, setExportData] = useState<{[key: string]: string[]}>({}) // {sku: [serial1, serial2]}
  const [currentSku, setCurrentSku] = useState<string>('')
  const [serialInput, setSerialInput] = useState('')

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail()
    }
  }, [orderId])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch(`http://localhost:8080/api/inventory/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()
      
      if (result.success) {
        setOrder(result.data)
      } else {
        toast.error(result.message || 'Không thể tải thông tin đơn hàng')
        router.push('/employee/warehouse/orders')
      }
    } catch (err) {
      console.error('Error fetching order:', err)
      toast.error('Lỗi kết nối server')
      router.push('/employee/warehouse/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleExportOrder = async () => {
    if (!canExport) {
      toast.error('Bạn không có quyền xuất kho')
      return
    }

    if (!order) return

    console.log('🔍 Order items:', order.items)

    // Kiểm tra xem order items có SKU không
    const hasAllSKUs = order.items.every((item) => item.productSku)
    if (!hasAllSKUs) {
      toast.error('Không tìm thấy mã SKU của sản phẩm. Vui lòng liên hệ admin.')
      return
    }

    // Mở modal để quét serial
    setShowExportModal(true)
    
    // Khởi tạo exportData với các SKU cần xuất
    const initialData: {[key: string]: string[]} = {}
    order.items.forEach((item) => {
      initialData[item.productSku] = []
    })
    setExportData(initialData)
  }

  const handleAddSerial = (sku: string) => {
    if (!serialInput.trim()) {
      toast.error('Vui lòng nhập hoặc quét serial number')
      return
    }

    // Kiểm tra trùng
    if (exportData[sku]?.includes(serialInput.trim())) {
      toast.error('Serial này đã được thêm rồi!')
      setSerialInput('')
      return
    }

    // Thêm serial vào list
    setExportData(prev => ({
      ...prev,
      [sku]: [...(prev[sku] || []), serialInput.trim()]
    }))
    
    setSerialInput('')
    toast.success('Đã thêm serial: ' + serialInput.trim())
  }

  const handleRemoveSerial = (sku: string, serial: string) => {
    setExportData(prev => ({
      ...prev,
      [sku]: prev[sku].filter(s => s !== serial)
    }))
  }

  const handleSubmitExport = async () => {
    if (!order) return

    // Validate: Mỗi sản phẩm phải có đủ số lượng serial
    for (const item of order.items) {
      const sku = item.productSku
      const requiredQty = item.quantity
      const actualQty = exportData[sku]?.length || 0
      
      if (actualQty < requiredQty) {
        toast.error(`Sản phẩm ${sku} cần ${requiredQty} serial nhưng chỉ có ${actualQty}`)
        return
      }
    }

    try {
      setLoading(true)
      
      // Chuẩn bị dữ liệu theo format backend yêu cầu
      const requestData = {
        orderId: order.orderId,
        reason: `Xuất kho cho đơn hàng #${order.orderCode}`,
        items: order.items.map((item) => ({
          productSku: item.productSku,
          serialNumbers: exportData[item.productSku]
        }))
      }

      console.log('📦 Submitting export:', requestData)

      const response = await fetch('http://localhost:8080/api/inventory/export-for-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      console.log('📥 Response:', data)

      if (data.success) {
        toast.success('Xuất kho thành công!')
        setShowExportModal(false)
        setExportData({})
        fetchOrderDetail() // Reload order
      } else {
        toast.error(data.message || 'Xuất kho thất bại')
      }
    } catch (error: any) {
      console.error('❌ Export error:', error)
      toast.error('Lỗi khi xuất kho: ' + (error.message || 'Vui lòng thử lại'))
    } finally {
      setLoading(false)
    }
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

  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Không tìm thấy đơn hàng</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/employee/warehouse/orders"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Quay lại danh sách
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
            <p className="text-gray-600 mt-1">{order.orderCode}</p>
          </div>
          
          {canExport && order.status === 'CONFIRMED' && (
            <button
              onClick={handleExportOrder}
              disabled={exporting}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FiPackage />
              <span>{exporting ? 'Đang xử lý...' : 'Xuất kho'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
            <div className="flex items-center space-x-4">
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {order.status === 'CONFIRMED' ? 'Chờ xuất kho' : order.status}
              </span>
              <span className="text-sm text-gray-600">
                Xác nhận: {new Date(order.confirmedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sản phẩm ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.productName}</h3>
                    <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {item.reserved && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          ✓ Đã giữ hàng
                        </span>
                      )}
                      {item.exported && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          ✓ Đã xuất kho
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-blue-600">x{item.quantity}</p>
                    <p className="text-sm text-gray-600">{item.price.toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="text-gray-900">{order.subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="text-gray-900">{order.shippingFee.toLocaleString('vi-VN')} ₫</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="text-red-600">-{order.discount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Tổng cộng</span>
                  <span className="text-blue-600">{order.total.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          {order.note && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ghi chú</h2>
              <p className="text-gray-700">{order.note}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <FiUser className="text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Tên khách hàng</p>
                  <p className="font-medium text-gray-900">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiPhone className="text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-medium text-gray-900">{order.customerPhone}</p>
                </div>
              </div>
              {order.customerEmail && (
                <div className="flex items-start">
                  <FiCalendar className="text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{order.customerEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ giao hàng</h2>
            <div className="flex items-start">
              <FiMapPin className="text-gray-400 mt-1 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{order.shippingAddress}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {order.address}, {order.ward}, {order.district}, {order.province}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thanh toán</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phương thức</span>
                <span className="font-medium text-gray-900">
                  {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trạng thái</span>
                <span className={`font-medium ${
                  order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Quét Serial */}
      {showExportModal && order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Quét Serial Number - Đơn #{order.orderCode}</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Danh sách sản phẩm cần xuất */}
              <div className="space-y-6">
                {order.items.map((item, index: number) => {
                  const sku = item.productSku
                  const productName = item.productName
                  const requiredQty = item.quantity
                  const scannedQty = exportData[sku]?.length || 0
                  const isComplete = scannedQty >= requiredQty

                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{productName}</h3>
                          <p className="text-sm text-gray-600">SKU: {sku}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isComplete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {scannedQty}/{requiredQty} serial
                        </div>
                      </div>

                      {/* Input quét serial */}
                      {!isComplete && (
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={currentSku === sku ? serialInput : ''}
                            onChange={(e) => {
                              setCurrentSku(sku)
                              setSerialInput(e.target.value)
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                setCurrentSku(sku)
                                handleAddSerial(sku)
                              }
                            }}
                            placeholder="Quét hoặc nhập serial number..."
                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus={index === 0}
                          />
                          <button
                            onClick={() => {
                              setCurrentSku(sku)
                              handleAddSerial(sku)
                            }}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            Thêm
                          </button>
                        </div>
                      )}

                      {/* Danh sách serial đã quét */}
                      {exportData[sku]?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Serial đã quét:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {exportData[sku].map((serial, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                              >
                                <span className="font-mono text-sm">{serial}</span>
                                <button
                                  onClick={() => handleRemoveSerial(sku, serial)}
                                  className="text-red-500 hover:text-red-700 ml-2"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitExport}
                  disabled={loading || order.items.some((item) => {
                    return (exportData[item.productSku]?.length || 0) < item.quantity
                  })}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
