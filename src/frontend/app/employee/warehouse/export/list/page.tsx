'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiEye, FiSearch, FiPlus, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { inventoryApi } from '@/lib/api'
import { hasPermission, type Position } from '@/lib/permissions'

export default function ExportListPage() {
  const router = useRouter()
  const { employee } = useAuthStore()
  const [exportOrders, setExportOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Check permissions
  const canCreate = hasPermission(employee?.position as Position, 'warehouse.export.create')
  const canApprove = hasPermission(employee?.position as Position, 'warehouse.export.approve')

  useEffect(() => {
    loadExportOrders()
  }, [statusFilter])

  const loadExportOrders = async () => {
    try {
      const response = await inventoryApi.getExportOrders(statusFilter || undefined)
      setExportOrders(response.data || [])
    } catch (error) {
      console.error('Error loading export orders:', error)
      toast.error('Lỗi khi tải danh sách phiếu xuất')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      CREATED: { label: 'Chờ xuất', className: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Đã xuất', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' }
    }
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const filteredOrders = exportOrders.filter(order =>
    order.exportCode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Danh sách phiếu xuất kho</h1>
            <p className="text-gray-600 mt-1">Quản lý tất cả phiếu xuất hàng ra khỏi kho</p>
          </div>

          {/* Only show "Create" button if user has permission */}
          {canCreate && (
            <Link
              href="/employee/warehouse/export/create"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus size={20} />
              <span>Tạo phiếu xuất</span>
            </Link>
          )}

          {/* Show message if user cannot create */}
          {!canCreate && (
            <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
              Bạn chỉ có quyền xem
            </div>
          )}
        </div>
      </div>

      {/* Permission notice */}
      {!canCreate && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiFileText className="text-blue-500 mt-0.5 mr-3" size={20} />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Quyền hạn của bạn</h3>
              <p className="text-sm text-blue-700 mt-1">
                Bạn có thể xem danh sách và chi tiết phiếu xuất kho, nhưng không thể tạo hoặc chỉnh sửa.
                {canApprove && ' Bạn có quyền duyệt phiếu xuất.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã phiếu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="CREATED">Chờ xuất</option>
            <option value="COMPLETED">Đã xuất</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã phiếu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày xuất</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Không có phiếu xuất nào
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.exportCode}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(order.exportDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.createdBy || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{order.reason || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/employee/warehouse/export/${order.id}`}
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                      >
                        <FiEye />
                        <span>Chi tiết</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
