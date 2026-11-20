import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Clock, ChevronDown, Check, ShieldCheck, UserCheck, CreditCard, UtensilsCrossed, ChefHat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import RoleBadge from './RoleBadge';

export default function Header({ currentPage, setCurrentPage, setIsMobileOpen, unreadNotifCount, onNotificationClick }) {
  const { user, quickSwitchRole } = useAuth();
  const [time, setTime] = useState(new Date());
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);

  const roleMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch recent notifications when dropdown is opened
  const toggleNotifMenu = () => {
    if (!showNotifMenu) {
      api.getNotifications({ limit: 5 })
        .then(res => setRecentNotifs(res.notifications || []))
        .catch(() => {});
    }
    setShowNotifMenu(!showNotifMenu);
    setShowRoleMenu(false);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const demoRoles = [
    { username: 'owner', label: 'Owner (Full Access)', icon: ShieldCheck, color: 'text-amber-600' },
    { username: 'manager', label: 'Manager (Operations & Reports)', icon: UserCheck, color: 'text-indigo-600' },
    { username: 'cashier', label: 'Cashier (Billing & Orders)', icon: CreditCard, color: 'text-emerald-600' },
    { username: 'waiter', label: 'Waiter (Tables, Orders, KDS)', icon: UtensilsCrossed, color: 'text-blue-600' },
    { username: 'chef', label: 'Chef / Kitchen (KDS & Stock)', icon: ChefHat, color: 'text-rose-600' },
  ];

  const pageTitles = {
    dashboard: 'Operational Dashboard',
    tables: 'Table Management & Floor Plan',
    orders: 'Point of Sale & Orders',
    kitchen: 'Kitchen Display System (KDS)',
    menu: 'Menu Catalog & Recipes',
    inventory: 'Inventory & Stock Management',
    suppliers: 'Suppliers & Purchasing',
    customers: 'Customer Directory & History',
    reservations: 'Table Reservations & Bookings',
    billing: 'Billing & Invoice Settlement',
    staff: 'Staff Management & Roles',
    reports: 'Business Reports & Analytics',
    notifications: 'Notifications & Alerts',
    settings: 'Restaurant Configuration',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(prev => !prev)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {pageTitles[currentPage] || 'DineFlow'}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">DineFlow Gourmet & Bistro • Downtown Hub</p>
        </div>
      </div>

      {/* Right Controls: Clock, Live Role Switcher, Notification Dropdown, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* 1-Click Role Switcher */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-2xs"
            title="Switch Demo Role"
          >
            <span className="hidden sm:inline text-slate-400 font-normal">Role:</span>
            <RoleBadge role={user?.role} size="sm" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Switch Demo Role</p>
                <p className="text-xs text-slate-500">Test role-based access instantly:</p>
              </div>
              {demoRoles.map((dr) => {
                const Icon = dr.icon;
                const isSelected = user?.username === dr.username || (dr.username === 'chef' && user?.role === 'kitchen');
                return (
                  <button
                    key={dr.username}
                    onClick={() => {
                      quickSwitchRole(dr.username);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${
                      isSelected ? 'font-bold bg-slate-50/80 text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${dr.color}`} />
                      <span>{dr.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Icon with Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={toggleNotifMenu}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <button
                  onClick={() => {
                    setCurrentPage('notifications');
                    setShowNotifMenu(false);
                  }}
                  className="text-xs text-emerald-600 hover:underline font-semibold"
                >
                  View All
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {recentNotifs.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">No notifications yet</p>
                ) : (
                  recentNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setCurrentPage('notifications');
                        setShowNotifMenu(false);
                      }}
                      className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.is_read ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
