import { useEffect, useState } from 'react';

export type Route =
  | { name: 'shop' }
  | { name: 'checkout' }
  | { name: 'orders' }
  | { name: 'admin'; tab: 'overview' | 'orders' | 'inventory' };

/** Plain hash tokens (#shop, #admin-orders) so links work anywhere, including embedded previews. */
export function parseHash(hash: string): Route {
  const token = hash.replace(/^#/, '');
  switch (token) {
    case 'checkout':
      return { name: 'checkout' };
    case 'orders':
      return { name: 'orders' };
    case 'admin':
    case 'admin-overview':
      return { name: 'admin', tab: 'overview' };
    case 'admin-orders':
      return { name: 'admin', tab: 'orders' };
    case 'admin-inventory':
      return { name: 'admin', tab: 'inventory' };
    default:
      return { name: 'shop' };
  }
}

export function routeHref(route: Route): string {
  if (route.name === 'admin') return route.tab === 'overview' ? '#admin' : `#admin-${route.tab}`;
  return `#${route.name}`;
}

export function navigate(route: Route) {
  const href = routeHref(route);
  if (window.location.hash !== href) window.location.hash = href;
  window.scrollTo({ top: 0 });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
