'use client'

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Quy chế hoạt động</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Quy định chung</h2>
            <p className="text-gray-600 leading-relaxed">
              Website TechWorld.com là sàn giao dịch thương mại điện tử do Công ty TNHH TechWorld 
              sở hữu và vận hành, tuân thủ theo quy định của pháp luật Việt Nam.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Quy định về tài khoản</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Khách hàng phải đăng ký tài khoản với thông tin chính xác</li>
              <li>Mỗi khách hàng chỉ được đăng ký một tài khoản</li>
              <li>Khách hàng chịu trách nhiệm bảo mật thông tin tài khoản</li>
              <li>TechWorld có quyền khóa tài khoản vi phạm quy định</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Quy định về đặt hàng</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Đơn hàng được xác nhận qua email hoặc điện thoại</li>
              <li>Giá sản phẩm có thể thay đổi theo chương trình khuyến mãi</li>
              <li>Khách hàng có thể hủy đơn hàng trước khi giao hàng</li>
              <li>TechWorld có quyền từ chối đơn hàng bất thường</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Quy định về thanh toán</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Hỗ trợ thanh toán: COD, chuyển khoản, thẻ tín dụng</li>
              <li>Hóa đơn VAT được xuất theo yêu cầu</li>
              <li>Không hoàn tiền cho đơn hàng đã thanh toán trước</li>
              <li>Chỉ hoàn tiền khi sản phẩm lỗi không thể đổi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Quy định về giao hàng</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Giao hàng toàn quốc trong 1-7 ngày</li>
              <li>Miễn phí giao hàng cho đơn từ 500.000đ</li>
              <li>Kiểm tra hàng trước khi thanh toán</li>
              <li>Từ chối nhận hàng nếu phát hiện lỗi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Quyền và nghĩa vụ</h2>
            <div className="text-gray-600 space-y-3">
              <p><strong>Quyền của khách hàng:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Được cung cấp thông tin chính xác về sản phẩm</li>
                <li>Được bảo mật thông tin cá nhân</li>
                <li>Được đổi trả sản phẩm theo chính sách</li>
                <li>Được khiếu nại khi có vấn đề</li>
              </ul>
              
              <p className="mt-4"><strong>Nghĩa vụ của khách hàng:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cung cấp thông tin chính xác khi đặt hàng</li>
                <li>Thanh toán đầy đủ theo thỏa thuận</li>
                <li>Tuân thủ quy định của TechWorld</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Liên hệ</h2>
            <div className="text-gray-600 space-y-2">
              <p><strong>Công ty TNHH TechWorld</strong></p>
              <p>Địa chỉ: 96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội</p>
              <p>Hotline: 1900.2091</p>
              <p>Email: support@techworld.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
