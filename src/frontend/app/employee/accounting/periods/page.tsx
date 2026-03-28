'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiLock, FiUnlock, FiRefreshCw } from 'react-icons/fi'

export default function PeriodsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [periods, setPeriods] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [periodDetails, setPeriodDetails] = useState<any>(null)

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

    const isAdminRole = userData.role === 'ADMIN'
    const isAccountant = userData.position === 'ACCOUNTANT'

    if (!isAdminRole && !isAccountant) {
      toast.error('Bạn không có quyền truy cập')
      router.push('/')
      return
    }

    setIsAdmin(isAdminRole)
    loadPeriods()
  }, [router])

  const loadPeriods = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8080/api/accounting/periods', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        setPeriods(result.data || [])
      } else {
        toast.error(result.message || 'Lỗi khi tải danh sách kỳ')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tải danh sách kỳ')
    } finally {
      setLoading(false)
    }
  }

  const closePeriod = async (id: number) => {
    if (!confirm('Bạn có chắc muốn chốt kỳ này? Sau khi chốt sẽ không thể chỉnh sửa.')) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8080/api/accounting/periods/${id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Chốt kỳ thành công')
        loadPeriods()
      } else {
        toast.error(result.message || 'Lỗi khi chốt kỳ')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi chốt kỳ')
    } finally {
      setLoading(false)
    }
  }

  const reopenPeriod = async (id: number) => {
    if (!isAdmin) {
      toast.error('Chỉ Admin mới có quyền mở khóa kỳ')
      return
    }

    if (!confirm('Bạn có chắc muốn mở khóa kỳ này?')) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8080/api/accounting/periods/${id}/reopen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Mở khóa kỳ thành công')
        loadPeriods()
      } else {
        toast.error(result.message || 'Lỗi khi mở khóa kỳ')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi mở khóa kỳ')
    } finally {
      setLoading(false)
    }
  }

  const recalculatePeriod = async (id: number) => {
    if (!confirm('Cập nhật dữ liệu kỳ từ giao dịch mới nhất?')) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8080/api/accounting/periods/${id}/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Cập nhật dữ liệu thành công')
        loadPeriods()
      } else {
        toast.error(result.message || 'Lỗi khi cập nhật')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi cập nhật dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const viewPeriodDetails = async (id: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8080/api/accounting/periods/${id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        setPeriodDetails(result.data)
        setShowDetailModal(true)
      } else {
        toast.error(result.message || 'Lỗi khi tải chi tiết kỳ')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tải chi tiết kỳ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý kỳ báo cáo</h1>
            <p className="mt-2 text-gray-600">Chốt sổ và mở khóa kỳ kế toán</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Tạo kỳ mới
          </button>
        </div>

        {/* Periods List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên kỳ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Từ ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đến ngày</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sai số (%)</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Người chốt</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periods.map((period) => (
                  <tr
                    key={period.id}
                    onClick={() => viewPeriodDetails(period.id)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {period.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(period.startDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(period.endDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {period.totalRevenue?.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={period.discrepancyRate > 15 ? 'text-red-600 font-bold' : 'text-gray-900'}>
                        {period.discrepancyRate?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${period.status === 'CLOSED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {period.status === 'CLOSED' ? 'Đã chốt' : 'Đang mở'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                      {period.closedBy || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        {period.status === 'OPEN' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                recalculatePeriod(period.id)
                              }}
                              disabled={loading}
                              className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                              title="Cập nhật dữ liệu"
                            >
                              <FiRefreshCw className="mr-1" size={14} />
                              Cập nhật
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                closePeriod(period.id)
                              }}
                              disabled={loading}
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              <FiLock className="mr-1" size={14} />
                              Chốt kỳ
                            </button>
                          </>
                        )}
                        {period.status === 'CLOSED' && isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              reopenPeriod(period.id)
                            }}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
                          >
                            <FiUnlock className="mr-1" size={14} />
                            Mở khóa
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

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Lưu ý:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Chỉ có thể chốt kỳ khi sai số {'<'} 15%</li>
            <li>• Sau khi chốt kỳ, dữ liệu sẽ không thể chỉnh sửa</li>
            <li>• Chỉ Admin mới có quyền mở khóa kỳ đã chốt</li>
            <li>• Cảnh báo nếu sai lệch {'>'} 5 triệu đồng</li>
          </ul>
        </div>

        {/* Create Period Modal */}
        {showCreateModal && (
          <CreatePeriodModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              loadPeriods()
            }}
          />
        )}

        {/* Period Detail Modal */}
        {showDetailModal && periodDetails && (
          <PeriodDetailModal
            period={periodDetails.period}
            revenueTransactions={periodDetails.revenueTransactions || []}
            expenseTransactions={periodDetails.expenseTransactions || []}
            salesRevenue={periodDetails.salesRevenue || 0}
            refundAmount={periodDetails.refundAmount || 0}
            netRevenue={periodDetails.netRevenue || 0}
            profitMargin={periodDetails.profitMargin || 0}
            onClose={() => {
              setShowDetailModal(false)
              setPeriodDetails(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

// Create Period Modal Component
function CreatePeriodModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !startDate || !endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8080/api/accounting/periods', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          name,
          startDate,
          endDate
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Tạo kỳ kế toán thành công')
        onSuccess()
      } else {
        toast.error(result.message || 'Lỗi khi tạo kỳ')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tạo kỳ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tạo kỳ kế toán mới</h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên kỳ *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Kỳ tháng 12/2024"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Từ ngày *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đến ngày *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
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
                {loading ? 'Đang tạo...' : 'Tạo kỳ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Period Detail Modal - Theo Chuẩn mực KT VN
function PeriodDetailModal({ period, revenueTransactions, expenseTransactions, salesRevenue, refundAmount, netRevenue, profitMargin, onClose }: {
  period: any; revenueTransactions: any[]; expenseTransactions: any[]; salesRevenue: number; refundAmount: number; netRevenue: number; profitMargin: number; onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'revenue' | 'expense'>('revenue')
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold">{period.name}</h2>
              <p className="text-sm text-gray-600">Kỳ: {new Date(period.startDate).toLocaleDateString('vi-VN')} - {new Date(period.endDate).toLocaleDateString('vi-VN')}</p>
              <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${period.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {period.status === 'CLOSED' ? '✓ Đã chốt' : '○ Đang mở'}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="mb-6"><h3 className="text-lg font-bold mb-4 flex items-center"><span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm">I</span>DOANH THU</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200"><p className="text-xs text-green-700">1. DT bán hàng</p><p className="text-2xl font-bold text-green-700">{salesRevenue?.toLocaleString('vi-VN')} ₫</p></div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200"><p className="text-xs text-orange-700">2. Giảm trừ DT</p><p className="text-2xl font-bold text-orange-700">{refundAmount?.toLocaleString('vi-VN')} ₫</p></div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><p className="text-xs text-blue-700">3. DT thuần</p><p className="text-2xl font-bold text-blue-700">{netRevenue?.toLocaleString('vi-VN')} ₫</p></div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200"><p className="text-xs text-purple-700">Biên LN</p><p className="text-2xl font-bold text-purple-700">{profitMargin?.toFixed(2)}%</p></div>
            </div>
          </div>
          <div className="mb-6"><h3 className="text-lg font-bold mb-4 flex items-center"><span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm">II</span>KẾT QUẢ</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200"><p className="text-xs text-green-600">Tổng Thu</p><p className="text-2xl font-bold text-green-700">{period.totalRevenue?.toLocaleString('vi-VN')} ₫</p><p className="text-xs mt-1">{revenueTransactions.length} GD</p></div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200"><p className="text-xs text-red-600">Tổng Chi</p><p className="text-2xl font-bold text-red-700">{period.totalExpense?.toLocaleString('vi-VN')} ₫</p><p className="text-xs mt-1">{expenseTransactions.length} GD</p></div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><p className="text-xs text-blue-600">Lợi nhuận</p><p className={`text-2xl font-bold ${period.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{period.netProfit?.toLocaleString('vi-VN')} ₫</p></div>
            </div>
          </div>
          <div><h3 className="text-lg font-bold mb-4 flex items-center"><span className="bg-gray-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm">III</span>CHI TIẾT</h3>
            <div className="border-b mb-4"><nav className="-mb-px flex space-x-8">
              <button onClick={() => setActiveTab('revenue')} className={`pb-3 border-b-2 font-medium text-sm ${activeTab === 'revenue' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'}`}>💰 Thu ({revenueTransactions.length})</button>
              <button onClick={() => setActiveTab('expense')} className={`pb-3 border-b-2 font-medium text-sm ${activeTab === 'expense' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500'}`}>💸 Chi ({expenseTransactions.length})</button>
            </nav></div>
            <div className="max-h-80 overflow-y-auto bg-gray-50 rounded-lg p-3">
              {activeTab === 'revenue' && (
                <div className="space-y-2">{revenueTransactions.length === 0 ? <p className="text-center py-12 text-gray-500">Chưa có giao dịch</p> : revenueTransactions.map((t: any) => (
                  <div key={t.id} className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="flex justify-between"><div><p className="font-mono text-sm font-bold">{t.transactionCode}</p><p className="text-sm text-gray-600">{t.description || '-'}</p><p className="text-xs text-gray-400">{new Date(t.transactionDate).toLocaleString('vi-VN')}</p></div>
                      <p className="text-xl font-bold text-green-600">+{t.amount?.toLocaleString('vi-VN')} ₫</p></div>
                  </div>
                ))}</div>
              )}
              {activeTab === 'expense' && (
                <div className="space-y-2">{expenseTransactions.length === 0 ? <p className="text-center py-12 text-gray-500">Chưa có giao dịch</p> : expenseTransactions.map((t: any) => (
                  <div key={t.id} className="bg-white p-4 rounded-lg border border-red-200">
                    <div className="flex justify-between"><div><p className="font-mono text-sm font-bold">{t.transactionCode}</p><p className="text-sm text-gray-600">{t.description || '-'}</p><p className="text-xs text-gray-400">{new Date(t.transactionDate).toLocaleString('vi-VN')}</p></div>
                      <p className="text-xl font-bold text-red-600">-{t.amount?.toLocaleString('vi-VN')} ₫</p></div>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t mt-6"><button onClick={onClose} className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Đóng</button></div>
        </div>
      </div>
    </div>
  )
}
