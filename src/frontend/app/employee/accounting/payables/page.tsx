'use client'

import { useEffect, useState } from 'react'
import { FiAlertCircle, FiClock, FiDollarSign, FiFilter, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { payableApi } from '@/lib/api'
import { PermissionButton } from '@/components/PermissionGuard'
import { usePermissionCheck } from '@/hooks/usePermissionCheck'

interface Payable {
  id: number
  payableCode: string
  supplierId: number
  supplierName: string
  supplierTaxCode: string
  purchaseOrderCode: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  invoiceDate: string
  dueDate: string
  paymentTermDays: number
  daysOverdue?: number
}

interface Stats {
  totalOutstanding: number
  overdueCount: number
  upcomingCount: number
  overdueAmount: number
}

export default function PayablesPage() {
  const [payables, setPayables] = useState<Payable[]>([])
  const [filteredPayables, setFilteredPayables] = useState<Payable[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null)
  
  // Check permission
  const { checkPermission } = usePermissionCheck()
  const isAccountant = checkPermission('ACCOUNTANT')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterPayables()
  }, [searchTerm, statusFilter, payables])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [payablesRes, statsRes] = await Promise.all([
        payableApi.getAll(),
        payableApi.getStats()
      ])

      if (payablesRes.success && payablesRes.data) {
        setPayables(payablesRes.data)
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const filterPayables = () => {
    let filtered = [...payables]

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.payableCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.purchaseOrderCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    setFilteredPayables(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      UNPAID: 'bg-yellow-100 text-yellow-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800'
    }

    const labels = {
      UNPAID: 'Chưa trả',
      PARTIAL: 'Trả một phần',
      PAID: 'Đã trả',
      OVERDUE: 'Quá hạn'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const handlePayment = (payable: Payable) => {
    setSelectedPayable(payable)
    setShowPaymentModal(true)
  }

  const handleViewDetail = (payable: Payable) => {
    setSelectedPayable(payable)
    setShowDetailModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Công nợ Nhà cung cấp</h1>
        <p className="text-gray-600 mt-1">Theo dõi và quản lý các khoản phải trả cho nhà cung cấp</p>
      </div>

      {/* Info Banner for non-accountants only */}
      {!isAccountant && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-gray-700">
                Bạn chỉ có quyền xem công nợ nhà cung cấp. Không thể thực hiện các thao tác chỉnh sửa.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng công nợ</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalOutstanding)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiDollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quá hạn</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdueCount}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.overdueAmount)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FiAlertCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sắp đến hạn</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.upcomingCount}</p>
                <p className="text-xs text-gray-500 mt-1">Trong 7 ngày tới</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FiClock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số công nợ</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{payables.length}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <FiFilter className="text-gray-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, NCC, PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="UNPAID">Chưa trả</option>
            <option value="PARTIAL">Trả một phần</option>
            <option value="OVERDUE">Quá hạn</option>
            <option value="PAID">Đã trả</option>
          </select>
        </div>
      </div>

      {/* Payables Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã công nợ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhà cung cấp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã PO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đã trả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Còn nợ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày hạn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayables.map((payable) => (
                <tr key={payable.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payable.payableCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payable.supplierName}</div>
                    <div className="text-sm text-gray-500">{payable.supplierTaxCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payable.purchaseOrderCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payable.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {formatCurrency(payable.paidAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    {formatCurrency(payable.remainingAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(payable.dueDate)}</div>
                    {payable.daysOverdue && payable.daysOverdue > 0 && (
                      <div className="text-xs text-red-600">Quá {payable.daysOverdue} ngày</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payable.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetail(payable)}
                        className="text-gray-600 hover:text-gray-900 font-medium"
                      >
                        Chi tiết
                      </button>
                      {payable.status !== 'PAID' && (
                        <>
                          <span className="text-gray-300">|</span>
                          <PermissionButton
                            requiredPosition="ACCOUNTANT"
                            onClick={() => handlePayment(payable)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Thanh toán
                          </PermissionButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayables.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có công nợ nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayable && (
        <PaymentModal
          payable={selectedPayable}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPayable(null)
          }}
          onSuccess={() => {
            fetchData()
            setShowPaymentModal(false)
            setSelectedPayable(null)
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPayable && (
        <DetailModal
          payable={selectedPayable}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedPayable(null)
          }}
          onPayment={() => {
            setShowDetailModal(false)
            setShowPaymentModal(true)
          }}
        />
      )}
    </div>
  )
}

// Detail Modal Component
function DetailModal({ payable, onClose, onPayment }: {
  payable: Payable
  onClose: () => void
  onPayment: () => void
}) {
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)
      const response = await payableApi.getPaymentHistory(payable.id)
      if (response.success && response.data) {
        setPaymentHistory(response.data)
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      UNPAID: 'bg-yellow-100 text-yellow-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800'
    }

    const labels = {
      UNPAID: 'Chưa trả',
      PARTIAL: 'Trả một phần',
      PAID: 'Đã trả',
      OVERDUE: 'Quá hạn'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: any = {
      CASH: 'Tiền mặt',
      BANK_TRANSFER: 'Chuyển khoản',
      CHECK: 'Séc'
    }
    return labels[method] || method
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Chi tiết Công nợ</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Thông tin cơ bản */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{payable.payableCode}</h4>
                <p className="text-sm text-gray-600">Mã công nợ</p>
              </div>
              {getStatusBadge(payable.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nhà cung cấp</p>
                <p className="font-medium text-gray-900">{payable.supplierName}</p>
                <p className="text-sm text-gray-500">{payable.supplierTaxCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Mã đơn nhập hàng</p>
                <p className="font-medium text-gray-900">{payable.purchaseOrderCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ngày hóa đơn</p>
                <p className="font-medium text-gray-900">{formatDate(payable.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ngày hạn thanh toán</p>
                <p className="font-medium text-gray-900">{formatDate(payable.dueDate)}</p>
                {payable.daysOverdue && payable.daysOverdue > 0 && (
                  <p className="text-sm text-red-600 font-semibold">Quá hạn {payable.daysOverdue} ngày</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Điều khoản thanh toán</p>
                <p className="font-medium text-gray-900">{payable.paymentTermDays} ngày</p>
              </div>
            </div>
          </div>

          {/* Thông tin tài chính */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Thông tin tài chính</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(payable.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Đã thanh toán</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(payable.paidAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Còn nợ</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(payable.remainingAmount)}</p>
              </div>
            </div>
          </div>

          {/* Lịch sử thanh toán */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Lịch sử thanh toán</h4>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : paymentHistory.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã thanh toán</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương thức</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tham chiếu</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment: any) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.paymentCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(payment.paymentDate)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{getPaymentMethodLabel(payment.paymentMethod)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{payment.referenceNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{payment.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Chưa có lịch sử thanh toán</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {payable.status !== 'PAID' && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
              <PermissionButton
                requiredPosition="ACCOUNTANT"
                onClick={onPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thanh toán
              </PermissionButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Payment Modal Component
function PaymentModal({ payable, onClose, onSuccess }: {
  payable: Payable
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState(payable.remainingAmount.toString())
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHECK'>('BANK_TRANSFER')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Số tiền không hợp lệ')
      return
    }

    if (amountNum > payable.remainingAmount) {
      toast.error('Số tiền vượt quá số tiền còn nợ')
      return
    }

    try {
      setLoading(true)
      
      const response = await payableApi.makePayment({
        payableId: payable.id,
        amount: amountNum,
        paymentDate: paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        note: note || undefined
      })

      if (response.success) {
        toast.success('Thanh toán thành công')
        onSuccess()
      } else {
        toast.error(response.message || 'Thanh toán thất bại')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Lỗi khi thanh toán')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Thanh toán công nợ</h3>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Mã công nợ:</span>
              <span className="text-sm font-medium">{payable.payableCode}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Nhà cung cấp:</span>
              <span className="text-sm font-medium">{payable.supplierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Còn nợ:</span>
              <span className="text-sm font-bold text-red-600">{formatCurrency(payable.remainingAmount)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền thanh toán *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                max={payable.remainingAmount}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày thanh toán *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức thanh toán *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="CHECK">Séc</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tham chiếu (Số CK, Số séc...)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="VD: 123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Thanh toán'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
