import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  FileText,
  DollarSign,
  Edit2,
  Trash2,
  Eye,
  PlusCircle
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function SuppliersPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    supplied_items: '',
    notes: ''
  });

  // Purchase Order / Restock Modal
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [purchaseSupplier, setPurchaseSupplier] = useState(null);
  const [purchaseItems, setPurchaseItems] = useState([{ inventory_item_id: '', quantity: 10, unit_cost: 2.0 }]);
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Purchase History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySupplier, setHistorySupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);

  const [deleteConfirmSupplier, setDeleteConfirmSupplier] = useState(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const [sups, inv] = await Promise.all([
        api.getSuppliers(),
        api.getInventory()
      ]);
      setSuppliers(sups);
      setInventoryItems(inv);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      supplied_items: '',
      notes: ''
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      contact_person: sup.contact_person || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      supplied_items: sup.supplied_items || '',
      notes: sup.notes || ''
    });
    setIsAddEditOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, formData);
        showToast(`Updated "${formData.name}" successfully`, 'success');
      } else {
        await api.createSupplier(formData);
        showToast(`Created supplier "${formData.name}"`, 'success');
      }
      setIsAddEditOpen(false);
      fetchSuppliers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteConfirmSupplier) return;
    try {
      await api.deleteSupplier(deleteConfirmSupplier.id);
      showToast(`Supplier "${deleteConfirmSupplier.name}" deleted`, 'success');
      setDeleteConfirmSupplier(null);
      fetchSuppliers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenPurchase = (sup) => {
    setPurchaseSupplier(sup);
    // Auto-select first matching inventory item if possible
    const firstItem = inventoryItems.find(i => i.supplier_id === sup.id) || inventoryItems[0];
    setPurchaseItems([
      {
        inventory_item_id: firstItem ? firstItem.id : '',
        quantity: 10,
        unit_cost: firstItem ? firstItem.cost_per_unit : 2.0
      }
    ]);
    setPurchaseNotes(`Restock order from ${sup.name}`);
    setIsPurchaseOpen(true);
  };

  const handleAddPurchaseLine = () => {
    setPurchaseItems(prev => [
      ...prev,
      { inventory_item_id: inventoryItems[0]?.id || '', quantity: 5, unit_cost: 2.0 }
    ]);
  };

  const handleRemovePurchaseLine = (idx) => {
    setPurchaseItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePurchaseLineChange = (idx, field, val) => {
    setPurchaseItems(prev => {
      const copy = [...prev];
      if (field === 'inventory_item_id') {
        const item = inventoryItems.find(i => i.id === parseInt(val));
        copy[idx].inventory_item_id = parseInt(val);
        if (item) copy[idx].unit_cost = item.cost_per_unit;
      } else {
        copy[idx][field] = parseFloat(val) || 0;
      }
      return copy;
    });
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseSupplier || purchaseItems.length === 0) return;
    try {
      const payload = {
        supplier_id: purchaseSupplier.id,
        notes: purchaseNotes,
        items: purchaseItems.filter(i => i.inventory_item_id && i.quantity > 0)
      };
      await api.createPurchase(payload);
      showToast(`Purchase order registered & inventory restocked!`, 'success');
      setIsPurchaseOpen(false);
      fetchSuppliers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenHistory = async (sup) => {
    setHistorySupplier(sup);
    setIsHistoryOpen(true);
    try {
      const data = await api.getSupplierPurchases(sup.id);
      setPurchases(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person && s.contact_person.toLowerCase().includes(search.toLowerCase())) ||
    (s.supplied_items && s.supplied_items.toLowerCase().includes(search.toLowerCase()))
  );

  const purchaseTotal = purchaseItems.reduce((acc, curr) => acc + (curr.quantity * curr.unit_cost), 0);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Supplier Management & Restock</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain wholesale vendors, supplied ingredient lines, and create purchase order restocks
          </p>
        </div>
        {hasRole('owner', 'manager') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Supplier</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search supplier name, item or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Suppliers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((sup) => (
          <div
            key={sup.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{sup.name}</h3>
                  <p className="text-xs text-emerald-700 font-semibold">{sup.contact_person || 'Vendor Contact'}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                  {sup.purchase_count} Orders
                </span>
              </div>

              {/* Contact details */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                {sup.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </div>
                )}
                {sup.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.email}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.address}</span>
                  </div>
                )}
              </div>

              {/* Supplied Ingredients Tags */}
              {sup.supplied_items && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Supplied Goods:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {sup.supplied_items.split(',').map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px]">
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenPurchase(sup)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Restock Order</span>
                </button>
                <button
                  onClick={() => handleOpenHistory(sup)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="View Purchase History"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>

              {hasRole('owner', 'manager') && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(sup)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmSupplier(sup)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
          No suppliers found matching your query.
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add New Supplier Partner'}
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Supplier Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. FreshFarm Organics"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="e.g. Robert Green"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0100"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sales@freshfarm.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Warehouse / Farm Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Farm Rd, Valley District, State"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Supplied Ingredients (Comma Separated)</label>
            <input
              type="text"
              value={formData.supplied_items}
              onChange={(e) => setFormData({ ...formData, supplied_items: e.target.value })}
              placeholder="e.g. Tomatoes, Onions, Potatoes, Herbs"
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
              {editingSupplier ? 'Save Supplier' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Purchase Order Modal */}
      <Modal
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        title={`New Purchase / Restock Order: ${purchaseSupplier?.name}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-700">Order Line Items</span>
            <button
              type="button"
              onClick={handleAddPurchaseLine}
              className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold"
            >
              + Add Item Line
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {purchaseItems.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <select
                  value={line.inventory_item_id}
                  onChange={(e) => handlePurchaseLineChange(idx, 'inventory_item_id', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  {inventoryItems.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.unit})
                    </option>
                  ))}
                </select>

                <div className="w-20">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={line.quantity}
                    onChange={(e) => handlePurchaseLineChange(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                  />
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={line.unit_cost}
                    onChange={(e) => handlePurchaseLineChange(idx, 'unit_cost', e.target.value)}
                    placeholder="Cost"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-right"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePurchaseLine(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Invoice Notes / Reference</label>
            <input
              type="text"
              value={purchaseNotes}
              onChange={(e) => setPurchaseNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Total Purchase Value:</span>
            <span className="text-emerald-700 text-sm font-extrabold">₹{purchaseTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPurchaseOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={purchaseItems.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              Confirm Purchase & Restock
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Purchase History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Purchase History: ${historySupplier?.name}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Items Restocked</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.invoice_number}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {p.purchase_date ? new Date(p.purchase_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">
                      {p.items?.map(i => `${i.quantity}x ${i.ingredient_name}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                      ₹{p.total_amount?.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {purchases.length === 0 && (
            <p className="p-8 text-center text-slate-400">No purchase records found for this supplier.</p>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmSupplier}
        onClose={() => setDeleteConfirmSupplier(null)}
        title={`Delete Supplier "${deleteConfirmSupplier?.name}"?`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete supplier <strong>{deleteConfirmSupplier?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setDeleteConfirmSupplier(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSupplier}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Delete Supplier
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
