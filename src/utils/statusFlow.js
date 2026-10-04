export const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

export const ALL_STATUSES = [
  ...ORDER_STATUSES,
  'CANCELLED'
];

export function getNextStatus(currentStatus) {
  const currentIndex = ORDER_STATUSES.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex >= ORDER_STATUSES.length - 1) {
    return null;
  }
  return ORDER_STATUSES[currentIndex + 1];
}

export function canCancelOrder(currentStatus) {
  return currentStatus === 'PLACED' || currentStatus === 'CONFIRMED';
}
