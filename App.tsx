
import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, Sale, InventoryLog, PaymentStatus, EggCaliber, Customer, Expense, IncomingOrder } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Expenses from './components/Expenses';
import Orders from './components/Orders';
import Reports from './components/Reports';
import CustomerOrder from './components/CustomerOrder';
import { Menu, ShieldAlert, ExternalLink, RefreshCw, WifiOff, CloudOff, Bell } from 'lucide-react';
import { db } from './services/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  runTransaction, 
  Timestamp, 
  setDoc,
  addDoc,
  updateDoc,
  writeBatch,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';

const App: React.FC = () => {
  // ROUTING LOGIC (Simple query param check)
  const urlParams = new URLSearchParams(window.location.search);
  const isOrderMode = urlParams.get('mode') === 'order';

  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // App State
  const [stocks, setStocks] = useState<Record<string, number>>({
    [EggCaliber.SMALL]: 0,
    [EggCaliber.MEDIUM]: 0,
    [EggCaliber.LARGE]: 0,
    [EggCaliber.JUMBO]: 0
  });
  const [sales, setSales] = useState<Sale[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<IncomingOrder[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Network Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simple Notification Sound
  const playNotificationSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // High pitch A5
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5); // 0.5 seconds beep
    } catch (e) {
        // Silent fail for audio context
    }
  };

  // Initialize Firebase Listeners
  useEffect(() => {
    // If in order mode, we might not need all listeners, but for simplicity we keep them or exit early if strict auth was needed
    // However, the prompt implies "admin receives notification", so admin app is running separately.
    // If THIS instance is the client, we don't need listeners.
    if (isOrderMode) {
      setLoading(false);
      return;
    }

    const handleError = (error: any) => {
      // Safe log to avoid circular structure errors if error object is complex
      console.error("Firebase Listener Error:", error?.code || error?.message || "Unknown error");
      if (error?.code === 'permission-denied') {
        setPermissionError(true);
        setLoading(false);
      }
    };

    // Sales Listener
    const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"));
    const unsubscribeSales = onSnapshot(salesQuery, { includeMetadataChanges: true }, (snapshot) => {
      setPermissionError(false);
      const salesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.().toISOString() || new Date().toISOString()
        };
      }) as Sale[];
      setSales(salesData);
    }, handleError);

    // Logs Listener
    const logsQuery = query(collection(db, "inventory_logs"), orderBy("date", "desc"));
    const unsubscribeLogs = onSnapshot(logsQuery, { includeMetadataChanges: true }, (snapshot) => {
      const logsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.().toISOString() || new Date().toISOString()
        };
      }) as InventoryLog[];
      setLogs(logsData);
    }, handleError);

    // Customers Listener
    const customersQuery = query(collection(db, "customers"), orderBy("name", "asc"));
    const unsubscribeCustomers = onSnapshot(customersQuery, { includeMetadataChanges: true }, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      })) as Customer[];
      setCustomers(customersData);
    }, handleError);

    // Expenses Listener
    const expensesQuery = query(collection(db, "expenses"), orderBy("date", "desc"));
    const unsubscribeExpenses = onSnapshot(expensesQuery, { includeMetadataChanges: true }, (snapshot) => {
        const expenseData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate?.().toISOString() || new Date().toISOString()
            };
        }) as Expense[];
        setExpenses(expenseData);
    }, handleError);

    // Incoming Orders Listener (NEW)
    const ordersQuery = query(collection(db, "incoming_orders"), orderBy("date", "desc"));
    const unsubscribeOrders = onSnapshot(ordersQuery, { includeMetadataChanges: true }, (snapshot) => {
        const orders = snapshot.docs.map(doc => {
           const data = doc.data();
           return {
             id: doc.id,
             ...data,
             date: data.date?.toDate?.().toISOString() || new Date().toISOString()
           }
        }) as IncomingOrder[];

        // Check for new pending orders to notify
        const newPending = orders.filter(o => o.status === 'PENDING');
        // Simple logic: if count increases or if we have new IDs. 
        // For simplicity, if there is a pending order created in the last 10 seconds, notify.
        const recentOrder = newPending.find(o => (Date.now() - new Date(o.date).getTime()) < 10000);
        
        if (recentOrder) {
            setNotification(`Nouvelle commande de ${recentOrder.customerName}`);
            playNotificationSound();
            setTimeout(() => setNotification(null), 5000);
        }

        setIncomingOrders(orders);
    }, handleError);

    // Stock Listener
    const stockDocRef = doc(db, "settings", "general");
    const unsubscribeStock = onSnapshot(stockDocRef, { includeMetadataChanges: true }, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.stocks) {
          setStocks(data.stocks);
        } else if (data.currentStock !== undefined) {
           setStocks({
             [EggCaliber.SMALL]: 0,
             [EggCaliber.MEDIUM]: data.currentStock,
             [EggCaliber.LARGE]: 0,
             [EggCaliber.JUMBO]: 0
           });
        }
      } else {
        if (navigator.onLine) {
            setDoc(stockDocRef, { stocks: {
                [EggCaliber.SMALL]: 0,
                [EggCaliber.MEDIUM]: 0,
                [EggCaliber.LARGE]: 0,
                [EggCaliber.JUMBO]: 0
            }}).catch(() => {});
        }
      }
      setLoading(false);
    }, handleError);

    return () => {
      unsubscribeSales();
      unsubscribeLogs();
      unsubscribeStock();
      unsubscribeCustomers();
      unsubscribeExpenses();
      unsubscribeOrders();
    };
  }, [isOrderMode]);

  // Handlers
  const handleNewSale = async (saleData: Omit<Sale, 'id' | 'date'>) => {
    try {
      // CONSTRUCTION MANUELLE DE L'OBJET
      // Cela évite l'utilisation de JSON.stringify qui peut causer des erreurs circulaires
      // et permet de s'assurer qu'aucun champ 'undefined' n'est envoyé à Firestore
      const safeSalePayload: any = {
        customerName: saleData.customerName || 'Client inconnu',
        caliber: saleData.caliber,
        quantity: Number(saleData.quantity),
        unitPrice: Number(saleData.unitPrice),
        totalPrice: Number(saleData.totalPrice),
        status: saleData.status
      };

      // N'ajouter customerId que s'il est défini et non vide
      if (saleData.customerId) {
        safeSalePayload.customerId = saleData.customerId;
      }

      const saleId = await runTransaction(db, async (transaction) => {
        // --- ETAPE 1 : LECTURES (DOIVENT ETRE FAITES AVANT TOUTE ECRITURE) ---
        
        // 1.a Lecture du Stock
        const stockDocRef = doc(db, "settings", "general");
        const stockDoc = await transaction.get(stockDocRef);
        
        if (!stockDoc.exists()) throw new Error("Document de stock introuvable.");

        // 1.b Lecture du Client (si applicable)
        let customerDoc = null;
        const customerRef = saleData.customerId ? doc(db, "customers", saleData.customerId) : null;
        if (customerRef) {
            customerDoc = await transaction.get(customerRef);
        }

        // --- ETAPE 2 : LOGIQUE METIER ---
        
        const data = stockDoc.data();
        const currentStocks = data.stocks || {};
        const caliberStock = currentStocks[saleData.caliber] || 0;

        if (caliberStock < saleData.quantity) {
          throw new Error(`Stock insuffisant pour le calibre ${saleData.caliber}. Disponible: ${caliberStock}`);
        }

        // --- ETAPE 3 : ECRITURES ---

        // 3.a Mise à jour du Stock
        const newStocks = { ...currentStocks };
        newStocks[saleData.caliber] = caliberStock - saleData.quantity;
        transaction.update(stockDocRef, { stocks: newStocks });

        // 3.b Mise à jour du Client
        if (customerRef && customerDoc && customerDoc.exists()) {
            const cData = customerDoc.data();
            const newTotalPurchases = (cData.totalPurchases || 0) + saleData.totalPrice;
            let newDebt = cData.debt || 0;
            if (saleData.status === PaymentStatus.PENDING) {
                newDebt += saleData.totalPrice;
            }
            transaction.update(customerRef, {
                totalPurchases: newTotalPurchases,
                debt: newDebt,
                lastPurchaseDate: Timestamp.now().toDate().toISOString()
            });
        }

        // 3.c Création de la Vente
        const newSaleRef = doc(collection(db, "sales"));
        transaction.set(newSaleRef, {
          ...safeSalePayload,
          date: Timestamp.now()
        });

        // 3.d Création du Log de stock
        const newLogRef = doc(collection(db, "inventory_logs"));
        transaction.set(newLogRef, {
          date: Timestamp.now(),
          type: 'REMOVE',
          caliber: saleData.caliber,
          quantity: saleData.quantity,
          notes: `Vente: ${saleData.customerName || 'Client de passage'}`
        });

        return newSaleRef.id;
      });
      return saleId;
    } catch (error: any) {
      // Log du message uniquement pour éviter les erreurs circulaires du navigateur
      const errorMsg = error?.message || "Erreur inconnue";
      console.error("Erreur Transaction Vente:", errorMsg);
      alert("Erreur lors de l'enregistrement de la vente: " + errorMsg);
      return null;
    }
  };

  const handleProcessOrder = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
      if (action === 'REJECT') {
          await updateDoc(doc(db, "incoming_orders", orderId), { status: 'REJECTED' });
          return;
      }

      // If Approve, we need to create a sale
      const order = incomingOrders.find(o => o.id === orderId);
      if (!order) return;

      // Find unit price (simplified logic: default 2500 for now, could be dynamic)
      const unitPrice = 2500; 

      try {
          await handleNewSale({
              customerName: order.customerName,
              // We don't link customer ID automatically for web orders yet, 
              // unless we implemented a search by phone.
              caliber: order.caliber,
              quantity: order.quantity,
              unitPrice: unitPrice,
              totalPrice: order.quantity * unitPrice,
              status: PaymentStatus.PAID // Assume online orders are paid or will be paid on delivery. Could be PENDING.
          });
          // Update order status
          await updateDoc(doc(db, "incoming_orders", orderId), { status: 'PROCESSED' });
      } catch (e: any) {
          console.error("Error processing web order:", e?.message || "Unknown error");
      }
  };

  const handleUpdateStock = async (amount: number, type: 'ADD' | 'REMOVE', caliber: EggCaliber, notes: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const stockDocRef = doc(db, "settings", "general");
        const stockDoc = await transaction.get(stockDocRef);
        
        if (!stockDoc.exists()) throw new Error("Doc stock missing");

        const data = stockDoc.data();
        const currentStocks = data.stocks || {};
        const currentQty = currentStocks[caliber] || 0;
        let newQty = currentQty;

        if (type === 'ADD') {
          newQty += amount;
        } else {
          newQty -= amount;
          if (newQty < 0) newQty = 0; 
        }

        const newStocks = { ...currentStocks, [caliber]: newQty };
        transaction.update(stockDocRef, { stocks: newStocks });

        const newLogRef = doc(collection(db, "inventory_logs"));
        transaction.set(newLogRef, {
          date: Timestamp.now(),
          type: type,
          caliber: caliber,
          quantity: amount,
          notes: notes
        });
      });
    } catch (error: any) {
      const errorMsg = error?.message || "Erreur inconnue";
      alert("Erreur de mise à jour: " + errorMsg);
    }
  };

  const handleAddCustomer = async (customer: Omit<Customer, 'id' | 'totalPurchases' | 'debt'>): Promise<string | null> => {
      try {
          const docRef = await addDoc(collection(db, "customers"), {
              ...customer,
              totalPurchases: 0,
              debt: 0
          });
          return docRef.id;
      } catch (error: any) {
          console.error("Error adding customer:", error?.message || "Unknown error");
          return null;
      }
  };

  const handleCustomerPayment = async (customerId: string, amount: number) => {
      try {
          // 1. Utilisation de l'état LOCAL pour une réponse instantanée
          const customer = customers.find(c => c.id === customerId);
          if (!customer) throw new Error("Client introuvable");

          const currentDebt = customer.debt || 0;
          const newDebt = Math.max(0, currentDebt - amount);

          // 2. Identifier les ventes à solder (Logique locale)
          const pendingSales = sales
            .filter(s => s.customerId === customerId && s.status === PaymentStatus.PENDING)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Du plus vieux au plus récent

          // 3. Préparer le Batch Firestore
          const batch = writeBatch(db);
          const customerRef = doc(db, "customers", customerId);
          const salesToUpdateIds: string[] = [];
          
          let remainingPayment = amount;

          // a. Mise à jour Dette Client
          batch.update(customerRef, { debt: newDebt });

          // b. Distribution du paiement sur les ventes
          pendingSales.forEach((sale) => {
              if (remainingPayment >= sale.totalPrice) {
                  // Si le paiement couvre cette vente, on la marque comme PAYÉE
                  const saleRef = doc(db, "sales", sale.id);
                  batch.update(saleRef, { status: PaymentStatus.PAID });
                  salesToUpdateIds.push(sale.id);
                  remainingPayment -= sale.totalPrice;
              }
          });

          // 4. MISE A JOUR OPTIMISTE DE L'UI (Instantané)
          setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, debt: newDebt } : c));
          setSales(prev => prev.map(s => salesToUpdateIds.includes(s.id) ? { ...s, status: PaymentStatus.PAID } : s));

          // 5. Envoi au serveur
          await batch.commit();
          
          setNotification("Paiement enregistré !");
          setTimeout(() => setNotification(null), 3000);

      } catch (error: any) {
        console.error("Error payment:", error?.message || "Unknown error");
        alert("Erreur lors du paiement: " + (error?.message || "Erreur inconnue"));
      }
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
        await addDoc(collection(db, "expenses"), {
            ...expense,
            date: Timestamp.fromDate(new Date(expense.date))
        });
    } catch (error: any) {
        console.error("Error adding expense:", error?.message || "Unknown error");
    }
  };

  // CLIENT MODE RENDER
  if (isOrderMode) {
     return <CustomerOrder />;
  }

  // ADMIN MODE RENDER
  if (permissionError) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          <div className="bg-red-50 p-6 flex items-center gap-4 border-b border-red-100">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-900">Accès Refusé</h2>
              <p className="text-red-700 text-sm">Permissions Firebase manquantes</p>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <p className="text-gray-600 text-sm leading-relaxed">
              L'application ne peut pas accéder à votre base de données <strong>BarakaSoft</strong>.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <a href="https://console.firebase.google.com/project/barakasoft/firestore/rules" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg">
                <ExternalLink size={18} /> Configurer les règles Firebase
              </a>
              <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold transition-all">
                <RefreshCw size={18} /> Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-egg-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans relative">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        pendingOrdersCount={incomingOrders.filter(o => o.status === 'PENDING').length}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Notifications Toast */}
        {notification && (
            <div className="absolute top-4 right-4 z-50 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-bounce">
                <Bell className="text-yellow-400" />
                <div>
                    <h4 className="font-bold">Notification</h4>
                    <p className="text-sm">{notification}</p>
                </div>
            </div>
        )}

        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium z-50 animate-fade-in shadow-md">
            <CloudOff size={16} className="text-red-400" />
            <span>Mode hors-ligne actif.</span>
          </div>
        )}

        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-gray-200 print:hidden">
           <div className="flex items-center gap-2 font-bold text-gray-800">
              <div className="w-8 h-8 bg-egg-500 rounded flex items-center justify-center text-white">Œ</div>
              ŒufMaster
           </div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             <Menu />
           </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 absolute top-16 left-0 w-full z-50 shadow-lg">
             {(['DASHBOARD', 'SALES', 'ORDERS', 'INVENTORY', 'CUSTOMERS', 'EXPENSES', 'REPORTS'] as View[]).map(v => (
               <button 
                key={v}
                className="block w-full text-left p-4 hover:bg-gray-50"
                onClick={() => { setCurrentView(v); setIsMobileMenuOpen(false); }}
               >
                 {v}
               </button>
             ))}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentView === 'DASHBOARD' && <Dashboard sales={sales} inventory={stocks} expenses={expenses} />}
            {currentView === 'SALES' && (
                <Sales 
                    sales={sales} 
                    stocks={stocks} 
                    customers={customers} 
                    onNewSale={handleNewSale}
                    onAddCustomer={handleAddCustomer}
                />
            )}
            {currentView === 'ORDERS' && (
                <Orders 
                    orders={incomingOrders} 
                    stocks={stocks}
                    onProcessOrder={handleProcessOrder}
                />
            )}
            {currentView === 'INVENTORY' && <Inventory stocks={stocks} logs={logs} onUpdateStock={handleUpdateStock} />}
            {currentView === 'CUSTOMERS' && <Customers customers={customers} sales={sales} onAddCustomer={handleAddCustomer} onPayment={handleCustomerPayment} />}
            {currentView === 'EXPENSES' && <Expenses expenses={expenses} onAddExpense={handleAddExpense} />}
            {currentView === 'REPORTS' && <Reports sales={sales} expenses={expenses} customers={customers} />}
          </div>
        </div>
      </main>

      {/* Online/Offline Status Indicator (Floating) */}
      <div className="absolute bottom-4 right-4 z-40 hidden md:flex flex-col gap-2 print:hidden">
         {isOnline ? (
             <div className="bg-white/80 backdrop-blur border border-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                En ligne
             </div>
         ) : (
             <div className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                <WifiOff size={12} />
                Hors ligne
             </div>
         )}
      </div>
    </div>
  );
};

export default App;
