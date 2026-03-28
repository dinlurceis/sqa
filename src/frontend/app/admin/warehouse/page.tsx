'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FiPackage, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiAlertCircle,
  FiArchive,
  FiBox,
  FiDollarSign
} from 'react-icons/fi'

interface DashboardStats {
  totalProducts: number
  totalStock: number
  lowStockCount: number
  pendingImports: number
  pendingExports: number
  totalValue: number
  recentImports: any[]
  recentExports: any[]
  lowStockProducts: any[]
}

export default function AdminWarehouseDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8080/api/inventory/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Đang tải...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tổng Quan Kho</h1>
        <p className="text-gray-600 mt-1">Quản lý và theo dõi hoạt động kho hàng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng sản phẩm</p>
              <p className="text-3xl font-bold mt-2">{stats?.totalProducts || 0}</p>
              <p className="text-sm text-gray-500 mt-1">SKU</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng tồn kho</p>
              <p className="text-3xl font-bold mt-2">{stats?.totalStock || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Sản phẩm</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBox className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sắp hết hàng</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats?.lowStockCount || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Cần nhập thêm</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Giá trị tồn kho</p>
              <p className="text-3xl font-bold mt-2">{((stats?.totalValue || 0) / 1000000000).toFixed(1)}B</p>
              <p className="text-sm text-gray-500 mt-1">VNĐ</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/warehouse/import')}
          className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <FiTrendingUp className="w-5 h-5" />
          <span>Phiếu nhập kho</span>
        </button>

        <button
          onClick={() => router.push('/admin/warehouse/export')}
          className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <FiTrendingDown className="w-5 h-5" />
          <span>Phiếu xuất kho</span>
        </button>

        <button
          onClick={() => router.push('/admin/warehouse/inventory')}
          className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <FiBox className="w-5 h-5" />
          <span>Xem tồn kho</span>
        </button>

        <button
          onClick={() => router.push('/admin/warehouse/products')}
          className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
        >
          <FiPackage className="w-5 h-5" />
          <span>Sản phẩm kho</span>
        </button>
      </div>

      {/* Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Phiếu nhập chờ xử lý</h2>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {stats?.pendingImports || 0}
            </span>
          </div>
          <button
            onClick={() => router.push('/admin/warehouse/import?status=CREATED')}
            className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Xem tất cả →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Phiếu xuất chờ xử lý</h2>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {stats?.pendingExports || 0}
            </span>
          </div>
          <button
            onClick={() => router.push('/admin/warehouse/export?status=PENDING')}
            className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Xem tất cả →
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats && stats.lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">Cảnh báo tồn kho thấp</h3>
              <p className="text-red-700 mt-1">
                Có {stats.lowStockCount} sản phẩm sắp hết hàng. Vui lòng nhập thêm để tránh thiếu hàng.
              </p>
              <button
                onClick={() => router.push('/admin/warehouse/inventory?filter=LOW')}
                className="mt-3 text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Xem chi tiết →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
