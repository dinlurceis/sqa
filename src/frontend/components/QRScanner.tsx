'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { FiX, FiCamera } from 'react-icons/fi'

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasScannedRef = useRef(false) // Flag để tránh quét nhiều lần

  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' }, // Camera sau
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Chỉ xử lý lần quét đầu tiên
          if (!hasScannedRef.current) {
            hasScannedRef.current = true
            onScan(decodedText)
            stopScanner()
            onClose()
          }
        },
        (errorMessage) => {
          // Lỗi quét (bình thường, không cần xử lý)
        }
      )

      setIsScanning(true)
    } catch (err: any) {
      console.error('Error starting scanner:', err)
      setError('Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FiCamera className="text-red-500" />
            <span>Quét mã QR</span>
          </h3>
          <button
            onClick={() => {
              stopScanner()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX size={24} />
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        ) : (
          <>
            <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Đưa mã QR vào khung hình để quét
            </p>
          </>
        )}

        <button
          onClick={() => {
            stopScanner()
            onClose()
          }}
          className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  )
}
