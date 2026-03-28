'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Logo from '@/components/layout/Logo'

export default function FirstChangePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!email) {
      toast.error('Thiếu thông tin email')
      router.push('/login')
    }
  }, [email, router])

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber,
      errors: [
        password.length < minLength && `Tối thiểu ${minLength} ký tự`,
        !hasUpperCase && 'Ít nhất 1 chữ hoa',
        !hasLowerCase && 'Ít nhất 1 chữ thường',
        !hasNumber && 'Ít nhất 1 số'
      ].filter(Boolean)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!formData.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại')
      return
    }

    const passwordValidation = validatePassword(formData.newPassword)
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0] as string)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu cũ')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/auth/first-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      })

      const data = await response.json()

      if (data.success || response.ok) {
        toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        toast.error(data.message || 'Đổi mật khẩu thất bại')
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = validatePassword(formData.newPassword)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">
          Đổi mật khẩu lần đầu
        </h2>
        <p className="text-sm text-center text-gray-600 mb-8">
          Vui lòng đổi mật khẩu để bảo mật tài khoản của bạn
        </p>

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Đây là lần đăng nhập đầu tiên. Bạn cần đổi mật khẩu 
            mặc định do admin cung cấp sang mật khẩu mới để bảo mật tài khoản.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email || ''}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nhập mật khẩu do admin cung cấp"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            
            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="mt-2 space-y-1">
                <div className={`text-xs flex items-center ${
                  formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <FiCheck size={14} className="mr-1" />
                  Tối thiểu 8 ký tự
                </div>
                <div className={`text-xs flex items-center ${
                  /[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <FiCheck size={14} className="mr-1" />
                  Ít nhất 1 chữ hoa
                </div>
                <div className={`text-xs flex items-center ${
                  /[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <FiCheck size={14} className="mr-1" />
                  Ít nhất 1 chữ thường
                </div>
                <div className={`text-xs flex items-center ${
                  /[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <FiCheck size={14} className="mr-1" />
                  Ít nhất 1 số
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Mật khẩu không khớp</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !passwordStrength.isValid || formData.newPassword !== formData.confirmPassword}
            className="w-full bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>

          {/* Back to Login */}
          <div className="text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-800">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
