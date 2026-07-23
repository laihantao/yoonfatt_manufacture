'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { EnquiryItem } from '@/lib/types';

const STORAGE_KEY = 'yf_enquiry_cart_v1';

type CartContextValue = {
  items: EnquiryItem[];
  count: number;
  add: (item: EnquiryItem) => void;
  /** Set the quantity of one product+variant line. */
  setLineQuantity: (slug: string, variant: string | null, quantity: number) => void;
  /** Remove one product+variant line. */
  removeLine: (slug: string, variant: string | null) => void;
  /** Remove every line of a product (all variants). */
  removeProduct: (slug: string) => void;
  clear: () => void;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function EnquiryCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<EnquiryItem[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setReady(true);
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, ready]);

  const add = useCallback((item: EnquiryItem) => {
    setItems((prev) => {
      // Merge same slug + variant by summing quantity.
      const idx = prev.findIndex(
        (p) => p.slug === item.slug && (p.variant ?? null) === (item.variant ?? null),
      );
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const sameLine = (it: EnquiryItem, slug: string, variant: string | null) =>
    it.slug === slug && (it.variant ?? null) === (variant ?? null);

  const setLineQuantity = useCallback(
    (slug: string, variant: string | null, quantity: number) => {
      setItems((prev) =>
        prev.map((it) =>
          sameLine(it, slug, variant) ? { ...it, quantity: Math.max(1, quantity) } : it,
        ),
      );
    },
    [],
  );

  const removeLine = useCallback((slug: string, variant: string | null) => {
    setItems((prev) => prev.filter((it) => !sameLine(it, slug, variant)));
  }, []);

  const removeProduct = useCallback((slug: string) => {
    setItems((prev) => prev.filter((it) => it.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, it) => sum + it.quantity, 0),
      add,
      setLineQuantity,
      removeLine,
      removeProduct,
      clear,
      ready,
    }),
    [items, add, setLineQuantity, removeLine, removeProduct, clear, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useEnquiryCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useEnquiryCart must be used within EnquiryCartProvider');
  return ctx;
}
