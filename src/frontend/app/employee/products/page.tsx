'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiPackage, FiSearch, FiEdit, FiEye, FiX, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { productApi } from '@/lib/api'
import { hasPermission, type Position } from '@/lib/permissions'
import MultiImageUpload from '@/components/MultiImageUpload'

export default function EmployeeProductsPage() {
  const router = useRouter()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const categoryIdFromUrl = searchParams?.get('category') ? Number(searchParams.get('category')) : null
  const { user, employee, isAuthenticated } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: null as number | null
  })
  const [productImages, setProductImages] = useState<any[]>([])
  const [originalImages, setOriginalImages] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(categoryIdFromUrl)

  const canCreate = hasPermission(employee?.position as Position, 'products.create')
  const canEdit = hasPermission(employee?.position as Position, 'products.edit')

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    if (user?.role !== 'EMPLOYEE' && user?.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập')
      router.push('/')
      return
    }

    loadProducts()
    loadCategories()
  }, [isHydrated, isAuthenticated, user, router])

  const loadProducts = async () => {
    try {
      const response = await productApi.getAll()
      setProducts(response.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Lỗi khi tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleEdit = async (product: any) => {
    if (!canEdit) {
      toast.error('Bạn không có quyền chỉnh sửa sản phẩm')
      return
    }

    setEditingProduct(product)
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      categoryId: product.categoryId || null
    })
    
    try {
      const response = await productApi.getProductImages(product.id)
      if (response.success && response.data) {
        setProductImages([...response.data])
        setOriginalImages([...response.data])
      } else {
        setProductImages([])
        setOriginalImages([])
      }
    } catch (error) {
      console.error('Error loading product images:', error)
      setProductImages([])
      setOriginalImages([])
    }
    
    setShowEditModal(true)
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editForm.name || !editForm.price) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      const updateData = {
        ...editForm,
        category: editForm.categoryId ? { id: editForm.categoryId } : null
      }
      const response = await productApi.update(editingProduct.id, updateData)
      if (!response.success) {
        toast.error(response.message || 'Có lỗi xảy ra')
        return
      }

      // Xử lý ảnh
      const imagesToDelete = originalImages.filter((original: any) => 
        !productImages.find((img: any) => img.id === original.id)
      )
      
      for (const img of imagesToDelete) {
        if (img.id) {
          await productApi.deleteProductImage(img.id)
        }
      }
      
      const newImages = productImages.filter((img: any) => !img.id)
      
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i]
        const isPrimary = originalImages.length === 0 && i === 0
        await productApi.addProductImage(editingProduct.id, img.imageUrl, isPrimary)
      }

      toast.success('Cập nhật sản phẩm thành công!')
      setShowEditModal(false)
      setProductImages([])
      setOriginalImages([])
      loadProducts()
    } catch (error: any) {
      console.error('Error updating product:', error)
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật sản phẩm')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === null || product.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getProductCountByCategory = (categoryId: number) => {
    return products.filter(p => p.categoryId === categoryId).length
  }

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sản phẩm đã đăng</h1>
          {canCreate && (
            <Link
              href="/employee/products/publish"
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Đăng bán sản phẩm mới
            </Link>
          )}
        </div>

        {!canCreate && !canEdit && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FiFileText className="text-blue-500 mt-0.5 mr-3" size={20} />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Quyền hạn của bạn</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Bạn chỉ có quyền xem danh sách sản phẩm, không thể thêm hoặc chỉnh sửa.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({products.length})
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({getProductCountByCategory(category.id)})
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FiPackage size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có sản phẩm nào</h3>
            <p className="text-gray-600 mb-6">Bắt đầu đăng bán sản phẩm từ kho</p>
            {canCreate && (
              <Link
                href="/employee/products/publish"
                className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                Đăng bán sản phẩm
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.categoryName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.active ? 'Đang bán' : 'Tạm ngưng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-blue-500 hover:text-blue-600 mr-3"
                        >
                          <FiEye className="inline" /> Xem
                        </Link>
                        {canEdit && (
                          <button 
                            onClick={() => handleEdit(product)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <FiEdit className="inline" /> Sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Sửa sản phẩm</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setProductImages([])
                      setOriginalImages([])
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmitEdit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên sản phẩm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá bán <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục
                      </label>
                      <select
                        value={editForm.categoryId || ''}
                        onChange={(e) => setEditForm({...editForm, categoryId: e.target.value ? Number(e.target.value) : null})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hình ảnh sản phẩm
                      </label>
                      <MultiImageUpload
                        productId={editingProduct?.id}
                        images={productImages}
                        onChange={setProductImages}
                        maxImages={9}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false)
                        setProductImages([])
                        setOriginalImages([])
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Cập nhật
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
