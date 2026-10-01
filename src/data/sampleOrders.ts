import type { Customer, Order, OrderLine, OrderStatus, Product } from '../types';
import { CITIES } from './products';
import { computeTotals } from '../lib/pricing';

const NAMES = [
  'Farrukh Rahimov',
  'Madina Saidova',
  'Dilshod Karimov',
  'Zarina Nazarova',
  'Aziz Tursunov',
  'Nigora Yusupova',
  'Rustam Aliev',
  'Gulnora Ismoilova',
  'Bakhtiyor Olimov',
  'Shahnoza Rakhmonova',
  'Timur Sadykov',
  'Aigerim Bekova',
];

const STREETS = ['Lenin St', 'Rudaki Ave', 'Ismoili Somoni St', 'Kamoli Khujandi St', 'Navoi St', 'Amir Temur Ave'];

/** Small deterministic random generator so the sample data looks the same on every load. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Example orders spread over the last 14 days, so the admin dashboard has something to show.
 * They are marked `sample: true` and do not reduce stock.
 */
export function makeSampleOrders(products: Product[], now: Date = new Date()): Order[] {
  const rand = mulberry32(1042);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const orders: Order[] = [];
  const count = 26;

  for (let i = 0; i < count; i++) {
    const daysAgo = 13 - Math.floor((i / count) * 14);
    const created = new Date(now);
    created.setDate(created.getDate() - daysAgo);
    created.setHours(9 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);
    if (created > now) created.setTime(now.getTime() - (count - i) * 60_000);

    const lineCount = 1 + Math.floor(rand() * 3);
    const lines: OrderLine[] = [];
    for (let j = 0; j < lineCount; j++) {
      const product = pick(products);
      if (lines.some((l) => l.productId === product.id)) continue;
      const pack = pick(product.packs);
      lines.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        grams: pack.grams,
        qty: 1 + Math.floor(rand() * 3),
        unitCents: pack.priceCents,
      });
    }

    const name = pick(NAMES);
    const customer: Customer = {
      name,
      phone: `+992 9${Math.floor(rand() * 10)} ${100 + Math.floor(rand() * 900)} ${1000 + Math.floor(rand() * 9000)}`,
      city: pick(CITIES),
      address: `${pick(STREETS)} ${1 + Math.floor(rand() * 120)}`,
      comment: '',
    };
    const delivery = rand() < 0.8 ? 'courier' : 'pickup';
    const totals = computeTotals(
      lines.map((l) => ({ productId: l.productId, grams: l.grams, qty: l.qty })),
      products,
      null,
      delivery,
    );

    let status: OrderStatus;
    if (daysAgo >= 4) status = 'delivered';
    else if (daysAgo >= 2) status = rand() < 0.5 ? 'delivered' : 'shipped';
    else if (daysAgo === 1) status = rand() < 0.5 ? 'shipped' : 'packed';
    else status = rand() < 0.5 ? 'packed' : 'new';
    if (i === 9) status = 'cancelled';

    orders.push({
      id: `MZ-${1001 + i}`,
      createdAt: created.toISOString(),
      lines,
      customer,
      delivery,
      payment: rand() < 0.6 ? 'cash' : 'card-on-delivery',
      promoCode: null,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      deliveryCents: totals.deliveryCents,
      totalCents: totals.totalCents,
      status,
      sample: true,
    });
  }
  return orders.reverse();
}
