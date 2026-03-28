'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiEye, FiFileText } from 'react-icons/fi'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

interface PurchaseOrder {
  id: number
  poCode: string
  supplierName: string
  orderDate: string
  receivedDate?: string
  status: 'CREATED' | 'RECEIVED' | 'CANCELLED'
  totalAmount: number
  itemCount: number
}

export default function EmployeeWarehouseImportPage() {
  const router = useRouter()
  const { employee } = useAuthStore()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  // Permission checks
  const canCreate = hasPermission(employee?.position as Position, 'warehouse.import.create')
  const canApprove = hasPermission(employee?.position as Position, 'warehouse.import.approve')

  useEffect(() => {
    if (employee) {
      fetchPurchaseOrders()
    }
    
    return () => {
      setOrders([])
    }
  }, [filter, employee])

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const url = filter === 'ALL' 
        ? '/api/inventory/purchase-orders'
        : `/api/inventory/purchase-orders?status=${filter}`
      
      console.log('Fetching purchase orders:', url)
      const res = await fetch(`http://localhost:8080${url}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      console.log('Purchase orders response:', data)
      
      if (data.success) {
        console.log('Orders data:', data.data)
        setOrders(data.data || [])
      } else {
        console.error('API returned error:', data.message)
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      CREATED: 'bg-yellow-100 text-yellow-800',
      RECEIVED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Phiếu Nhập Kho</h1>
        {canCreate && (
          <button
            onClick={() => router.push('/employee/warehouse/import/create')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FiPlus /> Tạo phiếu nhập
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
              Bạn có thể xem danh sách và chi tiết phiếu nhập kho, nhưng không thể tạo hoặc chỉnh sửa.
              {employee?.position === 'WAREHOUSE' 
                ? ' Chỉ nhân viên kho mới có quyền này.'
                : ' Liên hệ quản lý kho nếu cần hỗ trợ.'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'CREATED', 'RECEIVED', 'CANCELLED'].map(status => (
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{order.poCode}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.supplierName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{(order.totalAmount || 0).toLocaleString('vi-VN')} đ</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => router.push(`/employee/warehouse/import/${order.id}`)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Xem chi tiết"
                  >
                    <FiEye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
