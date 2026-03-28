import { useAuthStore } from '@/store/authStore'
import { type Position } from '@/lib/permissions'

export function usePermissionCheck() {
  const { employee, user } = useAuthStore()

  const checkPermission = (requiredPosition: Position | Position[]): boolean => {
    // Admin always has permission
    if (user?.role === 'ADMIN') return true
    
    // Get position from employee object or user object
    const position = employee?.position || user?.position
    
    if (!position) {
      console.log('❌ No position found:', { employee, user })
      return false
    }
    
    // Normalize position (handle SALE vs SALES)
    let currentPosition = position.toUpperCase()
    if (currentPosition === 'SALES') currentPosition = 'SALE'
    
    const positions = Array.isArray(requiredPosition) ? requiredPosition : [requiredPosition]
    const hasPermission = positions.some(pos => currentPosition === pos.toUpperCase())
    
    console.log('🔐 Permission check:', {
      currentPosition,
      requiredPosition: positions,
      hasPermission,
      employee,
      user
    })
    
    return hasPermission
  }

  const getEmployeePosition = (): Position | null => {
    const position = employee?.position || user?.position
    
    if (!position) return null
    
    // Normalize position
    let normalizedPosition = position.toUpperCase()
    if (normalizedPosition === 'SALES') normalizedPosition = 'SALE'
    
    return normalizedPosition as Position
  }

  return {
    checkPermission,
    getEmployeePosition,
    employee,
    user
  }
}
