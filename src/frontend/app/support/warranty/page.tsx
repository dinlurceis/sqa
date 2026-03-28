'use client'

export default function WarrantyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Chính sách đổi mới và bảo hành</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chính sách đổi mới</h2>
            <div className="text-gray-600 space-y-3">
              <p><strong>Điều kiện đổi mới trong 7 ngày:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sản phẩm bị lỗi kỹ thuật do nhà sản xuất</li>
                <li>Sản phẩm còn nguyên tem, hộp, phụ kiện đầy đủ</li>
                <li>Có hóa đơn mua hàng hợp lệ</li>
                <li>Sản phẩm chưa qua sửa chữa</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chính sách bảo hành</h2>
            <div className="text-gray-600 space-y-3">
              <p><strong>Thời gian bảo hành:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Điện thoại, tablet: 12 tháng</li>
                <li>Laptop: 12-24 tháng tùy hãng</li>
                <li>Phụ kiện: 3-12 tháng</li>
                <li>Linh kiện máy tính: 12-36 tháng</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quy trình bảo hành</h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
              <li>Mang sản phẩm và hóa đơn đến cửa hàng TechWorld</li>
              <li>Nhân viên kiểm tra và xác nhận lỗi</li>
              <li>Lập phiếu bảo hành và gửi sản phẩm đến trung tâm bảo hành</li>
              <li>Thông báo khi sản phẩm được sửa xong</li>
              <li>Khách hàng nhận lại sản phẩm</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Trường hợp không được bảo hành</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Sản phẩm hết thời gian bảo hành</li>
              <li>Sản phẩm bị rơi vỡ, vào nước, cháy nổ</li>
              <li>Sản phẩm bị tác động vật lý từ bên ngoài</li>
              <li>Sản phẩm đã qua sửa chữa tại nơi không được ủy quyền</li>
              <li>Tem bảo hành bị rách, mờ hoặc không còn</li>
            </ul>
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
