
import React, { useState, useEffect } from 'react';
import { Sale, PaymentStatus, EggCaliber, Customer } from '../types';
import { 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search, 
  AlertCircle, 
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  MapPin
} from 'lucide-react';

interface SalesProps {
  sales: Sale[];
  stocks: Record<string, number>;
  customers: Customer[];
  onNewSale: (sale: Omit<Sale, 'id' | 'date'>) => Promise<string | null>;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'debt'>) => Promise<string | null>;
  onDeleteSale: (saleId: string) => void;
  onUpdateSale: (saleId: string, updates: Partial<Sale>) => void;
}

const Sales: React.FC<SalesProps> = ({ sales, stocks, customers, onNewSale, onAddCustomer, onDeleteSale, onUpdateSale }) => {
  // State for POS
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  
  const [quantity, setQuantity] = useState(1);
  const [caliber, setCaliber] = useState<EggCaliber>(EggCaliber.MEDIUM);
  const [unitPrice, setUnitPrice] = useState(2500);
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // State for New Customer Modal
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', residence: '', type: 'INDIVIDUAL' as const });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // State for Edit Sale Modal
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const totalPrice = quantity * unitPrice;
  const currentStockForCaliber = stocks[caliber] || 0;
  
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  // Filter Logic
  const filteredSales = sales
    .filter(s => s.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination Logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > currentStockForCaliber) return;

    const saleId = await onNewSale({
      customerName,
      customerId: selectedCustomerId,
      caliber,
      quantity,
      unitPrice,
      totalPrice,
      status
    });
    
    // Reset only on success
    if (saleId) {
        setCustomerName('');
        setSelectedCustomerId(undefined);
        setQuantity(1);
        setStatus(PaymentStatus.PAID);
        setCurrentPage(1); // Return to first page to see new sale
    }
  };

  const handleQuickCustomerCreate = async () => {
     if (!newCustomerData.name) return;
     setIsCreatingCustomer(true);
     
     try {
       const newId = await onAddCustomer({
           name: newCustomerData.name,
           phone: newCustomerData.phone,
           residence: newCustomerData.residence,
           type: 'INDIVIDUAL'
       });

       if (newId) {
           setCustomerName(newCustomerData.name);
           setSelectedCustomerId(newId);
           setShowNewCustomerModal(false);
           setNewCustomerData({ name: '', phone: '', residence: '', type: 'INDIVIDUAL' });
       }
     } catch (e: any) {
         console.error("Erreur création client rapide", String(e?.message || "Erreur inconnue"));
     } finally {
         setIsCreatingCustomer(false);
     }
  };

  const handleEditSubmit = () => {
      if(editingSale) {
          onUpdateSale(editingSale.id, { status: editingSale.status });
          setEditingSale(null);
      }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerName.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-auto xl:h-[calc(100vh-140px)]">
      
        <div className="flex flex-col xl:flex-row gap-6 h-auto xl:h-full">
          {/* New Sale Form */}
          <div className="w-full xl:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-auto xl:h-full xl:overflow-y-auto shrink-0">
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
                                            setCustomerName(c.name);
                                            setSelectedCustomerId(c.id);
                                            setShowCustomerSuggestions(false);
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800 group-hover:text-egg-700">{c.name}</span>
                                            {c.debt > 0 && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10} /> Dette: {c.debt.toLocaleString()} F</span>}
                                            {c.residence && <span className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin size={10} /> {c.residence}</span>}
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
          <div className="w-full xl:flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px] xl:h-full overflow-hidden">
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
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Détail</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Statut</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(sale.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 font-medium text-gray-900">{sale.customerName}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {sale.quantity} pl. ({sale.caliber})
                      </td>
                      <td className="p-4 font-bold text-gray-900">{sale.totalPrice.toLocaleString()} F</td>
                      <td className="p-4 flex justify-center">
                        {sale.status === PaymentStatus.PAID && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1"/> Payé</span>}
                        {sale.status === PaymentStatus.PENDING && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse"><Clock size={12} className="mr-1"/> Attente</span>}
                        {sale.status === PaymentStatus.CANCELLED && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1"/> Annulé</span>}
                        {(sale as any).status === 'PARTIAL' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><Clock size={12} className="mr-1"/> Partiel</span>}
                      </td>
                      <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setEditingSale(sale)}
                                className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 hover:text-blue-600 transition-colors"
                                title="Modifier Statut"
                              >
                                  <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => onDeleteSale(sale.id)}
                                className="p-1.5 hover:bg-red-100 rounded-md text-gray-500 hover:text-red-600 transition-colors"
                                title="Supprimer"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </td>
                    </tr>
                  ))}
                  {currentSales.length === 0 && (
                      <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400 italic">Aucune vente trouvée.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                        Page {currentPage} sur {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
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
              className="w-full border rounded-lg p-3 mb-3"
              placeholder="Téléphone"
              value={newCustomerData.phone}
              onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})}
            />
             <input 
              className="w-full border rounded-lg p-3 mb-4"
              placeholder="Résidence / Adresse"
              value={newCustomerData.residence}
              onChange={e => setNewCustomerData({...newCustomerData, residence: e.target.value})}
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

      {/* Edit Sale Modal */}
      {editingSale && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Modifier la Vente</h3>
                  <p className="text-sm text-gray-500 mb-4">
                      Client: {editingSale.customerName}<br/>
                      Montant: {editingSale.totalPrice.toLocaleString()} F
                  </p>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut de paiement</label>
                  <select 
                    value={editingSale.status}
                    onChange={(e) => setEditingSale({...editingSale, status: e.target.value as PaymentStatus})}
                    className="w-full border border-gray-300 rounded-lg p-3 mb-6 bg-white"
                  >
                      <option value={PaymentStatus.PAID}>Payé</option>
                      <option value={PaymentStatus.PENDING}>En attente</option>
                      <option value={PaymentStatus.CANCELLED}>Annulé</option>
                  </select>

                  <div className="flex gap-2">
                      <button onClick={() => setEditingSale(null)} className="flex-1 py-3 text-gray-600">Annuler</button>
                      <button 
                          onClick={handleEditSubmit} 
                          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold"
                      >
                          Mettre à jour
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Sales;
