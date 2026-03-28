'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FiArrowLeft, FiEdit, FiPackage, FiTruck, FiCalendar, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

interface WarehouseProduct {
  id: number
  sku: string
  internalName: string
  description: string
  techSpecsJson: string
  supplier: {
    id: number
    name: string
    taxCode: string
    phone: string
    email: string
  }
  lastImportDate: string
}

export default function WarehouseProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { employee } = useAuthStore()
  const [product, setProduct] = useState<WarehouseProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [specs, setSpecs] = useState<any>({})

  const canEdit = hasPermission(employee?.position as Position, 'products.edit')

  useEffect(() => {
    if (employee && params.id) {
      fetchProduct()
    }
    
    return () => {
      setProduct(null)
      setSpecs({})
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
        setProduct(data.data)
        
        // Parse tech specs
        if (data.data.techSpecsJson) {
          try {
            const parsed = JSON.parse(data.data.techSpecsJson)
            setSpecs(parsed)
          } catch (e) {
            console.error('Error parsing tech specs:', e)
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Không tìm thấy sản phẩm</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Quay lại</span>
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.internalName}</h1>
            <p className="text-gray-600 mt-1">SKU: {product.sku}</p>
          </div>
          
          {canEdit && (
            <button
              onClick={() => router.push(`/employee/warehouse/products/${product.id}/edit`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <FiEdit /> Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiPackage className="text-blue-600" />
              Thông tin cơ bản
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">SKU</label>
                <p className="text-gray-900 font-mono">{product.sku}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Tên sản phẩm</label>
                <p className="text-gray-900">{product.internalName}</p>
              </div>
              
              {product.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Mô tả</label>
                  <p className="text-gray-900">{product.description}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Nhập kho gần nhất
                </label>
                <p className="text-gray-900">
                  {new Date(product.lastImportDate).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          {Object.keys(specs).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiFileText className="text-blue-600" />
                Thông số kỹ thuật
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-2">
                    <label className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <p className="text-gray-900">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Info */}
          {product.supplier && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiTruck className="text-blue-600" />
                Nhà cung cấp
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tên công ty</label>
                  <p className="text-gray-900">{product.supplier.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Mã số thuế</label>
                  <p className="text-gray-900 font-mono">{product.supplier.taxCode}</p>
                </div>
                
                {product.supplier.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Số điện thoại</label>
                    <p className="text-gray-900">{product.supplier.phone}</p>
                  </div>
                )}
                
                {product.supplier.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{product.supplier.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
