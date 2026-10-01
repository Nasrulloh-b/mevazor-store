import { useState } from 'react';
import type { Product } from '../types';
import { useStore } from '../store/StoreContext';
import { findPack, isLowStock, isSoldOut, pricePerKgCents, smallestPack } from '../lib/pricing';
import { formatKg, formatMoney } from '../lib/format';
import { ProductArt } from './ProductArt';
import { PackPicker } from './PackPicker';
import { useAddToCart } from './useAddToCart';

export function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const { state, t } = useStore();
  const lang = state.lang;
  const [grams, setGrams] = useState(smallestPack(product).grams);
  const add = useAddToCart();
  const pack = findPack(product, grams) ?? smallestPack(product);
  const soldOut = isSoldOut(product);
  const low = isLowStock(product);

  return (
    <article className={`product-card${soldOut ? ' is-sold-out' : ''}`}>
      <button type="button" className="card-art-button" onClick={onOpen} aria-label={`${t('product.details')}: ${product.name[lang]}`}>
        <ProductArt kind={product.art} hue={product.hue} />
        <span className="card-badges">
          {product.isNew && <span className="badge badge-new">{t('product.new')}</span>}
          {soldOut && <span className="badge badge-out">{t('product.soldOut')}</span>}
          {low && <span className="badge badge-low">{t('product.lowStock', { kg: formatKg(product.stockGrams, lang) })}</span>}
        </span>
      </button>

      <div className="card-body">
        <p className="card-origin">{product.origin[lang]}</p>
        <h3 className="card-title">
          <button type="button" className="link-button" onClick={onOpen}>
            {product.name[lang]}
          </button>
        </h3>
        <p className="card-notes">{product.notes[lang]}</p>

        <PackPicker
          packs={product.packs}
          value={grams}
          onChange={setGrams}
          lang={lang}
          name={`card-${product.id}`}
          label={t('product.pack')}
          disabledAbove={soldOut ? 0 : product.stockGrams}
        />

        <div className="card-buy">
          <div className="price-block">
            <span className="price">{formatMoney(pack.priceCents, lang)}</span>
            <span className="price-per-kg">{t('product.perKg', { price: formatMoney(pricePerKgCents(pack), lang) })}</span>
          </div>
          <button type="button" className="btn btn-primary" disabled={soldOut} onClick={() => add(product, grams, 1)}>
            {soldOut ? t('product.soldOut') : t('product.add')}
          </button>
        </div>
      </div>
    </article>
  );
}
