'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AdminWarehouseOrderDetailRedirect() {
  const router = useRouter()
  const params = useParams()
  
  useEffect(() => {
    // Redirect to employee warehouse orders detail (same functionality)
    router.push(`/employee/warehouse/orders/${params.id}`)
  }, [router, params.id])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}
