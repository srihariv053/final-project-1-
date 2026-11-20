import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  ChefHat,
  BookOpen,
  Boxes,
  Truck,
  Users,
  CalendarDays,
  Receipt,
  UserCog,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';

export default function Sidebar({ currentPage, setCurrentPage, badges = {}, isMobileOpen, setIsMobileOpen }) {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'manager', 'cashier', 'waiter', 'kitchen'] },
    { id: 'tables', label: 'Tables', icon: UtensilsCrossed, badge: badges.occupiedTables ? `${badges.occupiedTables} Occ` : null, roles: ['owner', 'manager', 'cashier', 'waiter'] },
    { id: 'orders', label: 'Orders & POS', icon: ShoppingBag, badge: badges.activeOrders || null, badgeColor: 'bg-emerald-500', roles: ['owner', 'manager', 'cashier', 'waiter'] },
    { id: 'kitchen', label: 'Kitchen KDS', icon: ChefHat, badge: badges.kitchenOrders || null, badgeColor: 'bg-amber-500', roles: ['owner', 'manager', 'kitchen', 'waiter'] },
    { id: 'menu', label: 'Menu Catalog', icon: BookOpen, roles: ['owner', 'manager', 'kitchen', 'waiter', 'cashier'] },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: badges.lowStock ? `${badges.lowStock} Low` : null, badgeColor: 'bg-rose-500', roles: ['owner', 'manager', 'kitchen'] },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, roles: ['owner', 'manager'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['owner', 'manager', 'cashier', 'waiter'] },
    { id: 'reservations', label: 'Reservations', icon: CalendarDays, badge: badges.reservations || null, roles: ['owner', 'manager', 'waiter', 'cashier'] },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt, badge: badges.pendingBills || null, badgeColor: 'bg-blue-500', roles: ['owner', 'manager', 'cashier'] },
    { id: 'staff', label: 'Staff Team', icon: UserCog, roles: ['owner', 'manager'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['owner', 'manager'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: badges.unreadNotifs || null, badgeColor: 'bg-rose-500', roles: ['owner', 'manager', 'cashier', 'waiter', 'kitchen'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['owner', 'manager'] },
  ];

  const allowedItems = navItems.filter(item => hasRole(...item.roles));

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">DineFlow</span>
              <span className="text-[10px] block font-semibold text-emerald-400 tracking-wider uppercase -mt-1">Restaurant OS</span>
            </div>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {user.full_name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                <div className="mt-1">
                  <RoleBadge role={user.role} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  if (setIsMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-emerald-700'
                        : item.badgeColor
                        ? `${item.badgeColor} text-white`
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Sign Out */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/30">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
