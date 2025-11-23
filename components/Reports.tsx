import React, { useState, useMemo } from 'react';
import { Sale, Expense, Customer, PaymentStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Printer, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Award, 
  PieChart as PieChartIcon 
} from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
}

type TimeRange = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

const Reports: React.FC<ReportsProps> = ({ sales, expenses, customers }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('MONTH');
  
  // --- LOGIC & CALCULATIONS ---
  
  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfPeriod = new Date();

    if (timeRange === 'DAY') {
        startOfPeriod.setHours(0, 0, 0, 0);
    } else if (timeRange === 'WEEK') {
        const day = now.getDay() || 7;
        if(day !== 1) startOfPeriod.setHours(-24 * (day - 1));
        startOfPeriod.setHours(0, 0, 0, 0);
    } else if (timeRange === 'MONTH') {
        startOfPeriod.setDate(1);
        startOfPeriod.setHours(0, 0, 0, 0);
    } else if (timeRange === 'YEAR') {
        startOfPeriod.setMonth(0, 1);
        startOfPeriod.setHours(0, 0, 0, 0);
    }

    const periodSales = sales.filter(s => new Date(s.date) >= startOfPeriod);
    const periodExpenses = expenses.filter(e => new Date(e.date) >= startOfPeriod);

    return { periodSales, periodExpenses, startOfPeriod };
  }, [sales, expenses, timeRange]);

  const financials = useMemo(() => {
    const revenue = filteredData.periodSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalExpenses = filteredData.periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = revenue - totalExpenses;
    const salesCount = filteredData.periodSales.reduce((sum, s) => sum + s.quantity, 0);

    return { revenue, totalExpenses, netProfit, salesCount };
  }, [filteredData]);

  const charts = useMemo(() => {
    // 1. Sales by Caliber (Pie)
    const byCaliber: Record<string, number> = {};
    filteredData.periodSales.forEach(s => {
        byCaliber[s.caliber] = (byCaliber[s.caliber] || 0) + s.quantity;
    });
    const caliberData = Object.entries(byCaliber).map(([name, value]) => ({ name, value }));

    // 2. Daily Evolution (Bar)
    // Group sales and expenses by day
    const dailyStats: Record<string, { date: string, revenue: number, expense: number }> = {};
    
    // Helper to format date key
    const getKey = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

    filteredData.periodSales.forEach(s => {
        const k = getKey(s.date);
        if (!dailyStats[k]) dailyStats[k] = { date: k, revenue: 0, expense: 0 };
        dailyStats[k].revenue += s.totalPrice;
    });

    filteredData.periodExpenses.forEach(e => {
        const k = getKey(e.date);
        if (!dailyStats[k]) dailyStats[k] = { date: k, revenue: 0, expense: 0 };
        dailyStats[k].expense += e.amount;
    });

    // Sort by date logic (simplified by just sorting keys or relying on array order if constructed sequentially)
    // For simplicity, we just take values and maybe sort by splitting the date string if needed, 
    // but usually user enters data sequentially. Let's sort properly.
    const evolutionData = Object.values(dailyStats).sort((a,b) => {
        const [dA, mA] = a.date.split('/').map(Number);
        const [dB, mB] = b.date.split('/').map(Number);
        return (mA - mB) || (dA - dB);
    });

    return { caliberData, evolutionData };
  }, [filteredData]);

  const topCustomers = useMemo(() => {
    const customerMap: Record<string, number> = {};
    filteredData.periodSales.forEach(s => {
        if (s.customerName) {
            customerMap[s.customerName] = (customerMap[s.customerName] || 0) + s.totalPrice;
        }
    });
    return Object.entries(customerMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, total]) => ({ name, total }));
  }, [filteredData]);

  const COLORS = ['#f59e0b', '#d97706', '#b45309', '#78350f'];

  const handlePrint = () => {
    window.print();
  };

  const getTitle = () => {
    switch(timeRange) {
        case 'DAY': return "Rapport Journalier";
        case 'WEEK': return "Rapport Hebdomadaire";
        case 'MONTH': return "Rapport Mensuel";
        case 'YEAR': return "Rapport Annuel";
    }
  };

  return (
    <div className="p-2 md:p-0">
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="text-egg-600" /> Rapports & Statistiques
                </h2>
                <p className="text-gray-500 text-sm">Analysez la performance de votre activité.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as TimeRange[]).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                            timeRange === range 
                            ? 'bg-egg-500 text-white shadow' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {range === 'DAY' ? 'Jour' : range === 'WEEK' ? 'Semaine' : range === 'MONTH' ? 'Mois' : 'Année'}
                    </button>
                ))}
            </div>

            <button 
                onClick={handlePrint}
                className="bg-gray-800 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-900 shadow-lg"
            >
                <Printer size={18} /> Imprimer
            </button>
        </div>

        {/* PRINTABLE HEADER */}
        <div className="hidden print:block mb-8 text-center border-b border-gray-200 pb-4">
            <h1 className="text-3xl font-bold text-gray-800">ŒufMaster Pro</h1>
            <h2 className="text-xl text-gray-600 mt-2">{getTitle()}</h2>
            <p className="text-sm text-gray-400">Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
        </div>

        {/* FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 m-3 bg-green-50 text-green-600 rounded-full">
                    <TrendingUp size={24} />
                </div>
                <p className="text-gray-500 font-medium text-sm">Chiffre d'Affaires</p>
                <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{financials.revenue.toLocaleString()} F</h3>
                <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                    <Award size={12} /> {financials.salesCount} plateaux vendus
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 m-3 bg-red-50 text-red-600 rounded-full">
                    <TrendingDown size={24} />
                </div>
                <p className="text-gray-500 font-medium text-sm">Total Dépenses</p>
                <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{financials.totalExpenses.toLocaleString()} F</h3>
                <p className="text-xs text-red-500 mt-2">Charges et achats inclus</p>
            </div>

            <div className={`p-6 rounded-2xl shadow-lg relative overflow-hidden text-white ${financials.netProfit >= 0 ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
                <div className="absolute top-0 right-0 p-3 m-3 bg-white/10 rounded-full">
                    <DollarSign size={24} />
                </div>
                <p className="text-white/70 font-medium text-sm">Résultat Net (Bénéfice/Perte)</p>
                <h3 className="text-4xl font-extrabold mt-2">{financials.netProfit.toLocaleString()} F</h3>
                <div className="mt-3 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/80" style={{ width: `${Math.min(100, (financials.revenue / (financials.revenue + financials.totalExpenses || 1)) * 100)}%` }}></div>
                </div>
            </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:break-inside-avoid">
            
            {/* Sales Evolution Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px] flex flex-col">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" /> Évolution (Ventes vs Dépenses)
                </h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="date" tick={{fontSize: 10, fill:'#9ca3af'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize: 10, fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                                formatter={(value: number) => value.toLocaleString() + ' F'}
                            />
                            <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                            <Bar dataKey="revenue" name="Ventes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sales by Caliber Pie */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px] flex flex-col">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <PieChartIcon size={18} className="text-purple-500" /> Répartition par Calibre
                </h3>
                <div className="flex-1 min-h-0 relative">
                     {charts.caliberData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={charts.caliberData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {charts.caliberData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="middle" align="right" layout="vertical" />
                            </PieChart>
                        </ResponsiveContainer>
                     ) : (
                         <div className="flex items-center justify-center h-full text-gray-400 text-sm">Aucune donnée disponible.</div>
                     )}
                     
                     {/* Center Total */}
                     {charts.caliberData.length > 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-24">
                            <span className="text-3xl font-bold text-gray-800">{financials.salesCount}</span>
                            <span className="text-xs text-gray-500 uppercase">Plateaux</span>
                        </div>
                     )}
                </div>
            </div>
        </div>

        {/* TOP CUSTOMERS & DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Customers */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:break-inside-avoid">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">🏆 Top Clients</h3>
                </div>
                <div className="p-4">
                    {topCustomers.length > 0 ? (
                        <div className="space-y-4">
                            {topCustomers.map((customer, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-gray-700 text-sm">{customer.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{customer.total.toLocaleString()} F</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 text-sm py-4">Pas de données clients.</p>
                    )}
                </div>
            </div>

            {/* Financial Details Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-gray-300">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Détail des Opérations</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                            <th className="p-3 font-normal">Type</th>
                            <th className="p-3 font-normal">Quantité / Note</th>
                            <th className="p-3 font-normal text-right">Montant</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {/* Summary Row Sales */}
                        <tr>
                            <td className="p-3 font-bold text-gray-800">Ventes de Plateaux</td>
                            <td className="p-3 text-gray-600">{financials.salesCount} plateaux vendus</td>
                            <td className="p-3 font-bold text-green-600 text-right">+ {financials.revenue.toLocaleString()} F</td>
                        </tr>
                        {/* Summary Row Expenses */}
                         <tr>
                            <td className="p-3 font-bold text-gray-800">Charges & Dépenses</td>
                            <td className="p-3 text-gray-600">{filteredData.periodExpenses.length} transactions</td>
                            <td className="p-3 font-bold text-red-600 text-right">- {financials.totalExpenses.toLocaleString()} F</td>
                        </tr>
                        {/* Divider */}
                        <tr className="bg-gray-50 font-bold text-base">
                            <td className="p-3 text-gray-900">Résultat Net</td>
                            <td className="p-3"></td>
                            <td className={`p-3 text-right ${financials.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {financials.netProfit.toLocaleString()} F
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>

        {/* FOOTER FOR PRINT */}
        <div className="hidden print:block mt-8 text-center text-xs text-gray-400">
            <p>Document généré électroniquement par ŒufMaster Pro. Valable sans signature.</p>
        </div>
    </div>
  );
};

export default Reports;