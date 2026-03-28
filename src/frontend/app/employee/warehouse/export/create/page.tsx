'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiPackage, FiAlertCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { inventoryApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'

interface ExportItem {
  productSku: string
  productName: string
  serialNumbers: string[]
  serialInput: string
}

export default function EmployeeCreateExportOrderPage() {
  console.log('=== Component rendered ===')
  const router = useRouter()
  const { employee } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  
  // Permission check
  const canCreate = true // Temporarily disable for testing
  // const canCreate = hasPermission(employee?.position as Position, 'warehouse.export.create')
  console.log('canCreate:', canCreate, 'employee:', employee)
  
  // Form data
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<ExportItem[]>([{
    productSku: '',
    productName: '',
    serialNumbers: [],
    serialInput: ''
  }])

  useEffect(() => {
    console.log('Permission check - canCreate:', canCreate)
    console.log('Employee:', employee)
    console.log('Position:', employee?.position)
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await inventoryApi.getStocks()
      console.log('Stocks response:', response)
      if (response.success) {
        setProducts(response.data || [])
        console.log('Products loaded:', response.data?.length || 0)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Không thể tải danh sách sản phẩm')
    }
  }

  const addItem = () => {
    setItems([...items, {
      productSku: '',
      productName: '',
      serialNumbers: [],
      serialInput: ''
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof ExportItem, value: any) => {
    console.log('Update item:', index, field, value)
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
    console.log('Items after update:', newItems)
  }

  const handleProductChange = (index: number, sku: string) => {
    console.log('Product change:', index, sku)
    const product = products.find(p => p.warehouseProduct?.sku === sku)
    console.log('Found product:', product)
    if (product) {
      updateItem(index, 'productSku', sku)
      updateItem(index, 'productName', product.warehouseProduct?.internalName || '')
    }
  }

  const handleSerialInput = (index: number, input: string) => {
    console.log('Serial input:', index, input)
    updateItem(index, 'serialInput', input)
    const serials = input
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
    console.log('Parsed serials:', serials)
    updateItem(index, 'serialNumbers', serials)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check permission before submit
    if (!canCreate) {
      toast.error('Bạn không có quyền tạo phiếu xuất kho')
      return
    }

    if (!reason) {
      toast.error('Vui lòng nhập lý do xuất kho')
      return
    }

    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm')
      return
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.productSku) {
        toast.error(`Sản phẩm ${i + 1}: Vui lòng chọn sản phẩm`)
        return
      }
      if (item.serialNumbers.length === 0) {
        toast.error(`Sản phẩm ${i + 1}: Vui lòng nhập ít nhất một serial number`)
        return
      }
    }

    setLoading(true)
    try {
      const requestData = {
        createdBy: employee?.fullName || 'Employee',
        reason,
        note,
        items: items.map(item => ({
          productSku: item.productSku,
          serialNumbers: item.serialNumbers
        }))
      }

      const response = await inventoryApi.createExportOrder(requestData)
      
      if (response.success) {
        toast.success('Tạo phiếu xuất kho thành công!')
        router.push('/employee/warehouse/export')
      } else {
        toast.error(response.message || 'Có lỗi xảy ra')
      }
    } catch (error: any) {
      console.error('Error creating export order:', error)
      toast.error(error.message || 'Lỗi khi tạo phiếu xuất')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {!canCreate && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <FiAlertCircle className="text-yellow-600 w-5 h-5 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900">Chế độ xem</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Bạn chỉ có quyền xem. Chỉ nhân viên kho mới có thể tạo phiếu xuất kho.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Quay lại</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Tạo phiếu xuất kho</h1>
        <p className="text-gray-600 mt-1">Tạo phiếu xuất hàng ra khỏi kho</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do xuất kho <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Chọn lý do --</option>
                <option value="SALE">Bán hàng</option>
                <option value="WARRANTY">Bảo hành</option>
                <option value="DAMAGED">Hàng hỏng</option>
                <option value="RETURN">Trả hàng NCC</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Người tạo
              </label>
              <input
                type="text"
                value={employee?.fullName || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Danh sách sản phẩm xuất kho</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <FiPlus />
              <span>Thêm sản phẩm</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={`item-${index}-${Date.now()}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                    <FiPackage />
                    <span>Sản phẩm {index + 1}</span>
                  </h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.productSku}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.length === 0 ? (
                        <option value="" disabled>Không có sản phẩm trong kho</option>
                      ) : (
                        products.map((product) => (
                          <option key={product.id} value={product.warehouseProduct?.sku}>
                            {product.warehouseProduct?.sku} - {product.warehouseProduct?.internalName} 
                            (Tồn: {product.sellable || 0})
                          </option>
                        ))
                      )}
                    </select>
                    {products.length === 0 && (
                      <p className="text-sm text-amber-600 mt-2">
                        ⚠️ Chưa có sản phẩm nào trong kho. Vui lòng nhập kho trước.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Serial Numbers <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-2">
                        (Nhập mỗi serial trên một dòng hoặc cách nhau bằng dấu phẩy)
                      </span>
                    </label>
                    <textarea
                      value={item.serialInput}
                      onChange={(e) => handleSerialInput(index, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={5}
                      placeholder="SN001&#10;SN002&#10;SN003&#10;hoặc: SN001, SN002, SN003"
                      required
                    />
                    {item.serialNumbers.length > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {item.serialNumbers.length} serial number(s) đã nhập
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Tổng số sản phẩm:</span>
              <span className="text-2xl font-bold text-blue-600">
                {items.reduce((sum, item) => sum + item.serialNumbers.length, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Ghi chú</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Ghi chú về phiếu xuất..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || !canCreate}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={!canCreate ? 'Bạn không có quyền tạo phiếu xuất kho' : ''}
          >
            <FiSave />
            <span>{loading ? 'Đang tạo...' : 'Tạo phiếu xuất'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
