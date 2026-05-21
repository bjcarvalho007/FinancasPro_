export interface Transaction {
  id: string;
  userId: string;
  name: string;
  amount: number;
  type: 'fixos' | 'variaveis' | 'parcelas';
  cat: string;
  due: string;
  paid_amount: number;
  paid_at?: string;
  masterId?: string;
  monthKey: string; // YYYY-MM
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  userId: string;
  icon: string;
  label: string;
  value: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt?: string;
}

export interface Setting {
  userId: string;
  currency: 'BRL' | 'USD' | 'EUR';
  theme: 'dark' | 'light';
  income: number;
  balance: number;
  extras?: Record<string, number>; // monthKey -> sum of extra earnings
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt?: string;
}
