'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { FaFacebook } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import Logo from "@/components/layout/Logo"
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

const LoginPage = () => {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { clearCart, setUserId } = useCartStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'email') setEmail(value)
    else if (name === 'password') setPassword(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authApi.login({ email, password })
      
      if (response.success && response.data) {
        // Kiểm tra nếu cần đổi mật khẩu lần đầu
        if (response.data.requireChangePassword) {
          toast('Vui lòng đổi mật khẩu lần đầu!', { icon: 'ℹ️' })
          router.push(`/first-change-password?email=${encodeURIComponent(email)}`)
          return
        }

        // Xóa giỏ hàng cũ và set userId mới
        clearCart()
        setUserId(response.data.userId)

        // Lưu thông tin đăng nhập
        setAuth(
          {
            id: response.data.userId,
            email: response.data.email,
            fullName: response.data.fullName,
            phone: response.data.phone,
            address: response.data.address,
            role: response.data.role, // Giữ nguyên role gốc
            position: response.data.position, // Thêm position ở level user
            status: response.data.status,
            employeeId: response.data.employeeId, // Lưu employeeId ở level user
            // Thêm employee object nếu là EMPLOYEE
            employee: response.data.role === 'EMPLOYEE' ? {
              id: response.data.employeeId, // QUAN TRỌNG: Lưu employeeId vào employee.id
              fullName: response.data.fullName,
              phone: response.data.phone,
              address: response.data.address,
              position: response.data.position,
              firstLogin: false
            } : undefined
          },
          response.data.token
        )
    
        toast.success('Đăng nhập thành công!')
        
        // Redirect theo role
        if (response.data.role === 'ADMIN') {
          router.push('/admin')
        } else if (response.data.role === 'EMPLOYEE') {
          router.push('/employee')
        } else {
          // CUSTOMER hoặc role khác
          router.push('/')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại!')
    } finally {
    setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
            </div>
        <h2 className="mb-1 text-center text-2xl font-bold text-gray-800">
            Đăng nhập tài khoản
          </h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-medium text-red-500 hover:text-red-600">
            Đăng ký ngay
          </Link>
          {' | '}
          <Link href="/employee-register" className="font-medium text-blue-500 hover:text-blue-600">
            Đăng ký nhân viên
          </Link>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
                Email
              </label>
              <div className="relative">
                <input
                type="email"
                  id="email"
                  name="email"
                value={email}
                  onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Nhập email của bạn"
                />
              </div>
            </div>
            <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                value={password}
                  onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                >
                  {showPassword ? (
                  <FiEyeOff className="h-5 w-5" />
                  ) : (
                  <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                id="remember"
                  type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-900"
              >
                  Ghi nhớ đăng nhập
                </label>
              </div>
            <Link
              href="/forgot-password"
              className="text-sm text-red-600 hover:underline"
            >
                  Quên mật khẩu?
                </Link>
              </div>
              <button
                type="submit"
            className="w-full rounded-md bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
        </form>
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 flex-shrink text-sm text-gray-500">Hoặc</span>
          <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <div className="space-y-3">
          <button className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <FcGoogle className="mr-2 h-5 w-5" />
                Đăng nhập với Google
              </button>
          <button className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <FaFacebook className="mr-2 h-5 w-5" />
                Đăng nhập với Facebook
              </button>
            </div>
        <p className="mt-6 text-center text-xs text-gray-500">
            Bằng việc đăng nhập, bạn đồng ý với{' '}
          <Link href="/terms" className="font-semibold text-red-600">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
          <Link href="/privacy" className="font-semibold text-red-600">
              Chính sách bảo mật
            </Link>{' '}
            của chúng tôi.
          </p>
        </div>
      </div>
  );
};

export default LoginPage;
