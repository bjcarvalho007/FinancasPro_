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
  initialAmount?: number;
  monthlyContribution?: number;
  targetMonths?: number;
  createdAt?: string;
}

export interface Setting {
  userId: string;
  currency: 'BRL' | 'USD' | 'EUR';
  theme: 'dark' | 'light';
  income: number;
  balance: number;
  monthlyIncome?: Record<string, number>; // monthKey -> monthly income
  monthlyBalance?: Record<string, number>; // monthKey -> monthly starting balance
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
