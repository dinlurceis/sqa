# Hoàng Hà Mobile Frontend

Frontend cho website thương mại điện tử Hoàng Hà Mobile được xây dựng bằng Next.js 14, React 18 và Tailwind CSS.

## 🚀 Tính năng chính

- **Trang chủ**: Banner slider, danh mục sản phẩm, sản phẩm nổi bật
- **Danh sách sản phẩm**: Lọc, sắp xếp, tìm kiếm sản phẩm
- **Chi tiết sản phẩm**: Thông tin đầy đủ, hình ảnh, đánh giá
- **Giỏ hàng**: Quản lý sản phẩm, tính toán giá
- **Thanh toán**: Form đặt hàng, phương thức thanh toán
- **Xác thực**: Đăng nhập, đăng ký với social login
- **Responsive**: Tối ưu cho mọi thiết bị

## 🛠️ Công nghệ sử dụng

- **Next.js 14**: React framework với App Router
- **React 18**: UI library với hooks và functional components
- **TypeScript**: Type safety và better development experience
- **Tailwind CSS**: Utility-first CSS framework
- **React Icons**: Icon library
- **Swiper**: Touch slider component
- **React Hot Toast**: Notification library
- **Zustand**: State management (có thể sử dụng)

## 📁 Cấu trúc thư mục

```
src/frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Trang chủ
│   ├── products/          # Trang sản phẩm
│   ├── cart/              # Giỏ hàng
│   ├── checkout/          # Thanh toán
│   ├── login/             # Đăng nhập
│   └── register/          # Đăng ký
├── components/            # React components
│   ├── layout/            # Header, Footer
│   ├── product/           # ProductCard, ProductList
│   └── category/          # CategoryCard
├── styles/                # CSS files
│   └── globals.css        # Global styles
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.js         # Next.js configuration
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn

### Cài đặt dependencies
```bash
cd src/frontend
    npm install
```

### Chạy development server
```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem website.

### Build production
```bash
npm run build
npm start
```

## 🎨 Design System

### Màu sắc chính
- **Primary**: Red (#ef4444) - Màu chủ đạo của thương hiệu
- **Secondary**: Gray (#64748b) - Màu phụ
- **Success**: Green (#10b981) - Thành công
- **Warning**: Orange (#f59e0b) - Cảnh báo
- **Error**: Red (#ef4444) - Lỗi

### Typography
- **Font**: Inter - Modern, readable font
- **Headings**: Font-weight 600-700
- **Body**: Font-weight 400-500

### Components
- **Buttons**: Rounded corners, hover effects
- **Cards**: Shadow, hover animations
- **Forms**: Focus states, validation styles
- **Navigation**: Sticky header, mobile menu

## 📱 Responsive Design

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## 🔗 API Integration

Frontend được thiết kế để tích hợp với Spring Boot backend:

- **Base URL**: `http://localhost:8080/api`
- **Authentication**: JWT tokens
- **Endpoints**: RESTful API
- **Error Handling**: Toast notifications

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Scripts

- `npm run dev`: Chạy development server
- `npm run build`: Build production
- `npm run start`: Chạy production server
- `npm run lint`: Kiểm tra code quality

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

- **Email**: support@hoanghamobile.com
- **Hotline**: 1900.2091
- **Website**: [hoanghamobile.com](https://hoanghamobile.com)

---

**Hoàng Hà Mobile** - Sản phẩm chính hãng, giá tốt nhất thị trường! 🛍️
