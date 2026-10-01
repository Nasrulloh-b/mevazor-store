import { describe, expect, it } from 'vitest';
import { buildOrder, initialState, reducer, type StoreState } from './reducer';

const NOW = new Date('2026-09-28T12:00:00');
const customer = { name: 'Madina Saidova', phone: '+992 92 123 4567', city: 'Khujand', address: 'Rudaki Ave 12', comment: '' };

function withCart(): StoreState {
  let state = initialState(NOW);
  state = reducer(state, { type: 'addToCart', productId: 'kanibadam-almonds', grams: 500, qty: 2 });
  state = reducer(state, { type: 'addToCart', productId: 'green-tea-95', grams: 100, qty: 1 });
  return state;
}

describe('cart', () => {
  it('merges repeated adds of the same pack into one line', () => {
    let state = initialState(NOW);
    state = reducer(state, { type: 'addToCart', productId: 'isfara-apricots', grams: 250, qty: 1 });
    state = reducer(state, { type: 'addToCart', productId: 'isfara-apricots', grams: 250, qty: 2 });
    expect(state.cart).toEqual([{ productId: 'isfara-apricots', grams: 250, qty: 3 }]);
  });

  it('refuses to add a sold-out product', () => {
    const state = reducer(initialState(NOW), { type: 'addToCart', productId: 'walnut-halves', grams: 250, qty: 1 });
    expect(state.cart).toHaveLength(0);
  });

  it('caps quantity at the stock on hand', () => {
    // Mountain herb tea has 2.6 kg; that is 26 packs of 100 g.
    const state = reducer(initialState(NOW), { type: 'addToCart', productId: 'mountain-herb-tea', grams: 100, qty: 40 });
    expect(state.cart[0].qty).toBe(26);
  });

  it('removes a line when its quantity is set to zero', () => {
    const state = reducer(withCart(), { type: 'setQty', productId: 'green-tea-95', grams: 100, qty: 0 });
    expect(state.cart.map((l) => l.productId)).toEqual(['kanibadam-almonds']);
  });

  it('only accepts known promo codes', () => {
    const bad = reducer(withCart(), { type: 'applyPromo', code: 'HACKED' });
    expect(bad.promoCode).toBeNull();
    const good = reducer(withCart(), { type: 'applyPromo', code: 'welcome10' });
    expect(good.promoCode).toBe('WELCOME10');
  });
});

describe('placing and managing orders', () => {
  it('deducts stock, clears the cart and records the order', () => {
    const before = withCart();
    const result = buildOrder(before, { customer, delivery: 'courier', payment: 'cash', now: NOW });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const after = reducer(before, { type: 'placeOrder', order: result.order });
    const almonds = (s: StoreState) => s.products.find((p) => p.id === 'kanibadam-almonds')!;
    expect(almonds(before).stockGrams - almonds(after).stockGrams).toBe(1000);
    expect(after.cart).toHaveLength(0);
    expect(after.orders[0].id).toBe(result.order.id);
    expect(after.orders[0].sample).toBe(false);
    expect(result.order.totalCents).toBe(2240 + 350 + 300);
  });

  it('gives each order a new sequential number', () => {
    const state = withCart();
    const result = buildOrder(state, { customer, delivery: 'pickup', payment: 'cash', now: NOW });
    if (!result.ok) throw new Error('expected an order');
    const highest = Math.max(...state.orders.map((o) => Number(o.id.slice(3))));
    expect(result.order.id).toBe(`MZ-${highest + 1}`);
    expect(result.order.customer.address).toBe('');
  });

  it('rejects an order when stock ran out after the item was added', () => {
    let state = reducer(initialState(NOW), { type: 'addToCart', productId: 'mountain-herb-tea', grams: 100, qty: 20 });
    state = {
      ...state,
      products: state.products.map((p) => (p.id === 'mountain-herb-tea' ? { ...p, stockGrams: 500 } : p)),
    };
    const result = buildOrder(state, { customer, delivery: 'courier', payment: 'cash', now: NOW });
    expect(result).toEqual({ ok: false, reason: 'stock', productId: 'mountain-herb-tea', availableGrams: 500 });
  });

  it('returns goods to stock when an order is cancelled', () => {
    const before = withCart();
    const result = buildOrder(before, { customer, delivery: 'courier', payment: 'cash', now: NOW });
    if (!result.ok) throw new Error('expected an order');
    const placed = reducer(before, { type: 'placeOrder', order: result.order });
    const cancelled = reducer(placed, { type: 'setOrderStatus', id: result.order.id, status: 'cancelled' });
    const stock = (s: StoreState) => s.products.find((p) => p.id === 'kanibadam-almonds')!.stockGrams;
    expect(stock(cancelled)).toBe(stock(before));

    // A cancelled order stays cancelled.
    const reopened = reducer(cancelled, { type: 'setOrderStatus', id: result.order.id, status: 'new' });
    expect(reopened.orders[0].status).toBe('cancelled');
  });

  it('adds received stock in grams', () => {
    const state = reducer(initialState(NOW), { type: 'receiveStock', productId: 'walnut-halves', grams: 12500 });
    expect(state.products.find((p) => p.id === 'walnut-halves')!.stockGrams).toBe(12500);
  });
});
