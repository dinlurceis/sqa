'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiShoppingCart, FiHeart, FiStar, FiSearch, FiMenu } from 'react-icons/fi'
import { productApi, categoryApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getAll(),
        categoryApi.getActiveCategories()
      ])

      if (productsRes.success && Array.isArray(productsRes.data)) {
        setProducts(productsRes.data)
      }

      if (categoriesRes.success && Array.isArray(categoriesRes.data)) {
        setCategories(categoriesRes.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
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

  const filteredProducts = products.filter(product => {
    const matchSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = !selectedCategory || product.categoryId?.toString() === selectedCategory
    return matchSearch && matchCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50">

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Danh mục</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    !selectedCategory ? 'bg-red-50 text-red-600 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  Tất cả sản phẩm
                </button>
                {categories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => setSelectedCategory(category.id.toString())}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id.toString()
                          ? 'bg-red-50 text-red-600 font-medium'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {category.name}
                      {category.productCount > 0 && (
                        <span className="ml-2 text-xs text-gray-500">({category.productCount})</span>
                      )}
                    </button>
                    {category.children && category.children.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {category.children.map((child: any) => (
                          <button
                            key={child.id}
                            onClick={() => setSelectedCategory(child.id.toString())}
                            className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                              selectedCategory === child.id.toString()
                                ? 'bg-red-50 text-red-600 font-medium'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {child.name}
                            {child.productCount > 0 && (
                              <span className="ml-2 text-xs text-gray-500">({child.productCount})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold">
                {selectedCategory
                  ? categories.find(c => c.id.toString() === selectedCategory)?.name || 'Sản phẩm'
                  : 'Tất cả sản phẩm'}
              </h1>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                <option>Mới nhất</option>
                <option>Giá tăng dần</option>
                <option>Giá giảm dần</option>
                <option>Bán chạy</option>
              </select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600">Không tìm thấy sản phẩm nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    <div className="relative aspect-square bg-gray-100">
                      {(product.imageUrl || (product.images && product.images.length > 0)) ? (
                        <img
                          src={product.imageUrl || product.images?.[0]?.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiHeart className="text-gray-600 hover:text-red-500" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm mb-2 line-clamp-2 h-10">
                        {product.name}
                      </h3>
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} size={14} fill="currentColor" />
                          ))}
                        </div>
                        <span className="ml-2 text-xs text-gray-500">(0)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-600 font-bold">
                          {formatPrice(product.price || 0)}
                        </span>
                        {(product.availableQuantity !== undefined ? product.availableQuantity : product.stockQuantity) > 0 ? (
                          <span className="text-xs text-green-600">Còn hàng</span>
                        ) : (
                          <span className="text-xs text-red-600">Hết hàng</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
