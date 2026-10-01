import type { Lang, PackSize } from '../types';
import { formatPack } from '../lib/format';

interface Props {
  packs: PackSize[];
  value: number;
  onChange: (grams: number) => void;
  lang: Lang;
  name: string;
  label: string;
  disabledAbove?: number;
}

/** Segmented control for choosing a pack weight. */
export function PackPicker({ packs, value, onChange, lang, name, label, disabledAbove }: Props) {
  if (packs.length === 1) {
    return <span className="pack-single">{formatPack(packs[0].grams, lang)}</span>;
  }
  return (
    <div className="pack-picker" role="radiogroup" aria-label={label}>
      {packs.map((pack) => {
        const id = `${name}-${pack.grams}`;
        const disabled = disabledAbove !== undefined && pack.grams > disabledAbove;
        return (
          <label key={pack.grams} htmlFor={id} className={`pack-option${disabled ? ' is-disabled' : ''}`}>
            <input
              id={id}
              type="radio"
              name={name}
              value={pack.grams}
              checked={value === pack.grams}
              disabled={disabled}
              onChange={() => onChange(pack.grams)}
            />
            <span>{formatPack(pack.grams, lang)}</span>
          </label>
        );
      })}
    </div>
  );
}
