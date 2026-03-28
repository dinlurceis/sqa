'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function VerifyDbPage() {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const checkDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8080/api/test/employee-registrations')
      const data = await response.json()
      
      console.log('Database check:', data)
      
      if (data.success && data.data) {
        setRegistrations(data.data)
        toast.success(`Tìm thấy ${data.data.length} registrations trong database`)
      } else {
        toast.error('Không thể kiểm tra database')
      }
    } catch (error: any) {
      toast.error('Lỗi khi kiểm tra database: ' + error.message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const createTestData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/test/create-test-registration', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Tạo test data thành công! ID: ${data.data.id}`)
        checkDatabase()
      }
    } catch (error: any) {
      toast.error('Lỗi khi tạo test data')
      console.error(error)
    }
  }

  const deleteRegistration = async (id: number, email: string) => {
    if (!confirm(`Xóa registration ID ${id} (${email})?`)) return
    
    try {
      const response = await fetch(`http://localhost:8080/api/test/delete-registration/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Xóa thành công!')
        checkDatabase()
      } else {
        toast.error(data.message || 'Xóa thất bại')
      }
    } catch (error: any) {
      toast.error('Lỗi khi xóa: ' + error.message)
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Verify Database - Employee Registrations</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={checkDatabase}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Database'}
            </button>
            
            <button
              onClick={createTestData}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
            >
              Create Test Data
            </button>
          </div>
        </div>

        {registrations.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                Database có {registrations.length} registrations
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {reg.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reg.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          reg.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reg.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {registrations.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Chưa kiểm tra database. Click "Check Database" để xem.</p>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">Hướng dẫn:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
            <li>Click "Check Database" để xem tất cả registrations trong DB</li>
            <li>Click "Create Test Data" để tạo test registration</li>
            <li>Sau khi đăng ký từ form, quay lại đây và click "Check Database"</li>
            <li>Nếu thấy data → Backend hoạt động tốt</li>
            <li>Nếu không thấy → Có vấn đề với request từ form</li>
          </ol>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
            <li>Mở Chrome DevTools (F12)</li>
            <li>Vào tab Console</li>
            <li>Đăng ký nhân viên từ form</li>
            <li>Xem log "=== FRONTEND SENDING REQUEST ==="</li>
            <li>Xem Response Data có ID không</li>
            <li>Quay lại trang này và check database</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
