import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  FileText,
  DollarSign,
  ArrowRight,
  ListFilter,
  Eye,
  CreditCard
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

export default function OrdersPage({ setCurrentPage, initialSelectedTable, setSelectedBillForCheckout }) {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('new_order'); // 'new_order' | 'order_list'

  // POS Order Creation State
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchMenu, setSearchMenu] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Cart
  const [selectedTableId, setSelectedTableId] = useState(initialSelectedTable ? initialSelectedTable.id : '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState('dine_in');
  const [cart, setCart] = useState([]); // [{ menu_item_id, item_name, price, quantity, notes, is_veg }]
  const [discountAmount, setDiscountAmount] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Management / List State
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [searchOrder, setSearchOrder] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  // Add more items modal
  const [isAddMoreItemsOpen, setIsAddMoreItemsOpen] = useState(false);
  const [addMoreOrder, setAddMoreOrder] = useState(null);
  const [addMoreCart, setAddMoreCart] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tData, mData, cData, oData] = await Promise.all([
        api.getTables(),
        api.getMenu(),
        api.getCategories(),
        api.getOrders(),
      ]);
      setTables(tData);
      setMenuItems(mData);
      setCategories(['All', ...cData]);
      setOrders(oData);

      if (initialSelectedTable && !selectedTableId) {
        setSelectedTableId(initialSelectedTable.id);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddToCart = (item) => {
    if (!item.is_available) {
      showToast(`${item.name} is currently out of stock`, 'warning');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: 1,
          notes: '',
          is_veg: item.is_veg,
        },
      ];
    });
  };

  const handleUpdateCartQty = (menuItemId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.menu_item_id === menuItemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((c) => c.menu_item_id !== menuItemId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currentDiscount = Math.min(subtotal, Math.max(0, discountAmount));
  const tax = Math.round((subtotal - currentDiscount) * 0.05 * 100) / 100;
  const finalTotal = Math.round((subtotal - currentDiscount + tax) * 100) / 100;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Please add items to cart before placing an order', 'warning');
      return;
    }
    if (orderType === 'dine_in' && !selectedTableId) {
      showToast('Please select a table for Dine-In order', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        table_id: orderType === 'dine_in' ? parseInt(selectedTableId) : null,
        customer_name: customerName,
        customer_phone: customerPhone,
        order_type: orderType,
        items: cart.map((c) => ({
          menu_item_id: c.menu_item_id,
          quantity: c.quantity,
          notes: c.notes,
        })),
        discount_amount: currentDiscount,
        special_instructions: specialInstructions,
      };

      const newOrder = await api.createOrder(orderPayload);
      showToast(`Order #${newOrder.order_number} sent to Kitchen successfully!`, 'success');

      // Clear cart
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setSpecialInstructions('');
      setDiscountAmount(0);

      // Refresh orders
      const updatedOrders = await api.getOrders();
      setOrders(updatedOrders);
      setActiveTab('order_list');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to ${newStatus.toUpperCase()}`, 'success');
      const updatedOrders = await api.getOrders();
      setOrders(updatedOrders);
      if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
        const fresh = updatedOrders.find((o) => o.id === orderId);
        setSelectedOrderForDetail(fresh);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddMoreItemsSubmit = async (e) => {
    e.preventDefault();
    if (addMoreCart.length === 0) return;
    try {
      await api.addItemsToOrder(addMoreOrder.id, addMoreCart);
      showToast(`Additional items dispatched to Kitchen for #${addMoreOrder.order_number}`, 'success');
      setIsAddMoreItemsOpen(false);
      setAddMoreCart([]);
      const updatedOrders = await api.getOrders();
      setOrders(updatedOrders);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter menu items
  const filteredMenu = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchVeg = !vegOnly || item.is_veg;
    const matchSearch =
      item.name.toLowerCase().includes(searchMenu.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchMenu.toLowerCase()));
    return matchCat && matchVeg && matchSearch;
  });

  // Filter orders list
  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchSearch =
      o.order_number.toLowerCase().includes(searchOrder.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchOrder.toLowerCase())) ||
      (o.table_number && o.table_number.toLowerCase().includes(searchOrder.toLowerCase()));
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Point of Sale & Order System</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Take tableside orders, customize quantities, add items, and track kitchen status
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('new_order')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'new_order' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create New Order
          </button>
          <button
            onClick={() => setActiveTab('order_list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'order_list' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* TAB 1: POS / Create New Order */}
      {activeTab === 'new_order' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Menu Selector (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Veg Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dishes or drinks..."
                    value={searchMenu}
                    onChange={(e) => setSearchMenu(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={vegOnly}
                    onChange={(e) => setVegOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Veg Only 🌱</span>
                </label>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[620px] overflow-y-auto p-1">
              {filteredMenu.map((item) => {
                const inCart = cart.find((c) => c.menu_item_id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddToCart(item)}
                    className={`p-3.5 rounded-2xl border bg-white shadow-2xs hover:shadow-md cursor-pointer transition-all flex gap-3 group relative ${
                      !item.is_available ? 'opacity-60 grayscale' : 'hover:border-emerald-300'
                    }`}
                  >
                    {/* Item Image with Fallback */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-emerald-50/60 border border-slate-100 relative flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                      <div
                        style={{ display: item.image_url ? 'none' : 'flex' }}
                        className="w-full h-full flex flex-col items-center justify-center text-emerald-700 bg-emerald-50/70"
                      >
                        <UtensilsCrossed className="w-6 h-6 text-emerald-600" />
                        <span className="text-[9px] font-bold mt-0.5">{item.category?.slice(0, 4)}</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                            {item.name}
                          </h4>
                          <span
                            className={`w-3 h-3 rounded-full shrink-0 ${
                              item.is_veg ? 'border-2 border-emerald-600' : 'border-2 border-rose-600'
                            }`}
                            title={item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-extrabold text-slate-900">₹{item.price.toFixed(2)}</span>
                        {inCart ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {inCart.quantity} in cart
                          </span>
                        ) : (
                          <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-500 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart & Billing Checkout (Right 5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sticky top-20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Current Order Cart</h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {cart.length} Items
                </span>
              </div>

              {/* Table & Order Type Selector */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('dine_in')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      orderType === 'dine_in'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Dine-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      orderType === 'takeaway'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Takeaway
                  </button>
                </div>

                {orderType === 'dine_in' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Table *</label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                    >
                      <option value="">-- Choose Table --</option>
                      {tables.map((tbl) => (
                        <option key={tbl.id} value={tbl.id}>
                          {tbl.number} ({tbl.section} • {tbl.capacity} seats) - [{tbl.status.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Guest Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Phone (Optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
                {cart.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    Cart is empty. Select menu items from the left to start this order.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.menu_item_id} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate">{item.item_name}</span>
                        <span className="font-bold text-slate-900 shrink-0">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">₹{item.price.toFixed(2)} each</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.menu_item_id, -1)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-slate-900 w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.menu_item_id, 1)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.menu_item_id)}
                            className="p-1 text-slate-300 hover:text-rose-500 ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Special Instructions & Discount */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kitchen Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Extra spicy, no garlic, allergies..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600 font-medium">Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-xs text-right rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {currentDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{currentDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Tax (5% GST):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Final Total:</span>
                  <span className="text-emerald-700 text-base">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Order Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending to Kitchen...' : `Place Order • ₹${finalTotal.toFixed(2)}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Manage Orders List */}
      {activeTab === 'order_list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Order #, table or guest..."
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {['all', 'new', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors shrink-0 ${
                    orderStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-3">Table</th>
                  <th className="py-3 px-3">Guest</th>
                  <th className="py-3 px-3">Items Summary</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.order_number}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{ord.table_number || 'Takeaway'}</td>
                    <td className="py-3 px-3 text-slate-600">{ord.customer_name}</td>
                    <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">
                      {ord.items?.map((i) => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      ₹{ord.final_amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderForDetail(ord)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Add more items if order active */}
                        {['new', 'confirmed', 'preparing', 'ready', 'served'].includes(ord.status) && (
                          <button
                            onClick={() => {
                              setAddMoreOrder(ord);
                              setAddMoreCart([]);
                              setIsAddMoreItemsOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-emerald-700 hover:bg-emerald-50"
                            title="Add More Items to this Order"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Checkout button if served/ready and cashier/manager */}
                        {ord.status === 'served' && hasRole('owner', 'manager', 'cashier') && (
                          <button
                            onClick={() => setCurrentPage('billing')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
                            title="Settle Bill in Billing"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Bill</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-sm">No orders found.</div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        title={`Order Details: ${selectedOrderForDetail?.order_number}`}
        subtitle={`Table ${selectedOrderForDetail?.table_number} • ${selectedOrderForDetail?.order_type?.toUpperCase()}`}
      >
        {selectedOrderForDetail && (
          <div className="space-y-4 text-xs">
            {/* Meta status bar */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-medium">Current Status: </span>
                <StatusBadge status={selectedOrderForDetail.status} />
              </div>
              <div className="text-right text-slate-500">
                <span>Placed at: </span>
                <strong className="text-slate-800">
                  {selectedOrderForDetail.order_time
                    ? new Date(selectedOrderForDetail.order_time).toLocaleTimeString()
                    : 'N/A'}
                </strong>
              </div>
            </div>

            {/* Change Status Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-bold text-slate-600">Update Status:</span>
              {['confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(selectedOrderForDetail.id, st)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors ${
                    selectedOrderForDetail.status === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Itemized Table */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Ordered Dishes & Beverages</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrderForDetail.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800">{item.item_name}</td>
                        <td className="py-2 px-2 text-center font-bold">{item.quantity}</td>
                        <td className="py-2 px-2 text-right text-slate-600">₹{item.unit_price?.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          ₹{item.total_price?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Special notes */}
            {selectedOrderForDetail.special_instructions && (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <span className="font-bold">Special Instructions: </span>
                <span>{selectedOrderForDetail.special_instructions}</span>
              </div>
            )}

            {/* Totals Summary */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>₹{selectedOrderForDetail.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (5%):</span>
                <span>₹{selectedOrderForDetail.tax_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                <span>Final Total:</span>
                <span className="text-emerald-700">₹{selectedOrderForDetail.final_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add More Items Modal */}
      <Modal
        isOpen={isAddMoreItemsOpen}
        onClose={() => setIsAddMoreItemsOpen(false)}
        title={`Add More Items: Order #${addMoreOrder?.order_number}`}
        subtitle={`Table ${addMoreOrder?.table_number}`}
      >
        <form onSubmit={handleAddMoreItemsSubmit} className="space-y-4 text-xs">
          <p className="text-slate-500">Select additional items to dispatch to the kitchen for this order:</p>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2">
            {menuItems.map((m) => {
              const inAdd = addMoreCart.find((c) => c.menu_item_id === m.id);
              return (
                <div key={m.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{m.name}</span>
                    <span className="text-slate-400 block text-[11px]">₹{m.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {inAdd ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setAddMoreCart((prev) =>
                              prev
                                .map((c) => (c.menu_item_id === m.id ? { ...c, quantity: c.quantity - 1 } : c))
                                .filter((c) => c.quantity > 0)
                            )
                          }
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold w-4 text-center">{inAdd.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAddMoreCart((prev) =>
                              prev.map((c) => (c.menu_item_id === m.id ? { ...c, quantity: c.quantity + 1 } : c))
                            )
                          }
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setAddMoreCart((prev) => [
                            ...prev,
                            { menu_item_id: m.id, quantity: 1, notes: '' },
                          ])
                        }
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white font-semibold text-[11px] transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddMoreItemsOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMoreCart.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              Dispatch to Kitchen ({addMoreCart.length} items)
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
