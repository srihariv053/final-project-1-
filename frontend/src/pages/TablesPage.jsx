import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  UserCheck,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

export default function TablesPage({ setCurrentPage, setSelectedTableForOrder }) {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ number: '', capacity: 4, section: 'Main Dining', notes: '' });

  const [isAssignWaiterOpen, setIsAssignWaiterOpen] = useState(false);
  const [selectedTableForWaiter, setSelectedTableForWaiter] = useState(null);
  const [assignedWaiterId, setAssignedWaiterId] = useState('');

  const [deleteConfirmTable, setDeleteConfirmTable] = useState(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await api.getTables();
      setTables(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWaiters = async () => {
    try {
      const data = await api.getStaff({ role: 'waiter' });
      setWaiters(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchWaiters();
  }, []);

  const handleOpenAdd = () => {
    setEditingTable(null);
    setFormData({ number: `T-${(tables.length + 1).toString().padStart(2, '0')}`, capacity: 4, section: 'Main Dining', notes: '' });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (table) => {
    setEditingTable(table);
    setFormData({ number: table.number, capacity: table.capacity, section: table.section, notes: table.notes || '' });
    setIsAddEditOpen(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await api.updateTable(editingTable.id, formData);
        showToast(`Table ${formData.number} updated successfully`, 'success');
      } else {
        await api.createTable(formData);
        showToast(`Table ${formData.number} created successfully`, 'success');
      }
      setIsAddEditOpen(false);
      fetchTables();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteConfirmTable) return;
    try {
      await api.deleteTable(deleteConfirmTable.id);
      showToast(`Table ${deleteConfirmTable.number} deleted`, 'success');
      setDeleteConfirmTable(null);
      fetchTables();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await api.changeTableStatus(tableId, newStatus);
      showToast(`Table status changed to ${newStatus}`, 'success');
      fetchTables();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAssignWaiterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTableForWaiter) return;
    try {
      await api.assignWaiter(selectedTableForWaiter.id, assignedWaiterId ? parseInt(assignedWaiterId) : null);
      showToast(`Assigned waiter to Table ${selectedTableForWaiter.number}`, 'success');
      setIsAssignWaiterOpen(false);
      fetchTables();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenOrder = (table) => {
    if (setSelectedTableForOrder) {
      setSelectedTableForOrder(table);
    }
    setCurrentPage('orders');
  };

  const sections = ['All', 'Main Dining', 'Balcony', 'Rooftop Lounge', 'Private Dining Room'];
  const statuses = ['All', 'available', 'occupied', 'reserved', 'cleaning'];

  const filteredTables = tables.filter((t) => {
    const matchSection = sectionFilter === 'All' || t.section === sectionFilter;
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchSearch =
      t.number.toLowerCase().includes(search.toLowerCase()) ||
      t.section.toLowerCase().includes(search.toLowerCase()) ||
      (t.assigned_waiter_name && t.assigned_waiter_name.toLowerCase().includes(search.toLowerCase()));
    return matchSection && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Visual Table Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor floor occupancy, assign service staff, change states, and open table orders
          </p>
        </div>
        {hasRole('owner', 'manager') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Table</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table # or waiter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 ${
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

        {/* Section Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Section:</span>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSectionFilter(sec)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                sectionFilter === sec
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          let cardBorder = 'border-slate-200 hover:border-slate-300';
          let headerBg = 'bg-slate-50';

          if (table.status === 'occupied') {
            cardBorder = 'border-rose-200 hover:border-rose-300 bg-rose-50/10';
            headerBg = 'bg-rose-50/60';
          } else if (table.status === 'available') {
            cardBorder = 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/10';
            headerBg = 'bg-emerald-50/60';
          } else if (table.status === 'reserved') {
            cardBorder = 'border-amber-200 hover:border-amber-300 bg-amber-50/10';
            headerBg = 'bg-amber-50/60';
          } else if (table.status === 'cleaning') {
            cardBorder = 'border-sky-200 hover:border-sky-300 bg-sky-50/10';
            headerBg = 'bg-sky-50/60';
          }

          return (
            <div
              key={table.id}
              className={`rounded-2xl border bg-white shadow-2xs flex flex-col justify-between overflow-hidden transition-all duration-150 ${cardBorder}`}
            >
              {/* Card Top */}
              <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${headerBg}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center font-extrabold text-base text-slate-800">
                    {table.number}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{table.section}</span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{table.capacity} Seats</span>
                    </span>
                  </div>
                </div>
                <StatusBadge status={table.status} type="table" />
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2.5 text-xs flex-1">
                {/* Active Order if any */}
                {table.current_order_id ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Active Order:</span>
                      <span className="font-mono font-bold text-slate-900">{table.current_order_number}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Order Status:</span>
                      <StatusBadge status={table.current_order_status} />
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-slate-400 text-center italic text-[11px]">
                    No active bill on this table
                  </div>
                )}

                {/* Assigned Waiter */}
                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span className="text-slate-500">Assigned Waiter:</span>
                  <button
                    onClick={() => {
                      setSelectedTableForWaiter(table);
                      setAssignedWaiterId(table.assigned_waiter_id || '');
                      setIsAssignWaiterOpen(true);
                    }}
                    className="font-semibold text-slate-800 hover:text-emerald-600 flex items-center gap-1 underline underline-offset-2"
                  >
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    <span>{table.assigned_waiter_name || 'Assign Waiter'}</span>
                  </button>
                </div>

                {table.notes && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-1">"{table.notes}"</p>
                )}
              </div>

              {/* Status Change Dropdown & Action Buttons */}
              <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
                {/* Status selector */}
                <select
                  value={table.status}
                  onChange={(e) => handleStatusChange(table.id, e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="available">Set: Available</option>
                  <option value="occupied">Set: Occupied</option>
                  <option value="reserved">Set: Reserved</option>
                  <option value="cleaning">Set: Cleaning</option>
                </select>

                {/* Open order button */}
                <button
                  onClick={() => handleOpenOrder(table)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                  title="Open Order for Table"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Order</span>
                </button>

                {/* Edit/Delete for Manager/Owner */}
                {hasRole('owner', 'manager') && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(table)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Edit Table"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmTable(table)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
          No tables matched your filter criteria.
        </div>
      )}

      {/* Add / Edit Table Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingTable ? `Edit Table ${editingTable.number}` : 'Add New Restaurant Table'}
      >
        <form onSubmit={handleSaveTable} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Table Number *</label>
            <input
              type="text"
              required
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="e.g. T-16, VIP-01"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Seating Capacity</label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Section</label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Main Dining">Main Dining</option>
                <option value="Balcony">Balcony</option>
                <option value="Rooftop Lounge">Rooftop Lounge</option>
                <option value="Private Dining Room">Private Dining Room</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Location Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Window view, near bar, garden corner..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
            >
              {editingTable ? 'Update Table' : 'Create Table'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Waiter Modal */}
      <Modal
        isOpen={isAssignWaiterOpen}
        onClose={() => setIsAssignWaiterOpen(false)}
        title={`Assign Waiter to Table ${selectedTableForWaiter?.number}`}
      >
        <form onSubmit={handleAssignWaiterSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Select Waiter Staff</label>
            <select
              value={assignedWaiterId}
              onChange={(e) => setAssignedWaiterId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Unassigned --</option>
              {waiters.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name} ({w.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignWaiterOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
            >
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmTable}
        onClose={() => setDeleteConfirmTable(null)}
        title={`Delete Table ${deleteConfirmTable?.number}?`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to permanently remove <strong>Table {deleteConfirmTable?.number}</strong> from the floor plan?
            This operation cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setDeleteConfirmTable(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTable}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
