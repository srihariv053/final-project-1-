import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Check,
  RefreshCw,
  Bell,
  Volume2,
  VolumeX,
  Flame,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';

export default function KitchenPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const fetchKitchenOrders = async () => {
    try {
      const data = await api.getKitchenOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 10000); // KDS polls every 10s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.updateKitchenStatus(orderId, newStatus);
      showToast(`Kitchen Ticket #${orderId} moved to ${newStatus.toUpperCase()}`, 'success');
      fetchKitchenOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  // Calculate ticket counts
  const newCount = orders.filter((o) => o.status === 'new').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const delayedCount = orders.filter((o) => o.is_delayed).length;

  return (
    <div className="space-y-6 text-left">
      {/* KDS Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Kitchen Display System (KDS)</h2>
            <p className="text-xs text-slate-400">Live order line • Auto-refreshes every 10 seconds</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              soundEnabled
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchKitchenOrders}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* KDS Summary Badges & Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-70">Total Active</span>
          <span className="text-2xl font-extrabold">{orders.length}</span>
        </button>

        <button
          onClick={() => setStatusFilter('new')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'new'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-blue-500">Incoming New</span>
          <span className="text-2xl font-extrabold text-blue-600">{newCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('preparing')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'preparing'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-amber-500">In Prep Oven</span>
          <span className="text-2xl font-extrabold text-amber-600">{preparingCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('ready')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'ready'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block text-emerald-500">Ready for Waiter</span>
          <span className="text-2xl font-extrabold text-emerald-600">{readyCount}</span>
        </button>
      </div>

      {/* Delayed Orders Warning Ribbon */}
      {delayedCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
            <span className="font-bold">
              {delayedCount} Kitchen Ticket{delayedCount > 1 ? 's' : ''} waiting over 20 minutes! Expedite urgently.
            </span>
          </div>
          <span className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-lg text-[10px]">LATE TICKETS</span>
        </div>
      )}

      {/* Active Ticket Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredOrders.map((order) => {
          let cardBorder = 'border-slate-300';
          let timerBg = 'bg-slate-100 text-slate-700';

          if (order.is_delayed) {
            cardBorder = 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20';
            timerBg = 'bg-rose-600 text-white animate-pulse';
          } else if (order.is_warning) {
            cardBorder = 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/20';
            timerBg = 'bg-amber-500 text-white';
          }

          return (
            <div
              key={order.id}
              className={`bg-white rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-150 ${cardBorder}`}
            >
              {/* Ticket Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-base tracking-tight">{order.order_number}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold block mt-0.5">
                    {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
                  </span>
                </div>

                {/* Waiting Timer Badge */}
                <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${timerBg}`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{order.elapsed_minutes}m</span>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 space-y-2 flex-1">
                <div className="space-y-1.5 divide-y divide-slate-100">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                          {item.quantity}x
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 leading-snug">{item.item_name}</p>
                          {item.notes && (
                            <p className="text-[10px] text-amber-700 italic bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </div>
                  ))}
                </div>

                {/* Special Instructions Note */}
                {order.special_instructions && (
                  <div className="mt-3 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                    <span className="font-bold">Instructions: </span>
                    <span>{order.special_instructions}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons to Progress Through Stages: New -> Preparing -> Ready -> Served */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <StatusBadge status={order.status} />

                <div className="flex items-center gap-1.5">
                  {order.status === 'new' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start Prep</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Ready</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'served')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Served</span>
                    </button>
                  )}

                  {order.status === 'served' && (
                    <span className="text-[11px] font-semibold text-slate-400">At Customer Table</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <ChefHat className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Kitchen Line Clear</h3>
          <p className="text-xs text-slate-400">All orders have been prepared and served to dining tables.</p>
        </div>
      )}
    </div>
  );
}
