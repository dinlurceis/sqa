/**
 * Mock Shipping Service for demo purposes
 * Simulates GHTK API without actual API calls
 */

export interface ShippingFeeRequest {
  pick_province: string
  pick_district: string
  province: string
  district: string
  address: string
  weight: number
  value: number
}

export interface ShippingFeeResponse {
  success: boolean
  fee: {
    name: string
    fee: number
    insurance_fee: number
    pick_station_fee: number
    deliver_station_fee: number
    return_fee: number
    total_fee: number
  }
}

export const mockShippingService = {
  /**
   * Mock calculate shipping fee
   * Returns realistic fee based on weight and distance
   */
  calculateShippingFee: async (data: ShippingFeeRequest): Promise<ShippingFeeResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Calculate mock fee based on weight
    let baseFee = 20000 // Base fee 20k
    
    if (data.weight > 1000) {
      baseFee += Math.floor((data.weight - 1000) / 500) * 5000
    }

    // Add distance fee (mock based on different province)
    const isDifferentProvince = data.pick_province !== data.province
    if (isDifferentProvince) {
      baseFee += 10000
    }

    // Insurance fee (0.5% of value, max 50k)
    const insuranceFee = Math.min(Math.floor(data.value * 0.005), 50000)

    const totalFee = baseFee + insuranceFee

    return {
      success: true,
      fee: {
        name: "Giao hàng tiết kiệm",
        fee: baseFee,
        insurance_fee: insuranceFee,
        pick_station_fee: 0,
        deliver_station_fee: 0,
        return_fee: 0,
        total_fee: totalFee
      }
    }
  },

  /**
   * Mock create shipping order
   */
  createOrder: async (orderData: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const trackingId = 'DEMO' + Date.now().toString().slice(-8)
    
    return {
      success: true,
      order: {
        tracking_id: trackingId,
        label: `https://example.com/label/${trackingId}.pdf`,
        fee: orderData.total_fee || 25000,
        estimated_pick_time: new Date(Date.now() + 86400000).toISOString(), // +1 day
        estimated_deliver_time: new Date(Date.now() + 259200000).toISOString(), // +3 days
        status: 'pending_pick'
      }
    }
  },

  /**
   * Mock track order status
   */
  trackOrder: async (trackingId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))

    return {
      success: true,
      order: {
        tracking_id: trackingId,
        status: 'delivering',
        status_text: 'Đang giao hàng',
        current_location: 'Bưu cục Quận 1, TP.HCM',
        estimated_deliver_time: new Date(Date.now() + 86400000).toISOString(),
        history: [
          {
            time: new Date(Date.now() - 172800000).toISOString(),
            status: 'picked',
            location: 'Đã lấy hàng'
          },
          {
            time: new Date(Date.now() - 86400000).toISOString(),
            status: 'in_transit',
            location: 'Đang vận chuyển'
          },
          {
            time: new Date().toISOString(),
            status: 'delivering',
            location: 'Đang giao hàng'
          }
        ]
      }
    }
  }
}

// Flag to enable/disable mock
export const USE_MOCK_SHIPPING = process.env.NEXT_PUBLIC_USE_MOCK_SHIPPING !== 'false'
