'use client'

import { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiStar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [formData, setFormData] = useState({
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    description: '',
    sepayApiToken: '',
    sepayMerchantId: '',
    isActive: true,
    isDefault: false
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await axios.get(`${API_URL}/admin/bank-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAccounts(response.data.data || [])
    } catch (error: any) {
      toast.error('Lỗi khi tải danh sách tài khoản')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('auth_token')
      if (editingAccount) {
        await axios.put(`${API_URL}/admin/bank-accounts/${editingAccount.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Cập nhật tài khoản thành công')
      } else {
        await axios.post(`${API_URL}/admin/bank-accounts`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Thêm tài khoản thành công')
      }
      setShowModal(false)
      setEditingAccount(null)
      resetForm()
      loadAccounts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return
    try {
      const token = localStorage.getItem('auth_token')
      await axios.delete(`${API_URL}/admin/bank-accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Xóa tài khoản thành công')
      loadAccounts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài khoản')
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      await axios.put(`${API_URL}/admin/bank-accounts/${id}/set-default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Đã đặt làm tài khoản mặc định')
      loadAccounts()
    } catch (error: any) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleToggleActive = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      await axios.put(`${API_URL}/admin/bank-accounts/${id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadAccounts()
    } catch (error: any) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const openEditModal = (account: any) => {
    setEditingAccount(account)
    setFormData({
      bankCode: account.bankCode,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      description: account.description || '',
      sepayApiToken: account.sepayApiToken || '',
      sepayMerchantId: account.sepayMerchantId || '',
      isActive: account.isActive,
      isDefault: account.isDefault
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      bankCode: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      description: '',
      sepayApiToken: '',
      sepayMerchantId: '',
      isActive: true,
      isDefault: false
    })
  }

  const banks = [
    { code: 'MBBank', name: 'MB Bank' },
    { code: 'VCB', name: 'Vietcombank' },
    { code: 'TCB', name: 'Techcombank' },
    { code: 'ACB', name: 'ACB' },
    { code: 'VPBank', name: 'VPBank' },
    { code: 'Vietinbank', name: 'Vietinbank' },
    { code: 'BIDV', name: 'BIDV' },
    { code: 'Agribank', name: 'Agribank' },
  ]

  if (loading) {
    return <div className="p-8">Đang tải...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý tài khoản ngân hàng</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
        >
          <FiPlus className="mr-2" /> Thêm tài khoản
        </button>
      </div>

      <div className="grid gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold">{account.bankName}</h3>
                  {account.isDefault && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded flex items-center font-semibold">
                      <FiStar className="mr-1" size={12} /> Mặc định
                    </span>
                  )}
                  {account.isActive && !account.isDefault && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Kích hoạt</span>
                  )}
                  {!account.isActive && (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Tạm dừng</span>
                  )}
                </div>
                <p className="text-gray-600">Số TK: <span className="font-mono font-bold">{account.accountNumber}</span></p>
                <p className="text-gray-600">Tên TK: {account.accountName}</p>
                {account.description && <p className="text-sm text-gray-500 mt-2">{account.description}</p>}
              </div>
              <div className="flex gap-2">
                {!account.isDefault && (
                  <button
                    onClick={() => handleSetDefault(account.id)}
                    className="text-yellow-600 hover:text-yellow-700 p-2"
                    title="Đặt làm mặc định"
                  >
                    <FiStar size={20} />
                  </button>
                )}
                <button
                  onClick={() => handleToggleActive(account.id)}
                  className={`p-2 ${account.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                  title={account.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                >
                  {account.isActive ? <FiX size={20} /> : <FiCheck size={20} />}
                </button>
                <button
                  onClick={() => openEditModal(account)}
                  className="text-blue-600 hover:text-blue-700 p-2"
                >
                  <FiEdit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  disabled={account.isDefault}
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngân hàng</label>
                  <select
                    value={formData.bankCode}
                    onChange={(e) => {
                      const bank = banks.find(b => b.code === e.target.value)
                      setFormData({ ...formData, bankCode: e.target.value, bankName: bank?.name || '' })
                    }}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Chọn ngân hàng</option>
                    {banks.map(bank => (
                      <option key={bank.code} value={bank.code}>{bank.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số tài khoản</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tên tài khoản</label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ghi chú</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={2}
                  />
                </div>
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Thông tin SePay (tùy chọn)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">SePay API Token</label>
                      <input
                        type="text"
                        value={formData.sepayApiToken}
                        onChange={(e) => setFormData({ ...formData, sepayApiToken: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Nhập token từ SePay (nếu đã đăng ký)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">SePay Merchant ID</label>
                      <input
                        type="text"
                        value={formData.sepayMerchantId}
                        onChange={(e) => setFormData({ ...formData, sepayMerchantId: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Nhập merchant ID từ SePay (nếu có)"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 Lưu ý: Mỗi tài khoản ngân hàng cần đăng ký riêng trên website SePay để nhận webhook thanh toán
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    Kích hoạt
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="mr-2"
                    />
                    Đặt làm mặc định
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingAccount ? 'Cập nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingAccount(null); resetForm() }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
