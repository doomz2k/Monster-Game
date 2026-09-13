import type { ProgressData } from './learning';
import type { QuestId } from './adventure';

export const FRIEND_GIFTS: Record<QuestId, string> = {
  meadow: 'sofa',
  woods: 'books',
  cove: 'birdbath',
  garden: 'mushroom',
  rocket: 'lamp',
  moon: 'lantern',
};
export const FRIEND_LEVELS = [1, 3, 6, 10] as const;
export const friendshipLevel = (helped: number) =>
  FRIEND_LEVELS.filter((n) => helped >= n).length;
export function canClaimFriendGift(p: ProgressData, id: QuestId) {
  return (
    p.adventure.rounds[id] >= 3 && !p.adventure.friendshipGifts.includes(id)
  );
}
export function claimFriendGift(p: ProgressData, id: QuestId): ProgressData {
  if (!canClaimFriendGift(p, id)) return p;
  const gift = FRIEND_GIFTS[id],
    owned = p.adventure.inventory.includes(gift);
  return {
    ...p,
    adventure: {
      ...p.adventure,
      wish: p.adventure.wish === gift ? null : p.adventure.wish,
      friendshipGifts: [...p.adventure.friendshipGifts, id],
      inventory: owned
        ? p.adventure.inventory
        : [...p.adventure.inventory, gift],
      wallet: p.adventure.wallet + (owned ? 2 : 0),
      earned: p.adventure.earned + (owned ? 2 : 0),
    },
  };
}
