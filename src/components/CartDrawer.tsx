import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { computeTotals, findPack, FREE_DELIVERY_CENTS, maxQtyForLine, normalizePromo } from '../lib/pricing';
import { formatMoney, formatPack } from '../lib/format';
import { navigate } from '../lib/router';
import { ProductArt } from './ProductArt';
import { QtyStepper } from './QtyStepper';

export function CartDrawer() {
  const { state, dispatch, t, cartOpen, setCartOpen } = useStore();
  const lang = state.lang;
  const [code, setCode] = useState('');
  const [promoError, setPromoError] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const totals = computeTotals(state.cart, state.products, state.promoCode);

  useEffect(() => {
    if (!cartOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      previous?.focus?.();
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  const progress = Math.min(1, (totals.subtotalCents - totals.discountCents) / FREE_DELIVERY_CENTS);

  return (
    <div className="overlay overlay-right" onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer-head">
          <h2 id="cart-title" className="drawer-title">
            {t('cart.title')}
          </h2>
          <button ref={closeRef} type="button" className="icon-button" onClick={() => setCartOpen(false)} aria-label={t('product.close')}>
            ×
          </button>
        </div>

        {state.cart.length === 0 ? (
          <div className="drawer-empty">
            <p>{t('cart.empty')}</p>
            <button type="button" className="btn btn-secondary" onClick={() => setCartOpen(false)}>
              {t('cart.continue')}
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-lines">
              {state.cart.map((line) => {
                const product = state.products.find((p) => p.id === line.productId);
                const pack = product && findPack(product, line.grams);
                if (!product || !pack) return null;
                const max = maxQtyForLine(product, state.cart, line.grams);
                return (
                  <li key={`${line.productId}-${line.grams}`} className="cart-line">
                    <div className="cart-thumb">
                      <ProductArt kind={product.art} hue={product.hue} />
                    </div>
                    <div className="cart-line-main">
                      <p className="cart-line-name">{product.name[lang]}</p>
                      <p className="cart-line-meta">
                        {formatPack(line.grams, lang)} · {formatMoney(pack.priceCents, lang)}
                      </p>
                      <div className="cart-line-actions">
                        <QtyStepper
                          value={line.qty}
                          max={Math.max(line.qty, max)}
                          min={1}
                          label={`${t('product.qty')}: ${product.name[lang]}`}
                          onChange={(qty) => dispatch({ type: 'setQty', productId: line.productId, grams: line.grams, qty })}
                        />
                        <button
                          type="button"
                          className="link-button link-muted"
                          onClick={() => dispatch({ type: 'removeLine', productId: line.productId, grams: line.grams })}
                        >
                          {t('cart.remove')}
                        </button>
                      </div>
                    </div>
                    <p className="cart-line-total">{formatMoney(pack.priceCents * line.qty, lang)}</p>
                  </li>
                );
              })}
            </ul>

            <div className="drawer-foot">
              <div className="free-delivery">
                <p>
                  {totals.freeDeliveryLeftCents > 0
                    ? t('cart.freeLeft', { amount: formatMoney(totals.freeDeliveryLeftCents, lang) })
                    : t('cart.freeReached')}
                </p>
                <div className="meter" aria-hidden="true">
                  <span style={{ width: `${progress * 100}%` }} />
                </div>
              </div>

              {state.promoCode ? (
                <p className="promo-applied">
                  {t('cart.promoApplied', { code: state.promoCode })}{' '}
                  <button type="button" className="link-button" onClick={() => dispatch({ type: 'clearPromo' })}>
                    {t('cart.promoRemove')}
                  </button>
                </p>
              ) : (
                <form
                  className="promo-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (normalizePromo(code)) {
                      dispatch({ type: 'applyPromo', code });
                      setPromoError(false);
                      setCode('');
                    } else {
                      setPromoError(true);
                    }
                  }}
                >
                  <label htmlFor="promo-code" className="field-label">
                    {t('cart.promo')}
                  </label>
                  <div className="promo-row">
                    <input
                      id="promo-code"
                      className="input mono"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setPromoError(false);
                      }}
                      placeholder="WELCOME10"
                      autoComplete="off"
                      aria-invalid={promoError}
                      aria-describedby={promoError ? 'promo-error' : undefined}
                    />
                    <button type="submit" className="btn btn-secondary">
                      {t('cart.apply')}
                    </button>
                  </div>
                  {promoError && (
                    <p id="promo-error" className="form-error">
                      {t('cart.promoInvalid')}
                    </p>
                  )}
                </form>
              )}

              <dl className="totals">
                <div>
                  <dt>{t('cart.subtotal')}</dt>
                  <dd>{formatMoney(totals.subtotalCents, lang)}</dd>
                </div>
                {totals.discountCents > 0 && (
                  <div>
                    <dt>{t('cart.discount')}</dt>
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

              <button
                type="button"
                className="btn btn-primary btn-lg btn-block"
                onClick={() => {
                  setCartOpen(false);
                  navigate({ name: 'checkout' });
                }}
              >
                {t('cart.checkout')}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
