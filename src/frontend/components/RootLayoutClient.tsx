'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if current path is for employee/admin pages
  const isEmployeePage = pathname?.startsWith('/admin') ||
                         pathname?.startsWith('/employee')
  
  // Don't show customer header/footer for employee pages
  // Employee pages have their own layout with EmployeeHeader
  if (isEmployeePage) {
    return <>{children}</>
  }
  
  // Show customer header/footer for public pages
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  )
}
