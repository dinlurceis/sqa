'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiCheckCircle, FiClock, FiCopy, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes
  const [checking, setChecking] = useState(false)
  
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    loadPaymentInfo()
    startPolling()

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [isAuthenticated, params.orderCode])

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
      const token = localStorage.getItem('token')
      
      // Get order info first
      const orderResponse = await fetch(`http://localhost:8080/api/orders/code/${params.orderCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const orderResult = await orderResponse.json()
      console.log('Order result:', orderResult)
      
      if (!orderResult.success || !orderResult.data) {
        toast.error('Không tìm thấy đơn hàng')
        router.push('/orders')
        return
      }
      
      const order = orderResult.data
      
      // Get payment info if exists
      if (order.paymentId) {
        const paymentResponse = await fetch(`http://localhost:8080/api/payment/${order.paymentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const paymentResult = await paymentResponse.json()
        console.log('Payment result:', paymentResult)
        
        if (paymentResult.success && paymentResult.data) {
          setPayment(paymentResult.data)
          
          // Calculate time left
          const expiredAt = new Date(paymentResult.data.expiredAt)
          const now = new Date()
          const secondsLeft = Math.floor((expiredAt.getTime() - now.getTime()) / 1000)
          setTimeLeft(Math.max(0, secondsLeft))
        }
      }
    } catch (error) {
      console.error('Error loading payment:', error)
      toast.error('Lỗi khi tải thông tin thanh toán')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    console.log('🚀 Starting polling - will check every 15 seconds (optimized)')
    let pollCount = 0
    const maxPolls = 40 // 40 * 15s = 10 minutes max
    
    // Poll every 15 seconds (reduced from 3s to save server resources)
    // Webhook is primary method, polling is just fallback
    pollingInterval.current = setInterval(async () => {
      pollCount++
      console.log(`⏰ Polling tick ${pollCount}/${maxPolls}`)
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        console.log('⏹️ Max polling attempts reached, stopping...')
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
        }
        return
      }
      
      await checkPaymentStatus()
    }, 15000) // Changed from 3000 to 15000 (15 seconds)
  }

  const checkPaymentStatus = async () => {
    if (checking || !payment) return

    setChecking(true)
    try {
      const response = await fetch(`http://localhost:8080/api/payment/${payment.paymentCode}/status`)
      const result = await response.json()
      
      console.log('Status check:', result)
      
      if (result.success && result.data) {
        if (result.data.status === 'SUCCESS') {
          handlePaymentSuccess()
        } else if (result.data.status === 'EXPIRED') {
          handleExpired()
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
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

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy thông tin thanh toán</p>
          <button
            onClick={() => router.push('/orders')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Về trang đơn hàng
          </button>
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
            <p className="text-gray-600">Mã đơn hàng: <span className="font-medium">{params.orderCode}</span></p>
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

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <img
                  src={payment.qrCodeUrl}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                <FiRefreshCw className={checking ? 'animate-spin' : ''} />
                <span className="text-sm">
                  {checking ? 'Đang kiểm tra...' : 'Tự động kiểm tra thanh toán'}
                </span>
              </div>
            </div>

            {/* Bank Info */}
            <div className="border-t pt-6">
              <h3 className="font-bold mb-4 text-center">Hoặc chuyển khoản thủ công</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Ngân hàng</div>
                    <div className="font-medium">{payment.bankCode} - ACB</div>
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(`/orders/${params.orderCode}`)}
              className="flex-1 text-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Xem đơn hàng
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Làm mới trang
            </button>
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
