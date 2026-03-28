'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiSave, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

export default function EmployeeCreateWarehouseProductPage() {
  const router = useRouter()
  const { employee } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    sku: '',
    internalName: '',
    description: '',
    category: '',
    brand: '',
    manufacturer: '',
    unitOfMeasure: 'PIECE',
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderPoint: 0,
    standardCost: 0,
    weight: 0,
    dimensions: '',
    storageLocation: '',
    warrantyPeriod: 0,
    techSpecsJson: '{}',
    notes: ''
  })

  const canCreate = hasPermission(employee?.position as Position, 'warehouse.import.create')

  useEffect(() => {
    // Load data if needed
    
    return () => {
      setFormData({
        sku: '',
        internalName: '',
        description: '',
        category: '',
        brand: '',
        manufacturer: '',
        unitOfMeasure: 'PIECE',
        minStockLevel: 0,
        maxStockLevel: 0,
        reorderPoint: 0,
        standardCost: 0,
        weight: 0,
        dimensions: '',
        storageLocation: '',
        warrantyPeriod: 0,
        techSpecsJson: '{}',
        notes: ''
      })
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canCreate) {
      toast.error('Bạn không có quyền thêm sản phẩm kho')
      return
    }
    
    if (!formData.sku || !formData.internalName) {
      toast.error('Vui lòng nhập SKU và tên sản phẩm')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const response = await fetch('http://localhost:8080/api/inventory/warehouse-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Thêm sản phẩm kho thành công!')
        router.push('/employee/warehouse/products')
      } else {
        toast.error(result.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Lỗi khi thêm sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  if (!canCreate) {
    return null
  }

  return (
    <div className="p-6">
      {/* Warning banner for view-only users */}
      {!canCreate && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <FiFileText className="text-yellow-600 w-5 h-5 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900">Chế độ xem</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Bạn chỉ có quyền xem. Chỉ nhân viên kho mới có thể thêm sản phẩm kho.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Quay lại</span>
        </button>
        <h1 className="text-2xl font-bold">Thêm Sản Phẩm Kho</h1>
        <p className="text-gray-600 mt-1">Tạo sản phẩm mới trong hệ thống kho</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="VD: WH-LAPTOP-001"
            />
          </div>

          {/* Internal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="internalName"
              value={formData.internalName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tên sản phẩm trong kho"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="VD: Laptop, Điện thoại"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thương hiệu
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="VD: Dell, Apple"
            />
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhà sản xuất
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tên nhà sản xuất"
            />
          </div>

          {/* Unit of Measure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đơn vị tính
            </label>
            <select
              name="unitOfMeasure"
              value={formData.unitOfMeasure}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PIECE">Cái</option>
              <option value="BOX">Hộp</option>
              <option value="SET">Bộ</option>
              <option value="KG">Kg</option>
              <option value="METER">Mét</option>
            </select>
          </div>

          {/* Standard Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá vốn chuẩn (VNĐ)
            </label>
            <input
              type="number"
              name="standardCost"
              value={formData.standardCost}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Min Stock Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tồn kho tối thiểu
            </label>
            <input
              type="number"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Max Stock Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tồn kho tối đa
            </label>
            <input
              type="number"
              name="maxStockLevel"
              value={formData.maxStockLevel}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Reorder Point */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Điểm đặt hàng lại
            </label>
            <input
              type="number"
              name="reorderPoint"
              value={formData.reorderPoint}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khối lượng (gram)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kích thước (DxRxC cm)
            </label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="VD: 30x20x5"
            />
          </div>

          {/* Storage Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vị trí lưu kho
            </label>
            <input
              type="text"
              name="storageLocation"
              value={formData.storageLocation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="VD: Kệ A1, Tầng 2"
            />
          </div>

          {/* Warranty Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian bảo hành (tháng)
            </label>
            <input
              type="number"
              name="warrantyPeriod"
              value={formData.warrantyPeriod}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mô tả chi tiết sản phẩm"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ghi chú thêm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || !canCreate}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={!canCreate ? 'Bạn không có quyền thêm sản phẩm kho' : ''}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <FiSave />
                <span>Lưu sản phẩm</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
