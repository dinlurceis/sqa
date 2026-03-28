'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiPackage, FiSearch, FiPlus, FiX, FiCheck, FiAlertCircle, FiPause, FiPlay, FiInfo } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { productApi, categoryApi } from '@/lib/api'
import MultiImageUpload from '@/components/MultiImageUpload'

export default function AdminPublishProductPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [warehouseProducts, setWarehouseProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showSpecsModal, setShowSpecsModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [publishForm, setPublishForm] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: null as number | null
  })
  const [productImages, setProductImages] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    if (user?.role !== 'ADMIN') {
      toast.error('Chỉ quản trị viên mới có quyền truy cập')
      router.push('/')
      return
    }

    loadData()
  }, [isAuthenticated, user, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getWarehouseProductsForPublish(),
        categoryApi.getAll()
      ])

      if (productsRes.success) {
        setWarehouseProducts(productsRes.data || [])
      }

      if (categoriesRes.success) {
        setCategories(categoriesRes.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product)
    setPublishForm({
      name: product.internalName || '',
      description: product.description || '',
      price: 0,
      categoryId: null
    })
    setProductImages([])
    setShowPublishModal(true)
  }

  // Hiển thị modal thông số sản phẩm
  const handleShowSpecs = (product: any) => {
    setSelectedProduct(product)
    setShowSpecsModal(true)
  }

  // Toggle trạng thái đăng bán (ngừng bán / tiếp tục bán)
  const handleToggleActive = async (product: any) => {
    const isCurrentlyActive = product.active !== false
    const action = isCurrentlyActive ? 'ngừng bán' : 'tiếp tục bán'
    
    if (!confirm(`Bạn có chắc muốn ${action} sản phẩm "${product.internalName}"?`)) {
      return
    }

    try {
      const response = await productApi.toggleActive(product.publishedProductId)
      if (response.success) {
        // Cập nhật state local thay vì load lại
        setWarehouseProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, active: !isCurrentlyActive }
            : p
        ))
        toast.success(`Đã ${action} sản phẩm`)
      } else {
        toast.error(response.message || 'Có lỗi xảy ra')
      }
    } catch (error: any) {
      console.error('Error toggling active:', error)
      toast.error(error.message || 'Lỗi khi thay đổi trạng thái')
    }
  }

  const handleSubmitPublish = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publishForm.name || !publishForm.price || !publishForm.categoryId) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (publishForm.price <= 0) {
      toast.error('Giá bán phải lớn hơn 0')
      return
    }

    try {
      setSubmitting(true)

      // 1. Đăng bán sản phẩm
      const publishData = {
        warehouseProductId: selectedProduct.id,
        name: publishForm.name,
        description: publishForm.description,
        price: publishForm.price,
        categoryId: publishForm.categoryId
      }

      const response = await productApi.createProductFromWarehouse(publishData)

      if (!response.success) {
        toast.error(response.message || 'Có lỗi xảy ra')
        return
      }

      const newProductId = response.data?.id

      // 2. Upload ảnh nếu có
      if (newProductId && productImages.length > 0) {
        for (let i = 0; i < productImages.length; i++) {
          const img = productImages[i]
          const isPrimary = i === 0 // Ảnh đầu tiên là primary
          await productApi.addProductImage(newProductId, img.imageUrl, isPrimary)
        }
      }

      toast.success('Đăng bán sản phẩm thành công!')
      setShowPublishModal(false)
      setProductImages([])
      loadData()
    } catch (error: any) {
      console.error('Error publishing product:', error)
      toast.error(error.message || 'Lỗi khi đăng bán sản phẩm')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const filteredProducts = warehouseProducts.filter(product =>
    product.internalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unpublishedProducts = filteredProducts.filter(p => !p.isPublished)
  const publishedProducts = filteredProducts.filter(p => p.isPublished)

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
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-red-500">Trang chủ</Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-red-500">Quản trị</Link>
          <span>/</span>
          <Link href="/admin/products" className="hover:text-red-500">Sản phẩm</Link>
          <span>/</span>
          <span className="text-gray-900">Đăng bán sản phẩm</span>
        </nav>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đăng bán sản phẩm từ kho</h1>
            <p className="text-gray-600 mt-1">Chọn sản phẩm từ kho để đăng bán trên website</p>
          </div>
          <Link
            href="/admin/products"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Quay lại
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng sản phẩm kho</p>
                <p className="text-2xl font-bold text-gray-900">{warehouseProducts.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPackage className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chưa đăng bán</p>
                <p className="text-2xl font-bold text-yellow-600">{unpublishedProducts.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã đăng bán</p>
                <p className="text-2xl font-bold text-green-600">{publishedProducts.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiCheck className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleShowSpecs(product)}
                        className="text-left hover:text-blue-600 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline">
                          {product.internalName}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.supplierName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        product.sellableQuantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.sellableQuantity || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.isPublished ? (
                        product.active === false ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                            Tạm ngừng
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                            Đang bán
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                          Chưa đăng bán
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {product.isPublished ? (
                        product.active === false ? (
                          <button
                            onClick={() => handleToggleActive(product)}
                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center"
                          >
                            <FiPlay className="mr-1" size={14} />
                            Tiếp tục bán
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(product)}
                            className="bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center"
                          >
                            <FiPause className="mr-1" size={14} />
                            Ngừng bán
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleSelectProduct(product)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FiPlus className="inline mr-1" />
                          Đăng bán
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <FiPackage size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
            </div>
          )}
        </div>

        {/* Publish Modal */}
        {showPublishModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Đăng bán sản phẩm</h2>
                  <button
                    onClick={() => {
                      setShowPublishModal(false)
                      setProductImages([])
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                {/* Product Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Sản phẩm từ kho</p>
                  <p className="font-semibold text-gray-900">{selectedProduct.internalName}</p>
                  <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                  <p className="text-sm text-gray-500">Tồn kho: {selectedProduct.sellableQuantity || 0}</p>
                </div>

                <form onSubmit={handleSubmitPublish}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên hiển thị <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={publishForm.name}
                        onChange={(e) => setPublishForm({...publishForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        placeholder="Tên sản phẩm hiển thị cho khách hàng"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={publishForm.description}
                        onChange={(e) => setPublishForm({...publishForm, description: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Mô tả chi tiết sản phẩm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá bán <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={publishForm.price}
                        onChange={(e) => setPublishForm({...publishForm, price: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        min="0"
                        step="1000"
                        placeholder="Nhập giá bán"
                      />
                      {publishForm.price > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatPrice(publishForm.price)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={publishForm.categoryId || ''}
                        onChange={(e) => setPublishForm({...publishForm, categoryId: e.target.value ? Number(e.target.value) : null})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
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
                        images={productImages}
                        onChange={setProductImages}
                        maxImages={9}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Ảnh đầu tiên sẽ là ảnh chính. Tối đa 9 ảnh.
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPublishModal(false)
                        setProductImages([])
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={submitting}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400"
                      disabled={submitting}
                    >
                      {submitting ? 'Đang xử lý...' : 'Đăng bán'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Specs Modal - Hiển thị thông số sản phẩm */}
        {showSpecsModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin sản phẩm</h2>
                  <button
                    onClick={() => setShowSpecsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FiInfo className="mr-2" />
                      Thông tin cơ bản
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">SKU:</span>
                        <span className="ml-2 font-mono">{selectedProduct.sku}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tên:</span>
                        <span className="ml-2">{selectedProduct.internalName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Nhà cung cấp:</span>
                        <span className="ml-2">{selectedProduct.supplierName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tồn kho:</span>
                        <span className={`ml-2 font-medium ${selectedProduct.sellableQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedProduct.sellableQuantity || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Trạng thái:</span>
                        <span className="ml-2">
                          {selectedProduct.isPublished ? (
                            selectedProduct.active === false ? (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-800">Tạm ngừng</span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800">Đang bán</span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">Chưa đăng bán</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Mô tả</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedProduct.description}</p>
                    </div>
                  )}

                  {/* Tech Specs */}
                  {selectedProduct.techSpecsJson && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Thông số kỹ thuật</h3>
                      <div className="space-y-2">
                        {(() => {
                          try {
                            const specs = JSON.parse(selectedProduct.techSpecsJson)
                            if (Array.isArray(specs)) {
                              return specs.map((spec: any, index: number) => (
                                <div key={index} className="flex justify-between text-sm border-b border-gray-200 pb-2">
                                  <span className="text-gray-500">{spec.name || spec.key}</span>
                                  <span className="text-gray-900">{spec.value}</span>
                                </div>
                              ))
                            } else if (typeof specs === 'object') {
                              return Object.entries(specs).map(([key, value], index) => (
                                <div key={index} className="flex justify-between text-sm border-b border-gray-200 pb-2">
                                  <span className="text-gray-500">{key}</span>
                                  <span className="text-gray-900">{String(value)}</span>
                                </div>
                              ))
                            }
                          } catch (e) {
                            return <p className="text-sm text-gray-500">Không thể hiển thị thông số</p>
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Specifications from DB */}
                  {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Thông số chi tiết</h3>
                      <div className="space-y-2">
                        {selectedProduct.specifications.map((spec: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm border-b border-gray-200 pb-2">
                            <span className="text-gray-500">{spec.specName}</span>
                            <span className="text-gray-900">{spec.specValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowSpecsModal(false)}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
