import type { Lang } from '../types';

const locale = (lang: Lang) => (lang === 'ru' ? 'ru-RU' : 'en-US');

export function formatMoney(cents: number, lang: Lang): string {
  return new Intl.NumberFormat(locale(lang), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Pack sizes: "250 g", "1 kg". */
export function formatPack(grams: number, lang: Lang): string {
  const g = lang === 'ru' ? 'г' : 'g';
  const kg = lang === 'ru' ? 'кг' : 'kg';
  if (grams >= 1000 && grams % 1000 === 0) return `${grams / 1000} ${kg}`;
  if (grams >= 1000) return `${formatNumber(grams / 1000, lang, 1)} ${kg}`;
  return `${grams} ${g}`;
}

/** Bulk stock levels, always in kilograms: "6.5 kg". */
export function formatKg(grams: number, lang: Lang): string {
  const kg = lang === 'ru' ? 'кг' : 'kg';
  const value = grams / 1000;
  const digits = Number.isInteger(value) ? 0 : 1;
  return `${formatNumber(value, lang, digits)} ${kg}`;
}

export function formatNumber(value: number, lang: Lang, digits = 0): string {
  return new Intl.NumberFormat(locale(lang), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDate(iso: string, lang: Lang, withTime = false): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale(lang), {
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(d);
}

/** Short weekday + day for chart axes: "12". */
export function formatDayOfMonth(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { day: 'numeric' }).format(date);
}
