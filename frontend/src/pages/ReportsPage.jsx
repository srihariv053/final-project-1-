import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  PieChart,
  Clock,
  Printer,
  Download,
  Flame,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export default function ReportsPage() {
  const { showToast } = useToast();

  const [rangeType, setRangeType] = useState('7d'); // today, 7d, 30d, 90d, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = { range: rangeType };
      if (rangeType === 'custom' && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      const data = await api.getAnalytics(params);
      setAnalytics(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [rangeType]);

  const handleCustomFilterSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    fetchAnalytics();
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!analytics) return;
    let csv = "Date,Sales,Orders\n";
    (analytics.sales_timeline || []).forEach(row => {
      csv += `${row.date},${row.sales},${row.orders}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DineFlow_Sales_Report_${rangeType}.csv`;
    a.click();
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Generating financial and operational reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Executive Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time revenue metrics, menu item velocity, hourly sales distribution, and inventory consumption
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '90d', label: 'Quarter (90d)' },
            { id: 'year', label: 'Year to Date' },
            { id: 'custom', label: 'Custom Range' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRangeType(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                rangeType === r.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {rangeType === 'custom' && (
          <form onSubmit={handleCustomFilterSubmit} className="flex items-center gap-2 text-xs">
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Settled Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">₹{analytics?.total_sales?.toFixed(2) || '0.00'}</span>
            <p className="text-[11px] text-slate-400 mt-1">Paid receipts across all payment channels</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Volume</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{analytics?.total_orders || 0}</span>
            <p className="text-[11px] text-slate-400 mt-1">Total dining tickets processed</p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Order Value (AOV)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-purple-700">
              ₹{analytics?.average_order_value?.toFixed(2) || '0.00'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Average guest spending per dining table</p>
          </div>
        </div>
      </div>

      {/* Primary Chart: Sales Timeline */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Revenue & Order Trendline</h3>
            <p className="text-xs text-slate-500">Daily sales volume progression over selected timeframe</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics?.sales_timeline || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val) => [`₹${val}`, 'Daily Sales']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#areaSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2 Charts Row: Category Breakdown & Peak Hours */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales by Category (Donut / Pie) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sales by Category</h3>
              <p className="text-xs text-slate-500">Revenue contribution per menu classification</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={analytics?.sales_by_category || []}
                  dataKey="sales"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {(analytics?.sales_by_category || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Business Hours */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Peak Service Hours</h3>
              <p className="text-xs text-slate-500">Customer footfall and ordering volume by time of day</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.peak_hours || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, name) => [name === 'sales' ? `₹${val}` : val, name === 'sales' ? 'Revenue' : 'Orders']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row: Best & Least Selling Dishes + Payment Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Best Selling Dishes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>Best-Selling Dishes</span>
            </h3>
            <p className="text-xs text-slate-500">Highest velocity items</p>
          </div>
          <div className="space-y-2.5">
            {analytics?.best_selling?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                <span className="font-bold text-slate-800 truncate">{item.name}</span>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-700 block">₹{item.sales?.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400">{item.quantity} ordered</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Least Selling Dishes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-rose-500" />
              <span>Least-Selling Items</span>
            </h3>
            <p className="text-xs text-slate-500">Low sales velocity menu candidates</p>
          </div>
          <div className="space-y-2.5">
            {analytics?.least_selling?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                <span className="font-bold text-slate-800 truncate">{item.name}</span>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-slate-700 block">₹{item.sales?.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400">{item.quantity} ordered</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payment Breakdown</h3>
            <p className="text-xs text-slate-500">Cash vs Card vs UPI share</p>
          </div>
          <div className="space-y-2.5">
            {analytics?.payment_breakdown?.map((pb, idx) => {
              const totalAmount = analytics.total_sales || 1;
              const pct = Math.round((pb.amount / totalAmount) * 100);
              return (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-800">{pb.method}</span>
                    <span className="text-emerald-700">₹{pb.amount?.toFixed(2)} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Raw Inventory Consumption Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>Recipe Ingredient Usage (Auto-Deducted from Orders)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Raw materials consumed during cooking preparation and guest orders in this period
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Ingredient Name</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-4 text-right">Quantity Consumed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.inventory_usage?.map((ing, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2 px-4 font-bold text-slate-800">{ing.ingredient}</td>
                  <td className="py-2 px-3 text-slate-500">{ing.unit}</td>
                  <td className="py-2 px-4 text-right font-extrabold text-slate-900">
                    {ing.quantity} {ing.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
