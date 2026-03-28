'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiEye, FiEdit, FiFileText } from 'react-icons/fi'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

interface WarehouseProduct {
  id: number
  sku: string
  internalName: string
  description: string
  supplierName: string
  lastImportDate: string
  totalStock: number
}

export default function EmployeeWarehouseProductsPage() {
  const router = useRouter()
  const { employee } = useAuthStore()
  const [products, setProducts] = useState<WarehouseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Warehouse staff can VIEW products, but only PRODUCT_MANAGER can create/edit
  const canCreate = hasPermission(employee?.position as Position, 'products.create')
  const canEdit = hasPermission(employee?.position as Position, 'products.edit')

  useEffect(() => {
    if (employee) {
      fetchProducts()
    }
    
    return () => {
      setProducts([])
    }
  }, [employee])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const res = await fetch('http://localhost:8080/api/inventory/warehouse-products', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.internalName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sản Phẩm Kho</h1>
          <p className="text-gray-600 mt-1">Quản lý danh mục sản phẩm trong kho</p>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push('/employee/warehouse/products/create')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FiPlus /> Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Permission Notice */}
      {!canCreate && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <FiFileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Quyền hạn của bạn</p>
            <p className="text-sm text-blue-600 mt-1">
              {employee?.position === 'WAREHOUSE' 
                ? 'Bạn có thể xem danh sách sản phẩm kho. Chỉ Quản lý sản phẩm mới có quyền tạo và chỉnh sửa sản phẩm.'
                : 'Bạn có thể xem danh sách sản phẩm kho, nhưng không thể thêm hoặc chỉnh sửa. Liên hệ Quản lý sản phẩm nếu cần hỗ trợ.'}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm theo SKU hoặc tên sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhập gần nhất</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{product.sku}</td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{product.internalName}</div>
                    <div className="text-sm text-gray-500">{product.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{product.supplierName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-semibold">{product.totalStock}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(product.lastImportDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/employee/warehouse/products/${product.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Xem chi tiết"
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => router.push(`/employee/warehouse/products/${product.id}/edit`)}
                        className="text-green-600 hover:text-green-800"
                        title="Chỉnh sửa"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
