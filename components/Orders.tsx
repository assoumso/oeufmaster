import React from 'react';
import { IncomingOrder } from '../types';
import { BellRing, Globe, Check, X, QrCode } from 'lucide-react';

interface OrdersProps {
  orders: IncomingOrder[];
  stocks: Record<string, number>;
  onProcessOrder: (orderId: string, action: 'APPROVE' | 'REJECT') => void;
}

const Orders: React.FC<OrdersProps> = ({ orders, stocks, onProcessOrder }) => {
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const processedOrders = orders.filter(o => o.status !== 'PENDING').slice(0, 10); // Show last 10 processed

  // QR Code URL logic
  const appUrl = window.location.href.split('?')[0];
  const orderUrl = `${appUrl}?mode=order`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(orderUrl)}`;

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Left Column: QR Code & Instructions */}
      <div className="w-full xl:w-1/4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col">
        <h3 className="font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <QrCode className="text-blue-600" /> Commande Client
        </h3>
        <p className="text-sm text-gray-500 mb-6">Faites scanner ce code pour permettre aux clients de commander.</p>
        
        <div className="bg-white p-4 inline-block rounded-xl border border-gray-200 shadow-inner mb-4 mx-auto">
            <img src={qrCodeUrl} alt="QR Code Commande" className="w-48 h-48" />
        </div>

        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 break-all mb-4">
          {orderUrl}
        </div>
        <a href={orderUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline">
          Ouvrir la page de commande
        </a>

        <div className="mt-auto pt-6 border-t border-gray-100 text-left">
           <h4 className="font-bold text-gray-700 text-sm mb-2">Comment ça marche ?</h4>
           <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
             <li>Le client scanne le code et commande.</li>
             <li>Vous recevez une notification sonore.</li>
             <li>Vous validez la commande ici.</li>
             <li>La vente est créée et le stock déduit.</li>
           </ul>
        </div>
      </div>

      {/* Right Column: Order Management */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <BellRing size={20} className={pendingOrders.length > 0 ? "text-red-500 animate-pulse" : "text-gray-400"} />
              Commandes en Attente ({pendingOrders.length})
            </h3>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-50/30 p-4">
          {pendingOrders.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <Globe size={48} className="mb-4 opacity-20" />
              <p>Aucune nouvelle commande.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {pendingOrders.map(order => (
                <div key={order.id} className="border border-blue-100 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-gray-800">{order.customerName}</h4>
                        <p className="text-sm text-gray-500">{order.customerPhone}</p>
                      </div>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">
                        {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span>{order.quantity} plateau(x)</span>
                        <span className="text-gray-700 font-bold">{order.caliber}</span>
                      </div>
                      <div className={`mt-1 text-xs text-right ${stocks[order.caliber] < order.quantity ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                         Stock dispo: {stocks[order.caliber] || 0}
                      </div>
                  </div>

                  <div className="flex gap-2">
                      <button 
                        onClick={() => onProcessOrder(order.id, 'REJECT')}
                        className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm flex items-center justify-center gap-1"
                      >
                        <X size={16} /> Rejeter
                      </button>
                      <button 
                        onClick={() => onProcessOrder(order.id, 'APPROVE')}
                        disabled={stocks[order.caliber] < order.quantity}
                        className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm flex items-center justify-center gap-1 shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check size={16} /> Valider
                      </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {processedOrders.length > 0 && (
            <div className="mt-8">
               <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Historique Récent</h4>
               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 text-gray-500">
                     <tr>
                       <th className="p-3">Date</th>
                       <th className="p-3">Client</th>
                       <th className="p-3">Commande</th>
                       <th className="p-3 text-right">Statut</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {processedOrders.map(order => (
                       <tr key={order.id} className="hover:bg-gray-50">
                         <td className="p-3 text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                         <td className="p-3 font-medium">{order.customerName}</td>
                         <td className="p-3">{order.quantity} pl. ({order.caliber})</td>
                         <td className="p-3 text-right">
                           {order.status === 'PROCESSED' ? (
                             <span className="inline-flex items-center text-green-600 font-bold text-xs"><Check size={12} className="mr-1"/> Validé</span>
                           ) : (
                             <span className="inline-flex items-center text-red-400 font-bold text-xs"><X size={12} className="mr-1"/> Refusé</span>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;