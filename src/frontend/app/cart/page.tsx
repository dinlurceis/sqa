'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiTrash2, FiShoppingCart, FiArrowLeft, FiCheck, FiSquare, FiCheckSquare } from 'react-icons/fi'
import { cartApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  useEffect(() => {
    console.log('Cart page - isAuthenticated:', isAuthenticated)
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login')
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }
    
    console.log('Loading cart...')
    loadCart()
  }, [isAuthenticated])

  const loadCart = async () => {
    try {
      const response = await cartApi.getCart()
      console.log('Cart API response:', response)
      console.log('Cart data:', response.data)
      
      if (response.success) {
        setCart(response.data)
        // Mặc định chọn tất cả sản phẩm
        if (response.data?.items) {
          setSelectedItems(response.data.items.map((item: any) => item.itemId))
        }
      } else {
        console.warn('Cart API returned success=false')
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle chọn 1 sản phẩm
  const toggleSelectItem = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // Chọn/bỏ chọn tất cả
  const toggleSelectAll = () => {
    if (!cart?.items) return
    if (selectedItems.length === cart.items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cart.items.map((item: any) => item.itemId))
    }
  }

  // Kiểm tra đã chọn tất cả chưa
  const isAllSelected = cart?.items && selectedItems.length === cart.items.length

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return
    
    try {
      const response = await cartApi.updateCartItem(itemId, newQuantity)
      if (response.success) {
        loadCart()
        toast.success('Đã cập nhật số lượng')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật')
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    console.log('🗑️ Attempting to remove item:', itemId)
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return
    
    try {
      console.log('📤 Calling removeCartItem API...')
      const response = await cartApi.removeCartItem(itemId)
      console.log('📥 Remove response:', response)
      
      if (response.success) {
        console.log('✅ Remove successful, reloading cart...')
        await loadCart()
        console.log('✅ Cart reloaded')
        toast.success('Đã xóa sản phẩm')
      } else {
        console.error('❌ Remove failed:', response.message)
        toast.error(response.message || 'Không thể xóa sản phẩm')
      }
    } catch (error: any) {
      console.error('❌ Error removing item:', error)
      toast.error(error.message || 'Lỗi khi xóa')
    }
  }

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm')
      return
    }
    // Lưu danh sách item đã chọn vào sessionStorage
    sessionStorage.setItem('selectedCartItems', JSON.stringify(selectedItems))
    router.push('/checkout')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const calculateTotal = () => {
    if (!cart?.items) return 0
    // Chỉ tính tổng các sản phẩm đã chọn
    return cart.items
      .filter((item: any) => selectedItems.includes(item.itemId))
      .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  }

  // Đếm số sản phẩm đã chọn
  const selectedCount = selectedItems.length

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

  const isEmpty = !cart?.items || cart.items.length === 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700">
            <FiArrowLeft className="mr-2" />
            Tiếp tục mua sắm
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng của bạn</h1>

        {isEmpty ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FiShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Giỏ hàng trống</h3>
            <p className="text-gray-600 mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Select All */}
              <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center text-gray-700 hover:text-blue-600"
                >
                  {isAllSelected ? (
                    <FiCheckSquare size={24} className="text-blue-600 mr-3" />
                  ) : (
                    <FiSquare size={24} className="mr-3" />
                  )}
                  <span className="font-medium">
                    Chọn tất cả ({cart.items.length} sản phẩm)
                  </span>
                </button>
              </div>

              {cart.items.map((item: any) => (
                <div key={item.itemId} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelectItem(item.itemId)}
                      className="flex-shrink-0"
                    >
                      {selectedItems.includes(item.itemId) ? (
                        <FiCheckSquare size={24} className="text-blue-600" />
                      ) : (
                        <FiSquare size={24} className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    {/* Image */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.productImage ? (
                        <img 
                          src={item.productImage} 
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiShoppingCart size={32} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <Link 
                        href={`/products/${item.productId}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {item.productName || 'Sản phẩm'}
                      </Link>
                      {item.productSku && (
                        <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                      )}
                      <p className="text-red-600 font-bold mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.itemId, parseInt(e.target.value) || 1)}
                        className="w-16 text-center border border-gray-300 rounded py-1"
                      />
                      <button
                        onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right w-32">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveItem(item.itemId)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Đã chọn</span>
                    <span>{selectedCount} sản phẩm</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-red-600">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={selectedCount === 0}
                  className={`w-full py-3 rounded-lg transition-colors font-semibold ${
                    selectedCount === 0 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {selectedCount === 0 ? 'Chọn sản phẩm để thanh toán' : `Thanh toán (${selectedCount})`}
                </button>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p className="flex items-center">
                    <span className="mr-2">✓</span>
                    Miễn phí vận chuyển nội thành Hà Nội
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2">✓</span>
                    Thanh toán khi nhận hàng
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
