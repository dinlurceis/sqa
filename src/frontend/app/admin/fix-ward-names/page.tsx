'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function FixWardNamesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Check admin permission
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Chỉ admin mới có quyền truy cập trang này
        </div>
      </div>
    );
  }

  const handleFix = async () => {
    if (!confirm('Bạn có chắc muốn cập nhật tên phường/xã cho tất cả đơn hàng?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/shipping/fix-ward-names', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        toast.success('Đã cập nhật thành công!');
      } else {
        toast.error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Fix Tên Phường/Xã</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            ℹ️ Thông tin
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Công cụ này sẽ cập nhật tên phường/xã cho các đơn hàng cũ</li>
            <li>• Chỉ cập nhật các đơn hàng có mã ward nhưng chưa có tên ward</li>
            <li>• Tên phường/xã sẽ được lấy từ GHN API</li>
            <li>• Quá trình có thể mất vài phút tùy số lượng đơn hàng</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thực hiện cập nhật</h2>
          
          <button
            onClick={handleFix}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xử lý...
              </span>
            ) : (
              '🚀 Bắt đầu cập nhật'
            )}
          </button>
        </div>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              ✅ Kết quả
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded">
                <span className="text-gray-700">Tổng số đơn hàng cần fix:</span>
                <span className="font-bold text-lg">{result.total || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded">
                <span className="text-green-700">Cập nhật thành công:</span>
                <span className="font-bold text-lg text-green-600">{result.success || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded">
                <span className="text-red-700">Thất bại:</span>
                <span className="font-bold text-lg text-red-600">{result.failed || 0}</span>
              </div>
            </div>

            {result.details && result.details.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Chi tiết:</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {result.details.map((detail: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-white rounded">
                      <span className="font-medium">{detail.orderCode}:</span>{' '}
                      <span className={detail.success ? 'text-green-600' : 'text-red-600'}>
                        {detail.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.push('/warehouse/orders')}
              className="mt-4 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Xem danh sách đơn hàng
            </button>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
