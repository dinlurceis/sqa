'use client'

import AdminSidebar from '@/components/admin/AdminSidebar'
import HydratedLayout from '@/components/HydratedLayout'
import NotificationBell from '@/components/NotificationBell'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <HydratedLayout>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-8">
            {children}
          </div>
        </main>

        {/* Floating Notification Bell */}
        <NotificationBell floating />
      </div>
    </HydratedLayout>
  )
}
