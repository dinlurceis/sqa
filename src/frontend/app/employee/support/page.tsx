'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { supportApi } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  FiMessageCircle, FiSearch, FiFilter, FiClock, FiCheckCircle,
  FiAlertCircle, FiUser, FiChevronRight, FiRefreshCw, FiX, FiEdit, FiStar
} from 'react-icons/fi'

interface Ticket {
  id: string | number
  title: string
  status: string
  priority: string
  category: string
  createdAt: string
  updatedAt: string
  customerName?: string
  customerEmail?: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Đang mở', color: 'bg-blue-100 text-blue-800' },
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-orange-100 text-orange-800' },
  RESOLVED: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-800' }
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Thấp', color: 'text-gray-600' },
  MEDIUM: { label: 'TB', color: 'text-blue-600' },
  HIGH: { label: 'Cao', color: 'text-orange-600' },
  // urgent: { label: 'Khẩn', color: 'text-red-600 font-bold' }
}

export default function EmployeeSupportPage() {
  const router = useRouter()
  const { user, employee } = useAuthStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  // Check permission
  useEffect(() => {
    const position = employee?.position || user?.position
    if (user?.role !== 'ADMIN' && position !== 'CSKH') {
      toast.error('Bạn không có quyền truy cập trang này')
      router.push('/employee')
      return
    }
    loadTickets()
  }, [user, employee])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const res = await supportApi.empListTickets()

      if (res?.success) {
        // Handle both structures: res.data.content or res.data
        let list: Ticket[] = []

        if (res.data?.content && Array.isArray(res.data.content)) {
          list = res.data.content
        } else if (Array.isArray(res.data)) {
          list = res.data
        }

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


  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const filteredTickets = safeTickets.filter(ticket => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'PENDING').length,
    pending: tickets.filter(t => t.status === 'PROCESSING').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CANCELLED').length
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý yêu cầu hỗ trợ</h1>
          <p className="text-gray-500">Xử lý và phản hồi tickets từ khách hàng</p>
        </div>
        <button onClick={loadTickets} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg"><FiMessageCircle className="w-5 h-5 text-gray-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Tổng tickets</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg"><FiMessageCircle className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              <p className="text-sm text-gray-500">Mới</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg"><FiClock className="w-5 h-5 text-orange-600" /></div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Đang xử lý</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg"><FiCheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              <p className="text-sm text-gray-500">Đã xử lý</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, tên KH, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2">
              <option value="all">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="CANCELLED">Đã đóng</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2">
              <option value="all">Tất cả ưu tiên</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Đang tải...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center">
            <FiMessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có tickets nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ưu tiên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.open
                const priority = priorityConfig[ticket.priority] || priorityConfig.medium
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    <td className="px-4 py-3 text-sm text-gray-500">#{ticket.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-xs">{ticket.title}</p>
                      {ticket.category && <span className="text-xs text-gray-500">{ticket.category}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">{ticket.customerName || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{ticket.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${priority.color}`}>{priority.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(ticket.createdAt)}</td>
                    <td className="px-4 py-3"><FiChevronRight className="w-5 h-5 text-gray-400" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={loadTickets}
        />
      )}
    </div>
  )
}

// Ticket Detail Modal Component
function TicketDetailModal({ ticket, onClose, onUpdate }: { ticket: Ticket; onClose: () => void; onUpdate: () => void }) {
  const [ticketDetail, setTicketDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ priority: '', internalNote: '' })
  const [ticketRating, setTicketRating] = useState<any>(null)

  useEffect(() => {
    loadTicketDetail()
    loadTicketRating()
  }, [ticket.id])

  useEffect(() => {
    if (ticketDetail) {
      setEditData({
        priority: ticketDetail.priority || 'MEDIUM',
        internalNote: ticketDetail.internalNote || ''
      })
    }
  }, [ticketDetail])

  const loadTicketRating = async () => {
    try {
      const res = await supportApi.empGetTicketRating(ticket.id)
      if (res.success && res.data) {
        setTicketRating(res.data)
      }
    } catch (error) {
      console.error('Error loading rating:', error)
    }
  }

  const loadTicketDetail = async () => {
    setLoading(true)
    try {
      const res = await supportApi.empGetById(ticket.id)
      if (res.success) {
        setTicketDetail(res.data)
      }
    } catch (error) {
      console.error('Error loading ticket detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    try {
      const res = await supportApi.updateTicket(ticket.id, editData)
      if (res.success) {
        toast.success('Đã cập nhật phiếu thành công')
        setIsEditing(false)
        loadTicketDetail()
        onUpdate()
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật phiếu')
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim()) return
    setSending(true)
    try {
      const res = await supportApi.empReplyTicket(ticket.id, { content: replyContent })
      if (res.success) {
        toast.success('Đã gửi phản hồi')
        setReplyContent('')
        loadTicketDetail()
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi phản hồi')
    } finally {
      setSending(false)
    }
  }

  const handleClose = async () => {
    if (!confirm('Bạn có chắc muốn đóng ticket này?')) return
    try {
      const res = await supportApi.closeTicket(ticket.id)
      if (res.success) {
        toast.success('Đã đóng ticket')
        onUpdate()
        onClose()
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể đóng ticket')
    }
  }

  const handleAssign = async () => {
    try {
      const res = await supportApi.assignTicket(ticket.id)
      if (res.success) {
        toast.success('Đã nhận phiếu hỗ trợ thành công')
        loadTicketDetail()
        onUpdate()
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể nhận phiếu')
    }
  }

  const status = statusConfig[ticket.status] || statusConfig.open
  const isOpen = ticket.status !== 'closed' && ticket.status !== 'resolved'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600" title="Quay lại">
              <FiChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">#{ticket.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mt-1">{ticket.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"><FiX className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                <p className="text-sm"><span className="text-gray-600 font-medium">Khách hàng:</span> <span className="text-gray-900">{ticketDetail?.customerName || ticket.customerName}</span></p>
                <p className="text-sm"><span className="text-gray-600 font-medium">Email:</span> <span className="text-gray-900">{ticketDetail?.customerEmail || ticket.customerEmail}</span></p>
                {ticketDetail?.relatedOrders && ticketDetail.relatedOrders.length > 0 && (
                  <p className="text-sm mt-1">
                    <span className="text-gray-600 font-medium">Đơn hàng liên quan:</span>{' '}
                    {ticketDetail.relatedOrders.map((order: any, idx: number) => (
                      <span key={idx} className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium mr-1">
                        {order.orderCode || `#${order.id}`}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              {/* Original Content */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 font-medium mb-1">Nội dung:</p>
                <p className="text-gray-900 whitespace-pre-wrap">{ticketDetail?.content}</p>
              </div>

              {/* Rating - Hiển thị nếu có */}
              {ticketRating && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-2">Đánh giá từ khách hàng:</p>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={`w-5 h-5 ${star <= ticketRating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-700 font-medium">({ticketRating.rating}/5)</span>
                  </div>
                  {ticketRating.comment && (
                    <p className="text-sm text-gray-700 italic">"{ticketRating.comment}"</p>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 font-medium">Trao đổi ({ticketDetail?.replies?.length || 0}):</p>
                {ticketDetail?.replies?.map((msg: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded-lg border ${msg.senderType === 'employee' ? 'bg-blue-50 border-blue-200 ml-4' : 'bg-white border-gray-200 mr-4'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${msg.senderType === 'employee' ? 'text-blue-700' : 'text-gray-700'}`}>
                        {msg.senderType === 'employee' ? '👨‍💼 Hỗ trợ viên' : '👤 Khách hàng'}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="text-sm text-gray-800">{msg.content}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="p-4 border-t bg-yellow-50">
            <h3 className="font-medium text-gray-900 mb-3">Sửa thông tin phiếu</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mức độ ưu tiên</label>
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ghi chú nội bộ</label>
                <textarea
                  value={editData.internalNote}
                  onChange={(e) => setEditData({ ...editData, internalNote: e.target.value })}
                  placeholder="Ghi chú cho nhân viên..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                  Hủy
                </button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {isOpen && !isEditing && (
          <div className="p-4 border-t">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Nhập nội dung phản hồi..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
            />
            <div className="flex justify-between">
              <div className="flex gap-2">
                <button onClick={handleClose} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                  Đóng ticket
                </button>
                {!ticketDetail?.assignedEmployee && (
                  <button onClick={handleAssign} className="px-4 py-2 border border-green-200 text-green-600 rounded-lg hover:bg-green-50">
                    Nhận phiếu
                  </button>
                )}
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-yellow-200 text-yellow-600 rounded-lg hover:bg-yellow-50 flex items-center gap-1">
                  <FiEdit className="w-4 h-4" />
                  Sửa phiếu
                </button>
              </div>
              <button onClick={handleReply} disabled={sending || !replyContent.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
