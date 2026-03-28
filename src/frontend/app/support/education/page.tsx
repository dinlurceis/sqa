'use client'

export default function EducationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Chương trình TechWorld Edu</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Giới thiệu</h2>
            <p className="text-gray-600 leading-relaxed">
              TechWorld Edu là chương trình ưu đãi đặc biệt dành cho học sinh, sinh viên và giáo viên, 
              giúp tiếp cận công nghệ với giá ưu đãi nhất.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Đối tượng áp dụng</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Học sinh, sinh viên đang theo học tại các trường</li>
              <li>Giáo viên, giảng viên đang giảng dạy</li>
              <li>Phụ huynh có con đang đi học</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ưu đãi</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Giảm giá 5-10% cho sản phẩm laptop, tablet</li>
              <li>Tặng phụ kiện học tập (chuột, balo, tai nghe)</li>
              <li>Hỗ trợ trả góp 0% lãi suất</li>
              <li>Bảo hành ưu tiên</li>
              <li>Tư vấn chọn sản phẩm phù hợp cho học tập</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cách đăng ký</h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
              <li>Mang thẻ sinh viên/giáo viên hoặc giấy xác nhận đến cửa hàng</li>
              <li>Đăng ký thông tin và nhận thẻ TechWorld Edu</li>
              <li>Xuất trình thẻ khi mua hàng để được ưu đãi</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sản phẩm phù hợp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Laptop học tập</h3>
                <p className="text-gray-600 text-sm">Cấu hình phù hợp cho học tập, văn phòng</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Tablet ghi chú</h3>
                <p className="text-gray-600 text-sm">Hỗ trợ bút cảm ứng, ghi chú điện tử</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Phụ kiện học tập</h3>
                <p className="text-gray-600 text-sm">Chuột, bàn phím, tai nghe, balo</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Phần mềm học tập</h3>
                <p className="text-gray-600 text-sm">Office, Adobe, phần mềm chuyên ngành</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Liên hệ</h2>
            <div className="text-gray-600 space-y-2">
              <p><strong>Hotline:</strong> 1900.2091</p>
              <p><strong>Email:</strong> edu@techworld.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
