'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiCheckCircle, FiClock, FiCopy, FiRefreshCw, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { orderApi } from '@/lib/api'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  
  const [payment, setPayment] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes
  const [checking, setChecking] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check both Zustand state and localStorage token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    if (!isAuthenticated && !token) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    loadPaymentInfo()

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [isAuthenticated, params.orderCode])

  // Start polling only after payment is loaded
  useEffect(() => {
    if (payment && !pollingInterval.current) {
      console.log('✅ Payment loaded, starting polling for:', payment.paymentCode)
      startPolling()
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        pollingInterval.current = null
      }
    }
  }, [payment])

  useEffect(() => {
    // Countdown timer
    if (timeLeft <= 0) {
      handleExpired()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const loadPaymentInfo = async () => {
    try {
      const orderCode = params.orderCode as string
      console.log('🔄 Loading payment info for order:', orderCode)
      
      // Load order details first
      console.log('📡 Fetching order from:', `http://localhost:8080/api/orders/code/${orderCode}`)
      const orderResponse = await fetch(`http://localhost:8080/api/orders/code/${orderCode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      console.log('📥 Order response status:', orderResponse.status)
      
      if (!orderResponse.ok) {
        throw new Error('Không thể tải thông tin đơn hàng')
      }
      
      const orderData = await orderResponse.json()
      console.log('✅ Order data:', orderData)
      
      if (!orderData.success || !orderData.data) {
        throw new Error('Không tìm thấy đơn hàng')
      }
      
      setOrder(orderData.data)
      
      // Load payment info
      console.log('📡 Fetching payment for orderId:', orderData.data.orderId)
      const paymentResponse = await fetch(`http://localhost:8080/api/payment/order/${orderData.data.orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      console.log('📥 Payment response status:', paymentResponse.status)
      
      if (!paymentResponse.ok) {
        throw new Error('Không thể tải thông tin thanh toán')
      }
      
      const paymentData = await paymentResponse.json()
      console.log('✅ Payment data:', paymentData)
      
      if (paymentData.success && paymentData.data) {
        setPayment(paymentData.data)
        
        // Check if already paid
        if (paymentData.data.status === 'SUCCESS' || paymentData.data.status === 'PAID' || paymentData.data.status === 'COMPLETED') {
          console.log('✅ Payment already completed! Redirecting...')
          setTimeout(() => {
            router.push(`/orders/${orderCode}?success=true`)
          }, 1000)
          return
        }
        
        // Check if expired or cancelled
        if (paymentData.data.status === 'EXPIRED' || paymentData.data.status === 'CANCELLED') {
          console.log('❌ Payment expired or cancelled! Redirecting...')
          toast.error('Thanh toán đã hết hạn hoặc bị hủy')
          setTimeout(() => {
            router.push(`/orders/${orderCode}`)
          }, 1500)
          return
        }
        
        // Calculate time left based on expiredAt
        if (paymentData.data.expiredAt) {
          const expiredTime = new Date(paymentData.data.expiredAt).getTime()
          const now = Date.now()
          const secondsLeft = Math.max(0, Math.floor((expiredTime - now) / 1000))
          setTimeLeft(secondsLeft)
          
          // If already expired based on time
          if (secondsLeft <= 0) {
            console.log('⏰ Payment time expired! Redirecting...')
            toast.error('Thanh toán đã hết hạn')
            setTimeout(() => {
              router.push(`/orders/${orderCode}`)
            }, 1500)
            return
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading payment info:', error)
      toast.error(error.message || 'Lỗi khi tải thông tin thanh toán')
      router.push('/orders')
    } finally {
      console.log('✅ Loading complete, setting loading = false')
      setLoading(false)
    }
  }

  const startPolling = () => {
    console.log('🚀 Starting polling - will check every 15 seconds (optimized)')
    let pollCount = 0
    const maxPolls = 40 // 40 * 15s = 10 minutes max
    
    // Poll every 15 seconds (reduced from 5s to save server resources)
    // Webhook is primary method, polling is just fallback
    pollingInterval.current = setInterval(async () => {
      pollCount++
      console.log(`⏰ Polling tick ${pollCount}/${maxPolls} - checking payment status...`)
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        console.log('⏹️ Max polling attempts reached, stopping...')
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
        }
        return
      }
      
      await checkPaymentStatus()
    }, 15000) // Changed from 5000 to 15000 (15 seconds)
  }

  const checkPaymentStatus = async () => {
    console.log('🔎 checkPaymentStatus called - checking:', checking, 'payment:', payment?.paymentCode)
    if (checking || !payment) {
      console.log('⚠️ Skipping check - checking:', checking, 'payment exists:', !!payment)
      return
    }

    setChecking(true)
    try {
      // No auth needed for status endpoint (public)
      const response = await fetch(`http://localhost:8080/api/payment/${payment.paymentCode}/status`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Payment status check:', data)
        console.log('🔍 Current status:', data.data?.status)
        
        if (data.success && data.data) {
          setPayment(data.data)
          
          // Check if payment is completed
          if (data.data.status === 'SUCCESS' || data.data.status === 'PAID' || data.data.status === 'COMPLETED') {
            console.log('✅ Payment SUCCESS detected! Redirecting...')
            handlePaymentSuccess()
          } else if (data.data.status === 'EXPIRED' || data.data.status === 'CANCELLED') {
            // Payment expired or cancelled
            console.log('❌ Payment EXPIRED/CANCELLED detected! Redirecting...')
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current)
            }
            toast.error('Thanh toán đã hết hạn hoặc bị hủy')
            setTimeout(() => {
              router.push(`/orders/${params.orderCode}`)
            }, 1500)
          } else {
            console.log('⏳ Payment still pending:', data.data.status)
          }
        }
      } else {
        console.error('❌ Status check failed:', response.status)
      }
    } catch (error) {
      console.error('❌ Error checking payment status:', error)
    } finally {
      setChecking(false)
    }
  }

  const handlePaymentSuccess = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }

    toast.success('Thanh toán thành công!')
    
    // Redirect to success page
    setTimeout(() => {
      router.push(`/orders/${params.orderCode}?success=true`)
    }, 1500)
  }

  const handleExpired = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }

    toast.error('Hết thời gian thanh toán')
    router.push(`/orders/${params.orderCode}`)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép ${label}`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleCancelOrder = async () => {
    if (!order) return

    const confirmed = window.confirm(
      'Bạn có chắc muốn hủy đơn hàng này?\n\n' +
      'Đơn hàng sẽ bị hủy và không thể khôi phục.'
    )

    if (!confirmed) return

    setCancelling(true)
    try {
      // Stop polling
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }

      const response = await fetch(`http://localhost:8080/api/orders/${order.orderId}/cancel?reason=${encodeURIComponent('Khách hàng hủy trong quá trình thanh toán')}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      const data = await response.json()

      if (data.success) {
        // Đơn PENDING_PAYMENT sẽ bị xóa khỏi DB
        toast.success('Đã hủy đơn hàng!', {
          duration: 3000,
        })
        setTimeout(() => {
          router.push('/orders')
        }, 2000)
      } else {
        toast.error(data.message || 'Không thể hủy đơn hàng')
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      toast.error('Lỗi khi hủy đơn hàng')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  // Show cancelling overlay
  if (cancelling) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold text-gray-900">Đang hủy đơn hàng...</p>
          <p className="mt-2 text-gray-600">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Thanh toán đơn hàng</h1>
            <p className="text-gray-600">Mã đơn hàng: <span className="font-medium">{order.orderCode}</span></p>
          </div>

          {/* Timer */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <FiClock className={`${timeLeft < 60 ? 'text-red-500' : 'text-blue-500'}`} size={24} />
              <div>
                <div className="text-sm text-gray-600">Thời gian còn lại</div>
                <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-blue-600'}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
            {timeLeft < 60 && (
              <div className="mt-3 text-center text-sm text-red-600">
                ⚠️ Vui lòng thanh toán trước khi hết thời gian
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center mb-6">
              <div className="text-lg font-medium mb-2">Số tiền cần thanh toán</div>
              <div className="text-3xl font-bold text-red-600">
                {formatPrice(payment.amount)}
              </div>
            </div>

            {/* QR Code - Clean & Minimal */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {/* QR Container - Simple & Clean */}
                <div className="bg-white p-8 rounded-2xl shadow-xl border-4 border-blue-500">
                  <img
                    src={payment.qrCodeUrl}
                    alt="QR Code Thanh Toán"
                    className="w-80 h-80 object-contain"
                    loading="eager"
                  />
                </div>
                
                {/* Scan instruction */}
                {/* <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full text-base font-medium shadow-lg">
                    <span className="text-2xl">📱</span>
                    <span>Quét mã QR để thanh toán</span>
                  </div>
                </div> */}
              </div>
            </div>

            {/* <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                <FiRefreshCw className={checking ? 'animate-spin' : ''} />
                <span className="text-sm">
                  {checking ? 'Đang kiểm tra...' : 'Tự động kiểm tra thanh toán'}
                </span>
              </div>
            </div> */}

            {/* Bank Info */}
            <div className="border-t pt-6">
              <h3 className="font-bold mb-4 text-center">Chuyển khoản thủ công</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Ngân hàng</div>
                    <div className="font-medium">{payment.bankCode}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Số tài khoản</div>
                    <div className="font-medium">{payment.accountNumber}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(payment.accountNumber, 'số tài khoản')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <FiCopy size={20} />
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Chủ tài khoản</div>
                    <div className="font-medium">{payment.accountName}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Số tiền chuyển khoản</div>
                    <div className="font-medium">{payment.amount}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(payment.amount, 'số tiền chuyển khoản')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <FiCopy size={20} />
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <div className="text-sm text-gray-600">Nội dung chuyển khoản</div>
                    <div className="font-bold text-red-600">{payment.content}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(payment.content, 'nội dung')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <FiCopy size={20} />
                  </button>
                </div>
              </div>

              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <div className="flex items-start">
                  <span className="text-red-600 font-bold mr-2">⚠️</span>
                  <div className="text-sm text-red-800">
                    <div className="font-bold mb-1">Lưu ý quan trọng:</div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Nhập chính xác nội dung: <span className="font-bold">{payment.content}</span></li>
                      <li>Chuyển đúng số tiền: <span className="font-bold">{formatPrice(payment.amount)}</span></li>
                      <li>Hệ thống tự động xác nhận sau khi chuyển khoản thành công</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-bold mb-3">Hướng dẫn thanh toán</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Mở app ngân hàng của bạn</li>
              <li>Quét mã QR Code ở trên HOẶC chuyển khoản thủ công</li>
              <li>Kiểm tra thông tin và xác nhận thanh toán</li>
              <li>Chờ hệ thống xác nhận (tự động trong vài giây)</li>
              <li>Bạn sẽ được chuyển đến trang xác nhận đơn hàng</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/orders/${order.orderCode}`}
                className="flex-1 text-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Xem đơn hàng
              </Link>
              <button
                onClick={checkPaymentStatus}
                disabled={checking}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {checking ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán'}
              </button>
              
            </div>
            
            {/* Cancel Order Button */}
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium"
            >
              {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
            </button>
            
            <p className="text-center text-sm text-gray-500">
              Nếu bạn không muốn thanh toán, vui lòng nhấn "Hủy đơn hàng"
            </p>
          </div>

          {/* Support */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Cần hỗ trợ? Liên hệ: <a href="tel:1900xxxx" className="text-blue-500 hover:underline">1900 xxxx</a></p>
            <p>hoặc Zalo: <a href="https://zalo.me/0912345678" className="text-blue-500 hover:underline">0912 345 678</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}
