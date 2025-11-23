import React from 'react';
import { View } from '../types';
import { LayoutDashboard, ShoppingCart, Package, Users, WalletCards, LogOut, Globe, BarChart3 } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  pendingOrdersCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, pendingOrdersCount = 0 }) => {
  const menuItems: { id: View; label: string; icon: any; badge?: number }[] = [
    { id: 'DASHBOARD', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'SALES', label: 'Point de Vente', icon: ShoppingCart },
    { id: 'ORDERS', label: 'Commandes Web', icon: Globe, badge: pendingOrdersCount },
    { id: 'INVENTORY', label: 'Stock & Inventaire', icon: Package },
    { id: 'CUSTOMERS', label: 'Clients', icon: Users },
    { id: 'EXPENSES', label: 'Dépenses & Charges', icon: WalletCards },
    { id: 'REPORTS', label: 'Rapports & Stats', icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col hidden md:flex sticky top-0 print:hidden">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-egg-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-egg-200">
          Œ
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg">ŒufMaster</h1>
          <p className="text-xs text-gray-500">Pro Edition</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-egg-50 text-egg-800 font-semibold shadow-sm ring-1 ring-egg-200' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={isActive ? 'text-egg-600' : 'text-gray-400'} />
                {item.label}
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;