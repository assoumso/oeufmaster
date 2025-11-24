import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, Sale, InventoryLog, PaymentStatus, EggCaliber, Customer, Expense, IncomingOrder, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Expenses from './components/Expenses';
import Orders from './components/Orders';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import CustomerOrder from './components/CustomerOrder';
import Login from './components/Login';
import { Menu, ShieldAlert, ExternalLink, RefreshCw, WifiOff, CloudOff, Bell, Shield } from 'lucide-react';
import { db, auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
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
  deleteDoc,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';

const App: React.FC = () => {
  // ROUTING LOGIC (Simple query param check)
  const urlParams = new URLSearchParams(window.location.search);
  const isOrderMode = urlParams.get('mode') === 'order';

  // AUTH STATE
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('SELLER'); // Default role
  const [authLoading, setAuthLoading] = useState(true);

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

  // Helper pour traduire les erreurs Firebase
  const translateFirebaseError = (error: any): string => {
      const msg = String(error?.message || error?.code || '');
      
      if (msg.includes('permission-denied') || msg.includes('insufficient permissions')) {
          return "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
      }
      if (msg.includes('not-found')) {
          return "L'élément que vous essayez de modifier ou supprimer n'existe plus.";
      }
      if (msg.includes('unavailable')) {
          return "Service temporairement indisponible ou hors ligne.";
      }
      if (msg.includes('reads to be executed before all writes')) {
          return "Erreur technique: Conflit de transaction. Veuillez réessayer.";
      }
      return msg; // Retourne le message d'origine si pas de traduction spécifique
  };

  // Auth & Profile Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or Create User Profile
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserRole(userDoc.data().role as UserRole);
        } else {
          // Create default profile for new user
          const defaultRole: UserRole = 'SELLER';
          // Exception: If it's the specific admin email, force ADMIN
          const roleToSet = currentUser.email?.includes('admin@') ? 'ADMIN' : defaultRole;
          
          await setDoc(userDocRef, {
            email: currentUser.email,
            role: roleToSet,
            createdAt: new Date().toISOString()
          });
          setUserRole(roleToSet);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserRole('SELLER');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
    // If not logged in and not in order mode, don't load data
    if (!user && !isOrderMode) return;

    // If in order mode, we skip heavy listeners (or adjust rules)
    if (isOrderMode) {
      setLoading(false);
      return;
    }

    const handleError = (error: any) => {
      // Safe log to avoid circular structure errors if error object is complex
      console.error("Firebase Listener Error:", String(error?.code || error?.message || "Unknown error"));
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
      const customersData = snapshot.docs.map(doc => {
          const data = doc.data();
          // Conversion sécurisée de la date pour éviter les objets Timestamp (circular structure)
          let formattedDate = undefined;
          if (data.lastPurchaseDate) {
              if (data.lastPurchaseDate.toDate) {
                  formattedDate = data.lastPurchaseDate.toDate().toISOString();
              } else {
                  formattedDate = data.lastPurchaseDate;
              }
          }
          
          return {
            id: doc.id,
            ...data,
            lastPurchaseDate: formattedDate
          };
      }) as Customer[];
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
  }, [isOrderMode, user]); // Re-run when user changes

  // Handlers
  const handleNewSale = async (saleData: Omit<Sale, 'id' | 'date'>) => {
    try {
      // CONSTRUCTION MANUELLE DE L'OBJET
      const safeSalePayload: any = {
        customerName: saleData.customerName || 'Client inconnu',
        caliber: saleData.caliber,
        quantity: Number(saleData.quantity),
        unitPrice: Number(saleData.unitPrice),
        totalPrice: Number(saleData.totalPrice),
        status: saleData.status
      };

      if (saleData.customerId) {
        safeSalePayload.customerId = saleData.customerId;
      }

      const saleId = await runTransaction(db, async (transaction) => {
        const stockDocRef = doc(db, "settings", "general");
        const stockDoc = await transaction.get(stockDocRef);
        
        if (!stockDoc.exists()) throw new Error("Document de stock introuvable.");

        let customerDoc = null;
        const customerRef = saleData.customerId ? doc(db, "customers", saleData.customerId) : null;
        if (customerRef) {
            customerDoc = await transaction.get(customerRef);
        }

        const data = stockDoc.data();
        const currentStocks = data.stocks || {};
        const caliberStock = currentStocks[saleData.caliber] || 0;

        if (caliberStock < saleData.quantity) {
          throw new Error(`Stock insuffisant pour le calibre ${saleData.caliber}. Disponible: ${caliberStock}`);
        }

        const newStocks = { ...currentStocks };
        newStocks[saleData.caliber] = caliberStock - saleData.quantity;
        transaction.update(stockDocRef, { stocks: newStocks });

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

        const newSaleRef = doc(collection(db, "sales"));
        transaction.set(newSaleRef, {
          ...safeSalePayload,
          date: Timestamp.now()
        });

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
      const errorMsg = translateFirebaseError(error);
      console.error("Erreur Transaction Vente:", error?.message || String(error));
      alert("Erreur lors de l'enregistrement de la vente: " + errorMsg);
      return null;
    }
  };

  // --- SUPPRESSION D'UNE VENTE ---
  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette vente ? Le stock sera restauré et la dette client annulée.")) return;

    try {
        await runTransaction(db, async (transaction) => {
            // --- 1. LECTURES (Toutes les lectures doivent être faites AVANT les écritures) ---
            
            // A. Lire la vente
            const saleRef = doc(db, "sales", saleId);
            const saleDoc = await transaction.get(saleRef);
            if (!saleDoc.exists()) throw new Error("Vente introuvable");
            const sale = saleDoc.data() as Sale;

            // B. Lire le stock
            const stockDocRef = doc(db, "settings", "general");
            const stockDoc = await transaction.get(stockDocRef);

            // C. Lire le client (si applicable)
            let customerDoc = null;
            const customerRef = sale.customerId ? doc(db, "customers", sale.customerId) : null;
            if (customerRef) {
                customerDoc = await transaction.get(customerRef);
            }

            // --- 2. LOGIQUE & CALCULS ---

            // Calcul Stock
            let newStocks = {};
            if (stockDoc.exists()) {
                const currentStocks = stockDoc.data().stocks || {};
                newStocks = { ...currentStocks };
                const safeCaliber = sale.caliber || EggCaliber.MEDIUM;
                const safeQuantity = Number(sale.quantity) || 0;
                newStocks[safeCaliber] = (newStocks[safeCaliber] || 0) + safeQuantity;
            }

            // --- 3. ECRITURES ---

            // A. Mise à jour Stock
            if (stockDoc.exists()) {
                transaction.update(stockDocRef, { stocks: newStocks });
            }

            // B. Mise à jour Client
            if (customerRef && customerDoc && customerDoc.exists()) {
                const cData = customerDoc.data();
                const newTotal = Math.max(0, (cData.totalPurchases || 0) - sale.totalPrice);
                
                let newDebt = cData.debt || 0;
                // Si la vente était en attente, on retire la dette associée
                if (sale.status === PaymentStatus.PENDING) {
                    newDebt = Math.max(0, newDebt - sale.totalPrice);
                } else if ((sale as any).status === 'PARTIAL') {
                        const amountPaid = (sale as any).amountPaid || 0;
                        const remainingOnSale = sale.totalPrice - amountPaid;
                        newDebt = Math.max(0, newDebt - remainingOnSale);
                }
                
                transaction.update(customerRef, {
                    totalPurchases: newTotal,
                    debt: newDebt
                });
            }

            // C. Suppression Vente
            transaction.delete(saleRef);

            // D. Log de correction
            const newLogRef = doc(collection(db, "inventory_logs"));
            transaction.set(newLogRef, {
                date: Timestamp.now(),
                type: 'ADD',
                caliber: sale.caliber || EggCaliber.MEDIUM,
                quantity: Number(sale.quantity) || 0,
                notes: `Correction: Annulation vente ${sale.customerName}`
            });
        });
        setNotification("Vente supprimée avec succès");
        setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
        alert("Erreur suppression: " + translateFirebaseError(error));
    }
  };

  // --- MODIFICATION D'UNE VENTE (STATUS) ---
  const handleUpdateSale = async (saleId: string, updates: Partial<Sale>) => {
      try {
          await updateDoc(doc(db, "sales", saleId), updates);
          setNotification("Vente mise à jour");
          setTimeout(() => setNotification(null), 3000);
      } catch (error: any) {
          alert("Erreur modification: " + translateFirebaseError(error));
      }
  };

  // --- GESTION CLIENTS ---
  const handleEditCustomer = async (customerId: string, data: Partial<Customer>) => {
      try {
          await updateDoc(doc(db, "customers", customerId), data);
          setNotification("Client mis à jour");
          setTimeout(() => setNotification(null), 3000);
      } catch (error: any) {
          alert("Erreur modification client: " + translateFirebaseError(error));
      }
  };

  const handleDeleteCustomer = async (customerId: string) => {
      if(!window.confirm("Supprimer ce client ? Son historique sera conservé dans les ventes mais la fiche sera supprimée.")) return;
      try {
          await deleteDoc(doc(db, "customers", customerId));
          setNotification("Client supprimé");
          setTimeout(() => setNotification(null), 3000);
      } catch (error: any) {
          alert("Erreur suppression client: " + translateFirebaseError(error));
      }
  };

  // --- GESTION DEPENSES ---
  const handleDeleteExpense = async (expenseId: string) => {
      if(!window.confirm("Supprimer cette dépense ?")) return;
      try {
          await deleteDoc(doc(db, "expenses", expenseId));
      } catch (error: any) {
          alert("Erreur suppression dépense: " + translateFirebaseError(error));
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
              caliber: order.caliber,
              quantity: order.quantity,
              unitPrice: unitPrice,
              totalPrice: order.quantity * unitPrice,
              status: PaymentStatus.PAID 
          });
          await updateDoc(doc(db, "incoming_orders", orderId), { status: 'PROCESSED' });
      } catch (e: any) {
          console.error("Error processing web order:", String(e?.message || "Unknown error"));
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
      const errorMsg = translateFirebaseError(error);
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
          console.error("Error adding customer:", String(error?.message || "Unknown error"));
          return null;
      }
  };

  const handleCustomerPayment = async (customerId: string, amount: number) => {
      try {
          const customer = customers.find(c => c.id === customerId);
          if (!customer) throw new Error("Client introuvable");

          const currentDebt = customer.debt || 0;
          const newDebt = Math.max(0, currentDebt - amount);
          
          const pendingSales = sales
            .filter(s => s.customerId === customerId && (s.status === PaymentStatus.PENDING || (s as any).status === 'PARTIAL'))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const batch = writeBatch(db);
          const customerRef = doc(db, "customers", customerId);
          
          batch.update(customerRef, { debt: newDebt });

          let remainingDebtToCover = newDebt;
          
          pendingSales.forEach((sale) => {
              const saleTotal = sale.totalPrice;
              const saleRef = doc(db, "sales", sale.id);

              if (remainingDebtToCover <= 0) {
                  batch.update(saleRef, { status: PaymentStatus.PAID, amountPaid: saleTotal });
              } else {
                  if (remainingDebtToCover >= saleTotal) {
                      batch.update(saleRef, { status: PaymentStatus.PENDING, amountPaid: 0 });
                      remainingDebtToCover -= saleTotal;
                  } else {
                      const amountPaidOnThisSale = saleTotal - remainingDebtToCover;
                      batch.update(saleRef, { status: 'PARTIAL', amountPaid: amountPaidOnThisSale });
                      remainingDebtToCover = 0;
                  }
              }
          });

          await batch.commit();
          
          setNotification("Paiement enregistré !");
          setTimeout(() => setNotification(null), 3000);

      } catch (error: any) {
        const msg = translateFirebaseError(error);
        console.error("Error payment:", String(error?.message || "Unknown error"));
        alert("Erreur lors du paiement: " + msg);
      }
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
        await addDoc(collection(db, "expenses"), {
            ...expense,
            date: Timestamp.fromDate(new Date(expense.date))
        });
    } catch (error: any) {
        console.error("Error adding expense:", String(error?.message || "Unknown error"));
    }
  };

  // CLIENT MODE RENDER (Public)
  if (isOrderMode) {
     return <CustomerOrder />;
  }

  // LOADING STATE
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-egg-600"></div>
      </div>
    );
  }

  // LOGIN RENDER (If not logged in)
  if (!user) {
    return <Login />;
  }

  // ADMIN MODE RENDER (If logged in)
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
              <br/>Connecté en tant que: <strong>{user.email}</strong>
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all">
                <RefreshCw size={18} /> Réessayer
              </button>
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold transition-all">
                 Se déconnecter
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

  const viewLabels: Record<View, string> = {
    'DASHBOARD': 'Tableau de bord',
    'SALES': 'Point de Vente',
    'ORDERS': 'Commandes Web',
    'INVENTORY': 'Stock & Inventaire',
    'CUSTOMERS': 'Clients',
    'EXPENSES': 'Dépenses & Charges',
    'REPORTS': 'Rapports & Stats',
    'USERS': 'Utilisateurs'
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans relative pt-[env(safe-area-inset-top)]">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        pendingOrdersCount={incomingOrders.filter(o => o.status === 'PENDING').length}
        onLogout={handleLogout}
        userRole={userRole}
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
        <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-gray-200 print:hidden sticky top-0 z-30">
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
             {(['DASHBOARD', 'SALES', 'ORDERS', 'INVENTORY', 'CUSTOMERS', 'EXPENSES', 'REPORTS', 'USERS'] as View[]).map(v => {
               // Security check for menu items
               if (v === 'USERS' && userRole !== 'ADMIN') return null;
               
               return (
                <button 
                  key={v}
                  className="block w-full text-left p-4 hover:bg-gray-50 font-medium text-gray-800"
                  onClick={() => { setCurrentView(v); setIsMobileMenuOpen(false); }}
                >
                  {viewLabels[v]}
                </button>
               );
             })}
             <button 
               className="block w-full text-left p-4 hover:bg-red-50 font-medium text-red-600 border-t border-gray-100"
               onClick={handleLogout}
             >
               Déconnexion
             </button>
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
                    onDeleteSale={handleDeleteSale}
                    onUpdateSale={handleUpdateSale}
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
            {currentView === 'CUSTOMERS' && (
                <Customers 
                    customers={customers} 
                    sales={sales} 
                    onAddCustomer={handleAddCustomer} 
                    onPayment={handleCustomerPayment}
                    onEditCustomer={handleEditCustomer}
                    onDeleteCustomer={handleDeleteCustomer}
                />
            )}
            {currentView === 'EXPENSES' && (
                <Expenses 
                    expenses={expenses} 
                    onAddExpense={handleAddExpense} 
                    onDeleteExpense={handleDeleteExpense}
                />
            )}
            {currentView === 'REPORTS' && <Reports sales={sales} expenses={expenses} customers={customers} />}
            {currentView === 'USERS' && user && <UserManagement currentUserUid={user.uid} />}
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