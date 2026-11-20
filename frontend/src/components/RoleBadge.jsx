import React from 'react';
import { ShieldCheck, UserCheck, CreditCard, UtensilsCrossed, ChefHat } from 'lucide-react';

export default function RoleBadge({ role, size = 'md' }) {
  const normalized = (role || '').toLowerCase();
  
  const roleConfig = {
    owner: {
      label: 'Restaurant Owner',
      bg: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: ShieldCheck,
      iconColor: 'text-amber-600'
    },
    manager: {
      label: 'Manager',
      bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: UserCheck,
      iconColor: 'text-indigo-600'
    },
    cashier: {
      label: 'Cashier',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: CreditCard,
      iconColor: 'text-emerald-600'
    },
    waiter: {
      label: 'Waiter',
      bg: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: UtensilsCrossed,
      iconColor: 'text-blue-600'
    },
    kitchen: {
      label: 'Kitchen Staff',
      bg: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: ChefHat,
      iconColor: 'text-rose-600'
    }
  };

  const config = roleConfig[normalized] || {
    label: role,
    bg: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: UserCheck,
    iconColor: 'text-slate-600'
  };

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bg} ${padding}`}>
      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
      <span>{config.label}</span>
    </span>
  );
}
