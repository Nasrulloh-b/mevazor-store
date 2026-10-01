import { StoreProvider, useStore } from './store/StoreContext';
import { useRoute } from './lib/router';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { Toasts } from './components/Toasts';
import { ShopPage } from './pages/ShopPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminPage } from './pages/AdminPage';

function Layout() {
  const route = useRoute();
  const { t } = useStore();

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header route={route} />
      <main id="main" className="main" tabIndex={-1}>
        {route.name === 'shop' && <ShopPage />}
        {route.name === 'checkout' && <CheckoutPage />}
        {route.name === 'orders' && <OrdersPage />}
        {route.name === 'admin' && <AdminPage tab={route.tab} />}
      </main>
      <footer className="site-footer">
        <p>{t('footer.demo')}</p>
        <p className="muted">{t('footer.stack')}</p>
      </footer>
      <CartDrawer />
      <Toasts />
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Layout />
    </StoreProvider>
  );
}
