'use client'

import { useState, useEffect } from 'react'
import { FiDownload, FiUpload, FiPackage, FiTrendingUp, FiAlertCircle, FiCalendar } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface ReportStats {
  totalImports: number
  totalExports: number
  totalStock: number
  lowStockItems: number
  importValue: number
  exportValue: number
}

export default function AdminWarehouseReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    endDate: new Date().toISOString().split('T')[0] // Today
  })

  useEffect(() => {
    fetchReportStats()
  }, [dateRange])

  const fetchReportStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(
        `http://localhost:8080/api/inventory/reports/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching report stats:', error)
      // Set default values if API fails
      setStats({
        totalImports: 0,
        totalExports: 0,
        totalStock: 0,
        lowStockItems: 0,
        importValue: 0,
        exportValue: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  const exportToExcel = async (reportType: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:8080/api/inventory/reports/export/${reportType}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}-report-${dateRange.startDate}-${dateRange.endDate}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Xuất báo cáo thành công!')
      } else {
        toast.error('Không thể xuất báo cáo')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Lỗi khi xuất báo cáo')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo cáo kho hàng</h1>
        <p className="text-gray-600">Thống kê và phân tích hoạt động kho</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <FiCalendar className="text-gray-400" size={20} />
          <div className="flex items-center gap-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchReportStats}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-900">Tổng phiếu nhập</h3>
                <FiDownload className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-green-700">{stats.totalImports}</p>
              <p className="text-sm text-green-600 mt-2">
                Giá trị: {formatCurrency(stats.importValue)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">Tổng phiếu xuất</h3>
                <FiUpload className="text-blue-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-blue-700">{stats.totalExports}</p>
              <p className="text-sm text-blue-600 mt-2">
                Giá trị: {formatCurrency(stats.exportValue)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-900">Tổng tồn kho</h3>
                <FiPackage className="text-purple-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-purple-700">{stats.totalStock}</p>
              <p className="text-sm text-purple-600 mt-2">Sản phẩm</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-orange-900">Cảnh báo tồn kho</h3>
                <FiAlertCircle className="text-orange-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-orange-700">{stats.lowStockItems}</p>
              <p className="text-sm text-orange-600 mt-2">Sản phẩm sắp hết</p>
            </div>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Báo cáo nhập kho</h3>
                <FiDownload className="text-green-500" size={24} />
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Chi tiết các phiếu nhập kho trong khoảng thời gian đã chọn
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.open(`/admin/warehouse/import/list`, '_blank')}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={() => exportToExcel('import')}
                  className="w-full border border-green-500 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Xuất Excel
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Báo cáo xuất kho</h3>
                <FiUpload className="text-blue-500" size={24} />
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Chi tiết các phiếu xuất kho trong khoảng thời gian đã chọn
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.open(`/admin/warehouse/export/list`, '_blank')}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={() => exportToExcel('export')}
                  className="w-full border border-blue-500 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Xuất Excel
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Báo cáo tồn kho</h3>
                <FiPackage className="text-purple-500" size={24} />
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Tình trạng tồn kho hiện tại của tất cả sản phẩm
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.open(`/admin/warehouse/inventory`, '_blank')}
                  className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={() => exportToExcel('inventory')}
                  className="w-full border border-purple-500 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Xuất Excel
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Báo cáo giá trị kho</h3>
                <FiTrendingUp className="text-indigo-500" size={24} />
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Phân tích giá trị hàng tồn kho theo thời gian
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => toast('Chức năng đang phát triển', { icon: 'ℹ️' })}
                  className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={() => exportToExcel('value')}
                  className="w-full border border-indigo-500 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Xuất Excel
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Báo cáo nhà cung cấp</h3>
                <FiTrendingUp className="text-teal-500" size={24} />
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Thống kê giao dịch với các nhà cung cấp
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.open(`/admin/warehouse/suppliers`, '_blank')}
                  className="w-full bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={() => exportToExcel('suppliers')}
                  className="w-full border border-teal-500 text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  Xuất Excel
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Cảnh báo tồn kho</h3>
                <FiAlertCircle className="text-orange-500" size={24} />
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Danh sách sản phẩm sắp hết hoặc vượt mức tồn
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => toast('Chức năng đang phát triển', { icon: 'ℹ️' })}
                  className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={() => exportToExcel('alerts')}
                  className="w-full border border-orange-500 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Xuất Excel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
