'use client'

import { useAuthStore } from '@/store/authStore'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const { user, employee, token, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Auth Info</h1>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h2 className="font-bold text-lg mb-2">Is Authenticated:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(isAuthenticated, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-2">Token:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {token || 'No token'}
          </pre>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-2">User:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-2">Employee:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(employee, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-2">LocalStorage auth_token:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'No token in localStorage' : 'Server side'}
          </pre>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-2">LocalStorage auth-storage:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
            {typeof window !== 'undefined' ? localStorage.getItem('auth-storage') || 'No auth-storage' : 'Server side'}
          </pre>
        </div>
      </div>
    </div>
  )
}
