const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function getAuthHeader() {
  const token = localStorage.getItem('dineflow_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),
  getDemoUsers: () => request('/auth/demo-users'),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Tables
  getTables: () => request('/tables'),
  createTable: (data) => request('/tables', { method: 'POST', body: JSON.stringify(data) }),
  updateTable: (id, data) => request(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTable: (id) => request(`/tables/${id}`, { method: 'DELETE' }),
  changeTableStatus: (id, status) => request(`/tables/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  assignWaiter: (id, waiter_id) => request(`/tables/${id}/assign-waiter`, { method: 'POST', body: JSON.stringify({ waiter_id }) }),

  // Menu
  getMenu: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/menu${qs ? '?' + qs : ''}`);
  },
  getCategories: () => request('/menu/categories'),
  createMenuItem: (data) => request('/menu', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: 'DELETE' }),
  toggleMenuAvailability: (id) => request(`/menu/${id}/toggle-availability`, { method: 'POST' }),

  // Orders
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/orders${qs ? '?' + qs : ''}`);
  },
  getOrderDetail: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  addItemsToOrder: (id, items) => request(`/orders/${id}/add-items`, { method: 'POST', body: JSON.stringify({ items }) }),

  // Kitchen Display
  getKitchenOrders: () => request('/kitchen/orders'),
  updateKitchenStatus: (id, status) => request(`/kitchen/orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),

  // Billing
  getBills: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/billing/bills${qs ? '?' + qs : ''}`);
  },
  getPendingBillingOrders: () => request('/billing/orders-pending'),
  getBillDetail: (id) => request(`/billing/bills/${id}`),
  generateBill: (data) => request('/billing/generate', { method: 'POST', body: JSON.stringify(data) }),
  processPayment: (id, data) => request(`/billing/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),

  // Inventory
  getInventory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/inventory${qs ? '?' + qs : ''}`);
  },
  getLowStock: () => request('/inventory/low-stock'),
  getInventoryCategories: () => request('/inventory/categories'),
  createInventoryItem: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateInventoryItem: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventoryItem: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),
  restockItem: (id, data) => request(`/inventory/${id}/restock`, { method: 'POST', body: JSON.stringify(data) }),
  recordUsage: (id, data) => request(`/inventory/${id}/usage`, { method: 'POST', body: JSON.stringify(data) }),
  getStockMovements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/inventory/movements${qs ? '?' + qs : ''}`);
  },

  // Suppliers
  getSuppliers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/suppliers${qs ? '?' + qs : ''}`);
  },
  getSupplierDetail: (id) => request(`/suppliers/${id}`),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
  getSupplierPurchases: (id) => request(`/suppliers/${id}/purchases`),
  createPurchase: (data) => request('/suppliers/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/customers${qs ? '?' + qs : ''}`);
  },
  getCustomerDetail: (id) => request(`/customers/${id}`),
  getCustomerOrders: (id) => request(`/customers/${id}/orders`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Reservations
  getReservations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reservations${qs ? '?' + qs : ''}`);
  },
  createReservation: (data) => request('/reservations', { method: 'POST', body: JSON.stringify(data) }),
  updateReservationStatus: (id, status) => request(`/reservations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteReservation: (id) => request(`/reservations/${id}`, { method: 'DELETE' }),

  // Staff
  getStaff: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/staff${qs ? '?' + qs : ''}`);
  },
  createStaff: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id, data) => request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleStaffStatus: (id) => request(`/staff/${id}/toggle-status`, { method: 'POST' }),

  // Reports
  getAnalytics: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports/analytics${qs ? '?' + qs : ''}`);
  },

  // Notifications
  getNotifications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/notifications${qs ? '?' + qs : ''}`);
  },
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  resetDemoData: () => request('/settings/reset-demo', { method: 'POST' }),
};
