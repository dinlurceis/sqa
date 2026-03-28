'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { FiShoppingCart, FiHeart, FiStar, FiCheck, FiTruck, FiShield, FiRefreshCw } from 'react-icons/fi'
import { productApi, reviewApi } from '@/lib/api'
import toast from 'react-hot-toast'
import ProductReviews from '@/components/product/ProductReviews'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description')
  const [ratingSummary, setRatingSummary] = useState<any>(null)

  useEffect(() => {
    loadProduct()
  }, [productId])

  const loadProduct = async () => {
    try {
      const [productRes, summaryRes] = await Promise.all([
        productApi.getById(productId),
        reviewApi.getProductSummary(Number(productId))
      ])
      
      if (productRes.success) {
        setProduct(productRes.data)
      } else {
        toast.error('Không tìm thấy sản phẩm')
        router.push('/products')
      }
      
      if (summaryRes.success) {
        setRatingSummary(summaryRes.data)
      }
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Lỗi khi tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng')
        router.push('/login')
        return
      }

      const response = await fetch('http://localhost:8080/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Đã thêm vào giỏ hàng!')
      } else {
        toast.error(data.message || 'Không thể thêm vào giỏ hàng')
      }
    } catch (error) {
      console.error('Add to cart error:', error)
      toast.error('Lỗi khi thêm vào giỏ hàng')
    }
  }

  const handleBuyNow = () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      toast.error('Vui lòng đăng nhập để mua hàng')
      router.push('/login')
      return
    }

    // Chuyển thẳng đến trang thanh toán với thông tin sản phẩm
    const orderData = {
      items: [{
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        imageUrl: product.images && product.images.length > 0 ? product.images[0].imageUrl : ''
      }],
      total: product.price * quantity
    }
    
    // Lưu vào sessionStorage để dùng ở trang checkout
    sessionStorage.setItem('quickBuyOrder', JSON.stringify(orderData))
    
    // Chuyển đến trang thanh toán
    router.push('/checkout?type=quick')
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy sản phẩm</p>
          <Link href="/products" className="mt-4 text-blue-600 hover:underline">
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    )
  }

  // Parse specifications
  let specifications = {}
  try {
    if (product.techSpecsJson) {
      specifications = typeof product.techSpecsJson === 'string' 
        ? JSON.parse(product.techSpecsJson) 
        : product.techSpecsJson
    } else if (product.specifications) {
      specifications = product.specifications
    }
  } catch (e) {
    console.error('Error parsing specifications:', e)
  }

  // Lấy danh sách ảnh từ product.images, nếu không có thì dùng mảng rỗng
  const images = product.images && product.images.length > 0 
    ? product.images.map((img: any) => img.imageUrl) 
    : []

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-600">Sản phẩm</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Images */}
          <div className="bg-white rounded-lg p-6">
            <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {images.length > 0 ? (
                <img 
                  src={images[selectedImage]} 
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <FiShoppingCart size={64} className="mx-auto mb-2" />
                  <p>Không có hình ảnh</p>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar 
                    key={star} 
                    className={`${
                      ratingSummary && star <= Math.round(ratingSummary.averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`} 
                    size={20} 
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {ratingSummary ? (
                  <>
                    <span className="font-medium text-yellow-600">{ratingSummary.averageRating?.toFixed(1) || '0'}</span>
                    {' '}({ratingSummary.totalReviews || 0} đánh giá)
                  </>
                ) : (
                  '(0 đánh giá)'
                )}
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="text-4xl font-bold text-red-600 mb-2">
                {formatPrice(product.price)}
              </div>
              <div className="flex items-center space-x-2">
                {(product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0) > 0 ? (
                  <>
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                      Còn hàng
                    </span>
                    <span className="text-gray-600">
                      Còn {product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0} sản phẩm
                    </span>
                  </>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                    Hết hàng
                  </span>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    max={product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      const maxStock = product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0;
                      setQuantity(Math.min(val, maxStock));
                    }}
                    className="w-16 text-center border-x border-gray-300 py-2"
                  />
                  <button
                    onClick={() => {
                      const maxStock = product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0;
                      setQuantity(Math.min(quantity + 1, maxStock));
                    }}
                    disabled={quantity >= (product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0)}
                    className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={(product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0) <= 0}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <FiShoppingCart size={20} />
                <span>{(product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0) <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={(product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0) <= 0}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {(product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity || 0) <= 0 ? 'Hết hàng' : 'Mua ngay'}
              </button>
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FiHeart size={24} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="flex items-center space-x-3">
                <FiTruck className="text-blue-600" size={24} />
                <div>
                  <p className="font-medium">Miễn phí vận chuyển</p>
                  <p className="text-sm text-gray-600">Đơn từ 500k</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiShield className="text-green-600" size={24} />
                <div>
                  <p className="font-medium">Bảo hành chính hãng</p>
                  <p className="text-sm text-gray-600">12 tháng</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiRefreshCw className="text-purple-600" size={24} />
                <div>
                  <p className="font-medium">Đổi trả 7 ngày</p>
                  <p className="text-sm text-gray-600">Miễn phí</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheck className="text-orange-600" size={24} />
                <div>
                  <p className="font-medium">Hàng chính hãng</p>
                  <p className="text-sm text-gray-600">100%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg p-6">
          <div className="border-b mb-6">
            <div className="flex space-x-8">
              <button 
                onClick={() => setActiveTab('description')}
                className={`pb-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'description' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Mô tả sản phẩm
              </button>
              <button 
                onClick={() => setActiveTab('specs')}
                className={`pb-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'specs' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Thông số kỹ thuật
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'reviews' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Đánh giá ({ratingSummary?.reviewCount || 0})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Mô tả sản phẩm</h2>
                <div className="prose max-w-none text-gray-700">
                  {product.description || 'Chưa có mô tả chi tiết'}
                </div>
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specs' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Thông số kỹ thuật</h2>
                {Object.keys(specifications).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <tbody>
                        {Object.entries(specifications).map(([key, value]: [string, any], index) => (
                          <tr 
                            key={key} 
                            className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                          >
                            <td className="px-6 py-4 font-medium text-gray-700 border border-gray-200 w-1/3">
                              {key}
                            </td>
                            <td className="px-6 py-4 text-gray-900 border border-gray-200">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">Chưa có thông số kỹ thuật</p>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <ProductReviews productId={Number(productId)} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
