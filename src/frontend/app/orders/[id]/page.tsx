'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiPackage, FiMapPin, FiCreditCard, FiClock, FiFileText, FiStar, FiCheckCircle, FiMessageCircle } from 'react-icons/fi'
import { orderApi, reviewApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import GHNTracking from '@/components/GHNTracking'
import ReviewForm from '@/components/product/ReviewForm'

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = typeof params?.id === 'string' ? params.id : ''
  const { isAuthenticated } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [reviewingProduct, setReviewingProduct] = useState<any>(null)
  const [reviewedProducts, setReviewedProducts] = useState<Set<number>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [showReviewPrompt, setShowReviewPrompt] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }
    
    if (!orderId) {
      toast.error('Không tìm thấy thông tin đơn hàng')
      router.push('/orders')
      return
    }
    
    loadOrderDetails()
  }, [orderId, isAuthenticated])

  const loadOrderDetails = async () => {
    try {
      // Check if orderId is numeric or a code
      const isNumeric = /^\d+$/.test(orderId)
      const response = isNumeric 
        ? await orderApi.getById(orderId)
        : await orderApi.getByCode(orderId)
      
      console.log('📦 ===== ORDER DETAIL RESPONSE =====')
      console.log('Full response:', response)
      
      if (response.success && response.data) {
        const orderData = response.data
        setOrder(orderData)
        
        // Log GHN information
        console.log('===== GHN SHIPPING INFO =====')
        console.log('GHN Order Code:', orderData.ghnOrderCode)
        console.log('GHN Shipping Status:', orderData.ghnShippingStatus)
        console.log('GHN Created At:', orderData.ghnCreatedAt)
        console.log('GHN Expected Delivery Time:', orderData.ghnExpectedDeliveryTime)
        console.log('================================')
        
        // Log all order data
        console.log('===== FULL ORDER DATA =====')
        console.log('Order Code:', orderData.orderCode)
        console.log('Status:', orderData.status)
        console.log('Payment Status:', orderData.paymentStatus)
        console.log('Payment Method:', orderData.paymentMethod)
        console.log('Customer:', orderData.customerName)
        console.log('Phone:', orderData.customerPhone)
        console.log('Address:', orderData.shippingAddress)
        console.log('Total:', orderData.total)
        console.log('Shipping Fee:', orderData.shippingFee)
        console.log('Created At:', orderData.createdAt)
        console.log('Confirmed At:', orderData.confirmedAt)
        console.log('Shipped At:', orderData.shippedAt)
        console.log('Delivered At:', orderData.deliveredAt)
        console.log('================================')
        
        // Check which products have been reviewed
        if ((orderData.status?.toUpperCase() === 'DELIVERED' || orderData.status?.toUpperCase() === 'COMPLETED') && orderData.items) {
          const reviewed = new Set<number>()
          for (const item of orderData.items) {
            try {
              const canReviewRes = await reviewApi.checkCanReview(orderData.orderId, item.productId)
              if (canReviewRes.success && canReviewRes.data && !canReviewRes.data.canReview) {
                reviewed.add(item.productId)
              }
            } catch (e) {
              // Ignore errors
            }
          }
          setReviewedProducts(reviewed)
        }
      } else {
        toast.error('Không thể tải thông tin đơn hàng')
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Lỗi khi tải thông tin đơn hàng')
      router.push('/orders')
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
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_PAYMENT':
        return 'Chờ thanh toán'
      case 'PENDING':
        return 'Chờ xác nhận'
      case 'CONFIRMED':
        return 'Đã xác nhận - Đang chuẩn bị hàng'
      case 'READY_TO_SHIP':
        return 'Đã chuẩn bị hàng - Đợi tài xế lấy'
      case 'SHIPPING':
        return 'Đang giao hàng'
      case 'DELIVERED':
        return 'Đã giao hàng - Chờ xác nhận'
      case 'COMPLETED':
        return 'Hoàn thành'
      case 'CANCELLED':
        return 'Đã hủy'
      case 'PROCESSING':
        return 'Đang xử lý'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_PAYMENT':
        return 'bg-orange-100 text-orange-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'READY_TO_SHIP':
        return 'bg-purple-100 text-purple-800 border-2 border-purple-400 font-bold'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPING':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Xác nhận đã nhận hàng
  const handleConfirmReceived = async () => {
    if (!confirm('Xác nhận bạn đã nhận được hàng?')) return
    
    try {
      setConfirming(true)
      const response = await orderApi.confirmReceived(order.orderId)
      if (response.success) {
        toast.success('Đã xác nhận nhận hàng thành công!')
        setShowReviewPrompt(true)
        loadOrderDetails() // Reload để cập nhật trạng thái
      } else {
        toast.error(response.message || 'Không thể xác nhận')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xác nhận nhận hàng')
    } finally {
      setConfirming(false)
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UNPAID':
        return 'Chưa thanh toán'
      case 'PAID':
        return 'Đã thanh toán'
      case 'REFUNDED':
        return 'Đã hoàn tiền'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/orders"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Quay lại danh sách đơn hàng
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Đơn hàng {order.orderCode}
              </h1>
              <p className="text-gray-600">
                Đặt ngày: {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col gap-2">
              <span className={`px-4 py-2 rounded-lg font-semibold text-center ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
              
              {/* Confirm Received Button - Show if order is DELIVERED */}
              {order.status?.toUpperCase() === 'DELIVERED' && (
                <button
                  onClick={handleConfirmReceived}
                  disabled={confirming}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-center hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <FiCheckCircle />
                  {confirming ? 'Đang xử lý...' : 'Xác nhận đã nhận hàng'}
                </button>
              )}
              
              {/* Continue Payment Button - Show if order is PENDING_PAYMENT and NOT cancelled */}
              {(order.status?.toUpperCase() === 'PENDING_PAYMENT' && order.status?.toUpperCase() !== 'CANCELLED' && (order.paymentStatus === 'UNPAID' || order.paymentStatus === 'PENDING')) && (
                <Link
                  href={`/payment/${order.orderCode}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
                >
                  💳 Tiếp tục thanh toán
                </Link>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Trạng thái thanh toán</p>
              <p className="font-medium text-gray-900">{getPaymentStatusText(order.paymentStatus)}</p>
            </div>
            {order.confirmedAt && (
              <div>
                <p className="text-sm text-gray-600">Xác nhận lúc</p>
                <p className="font-medium text-gray-900">{formatDate(order.confirmedAt)}</p>
              </div>
            )}
          </div>
          
          {/* Payment Warning - Only show if order is actually PENDING_PAYMENT (not cancelled) */}
          {(order.status?.toUpperCase() === 'PENDING_PAYMENT' && (order.paymentStatus === 'UNPAID' || order.paymentStatus === 'PENDING')) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-yellow-600 font-bold mr-2">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <p className="font-bold mb-1">Đơn hàng đang chờ thanh toán</p>
                  <p>Vui lòng hoàn tất thanh toán để đơn hàng được xử lý. Nhấn nút "Tiếp tục thanh toán" ở trên để thanh toán ngay.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Delivered Notice - Prompt to confirm */}
          {order.status?.toUpperCase() === 'DELIVERED' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-green-600 font-bold mr-2">📦</span>
                <div className="text-sm text-green-800">
                  <p className="font-bold mb-1">Đơn hàng đã được giao!</p>
                  <p>Nếu bạn đã nhận được hàng, vui lòng nhấn nút "Xác nhận đã nhận hàng" để hoàn tất đơn hàng và đánh giá sản phẩm.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Completed Notice */}
          {order.status?.toUpperCase() === 'COMPLETED' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="text-sm text-blue-800">
                  <p className="font-bold mb-1">Đơn hàng đã hoàn thành!</p>
                  <p>Cảm ơn bạn đã mua hàng. Đừng quên đánh giá sản phẩm để giúp người mua khác nhé!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FiPackage className="mr-2" />
            Sản phẩm
          </h2>

          <div className="space-y-4">
            {order.items && order.items.map((item: any, index: number) => (
              <div key={index} className="flex items-center space-x-4 pb-4 border-b last:border-b-0">
                <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  {item.productImage ? (
                    <img 
                      src={item.productImage} 
                      alt={item.productName} 
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPackage className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Link href={`/products/${item.productId}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {item.productName}
                  </Link>
                  <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                  
                  {/* Review Button - Show for DELIVERED and COMPLETED orders */}
                  {(order.status?.toUpperCase() === 'DELIVERED' || order.status?.toUpperCase() === 'COMPLETED') && (
                    <div className="mt-2">
                      {reviewedProducts.has(item.productId) ? (
                        <span className="inline-flex items-center text-sm text-green-600">
                          <FiStar className="mr-1 fill-current" size={14} />
                          Đã đánh giá
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewingProduct({
                            productId: item.productId,
                            productName: item.productName,
                            orderId: order.orderId,
                            orderCode: order.orderCode
                          })}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <FiStar className="mr-1" size={14} />
                          Đánh giá sản phẩm
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatPrice(item.subtotal || (item.price * item.quantity))}</p>
                  <p className="text-sm text-gray-600">{formatPrice(item.price)} x {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4 mt-4 border-t">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span>{formatPrice(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>{order.shippingFee ? formatPrice(order.shippingFee) : 'Miễn phí'}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>Tổng cộng</span>
              <span className="text-red-600">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FiMapPin className="mr-2" />
            Thông tin giao hàng
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Người nhận</p>
              <p className="font-medium text-gray-900">{order.customerName}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Số điện thoại</p>
              <p className="font-medium text-gray-900">{order.customerPhone}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{order.customerEmail}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Địa chỉ giao hàng</p>
              <p className="font-medium text-gray-900">{order.shippingAddress}</p>
            </div>
            
            {/* Shipper Info - Show if shipper is assigned (internal delivery) */}
            {order.shipperName && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800 font-semibold mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Thông tin tài xế giao hàng
                </p>
                <div className="space-y-1">
                  <p className="text-purple-900 font-medium">
                    Tên: {order.shipperName}
                  </p>
                  <p className="text-purple-900">
                    SĐT: <a href={`tel:${order.shipperPhone}`} className="font-medium hover:underline">{order.shipperPhone}</a>
                  </p>
                </div>
              </div>
            )}
            
            {/* GHN Expected Delivery Time */}
            {order.ghnExpectedDeliveryTime && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium flex items-center">
                  <FiClock className="mr-2" />
                  Thời gian giao hàng dự kiến
                </p>
                <p className="font-bold text-blue-900 mt-1">
                  {formatDate(order.ghnExpectedDeliveryTime)}
                </p>
              </div>
            )}
            
            {/* GHN Order Code */}
            {order.ghnOrderCode && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Mã vận đơn GHN</p>
                <p className="font-mono font-bold text-gray-900">{order.ghnOrderCode}</p>
                {order.ghnShippingStatus && (
                  <p className="text-sm text-gray-600 mt-1">
                    Trạng thái: <span className="font-medium">{order.ghnShippingStatus}</span>
                  </p>
                )}
              </div>
            )}
            
            {order.note && (
              <div>
                <p className="text-sm text-gray-600">Ghi chú</p>
                <p className="font-medium text-gray-900">{order.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* GHN Tracking */}
        {order.ghnOrderCode && (
          <GHNTracking orderId={order.orderId} ghnOrderCode={order.ghnOrderCode} />
        )}

        {/* Review Modal */}
        {reviewingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <ReviewForm
              productId={reviewingProduct.productId}
              productName={reviewingProduct.productName}
              orderId={reviewingProduct.orderId}
              orderCode={reviewingProduct.orderCode}
              onSuccess={() => {
                setReviewedProducts(prev => new Set([...prev, reviewingProduct.productId]))
              }}
              onClose={() => setReviewingProduct(null)}
            />
          </div>
        )}

        {/* Review Prompt Modal - Show after confirming received */}
        {showReviewPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Đơn hàng hoàn thành!</h3>
                <p className="text-gray-600 mb-6">
                  Cảm ơn bạn đã xác nhận nhận hàng. Hãy đánh giá sản phẩm để giúp người mua khác nhé!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReviewPrompt(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Để sau
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewPrompt(false)
                      // Mở form đánh giá sản phẩm đầu tiên
                      if (order.items && order.items.length > 0) {
                        const firstItem = order.items[0]
                        setReviewingProduct({
                          productId: firstItem.productId,
                          productName: firstItem.productName,
                          orderId: order.orderId,
                          orderCode: order.orderCode
                        })
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FiStar />
                    Đánh giá ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Nút tạo phiếu hỗ trợ */}
        <div className="text-center mt-8">
          <Link href={`/support/tickets?orderId=${order.orderId}&orderCode=${order.orderCode}`} className="btn-primary inline-flex items-center gap-2">
            <FiMessageCircle className="w-5 h-5" />
            Gửi yêu cầu hỗ trợ
          </Link>
        </div>

        {/* Order Timeline */}
        {(order.confirmedAt || order.shippedAt || order.deliveredAt || order.completedAt || order.cancelledAt) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FiClock className="mr-2" />
              Lịch sử đơn hàng
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4"></div>
                <div>
                  <p className="font-medium text-gray-900">Đơn hàng đã được tạo</p>
                  <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              
              {order.confirmedAt && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4"></div>
                  <div>
                    <p className="font-medium text-gray-900">Đơn hàng đã được xác nhận</p>
                    <p className="text-sm text-gray-600">{formatDate(order.confirmedAt)}</p>
                  </div>
                </div>
              )}
              
              {order.shippedAt && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-4"></div>
                  <div>
                    <p className="font-medium text-gray-900">Đơn hàng đang được giao</p>
                    <p className="text-sm text-gray-600">{formatDate(order.shippedAt)}</p>
                  </div>
                </div>
              )}
              
              {order.deliveredAt && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-4"></div>
                  <div>
                    <p className="font-medium text-gray-900">Đơn hàng đã được giao</p>
                    <p className="text-sm text-gray-600">{formatDate(order.deliveredAt)}</p>
                  </div>
                </div>
              )}
              
              {order.completedAt && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-4"></div>
                  <div>
                    <p className="font-medium text-gray-900">Khách hàng đã xác nhận nhận hàng</p>
                    <p className="text-sm text-gray-600">{formatDate(order.completedAt)}</p>
                  </div>
                </div>
              )}
              
              {order.cancelledAt && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-4"></div>
                  <div>
                    <p className="font-medium text-gray-900">Đơn hàng đã bị hủy</p>
                    <p className="text-sm text-gray-600">{formatDate(order.cancelledAt)}</p>
                    {order.cancelReason && (
                      <p className="text-sm text-gray-600 mt-1">Lý do: {order.cancelReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
