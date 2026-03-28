'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiUsers,
  FiTruck,
  FiDollarSign,
  FiLogOut,
  FiUser,
  FiGrid,
  FiList,
  FiFileText,
  FiBox,
  FiArchive,
  FiMessageCircle,
  FiHeadphones
} from 'react-icons/fi'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { hasPermission, POSITION_NAMES, type Position } from '@/lib/permissions'
import NotificationBell from '@/components/NotificationBell'

interface MenuItem {
  title: string
  icon: React.ReactNode
  path: string
  permission?: string // If undefined, all employees can see
  children?: MenuItem[]
}

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, employee, logout, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
      toast.error('Bạn không có quyền truy cập')
      router.push('/login')
    }
  }, [mounted, isAuthenticated, user, router])

  const handleLogout = () => {
    logout()
    toast.success('Đăng xuất thành công')
    router.push('/login')
  }

  // Menu items - All employees can see all pages
  const menuItems: MenuItem[] = [
    {
      title: 'Trang chủ',
      icon: <FiHome size={20} />,
      path: '/employee',
    },
    {
      title: 'Sản phẩm',
      icon: <FiPackage size={20} />,
      path: '/employee/products',
      children: [
        {
          title: 'Danh sách sản phẩm',
          icon: <FiList size={18} />,
          path: '/employee/products',
        },
        {
          title: 'Danh mục',
          icon: <FiGrid size={18} />,
          path: '/employee/categories',
        },
      ]
    },
    {
      title: 'Kho hàng',
      icon: <FiBox size={20} />,
      path: '/employee/warehouse',
      children: [
        {
          title: 'Tổng quan kho',
          icon: <FiBox size={18} />,
          path: '/employee/warehouse',
        },
        {
          title: 'Phiếu nhập kho',
          icon: <FiArchive size={18} />,
          path: '/employee/warehouse/import',
        },
        {
          title: 'Phiếu xuất kho',
          icon: <FiArchive size={18} />,
          path: '/employee/warehouse/export',
        },
        {
          title: 'Tồn kho',
          icon: <FiBox size={18} />,
          path: '/employee/warehouse/inventory',
        },
        {
          title: 'Sản phẩm kho',
          icon: <FiPackage size={18} />,
          path: '/employee/warehouse/products',
        },
        {
          title: 'Đơn hàng cần xuất',
          icon: <FiShoppingCart size={18} />,
          path: '/employee/warehouse/orders',
        },
        {
          title: 'Báo cáo kho',
          icon: <FiFileText size={18} />,
          path: '/employee/warehouse/reports',
        },
      ]
    },
    {
      title: 'Đơn hàng',
      icon: <FiShoppingCart size={20} />,
      path: '/employee/orders',
    },
    {
      title: 'Khách hàng',
      icon: <FiUsers size={20} />,
      path: '/employee/customers',
    },
    {
      title: 'Nhà cung cấp',
      icon: <FiTruck size={20} />,
      path: '/employee/suppliers',
    },
    {
      title: 'Kế toán',
      icon: <FiDollarSign size={20} />,
      path: '/employee/accounting',
      children: [
        {
          title: 'Giao dịch tài chính',
          icon: <FiFileText size={18} />,
          path: '/employee/accounting/transactions',
        },
        {
          title: 'Kỳ kế toán',
          icon: <FiFileText size={18} />,
          path: '/employee/accounting/periods',
        },
        {
          title: 'Quản lý thuế',
          icon: <FiDollarSign size={18} />,
          path: '/employee/accounting/tax',
        },
        {
          title: 'Báo cáo nâng cao',
          icon: <FiFileText size={18} />,
          path: '/employee/accounting/advanced-reports',
        },
        {
          title: 'Đối soát vận chuyển',
          icon: <FiTruck size={18} />,
          path: '/employee/accounting/shipping',
        },
        {
          title: 'Công nợ NCC',
          icon: <FiDollarSign size={18} />,
          path: '/employee/accounting/payables',
        },
      ]
    },
    {
      title: 'Giao hàng',
      icon: <FiTruck size={20} />,
      path: '/employee/shipping',
    },
    {
      title: 'Hỗ trợ khách hàng',
      icon: <FiHeadphones size={20} />,
      path: '/employee/support',
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 w-64">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/employee" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Employee</span>
            </Link>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FiUser className="text-blue-500" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {employee?.fullName || user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {employee?.position ? POSITION_NAMES[employee.position as Position] : 'Nhân viên'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <MenuItem key={item.path} item={item} pathname={pathname} />
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiLogOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-64">
        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Floating Notification Bell */}
      <NotificationBell floating />
    </div>
  )
}

// Menu item component with children support
function MenuItem({ item, pathname }: { item: MenuItem; pathname: string }) {
  const [expanded, setExpanded] = useState(false)
  const isActive = pathname === item.path || pathname.startsWith(item.path + '/')

  useEffect(() => {
    if (isActive && item.children) {
      setExpanded(true)
    }
  }, [isActive, item.children])

  if (item.children) {
    return (
      <li>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center space-x-3">
            {item.icon}
            <span className="text-sm font-medium">{item.title}</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && (
          <ul className="ml-4 mt-1 space-y-1">
            {item.children.map((child) => (
              <MenuItem key={child.path} item={child} pathname={pathname} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <li>
      <Link
        href={item.path}
        className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {item.icon}
        <span className="text-sm font-medium">{item.title}</span>
      </Link>
    </li>
  )
}
