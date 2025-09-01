import { create } from 'zustand';

export const useCart = create((set, get) => ({
  items: {},
  add: (p) => set(s => {
    const qty = (s.items[p.id]?.qty ?? 0) + 1;
    return { items: { ...s.items, [p.id]: { ...p, qty } } };
  }),
  remove: (id) => set(s => {
    const n = { ...s.items }; delete n[id]; return { items: n };
  }),
  clear: () => set({ items: {} }),
  totalQty: () => Object.values(get().items).reduce((a, b) => a + b.qty, 0),
  totalPrice: () => Object.values(get().items).reduce((a, b) => a + b.qty * b.price, 0),
}));
