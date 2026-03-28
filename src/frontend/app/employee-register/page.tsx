'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Logo from '@/components/layout/Logo'
import { FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiFileText } from 'react-icons/fi'

export default function EmployeeRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    phone: '', 
    address: '',
    position: '',
    note: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const positions = [
    { value: 'SALE', label: 'Nhân viên bán hàng' },
    { value: 'CSKH', label: 'Chăm sóc khách hàng' },
    { value: 'PRODUCT_MANAGER', label: 'Quản lý sản phẩm' },
    { value: 'WAREHOUSE', label: 'Nhân viên kho' },
    { value: 'ACCOUNTANT', label: 'Kế toán' },
    { value: 'SHIPPER', label: 'Nhân viên giao hàng' },

  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.fullName || !form.email || !form.phone || !form.position) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    const requestBody = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      address: form.address || null,
      position: form.position,
      note: form.note || null
    }

    console.log('=== FRONTEND SENDING REQUEST ===')
    console.log('URL:', 'http://localhost:8080/api/employee-registration/apply')
    console.log('Request Body:', requestBody)

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8080/api/employee-registration/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Response Status:', response.status)
      console.log('Response OK:', response.ok)

      const data = await response.json()
      console.log('Response Data:', data)

      if (data.success || response.ok) {
        if (data.data && data.data.id) {
          console.log('Registration saved with ID:', data.data.id)
          toast.success(`Đăng ký thành công . Vui lòng chờ quản trị viên phê duyệt.`)
        } else {
          toast.success('Gửi yêu cầu đăng ký nhân viên thành công! Vui lòng chờ quản trị viên phê duyệt.')
        }
        
        // Delay để user đọc được message
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        console.error('❌ Registration failed:', data)
        toast.error(data.message || 'Đăng ký thất bại')
      }
    } catch (err: any) {
      console.error('❌ Exception:', err)
      toast.error(err.message || 'Đăng ký thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">Đăng ký nhân viên</h2>
        <p className="text-sm text-center text-gray-600 mb-8">
          Điền thông tin để gửi yêu cầu đăng ký làm nhân viên. Quản trị viên sẽ xem xét và phê duyệt.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  name="fullName" 
                  value={form.fullName} 
                  onChange={handleChange} 
                  required 
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  name="phone" 
                  type="tel"
                  value={form.phone} 
                  onChange={handleChange} 
                  required
                  placeholder="0123456789"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vị trí ứng tuyển <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select 
                  name="position" 
                  value={form.position} 
                  onChange={handleChange} 
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                >
                  <option value="">Chọn vị trí</option>
                  {positions.map(pos => (
                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-3 text-gray-400" />
              <input 
                name="address" 
                value={form.address} 
                onChange={handleChange}
                placeholder="Số nhà, đường, phường, quận, thành phố"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <div className="relative">
              <FiFileText className="absolute left-3 top-3 text-gray-400" />
              <textarea 
                name="note" 
                value={form.note} 
                onChange={handleChange}
                rows={4}
                placeholder="Kinh nghiệm làm việc, kỹ năng, hoặc thông tin bổ sung..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Sau khi gửi yêu cầu, quản trị viên sẽ xem xét hồ sơ của bạn. 
              Nếu được chấp nhận, bạn sẽ nhận được email thông báo kèm mật khẩu đăng nhập.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <Link href="/login" className="text-sm text-red-500 hover:text-red-600 font-medium">
              ← Quay lại đăng nhập
            </Link>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full sm:w-auto bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu đăng ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
