import React from 'react';

export default function StatusBadge({ status, type = 'order' }) {
  const s = (status || '').toLowerCase();

  const configs = {
    // Order statuses
    new: { label: 'New', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
    confirmed: { label: 'Confirmed', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    preparing: { label: 'Preparing', bg: 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' },
    ready: { label: 'Ready', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200 font-bold' },
    served: { label: 'Served', bg: 'bg-purple-100 text-purple-700 border-purple-200' },
    completed: { label: 'Completed', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-100 text-rose-700 border-rose-200' },

    // Table statuses
    available: { label: 'Available', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    occupied: { label: 'Occupied', bg: 'bg-rose-100 text-rose-700 border-rose-200' },
    reserved: { label: 'Reserved', bg: 'bg-amber-100 text-amber-700 border-amber-200' },
    cleaning: { label: 'Cleaning', bg: 'bg-sky-100 text-sky-700 border-sky-200' },

    // Payment statuses
    pending: { label: 'Pending', bg: 'bg-amber-100 text-amber-700 border-amber-200' },
    paid: { label: 'Paid', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    refunded: { label: 'Refunded', bg: 'bg-slate-100 text-slate-700 border-slate-200' },

    // Staff/Inventory statuses
    active: { label: 'Active', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    inactive: { label: 'Inactive', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    low_stock: { label: 'Low Stock', bg: 'bg-rose-100 text-rose-700 border-rose-200' },

    // Reservation statuses
    seated: { label: 'Seated', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
  };

  const current = configs[s] || { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}>
      {current.label}
    </span>
  );
}
