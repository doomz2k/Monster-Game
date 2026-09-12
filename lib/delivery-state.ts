/** The order cycle is shared by recipes and their optional delivery tickets. */
export const PIZZA_CUSTOMERS = ['woods', 'garden', 'cove', 'rocket'] as const;
export type PizzaCustomer = (typeof PIZZA_CUSTOMERS)[number];
export type PizzaParcel = { ticket: number; recipient: PizzaCustomer };
export type DeliveryProgress = {
  parcel: PizzaParcel | null;
  lastCompleted: number;
  completed: number;
};
export const freshDeliveries = (): DeliveryProgress => ({
  parcel: null,
  lastCompleted: 0,
  completed: 0,
});
export const customerForTicket = (ticket: number): PizzaCustomer =>
  PIZZA_CUSTOMERS[(ticket - 1) % PIZZA_CUSTOMERS.length];
export function readDeliveries(raw: unknown, cooked: number): DeliveryProgress {
  const result = freshDeliveries();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  const v = raw as Record<string, unknown>;
  const count = (n: unknown, max: number) =>
    typeof n === 'number' && Number.isSafeInteger(n) && n >= 0
      ? Math.min(n, max)
      : 0;
  result.lastCompleted = count(v.lastCompleted, cooked);
  result.completed = count(v.completed, result.lastCompleted);
  if (v.parcel && typeof v.parcel === 'object') {
    const parcel = v.parcel as Record<string, unknown>;
    const ticket = count(parcel.ticket, cooked);
    if (
      ticket === parcel.ticket &&
      ticket > result.lastCompleted &&
      parcel.recipient === customerForTicket(ticket)
    )
      result.parcel = { ticket, recipient: customerForTicket(ticket) };
  }
  return result;
}
