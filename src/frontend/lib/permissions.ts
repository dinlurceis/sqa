// Permission system for employee roles
// NOTE: All employees can VIEW all pages, but ACTION permissions are restricted by position

export type Position = 
  | 'SALE' 
  | 'CSKH' 
  | 'PRODUCT_MANAGER' 
  | 'WAREHOUSE' 
  | 'ACCOUNTANT' 
  | 'SHIPPER'

export type Permission = 
  // Product permissions
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  
  // Category permissions
  | 'categories.create'
  | 'categories.edit'
  | 'categories.delete'
  
  // Warehouse permissions
  | 'warehouse.import.create'      // Tạo phiếu nhập kho
  | 'warehouse.import.approve'     // Duyệt phiếu nhập kho
  | 'warehouse.export.create'      // Tạo phiếu xuất kho
  | 'warehouse.export.approve'     // Duyệt phiếu xuất kho
  
  // Order permissions
  | 'orders.create'
  | 'orders.edit'
  | 'orders.confirm'
  | 'orders.cancel'
  | 'orders.ship'
  
  // Customer permissions
  | 'customers.edit'
  
  // Supplier permissions
  | 'suppliers.create'
  | 'suppliers.edit'
  | 'suppliers.delete'
  
  // Accounting permissions
  | 'accounting.reconciliation.edit'
  | 'accounting.payables.create'
  | 'accounting.payables.edit'
  | 'accounting.payables.delete'
  
  // Shipping permissions
  | 'shipping.pickup'
  | 'shipping.deliver'
  | 'shipping.update_status'
  
  // Employee permissions
  | 'employees.approve'
  | 'employees.edit'
  
  // Bank account permissions
  | 'bank_accounts.create'
  | 'bank_accounts.edit'
  | 'bank_accounts.delete'
  
  // Support/Ticket permissions
  | 'tickets.view_all'
  | 'tickets.reply'
  | 'tickets.close'
  | 'tickets.assign'

// Permission mapping for each position
// NOTE: All employees can VIEW all pages, these permissions are for ACTIONS only
export const POSITION_PERMISSIONS: Record<Position, Permission[]> = {
  // Sales staff - Quản lý đơn hàng, khách hàng
  SALE: [
    'orders.create',
    'orders.edit',
    'orders.confirm',
    'orders.cancel',
    'customers.edit',
  ],
  
  // Customer service - Chăm sóc khách hàng, xử lý đơn hàng, quản lý tickets
  CSKH: [
    'orders.edit',
    'customers.edit',
    'tickets.view_all',
    'tickets.reply',
    'tickets.close',
    'tickets.assign',
  ],
  
  // Product manager - Quản lý sản phẩm, danh mục, CHỈ XEM báo cáo kho (không nhập/xuất)
  PRODUCT_MANAGER: [
    'products.create',
    'products.edit',
    'products.delete',
    'categories.create',
    'categories.edit',
    'categories.delete',
    // Không có warehouse.import/export - chỉ xem
  ],
  
  // Warehouse staff - Quản lý kho, nhập xuất hàng
  WAREHOUSE: [
    'warehouse.import.create',
    'warehouse.import.approve',
    'warehouse.export.create',
    'warehouse.export.approve',
    'suppliers.create',
    'suppliers.edit',
  ],
  
  // Accountant - Kế toán, đối soát, công nợ
  ACCOUNTANT: [
    'accounting.reconciliation.edit',
    'accounting.payables.create',
    'accounting.payables.edit',
    'accounting.payables.delete',
    'bank_accounts.create',
    'bank_accounts.edit',
    'bank_accounts.delete',
  ],
  
  // Shipper - Giao hàng
  SHIPPER: [
    'shipping.pickup',
    'shipping.deliver',
    'shipping.update_status',
  ],
}

// Check if user has permission
export function hasPermission(position: Position | null, permission: Permission): boolean {
  if (!position) return false
  return POSITION_PERMISSIONS[position]?.includes(permission) || false
}

// Check if user has any of the permissions
export function hasAnyPermission(position: Position | null, permissions: Permission[]): boolean {
  if (!position) return false
  return permissions.some(p => hasPermission(position, p))
}

// Check if user has all permissions
export function hasAllPermissions(position: Position | null, permissions: Permission[]): boolean {
  if (!position) return false
  return permissions.every(p => hasPermission(position, p))
}

// Get all permissions for a position
export function getPermissions(position: Position | null): Permission[] {
  if (!position) return []
  return POSITION_PERMISSIONS[position] || []
}

// Position display names
export const POSITION_NAMES: Record<Position, string> = {
  SALE: 'Nhân viên bán hàng',
  CSKH: 'Chăm sóc khách hàng',
  PRODUCT_MANAGER: 'Quản lý sản phẩm',
  WAREHOUSE: 'Nhân viên kho',
  ACCOUNTANT: 'Kế toán',
  SHIPPER: 'Tài xế giao hàng',
}
