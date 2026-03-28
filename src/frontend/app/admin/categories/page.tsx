'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiPlus, FiEdit, FiTrash2, FiFolder, FiFolderPlus, FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { categoryApi } from '@/lib/api'

export default function CategoriesManagementPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    displayOrder: 0,
    active: true,
    parentId: null as number | null
  })

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'PRODUCT_MANAGER') {
      toast.error('Bạn không có quyền truy cập')
      router.push('/')
      return
    }

    loadCategories()
  }, [isAuthenticated, user, router])

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getCategoriesTree()
      console.log('Categories:', response)
      
      if (response.success && Array.isArray(response.data)) {
        setCategories(response.data)
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Lỗi khi tải danh mục')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      displayOrder: 0,
      active: true,
      parentId: null
    })
    setShowModal(true)
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      displayOrder: category.displayOrder || 0,
      active: category.active !== false,
      parentId: category.parentId || null
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingCategory) {
        // Update
        const response = await categoryApi.update(editingCategory.id, formData)
        if (response.success) {
          toast.success('Cập nhật danh mục thành công')
          setShowModal(false)
          loadCategories()
        }
      } else {
        // Create
        const response = await categoryApi.create(formData)
        if (response.success) {
          toast.success('Tạo danh mục thành công')
          setShowModal(false)
          loadCategories()
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) return

    try {
      const response = await categoryApi.delete(id)
      if (response.success) {
        toast.success('Xóa danh mục thành công')
        loadCategories()
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xóa danh mục')
    }
  }

  const renderCategory = (category: any, level: number = 0) => {
    return (
      <div key={category.id}>
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 border-b">
          <div className="flex items-center space-x-3" style={{ paddingLeft: `${level * 2}rem` }}>
            {level > 0 ? <FiFolder className="text-gray-400" /> : <FiFolderPlus className="text-blue-500" />}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{category.name}</span>
                {category.slug && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    /{category.slug}
                  </span>
                )}
                {category.active === false && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded flex items-center">
                    <FiEyeOff className="mr-1" size={12} />
                    Ẩn
                  </span>
                )}
              </div>
              {category.description && (
                <div className="text-sm text-gray-500 mt-1">{category.description}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {category.productCount || 0} sản phẩm
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(category)}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
            >
              <FiEdit size={18} />
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => handleDelete(category.id, category.name)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <FiTrash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Render children */}
        {category.children && category.children.length > 0 && (
          <div>
            {category.children.map((child: any) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
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
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-red-500">Trang chủ</Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-red-500">Quản trị</Link>
          <span>/</span>
          <span className="text-gray-900">Quản lý danh mục</span>
        </nav>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Quản lý danh mục</h1>
            <p className="text-gray-600 mt-1">{categories.length} danh mục</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            <FiPlus />
            <span>Thêm danh mục</span>
          </button>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <FiFolder size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có danh mục nào
              </h3>
              <p className="text-gray-600 mb-6">
                Tạo danh mục đầu tiên để phân loại sản phẩm
              </p>
              <button
                onClick={handleCreate}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
              >
                Tạo danh mục đầu tiên
              </button>
            </div>
          ) : (
            <div>
              {categories.map(category => renderCategory(category))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tên danh mục <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Slug (URL)
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="vd: dien-thoai (để trống để tự động tạo)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Danh mục cha
                      </label>
                      <select
                        value={formData.parentId || ''}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Không có (Danh mục gốc)</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id} disabled={editingCategory?.id === cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        URL hình ảnh
                      </label>
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Thứ tự hiển thị
                        </label>
                        <input
                          type="number"
                          value={formData.displayOrder}
                          onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Trạng thái
                        </label>
                        <select
                          value={formData.active ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="true">Hiển thị</option>
                          <option value="false">Ẩn</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      {editingCategory ? 'Cập nhật' : 'Tạo mới'}
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
