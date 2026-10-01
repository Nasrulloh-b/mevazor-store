import type { CartLine, DeliveryMethod, PackSize, Product } from '../types';

/** Orders at or above this amount (after discount) ship free by courier. */
export const FREE_DELIVERY_CENTS = 4000;
export const COURIER_FEE_CENTS = 300;

export const PROMO_CODES: Record<string, number> = {
  WELCOME10: 0.1,
};

/** Returns the canonical promo code if it exists, otherwise null. */
export function normalizePromo(input: string): string | null {
  const code = input.trim().toUpperCase();
  return code in PROMO_CODES ? code : null;
}

export function findPack(product: Product, grams: number): PackSize | undefined {
  return product.packs.find((p) => p.grams === grams);
}

export function smallestPack(product: Product): PackSize {
  return product.packs.reduce((min, p) => (p.grams < min.grams ? p : min), product.packs[0]);
}

export function pricePerKgCents(pack: PackSize): number {
  return Math.round((pack.priceCents / pack.grams) * 1000);
}

/** Grams of this product already reserved by the cart, optionally ignoring one pack size. */
export function reservedGrams(cart: CartLine[], productId: string, exceptGrams?: number): number {
  return cart
    .filter((l) => l.productId === productId && l.grams !== exceptGrams)
    .reduce((sum, l) => sum + l.grams * l.qty, 0);
}

/** How many more packs of this size fit into the remaining stock. */
export function maxAddable(product: Product, cart: CartLine[], grams: number): number {
  const free = product.stockGrams - reservedGrams(cart, product.id);
  return Math.max(0, Math.floor(free / grams));
}

/** Highest quantity a cart line for this pack size can be set to. */
export function maxQtyForLine(product: Product, cart: CartLine[], grams: number): number {
  const free = product.stockGrams - reservedGrams(cart, product.id, grams);
  return Math.max(0, Math.floor(free / grams));
}

export function isSoldOut(product: Product): boolean {
  return product.stockGrams < smallestPack(product).grams;
}

export function isLowStock(product: Product): boolean {
  return !isSoldOut(product) && product.stockGrams <= product.reorderGrams;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  deliveryCents: number;
  totalCents: number;
  /** How much more the customer needs to add for free courier delivery (0 if reached). */
  freeDeliveryLeftCents: number;
  itemCount: number;
}

export function computeTotals(
  cart: CartLine[],
  products: Product[],
  promoCode: string | null,
  delivery: DeliveryMethod = 'courier',
): Totals {
  const byId = new Map(products.map((p) => [p.id, p]));
  let subtotalCents = 0;
  let itemCount = 0;
  for (const line of cart) {
    const product = byId.get(line.productId);
    const pack = product && findPack(product, line.grams);
    if (!pack) continue;
    subtotalCents += pack.priceCents * line.qty;
    itemCount += line.qty;
  }
  const rate = promoCode ? PROMO_CODES[promoCode] ?? 0 : 0;
  const discountCents = Math.round(subtotalCents * rate);
  const afterDiscount = subtotalCents - discountCents;
  const qualifiesForFree = afterDiscount >= FREE_DELIVERY_CENTS;
  const deliveryCents =
    subtotalCents === 0 || delivery === 'pickup' || qualifiesForFree ? 0 : COURIER_FEE_CENTS;
  return {
    subtotalCents,
    discountCents,
    deliveryCents,
    totalCents: afterDiscount + deliveryCents,
    freeDeliveryLeftCents: qualifiesForFree ? 0 : FREE_DELIVERY_CENTS - afterDiscount,
    itemCount,
  };
}

/** Accepts local and international formats; needs at least 9 digits. */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15 && /^[+\d\s()-]+$/.test(phone.trim());
}
