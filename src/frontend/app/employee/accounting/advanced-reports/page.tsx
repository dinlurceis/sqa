'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiBarChart, FiTrendingUp, FiPieChart } from 'react-icons/fi'

export default function AdvancedReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('profit-loss')
  const [reportData, setReportData] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    groupBy: 'MONTHLY'
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

    // Set default dates (last 3 months)
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 3)

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      groupBy: 'MONTHLY'
    })
  }, [router])

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Vui lòng chọn khoảng thời gian')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/accounting/reports/${reportType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dateRange)
      })

      const result = await response.json()
      if (result.success) {
        setReportData(result.data)
        toast.success('Tạo báo cáo thành công')
      } else {
        toast.error(result.message || 'Lỗi khi tạo báo cáo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tạo báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const renderProfitLossReport = () => {
    if (!reportData) return null

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Báo cáo lãi lỗ</h3>
          <p className="text-sm text-gray-600">{reportData.period}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Doanh thu */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">DOANH THU</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Doanh thu bán hàng:</span>
                  <span className="font-medium">{reportData.salesRevenue?.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Doanh thu khác:</span>
                  <span className="font-medium">{reportData.otherRevenue?.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Tổng doanh thu:</span>
                  <span className="text-green-600">{reportData.totalRevenue?.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>

            {/* Chi phí */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">CHI PHÍ</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chi phí vận chuyển:</span>
                  <span className="font-medium text-red-600">{reportData.shippingCosts?.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chi phí thuế:</span>
                  <span className="font-medium text-red-600">{reportData.taxExpense?.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thanh toán NCC:</span>
                  <span className="font-medium text-red-600">{reportData.supplierPayments?.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ch phí khác:</span>
                  <span className="font-medium text-red-600">{reportData.otherExpense?.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Tổng chi phí:</span>
                  <span className="text-red-600">{reportData.totalExpense?.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lợi nhuận */}
          <div className="mt-8 border-t pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">LỢI NHUẬN & THUẾ</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Lợi nhuận gộp</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.grossProfit?.toLocaleString('vi-VN')} ₫</p>
                <p className="text-sm text-gray-500">Tỷ suất: {reportData.grossProfitMargin?.toFixed(2)}%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Lợi nhuận ròng</p>
                <p className="text-2xl font-bold text-green-600">{reportData.netProfit?.toLocaleString('vi-VN')} ₫</p>
                <p className="text-sm text-gray-500">Tỷ suất: {reportData.netProfitMargin?.toFixed(2)}%</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">VAT (10%)</p>
                <p className="text-xl font-bold text-orange-600">{reportData.vatAmount?.toLocaleString('vi-VN')} ₫</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Thuế TNDN (20%)</p>
                <p className="text-xl font-bold text-red-600">{(reportData.grossProfit * 0.2)?.toLocaleString('vi-VN')} ₫</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCashFlowReport = () => {
    if (!reportData) return null

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Báo cáo dòng tiền</h3>
          <p className="text-sm text-gray-600">{reportData.period}</p>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* Hoạt động kinh doanh */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-4">HOẠT ĐỘNG KINH DOANH</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiền thu từ khách hàng:</span>
                  <span className="font-medium text-green-600">+{reportData.operatingCashIn?.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiền chi hoạt động:</span>
                  <span className="font-medium text-red-600">-{reportData.operatingCashOut?.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Dòng tiền từ HĐKD:</span>
                  <span className={reportData.netOperatingCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {reportData.netOperatingCash?.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </div>

            {/* Hoạt động đầu tư */}
            <div className="bg-orange-50 p-6 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-4">HOẠT ĐỘNG ĐẦU TƯ</h4>
              <div className="flex justify-between font-bold">
                <span>Dòng tiền từ HĐĐT:</span>
                <span className="text-gray-600">{reportData.investingCashFlow?.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            {/* Hoạt động tài chính */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-4">HOẠT ĐỘNG TÀI CHÍNH</h4>
              <div className="flex justify-between font-bold">
                <span>Dòng tiền từ HĐTC:</span>
                <span className="text-gray-600">{reportData.financingCashFlow?.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            {/* Dòng tiền ròng */}
            <div className="bg-gray-100 p-6 rounded-lg">
              <div className="flex justify-between text-xl font-bold">
                <span>DÒNG TIỀN RÒNG:</span>
                <span className={reportData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {reportData.netCashFlow?.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderExpenseAnalysis = () => {
    if (!reportData) return null

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Phân tích chi phí</h3>
          <p className="text-sm text-gray-600">{reportData.period}</p>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Tổng chi phí</p>
              <p className="text-3xl font-bold text-red-600">{reportData.totalExpense?.toLocaleString('vi-VN')} ₫</p>
            </div>
          </div>

          <div className="space-y-4">
            {reportData.breakdown?.map((item: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{item.category}</span>
                  <span className="text-lg font-bold text-red-600">{item.amount?.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{item.percentage?.toFixed(2)}% tổng chi phí</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo nâng cao</h1>
          <p className="mt-2 text-gray-600">Phân tích chi tiết tài chính doanh nghiệp</p>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setReportType('profit-loss')}
              className={`p-4 rounded-lg border-2 transition-colors ${reportType === 'profit-loss'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <FiBarChart className="mx-auto mb-2" size={24} />
              <h3 className="font-medium">Báo cáo lãi lỗ</h3>
              <p className="text-sm text-gray-600">Doanh thu, chi phí, lợi nhuận</p>
            </button>

            <button
              onClick={() => setReportType('cash-flow')}
              className={`p-4 rounded-lg border-2 transition-colors ${reportType === 'cash-flow'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <FiTrendingUp className="mx-auto mb-2" size={24} />
              <h3 className="font-medium">Báo cáo dòng tiền</h3>
              <p className="text-sm text-gray-600">Dòng tiền vào, ra</p>
            </button>

            <button
              onClick={() => setReportType('expense-analysis')}
              className={`p-4 rounded-lg border-2 transition-colors ${reportType === 'expense-analysis'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <FiPieChart className="mx-auto mb-2" size={24} />
              <h3 className="font-medium">Phân tích chi phí</h3>
              <p className="text-sm text-gray-600">Cơ cấu chi phí theo danh mục</p>
            </button>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nhóm theo</label>
              <select
                value={dateRange.groupBy}
                onChange={(e) => setDateRange({ ...dateRange, groupBy: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="DAILY">Ngày</option>
                <option value="MONTHLY">Tháng</option>
                <option value="QUARTERLY">Quý</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : 'Tạo báo cáo'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {reportData && (
          <div>
            {reportType === 'profit-loss' && renderProfitLossReport()}
            {reportType === 'cash-flow' && renderCashFlowReport()}
            {reportType === 'expense-analysis' && renderExpenseAnalysis()}
          </div>
        )}
      </div>
    </div>
  )
}
