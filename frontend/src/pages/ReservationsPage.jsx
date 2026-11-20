import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Trash2,
  Utensils
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

export default function ReservationsPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    table_id: '',
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '19:30',
    guest_count: 2,
    notes: ''
  });

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const [resData, tblData, custData] = await Promise.all([
        api.getReservations({ date: dateFilter, status: statusFilter }),
        api.getTables(),
        api.getCustomers()
      ]);
      setReservations(resData);
      setTables(tblData);
      setCustomers(custData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [dateFilter, statusFilter]);

  const handleOpenAdd = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      customer_phone: '',
      table_id: tables[0]?.id || '',
      reservation_date: new Date().toISOString().split('T')[0],
      reservation_time: '19:30',
      guest_count: 2,
      notes: ''
    });
    setIsAddOpen(true);
  };

  const handleSelectCustomer = (e) => {
    const custId = e.target.value;
    if (!custId) {
      setFormData(prev => ({ ...prev, customer_id: '', customer_name: '', customer_phone: '' }));
      return;
    }
    const cust = customers.find(c => c.id === parseInt(custId));
    if (cust) {
      setFormData(prev => ({
        ...prev,
        customer_id: cust.id,
        customer_name: cust.name,
        customer_phone: cust.phone
      }));
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        table_id: parseInt(formData.table_id),
        guest_count: parseInt(formData.guest_count) || 2
      };

      await api.createReservation(payload);
      showToast(`Reservation confirmed for Table #${tables.find(t => t.id === payload.table_id)?.number}!`, 'success');
      setIsAddOpen(false);
      fetchReservations();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (resId, newStatus) => {
    try {
      await api.updateReservationStatus(resId, newStatus);
      showToast(`Reservation moved to ${newStatus.toUpperCase()}`, 'success');
      fetchReservations();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (resId) => {
    try {
      await api.deleteReservation(resId);
      showToast('Reservation deleted', 'success');
      fetchReservations();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredReservations = reservations.filter(r =>
    r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    r.customer_phone.includes(search) ||
    (r.table_number && r.table_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Table Reservation System</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage table bookings, prevent double-bookings, accommodate guests, and track seating
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guest or table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Date filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-xs text-emerald-600 hover:underline font-bold"
                >
                  Clear Date
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {['all', 'confirmed', 'seated', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Table Reserved</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3 text-center">Party Size</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{res.customer_name}</td>
                  <td className="py-3 px-3 text-slate-600">{res.customer_phone}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold">
                      Table {res.table_number || res.table_id}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    <div className="font-semibold">{res.reservation_date}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{res.reservation_time}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-slate-800">
                    {res.guest_count} guests
                  </td>
                  <td className="py-3 px-3 text-slate-500 max-w-[180px] truncate italic">
                    {res.notes || '--'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={res.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {res.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(res.id, 'seated')}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] transition-colors"
                          title="Seat Guests (Marks table occupied)"
                        >
                          Seat Guests
                        </button>
                      )}

                      {res.status === 'seated' && (
                        <button
                          onClick={() => handleStatusChange(res.id, 'completed')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors"
                        >
                          Completed
                        </button>
                      )}

                      {['confirmed', 'pending'].includes(res.status) && (
                        <button
                          onClick={() => handleStatusChange(res.id, 'cancelled')}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Cancel Reservation"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(res.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">No reservations found.</div>
        )}
      </div>

      {/* Add Reservation Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Table Reservation"
        subtitle="Double-booking prevention automatically protects table schedules"
      >
        <form onSubmit={handleCreateReservation} className="space-y-4 text-xs">
          {/* Pick existing customer or enter guest info */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pick Existing Customer (Optional)</label>
            <select
              onChange={handleSelectCustomer}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
            >
              <option value="">-- Or enter guest name & phone below --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Guest Name *</label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="e.g. Jennifer Davis"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="+1 555-0144"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.reservation_date}
                onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Time Slot *</label>
              <input
                type="time"
                required
                value={formData.reservation_time}
                onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Party Size (Guests)</label>
              <input
                type="number"
                min="1"
                max="25"
                required
                value={formData.guest_count}
                onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-center"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Table *</label>
            <select
              required
              value={formData.table_id}
              onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.number} ({t.section} • {t.capacity} seats) - Current State: [{t.status.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reservation Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Birthday dinner, high chair needed, anniversary champagne..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
