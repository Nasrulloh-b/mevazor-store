export type Lang = 'en' | 'ru';

/** A string available in every supported language. */
export type Localized = Record<Lang, string>;

export type CategoryId = 'dried-fruit' | 'nuts' | 'tea' | 'sweets' | 'spices';

/** Visual used for the product tile. */
export type ArtKind = 'apricot' | 'raisin' | 'fig' | 'mulberry' | 'almond' | 'walnut' | 'pistachio' | 'tea' | 'sweet' | 'spice';

export interface PackSize {
  /** Weight of one pack in grams. */
  grams: number;
  /** Price of one pack in USD cents. */
  priceCents: number;
}

export interface Product {
  id: string;
  sku: string;
  name: Localized;
  category: CategoryId;
  origin: Localized;
  description: Localized;
  notes: Localized;
  art: ArtKind;
  /** Hue (0–360) for the product tile. */
  hue: number;
  packs: PackSize[];
  /** Stock on hand in grams. Packs are cut from this bulk stock. */
  stockGrams: number;
  /** When stock falls to or below this level, the item is flagged for reordering. */
  reorderGrams: number;
  /** Sold in the last 30 days, used for "Popular" sorting. */
  sold30d: number;
  isNew?: boolean;
}

export interface CartLine {
  productId: string;
  grams: number;
  qty: number;
}

export type DeliveryMethod = 'courier' | 'pickup';
export type PaymentMethod = 'cash' | 'card-on-delivery';
export type OrderStatus = 'new' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderLine {
  productId: string;
  name: Localized;
  sku: string;
  grams: number;
  qty: number;
  unitCents: number;
}

export interface Customer {
  name: string;
  phone: string;
  city: string;
  address: string;
  comment: string;
}

export interface Order {
  id: string;
  createdAt: string;
  lines: OrderLine[];
  customer: Customer;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  promoCode: string | null;
  subtotalCents: number;
  discountCents: number;
  deliveryCents: number;
  totalCents: number;
  status: OrderStatus;
  /** True for the example orders seeded into the demo, false for orders placed in this browser. */
  sample: boolean;
}
