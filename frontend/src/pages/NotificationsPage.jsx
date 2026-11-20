import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  ShoppingBag,
  ChefHat,
  Boxes,
  CalendarDays,
  Receipt,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export default function NotificationsPage({ setCurrentPage }) {
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications({ type: typeFilter });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [typeFilter]);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      showToast('All notifications marked as read', 'success');
      fetchNotifs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await api.deleteNotification(id);
      fetchNotifs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleNavigateToModule = (notif) => {
    handleMarkRead(notif.id);
    if (notif.type === 'order') setCurrentPage('orders');
    else if (notif.type === 'kitchen') setCurrentPage('kitchen');
    else if (notif.type === 'inventory') setCurrentPage('inventory');
    else if (notif.type === 'reservation') setCurrentPage('reservations');
    else if (notif.type === 'billing') setCurrentPage('billing');
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'kitchen':
        return <ChefHat className="w-5 h-5 text-amber-600" />;
      case 'inventory':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'reservation':
        return <CalendarDays className="w-5 h-5 text-purple-600" />;
      case 'billing':
        return <Receipt className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notifications & Operational Alerts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time triggers for kitchen tickets, inventory shortages, table reservations, and payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          )}
          <button
            onClick={fetchNotifs}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'order', label: 'Orders' },
          { id: 'kitchen', label: 'Kitchen Tickets' },
          { id: 'inventory', label: 'Low Inventory' },
          { id: 'reservation', label: 'Reservations' },
          { id: 'billing', label: 'Billing & Cashier' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors shrink-0 ${
              typeFilter === f.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification Cards List */}
      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              !notif.is_read
                ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-100'
                : 'bg-white border-slate-200 opacity-80'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                {getNotifIcon(notif.type)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {notif.type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                <span className="text-[11px] text-slate-400 block">
                  {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Just now'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => handleNavigateToModule(notif)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors"
              >
                <span>View Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {!notif.is_read && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  title="Mark as Read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handleDeleteNotif(notif.id)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                title="Dismiss"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Inbox Clear</h3>
            <p className="text-xs text-slate-400">No active alerts for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
