'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiFileText, FiAlertCircle, FiCalendar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { PermissionButton } from '@/components/PermissionGuard'

export default function AccountingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [taxSummary, setTaxSummary] = useState<any>(null)
  const [currentPeriod, setCurrentPeriod] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      // Load financial statement dashboard (tháng hiện tại)
      const statsResponse = await fetch('http://localhost:8080/api/accounting/financial-statement/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsResult = await statsResponse.json()
      if (statsResult.success) {
        setStats(statsResult.data)
      }

      // Load recent transactions
      const transResponse = await fetch('http://localhost:8080/api/accounting/transactions?page=0&size=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const transResult = await transResponse.json()
      if (transResult.success) {
        setRecentTransactions(transResult.data?.content || [])
      }

      // Load tax summary
      const taxResponse = await fetch('http://localhost:8080/api/accounting/tax/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const taxResult = await taxResponse.json()
      if (taxResult.success) {
        setTaxSummary(taxResult.data)
      }

      // Load current period
      const periodResponse = await fetch('http://localhost:8080/api/accounting/periods', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const periodResult = await periodResponse.json()
      if (periodResult.success && periodResult.data?.length > 0) {
        // Get the most recent open period
        const openPeriod = periodResult.data.find((p: any) => p.status === 'OPEN')
        setCurrentPeriod(openPeriod || periodResult.data[0])
      }

    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan kế toán</h1>
          <p className="mt-2 text-gray-600">Thống kê tài chính và kế toán doanh nghiệp</p>
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {stats?.totalRevenue?.toLocaleString('vi-VN') || '0'} ₫
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiTrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng chi phí</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {stats?.totalExpense?.toLocaleString('vi-VN') || '0'} ₫
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FiTrendingDown className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lợi nhuận ròng</p>
                <p className={`text-2xl font-bold mt-2 ${(stats?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {stats?.netProfit?.toLocaleString('vi-VN') || '0'} ₫
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
                <p className="text-sm text-gray-600">Tổng nợ thuế</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {taxSummary?.totalOwed?.toLocaleString('vi-VN') || '0'} ₫
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <FiAlertCircle className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Current Period Info */}
        {currentPeriod && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <FiCalendar className="mr-2" size={20} />
                  <h3 className="text-lg font-semibold">Kỳ kế toán hiện tại</h3>
                </div>
                <p className="text-2xl font-bold mb-2">{currentPeriod.name}</p>
                <p className="text-blue-100">
                  {new Date(currentPeriod.startDate).toLocaleDateString('vi-VN')} - {new Date(currentPeriod.endDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  currentPeriod.status === 'OPEN' 
                    ? 'bg-green-400 text-green-900' 
                    : 'bg-gray-400 text-gray-900'
                }`}>
                  {currentPeriod.status === 'OPEN' ? 'Đang mở' : 'Đã chốt'}
                </span>
                {currentPeriod.totalRevenue && (
                  <p className="mt-3 text-sm">
                    Doanh thu kỳ: <span className="font-bold">{currentPeriod.totalRevenue.toLocaleString('vi-VN')} ₫</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Giao dịch gần đây</h3>
                <button
                  onClick={() => router.push('/employee/accounting/transactions')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xem tất cả →
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((trans) => (
                    <div key={trans.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          trans.type === 'REVENUE' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <FiFileText className={trans.type === 'REVENUE' ? 'text-green-600' : 'text-red-600'} size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{trans.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(trans.transactionDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${
                        trans.type === 'REVENUE' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trans.type === 'REVENUE' ? '+' : '-'}{trans.amount?.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Chưa có giao dịch nào</p>
              )}
            </div>
          </div>

          {/* Tax Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tình hình thuế</h3>
                <button
                  onClick={() => router.push('/employee/accounting/tax')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xem chi tiết →
                </button>
              </div>
            </div>
            <div className="p-6">
              {taxSummary ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Thuế VAT</p>
                      <p className="text-xs text-gray-500">Còn nợ</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">
                      {taxSummary.vatOwed?.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Thuế TNDN</p>
                      <p className="text-xs text-gray-500">Còn nợ</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">
                      {taxSummary.corporateOwed?.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-3 bg-orange-50 rounded-lg px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tổng thuế đã nộp</p>
                      <p className="text-xs text-gray-500">Tất cả loại thuế</p>
                    </div>
                    <p className="text-sm font-semibold text-green-600">
                      {taxSummary.totalPaid?.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Chưa có dữ liệu thuế</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Truy cập nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <PermissionButton
              requiredPosition="ACCOUNTANT"
              onClick={() => router.push('/employee/accounting/transactions')}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
            >
              <FiFileText className="mx-auto mb-2 text-blue-600" size={24} />
              <p className="text-sm font-medium text-gray-900">Giao dịch</p>
            </PermissionButton>
            <PermissionButton
              requiredPosition="ACCOUNTANT"
              onClick={() => router.push('/employee/accounting/periods')}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
            >
              <FiCalendar className="mx-auto mb-2 text-green-600" size={24} />
              <p className="text-sm font-medium text-gray-900">Kỳ kế toán</p>
            </PermissionButton>
            <PermissionButton
              requiredPosition="ACCOUNTANT"
              onClick={() => router.push('/employee/accounting/tax')}
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center"
            >
              <FiDollarSign className="mx-auto mb-2 text-orange-600" size={24} />
              <p className="text-sm font-medium text-gray-900">Thuế</p>
            </PermissionButton>
            <PermissionButton
              requiredPosition="ACCOUNTANT"
              onClick={() => router.push('/employee/accounting/payables')}
              className="p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-center"
            >
              <FiAlertCircle className="mx-auto mb-2 text-red-600" size={24} />
              <p className="text-sm font-medium text-gray-900">Công nợ NCC</p>
            </PermissionButton>
            <PermissionButton
              requiredPosition="ACCOUNTANT"
              onClick={() => router.push('/employee/accounting/advanced-reports')}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
            >
              <FiTrendingUp className="mx-auto mb-2 text-purple-600" size={24} />
              <p className="text-sm font-medium text-gray-900">Báo cáo</p>
            </PermissionButton>
          </div>
        </div>
      </div>
    </div>
  )
}
