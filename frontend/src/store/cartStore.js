import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: 'cash',
  customerId: null,

  addItem: (product) => {
    const items = get().items
    const existing = items.find((i) => i.product_id === product.id)
    if (existing) {
      set({ items: items.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i) })
    } else {
      set({ items: [...items, { product_id: product.id, name: product.name, unit_price: product.price, quantity: 1 }] })
    }
  },

  removeItem: (product_id) => set({ items: get().items.filter((i) => i.product_id !== product_id) }),

  updateQty: (product_id, quantity) => {
    if (quantity <= 0) return get().removeItem(product_id)
    set({ items: get().items.map((i) => i.product_id === product_id ? { ...i, quantity } : i) })
  },

  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCustomerId: (customerId) => set({ customerId }),

  getTotal: () => {
    const subtotal = get().items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0)
    return subtotal - get().discount
  },

  clear: () => set({ items: [], discount: 0, customerId: null }),
}))
