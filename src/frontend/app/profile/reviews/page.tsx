'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiStar, FiPackage, FiCalendar, FiArrowLeft } from 'react-icons/fi'
import { reviewApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface Review {
  id: number
  productId: number
  productName: string
  customerId: number
  customerName: string
  orderId: number
  orderCode: string
  rating: number
  comment: string
  createdAt: string
}

export default function MyReviewsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }
    loadReviews()
  }, [isAuthenticated])

  const loadReviews = async () => {
    try {
      const response = await reviewApi.getMyReviews()
      if (response.success) {
        setReviews(response.data || [])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Lỗi khi tải đánh giá')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/profile"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Quay lại trang cá nhân
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Đánh giá của tôi</h1>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FiStar size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có đánh giá nào
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn chưa đánh giá sản phẩm nào. Hãy mua hàng và chia sẻ trải nghiệm của bạn!
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link 
                      href={`/products/${review.productId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {review.productName}
                    </Link>
                    <div className="flex items-center space-x-4 mt-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500 flex items-center">
                        <FiCalendar size={14} className="mr-1" />
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-700 mb-4">{review.comment}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <Link 
                    href={`/orders/${review.orderId}`}
                    className="text-sm text-gray-500 hover:text-blue-600 flex items-center"
                  >
                    <FiPackage size={14} className="mr-1" />
                    Đơn hàng: {review.orderCode}
                  </Link>
                  <Link
                    href={`/products/${review.productId}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Xem sản phẩm →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
