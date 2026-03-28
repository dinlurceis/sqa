import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useState, useEffect } from 'react'

export interface User {
  id?: string
  email: string
  fullName?: string
  name?: string
  phone?: string
  address?: string
  province?: string
  district?: string
  ward?: string
  gender?: string
  birthDate?: string
  role: 'CUSTOMER' | 'ADMIN' | 'EMPLOYEE'
  position?: 'WAREHOUSE' | 'PRODUCT_MANAGER' | 'ACCOUNTANT' | 'SALE' | 'SALES' | 'CSKH' | 'SHIPPER'
  status?: string
  employeeId?: number // ID của employee (nếu là nhân viên)
  customer?: {
    fullName?: string
    phone?: string
    address?: string
    gender?: string
    birthDate?: string
  }
  employee?: {
    id?: number // ID của employee trong bảng employees
    fullName?: string
    phone?: string
    address?: string
    position?: 'WAREHOUSE' | 'PRODUCT_MANAGER' | 'ACCOUNTANT' | 'SALE' | 'SALES' | 'CSKH' | 'SHIPPER'
    firstLogin?: boolean
  }
}

interface AuthStore {
  user: User | null
  employee: User['employee'] | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  setUser: (user: User | null) => void
  setAuth: (user: User, token: string) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set: any) => ({
      user: null,
      employee: null,
      token: null,
      isAuthenticated: false,
      login: (user: User) => set({ 
        user, 
        employee: user.employee || (user.employeeId ? { 
          id: user.employeeId, 
          fullName: user.fullName, 
          position: user.position 
        } : null),
        isAuthenticated: true 
      }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('token')
          localStorage.removeItem('auth-storage')
          // Xóa giỏ hàng khi đăng xuất
          localStorage.removeItem('cart-storage')
        }
        set({ user: null, employee: null, isAuthenticated: false, token: null })
      },
      setUser: (user: User | null) => set({ 
        user, 
        employee: user?.employee || (user?.employeeId ? { 
          id: user.employeeId, 
          fullName: user.fullName, 
          position: user.position 
        } : null),
        isAuthenticated: !!user 
      }),
      setAuth: (user: User, token: string) => {
        if (typeof window !== 'undefined') {
          // Xóa giỏ hàng cũ khi đăng nhập tài khoản mới
          const currentUser = JSON.parse(localStorage.getItem('cart-storage') || '{}')?.state?.userId
          if (currentUser && currentUser !== user.id) {
            localStorage.removeItem('cart-storage')
          }
          
          // Lưu token vào localStorage
          localStorage.setItem('auth_token', token)
          localStorage.setItem('token', token)
        }
        
        // Đảm bảo employee.id được set đúng
        const employeeData = user.employee || (user.employeeId ? { 
          id: user.employeeId, 
          fullName: user.fullName, 
          position: user.position 
        } : null)
        
        set({ 
          user, 
          employee: employeeData,
          token, 
          isAuthenticated: true 
        })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Hook để check xem Zustand đã hydrate chưa
export const useAuthStoreHydrated = () => {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    // Đợi một tick để Zustand persist hydrate
    const timer = setTimeout(() => {
      setHydrated(true)
    }, 0)
    
    return () => clearTimeout(timer)
  }, [])
  
  return hydrated
}
