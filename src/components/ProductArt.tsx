import type { ArtKind } from '../types';

/** Eight-petal rosette, the recurring motif on Rishtan ceramics from the Fergana Valley. */
export function Rosette({ className, size = 120 }: { className?: string; size?: number }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg className={className} width={size} height={size} viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle r="54" />
        <circle r="46" strokeDasharray="3 6" />
        {petals.map((a) => (
          <path key={a} d="M0 -8 C 12 -18, 12 -34, 0 -42 C -12 -34, -12 -18, 0 -8 Z" transform={`rotate(${a})`} />
        ))}
        <circle r="6" />
      </g>
    </svg>
  );
}

function Shape({ kind }: { kind: ArtKind }) {
  switch (kind) {
    case 'apricot':
      return (
        <g>
          <ellipse cx="46" cy="66" rx="26" ry="22" fill="var(--art-dark)" transform="rotate(-18 46 66)" />
          <ellipse cx="72" cy="58" rx="27" ry="23" fill="var(--art-main)" transform="rotate(12 72 58)" />
          <path d="M60 44 C 70 52, 72 64, 66 76" stroke="var(--art-dark)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="80" cy="50" rx="7" ry="4" fill="var(--art-light)" transform="rotate(20 80 50)" />
        </g>
      );
    case 'raisin':
      return (
        <g>
          {[
            [44, 52, -20],
            [66, 46, 15],
            [86, 60, 40],
            [54, 74, 10],
            [76, 80, -30],
            [34, 76, 60],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(${r} ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx="12" ry="9" fill={i % 2 ? 'var(--art-dark)' : 'var(--art-main)'} />
              <path d={`M${x - 6} ${y - 2} q6 5 12 0`} stroke="var(--art-light)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    case 'fig':
      return (
        <g>
          <path d="M60 22 C 64 30, 90 46, 88 72 C 86 92, 70 100, 60 100 C 50 100, 34 92, 32 72 C 30 46, 56 30, 60 22 Z" fill="var(--art-main)" />
          <path d="M60 22 C 58 16, 62 12, 66 12" stroke="var(--art-dark)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M50 58 C 46 70, 48 84, 56 92" stroke="var(--art-light)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="68" cy="70" r="2.4" fill="var(--art-light)" />
          <circle cx="74" cy="80" r="2.4" fill="var(--art-light)" />
          <circle cx="64" cy="84" r="2.4" fill="var(--art-light)" />
        </g>
      );
    case 'mulberry':
      return (
        <g>
          {[0, 1].map((b) => {
            const bx = b ? 72 : 46;
            const by = b ? 58 : 66;
            return (
              <g key={b} transform={`rotate(${b ? 20 : -25} ${bx} ${by})`}>
                {Array.from({ length: 9 }, (_, i) => (
                  <circle key={i} cx={bx + ((i % 3) - 1) * 8} cy={by + (Math.floor(i / 3) - 1) * 10} r="6.5" fill={b ? 'var(--art-main)' : 'var(--art-dark)'} />
                ))}
                <path d={`M${bx} ${by - 16} l0 -12`} stroke="var(--art-dark)" strokeWidth="3" strokeLinecap="round" />
              </g>
            );
          })}
        </g>
      );
    case 'almond':
      return (
        <g>
          {[
            [44, 64, -30],
            [70, 52, 20],
            [72, 82, 70],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(${r} ${x} ${y})`}>
              <path d={`M${x} ${y - 22} C ${x + 16} ${y - 8}, ${x + 14} ${y + 16}, ${x} ${y + 20} C ${x - 14} ${y + 16}, ${x - 16} ${y - 8}, ${x} ${y - 22} Z`} fill={i === 1 ? 'var(--art-main)' : 'var(--art-dark)'} />
              <path d={`M${x - 3} ${y - 12} C ${x - 6} ${y}, ${x - 5} ${y + 8}, ${x - 1} ${y + 14}`} stroke="var(--art-light)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    case 'walnut':
      return (
        <g>
          <ellipse cx="60" cy="62" rx="34" ry="30" fill="var(--art-main)" />
          <path d="M60 32 L60 92" stroke="var(--art-dark)" strokeWidth="3" />
          <path d="M44 42 C 36 52, 50 58, 40 66 C 32 74, 46 80, 42 88" stroke="var(--art-dark)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M76 42 C 84 52, 70 58, 80 66 C 88 74, 74 80, 78 88" stroke="var(--art-dark)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M50 38 C 54 44, 52 50, 56 52" stroke="var(--art-light)" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'pistachio':
      return (
        <g>
          {[
            [48, 62, -30],
            [74, 60, 25],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(${r} ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx="16" ry="24" fill="hsl(38 45% 78%)" />
              <path d={`M${x} ${y - 20} C ${x + 10} ${y - 4}, ${x + 8} ${y + 10}, ${x} ${y + 20}`} fill="var(--art-main)" />
              <ellipse cx={x - 6} cy={y - 6} rx="3" ry="6" fill="hsl(38 60% 90%)" />
            </g>
          ))}
        </g>
      );
    case 'tea':
      return (
        <g>
          <path d="M34 86 C 30 56, 50 30, 86 26 C 88 60, 68 84, 34 86 Z" fill="var(--art-main)" />
          <path d="M34 86 C 50 66, 64 50, 80 32" stroke="var(--art-light)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M52 92 C 58 74, 74 64, 96 66 C 90 82, 74 94, 52 92 Z" fill="var(--art-dark)" />
          <path d="M52 92 C 66 82, 78 74, 92 68" stroke="var(--art-light)" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'sweet':
      return (
        <g>
          {[
            [46, 66, 0.9],
            [70, 52, 1.1],
            [76, 82, 0.7],
          ].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              <path d="M0 -24 L16 -6 L10 20 L-10 20 L-16 -6 Z" fill={i === 1 ? 'var(--art-main)' : 'var(--art-dark)'} />
              <path d="M0 -24 L-4 -2 L-16 -6 M-4 -2 L-10 20 M-4 -2 L16 -6" stroke="var(--art-light)" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
            </g>
          ))}
        </g>
      );
    case 'spice':
      return (
        <g>
          {Array.from({ length: 14 }, (_, i) => {
            const angle = (i * 137.5 * Math.PI) / 180;
            const radius = 8 + 3.2 * Math.sqrt(i) * 3;
            const x = 60 + Math.cos(angle) * radius;
            const y = 62 + Math.sin(angle) * radius * 0.8;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="7"
                ry="3.2"
                transform={`rotate(${(i * 53) % 180} ${x} ${y})`}
                fill={i % 3 === 0 ? 'var(--art-light)' : i % 2 ? 'var(--art-dark)' : 'var(--art-main)'}
              />
            );
          })}
        </g>
      );
  }
}

export function ProductArt({ kind, hue, label }: { kind: ArtKind; hue: number; label?: string }) {
  return (
    <div className="art" style={{ ['--h' as string]: hue }} role={label ? 'img' : undefined} aria-label={label}>
      <Rosette className="art-rosette" />
      <svg className="art-shape" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <Shape kind={kind} />
      </svg>
    </div>
  );
}
