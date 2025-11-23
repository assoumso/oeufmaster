import React, { useMemo } from 'react';
import { Sale, PaymentStatus, Expense } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  Wallet,
  Clock,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
  inventory: Record<string, number>;
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ sales, inventory, expenses }) => {
  
  // --- Calculs et Logique ---
  const totalStock = (Object.values(inventory) as number[]).reduce((acc, curr) => acc + curr, 0);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Début de la semaine (Lundi)
    const day = now.getDay() || 7; 
    if(day !== 1) now.setHours(-24 * (day - 1));
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Début du mois
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    let salesToday = 0;
    let revenueToday = 0;
    let salesWeek = 0;
    let revenueWeek = 0;
    let salesMonth = 0;
    let revenueMonth = 0;
    let pendingAmount = 0;
    let pendingCount = 0;

    // Ventes
    sales.forEach(sale => {
      const saleDate = new Date(sale.date).getTime();
      
      if (saleDate >= startOfDay) {
        salesToday += sale.quantity;
        revenueToday += sale.totalPrice;
      }
      if (saleDate >= startOfWeek) {
        salesWeek += sale.quantity;
        revenueWeek += sale.totalPrice;
      }
      if (saleDate >= startOfMonth) {
        salesMonth += sale.quantity;
        revenueMonth += sale.totalPrice;
      }

      if (sale.status === PaymentStatus.PENDING) {
        pendingAmount += sale.totalPrice;
        pendingCount += 1;
      }
    });

    // Dépenses du mois
    const expensesMonth = expenses.filter(e => new Date(e.date).getTime() >= startOfMonth)
                                  .reduce((acc, curr) => acc + curr.amount, 0);

    // Bénéfice Net Réel = Chiffre d'Affaires - Dépenses
    const netProfit = revenueMonth - expensesMonth;

    return {
      salesToday, revenueToday,
      salesWeek, revenueWeek,
      salesMonth, revenueMonth,
      pendingAmount, pendingCount,
      netProfit,
      expensesMonth
    };
  }, [sales, expenses]);

  // Données pour le graphique (7 derniers jours)
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const daySales = sales.filter(s => s.date.startsWith(dateStr));
      const revenue = daySales.reduce((sum, s) => sum + s.totalPrice, 0);
      
      days.push({
        date: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        revenue,
      });
    }
    return days;
  }, [sales]);

  const pendingOrders = sales
    .filter(s => s.status === PaymentStatus.PENDING)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const STOCK_CRITICAL = 50;
  const STOCK_WARNING = 150;
  
  const getStockStatus = () => {
    if (totalStock <= STOCK_CRITICAL) return { label: 'CRITIQUE', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
    if (totalStock <= STOCK_WARNING) return { label: 'FAIBLE', color: 'text-orange-500', bg: 'bg-orange-100', icon: AlertTriangle };
    return { label: 'CONFORTABLE', color: 'text-green-600', bg: 'bg-green-100', icon: Package };
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tableau de Bord</h2>
          <p className="text-gray-500 text-sm">Aperçu de la rentabilité et de l'activité</p>
        </div>
        <div className="mt-2 md:mt-0 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-600 font-medium flex items-center gap-2">
          <Calendar size={16} />
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      {/* 1. Ligne Principale : Stock & Impayés & Rentabilité */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARTE STOCK */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-3 m-4 rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
            <StockIcon size={24} />
          </div>
          <p className="text-gray-500 font-medium text-sm">Stock Total</p>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-gray-800">{totalStock}</h3>
            <span className="text-gray-500 font-medium">plateaux</span>
          </div>
          <div className="flex gap-2 mt-2">
             {Object.entries(inventory).map(([cal, qty]) => (
                (qty as number) < 20 ? 
                <span key={cal} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                  {cal.charAt(0)}!
                </span> : null
             ))}
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-sm">
             <span className={`font-bold ${stockStatus.color}`}>{stockStatus.label}</span>
          </div>
        </div>

        {/* CARTE RENTABILITÉ MENSUELLE (REALISTE) */}
        <div className={`p-6 rounded-2xl shadow-lg text-white relative overflow-hidden bg-gradient-to-br ${stats.netProfit >= 0 ? 'from-green-600 to-green-800' : 'from-red-500 to-red-700'}`}>
          <div className="absolute top-0 right-0 p-3 m-4 rounded-full bg-white/20 text-white">
            <Wallet size={24} />
          </div>
          <p className="text-green-50 font-medium text-sm">Bénéfice Net (Ce mois)</p>
          <div className="mt-4">
            <h3 className="text-4xl font-extrabold text-white">{stats.netProfit.toLocaleString()} <span className="text-lg">F</span></h3>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-green-100 border-t border-white/20 pt-3">
             <div className="flex items-center gap-1">
                <TrendingUp size={12} /> Ventes: {stats.revenueMonth.toLocaleString()}
             </div>
             <div className="flex items-center gap-1">
                <TrendingDown size={12} /> Charges: {stats.expensesMonth.toLocaleString()}
             </div>
          </div>
        </div>

        {/* CARTE IMPAYÉS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 m-4 rounded-full bg-orange-100 text-orange-600">
            <Clock size={24} />
          </div>
          <p className="text-gray-500 font-medium text-sm">Impayés / En attente</p>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-orange-600">{stats.pendingAmount.toLocaleString()}</h3>
            <span className="text-orange-600 font-medium text-sm">FCFA</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{stats.pendingCount} commandes en attente</p>
        </div>

      </div>

      {/* 2. Statistiques Ventes Temporelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Aujourd'hui</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.revenueToday.toLocaleString()} F</p>
            <p className="text-xs text-gray-400">{stats.salesToday} plateaux</p>
          </div>
          <div className="h-10 w-1 bg-green-500 rounded-full"></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Cette Semaine</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.revenueWeek.toLocaleString()} F</p>
            <p className="text-xs text-gray-400">{stats.salesWeek} plateaux</p>
          </div>
          <div className="h-10 w-1 bg-blue-500 rounded-full"></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Ce Mois</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.revenueMonth.toLocaleString()} F</p>
            <p className="text-xs text-gray-400">{stats.salesMonth} plateaux</p>
          </div>
          <div className="h-10 w-1 bg-purple-500 rounded-full"></div>
        </div>
      </div>

      {/* 3. Graphiques et Tableaux détaillés */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Graphique Evolution */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-egg-600" />
            Évolution des Ventes (7 derniers jours)
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: number) => [`${value.toLocaleString()} F`, 'Revenu']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f59e0b" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Liste des Impayés */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-500" />
              Commandes en cours
            </h3>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              {pendingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((sale) => (
                <div key={sale.id} className="p-3 rounded-lg border border-orange-100 bg-orange-50/50 hover:bg-orange-50 transition-colors group">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-800">{sale.customerName}</p>
                    <p className="font-bold text-orange-600">{sale.totalPrice.toLocaleString()} F</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>{new Date(sale.date).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})} • {sale.quantity} pl. ({sale.caliber || '?'})</span>
                    <span className="flex items-center gap-1 text-orange-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      En attente <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                <div className="p-4 bg-gray-50 rounded-full mb-3">
                  <DollarSign size={24} className="text-green-500" />
                </div>
                <p className="text-sm">Aucun impayé.</p>
                <p className="text-xs mt-1">Tout est en ordre !</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;