'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { 
  FiShoppingCart, FiHome, FiUsers, FiUser, FiPackage, 
  FiShoppingBag, FiTruck, FiBarChart2, FiCalendar, FiSettings,
  FiChevronDown, FiChevronRight, FiDollarSign, FiLogOut
} from 'react-icons/fi'
import toast from 'react-hot-toast'

interface MenuItem {
  icon: any
  label: string
  href?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { icon: FiHome, label: 'Bảng điều khiển', href: '/admin' },
  { 
    icon: FiUsers, 
    label: 'Quản lý nhân viên',
    children: [
      { icon: FiUser, label: 'Duyệt nhân viên', href: '/admin/employee-approval' },
    ]
  },
  { 
    icon: FiShoppingCart, 
    label: 'Quản lý đơn hàng',
    href: '/admin/orders'
  },
  { 
    icon: FiPackage, 
    label: 'Quản lý sản phẩm',
    children: [
      { icon: FiPackage, label: 'Danh sách sản phẩm', href: '/admin/products' },
      { icon: FiPackage, label: 'Thêm sản phẩm', href: '/admin/products/create' },
      { icon: FiPackage, label: 'Đăng bán', href: '/admin/products/publish' },
      { icon: FiPackage, label: 'Danh mục', href: '/admin/categories' },
    ]
  },
  { 
    icon: FiTruck, 
    label: 'Quản lý kho',
    children: [
      { icon: FiTruck, label: 'Tổng quan kho', href: '/admin/warehouse' },
      { icon: FiTruck, label: 'Phiếu nhập kho', href: '/admin/warehouse/import' },
      { icon: FiTruck, label: 'Phiếu xuất kho', href: '/admin/warehouse/export' },
      { icon: FiTruck, label: 'Tồn kho', href: '/admin/warehouse/inventory' },
      { icon: FiTruck, label: 'Sản phẩm kho', href: '/admin/warehouse/products' },
      { icon: FiTruck, label: 'Đơn hàng cần xuất', href: '/admin/warehouse/orders' },
      { icon: FiTruck, label: 'Báo cáo kho', href: '/admin/warehouse/reports' },
      { icon: FiTruck, label: 'Nhà cung cấp', href: '/admin/suppliers' },
    ]
  },
  { 
    icon: FiDollarSign, 
    label: 'Kế toán',
    children: [
      { icon: FiDollarSign, label: 'Giao dịch tài chính', href: '/admin/accounting/transactions' },
      { icon: FiDollarSign, label: 'Kỳ kế toán', href: '/admin/accounting/periods' },
      { icon: FiDollarSign, label: 'Quản lý thuế', href: '/admin/accounting/tax' },
      { icon: FiDollarSign, label: 'Báo cáo nâng cao', href: '/admin/accounting/advanced-reports' },
      { icon: FiDollarSign, label: 'Đối soát vận chuyển', href: '/admin/accounting/shipping' },
      { icon: FiDollarSign, label: 'Công nợ NCC', href: '/admin/accounting/payables' },
    ]
  },
  { icon: FiSettings, label: 'Sửa tên phường/xã', href: '/admin/fix-ward-names' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const handleLogout = () => {
    logout()
    toast.success('Đăng xuất thành công')
    router.push('/login')
  }

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isParentActive = (children?: MenuItem[]) => {
    if (!children) return false
    return children.some(child => isActive(child.href))
  }

  return (
    <div className="w-64 bg-[#1e3a5f] min-h-screen flex flex-col">
      {/* User Profile Section */}
      <div className="p-6 border-b border-[#2d4a6f]">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
            <FiUser className="text-gray-600" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">
              {user?.fullName || user?.email || 'Admin'}
            </p>
            <p className="text-gray-300 text-xs">Chào mừng bạn trở lại</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item, index) => (
          <div key={index}>
            {item.children ? (
              // Menu with submenu
              <div>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center justify-between px-6 py-3 text-sm transition-colors ${
                    isParentActive(item.children)
                      ? 'bg-[#fbbf24] text-gray-900'
                      : 'text-gray-300 hover:bg-[#2d4a6f] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {expandedMenus.includes(item.label) ? (
                    <FiChevronDown size={16} />
                  ) : (
                    <FiChevronRight size={16} />
                  )}
                </button>
                
                {/* Submenu */}
                {expandedMenus.includes(item.label) && (
                  <div className="bg-[#152a45]">
                    {item.children.map((child, childIndex) => (
                      <Link
                        key={childIndex}
                        href={child.href || '#'}
                        className={`flex items-center space-x-3 px-12 py-2.5 text-sm transition-colors ${
                          isActive(child.href)
                            ? 'bg-[#fbbf24] text-gray-900'
                            : 'text-gray-300 hover:bg-[#2d4a6f] hover:text-white'
                        }`}
                      >
                        <span className="text-xs">•</span>
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Single menu item
              <Link
                href={item.href || '#'}
                className={`flex items-center space-x-3 px-6 py-3 text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-[#fbbf24] text-gray-900'
                    : 'text-gray-300 hover:bg-[#2d4a6f] hover:text-white'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-[#2d4a6f]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-300 hover:bg-[#2d4a6f] hover:text-white rounded-lg transition-colors"
        >
          <FiLogOut size={18} />
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#2d4a6f]">
        <p className="text-gray-400 text-xs text-center">
          © 2025 WEB TMDT
        </p>
      </div>
    </div>
  )
}
