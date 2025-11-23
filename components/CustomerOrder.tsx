import React, { useState } from 'react';
import { EggCaliber } from '../types';
import { ShoppingBag, CheckCircle, Smartphone } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const CustomerOrder: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    caliber: EggCaliber.MEDIUM,
    quantity: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, "incoming_orders"), {
        ...formData,
        date: Timestamp.now(),
        status: 'PENDING'
      });
      setSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting order:", error?.message || "Unknown error");
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-bounce">
          <CheckCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold text-green-900 mb-2">Commande Envoyée !</h1>
        <p className="text-green-700 max-w-xs">
          Votre commande a été transmise à l'administration. Nous vous contacterons au <strong>{formData.customerPhone}</strong> pour confirmation.
        </p>
        <button 
          onClick={() => { setSubmitted(false); setFormData({...formData, quantity: 1, customerName: ''}); }}
          className="mt-8 bg-white text-green-700 border border-green-200 font-bold py-3 px-6 rounded-xl hover:bg-green-100 transition-colors"
        >
          Nouvelle commande
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-egg-600 text-white p-6 shadow-lg rounded-b-3xl">
        <div className="flex items-center justify-center gap-2 mb-2">
           <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
             <ShoppingBag size={18} />
           </div>
           <h1 className="font-bold text-xl">Commander</h1>
        </div>
        <p className="text-center text-egg-100 text-sm">Remplissez le formulaire pour réserver vos plateaux.</p>
      </div>

      <div className="max-w-md mx-auto -mt-6 p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votre Nom</label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-egg-500 outline-none bg-gray-50"
              placeholder="Ex: Maman Sali"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-egg-500 outline-none bg-gray-50"
                placeholder="Ex: 77 123 45 67"
              />
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <label className="block text-sm font-bold text-yellow-800 mb-3">Choisissez vos œufs</label>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.values(EggCaliber).map((cal) => (
                <button
                  key={cal}
                  type="button"
                  onClick={() => setFormData({...formData, caliber: cal})}
                  className={`py-2 px-1 text-sm rounded-lg border transition-all ${
                    formData.caliber === cal 
                    ? 'bg-white border-yellow-500 text-yellow-800 font-bold shadow-sm' 
                    : 'border-transparent hover:bg-white/50 text-gray-600'
                  }`}
                >
                  {cal}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-yellow-200">
              <span className="text-sm font-medium text-gray-600">Quantité (pl.)</span>
              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({...p, quantity: Math.max(1, p.quantity - 1)}))}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold hover:bg-gray-200"
                >
                  -
                </button>
                <span className="text-xl font-bold text-gray-800 w-8 text-center">{formData.quantity}</span>
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({...p, quantity: p.quantity + 1}))}
                  className="w-8 h-8 rounded-full bg-egg-100 text-egg-700 flex items-center justify-center font-bold hover:bg-egg-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg shadow-gray-200 transition-transform active:scale-95 disabled:opacity-70"
          >
            {loading ? 'Envoi...' : 'Confirmer la commande'}
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-400 mt-6">
          Propulsé par ŒufMaster Pro
        </p>
      </div>
    </div>
  );
};

export default CustomerOrder;