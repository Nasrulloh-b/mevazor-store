import { useStore } from '../store/StoreContext';
import { routeHref, type Route } from '../lib/router';
import { Rosette } from './ProductArt';

export function Header({ route }: { route: Route }) {
  const { state, dispatch, t, setCartOpen } = useStore();
  const count = state.cart.reduce((sum, l) => sum + l.qty, 0);

  const link = (target: Route, label: string, active: boolean) => (
    <a href={routeHref(target)} className={`nav-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
      {label}
    </a>
  );

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#shop" aria-label="Mevazor, home">
          <Rosette className="brand-mark" size={34} />
          <span className="brand-text">
            <span className="brand-name">Mevazor</span>
            <span className="brand-tagline">{t('brand.tagline')}</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main">
          {link({ name: 'shop' }, t('nav.shop'), route.name === 'shop' || route.name === 'checkout')}
          {link({ name: 'orders' }, t('nav.orders'), route.name === 'orders')}
          {link({ name: 'admin', tab: 'overview' }, t('nav.admin'), route.name === 'admin')}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="lang-toggle"
            onClick={() => dispatch({ type: 'setLang', lang: state.lang === 'en' ? 'ru' : 'en' })}
            aria-label={t('nav.lang')}
          >
            <span className={state.lang === 'en' ? 'is-on' : ''}>EN</span>
            <span className={state.lang === 'ru' ? 'is-on' : ''}>RU</span>
          </button>
          <button type="button" className="cart-button" onClick={() => setCartOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M3 5h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
              <circle cx="17" cy="20" r="1.4" fill="currentColor" />
            </svg>
            <span className="cart-label">{t('nav.cart')}</span>
            <span className="cart-count" aria-live="polite">
              {count}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
