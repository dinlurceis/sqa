'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supportApi } from '@/lib/api'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  FiPlus, FiSearch, FiFilter, FiClock, FiCheckCircle,
  FiAlertCircle, FiMessageCircle, FiArrowLeft, FiChevronRight
} from 'react-icons/fi'

interface Ticket {
  id: string | number
  title: string
  status: string
  priority: string
  category: string
  createdAt: string
  updatedAt: string
  lastReply?: string
}

interface CategorySupport {
  id: number
  name: string
  description: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN: { label: 'Đang mở', color: 'bg-blue-100 text-blue-800', icon: <FiMessageCircle /> },
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: <FiClock /> },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-orange-100 text-orange-800', icon: <FiAlertCircle /> },
  RESOLVED: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800', icon: <FiCheckCircle /> },
  CANCELLED: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-800', icon: <FiCheckCircle /> }
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Thấp', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Trung bình', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Cao', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-600' }
}

export default function TicketsPage() {
  const params = useSearchParams()
  const orderId = params.get("orderId")
  const orderCode = params.get("orderCode")
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [supportCategory, setSupportCategory] = useState<CategorySupport[]>([]);
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadTickets()
    getSupportCategories();

    // Auto refresh mỗi 10 giây để cập nhật trạng thái
    const interval = setInterval(() => {
      refreshTickets()
    }, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const refreshTickets = async () => {
    try {
      const res = await supportApi.listTickets()
      if (res.success) {
        const list = Array.isArray(res.data?.content) ? res.data.content : []
        setTickets(list)
      }
    } catch (error) {
      console.error('Error refreshing tickets:', error)
    }
  }

  const loadTickets = async () => {
    setLoading(true)
    try {
      const res = await supportApi.listTickets()
      if (res.success) {
        const list = Array.isArray(res.data?.content) ? res.data.content : []
        setTickets(list)
      } else {
        setTickets([])
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast.error('Không thể tải danh sách tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }


  const getSupportCategories = async () => {
    setLoading(true)
    try {
      const res = await supportApi.getSupportCategories()
      if (res.success) {
        setSupportCategory(res.data || [])
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast.error('Không thể tải danh sách tickets')
    } finally {
      setLoading(false)
    }
  }

  const safeTickets = Array.isArray(tickets) ? tickets : [];

  const filteredTickets = safeTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/support" className="text-gray-500 hover:text-gray-700">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yêu cầu hỗ trợ {orderCode ?? ""}</h1>
              <p className="text-gray-500">Quản lý và theo dõi các yêu cầu hỗ trợ của bạn</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Tạo ticket mới
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="RESOLVED">Đã giải quyết</option>
                <option value="CANCELLED">Đã đóng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Đang tải...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center">
              <FiMessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Không tìm thấy ticket phù hợp'
                  : 'Bạn chưa có yêu cầu hỗ trợ nào'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Tạo ticket đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.PENDING
                const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM

                return (
                  <Link
                    key={ticket.id}
                    href={`/support/tickets/${ticket.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-400">#{ticket.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 truncate">{ticket.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            {formatDate(ticket.createdAt)}
                          </span>
                          {ticket.category && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                              {ticket.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <FiChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <CreateTicketModal
            orderId={orderId ?? null}
            orderCode={orderCode ?? null}
            supportCategory={supportCategory}
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false)
              loadTickets()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Create Ticket Modal Component
function CreateTicketModal({ orderId, orderCode, supportCategory, onClose, onCreated }: { 
  orderId: string | null, 
  orderCode: string | null, 
  supportCategory: CategorySupport[], 
  onClose: () => void; 
  onCreated: () => void 
}) {
  const [formData, setFormData] = useState({
    title: '',
    supportCategoryId: supportCategory[0]?.id || '',
    priority: 'LOW',
    content: ''
  })

  // Cập nhật categoryId khi supportCategory được load
  useEffect(() => {
    if (supportCategory.length > 0 && !formData.supportCategoryId) {
      setFormData(prev => ({
        ...prev,
        supportCategoryId: supportCategory[0]?.id || ''
      }))
    }
  }, [supportCategory])
  
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    const payload = {
      title: formData.title,
      supportCategoryId: formData.supportCategoryId,
      priority: formData.priority.toUpperCase(),
      content: formData.content,
      orderId: orderId
    }

    try {
      const res = await supportApi.createTicket(payload)
      if (res.success) {
        toast.success('Tạo ticket thành công!')
        onCreated()
      } else {
        toast.error(res.message || 'Không thể tạo ticket')
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    }
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          {
            orderId == null ? <h2 className="text-xl font-bold text-gray-900">Tạo yêu cầu hỗ trợ mới</h2>
              : <h2 className="text-xl font-bold text-gray-900">Tạo yêu cầu hỗ trợ cho đơn hàng {orderCode}</h2>
          }
          <p className="text-gray-500 text-sm mt-1">Mô tả vấn đề của bạn để chúng tôi hỗ trợ tốt nhất</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {
            orderId != null ?
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đơn hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderCode || ''}
                  readOnly
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div> : ""
          }
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nhập tiêu đề ngắn gọn..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục hỗ trợ</label>
              <select
                value={formData.supportCategoryId}
                onChange={(e) => setFormData({ ...formData, supportCategoryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {supportCategory.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Mô tả chi tiết vấn đề của bạn..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
