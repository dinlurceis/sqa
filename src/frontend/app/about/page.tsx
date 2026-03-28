'use client'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Giới thiệu về TechWorld</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Về chúng tôi</h2>
            <p className="text-gray-600 leading-relaxed">
              TechWorld là hệ thống bán lẻ công nghệ hàng đầu tại Việt Nam, chuyên cung cấp các sản phẩm 
              điện thoại, laptop, tablet, phụ kiện và thiết bị công nghệ chính hãng với giá cả cạnh tranh.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sứ mệnh</h2>
            <p className="text-gray-600 leading-relaxed">
              Mang đến cho khách hàng những sản phẩm công nghệ chất lượng cao với dịch vụ tốt nhất, 
              giúp mọi người tiếp cận công nghệ hiện đại một cách dễ dàng và thuận tiện.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Giá trị cốt lõi</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Sản phẩm chính hãng, chất lượng đảm bảo</li>
              <li>Giá cả cạnh tranh, minh bạch</li>
              <li>Dịch vụ khách hàng tận tâm</li>
              <li>Bảo hành chu đáo, nhanh chóng</li>
              <li>Đổi trả linh hoạt trong 7 ngày</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Thông tin liên hệ</h2>
            <div className="text-gray-600 space-y-2">
              <p><strong>Địa chỉ:</strong> 96A Đ. Trần Phú, P. Mộ Lao, Hà Đông, Hà Nội</p>
              <p><strong>Hotline:</strong> 1900.2091</p>
              <p><strong>Email:</strong> support@techworld.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
