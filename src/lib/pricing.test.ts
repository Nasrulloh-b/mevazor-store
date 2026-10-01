import { describe, expect, it } from 'vitest';
import { SEED_PRODUCTS } from '../data/products';
import {
  COURIER_FEE_CENTS,
  FREE_DELIVERY_CENTS,
  computeTotals,
  isLowStock,
  isSoldOut,
  isValidPhone,
  maxAddable,
  normalizePromo,
  pricePerKgCents,
} from './pricing';

const apricots = SEED_PRODUCTS.find((p) => p.id === 'isfara-apricots')!;
const walnuts = SEED_PRODUCTS.find((p) => p.id === 'walnut-halves')!;
const herbTea = SEED_PRODUCTS.find((p) => p.id === 'mountain-herb-tea')!;

describe('computeTotals', () => {
  it('adds courier delivery below the free-delivery threshold', () => {
    const totals = computeTotals([{ productId: apricots.id, grams: 250, qty: 2 }], SEED_PRODUCTS, null);
    expect(totals.subtotalCents).toBe(900);
    expect(totals.deliveryCents).toBe(COURIER_FEE_CENTS);
    expect(totals.totalCents).toBe(900 + COURIER_FEE_CENTS);
    expect(totals.freeDeliveryLeftCents).toBe(FREE_DELIVERY_CENTS - 900);
  });

  it('delivers free once the discounted subtotal reaches the threshold', () => {
    const totals = computeTotals([{ productId: apricots.id, grams: 1000, qty: 3 }], SEED_PRODUCTS, null);
    expect(totals.subtotalCents).toBe(4770);
    expect(totals.deliveryCents).toBe(0);
  });

  it('applies WELCOME10 before checking the free-delivery threshold', () => {
    // $42.00 subtotal drops to $37.80 after 10% off, so courier delivery is charged again.
    const cart = [{ productId: apricots.id, grams: 500, qty: 5 }];
    const totals = computeTotals(cart, SEED_PRODUCTS, 'WELCOME10');
    expect(totals.subtotalCents).toBe(4200);
    expect(totals.discountCents).toBe(420);
    expect(totals.deliveryCents).toBe(COURIER_FEE_CENTS);
  });

  it('never charges delivery for pickup', () => {
    const totals = computeTotals([{ productId: apricots.id, grams: 250, qty: 1 }], SEED_PRODUCTS, null, 'pickup');
    expect(totals.deliveryCents).toBe(0);
  });

  it('charges nothing for an empty cart', () => {
    expect(computeTotals([], SEED_PRODUCTS, null).totalCents).toBe(0);
  });
});

describe('stock rules', () => {
  it('limits how many packs fit into remaining stock', () => {
    // 42 kg in stock, 40 kg already in the cart → only two more 1 kg packs.
    const cart = [{ productId: apricots.id, grams: 1000, qty: 40 }];
    expect(maxAddable(apricots, cart, 1000)).toBe(2);
    expect(maxAddable(apricots, cart, 250)).toBe(8);
  });

  it('flags sold-out and low-stock items', () => {
    expect(isSoldOut(walnuts)).toBe(true);
    expect(isLowStock(walnuts)).toBe(false);
    expect(isLowStock(herbTea)).toBe(true);
    expect(isLowStock(apricots)).toBe(false);
  });
});

describe('helpers', () => {
  it('normalizes promo codes', () => {
    expect(normalizePromo(' welcome10 ')).toBe('WELCOME10');
    expect(normalizePromo('FREE')).toBeNull();
  });

  it('computes price per kilogram', () => {
    expect(pricePerKgCents({ grams: 250, priceCents: 450 })).toBe(1800);
  });

  it('validates phone numbers', () => {
    expect(isValidPhone('+992 92 123 4567')).toBe(true);
    expect(isValidPhone('92-123-45-67')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('call me')).toBe(false);
  });
});
