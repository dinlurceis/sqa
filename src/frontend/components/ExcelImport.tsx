'use client'

import { useRef } from 'react'
import * as XLSX from 'xlsx'
import { FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface ExcelImportProps {
  onImport: (data: { items: any[], supplier?: any }) => void
}

export default function ExcelImport({ onImport }: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File không được vượt quá 5MB')
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // Parse data
        const result = parseExcelData(jsonData as any[][])
        
        if (result.items.length === 0) {
          toast.error('Không có dữ liệu hợp lệ trong file')
          return
        }

        onImport(result)
        
        if (result.supplier) {
          toast.success(`Đã import thông tin NCC và ${result.items.length} sản phẩm`)
        } else {
          toast.success(`Đã import ${result.items.length} sản phẩm từ Excel`)
        }
        
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } catch (error) {
        console.error('Error reading Excel:', error)
        toast.error('Lỗi khi đọc file Excel')
      }
    }

    reader.onerror = () => {
      toast.error('Lỗi khi đọc file')
    }

    reader.readAsBinaryString(file)
  }

  const parseExcelData = (data: any[][]): { items: any[], supplier?: any } => {
    if (data.length < 2) {
      toast.error('File Excel phải có ít nhất 2 dòng (header + data)')
      return { items: [] }
    }

    let supplier: any = undefined
    let productStartRow = 1 // Default: products start from row 1 (after header at row 0)

    // Check if first rows contain supplier info (look for "Nhà cung cấp" or "Supplier")
    if (data[0] && data[0][0]?.toString().toLowerCase().includes('nhà cung cấp')) {
      // Parse supplier info from rows 0-7
      supplier = {
        name: data[0]?.[1]?.toString().trim() || '',
        taxCode: data[1]?.[1]?.toString().trim() || '',
        contactName: data[2]?.[1]?.toString().trim() || '',
        phone: data[3]?.[1]?.toString().trim() || '',
        email: data[4]?.[1]?.toString().trim() || '',
        address: data[5]?.[1]?.toString().trim() || '',
        bankAccount: data[6]?.[1]?.toString().trim() || '',
        paymentTerm: data[7]?.[1]?.toString().trim() || ''
      }
      
      // Products start after supplier info + 1 empty row + header
      productStartRow = 10 // Row 8: empty, Row 9: product header, Row 10: first product
    }

    // Parse products
    const items: any[] = []
    const errors: string[] = []

    for (let i = productStartRow; i < data.length; i++) {
      const row = data[i]
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) continue

      try {
        // Expected columns: SKU | Tên SP | Số lượng | Giá nhập | Bảo hành | Ghi chú
        const sku = row[0]?.toString().trim()
        const productName = row[1]?.toString().trim()
        const quantity = parseInt(row[2]?.toString() || '0')
        const price = parseFloat(row[3]?.toString() || '0')
        const warrantyMonths = parseInt(row[4]?.toString() || '12')
        const note = row[5]?.toString().trim() || ''

        // Validate
        if (!sku) {
          errors.push(`Dòng ${i + 1}: SKU không được trống`)
          continue
        }
        if (!productName) {
          errors.push(`Dòng ${i + 1}: Tên sản phẩm không được trống`)
          continue
        }
        if (quantity <= 0 || isNaN(quantity)) {
          errors.push(`Dòng ${i + 1}: Số lượng phải > 0`)
          continue
        }
        if (price <= 0 || isNaN(price)) {
          errors.push(`Dòng ${i + 1}: Giá nhập phải > 0`)
          continue
        }

        items.push({
          sku,
          productName,
          quantity,
          price,
          warrantyMonths: isNaN(warrantyMonths) ? 12 : warrantyMonths,
          note
        })
      } catch (error) {
        errors.push(`Dòng ${i + 1}: Lỗi xử lý dữ liệu`)
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      console.warn('Import errors:', errors)
      toast.error(`Có ${errors.length} dòng lỗi. Kiểm tra console để xem chi tiết.`)
    }

    return { items, supplier }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        <FiUpload />
        <span>📥 Import từ Excel</span>
      </button>
    </div>
  )
}
