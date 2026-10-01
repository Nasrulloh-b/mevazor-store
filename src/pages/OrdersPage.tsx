import type { OrderStatus } from '../types';
import { useStore } from '../store/StoreContext';
import { formatDate, formatMoney, formatPack } from '../lib/format';
import { routeHref } from '../lib/router';
import { STATUS_KEYS } from '../i18n';
import { StatusPill } from '../components/StatusPill';

const STEPS: OrderStatus[] = ['new', 'packed', 'shipped', 'delivered'];

export function OrdersPage() {
  const { state, t } = useStore();
  const lang = state.lang;
  const mine = state.orders.filter((o) => !o.sample);

  return (
    <section className="page narrow">
      <h1 className="page-title">{t('orders.title')}</h1>
      {mine.length === 0 ? (
        <div className="empty-state">
          <p>{t('orders.empty')}</p>
          <a className="btn btn-primary" href={routeHref({ name: 'shop' })}>
            {t('confirm.shop')}
          </a>
        </div>
      ) : (
        <>
          <p className="muted small">{t('orders.tip')}</p>
          <ol className="order-list">
            {mine.map((order) => {
              const stepIndex = STEPS.indexOf(order.status);
              return (
                <li key={order.id} className="order-card">
                  <div className="order-head">
                    <div>
                      <p className="order-id mono">{order.id}</p>
                      <p className="muted small">{t('orders.placed', { date: formatDate(order.createdAt, lang, true) })}</p>
                    </div>
                    <StatusPill status={order.status} />
                  </div>

                  {order.status !== 'cancelled' && (
                    <ol className="tracker" aria-label={t('admin.col.status')}>
                      {STEPS.map((s, i) => (
                        <li key={s} className={i <= stepIndex ? 'is-done' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
                          <span className="tracker-dot" aria-hidden="true" />
                          <span className="tracker-label">{t(STATUS_KEYS[s])}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  <ul className="order-lines">
                    {order.lines.map((l) => (
                      <li key={`${l.productId}-${l.grams}`}>
                        <span>
                          {l.name[lang]} <span className="muted">· {l.qty} × {formatPack(l.grams, lang)}</span>
                        </span>
                        <span className="tabular">{formatMoney(l.unitCents * l.qty, lang)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="order-total">
                    <span>{t('cart.total')}</span>
                    <strong>{formatMoney(order.totalCents, lang)}</strong>
                  </p>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
