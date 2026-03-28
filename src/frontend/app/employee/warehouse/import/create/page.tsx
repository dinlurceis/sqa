'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiAlertCircle, FiUpload, FiDownload } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { inventoryApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, type Position } from '@/lib/permissions'
import * as XLSX from 'xlsx'

interface POItem {
  sku: string
  internalName: string
  quantity: number
  unitCost: number
  warrantyMonths: number
  techSpecs: Array<{ key: string; value: string }>
  note: string
}

export default function EmployeeCreatePurchaseOrderPage() {
  const router = useRouter()
  const { employee } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false)
  
  // Permission check
  const canCreate = hasPermission(employee?.position as Position, 'warehouse.import.create')

  // Form data
  const [poCode, setPoCode] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [note, setNote] = useState('')
  const [items, setItems] = useState<POItem[]>([{
    sku: '',
    internalName: '',
    quantity: 1,
    unitCost: 0,
    warrantyMonths: 0,
    techSpecs: [{ key: '', value: '' }],
    note: ''
  }])

  // New supplier form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    taxCode: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    bankAccount: '',
    paymentTerm: '',
    paymentTermDays: 30,
    active: true
  })

  useEffect(() => {
    if (employee) {
      loadSuppliers()
      generatePOCode()
    }
    
    return () => {
      setSuppliers([])
      setItems([{
        sku: '',
        internalName: '',
        quantity: 1,
        unitCost: 0,
        warrantyMonths: 0,
        techSpecs: [{ key: '', value: '' }],
        note: ''
      }])
    }
  }, [employee])

  const loadSuppliers = async () => {
    try {
      const response = await inventoryApi.getSuppliers()
      if (response.success) {
        setSuppliers(response.data || [])
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const generatePOCode = () => {
    const date = new Date()
    const code = `PO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${Date.now().toString().slice(-6)}`
    setPoCode(code)
  }

  // Helper function to parse tech specs from various formats
  const parseTechSpecs = (input: string): Array<{ key: string; value: string }> => {
    if (!input || !input.trim()) {
      return [{ key: '', value: '' }]
    }

    const trimmed = input.trim()
    
    // Try JSON format first: {"key":"value","key2":"value2"}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        const specs = Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value)
        }))
        return specs.length > 0 ? specs : [{ key: '', value: '' }]
      } catch (e) {
        console.log('Not valid JSON, trying other formats...')
      }
    }

    // Try key-value pairs with various separators
    // Format: "Key: Value, Key2: Value2" or "Key=Value; Key2=Value2" or "Key - Value | Key2 - Value2"
    const separatorPatterns = [
      { pair: ',', keyValue: ':' },   // Key: Value, Key2: Value2
      { pair: ';', keyValue: ':' },   // Key: Value; Key2: Value2
      { pair: ',', keyValue: '=' },   // Key=Value, Key2=Value2
      { pair: ';', keyValue: '=' },   // Key=Value; Key2=Value2
      { pair: '|', keyValue: ':' },   // Key: Value | Key2: Value2
      { pair: '|', keyValue: '-' },   // Key - Value | Key2 - Value2
      { pair: ',', keyValue: '-' },   // Key - Value, Key2 - Value2
    ]

    for (const pattern of separatorPatterns) {
      if (trimmed.includes(pattern.keyValue)) {
        const pairs = trimmed.split(pattern.pair).map(p => p.trim()).filter(p => p)
        const specs: Array<{ key: string; value: string }> = []
        
        for (const pair of pairs) {
          const parts = pair.split(pattern.keyValue).map(p => p.trim())
          if (parts.length >= 2) {
            specs.push({
              key: parts[0],
              value: parts.slice(1).join(pattern.keyValue).trim()
            })
          }
        }
        
        if (specs.length > 0) {
          return specs
        }
      }
    }

    // If no pattern matched, treat as single value
    return [{ key: 'Thông số', value: trimmed }]
  }

  const downloadTemplate = () => {
    // Create workbook with merged cells format
    const wb = XLSX.utils.book_new()
    
    // Build sheet data with sub-rows for tech specs
    const sheetData = [
      ['Thông tin nhà cung cấp', ''],
      ['Nhà cung cấp', 'Công ty TNHH ABC'],
      ['Mã số thuế', '0123456789'],
      ['Người liên hệ', 'Nguyễn Văn A'],
      ['Số điện thoại', '0901234567'],
      ['Email', 'contact@abc.vn'],
      ['Địa chỉ', '123 Đường ABC - Quận 1 - TP.HCM'],
      ['Tài khoản ngân hàng', '1234567890 - Vietcombank'],
      ['Điều khoản thanh toán', 'Thanh toán trong 30 ngày'],
      [],
      ['Danh sách sản phẩm', ''],
      ['SKU', 'Tên sản phẩm', 'Số lượng', 'Giá nhập', 'Bảo hành (tháng)', 'Thông số kỹ thuật', '', 'Ghi chú'],
      ['', '', '', '', '', 'Tên thông số', 'Giá trị', ''],
      // Product 1 with merged cells
      ['PROD-001', 'iPhone 15 Pro Max 256GB', 10, 28000000, 12, 'Màn hình', '6.7 inch', 'Hàng chính hãng VN/A'],
      ['', '', '', '', '', 'Chip', 'A17 Pro', ''],
      ['', '', '', '', '', 'RAM', '8GB', ''],
      ['', '', '', '', '', 'Bộ nhớ', '256GB', ''],
      // Product 2 with merged cells
      ['PROD-002', 'Samsung Galaxy S24 Ultra 512GB', 15, 30000000, 24, 'Màn hình', '6.8 inch', 'Hàng chính hãng SSVN'],
      ['', '', '', '', '', 'Chip', 'Snapdragon 8 Gen 3', ''],
      ['', '', '', '', '', 'RAM', '12GB', ''],
      ['', '', '', '', '', 'Bộ nhớ', '512GB', ''],
      // Product 3 with merged cells
      ['PROD-003', 'MacBook Pro 14 M3 Pro', 5, 52000000, 12, 'Màn hình', '14.2 inch', 'Hàng chính hãng Apple VN'],
      ['', '', '', '', '', 'Chip', 'Apple M3 Pro', ''],
      ['', '', '', '', '', 'RAM', '18GB', ''],
      ['', '', '', '', '', 'SSD', '512GB', '']
    ]
    
    const headerRowIndex = 11 // Main header row
    const subHeaderRowIndex = 12 // Sub-header row
    const merges = []
    
    // Merge header cells for tech specs (main header spans 2 columns)
    merges.push({ s: { r: headerRowIndex, c: 5 }, e: { r: headerRowIndex, c: 6 } })
    
    // Merge other header cells vertically (span 2 rows for main headers)
    merges.push({ s: { r: headerRowIndex, c: 0 }, e: { r: subHeaderRowIndex, c: 0 } }) // SKU
    merges.push({ s: { r: headerRowIndex, c: 1 }, e: { r: subHeaderRowIndex, c: 1 } }) // Tên sản phẩm
    merges.push({ s: { r: headerRowIndex, c: 2 }, e: { r: subHeaderRowIndex, c: 2 } }) // Số lượng
    merges.push({ s: { r: headerRowIndex, c: 3 }, e: { r: subHeaderRowIndex, c: 3 } }) // Giá nhập
    merges.push({ s: { r: headerRowIndex, c: 4 }, e: { r: subHeaderRowIndex, c: 4 } }) // Bảo hành
    merges.push({ s: { r: headerRowIndex, c: 7 }, e: { r: subHeaderRowIndex, c: 7 } }) // Ghi chú
    
    // Merge cells for Product 1 (rows 13-16, 4 rows)
    merges.push({ s: { r: 13, c: 0 }, e: { r: 16, c: 0 } }) // SKU
    merges.push({ s: { r: 13, c: 1 }, e: { r: 16, c: 1 } }) // Name
    merges.push({ s: { r: 13, c: 2 }, e: { r: 16, c: 2 } }) // Quantity
    merges.push({ s: { r: 13, c: 3 }, e: { r: 16, c: 3 } }) // Price
    merges.push({ s: { r: 13, c: 4 }, e: { r: 16, c: 4 } }) // Warranty
    merges.push({ s: { r: 13, c: 7 }, e: { r: 16, c: 7 } }) // Note
    
    // Merge cells for Product 2 (rows 17-20, 4 rows)
    merges.push({ s: { r: 17, c: 0 }, e: { r: 20, c: 0 } }) // SKU
    merges.push({ s: { r: 17, c: 1 }, e: { r: 20, c: 1 } }) // Name
    merges.push({ s: { r: 17, c: 2 }, e: { r: 20, c: 2 } }) // Quantity
    merges.push({ s: { r: 17, c: 3 }, e: { r: 20, c: 3 } }) // Price
    merges.push({ s: { r: 17, c: 4 }, e: { r: 20, c: 4 } }) // Warranty
    merges.push({ s: { r: 17, c: 7 }, e: { r: 20, c: 7 } }) // Note
    
    // Merge cells for Product 3 (rows 21-24, 4 rows)
    merges.push({ s: { r: 21, c: 0 }, e: { r: 24, c: 0 } }) // SKU
    merges.push({ s: { r: 21, c: 1 }, e: { r: 24, c: 1 } }) // Name
    merges.push({ s: { r: 21, c: 2 }, e: { r: 24, c: 2 } }) // Quantity
    merges.push({ s: { r: 21, c: 3 }, e: { r: 24, c: 3 } }) // Price
    merges.push({ s: { r: 21, c: 4 }, e: { r: 24, c: 4 } }) // Warranty
    merges.push({ s: { r: 21, c: 7 }, e: { r: 24, c: 7 } }) // Note
    
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    ws['!merges'] = merges
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 },  // SKU
      { wch: 45 },  // Tên sản phẩm
      { wch: 10 },  // Số lượng
      { wch: 12 },  // Giá nhập
      { wch: 15 },  // Bảo hành
      { wch: 20 },  // Thông số - Tên
      { wch: 25 },  // Thông số - Giá trị
      { wch: 30 }   // Ghi chú
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Phiếu nhập kho')
    
    // Generate Excel file
    XLSX.writeFile(wb, 'template-nhap-kho.xlsx')
    toast.success('Đã tải template Excel với định dạng merged cells')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    const isCSV = file.name.endsWith('.csv')

    if (!isExcel && !isCSV) {
      toast.error('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV')
      return
    }

    try {
      if (isExcel) {
        // Handle Excel file
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]

        console.log('Excel data:', jsonData)

        // Parse supplier info (first 9 rows)
        const supplierData: any = {}
        for (let i = 1; i < Math.min(9, jsonData.length); i++) {
          const row = jsonData[i]
          if (row.length >= 2) {
            const key = String(row[0]).trim()
            const value = String(row[1]).trim()
            
            if (key === 'Nhà cung cấp') supplierData.name = value
            if (key === 'Mã số thuế') supplierData.taxCode = value
            if (key === 'Người liên hệ') supplierData.contactName = value
            if (key === 'Số điện thoại') supplierData.phone = value
            if (key === 'Email') supplierData.email = value
            if (key === 'Địa chỉ') supplierData.address = value
            if (key === 'Tài khoản ngân hàng') supplierData.bankAccount = value
            if (key === 'Điều khoản thanh toán') supplierData.paymentTerm = value
          }
        }

        // Find product header row
        let productStartIndex = -1
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (row[0] === 'SKU' || String(row[0]).includes('SKU')) {
            productStartIndex = i + 1
            
            // Check if next row is sub-header (has "Tên thông số" or "Giá trị")
            if (i + 1 < jsonData.length) {
              const nextRow = jsonData[i + 1]
              const col5 = String(nextRow[5] || '').trim()
              const col6 = String(nextRow[6] || '').trim()
              
              if (col5.includes('Tên thông số') || col5.includes('tên thông số') || 
                  col6.includes('Giá trị') || col6.includes('giá trị')) {
                // Skip sub-header row
                productStartIndex = i + 2
              }
            }
            break
          }
        }

        if (productStartIndex === -1) {
          toast.error('Không tìm thấy dữ liệu sản phẩm trong file')
          return
        }

        // Parse products
        const parsedItems: POItem[] = []
        let currentProduct: POItem | null = null
        
        for (let i = productStartIndex; i < jsonData.length; i++) {
          const row = jsonData[i]
          
          // Check if this is a main product row (has SKU) or sub-row (no SKU, tech spec continuation)
          const sku = String(row[0] || '').trim()
          
          if (sku) {
            // Main product row - save previous product if exists
            if (currentProduct) {
              parsedItems.push(currentProduct)
            }
            
            // Start new product
            if (row.length >= 4) {
              let techSpecs: Array<{ key: string; value: string }> = [{ key: '', value: '' }]
              let noteIndex = 6
              
              if (row.length >= 7) {
                const col5 = String(row[5]).trim()
                const col6 = String(row[6]).trim()
                
                if (col5 && col5.length < 30 && col6 && !col5.includes(':') && !col5.includes('{')) {
                  const col7 = String(row[7] || '').trim()
                  
                  if (row.length === 8 || (col7 && col7.length > 30) || col7.includes('Hàng') || col7.includes('chính hãng')) {
                    // Format 3: Merged cells format
                    noteIndex = 7
                    techSpecs = [{ key: col5, value: col6 }]
                  } else {
                    // Format 2: Multi-column tech specs
                    noteIndex = row.length - 1
                    for (let j = 5; j < noteIndex; j += 2) {
                      const specName = String(row[j] || '').trim()
                      const specValue = String(row[j + 1] || '').trim()
                      
                      if (specName && specValue) {
                        if (techSpecs.length === 1 && !techSpecs[0].key) {
                          techSpecs[0] = { key: specName, value: specValue }
                        } else {
                          techSpecs.push({ key: specName, value: specValue })
                        }
                      }
                    }
                  }
                } else if (col5) {
                  // Format 1: Single column with all tech specs
                  techSpecs = parseTechSpecs(col5)
                  noteIndex = 6
                }
              } else if (row.length >= 6 && row[5]) {
                const techSpecStr = String(row[5]).trim()
                if (techSpecStr) {
                  techSpecs = parseTechSpecs(techSpecStr)
                }
              }

              currentProduct = {
                sku: sku,
                internalName: String(row[1]).trim(),
                quantity: parseInt(String(row[2])) || 0,
                unitCost: parseFloat(String(row[3])) || 0,
                warrantyMonths: parseInt(String(row[4])) || 0,
                techSpecs: techSpecs,
                note: row.length > noteIndex ? String(row[noteIndex]).trim() : ''
              }
            }
          } else if (currentProduct && row.length >= 7) {
            // Sub-row: continuation of tech specs for current product
            const specName = String(row[5] || '').trim()
            const specValue = String(row[6] || '').trim()
            
            if (specName && specValue) {
              if (currentProduct.techSpecs.length === 1 && !currentProduct.techSpecs[0].key) {
                currentProduct.techSpecs[0] = { key: specName, value: specValue }
              } else {
                currentProduct.techSpecs.push({ key: specName, value: specValue })
              }
            }
          }
        }
        
        // Don't forget to add the last product
        if (currentProduct) {
          parsedItems.push(currentProduct)
        }

        if (parsedItems.length === 0) {
          toast.error('Không có sản phẩm nào trong file')
          return
        }

        // Update form
        if (supplierData.name && supplierData.taxCode) {
          setNewSupplier({
            ...newSupplier,
            ...supplierData,
            paymentTermDays: 30
          })
          setShowNewSupplierForm(true)
        }

        setItems(parsedItems)
        toast.success(`Đã import ${parsedItems.length} sản phẩm từ file Excel`)

      } else {
        // Handle CSV file (existing logic)
        const text = await file.text()
        const lines = text.split('\n').map(line => line.trim()).filter(line => line)
        
        const firstLine = lines[0]
        const isProductListFormat = firstLine.includes('SKU,Tên sản phẩm') || firstLine.includes('SKU,') && firstLine.includes('Thông số kỹ thuật')
        
        if (isProductListFormat) {
          const parsedItems: POItem[] = []
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            if (!line) continue
            
            const parts: string[] = []
            let current = ''
            let inQuotes = false
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j]
              const nextChar = line[j + 1]
              
              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  current += '"'
                  j++
                } else {
                  inQuotes = !inQuotes
                }
              } else if (char === ',' && !inQuotes) {
                parts.push(current)
                current = ''
              } else {
                current += char
              }
            }
            parts.push(current)
            
            const cleanParts = parts.map(p => p.trim())
            
            if (cleanParts.length >= 5) {
              let techSpecs: Array<{ key: string; value: string }> = [{ key: '', value: '' }]
              if (cleanParts.length >= 7 && cleanParts[6]) {
                techSpecs = parseTechSpecs(cleanParts[6])
              }
              
              parsedItems.push({
                sku: cleanParts[0],
                internalName: cleanParts[1],
                quantity: parseInt(cleanParts[4]) || 0,
                unitCost: parseFloat(cleanParts[3]) || 0,
                warrantyMonths: 12,
                techSpecs: techSpecs,
                note: cleanParts[5] || ''
              })
            }
          }
          
          if (parsedItems.length === 0) {
            toast.error('Không có sản phẩm nào trong file')
            return
          }
          
          setItems(parsedItems)
          toast.success(`Đã import ${parsedItems.length} sản phẩm từ file CSV`)
          
        } else {
          const supplierData: any = {}
          for (let i = 0; i < Math.min(8, lines.length); i++) {
            const [key, value] = lines[i].split(',').map(s => s.trim())
            if (key === 'Nhà cung cấp') supplierData.name = value
            if (key === 'Mã số thuế') supplierData.taxCode = value
            if (key === 'Người liên hệ') supplierData.contactName = value
            if (key === 'Số điện thoại') supplierData.phone = value
            if (key === 'Email') supplierData.email = value
            if (key === 'Địa chỉ') supplierData.address = value
            if (key === 'Tài khoản ngân hàng') supplierData.bankAccount = value
            if (key === 'Điều khoản thanh toán') supplierData.paymentTerm = value
          }

          let productStartIndex = -1
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('SKU,')) {
              productStartIndex = i + 1
              break
            }
          }

          if (productStartIndex === -1) {
            toast.error('Không tìm thấy dữ liệu sản phẩm trong file')
            return
          }

          const parsedItems: POItem[] = []
          for (let i = productStartIndex; i < lines.length; i++) {
            const parts = lines[i].split(',').map(s => s.trim())
            if (parts.length >= 4) {
              parsedItems.push({
                sku: parts[0],
                internalName: parts[1],
                quantity: parseInt(parts[2]) || 0,
                unitCost: parseFloat(parts[3]) || 0,
                warrantyMonths: parseInt(parts[4]) || 0,
                techSpecs: [{ key: '', value: '' }],
                note: parts[5] || ''
              })
            }
          }

          if (parsedItems.length === 0) {
            toast.error('Không có sản phẩm nào trong file')
            return
          }

          if (supplierData.name && supplierData.taxCode) {
            setNewSupplier({
              ...newSupplier,
              ...supplierData,
              paymentTermDays: 30
            })
            setShowNewSupplierForm(true)
          }
          
          setItems(parsedItems)
          toast.success(`Đã import ${parsedItems.length} sản phẩm từ file CSV`)
        }
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      toast.error('Lỗi khi đọc file')
    }

    // Reset input
    e.target.value = ''
  }

  const addItem = () => {
    setItems([...items, {
      sku: '',
      internalName: '',
      quantity: 1,
      unitCost: 0,
      warrantyMonths: 0,
      techSpecs: [{ key: '', value: '' }],
      note: ''
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const addTechSpec = (itemIndex: number) => {
    const newItems = [...items]
    newItems[itemIndex].techSpecs.push({ key: '', value: '' })
    setItems(newItems)
  }

  const removeTechSpec = (itemIndex: number, specIndex: number) => {
    const newItems = [...items]
    if (newItems[itemIndex].techSpecs.length > 1) {
      newItems[itemIndex].techSpecs = newItems[itemIndex].techSpecs.filter((_, i) => i !== specIndex)
      setItems(newItems)
    }
  }

  const updateTechSpec = (itemIndex: number, specIndex: number, field: 'key' | 'value', value: string) => {
    const newItems = [...items]
    newItems[itemIndex].techSpecs[specIndex][field] = value
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check permission before submit
    if (!canCreate) {
      toast.error('Bạn không có quyền tạo phiếu nhập kho')
      return
    }

    // Validation
    if (!poCode) {
      toast.error('Vui lòng nhập mã phiếu nhập')
      return
    }

    if (!selectedSupplier && !showNewSupplierForm) {
      toast.error('Vui lòng chọn nhà cung cấp')
      return
    }

    if (showNewSupplierForm && (!newSupplier.name || !newSupplier.taxCode)) {
      toast.error('Vui lòng nhập tên và mã số thuế nhà cung cấp')
      return
    }

    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm')
      return
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.sku || !item.internalName || item.quantity <= 0 || item.unitCost <= 0) {
        toast.error(`Sản phẩm ${i + 1}: Vui lòng nhập đầy đủ thông tin`)
        return
      }
    }

    setLoading(true)
    try {
      const requestData = {
        createdBy: employee?.fullName || 'Employee',
        poCode,
        supplier: showNewSupplierForm ? newSupplier : { taxCode: selectedSupplier.taxCode },
        items: items.map(item => {
          // Convert tech specs array to JSON
          const techSpecsJson: Record<string, string> = {}
          item.techSpecs.forEach(spec => {
            if (spec.key && spec.value) {
              techSpecsJson[spec.key] = spec.value
            }
          })
          
          return {
            sku: item.sku,
            internalName: item.internalName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            warrantyMonths: item.warrantyMonths || 0,
            techSpecsJson: JSON.stringify(techSpecsJson),
            note: item.note || ''
          }
        }),
        note
      }

      const response = await inventoryApi.createPurchaseOrder(requestData)
      
      if (response.success) {
        toast.success('Tạo phiếu nhập kho thành công!')
        router.push('/employee/warehouse/import')
      } else {
        toast.error(response.message || 'Có lỗi xảy ra')
      }
    } catch (error: any) {
      console.error('Error creating purchase order:', error)
      toast.error(error.message || 'Lỗi khi tạo phiếu nhập')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
  }

  return (
    <div className="p-6">
      {/* Warning banner for view-only users */}
      {!canCreate && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <FiAlertCircle className="text-yellow-600 w-5 h-5 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900">Chế độ xem</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Bạn chỉ có quyền xem. Chỉ nhân viên kho mới có thể tạo phiếu nhập kho.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Quay lại</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Tạo phiếu nhập kho</h1>
        <p className="text-gray-600 mt-1">Tạo phiếu nhập hàng mới vào kho</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Excel Import Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FiUpload className="text-blue-600" />
                <span>Nhập nhanh từ Excel/CSV</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Tải file Excel/CSV để tự động điền thông tin nhà cung cấp và sản phẩm
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <FiDownload />
              <span>Tải template</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex-1 cursor-pointer">
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <FiUpload className="mx-auto text-blue-500 mb-2" size={32} />
                <p className="text-sm text-gray-700 font-medium">
                  Click để chọn file Excel hoặc CSV
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Hỗ trợ file .xlsx, .xls, .csv (UTF-8)
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã phiếu nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={poCode}
                onChange={(e) => setPoCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="PO20240101_123456"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Người tạo
              </label>
              <input
                type="text"
                value={employee?.fullName || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Supplier Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Nhà cung cấp</h2>
            <button
              type="button"
              onClick={() => setShowNewSupplierForm(!showNewSupplierForm)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showNewSupplierForm ? 'Chọn NCC có sẵn' : '+ Thêm NCC mới'}
            </button>
          </div>

          {!showNewSupplierForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn nhà cung cấp <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSupplier?.id || ''}
                  onChange={(e) => {
                    const supplier = suppliers.find(s => s.id === parseInt(e.target.value))
                    setSelectedSupplier(supplier)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!showNewSupplierForm}
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} - {supplier.taxCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display selected supplier info */}
              {selectedSupplier && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Thông tin nhà cung cấp</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Tên:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedSupplier.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mã số thuế:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedSupplier.taxCode}</span>
                    </div>
                    {selectedSupplier.contactName && (
                      <div>
                        <span className="text-gray-600">Người liên hệ:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSupplier.contactName}</span>
                      </div>
                    )}
                    {selectedSupplier.phone && (
                      <div>
                        <span className="text-gray-600">Số điện thoại:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSupplier.phone}</span>
                      </div>
                    )}
                    {selectedSupplier.email && (
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSupplier.email}</span>
                      </div>
                    )}
                    {selectedSupplier.address && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Địa chỉ:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSupplier.address}</span>
                      </div>
                    )}
                    {selectedSupplier.bankAccount && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Tài khoản ngân hàng:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSupplier.bankAccount}</span>
                      </div>
                    )}
                    {selectedSupplier.paymentTerm && (
                      <div>
                        <span className="text-gray-600">Điều khoản thanh toán:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSupplier.paymentTerm}</span>
                      </div>
                    )}
                    {selectedSupplier.paymentTermDays && (
                      <div>
                        <span className="text-gray-600">Số ngày nợ:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedSupplier.paymentTermDays} ngày</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên NCC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={showNewSupplierForm}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã số thuế <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSupplier.taxCode}
                  onChange={(e) => setNewSupplier({ ...newSupplier, taxCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={showNewSupplierForm}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Người liên hệ
                </label>
                <input
                  type="text"
                  value={newSupplier.contactName}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tài khoản ngân hàng
                </label>
                <input
                  type="text"
                  value={newSupplier.bankAccount}
                  onChange={(e) => setNewSupplier({ ...newSupplier, bankAccount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Số TK - Tên ngân hàng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điều khoản thanh toán
                </label>
                <input
                  type="text"
                  value={newSupplier.paymentTerm}
                  onChange={(e) => setNewSupplier({ ...newSupplier, paymentTerm: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Thanh toán trong 30 ngày"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số ngày nợ
                </label>
                <input
                  type="number"
                  value={newSupplier.paymentTermDays}
                  onChange={(e) => setNewSupplier({ ...newSupplier, paymentTermDays: parseInt(e.target.value) || 30 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="30"
                />
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Danh sách sản phẩm</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <FiPlus />
              <span>Thêm sản phẩm</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Sản phẩm {index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => updateItem(index, 'sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SKU001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.internalName}
                      onChange={(e) => updateItem(index, 'internalName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tên sản phẩm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đơn giá <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bảo hành (tháng)
                    </label>
                    <input
                      type="number"
                      value={item.warrantyMonths}
                      onChange={(e) => updateItem(index, 'warrantyMonths', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thành tiền
                    </label>
                    <input
                      type="text"
                      value={(item.quantity * item.unitCost).toLocaleString('vi-VN')}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                {/* Tech Specs Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Thông số kỹ thuật
                    </label>
                    <button
                      type="button"
                      onClick={() => addTechSpec(index)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <FiPlus /> Thêm thông số
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {item.techSpecs.map((spec, specIndex) => (
                      <div key={specIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={spec.key}
                          onChange={(e) => updateTechSpec(index, specIndex, 'key', e.target.value)}
                          placeholder="Tên thông số (VD: CPU, RAM)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => updateTechSpec(index, specIndex, 'value', e.target.value)}
                          placeholder="Giá trị (VD: Intel i7, 16GB)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        {item.techSpecs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTechSpec(index, specIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Nhập các thông số kỹ thuật của sản phẩm. VD: CPU - Intel i7, RAM - 16GB
                  </p>
                </div>

                {/* Note Section */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) => updateItem(index, 'note', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú về sản phẩm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
              <span className="text-2xl font-bold text-blue-600">
                {calculateTotal().toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Ghi chú</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Ghi chú về phiếu nhập..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || !canCreate}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={!canCreate ? 'Bạn không có quyền tạo phiếu nhập kho' : ''}
          >
            <FiSave />
            <span>{loading ? 'Đang tạo...' : 'Tạo phiếu nhập'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
