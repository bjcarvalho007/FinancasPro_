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
  total_parcelado?: number;
  extra_gasto?: number;
  establishment?: string;
  installmentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  is_skipped?: boolean;
  keep_showing?: boolean;
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

export interface ExtraEarning {
  id: string;
  amount: number;
  source: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
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
  extraEarnings?: ExtraEarning[];
  emailAlerts?: boolean;
  whatsappAlerts?: boolean;
  alertEmail?: string;
  alertPhone?: string;
  alertThresholdDays?: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt?: string;
}
