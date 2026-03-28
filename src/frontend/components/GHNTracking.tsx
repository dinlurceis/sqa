'use client'

import { useEffect, useState } from 'react'
import { FiTruck, FiPackage, FiMapPin, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { orderApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface GHNTrackingProps {
  orderId: number
  ghnOrderCode?: string
}

export default function GHNTracking({ orderId, ghnOrderCode }: GHNTrackingProps) {
  const [loading, setLoading] = useState(false)
  const [trackingData, setTrackingData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ghnOrderCode) {
      loadTrackingInfo()
    }
  }, [orderId, ghnOrderCode])

  const loadTrackingInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🚚 ===== LOADING GHN TRACKING =====')
      console.log('Order ID:', orderId)
      console.log('GHN Order Code:', ghnOrderCode)
      
      const response = await orderApi.getShippingStatus(orderId)
      
      console.log('📡 GHN Tracking API Response:', response)
      
      if (response.success && response.data) {
        const trackingData = response.data
        setTrackingData(trackingData)
        
        console.log('✅ ===== GHN TRACKING DATA =====')
        console.log('Order Code:', trackingData.orderCode)
        console.log('Status:', trackingData.status)
        console.log('Status Text:', trackingData.statusText)
        console.log('Current Status:', trackingData.currentStatus)
        console.log('Current Warehouse:', trackingData.currentWarehouse)
        console.log('Expected Delivery Time:', trackingData.expectedDeliveryTime)
        console.log('Updated Date:', trackingData.updatedDate)
        console.log('COD Amount:', trackingData.codAmount)
        console.log('Shipping Fee:', trackingData.shippingFee)
        console.log('Note:', trackingData.note)
        console.log('Logs:', trackingData.logs)
        console.log('================================')
      } else {
        console.warn('⚠️ GHN Tracking failed:', response.message)
        setError(response.message || 'Không thể tải thông tin vận chuyển')
      }
    } catch (err: any) {
      console.error('❌ Error loading GHN tracking:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin vận chuyển')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getStatusIcon = (status: string) => {
    if (status?.includes('delivered')) return <FiCheckCircle className="text-green-600" size={24} />
    if (status?.includes('delivering')) return <FiTruck className="text-blue-600" size={24} />
    if (status?.includes('picked')) return <FiPackage className="text-purple-600" size={24} />
    if (status?.includes('fail') || status?.includes('cancel')) return <FiAlertCircle className="text-red-600" size={24} />
    return <FiMapPin className="text-gray-600" size={24} />
  }

  // Nếu không có mã GHN, không hiển thị
  if (!ghnOrderCode) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <FiTruck className="mr-2" />
          Theo dõi vận chuyển GHN
        </h2>
        <button
          onClick={loadTrackingInfo}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {loading ? 'Đang tải...' : ' Làm mới'}
        </button>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Mã vận đơn GHN</p>
        <p className="font-mono font-bold text-gray-900">{ghnOrderCode}</p>
      </div>

      {loading && !trackingData && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Đang tải thông tin vận chuyển...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {trackingData && !error && (
        <>
          {/* Current Status */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="mr-3 mt-1">
                {getStatusIcon(trackingData.status)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">{trackingData.statusText || trackingData.currentStatus}</p>
                {trackingData.currentWarehouse && (
                  <p className="text-sm text-gray-600 mt-1">
                     {trackingData.currentWarehouse}
                  </p>
                )}
                {trackingData.expectedDeliveryTime && (
                  <p className="text-sm text-gray-600 mt-1">
                    Dự kiến giao: {formatDate(trackingData.expectedDeliveryTime)}
                  </p>
                )}
                {trackingData.updatedDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Cập nhật lúc: {formatDate(trackingData.updatedDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          {(trackingData.codAmount || trackingData.shippingFee) && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              {trackingData.codAmount > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tiền thu hộ (COD)</p>
                  <p className="font-bold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trackingData.codAmount)}
                  </p>
                </div>
              )}
              {trackingData.shippingFee && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Phí vận chuyển</p>
                  <p className="font-bold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trackingData.shippingFee)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tracking History */}
          {trackingData.logs && trackingData.logs.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <FiClock className="mr-2" />
                Lịch sử di chuyển
              </h3>
              <div className="space-y-3">
                {trackingData.logs.map((log: any, index: number) => (
                  <div key={index} className="flex items-start border-l-2 border-gray-300 pl-4 pb-3 last:pb-0">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-blue-600 rounded-full -ml-[25px] mr-3"></span>
                        <p className="font-medium text-gray-900">{log.statusText}</p>
                      </div>
                      {log.location && (
                        <p className="text-sm text-gray-600 ml-5 mt-1">📍 {log.location}</p>
                      )}
                      {log.time && (
                        <p className="text-xs text-gray-500 ml-5 mt-1">{formatDate(log.time)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trackingData.note && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-bold">Ghi chú:</span> {trackingData.note}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
