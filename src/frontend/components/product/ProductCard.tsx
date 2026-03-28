'use client'

import Link from 'next/link'
import { FiShoppingCart, FiHeart, FiStar } from 'react-icons/fi'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useCartStore, Product } from '@/store/cartStore'
import { useTranslation } from '@/hooks/useTranslation'
import { cartApi } from '@/lib/api'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useCartStore()
  const { t } = useTranslation()
  const [isLiked, setIsLiked] = useState(isInWishlist(product.id))
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    try {
      setIsAdding(true)
      const response = await cartApi.addToCart(product.id, 1)
      
      if (response.success) {
        toast.success(t('addedToCart'))
        // Dispatch event để cập nhật cart count
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        toast.error('Không thể thêm vào giỏ hàng')
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      toast.error(error.message || 'Lỗi khi thêm vào giỏ hàng')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleLike = () => {
    if (isLiked) {
      removeFromWishlist(product.id)
      toast.success(t('removedFromWishlist'))
    } else {
      addToWishlist(product.id)
      toast.success(t('addedToWishlist'))
    }
    setIsLiked(!isLiked)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {(() => {
          // Lấy ảnh từ nhiều nguồn có thể có
          const imageUrl = product.imageUrl || 
                          product.image || 
                          (product.images && product.images.length > 0 
                            ? (product.images.find((img: any) => img.isPrimary)?.imageUrl || product.images[0]?.imageUrl)
                            : null);
          
          return imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          );
        })()}
        
        {/* Badge */}
        {product.badge && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              product.badge === 'Hot' ? 'bg-navy-500 text-white' :
              product.badge === 'Sale' ? 'bg-navy-600 text-white' :
              product.badge === 'Mới' ? 'bg-navy-700 text-white' :
              'bg-navy-500 text-white'
            }`}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Discount */}
        {product.discount && product.discount > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-navy-500 text-white px-2 py-1 text-xs font-semibold rounded-full">
              -{product.discount}%
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleToggleLike}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isLiked ? 'bg-navy-500 text-white' : 'bg-white text-gray-600'
              } shadow-md hover:shadow-lg transition-all`}
            >
              <FiHeart size={16} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 bg-navy-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-navy-600 transition-colors"
            >
              <FiShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-navy-500 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                size={14}
                className={`${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {product.rating} ({product.reviews} {t('reviews')})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-navy-500">
              {formatPrice(product.price)}
            </div>
            {product.originalPrice && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </div>
            )}
          </div>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="w-full mt-3 bg-navy-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-navy-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? 'Đang thêm...' : t('addToCart')}
        </button>
      </div>
    </div>
  )
}
