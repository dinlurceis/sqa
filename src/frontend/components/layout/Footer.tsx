'use client'

import Link from 'next/link'
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaYoutube, FaInstagram } from 'react-icons/fa'
import { useTranslation } from '@/hooks/useTranslation'
import Logo from './Logo'

export default function Footer() {
  const { t } = useTranslation()
  
  const categories = [
    { name: 'Điện thoại', href: '/products?category=phone' },
    { name: 'Laptop', href: '/products?category=laptop' },
    { name: 'Tablet', href: '/products?category=tablet' },
    { name: 'Màn hình', href: '/products?category=monitor' },
    { name: 'Linh kiện máy tính', href: '/products?category=computer-parts' },
    { name: 'Điện máy', href: '/products?category=appliances' },
    { name: 'Đồng hồ', href: '/products?category=watch' },
    { name: 'Âm thanh', href: '/products?category=audio' },
    { name: 'Smart home', href: '/products?category=smart-home' },
    { name: 'Phụ kiện', href: '/products?category=accessories' },
  ]

  const supportLinks = [
    { name: 'Trung tâm hỗ trợ', href: '/support' },
    { name: 'Chính sách đổi mới và bảo hành', href: '/support/warranty' },
    { name: 'Dịch vụ bảo hành mở rộng', href: '/support/extended-warranty' },
    { name: 'Quy chế hoạt động', href: '/support/rules' },
    { name: 'Chương trình TechWorld Edu', href: '/support/education' },
  ]

  const companyLinks = [
    { name: 'Giới thiệu về TechWorld', href: '/about' },
    { name: 'Chăm sóc khách hàng', href: '/support/customer-care' },
    { name: 'Dịch vụ sửa chữa TechWorld Care', href: '/support/repair' },
    { name: 'Tra cứu bảo hành', href: '/warranty-check' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Logo size="sm" />
              <h3 className="text-lg font-bold">{t('techWorld')}</h3>
            </div>
            <p className="text-gray-300 mb-4">
              {t('techWorldSlogan')}
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <FaMapMarkerAlt size={14} />
                <span>96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaPhone size={14} />
                <span>1900.2091</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaEnvelope size={14} />
                <span>support@techworld.com</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Danh mục sản phẩm</h4>
            <div className="grid grid-cols-2 gap-2">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="text-gray-300 hover:text-navy-400 text-sm transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Hỗ trợ - dịch vụ</h4>
            <div className="space-y-2">
              {supportLinks.slice(0, 6).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-gray-300 hover:text-navy-400 text-sm transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Thông tin liên hệ</h4>
            <div className="space-y-2">
              {companyLinks.slice(0, 6).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-gray-300 hover:text-navy-400 text-sm transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-navy-400 mb-2">Tốt hơn về giá</div>
              <p className="text-sm text-gray-300">Thành viên - HSSV Ưu đãi riêng tới 5%</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-navy-400 mb-2">Trả máy lỗi</div>
              <p className="text-sm text-gray-300">Đổi máy liền</p>
            </div>
          </div>
        </div>

        {/* Social media */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-gray-300 hover:text-navy-400 transition-colors">
              <FaFacebook size={24} />
            </a>
            <a href="#" className="text-gray-300 hover:text-navy-400 transition-colors">
              <FaYoutube size={24} />
            </a>
            <a href="#" className="text-gray-300 hover:text-navy-400 transition-colors">
              <FaInstagram size={24} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-gray-800 py-4">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-gray-300">
            <p>{t('copyright')} © 2025. {t('allRightsReserved')}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
