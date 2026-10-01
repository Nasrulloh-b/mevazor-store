import { useMemo, useState } from 'react';
import type { OrderStatus, Product } from '../types';
import { useStore } from '../store/StoreContext';
import { routeHref, type Route } from '../lib/router';
import { computeKpis, dailyRevenue, inventoryValueCents } from '../lib/stats';
import { isLowStock, isSoldOut, smallestPack } from '../lib/pricing';
import { formatDate, formatKg, formatMoney, formatNumber, formatPack } from '../lib/format';
import { STATUS_KEYS } from '../i18n';
import { CITY_NAMES_RU } from '../data/products';
import { RevenueChart } from '../components/RevenueChart';
import { StatusPill } from '../components/StatusPill';
import { ProductArt } from '../components/ProductArt';

type Tab = Extract<Route, { name: 'admin' }>['tab'];
const STATUSES: OrderStatus[] = ['new', 'packed', 'shipped', 'delivered', 'cancelled'];

export function AdminPage({ tab }: { tab: Tab }) {
  const { state, dispatch, t, notify } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const sampleCount = state.orders.filter((o) => o.sample).length;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('admin.overview') },
    { id: 'orders', label: t('admin.orders') },
    { id: 'inventory', label: t('admin.inventory') },
  ];

  return (
    <section className="page admin">
      <div className="admin-head">
        <div>
          <h1 className="page-title">{t('admin.title')}</h1>
          <p className="muted small">{t('admin.sampleNote', { n: sampleCount })}</p>
        </div>
        <div className="reset-box">
          {confirmReset ? (
            <div className="reset-confirm" role="group" aria-label={t('admin.reset')}>
              <span>{t('admin.resetConfirm')}</span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  dispatch({ type: 'reset' });
                  setConfirmReset(false);
                  notify(t('admin.resetDone'));
                }}
              >
                {t('admin.resetYes')}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmReset(false)}>
                {t('admin.cancel')}
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmReset(true)}>
              {t('admin.reset')}
            </button>
          )}
        </div>
      </div>

      <nav className="tabs" aria-label={t('admin.title')}>
        {tabs.map((x) => (
          <a
            key={x.id}
            href={routeHref({ name: 'admin', tab: x.id })}
            className={`tab${tab === x.id ? ' is-active' : ''}`}
            aria-current={tab === x.id ? 'page' : undefined}
          >
            {x.label}
          </a>
        ))}
      </nav>

      {tab === 'overview' && <Overview />}
      {tab === 'orders' && <OrdersTable />}
      {tab === 'inventory' && <Inventory />}
    </section>
  );
}

function Overview() {
  const { state, t } = useStore();
  const lang = state.lang;
  const now = new Date();
  const kpis = computeKpis(state.orders, state.products, now);
  const days = dailyRevenue(state.orders, now, 14);
  const reorder = state.products
    .filter((p) => isLowStock(p) || isSoldOut(p))
    .sort((a, b) => a.stockGrams / a.reorderGrams - b.stockGrams / b.reorderGrams);
  const top = [...state.products].sort((a, b) => b.sold30d - a.sold30d).slice(0, 5);
  const topMax = top[0]?.sold30d || 1;

  return (
    <div className="overview">
      <div className="kpis">
        <Kpi label={t('admin.revenue14')} value={formatMoney(kpis.revenueCents, lang)} />
        <Kpi label={t('admin.ordersCount')} value={formatNumber(kpis.orderCount, lang)} />
        <Kpi label={t('admin.aov')} value={formatMoney(kpis.averageCents, lang)} />
        <Kpi label={t('admin.openOrders')} value={formatNumber(kpis.openOrders, lang)} href={routeHref({ name: 'admin', tab: 'orders' })} />
        <Kpi
          label={t('admin.toReorder')}
          value={formatNumber(kpis.toReorder, lang)}
          tone={kpis.toReorder > 0 ? 'warn' : undefined}
          href={routeHref({ name: 'admin', tab: 'inventory' })}
        />
      </div>

      <div className="panel panel-chart">
        <RevenueChart data={days} lang={lang} title={t('admin.chartTitle')} ordersLabel={t('admin.orders').toLowerCase()} />
      </div>

      <div className="overview-split">
        <div className="panel">
          <h2 className="panel-title">{t('admin.lowStockTitle')}</h2>
          {reorder.length === 0 ? (
            <p className="muted">{t('admin.lowStockEmpty')}</p>
          ) : (
            <ul className="reorder-list">
              {reorder.map((p) => (
                <li key={p.id}>
                  <span className="reorder-name">
                    {p.name[lang]}
                    <span className="mono muted small">{p.sku}</span>
                  </span>
                  <StockPill product={p} />
                  <span className="tabular reorder-qty">
                    {formatKg(p.stockGrams, lang)} <span className="muted">/ {formatKg(p.reorderGrams, lang)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <h2 className="panel-title">{t('admin.topSellers')}</h2>
          <ol className="top-list">
            {top.map((p) => (
              <li key={p.id}>
                <span className="top-name">{p.name[lang]}</span>
                <span className="top-bar" aria-hidden="true">
                  <span style={{ width: `${(p.sold30d / topMax) * 100}%` }} />
                </span>
                <span className="tabular top-value">{p.sold30d}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone, href }: { label: string; value: string; tone?: 'warn'; href?: string }) {
  const content = (
    <>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
    </>
  );
  return href ? (
    <a className={`kpi kpi-link${tone ? ` kpi-${tone}` : ''}`} href={href}>
      {content}
    </a>
  ) : (
    <div className={`kpi${tone ? ` kpi-${tone}` : ''}`}>{content}</div>
  );
}

function StockPill({ product }: { product: Product }) {
  const { t } = useStore();
  if (isSoldOut(product)) return <span className="pill pill-cancelled"><span className="pill-dot" aria-hidden="true" />{t('admin.stock.out')}</span>;
  if (isLowStock(product)) return <span className="pill pill-warn"><span className="pill-dot" aria-hidden="true" />{t('admin.stock.low')}</span>;
  return <span className="pill pill-delivered"><span className="pill-dot" aria-hidden="true" />{t('admin.stock.ok')}</span>;
}

function OrdersTable() {
  const { state, dispatch, t, notify } = useStore();
  const lang = state.lang;
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: state.orders.length };
    for (const s of STATUSES) c[s] = state.orders.filter((o) => o.status === s).length;
    return c;
  }, [state.orders]);
  const rows = state.orders.filter((o) => filter === 'all' || o.status === filter);

  return (
    <div className="panel">
      <div className="chips" role="group" aria-label={t('admin.col.status')}>
        {(['all', ...STATUSES] as const).map((s) => (
          <button key={s} type="button" className={`chip${filter === s ? ' is-active' : ''}`} aria-pressed={filter === s} onClick={() => setFilter(s)}>
            {s === 'all' ? t('admin.filterAll') : t(STATUS_KEYS[s])}
            <span className="chip-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="muted">{t('admin.noOrders')}</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('admin.col.order')}</th>
                <th scope="col">{t('admin.col.date')}</th>
                <th scope="col">{t('admin.col.customer')}</th>
                <th scope="col">{t('admin.col.city')}</th>
                <th scope="col" className="num">{t('admin.col.total')}</th>
                <th scope="col">{t('admin.col.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span className="mono">{o.id}</span>
                    {o.sample && <span className="tag">{t('admin.sample')}</span>}
                  </td>
                  <td className="nowrap">{formatDate(o.createdAt, lang, true)}</td>
                  <td>
                    <span className="cell-strong">{o.customer.name}</span>
                    <span className="cell-sub">
                      {o.lines.map((l) => `${l.qty} × ${l.name[lang]} ${formatPack(l.grams, lang)}`).join(', ')}
                    </span>
                  </td>
                  <td className="nowrap">{lang === 'ru' ? CITY_NAMES_RU[o.customer.city] ?? o.customer.city : o.customer.city}</td>
                  <td className="num">{formatMoney(o.totalCents, lang)}</td>
                  <td>
                    {o.status === 'cancelled' ? (
                      <StatusPill status={o.status} />
                    ) : (
                      <>
                        <label htmlFor={`status-${o.id}`} className="visually-hidden">
                          {t('admin.col.status')} {o.id}
                        </label>
                        <select
                          id={`status-${o.id}`}
                          className={`select select-sm status-select status-${o.status}`}
                          value={o.status}
                          onChange={(e) => {
                            const status = e.target.value as OrderStatus;
                            dispatch({ type: 'setOrderStatus', id: o.id, status });
                            notify(t('admin.statusChanged', { id: o.id, status: t(STATUS_KEYS[status]) }));
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {t(STATUS_KEYS[s])}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Inventory() {
  const { state, dispatch, t, notify } = useStore();
  const lang = state.lang;
  const [query, setQuery] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const q = query.trim().toLowerCase();
  const rows = state.products
    .filter((p) => !q || p.sku.toLowerCase().includes(q) || p.name.en.toLowerCase().includes(q) || p.name.ru.toLowerCase().includes(q))
    .sort((a, b) => a.stockGrams / a.reorderGrams - b.stockGrams / b.reorderGrams);

  const receive = (p: Product) => {
    const kg = Number((amounts[p.id] ?? '').replace(',', '.'));
    if (!(kg > 0)) return;
    dispatch({ type: 'receiveStock', productId: p.id, grams: Math.round(kg * 1000) });
    setAmounts((a) => ({ ...a, [p.id]: '' }));
    notify(t('admin.received', { kg: formatKg(kg * 1000, lang), name: p.name[lang] }));
  };

  return (
    <div className="panel">
      <div className="inventory-head">
        <div className="search">
          <label htmlFor="inv-search" className="visually-hidden">
            {t('admin.searchInventory')}
          </label>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input id="inv-search" type="search" className="input" placeholder={t('admin.searchInventory')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <p className="inventory-value">
          <span className="muted small">{t('admin.inventoryValue')}</span>
          <strong className="tabular">{formatMoney(inventoryValueCents(state.products), lang)}</strong>
        </p>
      </div>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t('admin.col.product')}</th>
              <th scope="col">{t('admin.col.stock')}</th>
              <th scope="col">{t('admin.col.status')}</th>
              <th scope="col" className="num">{t('admin.col.price')}</th>
              <th scope="col" className="num">{t('admin.col.sold')}</th>
              <th scope="col">{t('admin.receive')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const scale = Math.max(p.reorderGrams * 3, p.stockGrams, 1);
              const pack = smallestPack(p);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="inv-product">
                      <span className="inv-thumb">
                        <ProductArt kind={p.art} hue={p.hue} />
                      </span>
                      <span>
                        <span className="cell-strong">{p.name[lang]}</span>
                        <span className="cell-sub mono">{p.sku}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="stock-cell">
                      <span className="tabular">{formatKg(p.stockGrams, lang)}</span>
                      <span className="stock-meter" aria-hidden="true">
                        <span className={`stock-fill${isSoldOut(p) ? ' is-out' : isLowStock(p) ? ' is-low' : ''}`} style={{ width: `${(p.stockGrams / scale) * 100}%` }} />
                        <span className="stock-mark" style={{ left: `${(p.reorderGrams / scale) * 100}%` }} />
                      </span>
                      <span className="cell-sub">
                        {t('admin.col.reorder')} {formatKg(p.reorderGrams, lang)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <StockPill product={p} />
                  </td>
                  <td className="num nowrap">
                    {formatMoney(pack.priceCents, lang)} <span className="muted">/ {formatPack(pack.grams, lang)}</span>
                  </td>
                  <td className="num">{p.sold30d}</td>
                  <td>
                    <form
                      className="receive-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        receive(p);
                      }}
                    >
                      <label htmlFor={`recv-${p.id}`} className="visually-hidden">
                        {t('admin.receiveKg')}: {p.name[lang]}
                      </label>
                      <input
                        id={`recv-${p.id}`}
                        className="input input-sm mono"
                        inputMode="decimal"
                        placeholder="kg"
                        value={amounts[p.id] ?? ''}
                        onChange={(e) => setAmounts((a) => ({ ...a, [p.id]: e.target.value }))}
                      />
                      <button type="submit" className="btn btn-secondary btn-sm" aria-label={`${t('admin.receiveSave')}: ${p.name[lang]}`}>
                        +
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
