import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { WalletCards, Plus, TrendingDown, Calendar, PieChart, Trash2 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.PURCHASE);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    onAddExpense({
      date: new Date(date).toISOString(),
      amount: parseInt(amount),
      category,
      description: description || category
    });

    setAmount('');
    setDescription('');
    // Keep date and category for faster entry
  };

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalMonth = monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Group by Category for Pie Chart
    const byCategory: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    return { totalMonth, chartData };
  }, [expenses]);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#6b7280'];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-140px)]">
      
      {/* Left Column: Form & Summary */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6 h-auto lg:h-full">
        
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <WalletCards size={48} />
            </div>
            <p className="text-red-100 text-sm font-medium">Dépenses ce mois</p>
            <h2 className="text-4xl font-extrabold mt-2">{stats.totalMonth.toLocaleString()} FCFA</h2>
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center text-xs text-red-100">
                <Calendar size={14} className="mr-1" />
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
        </div>

        {/* Add Expense Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 overflow-y-auto min-h-[400px]">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Plus className="text-red-500" /> Nouvelle Charge
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                        type="date" 
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-200"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.values(ExpenseCategory).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`text-xs py-2 px-2 rounded-lg border transition-all ${
                                    category === cat 
                                    ? 'bg-red-50 border-red-500 text-red-700 font-bold' 
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                    <input 
                        type="number" 
                        required
                        min="0"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-200 font-bold text-lg"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input 
                        type="text" 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Détail optionnel..."
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-200"
                    />
                </div>

                <button 
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-100 transition-all mt-2"
                >
                    Enregistrer la dépense
                </button>
            </form>
        </div>
      </div>

      {/* Right Column: List & Charts */}
      <div className="flex-1 flex flex-col gap-6 h-auto lg:h-full">
          
          {/* Chart Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-64 shrink-0 flex flex-col">
             <div className="flex-1 min-h-0 relative">
                 <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase tracking-wider flex items-center gap-2 absolute top-0 left-0">
                    <PieChart size={16} /> Répartition Mensuelle
                 </h3>
                 <div className="pt-6 h-full">
                     {stats.chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={stats.chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: number) => val.toLocaleString() + ' F'} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </RePieChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Pas encore de données ce mois-ci.
                        </div>
                     )}
                 </div>
             </div>
          </div>

          {/* List Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col h-[500px] lg:h-full overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50">
                 <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Historique</h3>
             </div>
             <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-100">
                        {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                            <tr key={exp.id} className="hover:bg-gray-50 group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-50 text-red-600 rounded-full">
                                            <TrendingDown size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{exp.category}</p>
                                            <p className="text-xs text-gray-500">{exp.description}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <p className="font-bold text-red-600">-{exp.amount.toLocaleString()} F</p>
                                        <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short'})}</p>
                                    </div>
                                </td>
                                <td className="w-10 pr-4">
                                    <button 
                                        onClick={() => onDeleteExpense(exp.id)}
                                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-2"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {expenses.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-400">Aucune dépense enregistrée.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
      </div>

    </div>
  );
};

export default Expenses;