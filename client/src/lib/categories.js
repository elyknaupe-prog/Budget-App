export function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    amount || 0
  );
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
