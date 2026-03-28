'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  FiArrowLeft, FiPackage, FiUser, FiMapPin, FiPhone, 
  FiMail, FiCalendar, FiDollarSign, FiTruck, FiCheck,
  FiX, FiClock, FiAlertCircle, FiPrinter
} from 'react-icons/fi'
import { adminOrderApi } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

export default function EmployeeOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { employee } = useAuthStore()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [shippingStatus, setShippingStatus] = useState<any>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [processing, setProcessing] = useState(false)

  const canEdit = hasPermission(employee?.position as Position, 'orders.edit')
  const canConfirm = hasPermission(employee?.position as Position, 'orders.confirm')

  useEffect(() => {
    if (orderId) {
      loadOrderDetail()
    }
  }, [orderId])

  const loadOrderDetail = async () => {
    try {
      setLoading(true)
      const response = await adminOrderApi.getById(Number(orderId))
      
      if (response.success && response.data) {
        setOrder(response.data)
      } else {
        toast.error('Không tìm thấy đơn hàng')
        router.push('/employee/orders')
      }
    } catch (error: any) {
      console.error('Error loading order:', error)
      toast.error(error.message || 'Lỗi khi tải thông tin đơn hàng')
      router.push('/employee/orders')
    } finally {
      setLoading(false)
    }
  }

  const loadShippingStatus = async () => {
    try {
      setLoadingShipping(true)
      const response = await adminOrderApi.getShippingStatus(Number(orderId))
      
      if (response.success && response.data) {
        setShippingStatus(response.data)
      }
    } catch (error: any) {
      console.error('Error loading shipping status:', error)
    } finally {
      setLoadingShipping(false)
    }
  }

  const handleConfirmOrder = async () => {
    if (!canConfirm) {
      toast.error('Bạn không có quyền xác nhận đơn hàng')
      return
    }

    if (!confirm('Xác nhận đơn hàng này?')) return
    
    try {
      setProcessing(true)
      const response = await adminOrderApi.confirmOrder(Number(orderId))
      
      if (response.success) {
        toast.success('Đã xác nhận đơn hàng')
        loadOrderDetail()
      } else {
        toast.error(response.message || 'Không thể xác nhận đơn hàng')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xác nhận đơn hàng')
    } finally {
      setProcessing(false)
    }
  }

  const handleMarkAsDelivered = async () => {
    if (!canEdit) {
      toast.error('Bạn không có quyền cập nhật trạng thái đơn hàng')
      return
    }

    if (!confirm('Xác nhận đã giao hàng thành công?')) return
    
    try {
      setProcessing(true)
      const response = await adminOrderApi.markAsDelivered(Number(orderId))
      
      if (response.success) {
        toast.success('Đã xác nhận giao hàng thành công')
        loadOrderDetail()
      } else {
        toast.error(response.message || 'Không thể cập nhật trạng thái')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật trạng thái')
    } finally {
      setProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_PAYMENT': return 'Chờ thanh toán'
      case 'PENDING': return 'Chờ xác nhận'
      case 'CONFIRMED': return 'Đã xác nhận'
      case 'READY_TO_SHIP': return 'Sẵn sàng giao'
      case 'SHIPPING': return 'Đang giao'
      case 'DELIVERED': return 'Đã giao'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_PAYMENT': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'READY_TO_SHIP': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'SHIPPING': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_PAYMENT': return <FiClock className="text-orange-600" size={24} />
      case 'PENDING': return <FiClock className="text-yellow-600" size={24} />
      case 'CONFIRMED': return <FiCheck className="text-blue-600" size={24} />
      case 'READY_TO_SHIP': return <FiPackage className="text-indigo-600" size={24} />
      case 'SHIPPING': return <FiTruck className="text-purple-600" size={24} />
      case 'DELIVERED': return <FiCheck className="text-green-600" size={24} />
      case 'CANCELLED': return <FiX className="text-red-600" size={24} />
      default: return <FiPackage className="text-gray-600" size={24} />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Không tìm thấy đơn hàng
        </h3>
        <Link
          href="/employee/orders"
          className="text-blue-600 hover:text-blue-700"
        >
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chi tiết đơn hàng
            </h1>
            <p className="text-gray-600 mt-1">Mã đơn: {order.orderCode}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FiPrinter size={18} />
            <span>In đơn</span>
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className={`rounded-lg border-2 p-6 ${getStatusColor(order.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon(order.status)}
            <div>
              <p className="text-sm font-medium opacity-75">Trạng thái đơn hàng</p>
              <p className="text-2xl font-bold mt-1">{getStatusText(order.status)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {order.status === 'PENDING' && canConfirm && (
              <button
                onClick={handleConfirmOrder}
                disabled={processing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận đơn'}
              </button>
            )}
            {order.status === 'SHIPPING' && canEdit && (
              <button
                onClick={handleMarkAsDelivered}
                disabled={processing}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {processing ? 'Đang xử lý...' : 'Đã giao hàng'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2" />
              Thông tin khách hàng
            </h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <FiUser className="text-gray-400 mt-1 mr-3" size={18} />
                <div>
                  <p className="text-sm text-gray-600">Họ tên</p>
                  <p className="font-medium text-gray-900">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiPhone className="text-gray-400 mt-1 mr-3" size={18} />
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-medium text-gray-900">{order.customerPhone}</p>
                </div>
              </div>
              {order.customerEmail && (
                <div className="flex items-start">
                  <FiMail className="text-gray-400 mt-1 mr-3" size={18} />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{order.customerEmail}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start">
                <FiMapPin className="text-gray-400 mt-1 mr-3" size={18} />
                <div>
                  <p className="text-sm text-gray-600">Địa chỉ giao hàng</p>
                  <p className="font-medium text-gray-900">{order.shippingAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FiPackage className="mr-2" />
              Sản phẩm ({order.items?.length || 0})
            </h2>
            <div className="space-y-4">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.productImage ? (
                      <img 
                        src={item.productImage} 
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiPackage className="text-gray-400" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.productName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Số lượng: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatPrice(item.price)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Tổng: {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Status */}
          {order.ghnOrderCode && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiTruck className="mr-2" />
                  Thông tin vận chuyển
                </h2>
                <button
                  onClick={loadShippingStatus}
                  disabled={loadingShipping}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {loadingShipping ? 'Đang tải...' : 'Cập nhật'}
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Mã vận đơn GHN</p>
                  <p className="font-medium text-gray-900">{order.ghnOrderCode}</p>
                </div>
                {shippingStatus && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Trạng thái vận chuyển</p>
                      <p className="font-medium text-gray-900">{shippingStatus.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cập nhật lúc</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(shippingStatus.updatedAt)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FiDollarSign className="mr-2" />
              Tổng quan đơn hàng
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tạm tính</span>
                <span className="font-medium">{formatPrice(order.subtotal || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span className="font-medium">{formatPrice(order.shippingFee || 0)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span className="font-medium">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FiCalendar className="mr-2" />
              Lịch sử đơn hàng
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Đơn hàng được tạo</p>
                  <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              {order.confirmedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Đã xác nhận</p>
                    <p className="text-sm text-gray-600">{formatDate(order.confirmedAt)}</p>
                  </div>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Đang giao hàng</p>
                    <p className="text-sm text-gray-600">{formatDate(order.shippedAt)}</p>
                  </div>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Đã giao hàng</p>
                    <p className="text-sm text-gray-600">{formatDate(order.deliveredAt)}</p>
                  </div>
                </div>
              )}
              {order.cancelledAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Đã hủy</p>
                    <p className="text-sm text-gray-600">{formatDate(order.cancelledAt)}</p>
                    {order.cancelReason && (
                      <p className="text-sm text-red-600 mt-1">
                        Lý do: {order.cancelReason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Thanh toán
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Phương thức</p>
                <p className="font-medium text-gray-900">
                  {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trạng thái thanh toán</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  order.paymentStatus === 'PAID' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
