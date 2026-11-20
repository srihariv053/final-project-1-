import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  DollarSign,
  QrCode,
  Search,
  CheckCircle2,
  Printer,
  Download,
  Eye,
  FileCheck,
  RefreshCw,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ReceiptModal from '../components/ReceiptModal';
import StatusBadge from '../components/StatusBadge';

export default function BillingPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'bills'

  // Data
  const [pendingOrders, setPendingOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [restaurantSettings, setRestaurantSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchBill, setSearchBill] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedOrderForBilling, setSelectedOrderForBilling] = useState(null);
  const [currentBillDraft, setCurrentBillDraft] = useState(null);

  // Checkout inputs
  const [paymentMethod, setPaymentMethod] = useState('upi'); // upi, card, cash
  const [discountVal, setDiscountVal] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // fixed, percentage
  const [cashTendered, setCashTendered] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  // Receipt Modal State
  const [receiptBill, setReceiptBill] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [pending, billList, settings] = await Promise.all([
        api.getPendingBillingOrders(),
        api.getBills(),
        api.getSettings()
      ]);
      setPendingOrders(pending);
      setBills(billList);
      setRestaurantSettings(settings);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleOpenCheckout = async (order) => {
    setSelectedOrderForBilling(order);
    setDiscountVal(order.discount_amount || 0);
    setPaymentMethod('upi');
    setCashTendered('');
    setPaymentRef('');

    try {
      // Generate or retrieve bill draft from API
      const billDraft = await api.generateBill({
        order_id: order.id,
        discount_type: 'fixed',
        discount_value: order.discount_amount || 0,
        tax_rate: parseFloat(restaurantSettings.tax_rate_percent) || 5.0
      });
      setCurrentBillDraft(billDraft);
      setIsCheckoutOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRecalculateDraft = async (newDiscountVal, newDiscountType) => {
    if (!selectedOrderForBilling) return;
    try {
      const updated = await api.generateBill({
        order_id: selectedOrderForBilling.id,
        discount_type: newDiscountType,
        discount_value: parseFloat(newDiscountVal) || 0,
        tax_rate: parseFloat(restaurantSettings.tax_rate_percent) || 5.0
      });
      setCurrentBillDraft(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!currentBillDraft) return;

    try {
      const paidBill = await api.processPayment(currentBillDraft.id, {
        payment_method: paymentMethod,
        payment_reference: paymentRef || (paymentMethod === 'cash' ? 'CASH-TENDER' : `UPI-${Math.floor(100000 + Math.random() * 900000)}`)
      });

      showToast(`Payment processed successfully for Bill ${paidBill.bill_number}!`, 'success');
      setIsCheckoutOpen(false);

      // Open Printable Receipt Modal immediately for convenience
      setReceiptBill(paidBill);
      setIsReceiptOpen(true);

      fetchBillingData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleViewReceipt = (bill) => {
    setReceiptBill(bill);
    setIsReceiptOpen(true);
  };

  const cashChange =
    paymentMethod === 'cash' && cashTendered
      ? Math.max(0, parseFloat(cashTendered) - (currentBillDraft?.final_amount || 0))
      : 0;

  const filteredBills = bills.filter(b => {
    const matchMethod = paymentMethodFilter === 'all' || b.payment_method === paymentMethodFilter;
    const matchSearch =
      b.bill_number.toLowerCase().includes(searchBill.toLowerCase()) ||
      (b.order_number && b.order_number.toLowerCase().includes(searchBill.toLowerCase())) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(searchBill.toLowerCase())) ||
      (b.table_number && b.table_number.toLowerCase().includes(searchBill.toLowerCase()));
    return matchMethod && matchSearch;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Billing, Settlement & Invoicing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect payments via UPI, Card or Cash, calculate discounts and taxes, and issue print-ready invoices in INR (₹)
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Awaiting Checkout ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bills'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paid Bills Ledger ({bills.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Pending Orders for Checkout */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm">{ord.order_number}</span>
                      <span className="text-xs text-emerald-600 font-extrabold block">
                        Table {ord.table_number || 'Takeaway'}
                      </span>
                    </div>
                    <StatusBadge status={ord.status} />
                  </div>

                  {/* Customer & Items */}
                  <div className="text-xs space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between text-slate-600">
                      <span>Customer:</span>
                      <span className="font-semibold text-slate-800">{ord.customer_name}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Dishes:</span>
                      <span className="font-semibold">{ord.items?.length || 0} items</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Service Waiter:</span>
                      <span>{ord.waiter_name || 'Staff'}</span>
                    </div>
                  </div>

                  {/* Item sample list */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
                    {ord.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate">{item.quantity}x {item.item_name}</span>
                        <span className="font-mono font-medium">₹{item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                    {ord.items?.length > 3 && (
                      <span className="italic block text-[10px] text-slate-400">
                        + {ord.items.length - 3} more items...
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Checkout CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Payable Total</span>
                    <span className="text-xl font-extrabold text-slate-900">₹{ord.final_amount?.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => handleOpenCheckout(ord)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Checkout</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pendingOrders.length === 0 && (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">All Dining Bills Settled</h3>
              <p className="text-xs text-slate-400">There are no unpaid orders currently awaiting checkout.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Paid Bills Ledger Archive */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #, order or guest..."
                value={searchBill}
                onChange={(e) => setSearchBill(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            {/* Payment Method Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {['all', 'upi', 'card', 'cash'].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethodFilter(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-colors shrink-0 ${
                    paymentMethodFilter === m
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Table</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">Tax & Disc</th>
                  <th className="py-3 px-3 text-right">Final Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.bill_number}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{b.order_number}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{b.table_number || 'Takeaway'}</td>
                    <td className="py-3 px-3 text-slate-600">{b.customer_name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                        {b.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-600">₹{b.subtotal?.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-[11px] text-slate-500">
                      {b.discount_amount > 0 ? `-₹${b.discount_amount?.toFixed(2)}` : '₹0'} / +₹{b.tax_amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 text-sm">
                      ₹{b.final_amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={b.payment_status} type="payment" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewReceipt(b)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 transition-colors ml-auto"
                        title="View & Print Official Receipt"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Bill</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBills.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-sm">No paid invoices found.</div>
          )}
        </div>
      )}

      {/* Checkout Settlement Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={`Settle Bill: Table ${selectedOrderForBilling?.table_number}`}
        subtitle={`Order #${selectedOrderForBilling?.order_number}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
          {/* Payment Method Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Select Payment Method *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'upi', label: 'UPI / QR Pay', icon: QrCode },
                { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                { id: 'cash', label: 'Cash', icon: DollarSign },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === m.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discount Settings */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
            <span className="font-bold text-slate-700 block">Apply Discount</span>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={discountVal}
                  onChange={(e) => {
                    setDiscountVal(e.target.value);
                    handleRecalculateDraft(e.target.value, discountType);
                  }}
                  placeholder="Discount Amount"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-emerald-700 text-xs focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('fixed');
                    handleRecalculateDraft(discountVal, 'fixed');
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${discountType === 'fixed' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                >
                  ₹ Fixed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('percentage');
                    handleRecalculateDraft(discountVal, 'percentage');
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${discountType === 'percentage' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                >
                  % Pct
                </button>
              </div>
            </div>
          </div>

          {/* Cash Change Calculation (if cash selected) */}
          {paymentMethod === 'cash' && (
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
              <label className="block font-bold text-emerald-900">Cash Amount Tendered (₹)</label>
              <input
                type="number"
                step="10"
                min={currentBillDraft?.final_amount}
                placeholder={`Minimum ₹${currentBillDraft?.final_amount?.toFixed(2)}`}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-emerald-300 font-mono font-bold text-lg text-emerald-900 focus:outline-none"
              />
              {cashTendered && parseFloat(cashTendered) >= (currentBillDraft?.final_amount || 0) && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-800 pt-1">
                  <span>Return Change to Guest:</span>
                  <span className="text-base text-emerald-700">₹{cashChange.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Reference for Card or UPI */}
          {paymentMethod !== 'cash' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Transaction Ref / Auth Code ({paymentMethod.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder="e.g. UPI-UTR-9031254 or CARD-AUTH-88231"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          )}

          {/* Totals Summary */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-right border border-slate-200">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>₹{currentBillDraft?.subtotal?.toFixed(2)}</span>
            </div>
            {currentBillDraft?.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount Applied:</span>
                <span>-₹{currentBillDraft?.discount_amount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax (5% GST):</span>
              <span>₹{currentBillDraft?.tax_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-slate-900 text-base pt-1.5 border-t border-slate-200">
              <span>Net Amount:</span>
              <span className="text-emerald-700 text-lg">₹{currentBillDraft?.final_amount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Settle Bill</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={receiptBill}
        restaurantSettings={restaurantSettings}
      />
    </div>
  );
}
