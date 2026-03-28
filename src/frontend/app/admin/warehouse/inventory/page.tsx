'use client'

import { useState, useEffect } from 'react'
import { FiPackage, FiAlertCircle, FiSearch, FiX, FiList } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface InventoryStock {
  id: number
  warehouseProductId: number
  sku: string
  productName: string
  onHand: number
  available: number
  reserved: number
  damaged: number
  sellable: number
}

interface SerialDetail {
  serialNumber: string
  status: string
  importDate: string
  importPrice: number
}

export default function AdminWarehouseInventoryPage() {
  const [stocks, setStocks] = useState<InventoryStock[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<InventoryStock | null>(null)
  const [serials, setSerials] = useState<SerialDetail[]>([])
  const [loadingSerials, setLoadingSerials] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const res = await fetch('http://localhost:8080/api/inventory/stock', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success && data.data) {
        const mappedStocks = data.data.map((item: any) => ({
          id: item.id,
          warehouseProductId: item.warehouseProduct?.id,
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
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = async (product: InventoryStock) => {
    if (!product.warehouseProductId) {
      toast.error('Không tìm thấy ID sản phẩm')
      return
    }

    setSelectedProduct(product)
    setShowModal(true)
    setLoadingSerials(true)

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const res = await fetch(`http://localhost:8080/api/inventory/stock/${product.warehouseProductId}/serials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSerials(data.data)
      } else {
        setSerials([])
        toast.error('Không tải được danh sách serial')
      }
    } catch (error) {
      console.error(error)
      toast.error('Lỗi kết nối')
    } finally {
      setLoadingSerials(false)
    }
  }

  const getStockStatus = (stock: InventoryStock) => {
    if (stock.sellable <= 0) return { label: 'Hết hàng', color: 'text-red-600', bg: 'bg-red-50' }
    if (stock.sellable <= 10) return { label: 'Sắp hết', color: 'text-orange-600', bg: 'bg-orange-50' }
    return { label: 'Còn hàng', color: 'text-green-600', bg: 'bg-green-50' }
  }

  const getSerialStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return 'bg-green-100 text-green-800'
      case 'SOLD': return 'bg-blue-100 text-blue-800'
      case 'DAMAGED': return 'bg-red-100 text-red-800'
      case 'WARRANTY': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredStocks = stocks.filter(stock => {
    if (filter === 'LOW' && (stock.sellable <= 0 || stock.sellable > 10)) return false
    if (filter === 'OUT' && stock.sellable > 0) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return stock.sku.toLowerCase().includes(query) || stock.productName.toLowerCase().includes(query)
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
    <div className="p-6 relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tồn Kho</h1>
        <p className="text-gray-600 mt-1">Quản lý số lượng và serial sản phẩm</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
         <div className="bg-white p-4 rounded-lg shadow"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Tổng SKU</p><p className="text-2xl font-bold">{stats.total}</p></div><FiPackage className="text-blue-600 w-8 h-8"/></div></div>
         <div className="bg-white p-4 rounded-lg shadow"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Hết hàng</p><p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p></div><FiAlertCircle className="text-red-600 w-8 h-8"/></div></div>
         <div className="bg-white p-4 rounded-lg shadow"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Sắp hết</p><p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p></div><FiAlertCircle className="text-orange-600 w-8 h-8"/></div></div>
         <div className="bg-white p-4 rounded-lg shadow"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Tổng tồn kho</p><p className="text-2xl font-bold">{stats.totalOnHand}</p></div><FiPackage className="text-green-600 w-8 h-8"/></div></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-72 focus:outline-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {[{ key: 'ALL', label: 'Tất cả' }, { key: 'LOW', label: 'Sắp hết' }, { key: 'OUT', label: 'Hết hàng' }].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Có thể bán</th>
              {/* ✅ ĐÃ THÊM LẠI CỘT BỊ THIẾU */}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Đã đặt</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lỗi</th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8">Đang tải...</td></tr>
            ) : filteredStocks.map(stock => {
              const status = getStockStatus(stock)
              return (
                <tr
                  key={stock.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(stock)}
                >
                  <td className="px-6 py-4 font-mono text-blue-600 font-medium">{stock.sku}</td>
                  <td className="px-6 py-4">{stock.productName}</td>
                  <td className="px-6 py-4 text-center font-bold">{stock.onHand}</td>
                  <td className="px-6 py-4 text-center text-green-600 font-bold">{stock.sellable}</td>
                  {/* ✅ ĐÃ THÊM LẠI DỮ LIỆU BỊ THIẾU */}
                  <td className="px-6 py-4 text-center text-orange-600">{stock.reserved}</td>
                  <td className="px-6 py-4 text-center text-red-600">{stock.damaged}</td>

                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">
                    <FiList className="inline w-5 h-5 hover:text-blue-600" title="Xem Serial" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fadeIn">
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedProduct.productName}</h2>
                <p className="text-sm text-gray-500 mt-1">SKU: {selectedProduct.sku}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {loadingSerials ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Đang tải danh sách serial...</p>
                </div>
              ) : serials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Chưa có serial nào được ghi nhận.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số Serial</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ngày nhập</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serials.map((serial, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 font-mono text-sm font-medium">{serial.serialNumber}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getSerialStatusColor(serial.status)}`}>
                            {serial.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {new Date(serial.importDate).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}