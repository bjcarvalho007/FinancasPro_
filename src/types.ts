export interface ExtraGastoHistoryItem {
  id: string;
  amount: number;
  createdAt: string;
  assignedMonthKey?: string;
}

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
  extra_gastos_history?: ExtraGastoHistoryItem[];
  establishment?: string;
  installmentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  is_skipped?: boolean;
  keep_showing?: boolean;
  extension_months?: number;
  target_payoff_month?: string;
  target_payoff_date?: string;
  isOverdue?: boolean;
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

export interface CobrancaPayment {
  id: string;
  amount: number; // Valor pago nesta parcela / pagamento
  date: string; // Data do pagamento (YYYY-MM-DD)
  monthKey: string; // Mês em que foi recebido (YYYY-MM) -> somado na renda deste mês!
  installmentNumber?: number; // Ex: Parcela 1, 2, etc.
  note?: string; // Observação opcional
  createdAt?: string;
}

export interface CobrancaItem {
  id: string;
  debtorName: string; // Nome da pessoa que deve
  description?: string; // Motivo / descrição da dívida
  amount: number; // Valor total / principal para compatibilidade
  totalAmount?: number; // Total devido / valor original (ex: R$ 2.500)
  installmentsCount?: number; // Quantidade de parcelas combinadas (ex: 5)
  interestRatePercent?: number; // Opção de % de juros a cobrar (ou 0 / se não)
  totalWithInterest?: number; // Total devido com juros aplicados (ex: R$ 2.500 ou R$ 2.750)
  installmentAmount?: number; // Valor de cada parcela (ex: R$ 500)
  remainingAmount?: number; // Saldo devedor restante nos meses seguintes (ex: R$ 2.000 após pagar 500)
  payments?: CobrancaPayment[]; // Histórico de parcelas/pagamentos mês a mês
  dueDate?: string; // Data combinada de vencimento / dia do mês
  monthKey: string; // Mês de competência inicial (YYYY-MM)
  status: 'pendente' | 'parcial' | 'pago'; // Status
  paidAt?: string; // Data em que foi quitado ou do último pagamento (YYYY-MM-DD)
  paidMonthKey?: string; // Mês em que foi recebido (YYYY-MM)
  paidAmount?: number; // Total acumulado já recebido (soma dos pagamentos)
  notes?: string;
  createdAt: string;
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
  cobrancas?: CobrancaItem[];
  emailAlerts?: boolean;
  whatsappAlerts?: boolean;
  alertEmail?: string;
  alertPhone?: string;
  alertThresholdDays?: number;
  hiddenCategories?: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt?: string;
}
