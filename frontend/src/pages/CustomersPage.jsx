import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ShoppingBag,
  Award,
  History,
  Edit2,
  FileText
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

export default function CustomersPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });

  // Order History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone,
      email: cust.email || '',
      notes: cust.notes || ''
    });
    setIsAddEditOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
        showToast(`Customer "${formData.name}" updated`, 'success');
      } else {
        await api.createCustomer(formData);
        showToast(`Customer "${formData.name}" added`, 'success');
      }
      setIsAddEditOpen(false);
      fetchCustomers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenHistory = async (cust) => {
    setHistoryCustomer(cust);
    setIsHistoryOpen(true);
    try {
      const orders = await api.getCustomerOrders(cust.id);
      setCustomerOrders(orders);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customer Database & Loyalty</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Profiles, dining preferences, total spend tracking, and past order history
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-center">Total Orders</th>
                <th className="py-3 px-3 text-right">Lifetime Spend</th>
                <th className="py-3 px-3">Last Visit</th>
                <th className="py-3 px-3">Dining Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const isVip = (cust.total_spent || 0) > 100;
                return (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name with VIP tag */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cust.name}</span>
                        {isVip && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold flex items-center gap-0.5">
                            <Award className="w-2.5 h-2.5" />
                            <span>VIP</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone & Email */}
                    <td className="py-3 px-3 text-slate-600">
                      <div>{cust.phone}</div>
                      {cust.email && <div className="text-[11px] text-slate-400">{cust.email}</div>}
                    </td>

                    {/* Total orders */}
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {cust.total_orders || 0} visits
                    </td>

                    {/* Lifetime Spend */}
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-700">
                      ₹{cust.total_spent?.toFixed(2) || '0.00'}
                    </td>

                    {/* Last visit */}
                    <td className="py-3 px-3 text-slate-500">
                      {cust.last_visit ? new Date(cust.last_visit).toLocaleDateString() : 'First visit'}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate italic">
                      {cust.notes || '--'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHistory(cust)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          title="View Past Orders"
                        >
                          <History className="w-3 h-3" />
                          <span>Orders</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">No customers found.</div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Register New Customer'}
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0199"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@domain.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Customer Preferences & Dining Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Vegetarian, anniversary regular, prefers balcony seating..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
            >
              {editingCustomer ? 'Update Profile' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Order History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Order History: ${historyCustomer?.name}`}
        subtitle={`Lifetime Spending: ₹${historyCustomer?.total_spent?.toFixed(2)}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Table</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{ord.order_number}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {ord.order_time ? new Date(ord.order_time).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{ord.table_number || 'Takeaway'}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">
                      {ord.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                      ₹{ord.final_amount?.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={ord.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customerOrders.length === 0 && (
            <p className="p-8 text-center text-slate-400">No past orders recorded for this customer yet.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
