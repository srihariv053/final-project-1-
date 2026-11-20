import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Utensils,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  Flame
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage({ setCurrentPage, setSelectedOrderId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 20000); // Live poll every 20s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading restaurant dashboard metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Welcome / Live Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Today's Restaurant Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Live operational statistics synced from real-time database</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={() => setCurrentPage('orders')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>New POS Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">₹{stats?.today_sales?.toFixed(2) || '0.00'}</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>Real database revenue</span>
            </div>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Orders</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{stats?.today_orders || 0}</span>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span className="text-amber-600 font-semibold">{stats?.pending_orders || 0} pending</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">{stats?.completed_orders || 0} done</span>
            </div>
          </div>
        </div>

        {/* Tables Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Table Occupancy</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900">{stats?.occupied_tables || 0}</span>
              <span className="text-xs text-slate-500">/ {stats?.total_tables || 15} Occupied</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-600 font-semibold">{stats?.available_tables || 0} available</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{stats?.reserved_tables || 0} reserved</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setCurrentPage('inventory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-rose-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock Ingredients</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-rose-600">{stats?.low_stock_count || 0}</span>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span className="text-rose-600 font-semibold">Needs restock</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Callout Alert Banner (if any) */}
      {stats?.low_stock_count > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Low Inventory Alert Detected</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {stats.low_stock_items?.map(i => `${i.name} (${i.current_stock} ${i.unit} left)`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('inventory')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors"
          >
            Manage Inventory
          </button>
        </div>
      )}

      {/* Charts Row: Weekly Sales & Daily Revenue */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Sales Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Revenue Trend</h3>
              <p className="text-xs text-slate-500">Total settled sales over the past 7 days</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">Last 7 Days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weekly_sales || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Sales']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Revenue Distribution by Hour */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Hourly Revenue</h3>
              <p className="text-xs text-slate-500">Sales volume distributed across service hours</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">Today</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.daily_revenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Selling Items & Recent Orders */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top-Selling Menu Items (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top-Selling Dishes</h3>
              <p className="text-xs text-slate-500">Highest volume menu items</p>
            </div>
            <button
              onClick={() => setCurrentPage('menu')}
              className="text-xs text-emerald-600 hover:underline font-semibold"
            >
              Menu
            </button>
          </div>
          <div className="space-y-3.5">
            {stats?.top_selling?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-slate-400 text-[11px]">{item.quantity} orders placed</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-600 shrink-0">₹{item.revenue?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-xs text-slate-500">Live order stream across tables and takeaway</p>
            </div>
            <button
              onClick={() => setCurrentPage('orders')}
              className="text-xs text-emerald-600 hover:underline font-semibold"
            >
              View All Orders
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2.5">Order #</th>
                  <th className="pb-2.5">Table</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Items</th>
                  <th className="pb-2.5 text-right">Amount</th>
                  <th className="pb-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.recent_orders || []).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-slate-900">{order.order_number}</td>
                    <td className="py-2.5 font-semibold text-slate-700">{order.table_number || 'Takeaway'}</td>
                    <td className="py-2.5 text-slate-600">{order.customer_name}</td>
                    <td className="py-2.5 text-slate-500 max-w-[150px] truncate">
                      {order.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">₹{order.final_amount?.toFixed(2)}</td>
                    <td className="py-2.5 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
