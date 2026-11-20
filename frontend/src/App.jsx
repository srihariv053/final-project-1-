import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { api } from './api';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import KitchenPage from './pages/KitchenPage';
import MenuPage from './pages/MenuPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import ReservationsPage from './pages/ReservationsPage';
import BillingPage from './pages/BillingPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Cross-page state transfers
  const [selectedTableForOrder, setSelectedTableForOrder] = useState(null);

  // Live badge counts
  const [badges, setBadges] = useState({
    activeOrders: 0,
    occupiedTables: 0,
    kitchenOrders: 0,
    lowStock: 0,
    pendingBills: 0,
    unreadNotifs: 0,
    reservations: 0,
  });

  const fetchBadges = async () => {
    if (!user) return;
    try {
      const stats = await api.getDashboardStats();
      const notifs = await api.getNotifications({ unread_only: true });

      setBadges({
        activeOrders: stats.pending_orders || 0,
        occupiedTables: stats.occupied_tables || 0,
        kitchenOrders: stats.pending_orders || 0,
        lowStock: stats.low_stock_count || 0,
        pendingBills: stats.pending_orders || 0,
        unreadNotifs: notifs.unread_count || 0,
        reservations: stats.reserved_tables || 0,
      });
    } catch (e) {
      // Ignore background badge fetch errors
    }
  };

  useEffect(() => {
    if (user) {
      fetchBadges();
      const interval = setInterval(fetchBadges, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-400">Loading DineFlow System...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Render current view
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage setCurrentPage={setCurrentPage} />;
      case 'tables':
        return (
          <TablesPage
            setCurrentPage={setCurrentPage}
            setSelectedTableForOrder={setSelectedTableForOrder}
          />
        );
      case 'orders':
        return (
          <OrdersPage
            setCurrentPage={setCurrentPage}
            initialSelectedTable={selectedTableForOrder}
          />
        );
      case 'kitchen':
        return <KitchenPage />;
      case 'menu':
        return <MenuPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'customers':
        return <CustomersPage />;
      case 'reservations':
        return <ReservationsPage />;
      case 'billing':
        return <BillingPage />;
      case 'staff':
        return <StaffPage />;
      case 'reports':
        return <ReportsPage />;
      case 'notifications':
        return <NotificationsPage setCurrentPage={setCurrentPage} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        badges={badges}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        <Header
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setIsMobileOpen={setIsMobileOpen}
          unreadNotifCount={badges.unreadNotifs}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
