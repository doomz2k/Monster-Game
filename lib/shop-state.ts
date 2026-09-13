import type { ProgressData } from './learning';
import { SHOP_ITEMS, buyItem } from './adventure';

export function shopAvailability(p: ProgressData, id: string) {
  const item = SHOP_ITEMS.find((item) => item.id === id);
  if (!item) return 'missing';
  if (item.kind !== 'seed' && p.adventure.inventory.includes(id))
    return 'owned';
  if (id === 'moonflower' && p.adventure.rounds.rocket < 3) return 'moon';
  if (item.kind === 'seed' && (p.adventure.seeds[id] ?? 0) >= 99) return 'full';
  return p.adventure.wallet >= item.price ? 'ready' : 'stars';
}
export function chooseWish(p: ProgressData, id: string | null): ProgressData {
  if (id === p.adventure.wish) return p;
  if (
    id !== null &&
    ['missing', 'owned', 'full'].includes(shopAvailability(p, id))
  )
    return p;
  return { ...p, adventure: { ...p.adventure, wish: id } };
}
/** One purchase per inspection prevents repeated confirm presses from spending twice. */
export class ShopPurchase {
  private bought = false;
  constructor(readonly id: string) {}
  commit(p: ProgressData): ProgressData {
    if (this.bought) return p;
    const next = buyItem(p, this.id);
    if (next !== p) this.bought = true;
    return next;
  }
}
