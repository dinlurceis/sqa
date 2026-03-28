'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FiHeart, FiShoppingCart, FiStar, FiShoppingBag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cartStore'
import { useTranslation } from '@/hooks/useTranslation'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart, isInWishlist } = useCartStore()
  const { t } = useTranslation()

  // Mock products data - trong thực tế sẽ fetch từ API dựa trên wishlist IDs
  const allProducts = [
    {
      id: 1,
      name: 'iPhone 16 Pro Max 256GB - Chính hãng VN/A',
      price: 29990000,
      originalPrice: 34990000,
      discount: 14,
      image: '/images/iphone-16-pro-max.jpg',
      rating: 4.8,
      reviews: 1250,
      badge: 'Hot'
    },
    {
      id: 2,
      name: 'Điện thoại Xiaomi POCO C71 4GB/128GB',
      price: 2490000,
      originalPrice: null,
      discount: 0,
      image: '/images/xiaomi-poco-c71.jpg',
      rating: 4.5,
      reviews: 890,
      badge: 'Mới'
    },
    {
      id: 3,
      name: 'Điện thoại Xiaomi POCO M6 8GB/256GB',
      price: 3990000,
      originalPrice: 5290000,
      discount: 25,
      image: '/images/xiaomi-poco-m6.jpg',
      rating: 4.6,
      reviews: 567,
      badge: 'Sale'
    },
    {
      id: 4,
      name: 'Điện thoại Xiaomi 15T 12GB/512GB',
      price: 14990000,
      originalPrice: null,
      discount: 0,
      image: '/images/xiaomi-15t.jpg',
      rating: 4.7,
      reviews: 234,
      badge: 'Hot'
    },
  ]

  // Filter products that are in wishlist
  const wishlistProducts = allProducts.filter(product => wishlist.includes(product.id))

  const handleRemoveFromWishlist = (productId: number) => {
    removeFromWishlist(productId)
    toast.success(t('removedFromWishlist'))
  }

  const handleAddToCart = (product: any) => {
    addToCart(product)
    toast.success(t('addedToCart'))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-gray-400 mb-6">
              <FiHeart size={120} className="mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('wishlistEmpty')}</h1>
            <p className="text-gray-600 mb-8">
              {t('wishlistEmptyMessage')}
            </p>
            <Link
              href="/products"
              className="bg-navy-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-navy-600 transition-colors inline-block"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-navy-500">{t('home')}</Link>
          <span>/</span>
          <span className="text-gray-900">{t('wishlist')}</span>
        </nav>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('yourWishlist')}</h1>
          <p className="text-gray-600">
            {wishlistProducts.length} {t('wishlistCount')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group">
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
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

                {/* Remove from wishlist button */}
                <button
                  onClick={() => handleRemoveFromWishlist(product.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <FiHeart size={16} fill="currentColor" />
                </button>
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
                <div className="flex items-center justify-between mb-3">
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

                {/* Action buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-navy-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-navy-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <FiShoppingCart size={16} />
                    <span>{t('addToCart')}</span>
                  </button>
                  <Link
                    href={`/products/${product.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    {t('viewDetails')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-block"
          >
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  )
}
