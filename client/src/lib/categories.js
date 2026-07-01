export const EXPENSE_CATEGORIES = [
  'Rent',
  'Groceries',
  'Utilities',
  'Subscriptions',
  'Debt payments',
  'Transportation',
  'Discretionary',
  'Other',
];

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Gift', 'Other'];

export function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    amount || 0
  );
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
