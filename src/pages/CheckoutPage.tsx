import { useRef, useState, type FormEvent } from 'react';
import type { Customer, DeliveryMethod, Order, PaymentMethod } from '../types';
import { useStore } from '../store/StoreContext';
import { buildOrder } from '../store/reducer';
import { COURIER_FEE_CENTS, computeTotals, findPack, isValidPhone } from '../lib/pricing';
import { formatKg, formatMoney, formatPack } from '../lib/format';
import { routeHref } from '../lib/router';
import { CITIES, CITY_NAMES_RU } from '../data/products';
import { ProductArt, Rosette } from '../components/ProductArt';
import type { MessageKey } from '../i18n';

type Errors = Partial<Record<'name' | 'phone' | 'city' | 'address', MessageKey>>;

export function CheckoutPage() {
  const { state, dispatch, t } = useStore();
  const lang = state.lang;
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', city: 'Khujand', address: '', comment: '' });
  const [delivery, setDelivery] = useState<DeliveryMethod>('courier');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [errors, setErrors] = useState<Errors>({});
  const [stockError, setStockError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const cityName = (c: string) => (lang === 'ru' ? CITY_NAMES_RU[c] ?? c : c);
  const update = (field: keyof Customer, value: string) => {
    setCustomer((c) => ({ ...c, [field]: value }));
    if (errors[field as keyof Errors]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  if (placed) return <Confirmation order={placed} />;

  if (state.cart.length === 0) {
    return (
      <section className="page narrow">
        <h1 className="page-title">{t('checkout.title')}</h1>
        <div className="empty-state">
          <p>{t('checkout.emptyCart')}</p>
          <a className="btn btn-primary" href={routeHref({ name: 'shop' })}>
            {t('checkout.back')}
          </a>
        </div>
      </section>
    );
  }

  const totals = computeTotals(state.cart, state.products, state.promoCode, delivery);

  const validate = (): Errors => {
    const e: Errors = {};
    if (customer.name.trim().length < 2) e.name = 'err.name';
    if (!isValidPhone(customer.phone)) e.phone = 'err.phone';
    if (!customer.city) e.city = 'err.city';
    if (delivery === 'courier' && customer.address.trim().length < 4) e.address = 'err.address';
    return e;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    const firstInvalid = (['name', 'phone', 'city', 'address'] as const).find((k) => found[k]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#co-${firstInvalid}`)?.focus();
      return;
    }
    const result = buildOrder(state, { customer, delivery, payment });
    if (!result.ok) {
      if (result.reason === 'stock') {
        const product = state.products.find((p) => p.id === result.productId);
        setStockError(t('checkout.stockChanged', { name: product?.name[lang] ?? '', kg: formatKg(result.availableGrams, lang) }));
      }
      return;
    }
    dispatch({ type: 'placeOrder', order: result.order });
    setPlaced(result.order);
    window.scrollTo({ top: 0 });
  };

  const fieldError = (key: keyof Errors) =>
    errors[key] ? (
      <p id={`co-${key}-error`} className="form-error">
        {t(errors[key]!)}
      </p>
    ) : null;

  const a11y = (key: keyof Errors) => ({
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `co-${key}-error` : undefined,
  });

  return (
    <section className="page checkout">
      <a className="back-link" href={routeHref({ name: 'shop' })}>
        ← {t('checkout.back')}
      </a>
      <h1 className="page-title">{t('checkout.title')}</h1>

      <div className="checkout-grid">
        <form ref={formRef} className="checkout-form" onSubmit={submit} noValidate>
          <fieldset className="form-section">
            <legend>{t('checkout.contact')}</legend>
            <div className="field">
              <label htmlFor="co-name" className="field-label">
                {t('checkout.name')}
              </label>
              <input id="co-name" className="input" autoComplete="name" value={customer.name} onChange={(e) => update('name', e.target.value)} {...a11y('name')} />
              {fieldError('name')}
            </div>
            <div className="field">
              <label htmlFor="co-phone" className="field-label">
                {t('checkout.phone')}
              </label>
              <input
                id="co-phone"
                className="input mono"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+992 92 123 4567"
                value={customer.phone}
                onChange={(e) => update('phone', e.target.value)}
                {...a11y('phone')}
              />
              {fieldError('phone') ?? <p className="field-hint">{t('checkout.phoneHint')}</p>}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>{t('checkout.delivery')}</legend>
            <div className="option-cards">
              <label className={`option-card${delivery === 'courier' ? ' is-selected' : ''}`} htmlFor="co-courier">
                <input id="co-courier" type="radio" name="delivery" checked={delivery === 'courier'} onChange={() => setDelivery('courier')} />
                <span className="option-title">{t('checkout.courier')}</span>
                <span className="option-note">{t('checkout.courierNote', { fee: formatMoney(COURIER_FEE_CENTS, lang) })}</span>
              </label>
              <label className={`option-card${delivery === 'pickup' ? ' is-selected' : ''}`} htmlFor="co-pickup">
                <input id="co-pickup" type="radio" name="delivery" checked={delivery === 'pickup'} onChange={() => setDelivery('pickup')} />
                <span className="option-title">{t('checkout.pickup')}</span>
                <span className="option-note">{t('checkout.pickupNote')}</span>
              </label>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="co-city" className="field-label">
                  {t('checkout.city')}
                </label>
                <select id="co-city" className="select" value={customer.city} onChange={(e) => update('city', e.target.value)} {...a11y('city')}>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {cityName(c)}
                    </option>
                  ))}
                </select>
                {fieldError('city')}
              </div>
              {delivery === 'courier' && (
                <div className="field field-grow">
                  <label htmlFor="co-address" className="field-label">
                    {t('checkout.address')}
                  </label>
                  <input
                    id="co-address"
                    className="input"
                    autoComplete="street-address"
                    value={customer.address}
                    onChange={(e) => update('address', e.target.value)}
                    {...a11y('address')}
                  />
                  {fieldError('address')}
                </div>
              )}
            </div>
            <div className="field">
              <label htmlFor="co-comment" className="field-label">
                {t('checkout.comment')}
              </label>
              <textarea id="co-comment" className="input" rows={2} value={customer.comment} onChange={(e) => update('comment', e.target.value)} />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>{t('checkout.payment')}</legend>
            <div className="option-cards">
              <label className={`option-card${payment === 'cash' ? ' is-selected' : ''}`} htmlFor="co-cash">
                <input id="co-cash" type="radio" name="payment" checked={payment === 'cash'} onChange={() => setPayment('cash')} />
                <span className="option-title">{t('checkout.cash')}</span>
              </label>
              <label className={`option-card${payment === 'card-on-delivery' ? ' is-selected' : ''}`} htmlFor="co-card">
                <input id="co-card" type="radio" name="payment" checked={payment === 'card-on-delivery'} onChange={() => setPayment('card-on-delivery')} />
                <span className="option-title">{t('checkout.card')}</span>
                <span className="option-note">{t('checkout.cardNote')}</span>
              </label>
            </div>
          </fieldset>

          <p className="demo-note">{t('checkout.demoNote')}</p>
          {stockError && (
            <p className="form-error" role="alert">
              {stockError}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-lg btn-block">
            {t('checkout.place', { total: formatMoney(totals.totalCents, lang) })}
          </button>
        </form>

        <aside className="summary" aria-labelledby="summary-title">
          <h2 id="summary-title" className="summary-title">
            {t('checkout.summary')}
          </h2>
          <ul className="summary-lines">
            {state.cart.map((line) => {
              const product = state.products.find((p) => p.id === line.productId);
              const pack = product && findPack(product, line.grams);
              if (!product || !pack) return null;
              return (
                <li key={`${line.productId}-${line.grams}`}>
                  <div className="summary-thumb">
                    <ProductArt kind={product.art} hue={product.hue} />
                  </div>
                  <div className="summary-name">
                    <span>{product.name[lang]}</span>
                    <span className="muted">
                      {line.qty} × {formatPack(line.grams, lang)}
                    </span>
                  </div>
                  <span className="summary-price">{formatMoney(pack.priceCents * line.qty, lang)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="totals">
            <div>
              <dt>{t('cart.subtotal')}</dt>
              <dd>{formatMoney(totals.subtotalCents, lang)}</dd>
            </div>
            {totals.discountCents > 0 && (
              <div>
                <dt>
                  {t('cart.discount')} <span className="mono muted">{state.promoCode}</span>
                </dt>
                <dd>−{formatMoney(totals.discountCents, lang)}</dd>
              </div>
            )}
            <div>
              <dt>{t('cart.delivery')}</dt>
              <dd>{totals.deliveryCents === 0 ? t('cart.free') : formatMoney(totals.deliveryCents, lang)}</dd>
            </div>
            <div className="totals-grand">
              <dt>{t('cart.total')}</dt>
              <dd>{formatMoney(totals.totalCents, lang)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}

function Confirmation({ order }: { order: Order }) {
  const { state, t } = useStore();
  const lang = state.lang;
  const body =
    order.delivery === 'pickup'
      ? t('confirm.pickupBody', { name: order.customer.name })
      : t('confirm.body', { name: order.customer.name, phone: order.customer.phone });

  return (
    <section className="page narrow confirmation" aria-live="polite">
      <Rosette className="confirm-rosette" size={72} />
      <h1 className="page-title">{t('confirm.title', { id: order.id })}</h1>
      <p className="lead">{body}</p>
      <ul className="summary-lines confirm-lines">
        {order.lines.map((l) => (
          <li key={`${l.productId}-${l.grams}`}>
            <div className="summary-name">
              <span>{l.name[lang]}</span>
              <span className="muted">
                {l.qty} × {formatPack(l.grams, lang)}
              </span>
            </div>
            <span className="summary-price">{formatMoney(l.unitCents * l.qty, lang)}</span>
          </li>
        ))}
      </ul>
      <p className="confirm-total">
        <span>{t('cart.total')}</span>
        <strong>{formatMoney(order.totalCents, lang)}</strong>
      </p>
      <div className="confirm-actions">
        <a className="btn btn-primary" href={routeHref({ name: 'orders' })}>
          {t('confirm.track')}
        </a>
        <a className="btn btn-secondary" href={routeHref({ name: 'shop' })}>
          {t('confirm.shop')}
        </a>
      </div>
    </section>
  );
}
