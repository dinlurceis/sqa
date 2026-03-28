'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiShoppingCart, FiMapPin, FiCreditCard } from 'react-icons/fi'
import { cartApi, orderApi, customerApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { vietnamProvinces } from '@/lib/vietnamLocations'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    province: '',
    district: '',
    ward: '',
    wardName: '',
    address: '',
    note: '',
    paymentMethod: 'COD',
    shippingFee: 30000, // Phí ship mặc định
    provinceId: null as number | null,
    districtId: null as number | null
  })
  const [shippingMethod, setShippingMethod] = useState<'internal' | 'ghn'>('internal')
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  
  // GHN address data
  const [provinces, setProvinces] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }
    
    loadProvinces()
    loadCustomerProfile()
    loadOrderData()
  }, [isAuthenticated])
  
  // Load districts when province changes
  useEffect(() => {
    if (form.provinceId) {
      loadDistricts(form.provinceId)
    } else {
      setDistricts([])
      setWards([])
    }
  }, [form.provinceId])
  
  // Load wards when district changes
  useEffect(() => {
    if (form.districtId) {
      loadWards(form.districtId)
    } else {
      setWards([])
    }
  }, [form.districtId])

  // Calculate shipping fee when address changes
  useEffect(() => {
    if (form.province && form.district) {
      calculateShippingFee()
    }
  }, [form.province, form.district])

  const loadProvinces = async () => {
    console.log('🔄 Loading provinces from GHN...')
    setLoadingProvinces(true)
    try {
      const response = await fetch('http://localhost:8080/api/shipping/provinces')
      const data = await response.json()
      
      console.log('📦 Provinces response:', data)
      
      if (data.success && data.data && data.data.length > 0) {
        console.log('✅ Loaded', data.data.length, 'provinces from GHN')
        setProvinces(data.data)
      } else {
        // Fallback to local data
        console.warn('⚠️ GHN API failed, using local data')
        const localProvinces = vietnamProvinces.map(p => ({
          id: parseInt(p.code),
          name: p.name
        }))
        setProvinces(localProvinces)
        toast('Đang sử dụng dữ liệu địa chỉ offline', { icon: 'ℹ️' })
      }
    } catch (error) {
      console.error('❌ Error loading provinces:', error)
      // Fallback to local data
      const localProvinces = vietnamProvinces.map(p => ({
        id: parseInt(p.code),
        name: p.name
      }))
      setProvinces(localProvinces)
      toast('Đang sử dụng dữ liệu địa chỉ offline', { icon: 'ℹ️' })
    } finally {
      setLoadingProvinces(false)
    }
  }
  
  const loadDistricts = async (provinceId: number) => {
    console.log('🔄 Loading districts for province:', provinceId)
    setLoadingDistricts(true)
    try {
      const response = await fetch(`http://localhost:8080/api/shipping/districts/${provinceId}`)
      const data = await response.json()
      
      console.log('📦 Districts response:', data)
      
      if (data.success && data.data && data.data.length > 0) {
        console.log('✅ Loaded', data.data.length, 'districts from GHN')
        setDistricts(data.data)
      } else {
        // Fallback to local data
        console.warn('⚠️ GHN API failed for districts, using local data')
        const province = vietnamProvinces.find(p => parseInt(p.code) === provinceId || p.name === form.province)
        if (province) {
          const localDistricts = province.districts.map(d => ({
            id: parseInt(d.code),
            name: d.name
          }))
          setDistricts(localDistricts)
        } else {
          setDistricts([])
        }
      }
    } catch (error) {
      console.error('❌ Error loading districts:', error)
      // Fallback to local data
      const province = vietnamProvinces.find(p => parseInt(p.code) === provinceId || p.name === form.province)
      if (province) {
        const localDistricts = province.districts.map(d => ({
          id: parseInt(d.code),
          name: d.name
        }))
        setDistricts(localDistricts)
      } else {
        setDistricts([])
      }
    } finally {
      setLoadingDistricts(false)
    }
  }
  
  const loadWards = async (districtId: number) => {
    console.log('🔄 Loading wards for district:', districtId)
    setLoadingWards(true)
    try {
      const response = await fetch(`http://localhost:8080/api/shipping/wards/${districtId}`)
      const data = await response.json()
      
      console.log('📦 Wards response:', data)
      
      if (data.success && data.data) {
        console.log('✅ Loaded', data.data.length, 'wards')
        setWards(data.data)
      } else {
        console.error('❌ Failed to load wards:', data.message)
        toast.error('Không thể tải danh sách phường/xã')
      }
    } catch (error) {
      console.error('❌ Error loading wards:', error)
      toast.error('Không thể tải danh sách phường/xã')
    } finally {
      setLoadingWards(false)
    }
  }

  const loadCustomerProfile = async () => {
    console.log('🔍 Loading customer profile...')
    console.log('Current user from authStore:', user)
    
    try {
      const response = await customerApi.getProfile()
      console.log('✅ Customer profile API response:', response)
      
      if (response.success && response.data) {
        const profile = response.data
        console.log('📋 Profile data:', profile)
        
        const newFormData = {
          ...form,
          customerName: profile.fullName || user?.fullName || '',
          customerPhone: profile.phone || '',
          customerEmail: user?.email || '',
          address: profile.address || '',
          province: profile.province || '',
          district: profile.district || '',
          ward: profile.ward || ''
        }
        
        console.log('📝 Setting form with data:', newFormData)
        setForm(newFormData)
        
        toast.success('Đã tải thông tin khách hàng')
      } else {
        console.warn('⚠️ API response not successful or no data')
      }
    } catch (error: any) {
      console.error('❌ Error loading customer profile:', error)
      console.error('Error details:', error.response?.data)
      
      toast.error('Không thể tải thông tin khách hàng')
      
      // Fallback to user info from authStore
      if (user) {
        console.log('🔄 Fallback to authStore user data')
        const customerInfo = user.customer || user
        setForm(prev => ({
          ...prev,
          customerName: customerInfo.fullName || user.fullName || user.name || '',
          customerPhone: customerInfo.phone || user.phone || '',
          customerEmail: user.email || ''
        }))
      }
    }
  }

  const loadOrderData = async () => {
    try {
      const type = searchParams.get('type')
      
      if (type === 'quick') {
        // Mua ngay - Lấy từ sessionStorage
        const quickBuyData = sessionStorage.getItem('quickBuyOrder')
        if (quickBuyData) {
          const data = JSON.parse(quickBuyData)
          setItems(data.items)
        } else {
          toast.error('Không tìm thấy thông tin đơn hàng')
          router.push('/')
        }
      } else {
        // Từ giỏ hàng - Lấy từ API
        const response = await cartApi.getCart()
        console.log('Cart response:', response)
        
        // Lấy danh sách item đã chọn từ sessionStorage
        const selectedItemsJson = sessionStorage.getItem('selectedCartItems')
        const selectedItemIds: number[] = selectedItemsJson ? JSON.parse(selectedItemsJson) : []
        console.log('Selected item IDs:', selectedItemIds)
        
        if (response.success && response.data?.items) {
          // Lọc chỉ lấy các item đã được chọn
          let filteredItems = response.data.items
          if (selectedItemIds.length > 0) {
            filteredItems = response.data.items.filter((item: any) => 
              selectedItemIds.includes(item.itemId)
            )
          }
          
          const mappedItems = filteredItems.map((item: any) => {
            console.log('Processing item:', item)
            
            return {
              itemId: item.itemId, // Giữ lại itemId để xóa sau khi đặt hàng
              productId: item.productId,
              productName: item.productName || 'Sản phẩm',
              price: item.price || 0,
              quantity: item.quantity || 1,
              imageUrl: item.productImage || ''
            }
          }).filter(Boolean) // Loại bỏ null items
          
          console.log('Mapped items:', mappedItems)
          console.log('Items count:', mappedItems.length)
          
          setItems(mappedItems)
          
          if (mappedItems.length === 0) {
            console.warn('No items after mapping!')
            toast.error('Vui lòng chọn sản phẩm để thanh toán')
            router.push('/cart')
          }
        } else {
          toast.error('Không thể tải giỏ hàng')
          router.push('/cart')
        }
      }
    } catch (error) {
      console.error('Error loading order data:', error)
      toast.error('Lỗi khi tải thông tin đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  // Lấy danh sách quận/huyện dựa trên tỉnh đã chọn
  const availableDistricts = useMemo(() => {
    if (!form.province) return []
    const province = vietnamProvinces.find(p => p.name === form.province)
    return province?.districts || []
  }, [form.province])

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + form.shippingFee
  }

  const calculateShippingFee = async () => {
    if (!form.province || !form.district) return

    setCalculatingShipping(true)
    try {
      const response = await fetch('http://localhost:8080/api/shipping/calculate-fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          province: form.province,
          district: form.district,
          address: form.address || '',
          weight: 1000, // Default 1kg
          value: calculateSubtotal()
        })
      })

      const data = await response.json()
      
      if (data.success && data.data) {
        const { fee, shipMethod, isFreeShip } = data.data
        setForm(prev => ({ ...prev, shippingFee: fee }))
        setShippingMethod(shipMethod === 'INTERNAL' ? 'internal' : 'ghn')
        
        if (isFreeShip) {
          toast.success('Miễn phí vận chuyển!')
        }
      } else {
        toast.error('Không thể tính phí vận chuyển')
        setForm(prev => ({ ...prev, shippingFee: 30000 }))
      }
    } catch (error) {
      console.error('Error calculating shipping fee:', error)
      toast.error('Lỗi khi tính phí vận chuyển')
      setForm(prev => ({ ...prev, shippingFee: 30000 }))
    } finally {
      setCalculatingShipping(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.customerName || !form.customerPhone || !form.customerEmail || 
        !form.province || !form.district || !form.ward || !form.address) {
      toast.error('Vui lòng điền đầy đủ thông tin (bao gồm phường/xã)')
      return
    }

    if (items.length === 0) {
      toast.error('Không có sản phẩm nào để đặt hàng')
      return
    }

    setSubmitting(true)
    try {
      // Lấy danh sách itemIds đã chọn
      const selectedItemIds = items.map((item: any) => item.itemId).filter(Boolean)
      
      const orderData = {
        province: form.province,
        district: form.district,
        ward: form.ward, // Ward code from GHN (required)
        wardName: form.wardName, // Ward name for display
        address: form.address,
        note: form.note,
        shippingFee: form.shippingFee,
        paymentMethod: form.paymentMethod, // COD hoặc SEPAY
        selectedItemIds: selectedItemIds // Danh sách item đã chọn
      }

      console.log('Submitting order:', orderData)

      const response = await orderApi.create(orderData)
      
      console.log('Order response:', response)
      console.log('Order data:', response.data)
      console.log('Order ID:', response.data?.id)
      
      if (response.success && response.data) {
        const orderId = response.data.orderId || response.data.id
        const orderCode = response.data.orderCode
        
        if (!orderId) {
          console.error('No order ID in response:', response)
          toast.error('Đặt hàng thành công nhưng không nhận được mã đơn hàng')
          router.push('/orders')
          return
        }
        
        // Xóa quickBuyOrder và selectedCartItems nếu có
        sessionStorage.removeItem('quickBuyOrder')
        sessionStorage.removeItem('selectedCartItems')
        
        // Dispatch event để cập nhật cart count (backend đã xóa các item đã mua)
        window.dispatchEvent(new Event('cartUpdated'))
        
        // Nếu chọn thanh toán online → Tạo payment
        if (form.paymentMethod === 'SEPAY') {
          try {
            toast.loading('Đang tạo thanh toán...')
            
            const paymentResponse = await fetch('http://localhost:8080/api/payment/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                orderId: orderId,
                amount: calculateTotal()
              })
            })
            
            const paymentResult = await paymentResponse.json()
            console.log('Payment response:', paymentResult)
            
            if (paymentResult.success) {
              toast.dismiss()
              toast.success('Chuyển đến trang thanh toán...')
              // Redirect đến trang payment
              router.push(`/payment/${orderCode}`)
            } else {
              toast.dismiss()
              toast.error(paymentResult.message || 'Không thể tạo thanh toán')
              // Vẫn cho xem đơn hàng
              router.push(`/orders/${orderCode}`)
            }
          } catch (error) {
            console.error('Payment error:', error)
            toast.dismiss()
            toast.error('Lỗi khi tạo thanh toán')
            router.push(`/orders/${orderCode}`)
          }
        } else {
          // COD - Chuyển đến trang success
          console.log('Redirecting to success page with orderId:', orderId)
          router.push(`/orders/success?orderId=${orderId}`)
        }
      } else {
        toast.error(response.message || 'Đặt hàng thất bại')
      }
    } catch (error: any) {
      console.error('Order error:', error)
      toast.error(error.message || 'Lỗi khi đặt hàng')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Thông tin giao hàng */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FiMapPin className="mr-2" />
                  Thông tin giao hàng
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => setForm({...form, customerName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.customerPhone}
                        onChange={(e) => setForm({...form, customerPhone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => setForm({...form, customerEmail: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tỉnh/Thành phố <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.provinceId || ''}
                        onChange={(e) => {
                          const provinceId = Number(e.target.value)
                          const province = provinces.find(p => p.id === provinceId)
                          console.log('Selected province:', province)
                          setForm({
                            ...form, 
                            provinceId: provinceId,
                            province: province?.name || '',
                            districtId: null,
                            district: '',
                            ward: ''
                          })
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={loadingProvinces}
                      >
                        <option value="">
                          {loadingProvinces ? 'Đang tải...' : 
                           provinces.length === 0 ? 'Không có dữ liệu' : 
                           'Chọn tỉnh/thành'}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.id}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                      {provinces.length === 0 && !loadingProvinces && (
                        <p className="text-xs text-red-500 mt-1">
                          Không thể tải danh sách tỉnh/thành. Vui lòng kiểm tra console.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quận/Huyện <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.districtId || ''}
                        onChange={(e) => {
                          const districtId = Number(e.target.value)
                          const district = districts.find(d => d.id === districtId)
                          setForm({
                            ...form, 
                            districtId: districtId,
                            district: district?.name || '',
                            ward: ''
                          })
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={!form.provinceId || loadingDistricts}
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phường/Xã <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.ward}
                        onChange={(e) => {
                          const wardCode = e.target.value
                          const ward = wards.find(w => w.code === wardCode)
                          setForm({
                            ...form, 
                            ward: wardCode,
                            wardName: ward?.name || ''
                          })
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={!form.districtId || loadingWards}
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((ward) => (
                          <option key={ward.code} value={ward.code}>
                            {ward.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ cụ thể <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({...form, address: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Số nhà, tên đường..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({...form, note: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ghi chú thêm về đơn hàng..."
                    />
                  </div>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FiCreditCard className="mr-2" />
                  Phương thức thanh toán
                </h2>
                
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={form.paymentMethod === 'COD'}
                      onChange={(e) => setForm({...form, paymentMethod: e.target.value})}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-blue-500 rounded-lg cursor-pointer hover:bg-blue-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="SEPAY"
                      checked={form.paymentMethod === 'SEPAY'}
                      onChange={(e) => setForm({...form, paymentMethod: e.target.value})}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">💳 Chuyển khoản ngân hàng (SePay)</p>
                      <p className="text-sm text-gray-600">Quét QR Code hoặc chuyển khoản - Xác nhận tự động</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng</h2>
                
                {/* Items */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 pb-3 border-b">
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiShoppingCart className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{formatPrice(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <div>
                      <p>Phí vận chuyển</p>
                      {shippingMethod === 'internal' && (
                        <p className="text-xs text-green-600">Shipper nội thành HN</p>
                      )}
                      {shippingMethod === 'ghn' && (
                        <p className="text-xs text-blue-600">Giao Hàng Nhanh</p>
                      )}
                      {calculatingShipping && (
                        <p className="text-xs text-gray-500">Đang tính phí...</p>
                      )}
                    </div>
                    <span className={form.shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                      {form.shippingFee === 0 ? 'Miễn phí' : formatPrice(form.shippingFee)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-red-600">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400"
                >
                  {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
