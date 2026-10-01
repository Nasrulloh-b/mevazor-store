import { useStore } from '../store/StoreContext';
import { findPack, maxAddable } from '../lib/pricing';
import { formatKg, formatPack } from '../lib/format';
import type { Product } from '../types';

/** Adds packs to the cart and tells the shopper what happened. Returns true if anything was added. */
export function useAddToCart() {
  const { state, dispatch, t, notify } = useStore();
  return (product: Product, grams: number, qty: number): boolean => {
    const available = maxAddable(product, state.cart, grams);
    if (available <= 0 || !findPack(product, grams)) {
      const free = product.stockGrams - state.cart.filter((l) => l.productId === product.id).reduce((s, l) => s + l.grams * l.qty, 0);
      notify(t('product.notEnough', { kg: formatKg(Math.max(0, free), state.lang) }));
      return false;
    }
    const added = Math.min(qty, available);
    dispatch({ type: 'addToCart', productId: product.id, grams, qty: added });
    const pack = added > 1 ? `${added} × ${formatPack(grams, state.lang)}` : formatPack(grams, state.lang);
    notify(t('toast.added', { name: product.name[state.lang], pack }));
    return true;
  };
}
