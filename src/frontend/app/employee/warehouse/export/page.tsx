'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiEye, FiFileText } from 'react-icons/fi'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

interface ExportOrder {
  id: number
  exportCode: string
  orderCode?: string
  exportType: 'SALE' | 'WARRANTY' | 'OTHER'
  exportDate: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  totalItems: number
  exportedBy: string
}

export default function EmployeeWarehouseExportPage() {
  const router = useRouter()
  const { employee } = useAuthStore()
  const [orders, setOrders] = useState<ExportOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  const canCreate = hasPermission(employee?.position as Position, 'warehouse.export.create')
  const canEdit = hasPermission(employee?.position as Position, 'warehouse.export.edit')

  useEffect(() => {
    if (employee) {
      fetchExportOrders()
    }
    
    return () => {
      setOrders([])
    }
  }, [filter, employee])

  const fetchExportOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const url = filter === 'ALL' 
        ? '/api/inventory/export-orders'
        : `/api/inventory/export-orders?status=${filter}`
      
      const res = await fetch(`http://localhost:8080${url}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('Error fetching export orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadge = (type: string) => {
    const styles = {
      SALE: 'bg-blue-100 text-blue-800',
      WARRANTY: 'bg-purple-100 text-purple-800',
      OTHER: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      SALE: 'Bán hàng',
      WARRANTY: 'Bảo hành',
      OTHER: 'Khác'
    }
    return { style: styles[type as keyof typeof styles], label: labels[type as keyof typeof labels] }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Phiếu Xuất Kho</h1>
          <p className="text-gray-600 mt-1">Quản lý các phiếu xuất kho cho bán hàng, bảo hành</p>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push('/employee/warehouse/export/create')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FiPlus /> Tạo phiếu xuất
          </button>
        )}
      </div>

      {/* Permission Notice */}
      {!canCreate && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <FiFileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Quyền hạn của bạn</p>
            <p className="text-sm text-blue-600 mt-1">
              Bạn có thể xem danh sách và chi tiết phiếu xuất kho, nhưng không thể tạo hoặc chỉnh sửa.
              {employee?.position === 'WAREHOUSE' 
                ? ' Chỉ nhân viên kho mới có quyền này.'
                : ' Liên hệ quản lý kho nếu cần hỗ trợ.'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'ALL' ? 'Tất cả' : status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã phiếu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại xuất</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày xuất</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map(order => {
              const typeBadge = getTypeBadge(order.exportType)
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{order.exportCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${typeBadge.style}`}>
                      {typeBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.orderCode || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(order.exportDate).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.totalItems} sản phẩm</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/employee/warehouse/export/${order.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Xem chi tiết"
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
