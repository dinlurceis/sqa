'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiCheckCircle, FiClock, FiHome, FiFileText } from 'react-icons/fi'
import { orderApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (!orderId) {
      toast.error('Không tìm thấy thông tin đơn hàng')
      router.push('/')
      return
    }
    loadOrderDetails()
  }, [orderId])

  const loadOrderDetails = async () => {
    try {
      const response = await orderApi.getById(orderId!)
      console.log('Order details response:', response)
      
      if (response.success && response.data) {
        setOrder(response.data)
      } else {
        toast.error('Không thể tải thông tin đơn hàng')
        setTimeout(() => router.push('/orders'), 2000)
      }
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Lỗi khi tải thông tin đơn hàng')
      setTimeout(() => router.push('/orders'), 2000)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          
          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600 mb-8">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
          </p>
          
          {/* Order Info */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FiFileText className="text-blue-600" size={24} />
              <div className="text-left">
                <p className="text-sm text-gray-600">Mã đơn hàng</p>
                <p className="text-2xl font-bold text-blue-600">{order.orderCode}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              <FiClock className="text-gray-600" size={20} />
              <div className="text-left">
                <p className="text-sm text-gray-600">Ngày đặt hàng</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/orders/${order.orderId}`)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center"
            >
              <FiFileText className="mr-2" />
              Xem chi tiết đơn hàng
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-white text-gray-700 py-3 px-6 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center"
            >
              <FiHome className="mr-2" />
              Tiếp tục mua sắm
            </button>
          </div>

          {/* Note */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800">
              💡 <strong>Lưu ý:</strong> Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi". 
              Nếu có thắc mắc, vui lòng liên hệ với chúng tôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
