const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getUsers: () => request('/users'),
  createUser: (data) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getTransactions: (userId, month) =>
    request(`/transactions?user_id=${userId}${month ? `&month=${month}` : ''}`),
  getSummary: (userId, month) =>
    request(`/transactions/summary/${userId}${month ? `?month=${month}` : ''}`),
  getTrend: (userId, months) =>
    request(`/transactions/trend/${userId}${months ? `?months=${months}` : ''}`),
  createTransaction: (data) =>
    request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) =>
    request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  getJointAccount: () => request('/joint'),
  updateJointAccount: (balance) =>
    request('/joint', { method: 'PUT', body: JSON.stringify({ balance }) }),
  getContributions: () => request('/joint/contributions'),
  createContribution: (data) =>
    request('/joint/contributions', { method: 'POST', body: JSON.stringify(data) }),

  getGoals: () => request('/goals'),
  createGoal: (data) =>
    request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id, data) =>
    request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  getCategories: () => request('/categories'),
  createCategory: (data) =>
    request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};
