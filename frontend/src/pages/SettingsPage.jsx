import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  DollarSign,
  Percent,
  Clock,
  FileText,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    restaurant_name: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    currency_symbol: '₹',
    tax_rate_percent: '5.0',
    service_charge_percent: '0.0',
    opening_time: '10:00',
    closing_time: '23:00',
    receipt_footer: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      showToast('Restaurant settings saved successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      await api.resetDemoData();
      showToast('Database reset to fresh realistic sample data!', 'success');
      setIsResetConfirmOpen(false);
      window.location.reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Restaurant Settings & Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure business information, currency, default tax rates, opening hours, and receipt footers
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Business Profile & Contact</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Restaurant Name *</label>
              <input
                type="text"
                required
                value={settings.restaurant_name}
                onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
        </div>

        {/* Currency & Financial Rates Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Percent className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Tax & Financial Settings</h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.currency_symbol}
                onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-center text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Standard GST / Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.tax_rate_percent}
                onChange={(e) => setSettings({ ...settings, tax_rate_percent: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Charge (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.service_charge_percent}
                onChange={(e) => setSettings({ ...settings, service_charge_percent: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Hours & Receipt Customization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Operating Hours & Receipt Footer</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Opening Time</label>
              <input
                type="time"
                value={settings.opening_time}
                onChange={(e) => setSettings({ ...settings, opening_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Closing Time</label>
              <input
                type="time"
                value={settings.closing_time}
                onChange={(e) => setSettings({ ...settings, closing_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">Printed Receipt Footer Note</label>
            <input
              type="text"
              value={settings.receipt_footer}
              onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
              placeholder="e.g. Thank you for dining with DineFlow! Please visit us again."
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
        </div>

        {/* Save CTA */}
        {hasRole('owner', 'manager') && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Demo Reset Danger Zone (Only Owner) */}
      {hasRole('owner') && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-3 mt-8">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Reset Demo Database Environment</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            Need to refresh the system? This action re-seeds the database with the complete pristine sample dataset:
            15 tables, 40 menu items, 20 customers, 10 staff members, 10 suppliers, and active orders.
          </p>
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-seed Demo Data</span>
          </button>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Reset Entire Database to Sample State?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            This will wipe and re-initialize all tables, orders, customers, bills, inventory stock, and staff with fresh realistic sample data.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleResetDemoData}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Yes, Reset Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
