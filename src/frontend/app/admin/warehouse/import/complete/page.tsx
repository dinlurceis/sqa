'use client'

import { useState, useEffect } from 'react'
import { FiSearch, FiCheck, FiPackage, FiCamera } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { inventoryApi } from '@/lib/api'
import QRScanner from '@/components/QRScanner'

export default function AdminCompleteImportPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [serialInputs, setSerialInputs] = useState<Record<number, string[]>>({})
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scanningFor, setScanningFor] = useState<{ itemId: number; index: number } | null>(null)

  useEffect(() => {
    loadPendingOrders()
  }, [])

  const loadPendingOrders = async () => {
    try {
      const response = await inventoryApi.getPurchaseOrders('CREATED')
      setPurchaseOrders(response.data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Lỗi khi tải danh sách phiếu')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOrder = async (order: any) => {
    try {
      const response = await inventoryApi.getPurchaseOrderDetail(order.id)
      if (response.success) {
        setSelectedOrder(response.data)
        
        const inputs: Record<number, string[]> = {}
        response.data.items?.forEach((item: any) => {
          inputs[item.id] = Array(item.quantity).fill('')
        })
        setSerialInputs(inputs)
        setShowCompleteModal(true)
      }
    } catch (error) {
      console.error('Error loading order detail:', error)
      toast.error('Lỗi khi tải chi tiết phiếu')
    }
  }

  const handleSerialChange = (itemId: number, index: number, value: string) => {
    setSerialInputs(prev => ({
      ...prev,
      [itemId]: prev[itemId].map((v, i) => i === index ? value : v)
    }))
  }

  const handleOpenQRScanner = (itemId: number, index: number) => {
    setScanningFor({ itemId, index })
    setShowQRScanner(true)
  }

  const handleQRScan = (result: string) => {
    if (scanningFor) {
      const currentSerials = serialInputs[scanningFor.itemId] || []
      const isDuplicate = currentSerials.some((s, idx) => 
        idx !== scanningFor.index && s.trim() === result.trim()
      )
      
      if (isDuplicate) {
        toast.error('Serial này đã được nhập rồi!')
        setShowQRScanner(false)
        setScanningFor(null)
        return
      }
      
      const allSerials: string[] = []
      Object.entries(serialInputs).forEach(([itemId, serials]) => {
        if (Number(itemId) !== scanningFor.itemId) {
          allSerials.push(...serials.filter(s => s.trim()))
        }
      })
      
      if (allSerials.includes(result.trim())) {
        toast.error('Serial này đã được sử dụng cho sản phẩm khác!')
        setShowQRScanner(false)
        setScanningFor(null)
        return
      }
      
      handleSerialChange(scanningFor.itemId, scanningFor.index, result)
      toast.success('Đã quét mã thành công!')
    }
    setShowQRScanner(false)
    setScanningFor(null)
  }

  const handleComplete = async () => {
    try {
      const allSerials: any[] = []
      let hasError = false

      const serialsBySku: Record<string, string[]> = {}
      
      selectedOrder.items.forEach((item: any) => {
        const serials = serialInputs[item.id] || []
        if (serials.some(s => !s.trim())) {
          toast.error(`Vui lòng nhập đầy đủ serial cho ${item.warehouseProduct?.internalName || item.sku}`)
          hasError = true
          return
        }

        const sku = item.sku || item.warehouseProduct?.sku
        if (!sku) {
          toast.error('Không tìm thấy SKU cho sản phẩm')
          hasError = true
          return
        }

        serialsBySku[sku] = serials.map(s => s.trim())
      })

      Object.entries(serialsBySku).forEach(([sku, serialNumbers]) => {
        allSerials.push({
          productSku: sku,
          serialNumbers: serialNumbers
        })
      })

      if (hasError) return

      const response = await inventoryApi.completePurchaseOrder({
        poId: selectedOrder.id,
        serials: allSerials,
        receivedDate: new Date().toISOString()
      })

      if (response.success) {
        toast.success('Hoàn thiện phiếu nhập thành công!')
        setShowCompleteModal(false)
        loadPendingOrders()
      } else {
        toast.error(response.message || 'Có lỗi xảy ra')
      }
    } catch (error: any) {
      console.error('Error completing order:', error)
      toast.error(error.response?.data?.message || 'Lỗi khi hoàn thiện phiếu')
    }
  }

  const filteredOrders = purchaseOrders.filter(order =>
    order.poCode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hoàn thiện phiếu nhập</h1>
        <p className="text-gray-600 mt-1">Nhập serial number cho các sản phẩm đã nhập kho</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã phiếu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiPackage size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có phiếu nào cần hoàn thiện</h3>
          <p className="text-gray-600">Tất cả phiếu nhập đã được xử lý</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{order.poCode}</h3>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Chờ nhập
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ngày tạo:</span>{' '}
                  {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Người tạo:</span> {order.createdBy || 'N/A'}
                </p>
                {order.note && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ghi chú:</span> {order.note}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleSelectOrder(order)}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
              >
                <FiCheck />
                <span>Hoàn thiện</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Nhập Serial - {selectedOrder.poCode}
              </h2>

              <div className="space-y-6">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.productName}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      SKU: {item.sku} | Số lượng: {item.quantity}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.from({ length: item.quantity }).map((_, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Serial #{index + 1} *
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={serialInputs[item.id]?.[index] || ''}
                              onChange={(e) => handleSerialChange(item.id, index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder={`Nhập serial ${index + 1}`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenQRScanner(item.id, index)}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              title="Quét QR"
                            >
                              <FiCamera size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Hoàn thiện nhập kho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => {
            setShowQRScanner(false)
            setScanningFor(null)
          }}
        />
      )}
    </div>
  )
}
