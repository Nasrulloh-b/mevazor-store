import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { Lang } from '../types';
import { makeT, type TFunction } from '../i18n';
import { initialState, reducer, type Action, type StoreState } from './reducer';

const STORAGE_KEY = 'mevazor-store:v1';

/** Reads saved state. Storage can be missing or blocked, so every access is guarded. */
function loadState(): StoreState {
  let savedLang: Lang = 'en';
  try {
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ru')) savedLang = 'ru';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      if (Array.isArray(parsed.products) && Array.isArray(parsed.orders) && Array.isArray(parsed.cart)) {
        return {
          products: parsed.products,
          orders: parsed.orders,
          cart: parsed.cart,
          promoCode: parsed.promoCode ?? null,
          lang: parsed.lang === 'ru' ? 'ru' : 'en',
        };
      }
    }
  } catch {
    // Fall through to fresh demo data.
  }
  return initialState(new Date(), savedLang);
}

function saveState(state: StoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private window, blocked site data). The store still works for this visit.
  }
}

export interface Toast {
  id: number;
  text: string;
}

interface StoreContextValue {
  state: StoreState;
  dispatch: (action: Action) => void;
  t: TFunction;
  toasts: Toast[];
  notify: (text: string) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const nextId = useRef(1);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.lang = state.lang;
  }, [state.lang]);

  const notify = useCallback((text: string) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3200);
  }, []);

  const t = useMemo(() => makeT(state.lang), [state.lang]);

  const value = useMemo(
    () => ({ state, dispatch, t, toasts, notify, cartOpen, setCartOpen }),
    [state, t, toasts, notify, cartOpen],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
