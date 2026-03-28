'use client'

import { useState } from 'react'
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend } from 'react-icons/fi'
import { useTranslation } from '@/hooks/useTranslation'

export default function ContactPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <a href="/" className="hover:text-navy-500">{t('home')}</a>
          <span>/</span>
          <span className="text-gray-900">{t('contact')}</span>
        </nav>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('contactUs')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('contactDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('contactInfo')}</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-navy-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiMapPin className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{t('address')}</h3>
                      <p className="text-gray-600">
                        Số 89 Đường Tam Trinh, Phường Vĩnh Tuy<br />
                        Quận Hai Bà Trưng, Hà Nội, Việt Nam
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-navy-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiPhone className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{t('phone')}</h3>
                      <p className="text-gray-600">
                        Hotline: 1900.2091<br />
                        Tư vấn mua hàng: 1900.2091 (Nhánh 1)<br />
                        Bảo hành: 1900.2091 (Nhánh 2)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-navy-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiMail className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{t('email')}</h3>
                      <p className="text-gray-600">
                        support@techworld.com<br />
                        info@techworld.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-navy-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiClock className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{t('workingHours')}</h3>
                      <p className="text-gray-600">
                        Thứ 2 - Chủ nhật: 8:30 - 21:30<br />
                        Hỗ trợ 24/7 qua hotline
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                <p className="text-gray-500">Bản đồ sẽ được hiển thị ở đây</p>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('sendMessage')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fullName')} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      placeholder={t('enterFullName')}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('email')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      placeholder={t('enterEmail')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('phone')}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      placeholder={t('enterPhone')}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('subject')} *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    >
                      <option value="">{t('selectSubject')}</option>
                      <option value="support">{t('support')}</option>
                      <option value="sales">{t('sales')}</option>
                      <option value="warranty">{t('warranty')}</option>
                      <option value="complaint">{t('complaint')}</option>
                      <option value="other">{t('other')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('message')} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    placeholder={t('enterMessage')}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-navy-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-navy-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <FiSend size={20} />
                  <span>{t('sendMessage')}</span>
                </button>
              </form>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('faq')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{t('howToOrder')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('howToOrderAnswer')}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{t('deliveryTime')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('deliveryTimeAnswer')}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{t('returnPolicy')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('returnPolicyAnswer')}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{t('warrantyPolicy')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('warrantyPolicyAnswer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
