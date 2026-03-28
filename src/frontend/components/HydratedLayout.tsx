'use client'

import { useAuthStoreHydrated } from '@/store/authStore'

export default function HydratedLayout({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStoreHydrated()

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
