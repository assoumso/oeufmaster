import React, { useState } from 'react';
import { Sale, PaymentStatus, EggCaliber, Customer } from '../types';
import { 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search, 
  AlertCircle, 
  UserPlus
} from 'lucide-react';

interface SalesProps {
  sales: Sale[];
  stocks: Record<string, number>;
  customers: Customer[];
  onNewSale: (sale: Omit<Sale, 'id' | 'date'>) => Promise<string | null>;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'debt'>) => Promise<string | null>;
}

const Sales: React.FC<SalesProps> = ({ sales, stocks, customers, onNewSale, onAddCustomer }) => {
  // State for POS
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  
  const [quantity, setQuantity] = useState(1);
  const [caliber, setCaliber] = useState<EggCaliber>(EggCaliber.MEDIUM);
  const [unitPrice, setUnitPrice] = useState(2500);
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for New Customer Modal
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', type: 'INDIVIDUAL' as const });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const totalPrice = quantity * unitPrice;
  const currentStockForCaliber = stocks[caliber] || 0;
  
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  // Filter Logic
  const filteredSales = sales
    .filter(s => s.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > currentStockForCaliber) return;

    await onNewSale({
      customerName,
      customerId: selectedCustomerId,
      caliber,
      quantity,
      unitPrice,
      totalPrice,
      status
    });
    
    // Reset
    setCustomerName('');
    setSelectedCustomerId(undefined);
    setQuantity(1);
    setStatus(PaymentStatus.PAID);
  };

  const handleQuickCustomerCreate = async () => {
     if (!newCustomerData.name) return;
     setIsCreatingCustomer(true);
     
     try {
       // Création réelle en BDD via la fonction passée en props
       const newId = await onAddCustomer({
           name: newCustomerData.name,
           phone: newCustomerData.phone,
           type: 'INDIVIDUAL'
       });

       if (newId) {
           setCustomerName(newCustomerData.name);
           setSelectedCustomerId(newId);
           setShowNewCustomerModal(false);
           setNewCustomerData({ name: '', phone: '', type: 'INDIVIDUAL' });
       }
     } catch (e) {
         console.error("Erreur création client rapide", e);
     } finally {
         setIsCreatingCustomer(false);
     }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerName.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      
        <div className="flex flex-col xl:flex-row gap-6 h-full">
          {/* New Sale Form */}
          <div className="w-full xl:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <ShoppingCart className="text-egg-600" /> Nouvelle Vente
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative z-20">
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => {
                          setCustomerName(e.target.value);
                          setShowCustomerSuggestions(true);
                          const existing = customers.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                          setSelectedCustomerId(existing?.id);
                      }}
                      onFocus={() => setShowCustomerSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-egg-500 outline-none"
                      placeholder="Rechercher ou saisir..."
                      autoComplete="off"
                    />
                    
                    {/* Custom Dropdown Suggestions */}
                    {showCustomerSuggestions && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto z-50">
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(c => (
                                    <div 
                                        key={c.id}
                                        className="px-4 py-3 hover:bg-egg-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center group"
                                        onMouseDown={() => {
                                            // Utilisation de onMouseDown au lieu de onClick pour prendre la priorité sur le onBlur de l'input
                                            setCustomerName(c.name);
                                            setSelectedCustomerId(c.id);
                                            setShowCustomerSuggestions(false);
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800 group-hover:text-egg-700">{c.name}</span>
                                            {c.debt > 0 && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10} /> Dette: {c.debt.toLocaleString()} F</span>}
                                        </div>
                                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full group-hover:bg-egg-100 group-hover:text-egg-700">{c.phone}</span>
                                    </div>
                                ))
                            ) : (
                                customerName && (
                                    <div className="px-4 py-3 text-sm text-gray-400 italic">Aucun client existant trouvé.</div>
                                )
                            )}
                        </div>
                    )}

                    {selectedCustomerId && <CheckCircle size={16} className="absolute right-3 top-4 text-green-500 pointer-events-none" />}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="p-3 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                    title="Nouveau Client Rapide"
                  >
                    <UserPlus size={20} />
                  </button>
                </div>
                
                {selectedCustomerObj && selectedCustomerObj.debt > 0 && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-800 animate-pulse">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                          <span className="font-bold">Attention:</span> Ce client a une dette de {selectedCustomerObj.debt.toLocaleString()} F.
                      </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calibre</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(EggCaliber).map((cal) => (
                    <button
                      key={cal}
                      type="button"
                      onClick={() => setCaliber(cal)}
                      className={`py-2 px-2 text-sm rounded-lg border transition-all ${
                        caliber === cal 
                        ? 'bg-egg-50 border-egg-500 text-egg-800 font-bold' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cal}
                      <span className={`block text-xs font-normal ${stocks[cal] < 10 ? 'text-red-500' : 'text-gray-400'}`}>
                        Stock: {stocks[cal] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    max={currentStockForCaliber}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className={`w-full border rounded-lg p-3 outline-none focus:ring-2 ${
                      quantity > currentStockForCaliber 
                      ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                      : 'border-gray-300 focus:ring-egg-500'
                    }`}
                  />
                  {quantity > currentStockForCaliber && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12}/> Stock insuffisant
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix Unitaire</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-egg-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                <span className="font-medium text-gray-600">Total à payer</span>
                <span className="text-xl font-bold text-egg-700">{totalPrice.toLocaleString()} F</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut Paiement</label>
                <div className="grid grid-cols-3 gap-2">
                  {[PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.CANCELLED].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`py-2 px-1 text-sm rounded-md border ${
                        status === s 
                        ? 'bg-gray-800 text-white border-gray-800' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={currentStockForCaliber < quantity || quantity <= 0}
                className="w-full bg-egg-600 hover:bg-egg-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-egg-200 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer la Vente
              </button>
            </form>
          </div>

          {/* Sales List */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800">Historique des Ventes</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-egg-500"
                />
              </div>
            </div>

            <div className="overflow-auto flex-1 p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Calibre</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Qté</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(sale.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 font-medium text-gray-900">{sale.customerName}</td>
                      <td className="p-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-700">{sale.caliber || 'Std'}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{sale.quantity}</td>
                      <td className="p-4 font-bold text-gray-900">{sale.totalPrice.toLocaleString()} F</td>
                      <td className="p-4 flex justify-center">
                        {sale.status === PaymentStatus.PAID && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1"/> Payé</span>}
                        {sale.status === PaymentStatus.PENDING && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1"/> Attente</span>}
                        {sale.status === PaymentStatus.CANCELLED && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1"/> Annulé</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Quick Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Nouveau Client Rapide</h3>
            <input 
              className="w-full border rounded-lg p-3 mb-3"
              placeholder="Nom"
              value={newCustomerData.name}
              onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})}
            />
             <input 
              className="w-full border rounded-lg p-3 mb-4"
              placeholder="Téléphone"
              value={newCustomerData.phone}
              onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNewCustomerModal(false)} className="flex-1 py-3 text-gray-600">Annuler</button>
              <button 
                  onClick={handleQuickCustomerCreate} 
                  disabled={isCreatingCustomer}
                  className="flex-1 py-3 bg-egg-600 text-white rounded-xl font-bold flex items-center justify-center"
              >
                  {isCreatingCustomer ? 'Enregistrement...' : 'Utiliser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;