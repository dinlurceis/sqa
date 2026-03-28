'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { FiArrowLeft, FiCalendar, FiUser, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { inventoryApi } from '@/lib/api'

export default function AdminExportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrderDetail()
  }, [params.id])

  const loadOrderDetail = async () => {
    try {
      const response = await inventoryApi.getExportOrderDetail(Number(params.id))
      if (response.success) {
        setOrder(response.data)
      } else {
        toast.error('Không tìm thấy phiếu xuất')
        router.push('/admin/warehouse/export')
      }
    } catch (error) {
      console.error('Error loading order detail:', error)
      toast.error('Lỗi khi tải chi tiết phiếu')
      router.push('/admin/warehouse/export')
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
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/warehouse/export"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Quay lại danh sách</span>
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết phiếu xuất</h1>
            <p className="text-gray-600 mt-1">Mã phiếu: {order.exportCode}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin phiếu xuất</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <FiCalendar className="text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Ngày xuất</p>
              <p className="font-medium text-gray-900">{formatDate(order.exportDate)}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FiUser className="text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Người tạo</p>
              <p className="font-medium text-gray-900">{order.createdBy || 'N/A'}</p>
            </div>
          </div>
          {order.reason && (
            <div className="col-span-2 flex items-start space-x-3">
              <FiFileText className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Lý do xuất</p>
                <p className="font-medium text-gray-900">{order.reason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh sách sản phẩm</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item: any, index: number) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.productName || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.serialNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
