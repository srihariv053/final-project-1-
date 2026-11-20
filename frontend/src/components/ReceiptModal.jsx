import React from 'react';
import { Printer, Download, Utensils, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

export default function ReceiptModal({ isOpen, onClose, bill, restaurantSettings = {} }) {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textData = `
========================================
       ${restaurantSettings.restaurant_name || 'DINEFLOW GOURMET & BISTRO'}
       ${restaurantSettings.address || 'Connaught Place, New Delhi'}
       Tel: ${restaurantSettings.phone || '+91 98765 43210'}
========================================
INVOICE: ${bill.bill_number}
Date: ${bill.created_at ? new Date(bill.created_at).toLocaleString() : new Date().toLocaleString()}
Table: ${bill.table_number || 'N/A'}
Cashier: ${bill.cashier_name || 'Staff'}
Payment: ${bill.payment_method?.toUpperCase()} (${bill.payment_status?.toUpperCase()})
----------------------------------------
ITEMS:
${(bill.items || []).map(i => `${i.quantity}x ${i.item_name} @ ₹${i.unit_price?.toFixed(2)} = ₹${i.total_price?.toFixed(2)}`).join('\n')}
----------------------------------------
Subtotal:       ₹${bill.subtotal?.toFixed(2)}
Discount:      -₹${bill.discount_amount?.toFixed(2)}
Tax (5%):       ₹${bill.tax_amount?.toFixed(2)}
Service Charge: ₹${bill.service_charge?.toFixed(2)}
----------------------------------------
TOTAL PAID:     ₹${bill.final_amount?.toFixed(2)}
========================================
${restaurantSettings.receipt_footer || 'Thank you for dining with DineFlow!'}
========================================
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([textData], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${bill.bill_number}_Receipt.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tax Invoice & Receipt" maxWidth="max-w-lg">
      <div className="space-y-6">
        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="bg-slate-50 border border-slate-200 rounded-xl p-6 font-mono text-xs text-slate-800 shadow-inner">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
            <div className="flex justify-center items-center gap-1.5 text-slate-900 font-bold text-sm">
              <Utensils className="w-4 h-4 text-emerald-600" />
              <span>{restaurantSettings.restaurant_name || 'DineFlow Gourmet & Bistro'}</span>
            </div>
            <p className="text-slate-500">{restaurantSettings.tagline || 'Fine Dining & Hospitality'}</p>
            <p className="text-slate-500">{restaurantSettings.address || '42 Heritage Blvd, Connaught Place'}</p>
            <p className="text-slate-500">Tel: {restaurantSettings.phone || '+91 98765 43210'}</p>
          </div>

          {/* Meta Info */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-bold text-slate-900">{bill.bill_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Order:</span>
              <span>{bill.order_number || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Table:</span>
              <span className="font-bold text-slate-900">{bill.table_number || 'Takeaway'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{bill.created_at ? new Date(bill.created_at).toLocaleString() : new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{bill.cashier_name || 'Staff'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 font-semibold border-b border-slate-200">
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Price</th>
                  <th className="pb-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(bill.items || []).map((item, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="py-1.5 text-slate-900 font-sans text-xs">{item.item_name}</td>
                    <td className="py-1.5 text-center text-slate-700">{item.quantity}</td>
                    <td className="py-1.5 text-right text-slate-700">₹{item.unit_price?.toFixed(2)}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">₹{item.total_price?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-right">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹{bill.subtotal?.toFixed(2)}</span>
            </div>
            {bill.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span>-₹{bill.discount_amount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST/Tax (5%):</span>
              <span>₹{bill.tax_amount?.toFixed(2)}</span>
            </div>
            {bill.service_charge > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Service Charge:</span>
                <span>₹{bill.service_charge?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
              <span>Total Payable:</span>
              <span className="text-emerald-700 font-sans text-lg">₹{bill.final_amount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="pt-3 pb-2 flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PAID via {bill.payment_method?.toUpperCase()}</span>
            </div>
            {bill.payment_reference && (
              <span className="text-[10px] text-slate-400">Ref: {bill.payment_reference}</span>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center pt-4 text-slate-500 text-[11px] font-sans">
            <p>{restaurantSettings.receipt_footer || 'Thank you for dining with DineFlow! Please visit us again.'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download Receipt</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
