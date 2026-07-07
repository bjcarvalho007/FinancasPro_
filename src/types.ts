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
  extension_months?: number;
  target_payoff_month?: string;
  target_payoff_date?: string;
  classification?: 'pessoal' | 'profissional'; // Pessoal ou Profissional (Negócio)
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

export interface BusinessProfile {
  userId: string; // matches the owner's UID
  name: string;
  description: string;
  address?: string;
  phone?: string;
  workingDays: string[]; // e.g. ['seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  workingHoursStart: string; // e.g. '08:00'
  workingHoursEnd: string; // e.g. '18:00'
  lunchStart?: string; // e.g. '12:00'
  lunchEnd?: string; // e.g. '13:00'
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessService {
  id: string;
  userId: string; // matches the owner's UID
  name: string;
  price: number;
  duration: number; // in minutes
  description?: string;
  active: boolean;
  createdAt?: string;
}

export interface BusinessBooking {
  id: string;
  userId: string; // matches the owner's UID
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

