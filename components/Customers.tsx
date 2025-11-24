
import React, { useState } from 'react';
import { Customer, Sale, PaymentStatus } from '../types';
import { 
  Search, 
  UserPlus, 
  Phone, 
  DollarSign, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  ShoppingBag,
  Edit2,
  Trash2,
  Save,
  X,
  CreditCard,
  Users,
  MapPin
} from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'debt'>) => void;
  onPayment: (customerId: string, amount: number) => void;
  onEditCustomer: (customerId: string, data: Partial<Customer>) => void;
  onDeleteCustomer: (customerId: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, sales, onAddCustomer, onPayment, onEditCustomer, onDeleteCustomer }) => {
  const [view, setView] = useState<'LIST' | 'DETAILS' | 'NEW'>('LIST');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DEBTS'>('ALL'); // Onglets Annuaire vs Crédits
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    residence: '',
    type: 'RESELLER' as const
  });

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({});

  // Payment State
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Filters logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchesDebt = activeTab === 'DEBTS' ? c.debt > 0 : true;
    return matchesSearch && matchesDebt;
  });

  const totalDebts = customers.reduce((acc, curr) => acc + curr.debt, 0);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerSales = sales.filter(s => s.customerId === selectedCustomerId);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomer({ ...newCustomer, totalPurchases: 0, debt: 0 });
    setNewCustomer({ name: '', phone: '', residence: '', type: 'RESELLER' });
    setView('LIST');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !paymentAmount) return;
    
    onPayment(selectedCustomerId, parseInt(paymentAmount));
    
    // UI Feedback
    setPaymentSuccess(true);
    setTimeout(() => {
        setPaymentSuccess(false);
        setIsPaymentMode(false);
        setPaymentAmount('');
    }, 1500);
  };

  const handleEditSubmit = () => {
      if(selectedCustomerId && editFormData) {
          onEditCustomer(selectedCustomerId, editFormData);
          setIsEditing(false);
      }
  };

  // --- VIEWS ---

  if (view === 'NEW') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <button onClick={() => setView('LIST')} className="flex items-center text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={18} className="mr-2" /> Retour à la liste
        </button>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <UserPlus className="text-egg-600" /> Nouveau Client
        </h2>

        <form onSubmit={handleAddSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet / Enseigne</label>
            <input
              type="text"
              required
              value={newCustomer.name}
              onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-egg-500 outline-none"
              placeholder="Ex: Boutique Maman Sali"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                required
                value={newCustomer.phone}
                onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-egg-500 outline-none"
                placeholder="Ex: 77 000 00 00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Résidence / Quartier</label>
              <input
                type="text"
                value={newCustomer.residence}
                onChange={e => setNewCustomer({...newCustomer, residence: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-egg-500 outline-none"
                placeholder="Ex: HLM Grand Yoff"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de Client</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'RESELLER', label: 'Revendeur', icon: ShoppingBag },
                { id: 'RESTAURANT', label: 'Restaurant', icon: UserPlus },
                { id: 'INDIVIDUAL', label: 'Particulier', icon: UserPlus },
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setNewCustomer({...newCustomer, type: type.id as any})}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    newCustomer.type === type.id
                      ? 'bg-egg-50 border-egg-500 text-egg-700 font-bold'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-egg-600 hover:bg-egg-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-egg-100 transition-all"
          >
            Enregistrer le Client
          </button>
        </form>
      </div>
    );
  }

  if (view === 'DETAILS' && selectedCustomer) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-140px)]">
        
        {/* Sidebar Info */}
        <div className="w-full lg:w-1/3 space-y-6 h-auto">
          <button onClick={() => setView('LIST')} className="flex items-center text-gray-500 hover:text-gray-800">
            <ArrowLeft size={18} className="mr-2" /> Retour
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative group">
            
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
                {!isEditing ? (
                    <>
                        <button 
                            onClick={() => { setIsEditing(true); setEditFormData({ name: selectedCustomer.name, phone: selectedCustomer.phone, residence: selectedCustomer.residence || '', type: selectedCustomer.type }); }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => { if(selectedCustomer.id) { onDeleteCustomer(selectedCustomer.id); setView('LIST'); } }}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </>
                ) : (
                    <>
                         <button 
                            onClick={handleEditSubmit}
                            className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                        >
                            <Save size={18} />
                        </button>
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </>
                )}
            </div>

            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center text-gray-400 font-bold text-3xl mb-4">
              {selectedCustomer.name.charAt(0)}
            </div>
            
            {isEditing ? (
                <div className="space-y-3">
                    <input 
                        className="w-full border rounded p-2 text-center font-bold text-gray-800"
                        value={editFormData.name}
                        onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                        placeholder="Nom"
                    />
                    <input 
                        className="w-full border rounded p-2 text-center text-sm text-gray-600"
                        value={editFormData.phone}
                        onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                        placeholder="Téléphone"
                    />
                    <input 
                        className="w-full border rounded p-2 text-center text-sm text-gray-600"
                        value={editFormData.residence}
                        onChange={e => setEditFormData({...editFormData, residence: e.target.value})}
                        placeholder="Résidence / Adresse"
                    />
                    <select
                        className="w-full border rounded p-2 text-center text-xs"
                        value={editFormData.type}
                        onChange={e => setEditFormData({...editFormData, type: e.target.value as any})}
                    >
                        <option value="RESELLER">Revendeur</option>
                        <option value="RESTAURANT">Restaurant</option>
                        <option value="INDIVIDUAL">Particulier</option>
                    </select>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-bold text-gray-800 text-center">{selectedCustomer.name}</h2>
                    <div className="flex flex-col items-center gap-1 mt-2 text-gray-500">
                        <span className="flex items-center gap-1 text-sm"><Phone size={14} /> {selectedCustomer.phone}</span>
                        {selectedCustomer.residence && (
                             <span className="flex items-center gap-1 text-sm"><MapPin size={14} /> {selectedCustomer.residence}</span>
                        )}
                    </div>
                    <div className="mt-4 flex justify-center">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wider">
                            {selectedCustomer.type === 'RESELLER' ? 'Revendeur' : selectedCustomer.type === 'RESTAURANT' ? 'Restaurant' : 'Particulier'}
                        </span>
                    </div>
                </>
            )}
          </div>

          <div className={`rounded-xl shadow-sm border p-6 text-white relative overflow-hidden transition-all duration-300 ${selectedCustomer.debt > 0 ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-500' : 'bg-gradient-to-br from-green-500 to-green-600 border-green-500'}`}>
            <p className="text-white/80 text-sm font-medium">Solde actuel (Dette)</p>
            <h3 className="text-3xl font-extrabold mt-1">{selectedCustomer.debt.toLocaleString()} F</h3>
            
            {selectedCustomer.debt > 0 ? (
              <div className="mt-6">
                {!isPaymentMode ? (
                  <button 
                    onClick={() => setIsPaymentMode(true)}
                    className="w-full bg-white text-red-600 py-2 rounded-lg font-bold text-sm shadow hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <DollarSign size={16} /> Régler la dette
                  </button>
                ) : (
                  <form onSubmit={handlePaymentSubmit} className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20">
                    {paymentSuccess ? (
                        <div className="flex flex-col items-center justify-center py-2 text-white animate-fade-in">
                            <CheckCircle size={32} className="mb-1" />
                            <span className="font-bold">Paiement Validé !</span>
                        </div>
                    ) : (
                        <>
                            <label className="text-xs text-white/80 block mb-1 font-bold">Montant encaissé (FCFA)</label>
                            <div className="flex gap-2">
                            <input 
                                type="number" 
                                autoFocus
                                max={selectedCustomer.debt}
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-gray-900 text-sm font-bold outline-none"
                                placeholder="0" 
                            />
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button type="button" onClick={() => setIsPaymentMode(false)} className="flex-1 py-2 text-xs text-white bg-white/10 rounded-lg hover:bg-white/20">
                                    Annuler
                                </button>
                                <button type="submit" className="flex-1 bg-white text-red-600 py-2 rounded-lg font-bold text-sm shadow">
                                    Confirmer
                                </button>
                            </div>
                        </>
                    )}
                  </form>
                )}
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-2 text-green-100 bg-green-600/30 p-3 rounded-xl text-sm font-medium border border-green-400/30">
                <CheckCircle size={18} /> Aucun impayé.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-egg-500" /> Statistiques
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Volume Total</span>
                <span className="font-bold text-gray-900">{(selectedCustomer.totalPurchases / 1).toLocaleString()} F</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Dernier Achat</span>
                <span className="font-medium text-gray-900">
                  {selectedCustomer.lastPurchaseDate ? new Date(selectedCustomer.lastPurchaseDate).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px] lg:h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Historique des Achats</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Détail</th>
                  <th className="px-6 py-3">Montant</th>
                  <th className="px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customerSales.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{sale.quantity} pl.</div>
                      <div className="text-xs text-gray-500">{sale.caliber}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {sale.totalPrice.toLocaleString()} F
                    </td>
                    <td className="px-6 py-4">
                      {sale.status === PaymentStatus.PENDING ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                          Impayé
                        </span>
                      ) : (sale as any).status === 'PARTIAL' ? (
                          <span className="inline-flex flex-col items-start px-2.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            <span>Partiel</span>
                            {(sale as any).amountPaid > 0 && <span className="text-[10px] opacity-75">Payé: {(sale as any).amountPaid.toLocaleString()}F</span>}
                             <span className="text-[10px] font-bold">Reste: {(sale.totalPrice - ((sale as any).amountPaid || 0)).toLocaleString()}F</span>
                          </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Payé
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {customerSales.length === 0 && (
                   <tr><td colSpan={4} className="p-8 text-center text-gray-400">Aucun historique d'achat.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-egg-600" /> Gestion Clients
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('ALL')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'ALL' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Annuaire
                </button>
                <button 
                    onClick={() => setActiveTab('DEBTS')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'DEBTS' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-red-500'}`}
                >
                    <CreditCard size={16} /> Crédits
                </button>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher nom, téléphone ou résidence..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-egg-500"
            />
          </div>
          {activeTab === 'ALL' && (
              <button 
                onClick={() => setView('NEW')}
                className="bg-egg-600 hover:bg-egg-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                <UserPlus size={18} /> <span className="hidden sm:inline">Nouveau</span>
              </button>
          )}
        </div>
      </div>

      {/* VIEW: DEBTS LIST (Credit List) */}
      {activeTab === 'DEBTS' && (
          <div className="space-y-6">
              {/* Debt Summary Card */}
              <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl p-6 text-white shadow-lg flex items-center justify-between">
                  <div>
                      <p className="text-red-100 text-sm font-medium mb-1">Total Créances Client</p>
                      <h3 className="text-3xl font-extrabold">{totalDebts.toLocaleString()} FCFA</h3>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                      <CreditCard size={32} />
                  </div>
              </div>

              {/* Debt Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="p-4">Client</th>
                            <th className="p-4">Téléphone</th>
                            <th className="p-4 text-right">Dette Totale</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[...filteredCustomers].sort((a,b) => b.debt - a.debt).map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedCustomerId(customer.id); setView('DETAILS'); }}>
                                <td className="p-4 font-bold text-gray-800">
                                    {customer.name}
                                    <span className="block text-xs text-gray-400 font-normal">{customer.type}</span>
                                    {customer.residence && <span className="block text-xs text-gray-400 font-normal flex items-center gap-1 mt-0.5"><MapPin size={10} /> {customer.residence}</span>}
                                </td>
                                <td className="p-4 text-sm text-gray-600">{customer.phone}</td>
                                <td className="p-4 text-right font-bold text-red-600">{customer.debt.toLocaleString()} F</td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(customer.id); setView('DETAILS'); setIsPaymentMode(true); }}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Payer
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">Aucun crédit en cours.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* VIEW: ALL CUSTOMERS (Cards) */}
      {activeTab === 'ALL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCustomers.map(customer => (
            <div 
                key={customer.id} 
                onClick={() => { setSelectedCustomerId(customer.id); setView('DETAILS'); }}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
                <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-egg-50 text-egg-700 rounded-full flex items-center justify-center font-bold">
                    {customer.name.charAt(0)}
                    </div>
                    <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-egg-700 transition-colors">{customer.name}</h3>
                    <span className="text-xs text-gray-500">{customer.type === 'RESELLER' ? 'Revendeur' : customer.type === 'RESTAURANT' ? 'Restaurant' : 'Particulier'}</span>
                    </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${customer.debt > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                    {customer.debt > 0 ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                    {customer.debt.toLocaleString()} F
                </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500 pt-3 border-t border-gray-50 mt-3">
                <span className="flex items-center gap-1"><Phone size={14}/> {customer.phone}</span>
                {customer.residence && <span className="flex items-center gap-1"><MapPin size={14} className="text-gray-400"/> {customer.residence}</span>}
                </div>
            </div>
            ))}

            {filteredCustomers.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
                <UserPlus size={48} className="mx-auto mb-3 opacity-20" />
                <p>Aucun client trouvé.</p>
            </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Customers;
