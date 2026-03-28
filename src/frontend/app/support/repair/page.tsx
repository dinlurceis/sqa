'use client'

export default function RepairPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dịch vụ sửa chữa TechWorld Care</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Giới thiệu dịch vụ</h2>
            <p className="text-gray-600 leading-relaxed">
              TechWorld Care là dịch vụ sửa chữa, bảo hành chuyên nghiệp cho các sản phẩm công nghệ. 
              Với đội ngũ kỹ thuật viên giàu kinh nghiệm và trang thiết bị hiện đại, chúng tôi cam kết 
              mang đến dịch vụ tốt nhất cho khách hàng.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dịch vụ cung cấp</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Sửa chữa điện thoại, laptop, tablet</li>
              <li>Thay thế linh kiện chính hãng</li>
              <li>Nâng cấp phần cứng</li>
              <li>Cài đặt phần mềm, diệt virus</li>
              <li>Vệ sinh, bảo dưỡng thiết bị</li>
              <li>Kiểm tra, chẩn đoán lỗi miễn phí</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cam kết</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Sử dụng linh kiện chính hãng</li>
              <li>Bảo hành dịch vụ sửa chữa 3-6 tháng</li>
              <li>Thời gian sửa chữa nhanh chóng</li>
              <li>Giá cả minh bạch, rõ ràng</li>
              <li>Hỗ trợ tận nơi cho khách hàng doanh nghiệp</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Liên hệ</h2>
            <div className="text-gray-600 space-y-2">
              <p><strong>Hotline:</strong> 1900.2091</p>
              <p><strong>Địa chỉ:</strong> 96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
