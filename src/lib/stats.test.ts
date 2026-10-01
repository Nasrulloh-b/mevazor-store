import { describe, expect, it } from 'vitest';
import { SEED_PRODUCTS } from '../data/products';
import { makeSampleOrders } from '../data/sampleOrders';
import { computeKpis, dailyRevenue, niceTicks } from './stats';

const NOW = new Date('2026-09-28T18:00:00');

describe('dashboard stats', () => {
  const orders = makeSampleOrders(SEED_PRODUCTS, NOW);

  it('buckets revenue into 14 calendar days ending today', () => {
    const days = dailyRevenue(orders, NOW, 14);
    expect(days).toHaveLength(14);
    expect(days[13].date.getDate()).toBe(28);
    expect(days[0].date.getDate()).toBe(15);
  });

  it('leaves cancelled orders out of revenue', () => {
    const counted = orders.filter((o) => o.status !== 'cancelled');
    const total = dailyRevenue(orders, NOW, 14).reduce((s, d) => s + d.revenueCents, 0);
    expect(total).toBe(counted.reduce((s, o) => s + o.totalCents, 0));
  });

  it('computes the average order from the same window', () => {
    const kpis = computeKpis(orders, SEED_PRODUCTS, NOW);
    expect(kpis.averageCents).toBe(Math.round(kpis.revenueCents / kpis.orderCount));
    expect(kpis.toReorder).toBe(4);
  });

  it('builds readable axis ticks', () => {
    expect(niceTicks(87)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});
