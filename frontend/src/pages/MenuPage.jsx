import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  UtensilsCrossed,
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function MenuPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & View mode
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [vegFilter, setVegFilter] = useState('all'); // all, veg, nonveg
  const [viewMode, setViewMode] = useState('grid'); // grid | table

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Main Course',
    price: '',
    description: '',
    is_veg: true,
    is_available: true,
    image_url: '',
    preparation_time_minutes: 15,
    recipes: [] // [{ inventory_item_id, quantity_needed }]
  });

  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const [items, cats, inv] = await Promise.all([
        api.getMenu(),
        api.getCategories(),
        api.getInventory()
      ]);
      setMenuItems(items);
      setCategories(['All', ...cats]);
      setInventoryItems(inv);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Main Course',
      price: '',
      description: '',
      is_veg: true,
      is_available: true,
      image_url: '',
      preparation_time_minutes: 15,
      recipes: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || '',
      is_veg: item.is_veg,
      is_available: item.is_available,
      image_url: item.image_url || '',
      preparation_time_minutes: item.preparation_time_minutes || 15,
      recipes: item.recipes ? item.recipes.map(r => ({ inventory_item_id: r.inventory_item_id, quantity_needed: r.quantity_needed })) : []
    });
    setIsModalOpen(true);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        preparation_time_minutes: parseInt(formData.preparation_time_minutes) || 15,
        recipes: formData.recipes.filter(r => r.inventory_item_id && r.quantity_needed > 0)
      };

      if (editingItem) {
        await api.updateMenuItem(editingItem.id, payload);
        showToast(`Updated "${payload.name}" successfully`, 'success');
      } else {
        await api.createMenuItem(payload);
        showToast(`Created "${payload.name}" successfully`, 'success');
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      await api.deleteMenuItem(deleteConfirmItem.id);
      showToast(`Deleted "${deleteConfirmItem.name}"`, 'success');
      setDeleteConfirmItem(null);
      fetchMenu();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      const updated = await api.toggleMenuAvailability(id);
      showToast(
        `"${updated.name}" is now ${updated.is_available ? 'Available' : 'Unavailable'}`,
        updated.is_available ? 'success' : 'warning'
      );
      setMenuItems(prev => prev.map(m => m.id === id ? { ...m, is_available: updated.is_available } : m));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddRecipeIngredient = () => {
    setFormData(prev => ({
      ...prev,
      recipes: [...prev.recipes, { inventory_item_id: '', quantity_needed: 0.1 }]
    }));
  };

  const handleRemoveRecipeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      recipes: prev.recipes.filter((_, idx) => idx !== index)
    }));
  };

  const handleRecipeChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.recipes];
      updated[index][field] = field === 'quantity_needed' ? parseFloat(value) || 0 : parseInt(value);
      return { ...prev, recipes: updated };
    });
  };

  const filteredItems = menuItems.filter(item => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchVeg =
      vegFilter === 'all' ||
      (vegFilter === 'veg' && item.is_veg) ||
      (vegFilter === 'nonveg' && !item.is_veg);
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchVeg && matchSearch;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Menu Catalog Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dishes, pricing in INR (₹), dietary indicators, stock availability, and recipe ingredient links
          </p>
        </div>
        {hasRole('owner', 'manager') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Menu Item</span>
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
              placeholder="Search dish name, ingredients or spices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* Veg / Non-Veg filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setVegFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${vegFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
              >
                All Items
              </button>
              <button
                onClick={() => setVegFilter('veg')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${vegFilter === 'veg' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'}`}
              >
                Veg 🌱
              </button>
              <button
                onClick={() => setVegFilter('nonveg')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${vegFilter === 'nonveg' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'}`}
              >
                Non-Veg 🍗
              </button>
            </div>

            {/* Grid vs Table view */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between transition-all duration-150 hover:shadow-md ${
                !item.is_available ? 'opacity-65' : ''
              }`}
            >
              {/* Image & Badges */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <UtensilsCrossed className="w-12 h-12" />
                  </div>
                )}

                {/* Dietary Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold shadow-xs">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                  <span className={item.is_veg ? 'text-emerald-800' : 'text-rose-800'}>
                    {item.is_veg ? 'Veg' : 'Non-Veg'}
                  </span>
                </div>

                {/* Prep time badge */}
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{item.preparation_time_minutes}m</span>
                </div>

                {/* Category tag */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-lg text-[10px] font-semibold">
                  {item.category}
                </div>
              </div>

              {/* Item Info */}
              <div className="p-4 space-y-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.name}</h3>
                  <span className="text-base font-extrabold text-slate-900 shrink-0">
                    ₹{item.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>

                {/* Recipe ingredients summary */}
                {item.recipes && item.recipes.length > 0 && (
                  <div className="pt-1.5 flex flex-wrap gap-1">
                    {item.recipes.map((r, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                        {r.ingredient_name} ({r.quantity_needed}{r.unit})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                {/* Available toggle */}
                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-colors ${
                    item.is_available
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {item.is_available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>{item.is_available ? 'Available' : 'Unavailable'}</span>
                </button>

                {hasRole('owner', 'manager') && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmItem(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Price</th>
                  <th className="py-3 px-3">Prep Time</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-600">{item.category}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.is_veg ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {item.is_veg ? 'Vegetarian' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">₹{item.price.toFixed(2)}</td>
                    <td className="py-3 px-3 text-slate-500">{item.preparation_time_minutes} mins</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasRole('owner', 'manager') && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
          No menu items matched your filter or search criteria.
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit Menu Item: ${editingItem.name}` : 'Add New Menu Item'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Paneer Tikka Royale"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                step="5"
                min="10"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="320"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Prep Time (mins)</label>
              <input
                type="number"
                min="1"
                value={formData.preparation_time_minutes}
                onChange={(e) => setFormData({ ...formData, preparation_time_minutes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Dietary Type</label>
              <select
                value={formData.is_veg ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_veg: e.target.value === 'true' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
              >
                <option value="true">🌱 Vegetarian</option>
                <option value="false">🍗 Non-Vegetarian</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Flavor notes, marinade details, spices used..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
            />
          </div>

          {/* Recipe Ingredient Configuration */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-slate-800">Recipe Ingredients (Auto-Inventory Deduction)</h4>
                <p className="text-[11px] text-slate-500">
                  Ingredients configured here are automatically subtracted from inventory when order is completed
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRecipeIngredient}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {formData.recipes.length === 0 ? (
                <p className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-[11px]">
                  No ingredients linked. Click "+ Add Ingredient" to link raw inventory.
                </p>
              ) : (
                formData.recipes.map((recipe, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={recipe.inventory_item_id}
                      onChange={(e) => handleRecipeChange(idx, 'inventory_item_id', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    >
                      <option value="">-- Choose Ingredient --</option>
                      {inventoryItems.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} (Unit: {inv.unit}, In Stock: {inv.current_stock})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={recipe.quantity_needed}
                      onChange={(e) => handleRecipeChange(idx, 'quantity_needed', e.target.value)}
                      placeholder="Qty used"
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveRecipeIngredient(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
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
              {editingItem ? 'Save Item Changes' : 'Create Menu Item'}
            </button>
          </div>
        </form>
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
            Are you sure you want to delete <strong>{deleteConfirmItem?.name}</strong> from the restaurant menu catalog?
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
              Delete Dish
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
