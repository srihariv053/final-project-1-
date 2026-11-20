import React, { useState } from 'react';
import { Flame, LogIn, ShieldCheck, UserCheck, CreditCard, UtensilsCrossed, ChefHat, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, quickSwitchRole } = useAuth();
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      // toast shown in context
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Owner', user: 'owner', label: 'Vikram Sharma', desc: 'Full admin access to all operational & financial modules', icon: ShieldCheck, color: 'text-amber-500 bg-amber-50 border-amber-200 hover:border-amber-400' },
    { role: 'Manager', user: 'manager', label: 'Ananya Roy', desc: 'Daily operations, menus, suppliers, staff & analytics', icon: UserCheck, color: 'text-indigo-500 bg-indigo-50 border-indigo-200 hover:border-indigo-400' },
    { role: 'Cashier', user: 'cashier', label: 'Rahul Verma', desc: 'Point of sale, invoice generation, checkout & payment settlement', icon: CreditCard, color: 'text-emerald-500 bg-emerald-50 border-emerald-200 hover:border-emerald-400' },
    { role: 'Waiter', user: 'waiter', label: 'Karan Singh', desc: 'Table status, order creation, customer requests & reservations', icon: UtensilsCrossed, color: 'text-blue-500 bg-blue-50 border-blue-200 hover:border-blue-400' },
    { role: 'Kitchen', user: 'chef', label: 'Sanjay Kapoor', desc: 'Kitchen Display System (KDS), ticket timing & order preparation', icon: ChefHat, color: 'text-rose-500 bg-rose-50 border-rose-200 hover:border-rose-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid md:grid-cols-5 gap-8 items-center">
        {/* Left: Branding & Role Quick Click */}
        <div className="md:col-span-3 space-y-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-300 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
              <Flame className="w-7 h-7 fill-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">DineFlow</h1>
              <p className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">Restaurant Management System</p>
            </div>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">
            Centralized restaurant operations platform. Seamlessly coordinate tables, orders, kitchen display,
            inventory recipe deductions, billing settlement, reservations, and real-time sales reporting.
          </p>

          {/* Quick Demo Switcher Cards */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Instant Demo Login (1-Click Access)</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.user}
                    onClick={() => quickSwitchRole(acc.user)}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 flex items-start gap-3 bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-emerald-500/60 group`}
                  >
                    <div className="p-2 rounded-lg bg-slate-900/60 shrink-0">
                      <Icon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{acc.role}</span>
                        <span className="text-[10px] text-slate-400 font-mono">@{acc.user}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{acc.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Manual Login Form Card */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
          <div className="mb-6 text-left">
            <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">Access your DineFlow workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="owner, manager, cashier, waiter..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            Demo password: <span className="font-mono text-slate-600 font-semibold">password123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
