import { useCallback, useMemo, useState } from 'react';
import type { CategoryId, Product } from '../types';
import { useStore } from '../store/StoreContext';
import { CATEGORIES } from '../data/products';
import { isSoldOut, smallestPack, pricePerKgCents, FREE_DELIVERY_CENTS } from '../lib/pricing';
import { formatMoney } from '../lib/format';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { ProductArt, Rosette } from '../components/ProductArt';

type Sort = 'popular' | 'priceAsc' | 'priceDesc' | 'new';

export function ShopPage() {
  const { state, t, notify } = useStore();
  const lang = state.lang;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [sort, setSort] = useState<Sort>('popular');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (inStockOnly && isSoldOut(p)) return false;
      if (!q) return true;
      return [p.name.en, p.name.ru, p.origin.en, p.origin.ru, p.sku].some((s) => s.toLowerCase().includes(q));
    });
    const perKg = (p: Product) => pricePerKgCents(smallestPack(p));
    const sorters: Record<Sort, (a: Product, b: Product) => number> = {
      popular: (a, b) => b.sold30d - a.sold30d,
      priceAsc: (a, b) => perKg(a) - perKg(b),
      priceDesc: (a, b) => perKg(b) - perKg(a),
      new: (a, b) => Number(!!b.isNew) - Number(!!a.isNew) || b.sold30d - a.sold30d,
    };
    // Sold-out items always sink to the bottom so the first row is buyable.
    return [...list].sort((a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)) || sorters[sort](a, b));
  }, [state.products, query, category, sort, inStockOnly]);

  const openProduct = state.products.find((p) => p.id === openId);
  const featured = state.products.find((p) => p.id === 'isfara-apricots');
  const filtersActive = query !== '' || category !== 'all' || inStockOnly;
  const [promoBefore, promoAfter = ''] = t('hero.promo').split('{code}');
  const closeModal = useCallback(() => setOpenId(null), []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText('WELCOME10');
      notify(t('toast.copied', { code: 'WELCOME10' }));
    } catch {
      notify(t('toast.code', { code: 'WELCOME10' }));
    }
  };

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{t('hero.eyebrow')}</p>
          <h1 id="hero-title" className="hero-title">
            {t('hero.title')}
          </h1>
          <p className="hero-body">{t('hero.body', { amount: formatMoney(FREE_DELIVERY_CENTS, lang) })}</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-accent btn-lg" onClick={() => setOpenId('isfara-apricots')}>
              {t('hero.cta')}
            </button>
            <p className="hero-promo">
              {promoBefore}
              <button type="button" className="code-chip" onClick={copyCode} title="Copy">
                WELCOME10
              </button>
              {promoAfter}
            </p>
          </div>
        </div>
        {featured && (
          <div className="hero-art" aria-hidden="true">
            <Rosette className="hero-rosette" size={320} />
            <ProductArt kind={featured.art} hue={featured.hue} />
          </div>
        )}
      </section>

      <section className="catalog" aria-labelledby="catalog-title">
        <h2 id="catalog-title" className="visually-hidden">
          {t('nav.shop')}
        </h2>

        <div className="toolbar">
          <div className="search">
            <label htmlFor="shop-search" className="visually-hidden">
              {t('shop.search')}
            </label>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id="shop-search"
              type="search"
              className="input"
              placeholder={t('shop.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="toolbar-right">
            <label className="check">
              <input id="in-stock" type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              <span>{t('shop.inStock')}</span>
            </label>
            <label htmlFor="shop-sort" className="visually-hidden">
              {t('shop.sort')}
            </label>
            <select id="shop-sort" className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="popular">{t('shop.sort.popular')}</option>
              <option value="new">{t('shop.sort.new')}</option>
              <option value="priceAsc">{t('shop.sort.priceAsc')}</option>
              <option value="priceDesc">{t('shop.sort.priceDesc')}</option>
            </select>
          </div>
        </div>

        <div className="chips" role="tablist" aria-label={t('shop.sort')}>
          {[{ id: 'all' as const, name: { en: t('shop.all'), ru: t('shop.all') } }, ...CATEGORIES].map((c) => {
            const count = c.id === 'all' ? state.products.length : state.products.filter((p) => p.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                className={`chip${category === c.id ? ' is-active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.name[lang]}
                <span className="chip-count">{count}</span>
              </button>
            );
          })}
        </div>

        <p className="result-count">{t('shop.count', { n: visible.length })}</p>

        {visible.length === 0 ? (
          <div className="empty-state">
            <p>{t('shop.empty', { q: query })}</p>
            {filtersActive && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                  setInStockOnly(false);
                }}
              >
                {t('shop.clear')}
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={() => setOpenId(p.id)} />
            ))}
          </div>
        )}
      </section>

      {openProduct && <ProductModal product={openProduct} onClose={closeModal} />}
    </>
  );
}
