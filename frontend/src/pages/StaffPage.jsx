import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  CreditCard,
  UtensilsCrossed,
  ChefHat,
  Phone,
  Mail,
  Check,
  X,
  Edit2,
  Lock,
  Power
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import RoleBadge from '../components/RoleBadge';

export default function StaffPage() {
  const { user: currentUser, hasRole } = useAuth();
  const { showToast } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'waiter'
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await api.getStaff({ role: roleFilter });
      setStaffList(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      username: '',
      password: 'password123',
      full_name: '',
      email: '',
      phone: '',
      role: 'waiter'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      username: staff.username,
      password: '',
      full_name: staff.full_name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.updateStaff(editingStaff.id, formData);
        showToast(`Staff account for ${formData.full_name} updated`, 'success');
      } else {
        await api.createStaff(formData);
        showToast(`Staff account for ${formData.full_name} created successfully`, 'success');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      const updated = await api.toggleStaffStatus(staff.id);
      showToast(
        `${updated.full_name} is now ${updated.status.toUpperCase()}`,
        updated.status === 'active' ? 'success' : 'warning'
      );
      fetchStaff();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredStaff = staffList.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const permissionMatrix = [
    { module: 'Dashboard & Live Analytics', owner: true, manager: true, cashier: true, waiter: true, kitchen: true },
    { module: 'Table Status & Waiter Assignment', owner: true, manager: true, cashier: true, waiter: true, kitchen: false },
    { module: 'Menu Management & Pricing', owner: true, manager: true, cashier: false, waiter: false, kitchen: false },
    { module: 'Point of Sale & Order Placement', owner: true, manager: true, cashier: true, waiter: true, kitchen: false },
    { module: 'Kitchen Display System (KDS)', owner: true, manager: true, cashier: false, waiter: true, kitchen: true },
    { module: 'Inventory Stock & Recipe Linking', owner: true, manager: true, cashier: false, waiter: false, kitchen: true },
    { module: 'Supplier POs & Restock Orders', owner: true, manager: true, cashier: false, waiter: false, kitchen: false },
    { module: 'Customer Profiles & History', owner: true, manager: true, cashier: true, waiter: true, kitchen: false },
    { module: 'Reservations & Booking Conflict Control', owner: true, manager: true, cashier: true, waiter: true, kitchen: false },
    { module: 'Billing & Invoice Settlement', owner: true, manager: true, cashier: true, waiter: false, kitchen: false },
    { module: 'Staff Activation & Management', owner: true, manager: true, cashier: false, waiter: false, kitchen: false },
    { module: 'Reports, P&L & Category Analytics', owner: true, manager: true, cashier: false, waiter: false, kitchen: false },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Staff Team & Role-Based Access</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee accounts, assign job permissions, and toggle access status
          </p>
        </div>
        {hasRole('owner', 'manager') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by staff name, username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {['all', 'owner', 'manager', 'cashier', 'waiter', 'kitchen'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors shrink-0 ${
                  roleFilter === r
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'kitchen' ? 'Kitchen Staff' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => {
          const isSelf = currentUser?.id === staff.id;
          const isActive = staff.status === 'active';

          return (
            <div
              key={staff.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 font-extrabold text-slate-700 flex items-center justify-center text-sm border border-slate-200">
                      {staff.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{staff.full_name}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">@{staff.username}</span>
                    </div>
                  </div>
                  <RoleBadge role={staff.role} size="sm" />
                </div>

                {/* Contact details */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  {staff.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{staff.phone}</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  Joined: {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'Active Member'}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {staff.status}
                </span>

                {hasRole('owner', 'manager') && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(staff)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                      title="Edit Staff Member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!isSelf && (
                      <button
                        onClick={() => handleToggleStatus(staff)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isActive
                            ? 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
          No staff members found matching filter criteria.
        </div>
      )}

      {/* Role Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
          <p className="text-xs text-slate-500">Overview of operational permissions enforced across user roles</p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">System Module</th>
                <th className="py-2.5 px-2 text-center text-amber-700">Owner</th>
                <th className="py-2.5 px-2 text-center text-indigo-700">Manager</th>
                <th className="py-2.5 px-2 text-center text-emerald-700">Cashier</th>
                <th className="py-2.5 px-2 text-center text-blue-700">Waiter</th>
                <th className="py-2.5 px-2 text-center text-rose-700">Kitchen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionMatrix.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-semibold text-slate-800">{p.module}</td>
                  <td className="py-2 px-2 text-center">{p.owner ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2 px-2 text-center">{p.manager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2 px-2 text-center">{p.cashier ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2 px-2 text-center">{p.waiter ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="py-2 px-2 text-center">{p.kitchen ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? `Edit Staff Member: ${editingStaff.full_name}` : 'Add New Staff Member'}
      >
        <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Elena Rossi"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold capitalize text-slate-800"
              >
                <option value="owner">Restaurant Owner</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="waiter">Waiter</option>
                <option value="kitchen">Kitchen Staff</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                required
                disabled={!!editingStaff}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. elena"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {editingStaff ? 'Reset Password (Optional)' : 'Password *'}
              </label>
              <input
                type="password"
                required={!editingStaff}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingStaff ? 'Leave blank to keep' : 'password123'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="elena@dineflow.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0188"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
            >
              {editingStaff ? 'Save Changes' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
