import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import RootLayoutClient from '@/components/RootLayoutClient'
import AuthProvider from '@/components/AuthProvider'
import BrowserSessionManager from '@/components/BrowserSessionManager'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tech World - Công nghệ hàng đầu',
  description: 'Cửa hàng công nghệ hàng đầu với sản phẩm chất lượng cao. Cam kết chất lượng, miễn phí vận chuyển toàn quốc.',
  keywords: 'công nghệ, điện thoại, smartphone, laptop, tablet, thiết bị điện tử',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <BrowserSessionManager />
        <AuthProvider>
          <RootLayoutClient>
            {children}
          </RootLayoutClient>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
