export enum PaymentStatus {
  PAID = 'Payé',
  PENDING = 'En attente',
  CANCELLED = 'Annulé'
}

export enum EggCaliber {
  SMALL = 'Petit',
  MEDIUM = 'Moyen',
  LARGE = 'Gros',
  JUMBO = 'Jumbo'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: 'RESELLER' | 'INDIVIDUAL' | 'RESTAURANT';
  totalPurchases: number;
  debt: number;
  lastPurchaseDate?: string;
}

export interface Sale {
  id: string;
  date: string; // ISO string
  customerId?: string; // Link to customer
  customerName: string;
  caliber: EggCaliber;
  quantity: number; // Number of trays
  unitPrice: number;
  totalPrice: number;
  status: PaymentStatus;
}

export interface InventoryLog {
  id: string;
  date: string;
  type: 'ADD' | 'REMOVE' | 'ADJUSTMENT';
  caliber: EggCaliber;
  quantity: number;
  notes?: string;
}

export enum ExpenseCategory {
  PURCHASE = 'Achat de Plateaux',
  TRANSPORT = 'Transport',
  PACKAGING = 'Emballages',
  SALARY = 'Salaire Personnel',
  RENT = 'Loyer / Local',
  EQUIPMENT = 'Matériel',
  MISC = 'Divers'
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export interface IncomingOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  caliber: EggCaliber;
  quantity: number;
  date: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
}

export interface AppState {
  inventory: Record<string, number>;
  sales: Sale[];
  logs: InventoryLog[];
  customers: Customer[];
  expenses: Expense[];
}

export type View = 'DASHBOARD' | 'SALES' | 'ORDERS' | 'INVENTORY' | 'CUSTOMERS' | 'EXPENSES' | 'REPORTS';