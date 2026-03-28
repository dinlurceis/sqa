'use client'

import { useState, useEffect } from 'react'
import { FiPackage, FiAlertCircle, FiFileText } from 'react-icons/fi'
import { useAuthStore } from '@/store/authStore'

interface InventoryStock {
  id: number
  sku: string
  productName: string
  onHand: number
  available: number
  reserved: number
  damaged: number
  sellable: number
}

export default function EmployeeWarehouseInventoryPage() {
  const { employee } = useAuthStore()
  const [stocks, setStocks] = useState<InventoryStock[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (employee) {
      fetchInventory()
    }
    
    return () => {
      setStocks([])
    }
  }, [employee])

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const res = await fetch('http://localhost:8080/api/inventory/stock', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && data.data) {
        // Map backend data to frontend interface
        const mappedStocks = data.data.map((item: any) => ({
          id: item.id,
          sku: item.warehouseProduct?.sku || 'N/A',
          productName: item.warehouseProduct?.internalName || 'Không có tên',
          onHand: item.onHand || 0,
          available: item.available || 0,
          reserved: item.reserved || 0,
          damaged: item.damaged || 0,
          sellable: item.sellable || 0
        }))
        setStocks(mappedStocks)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (stock: InventoryStock) => {
    if (stock.sellable <= 0) {
      return { label: 'Hết hàng', color: 'text-red-600', bg: 'bg-red-50' }
    }
    if (stock.sellable <= 10) {
      return { label: 'Sắp hết', color: 'text-orange-600', bg: 'bg-orange-50' }
    }
    return { label: 'Còn hàng', color: 'text-green-600', bg: 'bg-green-50' }
  }

  const filteredStocks = stocks.filter(stock => {
    // Filter by status
    if (filter === 'LOW' && stock.sellable > 10) return false
    if (filter === 'OUT' && stock.sellable > 0) return false
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return stock.sku.toLowerCase().includes(query) || 
             stock.productName.toLowerCase().includes(query)
    }
    return true
  })

  const stats = {
    total: stocks.length,
    outOfStock: stocks.filter(s => s.sellable <= 0).length,
    lowStock: stocks.filter(s => s.sellable > 0 && s.sellable <= 10).length,
    totalOnHand: stocks.reduce((sum, s) => sum + s.onHand, 0)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tồn Kho</h1>
        <p className="text-gray-600 mt-1">Theo dõi số lượng tồn kho</p>
      </div>

      {/* Permission Notice - View Only */}
      {employee?.position !== 'WAREHOUSE' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <FiFileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Chế độ xem</p>
            <p className="text-sm text-blue-600 mt-1">
              Bạn đang xem thông tin tồn kho ở chế độ chỉ đọc.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng SKU</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <FiPackage className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hết hàng</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{stats.outOfStock}</p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sắp hết</p>
              <p className="text-2xl font-bold mt-1 text-orange-600">{stats.lowStock}</p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng tồn kho</p>
              <p className="text-2xl font-bold mt-1">{stats.totalOnHand.toLocaleString()}</p>
            </div>
            <FiPackage className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Tìm theo SKU hoặc tên sản phẩm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <div className="flex gap-2">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'LOW', label: 'Sắp hết' },
            { key: 'OUT', label: 'Hết hàng' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg ${
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Có thể bán</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã đặt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lỗi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : filteredStocks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredStocks.map(stock => {
                const status = getStockStatus(stock)
                return (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-blue-600">{stock.sku}</td>
                    <td className="px-6 py-4">{stock.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">{stock.onHand}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">{stock.sellable}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-orange-600">{stock.reserved}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">{stock.damaged}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
