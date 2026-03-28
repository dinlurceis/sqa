'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { 
  FiMessageCircle, FiBook, FiTool, FiShield, 
  FiPhone, FiSearch, FiClock, FiUser,
  FiHelpCircle, FiArrowRight, FiCheckCircle,
  FiFileText, FiAward, FiBookOpen
} from 'react-icons/fi'
import Link from 'next/link'
import { supportApi } from '@/lib/api'

interface SupportStats {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
}

const quickLinks = [
  {
    title: 'Tạo yêu cầu hỗ trợ',
    description: 'Gửi ticket để được hỗ trợ nhanh chóng',
    icon: FiMessageCircle,
    href: '/supports',
    color: 'bg-blue-500'
  },
  {
    title: 'Tra cứu bảo hành',
    description: 'Kiểm tra tình trạng bảo hành sản phẩm',
    icon: FiShield,
    href: '/warranty-check',
    color: 'bg-green-500'
  },
  {
    title: 'Dịch vụ sửa chữa',
    description: 'Đặt lịch sửa chữa thiết bị',
    icon: FiTool,
    href: '/support/repair',
    color: 'bg-orange-500'
  },
  {
    title: 'Liên hệ hotline',
    description: '1900.2091 - Hỗ trợ 24/7',
    icon: FiPhone,
    href: '/contact',
    color: 'bg-red-500'
  }
]

const supportCategories = [
  { title: 'Chính sách bảo hành', description: 'Thông tin về chính sách đổi mới và bảo hành sản phẩm', icon: FiShield, href: '/support/warranty', articles: 5 },
  { title: 'Dịch vụ sửa chữa', description: 'TechWorld Care - Dịch vụ sửa chữa chuyên nghiệp', icon: FiTool, href: '/support/repair', articles: 3 },
  { title: 'Chăm sóc khách hàng', description: 'Thông tin liên hệ và dịch vụ hỗ trợ', icon: FiHelpCircle, href: '/support/customer-care', articles: 4 },
  { title: 'Bảo hành mở rộng', description: 'Gói bảo hành mở rộng cho sản phẩm', icon: FiAward, href: '/support/extended-warranty', articles: 2 },
  { title: 'TechWorld Edu', description: 'Chương trình ưu đãi cho học sinh, sinh viên', icon: FiBookOpen, href: '/support/education', articles: 3 },
  { title: 'Quy chế hoạt động', description: 'Quy định và điều khoản sử dụng dịch vụ', icon: FiFileText, href: '/support/rules', articles: 6 }
]

const faqItems = [
  { question: 'Làm thế nào để tra cứu bảo hành sản phẩm?', answer: 'Bạn có thể tra cứu bảo hành bằng cách nhập số serial hoặc IMEI sản phẩm tại trang Tra cứu bảo hành.' },
  { question: 'Thời gian xử lý yêu cầu hỗ trợ là bao lâu?', answer: 'Chúng tôi cam kết phản hồi trong vòng 24 giờ làm việc cho tất cả các yêu cầu hỗ trợ.' },
  { question: 'Tôi có thể đổi trả sản phẩm trong bao lâu?', answer: 'Sản phẩm có thể đổi mới trong vòng 7 ngày nếu bị lỗi kỹ thuật do nhà sản xuất.' },
  { question: 'Làm sao để đặt lịch sửa chữa?', answer: 'Bạn có thể đặt lịch sửa chữa trực tiếp tại cửa hàng hoặc liên hệ hotline 1900.2091.' }
]

export default function SupportPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState<SupportStats>({ totalTickets: 0, openTickets: 0, resolvedTickets: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Chỉ load stats cho CUSTOMER, không load cho EMPLOYEE/ADMIN
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER'

  useEffect(() => {
    if (isCustomer) {
      loadStats()
    }
  }, [isCustomer])

  const loadStats = async () => {
    try {
      const res = await supportApi.listTickets()
      if (res.success && res.data) {
        const tickets = res.data
        setStats({
          totalTickets: tickets.length,
          openTickets: tickets.filter((t: any) => t.status === 'open' || t.status === 'pending').length,
          resolvedTickets: tickets.filter((t: any) => t.status === 'closed' || t.status === 'resolved').length
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for:', searchQuery)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="header-gradient text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Trung tâm Hỗ trợ TechWorld</h1>
            <p className="text-lg text-blue-100 mb-8">Chúng tôi luôn sẵn sàng hỗ trợ bạn. Tìm kiếm câu trả lời hoặc liên hệ với đội ngũ hỗ trợ.</p>
            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi, hướng dẫn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Tìm kiếm
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <Link key={index} href={link.href} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow flex items-start gap-4">
              <div className={`${link.color} text-white p-3 rounded-lg`}>
                <link.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{link.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* User Stats - Chỉ hiển thị cho CUSTOMER */}
      {isCustomer && (
        <div className="container mx-auto px-4 mt-12">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <FiUser className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Xin chào, {user?.fullName || user?.email}</h2>
                  <p className="text-gray-500 text-sm">Quản lý yêu cầu hỗ trợ của bạn</p>
                </div>
              </div>
              <Link href="/supports" className="btn-primary flex items-center gap-2">
                <FiMessageCircle className="w-5 h-5" />
                Xem tất cả tickets
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg"><FiMessageCircle className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                    <p className="text-sm text-gray-500">Tổng số tickets</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg"><FiClock className="w-5 h-5 text-orange-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                    <p className="text-sm text-gray-500">Đang xử lý</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg"><FiCheckCircle className="w-5 h-5 text-green-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
                    <p className="text-sm text-gray-500">Đã giải quyết</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Categories */}
      <div className="container mx-auto px-4 mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Danh mục hỗ trợ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportCategories.map((category, index) => (
            <Link key={index} href={category.href} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1 group">
              <div className="flex items-start gap-4">
                <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                  <category.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{category.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                  <div className="flex items-center gap-2 mt-3 text-sm text-blue-600">
                    <FiBook className="w-4 h-4" />
                    <span>{category.articles} bài viết</span>
                    <FiArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 mt-12 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Câu hỏi thường gặp</h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {faqItems.map((item, index) => (
            <div key={index} className="border-b border-gray-100 last:border-b-0">
              <button onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="font-medium text-gray-900">{item.question}</span>
                <FiArrowRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedFaq === index ? 'rotate-90' : ''}`} />
              </button>
              {expandedFaq === index && <div className="px-6 pb-4 text-gray-600">{item.answer}</div>}
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-gray-500 mb-4">Không tìm thấy câu trả lời bạn cần?</p>
          <Link href="/support/tickets" className="btn-primary inline-flex items-center gap-2">
            <FiMessageCircle className="w-5 h-5" />
            Gửi yêu cầu hỗ trợ
          </Link>
        </div>
      </div>

      {/* Contact Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Cần hỗ trợ ngay?</h2>
            <p className="text-blue-100 mb-6">Đội ngũ chăm sóc khách hàng của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="tel:19002091" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
                <FiPhone className="w-5 h-5" />
                1900.2091
              </a>
              <Link href="/contact" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Liên hệ với chúng tôi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
