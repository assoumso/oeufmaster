import React, { useState } from 'react';
import { InventoryLog, EggCaliber } from '../types';
import { PlusCircle, MinusCircle, History, AlertCircle, Package } from 'lucide-react';

interface InventoryProps {
  stocks: Record<string, number>;
  logs: InventoryLog[];
  onUpdateStock: (amount: number, type: 'ADD' | 'REMOVE', caliber: EggCaliber, notes: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ stocks, logs, onUpdateStock }) => {
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [actionType, setActionType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [selectedCaliber, setSelectedCaliber] = useState<EggCaliber>(EggCaliber.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    onUpdateStock(amount, actionType, selectedCaliber, notes);
    setAmount(0);
    setNotes('');
  };

  // Configuration visuelle par calibre
  const caliberConfig: Record<string, { color: string, bg: string, ring: string }> = {
    [EggCaliber.SMALL]: { color: 'text-yellow-700', bg: 'bg-yellow-50', ring: 'ring-yellow-200' },
    [EggCaliber.MEDIUM]: { color: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-200' },
    [EggCaliber.LARGE]: { color: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-200' },
    [EggCaliber.JUMBO]: { color: 'text-purple-700', bg: 'bg-purple-50', ring: 'ring-purple-200' },
  };

  const getStockLevel = (qty: number) => {
    if (qty <= 10) return { label: 'CRITIQUE', class: 'text-red-600 bg-red-100' };
    if (qty <= 50) return { label: 'BAS', class: 'text-orange-600 bg-orange-100' };
    return { label: 'OK', class: 'text-green-600 bg-green-100' };
  };

  return (
    <div className="space-y-8">
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.values(EggCaliber).map((cal) => {
          const qty = stocks[cal] || 0;
          const config = caliberConfig[cal];
          const level = getStockLevel(qty);
          
          return (
            <div key={cal} className={`relative p-6 rounded-2xl border-2 transition-all hover:shadow-md ${config.bg} ${config.color} border-transparent hover:border-gray-200`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Package size={20} className="opacity-70" />
                  <span className="font-bold uppercase tracking-wider text-sm">{cal}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${level.class}`}>
                  {level.label}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{qty}</span>
                <span className="text-sm font-medium opacity-70">pl.</span>
              </div>
              <p className="text-xs opacity-60 mt-1">~{(qty * 30).toLocaleString()} œufs</p>

              {qty <= 10 && (
                 <div className="absolute bottom-4 right-4 animate-pulse text-red-600">
                    <AlertCircle size={20} />
                 </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Action Form */}
        <div className="flex-1 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <History className="text-egg-500" /> Mouvement de Stock
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Action Switcher */}
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActionType('ADD')}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all ${
                  actionType === 'ADD' 
                    ? 'bg-white text-green-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <PlusCircle size={18} /> Approvisionnement
              </button>
              <button
                type="button"
                onClick={() => setActionType('REMOVE')}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all ${
                  actionType === 'REMOVE' 
                    ? 'bg-white text-red-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MinusCircle size={18} /> Perte / Don
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de Plateau</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(EggCaliber).map((cal) => (
                    <button
                      key={cal}
                      type="button"
                      onClick={() => setSelectedCaliber(cal)}
                      className={`py-2 px-3 rounded-lg text-sm border font-medium transition-all ${
                        selectedCaliber === cal
                          ? 'bg-egg-50 border-egg-500 text-egg-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cal}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantité (Plateaux)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg p-3 pl-4 pr-12 focus:ring-2 focus:ring-egg-500 focus:border-egg-500 outline-none"
                    placeholder="0"
                    required
                  />
                  <div className="absolute right-3 top-3 text-gray-400 text-sm">pl.</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                   1 Plateau = 30 Œufs (Standard)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note / Motif</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-egg-500 focus:border-egg-500 outline-none"
                placeholder={actionType === 'ADD' ? "Ex: Récolte Bâtiment B" : "Ex: Casse transport"}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                actionType === 'ADD' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'
              }`}
            >
              Confirmer {actionType === 'ADD' ? "l'ajout" : 'le retrait'}
            </button>
          </form>
        </div>

        {/* Recent History Table */}
        <div className="lg:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Derniers Mouvements</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {logs.slice().reverse().map((log) => (
                  <tr key={log.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          log.type === 'ADD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.type === 'ADD' ? '+' : '-'}{log.quantity}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.date).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">{log.caliber || 'N/A'}</span>
                        <span className="text-xs text-gray-500 max-w-[100px] truncate">{log.notes}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                   <tr><td className="p-8 text-center text-gray-400 text-sm">Aucun historique.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;