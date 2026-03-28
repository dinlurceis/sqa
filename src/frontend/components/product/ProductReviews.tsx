'use client'

import { useState, useEffect } from 'react'
import { FiStar, FiUser, FiCalendar, FiTrash2, FiCheckCircle } from 'react-icons/fi'
import { reviewApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface Review {
  id: number
  productId: number
  productName: string
  customerId: number
  customerName: string
  orderId: number | null
  orderCode: string | null
  rating: number | null
  comment: string
  isVerifiedPurchase: boolean
  createdAt: string
}

interface RatingSummary {
  averageRating: number
  reviewCount: number
  ratingDistribution?: { [key: number]: number }
}

interface ProductReviewsProps {
  productId: number
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<RatingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadReviews()
    checkAuth()
  }, [productId])

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token')
    const role = localStorage.getItem('user_role')
    setIsLoggedIn(!!token)
    setIsAdmin(role === 'ADMIN')
  }

  const loadReviews = async () => {
    try {
      const [reviewsRes, summaryRes] = await Promise.all([
        reviewApi.getByProduct(productId),
        reviewApi.getProductSummary(productId)
      ])

      if (reviewsRes.success) {
        setReviews(reviewsRes.data || [])
      }
      if (summaryRes.success) {
        setSummary(summaryRes.data)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận')
      return
    }

    setSubmitting(true)
    try {
      const response = await reviewApi.create({
        productId,
        comment: comment.trim(),
        orderId: null, // Comment thường không có orderId
        rating: null // Comment thường không có rating
      })

      if (response.success) {
        toast.success('Bình luận thành công!')
        setComment('')
        loadReviews() // Reload reviews
      } else {
        toast.error(response.message || 'Không thể gửi bình luận')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Lỗi khi gửi bình luận')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) {
      return
    }

    try {
      const response = await reviewApi.delete(reviewId)
      if (response.success) {
        toast.success('Đã xóa bình luận')
        loadReviews()
      } else {
        toast.error(response.message || 'Không thể xóa bình luận')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Lỗi khi xóa bình luận')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number | null, size: number = 16) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={size}
            className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
          />
        ))}
      </div>
    )
  }

  const filteredReviews = filterRating
    ? reviews.filter(r => r.rating === filterRating)
    : reviews

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>

      {/* Comment Form - for logged in users */}
      {isLoggedIn && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Viết bình luận của bạn</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ suy nghĩ của bạn về sản phẩm này..."
            className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={submitting}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !comment.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
            </button>
          </div>
        </div>
      )}

      {/* Rating Summary - chỉ hiển thị nếu có đánh giá với rating */}
      {summary && summary.reviewCount > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Average Rating */}
            <div className="text-center md:border-r md:pr-6">
              <div className="text-5xl font-bold text-yellow-500 mb-2">
                {summary.averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(summary.averageRating), 24)}
              <p className="text-gray-600 mt-2">{summary.reviewCount} đánh giá</p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.ratingDistribution?.[star] || 0
                const percentage = summary.reviewCount > 0 
                  ? (count / summary.reviewCount) * 100 
                  : 0
                return (
                  <button
                    key={star}
                    onClick={() => setFilterRating(filterRating === star ? null : star)}
                    className={`flex items-center w-full mb-2 hover:bg-gray-100 rounded p-1 transition-colors ${
                      filterRating === star ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <span className="w-8 text-sm text-gray-600">{star} ★</span>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full mx-2 overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm text-gray-600 text-right">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {filterRating && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setFilterRating(null)}
                className="text-blue-600 hover:underline text-sm"
              >
                ✕ Xóa bộ lọc ({filterRating} sao)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length > 0 && (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUser className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{review.customerName}</p>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          <FiCheckCircle size={12} />
                          Đã mua hàng
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <FiCalendar size={14} />
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {renderStars(review.rating, 18)}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Xóa bình luận"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-700 mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {filterRating && filteredReviews.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không có đánh giá {filterRating} sao nào
        </div>
      )}
    </div>
  )
}
