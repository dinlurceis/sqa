'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FiSearch, FiShield, FiCheckCircle, FiAlertCircle,
  FiClock, FiPhone, FiArrowLeft, FiPackage, FiCalendar
} from 'react-icons/fi'

interface WarrantyResult {
  found: boolean
  product?: {
    name: string
    serial: string
    purchaseDate: string
    warrantyEndDate: string
    status: 'active' | 'expired' | 'void'
    remainingDays: number
  }
}

export default function WarrantyCheckPage() {
  const [serialNumber, setSerialNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WarrantyResult | null>(null)
  const [searched, setSearched] = useState(false)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serialNumber.trim()) return

    setLoading(true)
    setSearched(true)
    
    // Simulate API call - replace with actual API
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock result for demo
    if (serialNumber.toLowerCase().includes('demo') || serialNumber.length > 5) {
      setResult({
        found: true,
        product: {
          name: 'iPhone 15 Pro Max 256GB',
          serial: serialNumber.toUpperCase(),
          purchaseDate: '2024-06-15',
          warrantyEndDate: '2025-06-15',
          status: 'active',
          remainingDays: 160
        }
      })
    } else {
      setResult({ found: false })
    }
    
    setLoading(false)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Còn bảo hành', color: 'text-green-600', bgColor: 'bg-green-100', icon: <FiCheckCircle /> }
      case 'expired':
        return { label: 'Hết bảo hành', color: 'text-red-600', bgColor: 'bg-red-100', icon: <FiAlertCircle /> }
      case 'void':
        return { label: 'Mất bảo hành', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <FiAlertCircle /> }
      default:
        return { label: 'Không xác định', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <FiAlertCircle /> }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="header-gradient text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/support" className="text-white/80 hover:text-white">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold">Tra cứu bảo hành</h1>
          </div>
          <p className="text-blue-100 max-w-2xl">
            Nhập số serial hoặc IMEI của sản phẩm để kiểm tra thông tin bảo hành
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 -mt-8 relative z-10">
          <form onSubmit={handleCheck} className="flex gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Nhập số Serial hoặc IMEI..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !serialNumber.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Đang tra cứu...
                </>
              ) : (
                <>
                  <FiShield className="w-5 h-5" />
                  Tra cứu
                </>
              )}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-3">
            Ví dụ: DEMO123456, IMEI123456789012345
          </p>
        </div>

        {/* Result */}
        {searched && !loading && result && (
          <div className="mt-8">
            {result.found && result.product ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className={`p-4 ${getStatusConfig(result.product.status).bgColor}`}>
                  <div className="flex items-center gap-3">
                    <div className={`${getStatusConfig(result.product.status).color}`}>
                      {getStatusConfig(result.product.status).icon}
                    </div>
                    <span className={`font-semibold ${getStatusConfig(result.product.status).color}`}>
                      {getStatusConfig(result.product.status).label}
                    </span>
                    {result.product.status === 'active' && (
                      <span className="text-sm text-green-600">
                        (Còn {result.product.remainingDays} ngày)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <FiPackage className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sản phẩm</p>
                      <p className="font-semibold text-gray-900">{result.product.name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FiShield className="w-4 h-4" /> Serial/IMEI
                      </p>
                      <p className="font-medium text-gray-900">{result.product.serial}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" /> Ngày mua
                      </p>
                      <p className="font-medium text-gray-900">
                        {new Date(result.product.purchaseDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FiClock className="w-4 h-4" /> Hết hạn BH
                      </p>
                      <p className="font-medium text-gray-900">
                        {new Date(result.product.warrantyEndDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 flex justify-between items-center">
                  <p className="text-sm text-gray-500">Cần hỗ trợ về bảo hành?</p>
                  <Link
                    href="/support/tickets"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Tạo yêu cầu hỗ trợ →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <FiAlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy thông tin</h3>
                <p className="text-gray-500 mb-4">
                  Không tìm thấy sản phẩm với số serial/IMEI: <strong>{serialNumber}</strong>
                </p>
                <p className="text-sm text-gray-400">
                  Vui lòng kiểm tra lại số serial hoặc liên hệ hotline 1900.2091 để được hỗ trợ
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiShield className="w-5 h-5 text-blue-600" />
              Chính sách bảo hành
            </h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Bảo hành theo chính sách của nhà sản xuất
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Thời gian bảo hành: 12-24 tháng tùy sản phẩm
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Đổi mới trong 7 ngày đầu nếu có lỗi từ NSX
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Hỗ trợ bảo hành tại nhà cho khách VIP
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiPhone className="w-5 h-5 text-blue-600" />
              Liên hệ hỗ trợ
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Hotline</p>
                <a href="tel:19002091" className="text-blue-600 font-semibold text-lg">1900.2091</a>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <a href="mailto:warranty@techworld.com" className="text-blue-600">warranty@techworld.com</a>
              </div>
              <div>
                <p className="text-gray-500">Giờ làm việc</p>
                <p className="text-gray-900">8:00 - 22:00 (Tất cả các ngày)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-4">Bạn cần hỗ trợ thêm?</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/support/warranty"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Chính sách đổi mới
            </Link>
            <Link
              href="/support/repair"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Dịch vụ sửa chữa
            </Link>
            <Link
              href="/support/extended-warranty"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Bảo hành mở rộng
            </Link>
            <Link
              href="/support/tickets"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Gửi yêu cầu hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
