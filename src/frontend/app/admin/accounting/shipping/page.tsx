'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiTruck, FiSearch } from 'react-icons/fi'

export default function ShippingReconciliationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [reconciliationData, setReconciliationData] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    const authStorage = localStorage.getItem('auth-storage')
    if (!authStorage) {
      router.push('/login')
      return
    }

    const authData = JSON.parse(authStorage)
    const userData = authData.state?.user
    
    if (!userData) {
      router.push('/login')
      return
    }

    const isAdmin = userData.role === 'ADMIN'
    const isAccountant = userData.position === 'ACCOUNTANT'
    
    if (!isAdmin && !isAccountant) {
      toast.error('Bạn không có quyền truy cập')
      router.push('/')
      return
    }

    // Set default dates (last 30 days)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    })
  }, [router])

  const loadShippingReconciliation = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Vui lòng chọn khoảng thời gian')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:8080/api/accounting/shipping-reconciliation?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const result = await response.json()
      if (result.success) {
        setReconciliationData(result.data)
        toast.success('Tải dữ liệu đối soát thành công')
      } else {
        toast.error(result.message || 'Lỗi khi tải dữ liệu')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tải dữ liệu đối soát vận chuyển')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Đối soát chi phí vận chuyển</h1>
          <p className="mt-2 text-gray-600">So sánh phí vận chuyển thu từ khách hàng và chi phí thực tế</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadShippingReconciliation}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                <FiSearch className="mr-2" />
                {loading ? 'Đang tải...' : 'Tải dữ liệu'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {reconciliationData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {reconciliationData.totalOrders}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FiTruck className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Phí VC thu khách</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {reconciliationData.totalShippingFeeCollected?.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <FiTruck className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chi phí VC thực tế</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      {reconciliationData.totalShippingCostPaid?.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <FiTruck className="text-red-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Lợi nhuận VC</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                      {reconciliationData.shippingProfit?.toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-sm text-gray-500">
                      Tỷ suất: {reconciliationData.profitMargin?.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <FiTruck className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Details Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Chi tiết đối soát vận chuyển</h3>
                <p className="text-sm text-gray-600">{reconciliationData.period}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ giao</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Phí VC thu</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Chi phí thực tế</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lợi nhuận</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reconciliationData.details?.map((detail: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {detail.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(detail.orderDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {detail.shippingAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                          {detail.shippingFeeCollected?.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                          {detail.actualShippingCost?.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          <span className={detail.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {detail.profit?.toLocaleString('vi-VN')} ₫
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Lưu ý:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Chi phí vận chuyển thực tế được tính = 80% phí thu từ khách hàng</li>
            <li>• Lợi nhuận vận chuyển = Phí thu từ khách - Chi phí thực tế</li>
            <li>• Tỷ suất lợi nhuận = (Lợi nhuận / Phí thu) × 100%</li>
            <li>• Dữ liệu chỉ bao gồm các đơn hàng đã thanh toán</li>
          </ul>
        </div>
      </div>
    </div>
  )
}