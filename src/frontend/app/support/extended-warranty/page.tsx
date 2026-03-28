'use client'

export default function ExtendedWarrantyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dịch vụ bảo hành mở rộng</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Giới thiệu</h2>
            <p className="text-gray-600 leading-relaxed">
              Dịch vụ bảo hành mở rộng giúp bạn yên tâm sử dụng sản phẩm với thời gian bảo hành 
              dài hơn, bảo vệ toàn diện hơn so với bảo hành tiêu chuẩn.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Gói bảo hành mở rộng</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Gói Cơ bản</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Mở rộng thêm 12 tháng bảo hành</li>
                  <li>Bảo hành lỗi phần cứng</li>
                  <li>Hỗ trợ kỹ thuật qua điện thoại</li>
                  <li>Phí: 5-10% giá trị sản phẩm</li>
                </ul>
              </div>

              <div className="border border-blue-500 rounded-lg p-6 bg-blue-50">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Gói Cao cấp</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Mở rộng thêm 24 tháng bảo hành</li>
                  <li>Bảo hành toàn diện (bao gồm rơi vỡ, vào nước)</li>
                  <li>Đổi mới nếu không sửa được</li>
                  <li>Hỗ trợ kỹ thuật 24/7</li>
                  <li>Phí: 15-20% giá trị sản phẩm</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Lợi ích</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Yên tâm sử dụng sản phẩm lâu dài</li>
              <li>Tiết kiệm chi phí sửa chữa</li>
              <li>Ưu tiên xử lý nhanh chóng</li>
              <li>Hỗ trợ kỹ thuật chuyên nghiệp</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cách đăng ký</h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
              <li>Mua gói bảo hành mở rộng cùng lúc với sản phẩm</li>
              <li>Hoặc đăng ký trong vòng 30 ngày kể từ ngày mua</li>
              <li>Điền thông tin và thanh toán phí bảo hành</li>
              <li>Nhận giấy chứng nhận bảo hành mở rộng</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Liên hệ</h2>
            <div className="text-gray-600 space-y-2">
              <p><strong>Hotline:</strong> 1900.2091</p>
              <p><strong>Email:</strong> warranty@techworld.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
