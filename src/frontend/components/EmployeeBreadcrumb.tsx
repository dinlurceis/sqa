'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

interface BreadcrumbItem {
  name: string
  href?: string
}

interface EmployeeBreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function EmployeeBreadcrumb({ items }: EmployeeBreadcrumbProps) {
  const { user } = useAuthStore()

  const getHomePath = () => {
    // Check position for employees, role for admin
    const position = user?.position || user?.employee?.position
    
    if (user?.role === 'ADMIN') return '/admin'
    
    switch (position) {
      case 'WAREHOUSE':
      case 'PRODUCT_MANAGER':
      case 'ACCOUNTANT':
      case 'SALES':
      case 'SALE':
      case 'CSKH':
      case 'SHIPPER':
        return '/employee'
      default:
        return '/'
    }
  }

  const getHomeName = () => {
    const position = user?.position || user?.employee?.position
    
    if (user?.role === 'ADMIN') return 'Quản trị'
    
    switch (position) {
      case 'WAREHOUSE':
        return 'Kho hàng'
      case 'PRODUCT_MANAGER':
        return 'Quản lý SP'
      default:
        return 'Trang chủ'
    }
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link href={getHomePath()} className="hover:text-red-500">
        {getHomeName()}
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center space-x-2">
          <span>/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-red-500">
              {item.name}
            </Link>
          ) : (
            <span className="text-gray-900">{item.name}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
