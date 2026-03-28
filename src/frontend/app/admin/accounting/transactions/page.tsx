'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi'

export default function TransactionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [transactionDetail, setTransactionDetail] = useState<any>(null)
  const [searchForm, setSearchForm] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    const authStorage = localStorage.getItem('auth-storage')
    if (!authStorage) {
      router.push('/login')
      return
    }

    const authData = JSON.parse(authStorage)
    const userData = authData.state?.user

    if (!userData) {
      router.push('/login')
      return
    }

    const isAdmin = userData.role === 'ADMIN'
    const isAccountant = userData.position === 'ACCOUNTANT'

    if (!isAdmin && !isAccountant) {
      toast.error('Bạn không có quyền truy cập')
      router.push('/')
      return
    }

    // Set default dates (last 30 days)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)

    setSearchForm({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    })

    loadTransactions()
  }, [router, currentPage])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:8080/api/accounting/transactions?page=${currentPage}&size=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const result = await response.json()
      if (result.success) {
        setTransactions(result.data.content || [])
        setTotalPages(result.data.totalPages || 0)
      } else {
        toast.error(result.message || 'Lỗi khi tải giao dịch')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tải giao dịch')
    } finally {
      setLoading(false)
    }
  }

  const searchTransactions = async () => {
    if (!searchForm.startDate || !searchForm.endDate) {
      toast.error('Vui lòng chọn khoảng thời gian')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8080/api/accounting/transactions/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: searchForm.startDate,
          endDate: searchForm.endDate
        })
      })

      const result = await response.json()
      if (result.success) {
        setTransactions(result.data || [])
        toast.success('Tìm kiếm thành công')
      } else {
        toast.error(result.message || 'Lỗi khi tìm kiếm')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tìm kiếm giao dịch')
    } finally {
      setLoading(false)
    }
  }

  const deleteTransaction = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/accounting/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Xóa giao dịch thành công')
        loadTransactions()
      } else {
        toast.error(result.message || 'Lỗi khi xóa giao dịch')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi xóa giao dịch')
    } finally {
      setLoading(false)
    }
  }

  const viewTransactionDetail = async (id: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/accounting/transactions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        const transaction = result.data
        setTransactionDetail(transaction)

        // Nếu là doanh thu bán hàng và có orderId, lấy thêm thông tin đơn hàng
        if (transaction.category === 'SALES' && transaction.orderId) {
          const orderResponse = await fetch(`http://localhost:8080/api/orders/${transaction.orderId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const orderResult = await orderResponse.json()
          if (orderResult.success) {
            setTransactionDetail({ ...transaction, orderDetails: orderResult.data })
          }
        }

        setShowDetailModal(true)
      } else {
        toast.error(result.message || 'Lỗi khi tải chi tiết giao dịch')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tải chi tiết giao dịch')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'REVENUE': return 'Thu'
      case 'EXPENSE': return 'Chi'
      case 'REFUND': return 'Hoàn tiền'
      default: return type
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'SALES': return 'Doanh thu bán hàng'
      case 'SHIPPING': return 'Chi phí vận chuyển'
      case 'PAYMENT_FEE': return 'Phí cổng thanh toán'
      case 'TAX': return 'Thuế'
      default: return category
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Giao dịch tài chính</h1>
          <p className="mt-2 text-gray-600">Quản lý các giao dịch thu chi</p>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                value={searchForm.startDate}
                onChange={(e) => setSearchForm({ ...searchForm, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                value={searchForm.endDate}
                onChange={(e) => setSearchForm({ ...searchForm, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={searchTransactions}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                <FiSearch className="mr-2" />
                Tìm kiếm
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <FiPlus className="mr-2" />
                Thêm giao dịch
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã GD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày GD</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    onClick={() => viewTransactionDetail(transaction.id)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.transactionCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.orderId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${transaction.type === 'REVENUE' ? 'bg-green-100 text-green-800' :
                        transaction.type === 'EXPENSE' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                        {getTransactionTypeText(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getCategoryText(transaction.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={
                        transaction.type === 'REVENUE' ? 'text-green-600' :
                          transaction.type === 'EXPENSE' ? 'text-red-600' :
                            'text-orange-600'
                      }>
                        {transaction.type === 'EXPENSE' ? '-' : '+'}{transaction.amount?.toLocaleString('vi-VN')} ₫
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(transaction.transactionDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTransaction(transaction)
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTransaction(transaction.id)
                          }}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Trang <span className="font-medium">{currentPage + 1}</span> / <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingTransaction) && (
          <TransactionModal
            transaction={editingTransaction}
            onClose={() => {
              setShowCreateModal(false)
              setEditingTransaction(null)
            }}
            onSuccess={() => {
              setShowCreateModal(false)
              setEditingTransaction(null)
              loadTransactions()
            }}
          />
        )}

        {/* Transaction Detail Modal */}
        {showDetailModal && transactionDetail && (
          <TransactionDetailModal
            transaction={transactionDetail}
            onClose={() => {
              setShowDetailModal(false)
              setTransactionDetail(null)
            }}
            getTransactionTypeText={getTransactionTypeText}
            getCategoryText={getCategoryText}
          />
        )}
      </div>
    </div>
  )
}

// Transaction Modal Component
function TransactionModal({ transaction, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: transaction?.type || 'REVENUE',
    category: transaction?.category || 'SALES',
    amount: transaction?.amount || '',
    orderId: transaction?.orderId || '',
    supplierId: transaction?.supplierId || '',
    description: transaction?.description || '',
    transactionDate: transaction?.transactionDate?.split('T')[0] || new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const url = transaction
        ? `http://localhost:8080/api/accounting/transactions/${transaction.id}`
        : 'http://localhost:8080/api/accounting/transactions'

      const response = await fetch(url, {
        method: transaction ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          orderId: form.orderId || null,
          supplierId: form.supplierId || null,
          transactionDate: form.transactionDate + 'T00:00:00'
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success(transaction ? 'Cập nhật giao dịch thành công' : 'Tạo giao dịch thành công')
        onSuccess()
      } else {
        toast.error(result.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {transaction ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="REVENUE">Thu</option>
                  <option value="EXPENSE">Chi</option>
                  <option value="REFUND">Hoàn tiền</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="SALES">Doanh thu bán hàng</option>
                  <option value="SUPPLIER_PAYMENT">Thanh toán NCC</option>
                  <option value="SHIPPING">Chi phí vận chuyển</option>
                  <option value="PAYMENT_FEE">Phí cổng thanh toán</option>
                  <option value="TAX">Thuế</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="0"
                  required
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày giao dịch *</label>
                <input
                  type="date"
                  value={form.transactionDate}
                  onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã đơn hàng</label>
                <input
                  type="number"
                  value={form.orderId}
                  onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Để trống nếu không liên quan đơn hàng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã nhà cung cấp</label>
                <input
                  type="number"
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Để trống nếu không liên quan NCC"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows={3}
                placeholder="Nhập mô tả giao dịch..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : (transaction ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Transaction Detail Modal Component (Read-only)
function TransactionDetailModal({ transaction, onClose, getTransactionTypeText, getCategoryText }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Chi tiết giao dịch</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Transaction Code */}
            <div className="border-b pb-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Mã giao dịch</label>
              <p className="text-lg font-semibold text-gray-900">{transaction.transactionCode}</p>
            </div>

            {/* Type and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Loại giao dịch</label>
                <span className={`inline-block px-3 py-1 text-sm rounded-full ${transaction.type === 'REVENUE' ? 'bg-green-100 text-green-800' :
                  transaction.type === 'EXPENSE' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                  {getTransactionTypeText(transaction.type)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Danh mục</label>
                <p className="text-gray-900">{getCategoryText(transaction.category)}</p>
              </div>
            </div>

            {/* Amount */}
            <div className="border-b pb-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Số tiền</label>
              <p className={`text-2xl font-bold ${transaction.type === 'REVENUE' ? 'text-green-600' :
                transaction.type === 'EXPENSE' ? 'text-red-600' :
                  'text-orange-600'
                }`}>
                {transaction.type === 'EXPENSE' ? '-' : '+'}{transaction.amount?.toLocaleString('vi-VN')} ₫
              </p>
            </div>

            {/* Order ID and Supplier ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Mã đơn hàng</label>
                <p className="text-gray-900">{transaction.orderId || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Mã nhà cung cấp</label>
                <p className="text-gray-900">{transaction.supplierId || '-'}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Mô tả</label>
              <p className="text-gray-900 whitespace-pre-wrap">{transaction.description || '-'}</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ngày giao dịch</label>
                <p className="text-gray-900">
                  {new Date(transaction.transactionDate).toLocaleString('vi-VN')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ngày tạo</label>
                <p className="text-gray-900">
                  {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Created By */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Người tạo</label>
              <p className="text-gray-900">{transaction.createdBy || '-'}</p>
            </div>

            {/* Order Details - Chỉ hiển thị khi là doanh thu bán hàng */}
            {transaction.category === 'SALES' && transaction.orderDetails && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📦 Chi tiết đơn hàng</h3>

                <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Mã đơn hàng</label>
                      <p className="text-sm font-semibold text-blue-700">{transaction.orderDetails.orderCode}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Khách hàng</label>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.orderDetails.customer?.fullName || transaction.orderDetails.customer?.user?.email || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái đơn hàng</label>
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {transaction.orderDetails.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái thanh toán</label>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${transaction.orderDetails.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {transaction.orderDetails.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ giao hàng</label>
                    <p className="text-sm text-gray-700">{transaction.orderDetails.shippingAddress}</p>
                  </div>

                  {transaction.orderDetails.items && transaction.orderDetails.items.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Sản phẩm ({transaction.orderDetails.items.length})</label>
                      <div className="space-y-2">
                        {transaction.orderDetails.items.map((item: any, index: number) => (
                          <div key={index} className="bg-white p-2 rounded border border-gray-200 flex justify-between items-center">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {item.productName || item.product?.name || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">SL: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.price?.toLocaleString('vi-VN')} ₫
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                    <div className="text-right text-xs text-gray-600">Tổng tiền hàng:</div>
                    <div className="text-right text-sm font-semibold">{transaction.orderDetails.subtotal?.toLocaleString('vi-VN')} ₫</div>

                    <div className="text-right text-xs text-gray-600">Phí vận chuyển:</div>
                    <div className="text-right text-sm font-semibold">{transaction.orderDetails.shippingFee?.toLocaleString('vi-VN')} ₫</div>

                    <div className="text-right text-xs text-gray-600">Giảm giá:</div>
                    <div className="text-right text-sm font-semibold text-red-600">-{transaction.orderDetails.discount?.toLocaleString('vi-VN')} ₫</div>

                    <div className="text-right text-xs font-bold text-gray-900">Tổng cộng:</div>
                    <div className="text-right text-lg font-bold text-green-600">{transaction.orderDetails.total?.toLocaleString('vi-VN')} ₫</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}