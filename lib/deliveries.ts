import type { ProgressData } from './learning';
import { placeFor, type PlaceId } from './adventure';
import { customerForTicket, type PizzaParcel } from './delivery-state';

export function deliveryOffer(p: ProgressData): PizzaParcel | null {
  const ticket = p.adventure.rounds.meadow;
  return !p.adventure.deliveries.parcel &&
    ticket > p.adventure.deliveries.lastCompleted
    ? { ticket, recipient: customerForTicket(ticket) }
    : null;
}
export function acceptDelivery(p: ProgressData, ticket: number): ProgressData {
  const parcel = deliveryOffer(p);
  if (!parcel || parcel.ticket !== ticket) return p;
  return {
    ...p,
    adventure: {
      ...p.adventure,
      deliveries: { ...p.adventure.deliveries, parcel },
    },
  };
}
export function finishDelivery(
  p: ProgressData,
  recipient: PlaceId,
  x: number,
  z: number,
): ProgressData {
  const { parcel } = p.adventure.deliveries;
  if (
    !parcel ||
    parcel.recipient !== recipient ||
    p.adventure.region !== 'island' ||
    !Number.isFinite(x) ||
    !Number.isFinite(z)
  )
    return p;
  const friend = placeFor(recipient);
  if (Math.hypot(friend.x - x, friend.z - z) > 4.2) return p;
  return {
    ...p,
    adventure: {
      ...p.adventure,
      wallet: p.adventure.wallet + 1,
      earned: p.adventure.earned + 1,
      deliveries: {
        parcel: null,
        lastCompleted: parcel.ticket,
        completed: p.adventure.deliveries.completed + 1,
      },
    },
  };
}
