import type { Order, Product } from '../types';
import { isLowStock, isSoldOut, smallestPack } from './pricing';

export interface DayBucket {
  date: Date;
  revenueCents: number;
  orders: number;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Revenue per calendar day for the last `days` days, oldest first. Cancelled orders don't count. */
export function dailyRevenue(orders: Order[], now: Date = new Date(), days = 14): DayBucket[] {
  const buckets: DayBucket[] = [];
  const index = new Map<string, DayBucket>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const bucket = { date: d, revenueCents: 0, orders: 0 };
    buckets.push(bucket);
    index.set(dayKey(d), bucket);
  }
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const bucket = index.get(dayKey(new Date(o.createdAt)));
    if (bucket) {
      bucket.revenueCents += o.totalCents;
      bucket.orders += 1;
    }
  }
  return buckets;
}

export interface Kpis {
  revenueCents: number;
  orderCount: number;
  averageCents: number;
  openOrders: number;
  toReorder: number;
}

export function computeKpis(orders: Order[], products: Product[], now: Date = new Date()): Kpis {
  const days = dailyRevenue(orders, now, 14);
  const revenueCents = days.reduce((s, d) => s + d.revenueCents, 0);
  const orderCount = days.reduce((s, d) => s + d.orders, 0);
  return {
    revenueCents,
    orderCount,
    averageCents: orderCount ? Math.round(revenueCents / orderCount) : 0,
    openOrders: orders.filter((o) => o.status === 'new' || o.status === 'packed' || o.status === 'shipped').length,
    toReorder: products.filter((p) => isLowStock(p) || isSoldOut(p)).length,
  };
}

/** Retail value of all stock, priced at each product's smallest pack. */
export function inventoryValueCents(products: Product[]): number {
  return products.reduce((sum, p) => {
    const pack = smallestPack(p);
    return sum + Math.round((p.stockGrams / pack.grams) * pack.priceCents);
  }, 0);
}

/** "Nice" axis ticks from 0 up to at least `max`. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  const ticks: number[] = [];
  for (let v = 0; v < max + step * 0.001; v += step) ticks.push(Math.round(v * 1000) / 1000);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}
