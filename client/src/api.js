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
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getCategories: () => request('/categories'),
  addCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transactions${query ? `?${query}` : ''}`);
  },
  getTransactionSummary: (userId, months = 6) =>
    request(`/transactions/summary?user_id=${userId}&months=${months}`),
  getTransaction: (id) => request(`/transactions/${id}`),
  addTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  getJointAccount: () => request('/joint-account'),
  updateJointAccount: (data) => request('/joint-account', { method: 'PATCH', body: JSON.stringify(data) }),

  getContributions: () => request('/contributions'),
  addContribution: (data) => request('/contributions', { method: 'POST', body: JSON.stringify(data) }),
  deleteContribution: (id) => request(`/contributions/${id}`, { method: 'DELETE' }),

  getGoals: () => request('/goals'),
  addGoal: (data) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id, data) => request(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),
};
