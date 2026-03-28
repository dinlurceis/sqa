'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  rating: number
  reviews: number
  badge?: string
  color?: string
  storage?: string
}

export interface CartItem extends Product {
  quantity: number
}

interface CartStore {
  items: CartItem[]
  wishlist: number[] // Array of product IDs
  userId?: string // Track which user owns this cart
  addToCart: (product: Product) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  addToWishlist: (productId: number) => void
  removeFromWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  getCartCount: () => number
  getCartTotal: () => number
  setUserId: (userId?: string) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      userId: undefined,

      setUserId: (userId?: string) => {
        set({ userId })
      },

      addToCart: (product: Product) => {
        const items = get().items
        const existingItem = items.find(item => item.id === product.id)
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          })
        } else {
          set({
            items: [...items, { ...product, quantity: 1 }]
          })
        }
      },

      removeFromCart: (productId: number) => {
        set({
          items: get().items.filter(item => item.id !== productId)
        })
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
          return
        }
        
        set({
          items: get().items.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      addToWishlist: (productId: number) => {
        const wishlist = get().wishlist
        if (!wishlist.includes(productId)) {
          set({ wishlist: [...wishlist, productId] })
        }
      },

      removeFromWishlist: (productId: number) => {
        set({
          wishlist: get().wishlist.filter(id => id !== productId)
        })
      },

      isInWishlist: (productId: number) => {
        return get().wishlist.includes(productId)
      },

      getCartCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        items: state.items, 
        wishlist: state.wishlist,
        userId: state.userId
      }),
    }
  )
)
