'use client'

import { useState, useEffect } from 'react'
import { FiSearch, FiPhone, FiMail, FiMapPin, FiCreditCard, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'
import { inventoryApi } from '@/lib/api'

export default function EmployeeSuppliersPage() {
  const { employee } = useAuthStore()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    taxCode: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    bankAccount: '',
    paymentTerm: ''
  })

  const canCreate = hasPermission(employee?.position as Position, 'suppliers.create')
  const canEdit = hasPermission(employee?.position as Position, 'suppliers.edit')

  useEffect(() => {
    if (employee) {
      loadSuppliers()
    }
    
    return () => {
      setSuppliers([])
    }
  }, [employee])

  const loadSuppliers = async () => {
    try {
      const response = await inventoryApi.getSuppliers()
      if (response.success) {
        setSuppliers(response.data || [])
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
      toast.error('Lỗi khi tải danh sách nhà cung cấp')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canCreate) {
      toast.error('Bạn không có quyền thêm nhà cung cấp')
      return
    }
    
    if (!formData.name || !formData.taxCode) {
      toast.error('Vui lòng nhập tên và mã số thuế')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await inventoryApi.createSupplier(formData)
      if (response.success) {
        toast.success('Thêm nhà cung cấp thành công!')
        setShowCreateForm(false)
        setFormData({
          name: '',
          taxCode: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
          bankAccount: '',
          paymentTerm: ''
        })
        loadSuppliers()
      } else {
        toast.error(response.message || 'Có lỗi xảy ra')
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi thêm nhà cung cấp')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.taxCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Permission Notice */}
      {!canCreate && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <FiFileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Quyền hạn của bạn</p>
            <p className="text-sm text-blue-600 mt-1">
              Bạn có thể xem danh sách nhà cung cấp, nhưng không thể thêm hoặc chỉnh sửa. Chỉ nhân viên kho mới có quyền này.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách nhà cung cấp</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin các nhà cung cấp</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 font-semibold"
          >
            <span>+</span>
            <span>Thêm nhà cung cấp</span>
          </button>
        )}
      </div>

      {/* Create Supplier Modal */}
      {showCreateForm && canCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Thêm nhà cung cấp mới</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên công ty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập tên công ty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã số thuế <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="taxCode"
                    value={formData.taxCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập mã số thuế"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người liên hệ
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập tên người liên hệ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập email"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tài khoản ngân hàng
                  </label>
                  <input
                    type="text"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập số tài khoản"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điều khoản thanh toán
                  </label>
                  <input
                    type="text"
                    name="paymentTerm"
                    value={formData.paymentTerm}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="VD: Thanh toán trong 30 ngày"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Thêm nhà cung cấp</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã số thuế, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiFileText size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy nhà cung cấp</h3>
          <p className="text-gray-600">Chưa có nhà cung cấp nào trong hệ thống</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{supplier.name}</h3>
                  {supplier.contactName && (
                    <p className="text-sm text-gray-600">Liên hệ: {supplier.contactName}</p>
                  )}
                </div>
                {supplier.active ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Hoạt động
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    Ngừng
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {supplier.taxCode && (
                  <div className="flex items-start space-x-2">
                    <FiFileText className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Mã số thuế</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{supplier.taxCode}</p>
                    </div>
                  </div>
                )}

                {supplier.phone && (
                  <div className="flex items-start space-x-2">
                    <FiPhone className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Điện thoại</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{supplier.phone}</p>
                    </div>
                  </div>
                )}

                {supplier.email && (
                  <div className="flex items-start space-x-2">
                    <FiMail className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{supplier.email}</p>
                    </div>
                  </div>
                )}

                {supplier.address && (
                  <div className="flex items-start space-x-2">
                    <FiMapPin className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Địa chỉ</p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{supplier.address}</p>
                    </div>
                  </div>
                )}

                {supplier.bankAccount && (
                  <div className="flex items-start space-x-2">
                    <FiCreditCard className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Tài khoản ngân hàng</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{supplier.bankAccount}</p>
                    </div>
                  </div>
                )}

                {supplier.paymentTerm && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Điều khoản thanh toán</p>
                    <p className="text-sm text-gray-900">{supplier.paymentTerm}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
