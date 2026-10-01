import { useEffect, useRef, useState } from 'react';
import type { Product } from '../types';
import { useStore } from '../store/StoreContext';
import { findPack, isSoldOut, maxAddable, pricePerKgCents, smallestPack } from '../lib/pricing';
import { formatKg, formatMoney } from '../lib/format';
import { CATEGORIES } from '../data/products';
import { ProductArt } from './ProductArt';
import { PackPicker } from './PackPicker';
import { QtyStepper } from './QtyStepper';
import { useAddToCart } from './useAddToCart';

export function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { state, t } = useStore();
  const lang = state.lang;
  const [grams, setGrams] = useState(smallestPack(product).grams);
  const [qty, setQty] = useState(1);
  const add = useAddToCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const pack = findPack(product, grams) ?? smallestPack(product);
  const max = maxAddable(product, state.cart, grams);
  const soldOut = isSoldOut(product);
  const category = CATEGORIES.find((c) => c.id === product.category);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, max || 1)));
  }, [max]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <button ref={closeRef} type="button" className="icon-button modal-close" onClick={onClose} aria-label={t('product.close')}>
          ×
        </button>
        <div className="modal-art">
          <ProductArt kind={product.art} hue={product.hue} label={product.name[lang]} />
        </div>
        <div className="modal-body">
          <p className="eyebrow">{category?.name[lang]}</p>
          <h2 id="product-modal-title" className="modal-title">
            {product.name[lang]}
          </h2>
          <p className="modal-desc">{product.description[lang]}</p>

          <dl className="facts">
            <div>
              <dt>{t('product.origin')}</dt>
              <dd>{product.origin[lang]}</dd>
            </div>
            <div>
              <dt>{t('product.notes')}</dt>
              <dd>{product.notes[lang]}</dd>
            </div>
            <div>
              <dt>SKU</dt>
              <dd className="mono">{product.sku}</dd>
            </div>
          </dl>

          <div className="modal-controls">
            <div className="field">
              <span className="field-label">{t('product.pack')}</span>
              <PackPicker
                packs={product.packs}
                value={grams}
                onChange={setGrams}
                lang={lang}
                name={`modal-${product.id}`}
                label={t('product.pack')}
                disabledAbove={soldOut ? 0 : product.stockGrams}
              />
            </div>
            <div className="field">
              <span className="field-label">{t('product.qty')}</span>
              <QtyStepper id="modal-qty" value={qty} max={Math.max(1, max)} onChange={setQty} label={t('product.qty')} />
            </div>
          </div>

          <div className="modal-buy">
            <div className="price-block">
              <span className="price price-lg">{formatMoney(pack.priceCents * qty, lang)}</span>
              <span className="price-per-kg">{t('product.perKg', { price: formatMoney(pricePerKgCents(pack), lang) })}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={soldOut || max === 0}
              onClick={() => {
                if (add(product, grams, qty)) onClose();
              }}
            >
              {soldOut ? t('product.soldOut') : t('product.add')}
            </button>
          </div>
          {!soldOut && max === 0 && (
            <p className="form-error" role="status">
              {t('product.notEnough', { kg: formatKg(product.stockGrams, lang) })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
