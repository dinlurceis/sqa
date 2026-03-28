'use client'

import { useState } from 'react'
import { FiStar, FiX, FiSend } from 'react-icons/fi'
import { reviewApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  productId: number
  productName: string
  orderId: number
  orderCode: string
  onSuccess?: () => void
  onClose?: () => void
}

export default function ReviewForm({
  productId,
  productName,
  orderId,
  orderCode,
  onSuccess,
  onClose
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá')
      return
    }

    setSubmitting(true)
    try {
      const response = await reviewApi.createReview({
        productId,
        orderId,
        rating,
        comment: comment.trim() || undefined
      })

      if (response.success) {
        toast.success('Đánh giá thành công!')
        onSuccess?.()
        onClose?.()
      } else {
        toast.error(response.message || 'Không thể gửi đánh giá')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi gửi đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingText = (r: number) => {
    switch (r) {
      case 1: return 'Rất tệ'
      case 2: return 'Tệ'
      case 3: return 'Bình thường'
      case 4: return 'Tốt'
      case 5: return 'Tuyệt vời'
      default: return 'Chọn đánh giá'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Đánh giá sản phẩm</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="font-medium text-gray-900">{productName}</p>
        <p className="text-sm text-gray-500">Đơn hàng: {orderCode}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Star Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Đánh giá của bạn <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <FiStar
                    size={32}
                    className={`transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className={`text-sm font-medium ${
              (hoverRating || rating) > 0 ? 'text-yellow-600' : 'text-gray-500'
            }`}>
              {getRatingText(hoverRating || rating)}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhận xét (không bắt buộc)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {comment.length}/500 ký tự
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <FiSend size={18} />
                <span>Gửi đánh giá</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
