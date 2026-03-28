'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { supportApi } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  FiArrowLeft, FiClock, FiCheckCircle, FiAlertCircle,
  FiMessageCircle, FiSend, FiUser, FiHeadphones, FiX, FiStar
} from 'react-icons/fi'

interface Message {
  id: string | number
  content: string
  createdAt: string
  sender: 'customer' | 'support'
  senderName?: string
}

interface Ticket {
  id: string | number
  title: string
  status: string
  priority: string
  category: string
  categoryName?: string
  content: string
  createdAt: string
  updatedAt: string
  replies?: any[]
  relatedOrders?: any[]
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  OPEN: { label: 'Đang mở', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  PENDING: { label: 'Chờ xử lý', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  RESOLVED: { label: 'Đã giải quyết', color: 'text-green-600', bgColor: 'bg-green-100' },
  CANCELLED: { label: 'Đã đóng', color: 'text-gray-600', bgColor: 'bg-gray-100' }
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Thấp', color: 'text-gray-600' },
  MEDIUM: { label: 'Trung bình', color: 'text-blue-600' },
  HIGH: { label: 'Cao', color: 'text-orange-600' },
  URGENT: { label: 'Khẩn cấp', color: 'text-red-600' }
}

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [existingRating, setExistingRating] = useState<any>(null)
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/support/tickets/' + params.id)
      return
    }
    loadTicket()
    loadRating()

    // Auto refresh mỗi 10 giây để cập nhật trạng thái và phản hồi mới
    const interval = setInterval(() => {
      refreshTicket()
    }, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated, params.id])

  useEffect(() => {
    scrollToBottom()
  }, [ticket?.replies])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadRating = async () => {
    try {
      const res = await supportApi.getTicketRating(params.id)
      if (res.success && res.data) {
        setExistingRating(res.data)
      }
    } catch (error) {
      console.error('Error loading rating:', error)
    }
  }

  const handleSubmitRating = async () => {
    setSubmittingRating(true)
    try {
      const res = await supportApi.rateTicket(params.id, { rating, comment: ratingComment })
      if (res.success) {
        toast.success('Cảm ơn bạn đã đánh giá!')
        setShowRatingModal(false)
        setExistingRating(res.data)
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi đánh giá')
    } finally {
      setSubmittingRating(false)
    }
  }

  const refreshTicket = async () => {
    try {
      const res = await supportApi.getById(params.id)
      if (res.success) {
        setTicket(res.data)
      }
    } catch (error) {
      console.error('Error refreshing ticket:', error)
    }
  }

  const loadTicket = async () => {
    setLoading(true)
    try {
      const res = await supportApi.getById(params.id)
      if (res.success) {
        setTicket(res.data)
      } else {
        toast.error('Không tìm thấy ticket')
        router.push('/support/tickets')
      }
    } catch (error) {
      console.error('Error loading ticket:', error)
      toast.error('Không thể tải thông tin ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSending(true)
    try {
      const res = await supportApi.replyTicket(params.id, { content: replyContent })
      if (res.success) {
        setReplyContent('')
        loadTicket()
        toast.success('Đã gửi phản hồi')
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi phản hồi')
    } finally {
      setSending(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!confirm('Bạn có chắc muốn đóng ticket này?')) return

    try {
      const res = await supportApi.closeTicket(params.id)
      if (res.success) {
        toast.success('Đã đóng ticket')
        loadTicket()
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể đóng ticket')
    }
  }

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

  if (!isAuthenticated) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Không tìm thấy ticket</p>
          <Link href="/support/tickets" className="text-blue-600 hover:underline mt-2 inline-block">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[ticket.status] || statusConfig.PENDING
  const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM
  const isOpen = ticket.status !== 'CANCELLED' && ticket.status !== 'RESOLVED'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/support/tickets" className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span>Ticket #{ticket.id}</span>
              <span>•</span>
              <span className={`${status.bgColor} ${status.color} px-2 py-0.5 rounded-full text-xs font-medium`}>
                {status.label}
              </span>
              <span className={`${priority.color} text-xs font-medium`}>
                Ưu tiên: {priority.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
          </div>
          {isOpen && (
            <button
              onClick={handleCloseTicket}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FiX className="w-4 h-4" />
              Đóng ticket
            </button>
          )}
        </div>

        {/* Ticket Info */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FiClock className="w-4 h-4" />
                Tạo lúc: {formatDate(ticket.createdAt)}
              </span>
              {(ticket.categoryName || ticket.category) && (
                <span className="flex items-center gap-1">
                  <span className="text-gray-600 font-medium">Danh mục:</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                    {ticket.categoryName || ticket.category}
                  </span>
                </span>
              )}
            </div>
            {ticket.relatedOrders && ticket.relatedOrders.length > 0 && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600 font-medium">Đơn hàng liên quan:</span>{' '}
                {ticket.relatedOrders.map((order: any, idx: number) => (
                  <span key={idx} className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium mr-1">
                    {order.orderCode || `#${order.id}`}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.content}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FiMessageCircle className="w-5 h-5" />
              Trao đổi ({ticket.replies?.length || 0})
            </h2>
          </div>
          
          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {(!ticket.replies || ticket.replies.length === 0) ? (
              <p className="text-center text-gray-500 py-8">Chưa có phản hồi nào</p>
            ) : (
              ticket.replies.map((msg: any, index: number) => (
                <div
                  key={msg.id || index}
                  className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.senderType === 'customer' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${msg.senderType === 'customer' ? 'justify-end' : ''}`}>
                      {msg.senderType === 'employee' ? (
                        <FiHeadphones className="w-4 h-4 text-blue-600" />
                      ) : (
                        <FiUser className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-500">
                        {msg.senderName || (msg.senderType === 'employee' ? 'Hỗ trợ viên' : 'Bạn')}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        msg.senderType === 'customer'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Rating Section - Hiển thị khi đã đóng */}
        {!isOpen && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            {existingRating ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Đánh giá của bạn</h3>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`w-5 h-5 ${star <= existingRating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({existingRating.rating}/5)</span>
                </div>
                {existingRating.comment && (
                  <p className="text-gray-600 text-sm">{existingRating.comment}</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-3">Bạn có hài lòng với dịch vụ hỗ trợ?</p>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <FiStar className="w-4 h-4" />
                  Đánh giá phiếu hỗ trợ
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reply Form */}
        {isOpen ? (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <form onSubmit={handleSendReply}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Nhập nội dung phản hồi..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !replyContent.trim()}
                  className="btn-primary self-end flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend className="w-4 h-4" />
                  {sending ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <FiCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">Ticket này đã được đóng</p>
            <Link
              href="/support/tickets"
              className="text-blue-600 hover:underline text-sm mt-2 inline-block"
            >
              Tạo ticket mới nếu bạn cần hỗ trợ thêm
            </Link>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Đánh giá dịch vụ hỗ trợ</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Mức độ hài lòng của bạn:</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <FiStar
                        className={`w-8 h-8 transition-colors ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Nhận xét (tùy chọn):</label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {submittingRating ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
