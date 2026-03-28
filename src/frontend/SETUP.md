# Hướng dẫn cài đặt và chạy Frontend

## Bước 1: Cài đặt Node.js
Tải và cài đặt Node.js từ https://nodejs.org (phiên bản 18+)

## Bước 2: Cài đặt dependencies
Mở terminal/command prompt và chạy các lệnh sau:

```bash
# Di chuyển vào thư mục frontend
cd "C:\Users\Quang\Desktop\Đồ án TN\Do-an-tot-nghiep\src\frontend"

# Cài đặt các package cần thiết
npm install
```

## Bước 3: Chạy ứng dụng
```bash
# Chạy development server
npm run dev
```

## Bước 4: Truy cập website
Mở trình duyệt và truy cập: http://localhost:3000

## Các lệnh khác
```bash
# Build production
npm run build

# Chạy production
npm start

# Kiểm tra lỗi code
npm run lint
```

## Cấu trúc thư mục đã tạo
```
src/frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Trang chủ
│   ├── products/          # Trang sản phẩm
│   │   ├── page.tsx       # Danh sách sản phẩm
│   │   └── [id]/page.tsx  # Chi tiết sản phẩm
│   ├── cart/page.tsx      # Giỏ hàng
│   ├── checkout/page.tsx  # Thanh toán
│   ├── login/page.tsx     # Đăng nhập
│   └── register/page.tsx  # Đăng ký
├── components/            # React components
│   ├── layout/            # Header, Footer
│   ├── product/           # ProductCard
│   └── category/          # CategoryCard
├── styles/                # CSS files
│   └── globals.css        # Global styles
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
└── README.md              # Documentation
```

## Tính năng đã implement
✅ Trang chủ với banner slider và danh mục
✅ Danh sách sản phẩm với filter và sort
✅ Chi tiết sản phẩm với gallery và thông số
✅ Giỏ hàng với tính toán giá
✅ Trang thanh toán với form đầy đủ
✅ Đăng nhập và đăng ký
✅ Responsive design
✅ UI/UX giống Hoàng Hà Mobile

## Lưu ý
- Frontend sử dụng mock data, cần tích hợp với Spring Boot backend
- API base URL: http://localhost:8080/api
- Cần cấu hình CORS trong backend để frontend có thể gọi API
- Có thể thêm state management (Redux/Zustand) nếu cần
