'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit, FiCheck, FiDollarSign, FiRefreshCw } from 'react-icons/fi'

export default function TaxPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [taxReports, setTaxReports] = useState<any[]>([])
  const [taxSummary, setTaxSummary] = useState<any>(null)
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedPeriod, setSelectedPeriod] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReport, setEditingReport] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [taxDetail, setTaxDetail] = useState<any>(null)

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

    loadTaxReports()
    loadTaxSummary()
  }, [router, selectedType, selectedPeriod, selectedYear])

  const loadTaxReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const url = selectedType === 'ALL'
        ? 'http://localhost:8080/api/accounting/tax/reports'
        : `http://localhost:8080/api/accounting/tax/reports/${selectedType}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        let filteredReports = result.data || []

        // Filter by period (month, quarter, year)
        if (selectedPeriod !== 'ALL') {
          filteredReports = filteredReports.filter((report: any) => {
            const startDate = new Date(report.periodStart)
            const year = startDate.getFullYear()
            const month = startDate.getMonth() + 1
            const quarter = Math.ceil(month / 3)

            if (year.toString() !== selectedYear) return false

            if (selectedPeriod.startsWith('Q')) {
              const selectedQuarter = parseInt(selectedPeriod.substring(1))
              return quarter === selectedQuarter
            } else if (selectedPeriod.startsWith('M')) {
              const selectedMonth = parseInt(selectedPeriod.substring(1))
              return month === selectedMonth
            } else if (selectedPeriod === 'YEAR') {
              return true
            }
            return true
          })
        }

        setTaxReports(filteredReports)
      } else {
        toast.error(result.message || 'Lỗi khi tải báo cáo thuế')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tải báo cáo thuế')
    } finally {
      setLoading(false)
    }
  }

  const loadTaxSummary = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8080/api/accounting/tax/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        setTaxSummary(result.data)
      }
    } catch (error) {
      console.error('Error loading tax summary:', error)
    }
  }

  const submitTaxReport = async (id: number) => {
    if (!confirm('Bạn có chắc muốn nộp báo cáo thuế này?')) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8080/api/accounting/tax/reports/${id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Nộp báo cáo thuế thành công')
        loadTaxReports()
        loadTaxSummary()
      } else {
        toast.error(result.message || 'Lỗi khi nộp báo cáo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi nộp báo cáo thuế')
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (id: number) => {
    if (!confirm('Bạn có chắc đã thanh toán thuế này?')) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8080/api/accounting/tax/reports/${id}/mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Đánh dấu đã thanh toán thành công')
        loadTaxReports()
        loadTaxSummary()
      } else {
        toast.error(result.message || 'Lỗi khi cập nhật')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi cập nhật trạng thái')
    } finally {
      setLoading(false)
    }
  }

  const recalculateTaxReport = async (id: number) => {
    if (!confirm('Cập nhật dữ liệu báo cáo từ giao dịch mới nhất?')) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8080/api/accounting/tax/reports/${id}/recalculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Cập nhật dữ liệu thành công')
        loadTaxReports()
        loadTaxSummary()
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

  const viewTaxDetail = async (id: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8080/api/accounting/tax/reports/detail/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        setTaxDetail(result.data)
        setShowDetailModal(true)
      } else {
        toast.error(result.message || 'Lỗi khi tải chi tiết báo cáo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tải chi tiết báo cáo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý thuế</h1>
          <p className="mt-2 text-gray-600">Báo cáo và nộp thuế VAT, thuế TNDN</p>
        </div>

        {/* Tax Summary */}
        {taxSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">VAT còn nợ</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {taxSummary.vatOwed?.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FiDollarSign className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">VAT đã nộp</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {taxSummary.vatPaid?.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FiCheck className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">TNDN còn nợ</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {taxSummary.corporateOwed?.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <FiDollarSign className="text-orange-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng nợ thuế</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {taxSummary.totalOwed?.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FiDollarSign className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex space-x-4 flex-wrap gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="ALL">Tất cả loại thuế</option>
                <option value="VAT">Thuế VAT</option>
                <option value="CORPORATE_TAX">Thuế TNDN</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i
                  return <option key={year} value={year}>{year}</option>
                })}
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="ALL">Tất cả kỳ</option>
                <option value="YEAR">Cả năm</option>
                <option value="Q1">Quý 1 (T1-T3)</option>
                <option value="Q2">Quý 2 (T4-T6)</option>
                <option value="Q3">Quý 3 (T7-T9)</option>
                <option value="Q4">Quý 4 (T10-T12)</option>
                <option value="M1">Tháng 1</option>
                <option value="M2">Tháng 2</option>
                <option value="M3">Tháng 3</option>
                <option value="M4">Tháng 4</option>
                <option value="M5">Tháng 5</option>
                <option value="M6">Tháng 6</option>
                <option value="M7">Tháng 7</option>
                <option value="M8">Tháng 8</option>
                <option value="M9">Tháng 9</option>
                <option value="M10">Tháng 10</option>
                <option value="M11">Tháng 11</option>
                <option value="M12">Tháng 12</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FiPlus className="mr-2" />
              Tạo báo cáo thuế
            </button>
          </div>
        </div>

        {/* Tax Reports Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã BC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại thuế</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kỳ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">DT chịu thuế</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thuế suất</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số thuế</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Còn nợ</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => viewTaxDetail(report.id)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.reportCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {report.taxType === 'VAT' ? 'Thuế VAT' : 'Thuế TNDN'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(report.periodStart).toLocaleDateString('vi-VN')} - {new Date(report.periodEnd).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {report.taxableRevenue?.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {report.taxRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {report.taxAmount?.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {report.remainingTax?.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${report.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        report.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {report.status === 'PAID' ? 'Đã nộp' :
                          report.status === 'SUBMITTED' ? 'Đã gửi' : 'Nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        {report.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                recalculateTaxReport(report.id)
                              }}
                              disabled={loading}
                              className="text-purple-600 hover:text-purple-800 disabled:opacity-50"
                              title="Cập nhật dữ liệu"
                            >
                              <FiRefreshCw size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingReport(report)
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Sửa"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                submitTaxReport(report.id)
                              }}
                              disabled={loading}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Nộp báo cáo"
                            >
                              <FiCheck size={16} />
                            </button>
                          </>
                        )}
                        {report.status === 'SUBMITTED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsPaid(report.id)
                            }}
                            disabled={loading}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Đánh dấu đã thanh toán"
                          >
                            <FiDollarSign size={16} />
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

        {/* Create/Edit Modal */}
        {(showCreateModal || editingReport) && (
          <TaxReportModal
            report={editingReport}
            onClose={() => {
              setShowCreateModal(false)
              setEditingReport(null)
            }}
            onSuccess={() => {
              setShowCreateModal(false)
              setEditingReport(null)
              loadTaxReports()
              loadTaxSummary()
            }}
          />
        )}

        {/* Tax Detail Modal */}
        {showDetailModal && taxDetail && (
          <TaxDetailModal
            tax={taxDetail}
            onClose={() => {
              setShowDetailModal(false)
              setTaxDetail(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

// Tax Report Modal Component
function TaxReportModal({ report, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [form, setForm] = useState({
    taxType: report?.taxType || 'VAT',
    periodStart: report?.periodStart?.split('T')[0] || '',
    periodEnd: report?.periodEnd?.split('T')[0] || '',
    taxableRevenue: report?.taxableRevenue || '',
    taxRate: report?.taxRate || '10',
    notes: report?.notes || ''
  })

  const calculateRevenue = async () => {
    if (!form.periodStart || !form.periodEnd) {
      toast.error('Vui lòng chọn kỳ báo cáo trước')
      return
    }

    try {
      setCalculating(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `http://localhost:8080/api/accounting/tax/calculate-revenue?periodStart=${form.periodStart}&periodEnd=${form.periodEnd}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const result = await response.json()
      if (result.success) {
        const data = result.data

        // Tự động điền doanh thu chịu thuế
        if (form.taxType === 'VAT') {
          setForm({
            ...form,
            taxableRevenue: data.vatTaxableRevenue.toString()
          })
          toast.success(`Doanh thu chịu thuế VAT: ${data.vatTaxableRevenue.toLocaleString('vi-VN')} ₫`)
        } else {
          setForm({
            ...form,
            taxableRevenue: data.corporateTaxableRevenue.toString()
          })
          toast.success(`Lợi nhuận chịu thuế TNDN: ${data.corporateTaxableRevenue.toLocaleString('vi-VN')} ₫`)
        }
      } else {
        toast.error(result.message || 'Lỗi khi tính toán')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Lỗi khi tính toán doanh thu')
    } finally {
      setCalculating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.periodStart || !form.periodEnd) {
      toast.error('Vui lòng chọn kỳ báo cáo')
      return
    }

    if (!form.taxableRevenue || parseFloat(form.taxableRevenue) < 0) {
      toast.error('Vui lòng nhập doanh thu chịu thuế hợp lệ')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const url = report
        ? `http://localhost:8080/api/accounting/tax/reports/${report.id}`
        : 'http://localhost:8080/api/accounting/tax/reports'

      const response = await fetch(url, {
        method: report ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taxType: form.taxType,
          periodStart: form.periodStart,  // Send as date only (YYYY-MM-DD)
          periodEnd: form.periodEnd,      // Send as date only (YYYY-MM-DD)
          taxableRevenue: parseFloat(form.taxableRevenue),
          taxRate: parseFloat(form.taxRate)
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success(report ? 'Cập nhật báo cáo thành công' : 'Tạo báo cáo thành công')
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
            {report ? 'Sửa báo cáo thuế' : 'Tạo báo cáo thuế mới'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại thuế *</label>
                <select
                  value={form.taxType}
                  onChange={(e) => {
                    const newTaxType = e.target.value
                    setForm({
                      ...form,
                      taxType: newTaxType,
                      taxRate: newTaxType === 'VAT' ? '10' : '20'
                    })
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                  disabled={!!report}
                >
                  <option value="VAT">Thuế VAT (10%)</option>
                  <option value="CORPORATE_TAX">Thuế TNDN (20%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thuế suất (%) *</label>
                <input
                  type="number"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày *</label>
                <input
                  type="date"
                  value={form.periodStart}
                  onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày *</label>
                <input
                  type="date"
                  value={form.periodEnd}
                  onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Doanh thu chịu thuế *</label>
                  <button
                    type="button"
                    onClick={calculateRevenue}
                    disabled={calculating || !form.periodStart || !form.periodEnd}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {calculating ? '⏳ Đang tính...' : '🔄 Tính toán tự động'}
                  </button>
                </div>
                <input
                  type="number"
                  value={form.taxableRevenue}
                  onChange={(e) => setForm({ ...form, taxableRevenue: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="0"
                  required
                  min="0"
                  step="1000"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Số thuế phải nộp: {(parseFloat(form.taxableRevenue || '0') * parseFloat(form.taxRate) / 100).toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows={3}
                placeholder="Nhập ghi chú về báo cáo thuế..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Lưu ý:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sử dụng "Tính toán tự động" để lấy doanh thu từ hệ thống</li>
                <li>• Thuế VAT: Thường là 10% trên doanh thu bán hàng</li>
                <li>• Thuế TNDN: Thường là 20% trên lợi nhuận trước thuế</li>
                <li>• Báo cáo sẽ ở trạng thái "Nháp" sau khi tạo</li>
                <li>• Cần "Nộp báo cáo" trước khi "Đánh dấu đã thanh toán"</li>
              </ul>
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
                {loading ? 'Đang xử lý...' : (report ? 'Cập nhật' : 'Tạo báo cáo')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Tax Detail Modal Component
function TaxDetailModal({ tax, onClose }: { tax: any; onClose: () => void }) {
  const report = tax.report || tax
  const taxableTransactions = tax.taxableTransactions || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{report.reportCode}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {report.taxType === 'VAT' ? 'Thuế VAT' : 'Thuế Thu Nhập Doanh Nghiệp'}
              </p>
              <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${report.status === 'PAID' ? 'bg-green-100 text-green-800' :
                  report.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                {report.status === 'PAID' ? 'Đã nộp' : report.status === 'SUBMITTED' ? 'Đã gửi' : 'Nháp'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Thông tin kỳ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Kỳ báo cáo</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(report.periodStart).toLocaleDateString('vi-VN')} - {new Date(report.periodEnd).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Người tạo</p>
              <p className="text-sm font-semibold text-gray-900">{report.createdBy || '-'}</p>
            </div>
          </div>

          {/* Thông tin thuế */}
          <div className="space-y-3 mb-6">
            <div className="border-b pb-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Doanh thu chịu thuế</label>
              <p className="text-xl font-bold text-blue-700">
                {report.taxableRevenue?.toLocaleString('vi-VN')} ₫
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Thuế suất</label>
                <p className="text-lg font-semibold text-gray-900">{report.taxRate}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Số thuế phải nộp</label>
                <p className="text-lg font-semibold text-red-600">
                  {report.taxAmount?.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Đã thanh toán</label>
                <p className="text-lg font-semibold text-green-600">
                  {report.paidAmount?.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Còn nợ</label>
                <p className="text-lg font-semibold text-red-600">
                  {report.remainingTax?.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>
          </div>

          {/* Bảng giao dịch chịu thuế */}
          {taxableTransactions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                📊 Chi tiết doanh thu chịu thuế ({taxableTransactions.length} giao dịch)
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã GD</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {taxableTransactions.map((transaction: any) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {transaction.transactionCode}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(transaction.transactionDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {transaction.description || '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-semibold text-green-600">
                            {transaction.amount?.toLocaleString('vi-VN')} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                          Tổng cộng:
                        </td>
                        <td className="px-4 py-2 text-sm font-bold text-right text-blue-700">
                          {taxableTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Thời gian */}
          {(report.submittedAt || report.paidAt) && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Lịch sử</h4>
              <div className="space-y-1 text-sm text-blue-800">
                {report.submittedAt && (
                  <p>• Nộp báo cáo: {new Date(report.submittedAt).toLocaleString('vi-VN')}</p>
                )}
                {report.paidAt && (
                  <p>• Thanh toán: {new Date(report.paidAt).toLocaleString('vi-VN')}</p>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
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