'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiFileText, FiMapPin, FiPhone, FiUser, FiExternalLink } from 'react-icons/fi'
import { hasPermission, type Position } from '@/lib/permissions'
import { shipperApi } from '@/lib/api'

type TabType = 'all' | 'internal' | 'ghn' | 'my-orders'

export default function EmployeeShippingPage() {
  const { user, employee, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [myAssignments, setMyAssignments] = useState<any[]>([])
  const [allAssignments, setAllAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [processingId, setProcessingId] = useState<number | null>(null)

  const isShipper = employee?.position === 'SHIPPER' || user?.position === 'SHIPPER'
  const isSaleStaff = employee?.position === 'SALE' || user?.position === 'SALE' // Nhân viên bán hàng
  // Lấy shipperId từ nhiều nguồn
  const shipperId = employee?.id || user?.employeeId || (user as any)?.employee?.id
  const canPickup = hasPermission(employee?.position as Position, 'shipping.pickup')
  const canDeliver = hasPermission(employee?.position as Position, 'shipping.deliver')

  // Debug log
  useEffect(() => {
    console.log('=== Auth Debug ===')
    console.log('user:', user)
    console.log('employee:', employee)
    console.log('user.employeeId:', user?.employeeId)
    console.log('isShipper:', isShipper)
    console.log('shipperId:', shipperId)
  }, [user, employee, isShipper, shipperId])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập')
      router.push('/')
      return
    }

    fetchOrders()
    fetchAllAssignments()
    if (isShipper && shipperId) {
      fetchMyAssignments()
    }
  }, [isAuthenticated, user, router, isShipper, shipperId])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const response = await fetch('http://localhost:8080/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        // Lấy tất cả đơn liên quan đến shipping (bao gồm cả COMPLETED để shipper xem lịch sử)
        const shippingOrders = data.data?.filter((order: any) => 
          ['READY_TO_SHIP', 'SHIPPING', 'DELIVERED', 'COMPLETED'].includes(order.status)
        ) || []
        setOrders(shippingOrders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllAssignments = async () => {
    try {
      const response = await shipperApi.getAllAssignments()
      if (response.success) {
        setAllAssignments(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching all assignments:', error)
    }
  }

  const fetchMyAssignments = async () => {
    if (!shipperId) return
    try {
      const response = await shipperApi.getMyOrders(shipperId)
      if (response.success) {
        setMyAssignments(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching my assignments:', error)
    }
  }

  // Kiểm tra đơn nội thành (không có GHN order code)
  const isInternalOrder = (order: any) => {
    return !order.ghnOrderCode || order.ghnOrderCode === ''
  }

  // Kiểm tra đơn đã được shipper nhận chưa
  const isOrderClaimed = (orderId: number) => {
    return myAssignments.some(a => a.orderId === orderId && ['CLAIMED', 'DELIVERING'].includes(a.status))
  }

  // Lấy assignment của đơn hàng (từ tất cả assignments)
  const getAssignment = (orderId: number) => {
    // Ưu tiên lấy từ myAssignments nếu là shipper
    if (isShipper) {
      const myAssignment = myAssignments.find(a => a.orderId === orderId)
      if (myAssignment) return myAssignment
    }
    // Lấy từ allAssignments
    return allAssignments.find(a => a.orderId === orderId && ['CLAIMED', 'DELIVERING'].includes(a.status))
  }

  // Kiểm tra đơn đã có shipper khác nhận chưa
  const isClaimedByOther = (orderId: number) => {
    const assignment = allAssignments.find(a => a.orderId === orderId && ['CLAIMED', 'DELIVERING'].includes(a.status))
    return assignment && assignment.shipperId !== shipperId
  }

  // Shipper nhận đơn
  const handleClaimOrder = async (orderId: number) => {
    if (!shipperId) {
      toast.error('Không tìm thấy thông tin shipper. Vui lòng đăng nhập lại.')
      return
    }
    if (!confirm('Xác nhận nhận đơn hàng này?')) return

    try {
      setProcessingId(orderId)
      const response = await shipperApi.claimOrder(orderId, shipperId)
      if (response.success) {
        toast.success('Đã nhận đơn và bắt đầu giao hàng!')
        // Reload tất cả data để cập nhật UI
        await Promise.all([
          fetchOrders(),
          fetchAllAssignments(),
          fetchMyAssignments()
        ])
      } else {
        toast.error(response.message || 'Không thể nhận đơn')
      }
    } catch (error: any) {
      console.error('Error claiming order:', error)
      toast.error(error.message || 'Lỗi khi nhận đơn')
    } finally {
      setProcessingId(null)
    }
  }

  // Shipper xác nhận đã giao thành công - cập nhật trực tiếp order status
  const handleMarkDelivered = async (orderId: number) => {
    if (!confirm('Xác nhận đã giao hàng thành công?')) return

    try {
      setProcessingId(orderId)
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/admin/orders/${orderId}/delivered`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Đã giao hàng thành công!')
        // Reload tất cả data
        await Promise.all([
          fetchOrders(),
          fetchAllAssignments(),
          fetchMyAssignments()
        ])
      } else {
        toast.error(data.message || 'Không thể cập nhật')
      }
    } catch (error: any) {
      console.error('Error marking delivered:', error)
      toast.error(error.message || 'Lỗi khi cập nhật')
    } finally {
      setProcessingId(null)
    }
  }

  // Shipper báo giao thất bại
  const handleMarkFailed = async (orderId: number) => {
    const reason = prompt('Nhập lý do giao thất bại:')
    if (!reason) return

    try {
      setProcessingId(orderId)
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/admin/orders/${orderId}/status?status=DELIVERY_FAILED&reason=${encodeURIComponent(reason)}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Đã báo giao thất bại')
        // Reload tất cả data
        await Promise.all([
          fetchOrders(),
          fetchAllAssignments(),
          fetchMyAssignments()
        ])
      } else {
        toast.error(data.message || 'Không thể cập nhật')
      }
    } catch (error: any) {
      console.error('Error marking failed:', error)
      toast.error(error.message || 'Lỗi khi cập nhật')
    } finally {
      setProcessingId(null)
    }
  }

  // Nhân viên cập nhật trạng thái đơn GHN thủ công
  const handleUpdateGHNStatus = async (orderId: number, newStatus: 'SHIPPING' | 'DELIVERED') => {
    const confirmMsg = newStatus === 'SHIPPING' 
      ? 'Xác nhận chuyển sang trạng thái "Đang giao"?'
      : 'Xác nhận chuyển sang trạng thái "Đã giao"?'
    
    if (!confirm(confirmMsg)) return

    try {
      setProcessingId(orderId)
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      
      // Sử dụng endpoint chuyên dụng cho từng trạng thái
      const endpoint = newStatus === 'DELIVERED'
        ? `http://localhost:8080/api/admin/orders/${orderId}/delivered`
        : `http://localhost:8080/api/admin/orders/${orderId}/mark-shipping-from-ready`
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Đã cập nhật trạng thái: ${newStatus === 'SHIPPING' ? 'Đang giao' : 'Đã giao'}`)
        await fetchOrders()
      } else {
        toast.error(data.message || 'Không thể cập nhật')
      }
    } catch (error: any) {
      console.error('Error updating GHN status:', error)
      toast.error(error.message || 'Lỗi khi cập nhật')
    } finally {
      setProcessingId(null)
    }
  }

  // Shipper bắt đầu giao (đã lấy hàng) - không dùng nữa
  const handleStartDelivery = async (assignmentId: number) => {
    if (!shipperId) return
    if (!confirm('Xác nhận đã lấy hàng và bắt đầu giao?')) return

    try {
      setProcessingId(assignmentId)
      const response = await shipperApi.startDelivery(assignmentId, shipperId)
      if (response.success) {
        toast.success('Đã bắt đầu giao hàng!')
        fetchOrders()
        fetchAllAssignments()
        fetchMyAssignments()
      } else {
        toast.error(response.message || 'Không thể cập nhật')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật')
    } finally {
      setProcessingId(null)
    }
  }

  // Shipper xác nhận giao thành công
  const handleConfirmDelivery = async (assignmentId: number) => {
    if (!shipperId) return
    if (!confirm('Xác nhận đã giao hàng thành công?')) return

    try {
      setProcessingId(assignmentId)
      const response = await shipperApi.confirmDelivery(assignmentId, shipperId)
      if (response.success) {
        toast.success('Đã giao hàng thành công!')
        fetchOrders()
        fetchAllAssignments()
        fetchMyAssignments()
      } else {
        toast.error(response.message || 'Không thể cập nhật')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật')
    } finally {
      setProcessingId(null)
    }
  }

  // Shipper báo giao thất bại
  const handleReportFailure = async (assignmentId: number) => {
    if (!shipperId) return
    const reason = prompt('Nhập lý do giao thất bại:')
    if (!reason) return

    try {
      setProcessingId(assignmentId)
      const response = await shipperApi.reportFailure(assignmentId, shipperId, reason)
      if (response.success) {
        toast.success('Đã báo giao thất bại')
        fetchOrders()
        fetchAllAssignments()
        fetchMyAssignments()
      } else {
        toast.error(response.message || 'Không thể cập nhật')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật')
    } finally {
      setProcessingId(null)
    }
  }

  // Shipper hủy nhận đơn
  const handleCancelClaim = async (assignmentId: number) => {
    if (!shipperId) return
    if (!confirm('Xác nhận hủy nhận đơn này?')) return

    try {
      setProcessingId(assignmentId)
      const response = await shipperApi.cancelClaim(assignmentId, shipperId)
      if (response.success) {
        toast.success('Đã hủy nhận đơn')
        fetchOrders()
        fetchAllAssignments()
        fetchMyAssignments()
      } else {
        toast.error(response.message || 'Không thể hủy')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi hủy')
    } finally {
      setProcessingId(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)
  }

  const getStatusBadge = (status: string, hasGhn: boolean) => {
    const statusMap: any = {
      'READY_TO_SHIP': { label: 'Chờ lấy hàng', color: 'bg-blue-100 text-blue-800', icon: FiPackage },
      'SHIPPING': { label: 'Đang giao', color: 'bg-yellow-100 text-yellow-800', icon: FiTruck },
      'DELIVERED': { label: 'Đã giao', color: 'bg-green-100 text-green-800', icon: FiCheckCircle }
    }
    const config = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: FiPackage }
    const Icon = config.icon
    return (
      <div className="flex flex-col gap-1">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
          <Icon className="w-4 h-4" />
          {config.label}
        </span>
        {hasGhn ? (
          <span className="text-xs text-orange-600 font-medium">GHN</span>
        ) : (
          <span className="text-xs text-purple-600 font-medium">Nội thành</span>
        )}
      </div>
    )
  }

  // Lọc đơn hàng theo tab
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'internal':
        return orders.filter(o => isInternalOrder(o))
      case 'ghn':
        return orders.filter(o => !isInternalOrder(o))
      case 'my-orders':
        // Hiển thị TẤT CẢ đơn mà shipper đã từng nhận (kể cả đã giao xong)
        const myOrderIds = myAssignments.map(a => a.orderId)
        return orders.filter(o => myOrderIds.includes(o.orderId || o.id))
      default:
        return orders
    }
  }

  const filteredOrders = getFilteredOrders()
  const internalOrders = orders.filter(o => isInternalOrder(o))
  const ghnOrders = orders.filter(o => !isInternalOrder(o))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiTruck className="text-purple-500" />
          Quản lý giao hàng
        </h1>
        <div className="text-sm text-gray-600">
          {isShipper ? (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
              Shipper: {employee?.fullName}
            </span>
          ) : (
            <span>Xin chào, {employee?.fullName || user?.email}</span>
          )}
        </div>
      </div>

      {/* Thông báo quyền hạn */}
      {!isShipper && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiFileText className="text-blue-500 mt-0.5 mr-3" size={20} />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Quyền hạn của bạn</h3>
              <p className="text-sm text-blue-700 mt-1">
                Bạn chỉ có quyền xem danh sách đơn giao hàng. Chỉ Shipper mới có thể nhận và giao đơn nội thành.
              </p>
            </div>
          </div>
        </div>
      )}

      {isShipper && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiTruck className="text-purple-500 mt-0.5 mr-3" size={20} />
            <div>
              <h3 className="text-sm font-medium text-purple-900">Hướng dẫn Shipper</h3>
              <p className="text-sm text-purple-700 mt-1">
                Bạn có thể nhận và giao các đơn hàng <strong>nội thành</strong> (không có mã GHN). 
                Đơn ngoại thành sẽ do Giao Hàng Nhanh xử lý.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Nội thành</p>
              <p className="text-2xl font-bold text-purple-600">{internalOrders.length}</p>
            </div>
            <FiPackage className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">GHN</p>
              <p className="text-2xl font-bold text-orange-600">{ghnOrders.length}</p>
            </div>
            <FiExternalLink className="w-8 h-8 text-orange-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Đang giao</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'SHIPPING').length}
              </p>
            </div>
            <FiTruck className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Đã giao</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'DELIVERED').length}
              </p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex overflow-x-auto border-b">
          {[
            { key: 'all', label: 'Tất cả', count: orders.length },
            { key: 'internal', label: 'Nội thành (Shipper)', count: internalOrders.length },
            { key: 'ghn', label: 'GHN (Ngoại thành)', count: ghnOrders.length },
            ...(isShipper ? [{ key: 'my-orders', label: 'Đơn của tôi', count: myAssignments.length }] : [])
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiPackage size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có đơn hàng nào</h3>
          <p className="text-gray-600">
            {activeTab === 'internal' && 'Không có đơn nội thành nào cần giao'}
            {activeTab === 'ghn' && 'Không có đơn GHN nào'}
            {activeTab === 'my-orders' && 'Bạn chưa nhận đơn nào'}
            {activeTab === 'all' && 'Chưa có đơn hàng nào trong hệ thống'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const orderId = order.orderId || order.id
            const isInternal = isInternalOrder(order)
            const isProcessing = processingId === orderId
            // Kiểm tra đơn đã có shipper nhận chưa (từ myAssignments hoặc allAssignments)
            const myAssignment = myAssignments.find(a => a.orderId === orderId)
            const anyAssignment = allAssignments.find(a => a.orderId === orderId && ['CLAIMED', 'DELIVERING'].includes(a.status))
            const hasAssignment = !!myAssignment || !!anyAssignment
            const isMyOrder = !!myAssignment

            return (
              <div key={orderId} className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                isInternal ? 'border-l-4 border-purple-500' : 'border-l-4 border-orange-500'
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-gray-900 text-lg">{order.orderCode}</span>
                      {getStatusBadge(order.status, !isInternal)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center">
                        <FiUser className="mr-2" size={14} />
                        {order.customerName}
                      </p>
                      <p className="flex items-center">
                        <FiPhone className="mr-2" size={14} />
                        <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:underline">
                          {order.customerPhone}
                        </a>
                      </p>
                      <p className="flex items-center">
                        <FiMapPin className="mr-2" size={14} />
                        {order.shippingAddress}
                      </p>
                      {!isInternal && order.ghnOrderCode && (
                        <p className="text-orange-600 font-medium">
                          Mã GHN: {order.ghnOrderCode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="text-center lg:text-right">
                    <p className="text-sm text-gray-600">Thu hộ (COD)</p>
                    <p className="text-xl font-bold text-red-600">{formatPrice(order.total)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {/* Shipper actions cho đơn nội thành */}
                    {isShipper && isInternal && (
                      <>
                        {/* Đơn chờ lấy hàng và chưa có ai nhận - Shipper có thể nhận */}
                        {order.status === 'READY_TO_SHIP' && !hasAssignment && (
                          <button
                            onClick={() => handleClaimOrder(orderId)}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
                          >
                            {isProcessing ? 'Đang xử lý...' : 'Nhận đơn & Giao hàng'}
                          </button>
                        )}
                        {/* Đơn đã có shipper khác nhận */}
                        {order.status === 'READY_TO_SHIP' && hasAssignment && !isMyOrder && (
                          <span className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm text-center">
                            Shipper khác đã nhận
                          </span>
                        )}
                        {/* Đơn của tôi đang giao (READY_TO_SHIP nhưng đã có assignment hoặc SHIPPING) */}
                        {((order.status === 'READY_TO_SHIP' && isMyOrder) || order.status === 'SHIPPING') && (
                          <>
                            <div className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm text-center font-medium mb-1">
                              Đang giao hàng
                            </div>
                            <button
                              onClick={() => handleMarkDelivered(orderId)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                            >
                              {isProcessing ? '...' : 'Đã giao thành công'}
                            </button>
                            <button
                              onClick={() => handleMarkFailed(orderId)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                            >
                              Giao thất bại
                            </button>
                          </>
                        )}
                        {/* Đơn đã giao xong */}
                        {order.status === 'DELIVERED' && isMyOrder && (
                          <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm text-center font-medium">
                            ✓ Đã giao thành công
                          </div>
                        )}
                      </>
                    )}

                    {/* Actions cho đơn GHN - Chỉ nhân viên bán hàng (SALE) có thể cập nhật thủ công */}
                    {!isInternal && (
                      <div className="text-center space-y-2">
                        <span className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm block">
                          Giao Hàng Nhanh
                        </span>
                        {order.ghnShippingStatus && (
                          <p className="text-xs text-gray-500">
                            Trạng thái: {order.ghnShippingStatus}
                          </p>
                        )}
                        
                        {/* Nút cập nhật thủ công - CHỈ cho nhân viên bán hàng (SALE) */}
                        {isSaleStaff && (
                          <>
                            {order.status === 'READY_TO_SHIP' && (
                              <button
                                onClick={() => handleUpdateGHNStatus(orderId, 'SHIPPING')}
                                disabled={isProcessing}
                                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors font-medium"
                              >
                                {isProcessing ? '...' : 'Đang giao'}
                              </button>
                            )}
                            {order.status === 'SHIPPING' && (
                              <button
                                onClick={() => handleUpdateGHNStatus(orderId, 'DELIVERED')}
                                disabled={isProcessing}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                              >
                                {isProcessing ? '...' : 'Đã giao thành công'}
                              </button>
                            )}
                            {order.status === 'DELIVERED' && (
                              <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                                ✓ Đã giao thành công
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Nhân viên khác chỉ xem */}
                        {!isSaleStaff && (
                          <p className="text-xs text-gray-500 italic">
                            (Chỉ nhân viên bán hàng mới có thể cập nhật)
                          </p>
                        )}
                      </div>
                    )}

                    {/* Nhân viên khác xem trạng thái đơn nội thành */}
                    {!isShipper && isInternal && (
                      <div className="text-center">
                        {order.status === 'SHIPPING' ? (
                          <div className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                            <p className="font-medium">Đang giao hàng</p>
                          </div>
                        ) : order.status === 'DELIVERED' ? (
                          <div className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
                            <p className="font-medium">Đã giao</p>
                          </div>
                        ) : (
                          <span className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm block">
                            Chờ Shipper nhận
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
