import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../types';
import type { DayBucket } from '../lib/stats';
import { niceTicks } from '../lib/stats';
import { formatDate, formatMoney } from '../lib/format';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(260, Math.floor(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Bar with a 4px rounded data end, square at the baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  if (h <= 0) return '';
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}

interface Props {
  data: DayBucket[];
  lang: Lang;
  title: string;
  ordersLabel: string;
}

export function RevenueChart({ data, lang, title, ordersLabel }: Props) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const height = 220;
  const pad = { top: 16, right: 8, bottom: 26, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const maxDollars = Math.max(...data.map((d) => d.revenueCents / 100), 1);
  const ticks = niceTicks(maxDollars, 4);
  const top = ticks[ticks.length - 1];
  const y = (dollars: number) => pad.top + plotH - (dollars / top) * plotH;
  const slot = plotW / data.length;
  const gap = 2;
  const barW = Math.max(4, Math.min(28, slot - gap));
  const labelEvery = slot < 26 ? 2 : 1;
  const last = data.length - 1;

  const activeDay = active !== null ? data[active] : null;
  const tipX = active !== null ? pad.left + slot * active + slot / 2 : 0;

  return (
    <figure className="chart">
      <figcaption className="chart-title">{title}</figcaption>
      <div ref={wrapRef} className="chart-wrap" onMouseLeave={() => setActive(null)}>
        <svg width={width} height={height} role="img" aria-label={title}>
          <g className="chart-grid">
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} />
                <text x={pad.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                  {formatMoney(tick * 100, lang).replace(/[.,]00(?=\D*$)/, '')}
                </text>
              </g>
            ))}
          </g>
          {data.map((d, i) => {
            const cx = pad.left + slot * i + slot / 2;
            const dollars = d.revenueCents / 100;
            const barH = pad.top + plotH - y(dollars);
            return (
              <g key={i}>
                <path
                  d={barPath(cx - barW / 2, y(dollars), barW, barH)}
                  className={`chart-bar${i === last ? ' is-today' : ''}${active === i ? ' is-active' : ''}`}
                />
                {i % labelEvery === (last % labelEvery) && (
                  <text className="chart-x" x={cx} y={height - 8} textAnchor="middle">
                    {d.date.getDate()}
                  </text>
                )}
                <rect
                  x={pad.left + slot * i}
                  y={pad.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${formatDate(d.date.toISOString(), lang)}: ${formatMoney(d.revenueCents, lang)}, ${d.orders} ${ordersLabel}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}
          <line className="chart-baseline" x1={pad.left} x2={width - pad.right} y1={pad.top + plotH} y2={pad.top + plotH} />
        </svg>
        {activeDay && (
          <div
            className="chart-tip"
            style={{ left: Math.min(Math.max(tipX, 70), width - 70), top: Math.max(y(activeDay.revenueCents / 100) - 12, 0) }}
            role="presentation"
          >
            <span className="chart-tip-date">{formatDate(activeDay.date.toISOString(), lang)}</span>
            <strong>{formatMoney(activeDay.revenueCents, lang)}</strong>
            <span className="muted">
              {activeDay.orders} {ordersLabel}
            </span>
          </div>
        )}
      </div>
      <table className="visually-hidden">
        <caption>{title}</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th scope="row">{formatDate(d.date.toISOString(), lang)}</th>
              <td>{formatMoney(d.revenueCents, lang)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
