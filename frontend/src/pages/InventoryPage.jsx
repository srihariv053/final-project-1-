import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  History,
  TrendingDown,
  Edit2,
  Trash2,
  PackagePlus,
  SlidersHorizontal,
  Truck
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function InventoryPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    current_stock: 10,
    unit: 'kg',
    min_stock: 5,
    supplier_id: '',
    cost_per_unit: 2.0
  });

  // Restock Modal
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockReason, setRestockReason] = useState('Weekly shipment restock');

  // Usage/Waste Modal
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [usageTarget, setUsageTarget] = useState(null);
  const [usageQty, setUsageQty] = useState('');
  const [usageType, setUsageType] = useState('waste'); // waste, adjustment, usage
  const [usageReason, setUsageReason] = useState('Kitchen prep spoilage / trimmed');

  // Stock History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [movements, setMovements] = useState([]);

  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [inv, sups, cats] = await Promise.all([
        api.getInventory(),
        api.getSuppliers(),
        api.getInventoryCategories()
      ]);
      setInventory(inv);
      setSuppliers(sups);
      setCategories(['All', ...cats]);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Vegetables',
      current_stock: 10,
      unit: 'kg',
      min_stock: 5,
      supplier_id: suppliers[0]?.id || '',
      cost_per_unit: 2.0
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      current_stock: item.current_stock,
      unit: item.unit,
      min_stock: item.min_stock,
      supplier_id: item.supplier_id || '',
      cost_per_unit: item.cost_per_unit
    });
    setIsAddEditOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        current_stock: parseFloat(formData.current_stock) || 0,
        min_stock: parseFloat(formData.min_stock) || 1,
        cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null
      };

      if (editingItem) {
        await api.updateInventoryItem(editingItem.id, payload);
        showToast(`Updated "${payload.name}" successfully`, 'success');
      } else {
        await api.createInventoryItem(payload);
        showToast(`Added ingredient "${payload.name}" to inventory`, 'success');
      }
      setIsAddEditOpen(false);
      fetchInventory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockTarget || !restockQty) return;
    try {
      await api.restockItem(restockTarget.id, {
        quantity: parseFloat(restockQty),
        reason: restockReason
      });
      showToast(`Added +${restockQty} ${restockTarget.unit} to ${restockTarget.name}`, 'success');
      setIsRestockOpen(false);
      setRestockQty('');
      fetchInventory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    if (!usageTarget || !usageQty) return;
    try {
      await api.recordUsage(usageTarget.id, {
        quantity: parseFloat(usageQty),
        change_type: usageType,
        reason: usageReason
      });
      showToast(`Recorded -${usageQty} ${usageTarget.unit} deduction for ${usageTarget.name}`, 'info');
      setIsUsageOpen(false);
      setUsageQty('');
      fetchInventory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleViewHistory = async (item) => {
    setHistoryItem(item);
    setIsHistoryOpen(true);
    try {
      const hist = await api.getStockMovements({ item_id: item.id });
      setMovements(hist);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      await api.deleteInventoryItem(deleteConfirmItem.id);
      showToast(`Deleted "${deleteConfirmItem.name}"`, 'success');
      setDeleteConfirmItem(null);
      fetchInventory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredItems = inventory.filter((item) => {
    const matchCat = selectedCat === 'All' || item.category === selectedCat;
    const matchLow = !lowStockOnly || item.is_low_stock;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      (item.supplier_name && item.supplier_name.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchLow && matchSearch;
  });

  const lowStockCount = inventory.filter((i) => i.is_low_stock).length;

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Restaurant Inventory & Stock</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock monitoring, automatic order recipe deduction, restock logging, and usage tracking
          </p>
        </div>
        {hasRole('owner', 'manager') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Ingredient</span>
          </button>
        )}
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-rose-900">{lowStockCount} Ingredients Below Minimum Threshold!</p>
              <p className="text-rose-700 mt-0.5">
                {inventory.filter(i => i.is_low_stock).map(i => `«${i.name} – ${i.current_stock} ${i.unit} remaining – Low Stock»`).join('  ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
              lowStockOnly ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            {lowStockOnly ? 'Show All Items' : 'Filter Low Stock'}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ingredient or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                lowStockOnly
                  ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Low Stock Alerts Only ({lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                selectedCat === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Ingredient Name</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Current Stock</th>
                <th className="py-3.5 px-3">Stock Level Status</th>
                <th className="py-3.5 px-3">Min Level</th>
                <th className="py-3.5 px-3">Supplier</th>
                <th className="py-3.5 px-3 text-right">Cost / Unit</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const stockPercent = Math.min(100, Math.round((item.current_stock / (item.min_stock * 2)) * 100));

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {item.is_low_stock && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 font-semibold text-slate-600">{item.category}</td>

                    {/* Current Stock */}
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      <span className={item.is_low_stock ? 'text-rose-600' : 'text-slate-900'}>
                        {item.current_stock} {item.unit}
                      </span>
                    </td>

                    {/* Visual Progress Bar */}
                    <td className="py-3 px-3 w-40">
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.is_low_stock ? 'bg-rose-500' : stockPercent < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, stockPercent)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${item.is_low_stock ? 'text-rose-600' : 'text-slate-400'}`}>
                          {item.is_low_stock ? 'LOW STOCK' : 'Healthy Stock'}
                        </span>
                      </div>
                    </td>

                    {/* Minimum stock */}
                    <td className="py-3 px-3 text-slate-500">{item.min_stock} {item.unit}</td>

                    {/* Supplier */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {item.supplier_name || 'Direct Wholesale'}
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">
                      ₹{item.cost_per_unit?.toFixed(2)}
                    </td>

                    {/* Actions: Restock, Record Usage, History, Edit */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Restock Button */}
                        <button
                          onClick={() => {
                            setRestockTarget(item);
                            setRestockQty('');
                            setIsRestockOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Add Stock"
                        >
                          <PackagePlus className="w-3 h-3" />
                          <span>Restock</span>
                        </button>

                        {/* Usage/Waste Button */}
                        <button
                          onClick={() => {
                            setUsageTarget(item);
                            setUsageQty('');
                            setIsUsageOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Record Kitchen Usage / Waste"
                        >
                          <TrendingDown className="w-3 h-3" />
                          <span>Usage</span>
                        </button>

                        {/* Movement History */}
                        <button
                          onClick={() => handleViewHistory(item)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                          title="Stock Movement Log"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {hasRole('owner', 'manager') && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                              title="Edit Ingredient"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50"
                              title="Delete Ingredient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">No inventory items found.</div>
        )}
      </div>

      {/* Add / Edit Ingredient Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingItem ? `Edit Ingredient: ${editingItem.name}` : 'Add New Inventory Ingredient'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ingredient Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Tomatoes, Chicken Breast"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Stock</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="g">g (Grams)</option>
                <option value="liters">liters</option>
                <option value="ml">ml (Milliliters)</option>
                <option value="pcs">pcs (Pieces)</option>
                <option value="packs">packs</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Min Alert Stock *</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                required
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-rose-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cost Per Unit (₹)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                <option value="">-- No Supplier Linked --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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
              {editingItem ? 'Save Changes' : 'Create Ingredient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      <Modal
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        title={`Restock: ${restockTarget?.name}`}
        subtitle={`Current Level: ${restockTarget?.current_stock} ${restockTarget?.unit}`}
      >
        <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Quantity to Add ({restockTarget?.unit}) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              placeholder="e.g. 10.0"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-lg text-emerald-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason / Reference Note</label>
            <input
              type="text"
              value={restockReason}
              onChange={(e) => setRestockReason(e.target.value)}
              placeholder="e.g. Supplier delivery invoice #412"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsRestockOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
            >
              Confirm Restock
            </button>
          </div>
        </form>
      </Modal>

      {/* Usage / Waste Modal */}
      <Modal
        isOpen={isUsageOpen}
        onClose={() => setIsUsageOpen(false)}
        title={`Record Usage or Waste: ${usageTarget?.name}`}
        subtitle={`Available: ${usageTarget?.current_stock} ${usageTarget?.unit}`}
      >
        <form onSubmit={handleUsageSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Deduction Type</label>
              <select
                value={usageType}
                onChange={(e) => setUsageType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="waste">Kitchen Spoilage / Waste</option>
                <option value="usage">Manual Cooking Prep</option>
                <option value="adjustment">Stock Count Audit Adj</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity ({usageTarget?.unit}) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={usageTarget?.current_stock}
                required
                value={usageQty}
                onChange={(e) => setUsageQty(e.target.value)}
                placeholder="e.g. 1.5"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-lg text-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason Description</label>
            <input
              type="text"
              value={usageReason}
              onChange={(e) => setUsageReason(e.target.value)}
              placeholder="e.g. Trimming peel loss, burned batch..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsUsageOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Record Deduction
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock History Audit Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Stock Movement Audit: ${historyItem?.name}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2 text-right">Change</th>
                  <th className="py-2.5 px-2 text-right">Balance</th>
                  <th className="py-2.5 px-3">Reason / Ref</th>
                  <th className="py-2.5 px-2">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((mov) => (
                  <tr key={mov.id}>
                    <td className="py-2 px-3 text-slate-500">
                      {mov.created_at ? new Date(mov.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2 px-2 capitalize font-semibold text-slate-700">{mov.change_type}</td>
                    <td className={`py-2 px-2 text-right font-bold ${mov.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                    </td>
                    <td className="py-2 px-2 text-right font-extrabold text-slate-900">{mov.new_stock}</td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-[150px]">{mov.reason}</td>
                    <td className="py-2 px-2 text-slate-400">{mov.created_by || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {movements.length === 0 && (
            <p className="p-6 text-center text-slate-400">No stock movements recorded for this ingredient yet.</p>
          )}
        </div>
      </Modal>

      {/* Delete Item Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        title={`Delete "${deleteConfirmItem?.name}"?`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete <strong>{deleteConfirmItem?.name}</strong> from raw materials inventory?
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setDeleteConfirmItem(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteItem}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Delete Ingredient
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
