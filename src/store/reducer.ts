import type {
  CartLine,
  Customer,
  DeliveryMethod,
  Lang,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
} from '../types';
import { SEED_PRODUCTS } from '../data/products';
import { makeSampleOrders } from '../data/sampleOrders';
import { computeTotals, findPack, maxAddable, maxQtyForLine, normalizePromo } from '../lib/pricing';

export interface StoreState {
  products: Product[];
  cart: CartLine[];
  orders: Order[];
  promoCode: string | null;
  lang: Lang;
}

export type Action =
  | { type: 'addToCart'; productId: string; grams: number; qty: number }
  | { type: 'setQty'; productId: string; grams: number; qty: number }
  | { type: 'removeLine'; productId: string; grams: number }
  | { type: 'applyPromo'; code: string }
  | { type: 'clearPromo' }
  | { type: 'placeOrder'; order: Order }
  | { type: 'setOrderStatus'; id: string; status: OrderStatus }
  | { type: 'receiveStock'; productId: string; grams: number }
  | { type: 'setLang'; lang: Lang }
  | { type: 'reset'; now?: Date };

export function initialState(now: Date = new Date(), lang: Lang = 'en'): StoreState {
  const products = structuredClone(SEED_PRODUCTS);
  return {
    products,
    cart: [],
    orders: makeSampleOrders(products, now),
    promoCode: null,
    lang,
  };
}

const sameLine = (l: CartLine, productId: string, grams: number) =>
  l.productId === productId && l.grams === grams;

export function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'addToCart': {
      const product = state.products.find((p) => p.id === action.productId);
      if (!product || !findPack(product, action.grams)) return state;
      const qty = Math.min(action.qty, maxAddable(product, state.cart, action.grams));
      if (qty <= 0) return state;
      const existing = state.cart.find((l) => sameLine(l, action.productId, action.grams));
      const cart = existing
        ? state.cart.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l))
        : [...state.cart, { productId: action.productId, grams: action.grams, qty }];
      return { ...state, cart };
    }

    case 'setQty': {
      const product = state.products.find((p) => p.id === action.productId);
      if (!product) return state;
      const qty = Math.min(Math.max(0, Math.floor(action.qty)), maxQtyForLine(product, state.cart, action.grams));
      const cart =
        qty === 0
          ? state.cart.filter((l) => !sameLine(l, action.productId, action.grams))
          : state.cart.map((l) => (sameLine(l, action.productId, action.grams) ? { ...l, qty } : l));
      return { ...state, cart };
    }

    case 'removeLine':
      return { ...state, cart: state.cart.filter((l) => !sameLine(l, action.productId, action.grams)) };

    case 'applyPromo': {
      const code = normalizePromo(action.code);
      return code ? { ...state, promoCode: code } : state;
    }

    case 'clearPromo':
      return { ...state, promoCode: null };

    case 'placeOrder': {
      // Deduct stock for every line; the order was validated by buildOrder before dispatch.
      const products = state.products.map((p) => {
        const used = action.order.lines
          .filter((l) => l.productId === p.id)
          .reduce((sum, l) => sum + l.grams * l.qty, 0);
        const packs = action.order.lines.filter((l) => l.productId === p.id).reduce((s, l) => s + l.qty, 0);
        return used ? { ...p, stockGrams: p.stockGrams - used, sold30d: p.sold30d + packs } : p;
      });
      return { ...state, products, cart: [], promoCode: null, orders: [action.order, ...state.orders] };
    }

    case 'setOrderStatus': {
      const order = state.orders.find((o) => o.id === action.id);
      if (!order || order.status === action.status || order.status === 'cancelled') return state;
      let products = state.products;
      // Cancelling a real (non-sample) order puts its goods back on the shelf.
      if (action.status === 'cancelled' && !order.sample) {
        products = state.products.map((p) => {
          const back = order.lines
            .filter((l) => l.productId === p.id)
            .reduce((sum, l) => sum + l.grams * l.qty, 0);
          return back ? { ...p, stockGrams: p.stockGrams + back } : p;
        });
      }
      return {
        ...state,
        products,
        orders: state.orders.map((o) => (o.id === action.id ? { ...o, status: action.status } : o)),
      };
    }

    case 'receiveStock': {
      if (!(action.grams > 0)) return state;
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.productId ? { ...p, stockGrams: p.stockGrams + Math.round(action.grams) } : p,
        ),
      };
    }

    case 'setLang':
      return { ...state, lang: action.lang };

    case 'reset':
      return initialState(action.now, state.lang);

    default:
      return state;
  }
}

export interface OrderInput {
  customer: Customer;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  now?: Date;
}

export type BuildResult =
  | { ok: true; order: Order }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'stock'; productId: string; availableGrams: number };

/** Turns the current cart into an order, checking that every line is still in stock. */
export function buildOrder(state: StoreState, input: OrderInput): BuildResult {
  if (state.cart.length === 0) return { ok: false, reason: 'empty' };

  for (const product of state.products) {
    const needed = state.cart
      .filter((l) => l.productId === product.id)
      .reduce((sum, l) => sum + l.grams * l.qty, 0);
    if (needed > product.stockGrams) {
      return { ok: false, reason: 'stock', productId: product.id, availableGrams: product.stockGrams };
    }
  }

  const lines = state.cart.flatMap((l) => {
    const product = state.products.find((p) => p.id === l.productId);
    const pack = product && findPack(product, l.grams);
    return product && pack
      ? [{ productId: product.id, name: product.name, sku: product.sku, grams: l.grams, qty: l.qty, unitCents: pack.priceCents }]
      : [];
  });

  const totals = computeTotals(state.cart, state.products, state.promoCode, input.delivery);
  const lastNumber = state.orders.reduce((max, o) => Math.max(max, Number(o.id.replace(/\D/g, '')) || 0), 1000);

  return {
    ok: true,
    order: {
      id: `MZ-${lastNumber + 1}`,
      createdAt: (input.now ?? new Date()).toISOString(),
      lines,
      customer: {
        name: input.customer.name.trim(),
        phone: input.customer.phone.trim(),
        city: input.customer.city,
        address: input.delivery === 'pickup' ? '' : input.customer.address.trim(),
        comment: input.customer.comment.trim(),
      },
      delivery: input.delivery,
      payment: input.payment,
      promoCode: state.promoCode,
      subtotalCents: totals.subtotalCents,
      discountCents: totals.discountCents,
      deliveryCents: totals.deliveryCents,
      totalCents: totals.totalCents,
      status: 'new',
      sample: false,
    },
  };
}
