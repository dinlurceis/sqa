'use client'

export default function CustomerCarePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Chăm sóc khách hàng</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Liên hệ hỗ trợ</h2>
            <div className="text-gray-600 space-y-3">
              <p><strong>Hotline:</strong> 1900.2091 (8:00 - 22:00 hàng ngày)</p>
              <p><strong>Email:</strong> support@techworld.com</p>
              <p><strong>Địa chỉ:</strong> 96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dịch vụ hỗ trợ</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Tư vấn sản phẩm miễn phí</li>
              <li>Hỗ trợ đặt hàng trực tuyến</li>
              <li>Tra cứu đơn hàng và bảo hành</li>
              <li>Giải đáp thắc mắc về sản phẩm</li>
              <li>Hướng dẫn sử dụng sản phẩm</li>
              <li>Xử lý khiếu nại và đổi trả</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cam kết chất lượng</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi cam kết mang đến trải nghiệm mua sắm tốt nhất với đội ngũ nhân viên 
              chuyên nghiệp, nhiệt tình và luôn sẵn sàng hỗ trợ khách hàng 24/7.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
