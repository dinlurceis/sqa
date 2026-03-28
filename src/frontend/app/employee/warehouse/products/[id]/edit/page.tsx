'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FiArrowLeft, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

interface Supplier {
  id: number
  name: string
  taxCode: string
}

interface TechSpec {
  key: string
  value: string
}

export default function EditWarehouseProductPage() {
  const router = useRouter()
  const params = useParams()
  const { employee } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  
  const [formData, setFormData] = useState({
    sku: '',
    internalName: '',
    supplierId: '',
    description: ''
  })
  
  const [techSpecs, setTechSpecs] = useState<TechSpec[]>([
    { key: '', value: '' }
  ])

  const canEdit = hasPermission(employee?.position as Position, 'products.edit')

  useEffect(() => {
    if (employee && params.id) {
      fetchProduct()
      fetchSuppliers()
    }
    
    return () => {
      setFormData({
        sku: '',
        internalName: '',
        supplierId: '',
        description: ''
      })
      setTechSpecs([{ key: '', value: '' }])
    }
  }, [params.id, employee])

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const res = await fetch(`http://localhost:8080/api/inventory/warehouse-products/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.success) {
        const product = data.data
        setFormData({
          sku: product.sku || '',
          internalName: product.internalName || '',
          supplierId: product.supplier?.id?.toString() || '',
          description: product.description || ''
        })
        
        // Parse tech specs from JSON
        if (product.techSpecsJson) {
          try {
            const parsed = JSON.parse(product.techSpecsJson)
            const specs = Object.entries(parsed).map(([key, value]) => ({
              key,
              value: String(value)
            }))
            setTechSpecs(specs.length > 0 ? specs : [{ key: '', value: '' }])
          } catch (e) {
            console.error('Error parsing tech specs:', e)
            setTechSpecs([{ key: '', value: '' }])
          }
        }
      } else {
        toast.error('Không tìm thấy sản phẩm')
        router.push('/employee/warehouse/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Lỗi khi tải thông tin sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const res = await fetch('http://localhost:8080/api/inventory/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSuppliers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const addTechSpec = () => {
    setTechSpecs([...techSpecs, { key: '', value: '' }])
  }

  const removeTechSpec = (index: number) => {
    if (techSpecs.length > 1) {
      setTechSpecs(techSpecs.filter((_, i) => i !== index))
    }
  }

  const updateTechSpec = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...techSpecs]
    newSpecs[index][field] = value
    setTechSpecs(newSpecs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.sku || !formData.internalName) {
      toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc')
      return
    }

    // Convert tech specs to JSON
    const techSpecsJson: Record<string, string> = {}
    techSpecs.forEach(spec => {
      if (spec.key && spec.value) {
        techSpecsJson[spec.key] = spec.value
      }
    })

    setSubmitting(true)
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const res = await fetch(`http://localhost:8080/api/inventory/warehouse-products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sku: formData.sku,
          internalName: formData.internalName,
          supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
          description: formData.description,
          techSpecsJson: JSON.stringify(techSpecsJson)
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('Cập nhật sản phẩm thành công!')
        router.push(`/employee/warehouse/products/${params.id}`)
      } else {
        toast.error(data.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Lỗi khi cập nhật sản phẩm')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Bạn không có quyền chỉnh sửa sản phẩm</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Quay lại</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm kho</h1>
        <p className="text-gray-600 mt-1">Cập nhật thông tin sản phẩm trong kho</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: LAPTOP-001"
              required
            />
          </div>

          {/* Internal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.internalName}
              onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: Laptop Dell XPS 13"
              required
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhà cung cấp
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn nhà cung cấp --</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} - {supplier.taxCode}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả chi tiết về sản phẩm..."
            />
          </div>

          {/* Tech Specs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Thông số kỹ thuật
              </label>
              <button
                type="button"
                onClick={addTechSpec}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <FiPlus /> Thêm thông số
              </button>
            </div>
            
            <div className="space-y-3">
              {techSpecs.map((spec, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => updateTechSpec(index, 'key', e.target.value)}
                    placeholder="Tên thông số (VD: CPU, RAM)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateTechSpec(index, 'value', e.target.value)}
                    placeholder="Giá trị (VD: Intel i7, 16GB)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {techSpecs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTechSpec(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Nhập các thông số kỹ thuật của sản phẩm. VD: CPU - Intel i7, RAM - 16GB, Storage - 512GB SSD
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <FiSave />
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
