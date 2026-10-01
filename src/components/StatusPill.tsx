import type { OrderStatus } from '../types';
import { useStore } from '../store/StoreContext';
import { STATUS_KEYS } from '../i18n';

export function StatusPill({ status }: { status: OrderStatus }) {
  const { t } = useStore();
  return (
    <span className={`pill pill-${status}`}>
      <span className="pill-dot" aria-hidden="true" />
      {t(STATUS_KEYS[status])}
    </span>
  );
}
