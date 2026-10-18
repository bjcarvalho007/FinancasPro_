import React, { useState, useMemo } from 'react';
import { Setting, ExtraEarning, CobrancaItem, CobrancaPayment } from '../types';
import { useLanguage } from '../utils/i18n';
import {
  Wallet,
  TrendingUp,
  Users,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  RotateCcw,
  X,
  ChevronRight,
  Filter,
  Check,
  UserCheck,
  Building,
  HelpCircle,
  FileCheck,
  ArrowUpRight,
  Search,
  Sparkles,
  Percent,
  Layers,
  Coins,
  ChevronDown,
  ChevronUp,
  History,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GanhosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonthKey: string;
  settings: Setting | null;
  theme?: 'dark' | 'light';
  onSaveMonthlyIncome: (income: number, balance?: number, applyToFuture?: boolean) => Promise<void>;
  onSaveMonthlyIncomeForMonth: (monthKey: string, income: number, balance?: number) => Promise<void>;
  onAddExtraEarning: (earning: Omit<ExtraEarning, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteExtraEarning: (id: string) => Promise<void>;
  onAddCobranca: (cobranca: Omit<CobrancaItem, 'id' | 'createdAt'>) => Promise<void>;
  onRegisterCobrancaPayment?: (
    cobrancaId: string,
    payment: { amount: number; monthKey: string; date: string; installmentNumber?: number; note?: string }
  ) => Promise<void>;
  onDeleteCobrancaPayment?: (cobrancaId: string, paymentId: string) => Promise<void>;
  onToggleCobrancaStatus: (id: string, targetPaidMonthKey?: string) => Promise<void>;
  onDeleteCobranca: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

type GanhosEnvironment = 'renda' | 'extras' | 'cobrancas';

export default function GanhosModal({
  isOpen,
  onClose,
  currentMonthKey,
  settings,
  theme = 'dark',
  onSaveMonthlyIncome,
  onSaveMonthlyIncomeForMonth,
  onAddExtraEarning,
  onDeleteExtraEarning,
  onAddCobranca,
  onRegisterCobrancaPayment,
  onDeleteCobrancaPayment,
  onToggleCobrancaStatus,
  onDeleteCobranca,
  showToast
}: GanhosModalProps) {
  const { t, formatMonthKey, formatCurrency } = useLanguage();

  // Active Environment (Ambiente): 'renda' | 'extras' | 'cobrancas'
  const [activeEnv, setActiveEnv] = useState<GanhosEnvironment>('renda');

  // Helpers for currency formatting and parsing
  const handleMaskMoney = (val: string): string => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    return formatCurrency(parseFloat(numeric) / 100);
  };

  const parseMoney = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/[^\d]/g, '');
    return parseFloat(clean) / 100 || 0;
  };

  // --- AMBIENTE 1: RENDA MENSAL STATE ---
  const initialIncome = settings?.monthlyIncome?.[currentMonthKey] ?? settings?.income ?? 0;
  const initialBalance = settings?.monthlyBalance?.[currentMonthKey] ?? settings?.balance ?? 0;

  const [incomeStr, setIncomeStr] = useState<string>(initialIncome > 0 ? formatCurrency(initialIncome) : '');
  const [balanceStr, setBalanceStr] = useState<string>(initialBalance > 0 ? formatCurrency(initialBalance) : '');
  const [applyToFuture, setApplyToFuture] = useState<boolean>(false);
  const [rendaViewMode, setRendaViewMode] = useState<'current' | 'history'>('current');
  const [isSavingRenda, setIsSavingRenda] = useState<boolean>(false);

  // Quick edit modal or inline for another month in history
  const [editingHistoryMonth, setEditingHistoryMonth] = useState<string | null>(null);
  const [editingHistoryIncomeStr, setEditingHistoryIncomeStr] = useState<string>('');

  // Synchronize when currentMonthKey or settings change
  React.useEffect(() => {
    const incVal = settings?.monthlyIncome?.[currentMonthKey] ?? settings?.income ?? 0;
    const balVal = settings?.monthlyBalance?.[currentMonthKey] ?? settings?.balance ?? 0;
    setIncomeStr(incVal > 0 ? formatCurrency(incVal) : '');
    setBalanceStr(balVal > 0 ? formatCurrency(balVal) : '');
  }, [currentMonthKey, settings?.monthlyIncome, settings?.monthlyBalance, settings?.income, settings?.balance]);

  const handleSaveRenda = async () => {
    setIsSavingRenda(true);
    const incVal = parseMoney(incomeStr);
    const balVal = parseMoney(balanceStr);
    try {
      await onSaveMonthlyIncome(incVal, balVal, applyToFuture);
    } finally {
      setIsSavingRenda(false);
    }
  };

  // --- AMBIENTE 2: GANHOS EXTRAS STATE ---
  const [extraSource, setExtraSource] = useState<string>('');
  const [extraAmountStr, setExtraAmountStr] = useState<string>('');
  const [extraDate, setExtraDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [extrasFilterMode, setExtrasFilterMode] = useState<'current' | 'all'>('current');
  const [isAddingExtra, setIsAddingExtra] = useState<boolean>(false);

  const handleAddExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraSource.trim()) {
      showToast(t('informeOrigem', 'Informe a origem ou descrição do ganho extra'), 'warning');
      return;
    }
    const amountVal = parseMoney(extraAmountStr);
    if (amountVal <= 0) {
      showToast(t('informeValorMaiorZero', 'Informe um valor maior que zero'), 'warning');
      return;
    }
    if (!extraDate) {
      showToast(t('escolhaData', 'Escolha a data do recebimento'), 'warning');
      return;
    }

    const [year, month] = extraDate.split('-');
    const mKey = `${year}-${month}`;

    setIsAddingExtra(true);
    try {
      await onAddExtraEarning({
        source: extraSource.trim(),
        amount: amountVal,
        date: extraDate,
        monthKey: mKey
      });
      setExtraSource('');
      setExtraAmountStr('');
      showToast('Ganho extra registrado com sucesso!', 'success');
    } finally {
      setIsAddingExtra(false);
    }
  };

  // --- AMBIENTE 3: COBRANÇAS STATE ---
  const [isAddingCobranca, setIsAddingCobranca] = useState<boolean>(false);
  const [cobrancaDebtor, setCobrancaDebtor] = useState<string>('');
  const [cobrancaDesc, setCobrancaDesc] = useState<string>('');
  const [cobrancaTotalAmountStr, setCobrancaTotalAmountStr] = useState<string>('');
  const [cobrancaInstallmentsCount, setCobrancaInstallmentsCount] = useState<number>(1);
  const [cobrancaHasInterest, setCobrancaHasInterest] = useState<boolean>(false);
  const [cobrancaInterestRate, setCobrancaInterestRate] = useState<number>(0);
  const [cobrancaStartDate, setCobrancaStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cobrancaDueDate, setCobrancaDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cobrancaMonthKey, setCobrancaMonthKey] = useState<string>(currentMonthKey);
  const [cobrancasScopeFilter, setCobrancasScopeFilter] = useState<'current' | 'all'>('current');
  const [cobrancasStatusFilter, setCobrancasStatusFilter] = useState<'all' | 'pendente' | 'pago'>('all');
  const [cobrancaSearch, setCobrancaSearch] = useState<string>('');

  const handleDueDateChange = (dateVal: string) => {
    setCobrancaDueDate(dateVal);
    if (dateVal) {
      const [y, m] = dateVal.split('-');
      if (y && m) {
        setCobrancaMonthKey(`${y}-${m}`);
      }
    }
  };

  // Payment Recording Modal State
  const [payingCobranca, setPayingCobranca] = useState<CobrancaItem | null>(null);
  const [paymentAmountStr, setPaymentAmountStr] = useState<string>('');
  const [paymentMonthKey, setPaymentMonthKey] = useState<string>(currentMonthKey);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // Accordion of payments history by cobranca ID
  const [expandedHistories, setExpandedHistories] = useState<Record<string, boolean>>({});

  const toggleHistory = (cobId: string) => {
    setExpandedHistories(prev => ({ ...prev, [cobId]: !prev[cobId] }));
  };

  const handleOpenPayModal = (item: CobrancaItem) => {
    setPayingCobranca(item);
    const totalToPay = item.totalWithInterest || item.totalAmount || item.amount;
    const paidSoFar = item.paidAmount ?? ((item.payments || []).reduce((s, p) => s + (p.amount || 0), 0));
    const remaining = item.remainingAmount !== undefined ? item.remainingAmount : Math.max(0, totalToPay - paidSoFar);

    const suggested = item.installmentAmount && item.installmentAmount > 0 
      ? Math.min(item.installmentAmount, remaining)
      : remaining;

    setPaymentAmountStr(formatCurrency(suggested > 0 ? suggested : remaining));
    setPaymentMonthKey(currentMonthKey);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    const nextNum = (item.payments?.length || 0) + 1;
    setPaymentNote(`Parcela ${nextNum}${item.installmentsCount ? ` de ${item.installmentsCount}` : ''}`);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCobranca) return;
    const amt = parseMoney(paymentAmountStr);
    if (amt <= 0) {
      showToast('Informe o valor pago nesta parcela.', 'warning');
      return;
    }
    if (!paymentMonthKey) {
      showToast('Informe o mês de competência para somar na renda.', 'warning');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      if (onRegisterCobrancaPayment) {
        await onRegisterCobrancaPayment(payingCobranca.id, {
          amount: amt,
          monthKey: paymentMonthKey,
          date: paymentDate || new Date().toISOString().split('T')[0],
          note: paymentNote || undefined
        });
      } else {
        await onToggleCobrancaStatus(payingCobranca.id, paymentMonthKey);
      }
      setPayingCobranca(null);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async (cobrancaId: string, paymentId: string) => {
    if (onDeleteCobrancaPayment) {
      await onDeleteCobrancaPayment(cobrancaId, paymentId);
    }
  };

  const handleCreateCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cobrancaDebtor.trim()) {
      showToast('Informe o nome da pessoa que deve.', 'warning');
      return;
    }
    const principal = parseMoney(cobrancaTotalAmountStr);
    if (principal <= 0) {
      showToast('Informe o total devido da cobrança.', 'warning');
      return;
    }

    const installments = Math.max(1, cobrancaInstallmentsCount || 1);
    const interest = cobrancaHasInterest ? Math.max(0, cobrancaInterestRate || 0) : 0;
    const withInterest = interest > 0 
      ? Math.round((principal * (1 + interest / 100)) * 100) / 100
      : principal;
    const perInstallment = Math.round((withInterest / installments) * 100) / 100;

    const assignedMonth = cobrancaMonthKey || (cobrancaDueDate ? cobrancaDueDate.substring(0, 7) : currentMonthKey);

    try {
      await onAddCobranca({
        debtorName: cobrancaDebtor.trim(),
        description: cobrancaDesc.trim() || undefined,
        amount: withInterest,
        totalAmount: principal,
        installmentsCount: installments,
        interestRatePercent: interest,
        totalWithInterest: withInterest,
        installmentAmount: perInstallment,
        remainingAmount: withInterest,
        paidAmount: 0,
        payments: [],
        startDate: cobrancaStartDate || new Date().toISOString().split('T')[0],
        dueDate: cobrancaDueDate || undefined,
        monthKey: assignedMonth,
        status: 'pendente'
      });
      setCobrancaDebtor('');
      setCobrancaDesc('');
      setCobrancaTotalAmountStr('');
      setCobrancaInstallmentsCount(1);
      setCobrancaHasInterest(false);
      setCobrancaInterestRate(0);
      setCobrancaStartDate(new Date().toISOString().split('T')[0]);
      setCobrancaDueDate(new Date().toISOString().split('T')[0]);
      setCobrancaMonthKey(currentMonthKey);
      setIsAddingCobranca(false);
    } catch {
      // handled by parent
    }
  };

  // --- CALCULATIONS & AGGREGATIONS ---
  const activeMonthIncome = settings?.monthlyIncome?.[currentMonthKey] ?? settings?.income ?? 0;
  const activeMonthBalance = settings?.monthlyBalance?.[currentMonthKey] ?? settings?.balance ?? 0;
  const activeMonthExtras = settings?.extras?.[currentMonthKey] ?? 0;

  const cobrancasAll = useMemo(() => settings?.cobrancas || [], [settings?.cobrancas]);

  // Cobranças pagas no mês ativo (somadas na renda do mês)
  const cobrancasPagasNoMes = useMemo(() => {
    return cobrancasAll.reduce((sum, c) => {
      if (c.payments && c.payments.length > 0) {
        const monthSum = c.payments
          .filter(p => p.monthKey === currentMonthKey)
          .reduce((pAcc, p) => pAcc + (p.amount || 0), 0);
        return sum + monthSum;
      }
      if (c.status === 'pago' && (c.paidMonthKey === currentMonthKey || (!c.paidMonthKey && c.monthKey === currentMonthKey))) {
        return sum + (c.paidAmount || c.amount || 0);
      }
      return sum;
    }, 0);
  }, [cobrancasAll, currentMonthKey]);

  // Total de Entradas no Mês
  const totalGanhosMes = activeMonthIncome + activeMonthBalance + activeMonthExtras + cobrancasPagasNoMes;

  // Extra earnings list
  const extraEarningsAll = useMemo(() => settings?.extraEarnings || [], [settings?.extraEarnings]);
  const filteredExtraEarnings = useMemo(() => {
    return extraEarningsAll.filter(item => {
      if (extrasFilterMode === 'current') {
        return item.monthKey === currentMonthKey;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [extraEarningsAll, extrasFilterMode, currentMonthKey]);

  const totalFilteredExtras = filteredExtraEarnings.reduce((acc, it) => acc + it.amount, 0);

  // Cobranças list filtered
  const filteredCobrancas = useMemo(() => {
    return cobrancasAll.filter(item => {
      const hasMonthPayment = (item.payments || []).some(p => p.monthKey === currentMonthKey);
      const isRefMonth = item.monthKey === currentMonthKey || item.paidMonthKey === currentMonthKey;
      const isPending = item.status !== 'pago';

      // Scope filter
      if (cobrancasScopeFilter === 'current') {
        if (!hasMonthPayment && !isRefMonth && !isPending) return false;
      }
      // Status filter
      if (cobrancasStatusFilter !== 'all') {
        if (cobrancasStatusFilter === 'pago' && item.status !== 'pago') return false;
        if (cobrancasStatusFilter === 'pendente' && item.status === 'pago') return false;
      }
      // Search filter
      if (cobrancaSearch.trim()) {
        const query = cobrancaSearch.toLowerCase();
        const matchName = item.debtorName.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    }).sort((a, b) => {
      // Pending/parcial first, then by date
      if (a.status !== b.status) {
        return a.status !== 'pago' ? -1 : 1;
      }
      return (b.dueDate || b.createdAt).localeCompare(a.dueDate || a.createdAt);
    });
  }, [cobrancasAll, cobrancasScopeFilter, cobrancasStatusFilter, cobrancaSearch, currentMonthKey]);

  // Cobranças metrics
  const totalCobrancasPendentes = useMemo(() => {
    return cobrancasAll.reduce((sum, c) => {
      if (c.status === 'pago') return sum;
      const targetTotal = c.totalWithInterest || c.totalAmount || c.amount;
      const paid = c.paidAmount ?? ((c.payments || []).reduce((s, p) => s + (p.amount || 0), 0));
      const remaining = c.remainingAmount !== undefined ? c.remainingAmount : Math.max(0, targetTotal - paid);
      return sum + remaining;
    }, 0);
  }, [cobrancasAll]);

  const totalCobrancasQuitadas = useMemo(() => {
    return cobrancasAll.reduce((sum, c) => {
      if (c.payments && c.payments.length > 0) {
        return sum + c.payments.reduce((s, p) => s + (p.amount || 0), 0);
      }
      if (c.status === 'pago') {
        return sum + (c.paidAmount || c.amount || 0);
      }
      return sum + (c.paidAmount || 0);
    }, 0);
  }, [cobrancasAll]);

  const totalCobrancasGeral = useMemo(() => {
    return cobrancasAll.reduce((sum, c) => sum + (c.totalWithInterest || c.totalAmount || c.amount), 0);
  }, [cobrancasAll]);

  // Monthly income history list
  const incomeHistoryEntries = useMemo(() => {
    const map = settings?.monthlyIncome || {};
    const entries = Object.entries(map).map(([mKey, val]) => ({
      monthKey: mKey,
      income: val,
      balance: settings?.monthlyBalance?.[mKey] || 0
    }));
    // Sort descending by monthKey
    return entries.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [settings?.monthlyIncome, settings?.monthlyBalance]);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className={`relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#0b101d] border-white/10 text-slate-100'
          }`}
        >
          {/* Top Banner / Header with Total Summary */}
          <div className={`p-5 sm:p-6 border-b transition-colors ${
            isLight
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-slate-200'
              : 'bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-indigo-950/30 border-white/10'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-display font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-2">
                      <span>{t('ganhosCompetencia', 'Central de Ganhos')}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {formatMonthKey(currentMonthKey)}
                      </span>
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Ambientes inteligentes de entrada: renda mensal, ganhos extras e cobranças a receber.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-200/70 hover:bg-slate-300 text-slate-600'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Inflow Summary Card */}
            <div className={`mt-4 p-3.5 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isLight
                ? 'bg-white/80 border-emerald-200 shadow-sm'
                : 'bg-slate-950/60 border-emerald-500/20 shadow-inner'
            }`}>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Total de Entradas no Mês ({formatMonthKey(currentMonthKey)})</span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-400 mt-0.5">
                  {formatCurrency(totalGanhosMes)}
                </div>
              </div>

              {/* Breakdown Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-mono ${
                  isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                }`}>
                  <span className="font-sans font-bold">Renda:</span> {formatCurrency(activeMonthIncome)}
                </div>
                {activeMonthBalance > 0 && (
                  <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-mono ${
                    isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                  }`}>
                    <span className="font-sans font-bold">Reserva:</span> {formatCurrency(activeMonthBalance)}
                  </div>
                )}
                {activeMonthExtras > 0 && (
                  <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-mono ${
                    isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  }`}>
                    <span className="font-sans font-bold">Extras:</span> {formatCurrency(activeMonthExtras)}
                  </div>
                )}
                {cobrancasPagasNoMes > 0 && (
                  <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 font-mono ${
                    isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}>
                    <span className="font-sans font-bold">Cobranças:</span> +{formatCurrency(cobrancasPagasNoMes)}
                  </div>
                )}
              </div>
            </div>

            {/* Three Distinct Environments Navigation Tabs */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                type="button"
                onClick={() => setActiveEnv('renda')}
                className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  activeEnv === 'renda'
                    ? isLight
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                    : isLight
                    ? 'bg-white/80 hover:bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-white/5'
                }`}
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span className="truncate">Renda Mensal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveEnv('extras')}
                className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  activeEnv === 'extras'
                    ? isLight
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                    : isLight
                    ? 'bg-white/80 hover:bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-white/5'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span className="truncate">Ganhos Extras</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveEnv('cobrancas')}
                className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border relative ${
                  activeEnv === 'cobrancas'
                    ? isLight
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                      : 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
                    : isLight
                    ? 'bg-white/80 hover:bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-white/5'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">Cobranças</span>
                {totalCobrancasPendentes > 0 && (
                  <span className={`w-2 h-2 rounded-full ${activeEnv === 'cobrancas' ? 'bg-white' : 'bg-amber-400'} animate-pulse`} />
                )}
              </button>
            </div>
          </div>

          {/* Modal Body: Active Environment Content */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

            {/* ======================================================== */}
            {/* AMBIENTE 1: RENDA MENSAL & HISTÓRICO DE RENDA           */}
            {/* ======================================================== */}
            {activeEnv === 'renda' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Sub-header & Scope Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-indigo-400" />
                      <span>{rendaViewMode === 'current' ? `Renda de ${formatMonthKey(currentMonthKey)}` : 'Histórico Geral de Rendas'}</span>
                    </h4>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {rendaViewMode === 'current'
                        ? 'Defina a renda fixa e reserva disponível para este mês.'
                        : 'Acompanhe a evolução de sua renda cadastrada mês a mês.'}
                    </p>
                  </div>

                  <div className={`p-1 rounded-2xl flex items-center gap-1 border shrink-0 ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-white/5'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setRendaViewMode('current')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        rendaViewMode === 'current'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Mês Selecionado
                    </button>
                    <button
                      type="button"
                      onClick={() => setRendaViewMode('history')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        rendaViewMode === 'history'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Histórico Geral ({incomeHistoryEntries.length})
                    </button>
                  </div>
                </div>

                {/* Subview 1: Current Month Renda Form */}
                {rendaViewMode === 'current' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Left: Input Form */}
                    <div className="md:col-span-7 space-y-4">
                      <div className={`p-5 rounded-2xl border space-y-4 ${
                        isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/40 border-white/5'
                      }`}>
                        <div>
                          <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            Renda Mensal do Mês ({formatMonthKey(currentMonthKey)})
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500 font-bold">R$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0,00"
                              value={incomeStr}
                              onChange={(e) => setIncomeStr(handleMaskMoney(e.target.value))}
                              className={`w-full text-sm font-mono font-bold pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                                  : 'bg-slate-900/80 border-white/10 text-white focus:border-indigo-500'
                              }`}
                            />
                          </div>
                          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Salário fixo, pró-labore, aposentadoria ou rendimentos previstos.
                          </p>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            Reserva / Saldo Inicial em Mãos (Opcional)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500 font-bold">R$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0,00"
                              value={balanceStr}
                              onChange={(e) => setBalanceStr(handleMaskMoney(e.target.value))}
                              className={`w-full text-sm font-mono font-bold pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors ${
                                isLight
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                                  : 'bg-slate-900/80 border-white/10 text-white focus:border-indigo-500'
                              }`}
                            />
                          </div>
                          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Dinheiro guardado em conta corrente ou em espécie para usar neste mês.
                          </p>
                        </div>

                        {/* Apply to future months checkbox */}
                        <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                          isLight
                            ? 'bg-white border-slate-200 hover:border-indigo-300'
                            : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                        }`}>
                          <input
                            type="checkbox"
                            checked={applyToFuture}
                            onChange={(e) => setApplyToFuture(e.target.checked)}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-bold block">Replicar renda para os próximos meses</span>
                            <span className={`text-[11px] block leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              Aplica automaticamente este valor de renda para os meses futuros deste ano.
                            </span>
                          </div>
                        </label>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleSaveRenda}
                            disabled={isSavingRenda}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                          >
                            <Check className="w-4 h-4" />
                            {isSavingRenda ? 'Salvando...' : 'Salvar Renda do Mês'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Insights */}
                    <div className="md:col-span-5 space-y-4">
                      <div className={`p-5 rounded-2xl border space-y-3 ${
                        isLight ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-950/40 border-white/5'
                      }`}>
                        <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" />
                          <span>Resumo da Competência</span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Mês Ativo</span>
                            <span className="font-bold">{formatMonthKey(currentMonthKey)}</span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Renda Fixa</span>
                            <span className="font-mono font-bold text-indigo-400">{formatCurrency(activeMonthIncome)}</span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Reserva / Em Mãos</span>
                            <span className="font-mono font-bold text-blue-400">{formatCurrency(activeMonthBalance)}</span>
                          </div>

                          <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Ganhos Extras do Mês</span>
                            <span className="font-mono font-bold text-emerald-400">{formatCurrency(activeMonthExtras)}</span>
                          </div>

                          <div className="flex justify-between items-center py-1.5">
                            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Cobranças Pagas</span>
                            <span className="font-mono font-bold text-emerald-400">+{formatCurrency(cobrancasPagasNoMes)}</span>
                          </div>
                        </div>

                        <div className={`pt-3 border-t text-center ${isLight ? 'border-indigo-100' : 'border-white/5'}`}>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Previsto</div>
                          <div className="text-lg font-black font-mono text-emerald-400">{formatCurrency(totalGanhosMes)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subview 2: General Income History */}
                {rendaViewMode === 'history' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'}`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meses Configurados</div>
                        <div className="text-xl font-bold font-mono mt-1">{incomeHistoryEntries.length}</div>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'}`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média Mensal Cadastrada</div>
                        <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                          {formatCurrency(
                            incomeHistoryEntries.length > 0
                              ? incomeHistoryEntries.reduce((sum, e) => sum + e.income, 0) / incomeHistoryEntries.length
                              : initialIncome
                          )}
                        </div>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'}`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maior Renda Registrada</div>
                        <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                          {formatCurrency(
                            incomeHistoryEntries.length > 0
                              ? Math.max(...incomeHistoryEntries.map(e => e.income))
                              : initialIncome
                          )}
                        </div>
                      </div>
                    </div>

                    {/* History Table / Cards */}
                    <div className={`rounded-2xl border overflow-hidden ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950/40 border-white/5'
                    }`}>
                      <div className="p-3.5 border-b border-white/5 font-bold text-xs uppercase tracking-wider text-slate-400">
                        Histórico de Rendas por Mês
                      </div>

                      <div className="divide-y divide-white/5 max-h-[320px] overflow-y-auto">
                        {incomeHistoryEntries.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-500 italic">
                            Nenhum histórico específico por mês gravado ainda. O sistema utiliza a renda padrão configurada.
                          </div>
                        ) : (
                          incomeHistoryEntries.map((entry) => {
                            const isCurrent = entry.monthKey === currentMonthKey;
                            const isEditing = editingHistoryMonth === entry.monthKey;

                            return (
                              <div
                                key={entry.monthKey}
                                className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                                  isCurrent
                                    ? isLight ? 'bg-indigo-50/60' : 'bg-indigo-500/10'
                                    : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                    isCurrent
                                      ? 'bg-indigo-600 text-white'
                                      : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {entry.monthKey.split('-')[1]}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold flex items-center gap-2">
                                      <span>{formatMonthKey(entry.monthKey)}</span>
                                      {isCurrent && (
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-extrabold uppercase tracking-wider">
                                          Mês Atual
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      Reserva: {formatCurrency(entry.balance)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={editingHistoryIncomeStr}
                                        onChange={(e) => setEditingHistoryIncomeStr(handleMaskMoney(e.target.value))}
                                        className="w-28 text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-900 border border-indigo-500 text-white"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const val = parseMoney(editingHistoryIncomeStr);
                                          await onSaveMonthlyIncomeForMonth(entry.monthKey, val);
                                          setEditingHistoryMonth(null);
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                                      >
                                        OK
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingHistoryMonth(null)}
                                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-right">
                                      <div className="text-xs font-mono font-bold text-indigo-400">
                                        {formatCurrency(entry.income)}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingHistoryMonth(entry.monthKey);
                                          setEditingHistoryIncomeStr(formatCurrency(entry.income));
                                        }}
                                        className="text-[10px] text-slate-400 hover:text-indigo-400 underline cursor-pointer"
                                      >
                                        Ajustar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* AMBIENTE 2: GANHOS EXTRAS & HISTÓRICO MENSAL / GERAL     */}
            {/* ======================================================== */}
            {activeEnv === 'extras' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header & Toggle Scope */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>{extrasFilterMode === 'current' ? `Ganhos Extras de ${formatMonthKey(currentMonthKey)}` : 'Histórico Geral de Ganhos Extras'}</span>
                    </h4>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {extrasFilterMode === 'current'
                        ? 'Ganhos adicionais recebidos neste mês (freelances, vendas, bônus).'
                        : 'Todos os ganhos extras acumulados ao longo dos meses.'}
                    </p>
                  </div>

                  <div className={`p-1 rounded-2xl flex items-center gap-1 border shrink-0 ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-white/5'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setExtrasFilterMode('current')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        extrasFilterMode === 'current'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Mês Atual
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtrasFilterMode('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        extrasFilterMode === 'all'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Todos os Meses ({extraEarningsAll.length})
                    </button>
                  </div>
                </div>

                {/* Fast Add Form */}
                <form
                  onSubmit={handleAddExtra}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-950/40 border-white/5'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Registrar Novo Ganho Extra
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        Origem / Serviço
                      </label>
                      <input
                        type="text"
                        value={extraSource}
                        onChange={(e) => setExtraSource(e.target.value)}
                        placeholder="Ex: Freelance, Venda de notebook, Hora extra..."
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                            : 'bg-slate-900 border-white/10 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        Valor Recebido
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={extraAmountStr}
                        onChange={(e) => setExtraAmountStr(handleMaskMoney(e.target.value))}
                        placeholder="R$ 0,00"
                        className={`w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                            : 'bg-slate-900 border-white/10 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        Data
                      </label>
                      <input
                        type="date"
                        value={extraDate}
                        onChange={(e) => setExtraDate(e.target.value)}
                        className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                            : 'bg-slate-900 border-white/10 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isAddingExtra}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAddingExtra ? 'Adicionando...' : 'Adicionar Ganho Extra'}</span>
                    </button>
                  </div>
                </form>

                {/* Extra Earnings List */}
                <div className={`rounded-2xl border p-4 space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950/30 border-white/5'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                      Entradas Registradas ({filteredExtraEarnings.length})
                    </span>
                    <span className="text-emerald-400 font-mono text-sm">
                      Total: {formatCurrency(totalFilteredExtras)}
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {filteredExtraEarnings.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 italic">
                        Nenhum ganho extra registrado para o filtro selecionado.
                      </div>
                    ) : (
                      filteredExtraEarnings.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                            isLight
                              ? 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-tight">{item.source}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {item.date ? item.date.split('-').reverse().join('/') : '-'}
                                </span>
                                {extrasFilterMode === 'all' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 font-bold">
                                    {formatMonthKey(item.monthKey)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              +{formatCurrency(item.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => onDeleteExtraEarning(item.id)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center cursor-pointer transition-colors"
                              title="Excluir ganho extra"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* AMBIENTE 3: COBRANÇAS (PESSOAS QUE ME DEVEM)              */}
            {/* ======================================================== */}
            {activeEnv === 'cobrancas' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header & Feature Explanation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Cobranças & Valores a Receber</span>
                    </h4>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Defina o total devido, parcelas e juros opcionais. Ao registrar uma parcela paga no mês, o valor é <strong className="text-emerald-400">somado na sua renda</strong> e o restante fica para os meses seguintes!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingCobranca(!isAddingCobranca)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Cobrança</span>
                  </button>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-500/20'
                  }`}>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Total Restante a Receber</span>
                    </div>
                    <div className="text-xl font-black font-mono text-amber-400 mt-1">
                      {formatCurrency(totalCobrancasPendentes)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Saldo em aberto</div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/20'
                  }`}>
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Recebido no Mês ({formatMonthKey(currentMonthKey)})</span>
                    </div>
                    <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                      +{formatCurrency(cobrancasPagasNoMes)}
                    </div>
                    <div className="text-[10px] text-emerald-500/80 mt-0.5">Somado na renda deste mês</div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-indigo-50/60 border-indigo-200' : 'bg-indigo-950/20 border-indigo-500/20'
                  }`}>
                    <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>Total Já Quitado Geral</span>
                    </div>
                    <div className="text-xl font-black font-mono text-indigo-400 mt-1">
                      {formatCurrency(totalCobrancasQuitadas)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Histórico recebido</div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'
                  }`}>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Devedores / Cobranças</span>
                    </div>
                    <div className="text-xl font-black font-mono mt-1">
                      {cobrancasAll.length}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Cadastrados no sistema</div>
                  </div>
                </div>

                {/* Modal de Adicionar Nova Cobrança na Tela (Sobreposição com Backdrop) */}
                <AnimatePresence>
                  {isAddingCobranca && (() => {
                    const formPrincipal = parseMoney(cobrancaTotalAmountStr);
                    const formInstallments = Math.max(1, cobrancaInstallmentsCount || 1);
                    const formInterestPercent = cobrancaHasInterest ? Math.max(0, cobrancaInterestRate || 0) : 0;
                    const formInterestAmount = formPrincipal * (formInterestPercent / 100);
                    const formTotalWithInterest = formPrincipal + formInterestAmount;
                    const formInstallmentVal = formTotalWithInterest / formInstallments;

                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                        {/* Backdrop escurecido com blur */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsAddingCobranca(false)}
                          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
                        />

                        {/* Modal Dialog Card */}
                        <motion.div
                          initial={{ scale: 0.95, y: 15 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.95, y: 15 }}
                          className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 max-h-[92vh] flex flex-col space-y-4 border ${
                            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                          }`}
                        >
                          {/* Modal Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                                <UserCheck className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-display font-extrabold text-base leading-tight">Nova Cobrança Parcelada</h3>
                                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                  Cadastre valores a receber, parcelas e juros
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsAddingCobranca(false)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Scrollable Form Body */}
                          <form onSubmit={handleCreateCobranca} className="space-y-4 overflow-y-auto pr-1 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                              {/* Debtor Name */}
                              <div className="sm:col-span-12">
                                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                  isLight ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                  Nome da Pessoa que Deve *
                                </label>
                                <input
                                  type="text"
                                  value={cobrancaDebtor}
                                  onChange={(e) => setCobrancaDebtor(e.target.value)}
                                  placeholder="Ex: Carlos Oliveira, Juliana..."
                                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                                    isLight
                                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                                      : 'bg-slate-950 border-white/10 text-white focus:border-amber-500'
                                  }`}
                                  required
                                  autoFocus
                                />
                              </div>

                              {/* Motivo / Descrição */}
                              <div className="sm:col-span-12">
                                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                  isLight ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                  Motivo / Descrição
                                </label>
                                <input
                                  type="text"
                                  value={cobrancaDesc}
                                  onChange={(e) => setCobrancaDesc(e.target.value)}
                                  placeholder="Ex: Venda de celular, Empréstimo, Serviço prestado..."
                                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                                    isLight
                                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                                      : 'bg-slate-950 border-white/10 text-white focus:border-amber-500'
                                  }`}
                                />
                              </div>

                              {/* Total Devido */}
                              <div className="sm:col-span-6">
                                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                  isLight ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                  Total Devido (Valor Principal) *
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={cobrancaTotalAmountStr}
                                  onChange={(e) => setCobrancaTotalAmountStr(handleMaskMoney(e.target.value))}
                                  placeholder="Ex: R$ 2.500,00"
                                  className={`w-full text-sm font-mono font-black px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                                    isLight
                                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                                      : 'bg-slate-950 border-white/10 text-amber-400 focus:border-amber-500'
                                  }`}
                                  required
                                />
                              </div>

                              {/* Quantas parcelas */}
                              <div className="sm:col-span-6">
                                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                  isLight ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                  Quantas Parcelas ficou pra pagar? *
                                </label>
                                <div className="space-y-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    max="72"
                                    value={cobrancaInstallmentsCount}
                                    onChange={(e) => setCobrancaInstallmentsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className={`w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border focus:outline-none text-center ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                                        : 'bg-slate-950 border-white/10 text-white focus:border-amber-500'
                                    }`}
                                    required
                                  />
                                  <div className="flex flex-wrap gap-1">
                                    {[1, 2, 3, 5, 10, 12].map(n => (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => setCobrancaInstallmentsCount(n)}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border ${
                                          cobrancaInstallmentsCount === n
                                            ? 'bg-amber-600 text-white border-amber-600'
                                            : isLight
                                            ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                            : 'bg-slate-950 text-slate-300 border-white/10 hover:bg-slate-800'
                                        }`}
                                      >
                                        {n === 1 ? '1x (À vista)' : `${n}x`}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Juros (%) */}
                              <div className="sm:col-span-12">
                                <div className={`p-3 rounded-2xl border space-y-2 ${
                                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/5'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ${
                                      isLight ? 'text-slate-600' : 'text-slate-400'
                                    }`}>
                                      Cobrança de Juros
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-500">
                                      <input
                                        type="checkbox"
                                        checked={cobrancaHasInterest}
                                        onChange={(e) => setCobrancaHasInterest(e.target.checked)}
                                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                                      />
                                      <span>{cobrancaHasInterest ? 'Cobrar Juros (%)' : 'Sem Juros (0%)'}</span>
                                    </label>
                                  </div>

                                  {cobrancaHasInterest && (
                                    <div className="relative">
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={cobrancaInterestRate || ''}
                                        onChange={(e) => setCobrancaInterestRate(parseFloat(e.target.value) || 0)}
                                        placeholder="Ex: 10 (taxa percentual total de juros)"
                                        className={`w-full text-xs font-mono font-bold pl-3 pr-8 py-2 rounded-xl border focus:outline-none ${
                                          isLight
                                            ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                            : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
                                        }`}
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Seção de Datas e Prazos do Acordo (Data de Início, Data Combinada / 1º Vencimento e Mês de Pagamento) */}
                              <div className={`sm:col-span-12 p-3.5 rounded-2xl border space-y-3 ${
                                isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/70 border-white/10'
                              }`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>Prazos e Datas da Cobrança</span>
                                  </div>
                                  {cobrancaMonthKey && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                      <span>📅 Mês de Pagamento:</span>
                                      <span className="capitalize">{formatMonthKey(cobrancaMonthKey)}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* 1. Data de Início */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${
                                        isLight ? 'text-slate-600' : 'text-slate-400'
                                      }`}>
                                        Data de Início
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setCobrancaStartDate(new Date().toISOString().split('T')[0])}
                                        className="text-[9px] font-bold text-amber-500 hover:underline cursor-pointer"
                                      >
                                        Hoje
                                      </button>
                                    </div>
                                    <input
                                      type="date"
                                      value={cobrancaStartDate}
                                      onChange={(e) => setCobrancaStartDate(e.target.value)}
                                      className={`w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                                        isLight
                                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                          : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
                                      }`}
                                    />
                                    <span className="block text-[9px] text-slate-400 mt-1">Início da dívida / acordo</span>
                                  </div>

                                  {/* 2. Data Combinada / 1º Vencimento */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${
                                        isLight ? 'text-slate-600' : 'text-slate-400'
                                      }`}>
                                        Data Combinada / 1º Vencimento *
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const d = new Date();
                                          d.setDate(d.getDate() + 30);
                                          const iso = d.toISOString().split('T')[0];
                                          handleDueDateChange(iso);
                                        }}
                                        className="text-[9px] font-bold text-amber-500 hover:underline cursor-pointer"
                                      >
                                        +30 dias
                                      </button>
                                    </div>
                                    <input
                                      type="date"
                                      value={cobrancaDueDate}
                                      onChange={(e) => handleDueDateChange(e.target.value)}
                                      className={`w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                                        isLight
                                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                          : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
                                      }`}
                                      required
                                    />
                                    <span className="block text-[9px] text-slate-400 mt-1">Dia do 1º vencimento combinado</span>
                                  </div>

                                  {/* 3. Mês de Pagamento da Cobrança */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${
                                        isLight ? 'text-slate-600' : 'text-slate-400'
                                      }`}>
                                        Mês de Pagamento da Cobrança *
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setCobrancaMonthKey(currentMonthKey)}
                                        className="text-[9px] font-bold text-amber-500 hover:underline cursor-pointer"
                                      >
                                        Mês Atual
                                      </button>
                                    </div>
                                    <input
                                      type="month"
                                      value={cobrancaMonthKey}
                                      onChange={(e) => setCobrancaMonthKey(e.target.value)}
                                      className={`w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                                        isLight
                                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                          : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
                                      }`}
                                      required
                                    />
                                    <span className="block text-[9px] text-slate-400 mt-1">Competência somada na renda</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Live Calculation Preview Box */}
                            {formPrincipal > 0 && (
                              <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                                isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-950 border-amber-500/25'
                              }`}>
                                <div className="space-y-0.5">
                                  <div className="text-[10px] font-black uppercase text-amber-500">Resumo da Cobrança</div>
                                  <div className="font-bold">
                                    Principal: <span className="font-mono">{formatCurrency(formPrincipal)}</span>
                                    {formInterestPercent > 0 && (
                                      <span> + Juros ({formInterestPercent}%): <span className="text-amber-400 font-mono">+{formatCurrency(formInterestAmount)}</span></span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    Total a receber: <strong className="text-emerald-400 font-mono">{formatCurrency(formTotalWithInterest)}</strong>
                                  </div>
                                </div>

                                <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 sm:border-transparent">
                                  <div className="text-[10px] uppercase text-slate-400 font-bold">Cada Parcela ({formInstallments}x)</div>
                                  <div className="text-base font-black font-mono text-emerald-400">
                                    {formatCurrency(formInstallmentVal)} <span className="text-[10px] font-normal text-slate-400">/ mês</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/5">
                              <button
                                type="button"
                                onClick={() => setIsAddingCobranca(false)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                  isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/30 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Salvar Cobrança</span>
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    );
                  })()}
                </AnimatePresence>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Scope toggle */}
                    <div className={`p-1 rounded-xl flex items-center gap-1 border ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-white/5'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setCobrancasScopeFilter('current')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          cobrancasScopeFilter === 'current'
                            ? 'bg-amber-600 text-white'
                            : isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        Mês Atual
                      </button>
                      <button
                        type="button"
                        onClick={() => setCobrancasScopeFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          cobrancasScopeFilter === 'all'
                            ? 'bg-amber-600 text-white'
                            : isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        Todas
                      </button>
                    </div>

                    {/* Status filter */}
                    <div className={`p-1 rounded-xl flex items-center gap-1 border ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-white/5'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setCobrancasStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          cobrancasStatusFilter === 'all'
                            ? isLight ? 'bg-slate-800 text-white' : 'bg-slate-800 text-white'
                            : isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => setCobrancasStatusFilter('pendente')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          cobrancasStatusFilter === 'pendente'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        Em Aberto
                      </button>
                      <button
                        type="button"
                        onClick={() => setCobrancasStatusFilter('pago')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          cobrancasStatusFilter === 'pago'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        Quitadas
                      </button>
                    </div>
                  </div>

                  {/* Search box */}
                  <div className="relative sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={cobrancaSearch}
                      onChange={(e) => setCobrancaSearch(e.target.value)}
                      placeholder="Buscar por nome ou motivo..."
                      className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border focus:outline-none ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-900'
                          : 'bg-slate-900 border-white/5 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* List of Cobranças */}
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {filteredCobrancas.length === 0 ? (
                    <div className={`p-8 rounded-2xl border text-center space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/20 border-white/5'
                    }`}>
                      <Users className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
                      <div className="text-xs font-bold text-slate-400">Nenhuma cobrança encontrada</div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Clique em &quot;Nova Cobrança&quot; para registrar dívidas, parcelas e juros de quem deve pra você.
                      </p>
                    </div>
                  ) : (
                    filteredCobrancas.map((item) => {
                      const totalTarget = item.totalWithInterest || item.totalAmount || item.amount;
                      const paymentsList = item.payments || [];
                      const totalPaid = item.paidAmount ?? (paymentsList.reduce((s, p) => s + (p.amount || 0), 0));
                      const remaining = item.remainingAmount !== undefined ? item.remainingAmount : Math.max(0, totalTarget - totalPaid);
                      const isQuitado = item.status === 'pago' || remaining <= 0.01;
                      const installments = Math.max(1, item.installmentsCount || 1);
                      const installmentVal = item.installmentAmount || Math.round((totalTarget / installments) * 100) / 100;
                      const paymentsCount = paymentsList.length;

                      // Payments made in current month
                      const paidInCurrentMonth = paymentsList
                        .filter(p => p.monthKey === currentMonthKey)
                        .reduce((s, p) => s + (p.amount || 0), 0) + 
                        (!paymentsList.length && isQuitado && (item.paidMonthKey === currentMonthKey || item.monthKey === currentMonthKey) ? (item.paidAmount || item.amount) : 0);

                      const progressPercent = Math.min(100, Math.max(0, Math.round((totalPaid / totalTarget) * 100)));
                      const isExpanded = !!expandedHistories[item.id];

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isQuitado
                              ? isLight
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-emerald-950/20 border-emerald-500/25'
                              : isLight
                              ? 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-white/5'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            {/* Debtor Info */}
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                                isQuitado
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}>
                                {item.debtorName.charAt(0).toUpperCase()}
                              </div>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-sm leading-tight">{item.debtorName}</span>
                                  {isQuitado ? (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Quitado Integralmente
                                    </span>
                                  ) : paymentsCount > 0 ? (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> Em Andamento ({paymentsCount}/{installments} parcelas)
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> Pendente ({installments}x)
                                    </span>
                                  )}

                                  {item.interestRatePercent && item.interestRatePercent > 0 ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-0.5">
                                      <Percent className="w-2.5 h-2.5" /> +{item.interestRatePercent}% juros
                                    </span>
                                  ) : null}
                                </div>

                                {item.description && (
                                  <div className="text-xs text-slate-400">{item.description}</div>
                                )}

                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                                  {item.startDate && (
                                    <span className="flex items-center gap-1 font-mono">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      <span>Início: {item.startDate.split('-').reverse().join('/')}</span>
                                    </span>
                                  )}
                                  {item.dueDate && (
                                    <span className="flex items-center gap-1 font-mono text-amber-500 font-bold">
                                      <Calendar className="w-3 h-3 text-amber-500" />
                                      <span>Data Combinada / 1º Vencimento: {item.dueDate.split('-').reverse().join('/')}</span>
                                    </span>
                                  )}
                                  {item.monthKey && (
                                    <span className="flex items-center gap-1 font-mono text-sky-400 font-bold">
                                      <Calendar className="w-3 h-3 text-sky-400" />
                                      <span>Mês de Pagamento: {formatMonthKey(item.monthKey)}</span>
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    {installments}x de {formatCurrency(installmentVal)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {!isQuitado ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPayModal(item)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                                    title="Marcar parcela como paga no mês"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Pagar Parcela ({formatCurrency(Math.min(installmentVal, remaining))})</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onToggleCobrancaStatus(item.id, currentMonthKey)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                                      isLight
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                                    }`}
                                    title="Quitar todo o restante de uma vez"
                                  >
                                    Quitar Total
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onToggleCobrancaStatus(item.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                                    isLight
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                                  }`}
                                  title="Reabrir cobrança como pendente"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Reabrir</span>
                                </button>
                              )}

                              {/* Delete cobrança */}
                              <button
                                type="button"
                                onClick={() => onDeleteCobranca(item.id)}
                                className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center cursor-pointer transition-colors"
                                title="Excluir cobrança"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Financial Progress & Breakdown */}
                          <div className={`mt-3 p-3 rounded-xl border space-y-2 ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'
                          }`}>
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-400 flex items-center gap-1">
                                <span>Progresso da Quitação:</span>
                                <strong className="text-emerald-400 font-mono">{progressPercent}%</strong>
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {paymentsCount} de {installments} parcelas pagas
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isQuitado ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>

                            {/* Values Grid */}
                            <div className="grid grid-cols-3 gap-2 pt-1 text-center sm:text-left">
                              <div>
                                <div className="text-[9px] uppercase font-bold text-slate-500">Total Devido</div>
                                <div className="text-xs font-black font-mono mt-0.5">
                                  {formatCurrency(totalTarget)}
                                </div>
                              </div>

                              <div>
                                <div className="text-[9px] uppercase font-bold text-emerald-500">Já Recebido</div>
                                <div className="text-xs font-black font-mono text-emerald-400 mt-0.5">
                                  {formatCurrency(totalPaid)}
                                </div>
                              </div>

                              <div>
                                <div className="text-[9px] uppercase font-bold text-amber-500">Restante a Pagar</div>
                                <div className="text-xs font-black font-mono text-amber-400 mt-0.5">
                                  {formatCurrency(remaining)}
                                </div>
                              </div>
                            </div>

                            {/* Current month income addition highlight */}
                            {paidInCurrentMonth > 0 && (
                              <div className="pt-1.5 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span>+{formatCurrency(paidInCurrentMonth)} recebido neste mês de {formatMonthKey(currentMonthKey)} (somado aos seus ganhos)!</span>
                              </div>
                            )}
                          </div>

                          {/* Payments History Accordion Toggle */}
                          {paymentsList.length > 0 && (
                            <div className="mt-2.5">
                              <button
                                type="button"
                                onClick={() => toggleHistory(item.id)}
                                className={`text-[11px] font-bold flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg transition-colors ${
                                  isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                                }`}
                              >
                                <History className="w-3.5 h-3.5" />
                                <span>Histórico de Parcelas Pagas ({paymentsList.length})</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-2 space-y-1.5 pl-2 border-l-2 border-emerald-500/30"
                                >
                                  {paymentsList.map((p, idx) => (
                                    <div
                                      key={p.id}
                                      className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/5'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                                          ✓
                                        </div>
                                        <div>
                                          <div className="font-bold text-[11px]">
                                            {p.note || `Parcela ${p.installmentNumber || idx + 1}`}
                                          </div>
                                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                            <span>{p.date ? p.date.split('-').reverse().join('/') : '-'}</span>
                                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                                              Renda de {formatMonthKey(p.monthKey)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-emerald-400 text-xs">
                                          +{formatCurrency(p.amount)}
                                        </span>
                                        {onDeleteCobrancaPayment && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeletePayment(item.id, p.id)}
                                            className="w-6 h-6 rounded-md hover:bg-rose-500/20 text-rose-500 flex items-center justify-center cursor-pointer transition-colors"
                                            title="Desfazer este pagamento e restaurar saldo devedor"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sub-Modal / Popover to Record Monthly Payment */}
                <AnimatePresence>
                  {payingCobranca && (() => {
                    const cob = payingCobranca;
                    const totalToPay = cob.totalWithInterest || cob.totalAmount || cob.amount;
                    const paidSoFar = cob.paidAmount ?? ((cob.payments || []).reduce((s, p) => s + (p.amount || 0), 0));
                    const remaining = cob.remainingAmount !== undefined ? cob.remainingAmount : Math.max(0, totalToPay - paidSoFar);
                    const installments = Math.max(1, cob.installmentsCount || 1);
                    const installmentVal = cob.installmentAmount || Math.round((totalToPay / installments) * 100) / 100;

                    const amtEntered = parseMoney(paymentAmountStr);
                    const projectedRemaining = Math.max(0, remaining - amtEntered);

                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => !isSubmittingPayment && setPayingCobranca(null)}
                          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
                        />

                        <motion.div
                          initial={{ scale: 0.95, y: 15 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.95, y: 15 }}
                          className={`w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 space-y-4 border ${
                            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                <DollarSign className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm leading-tight">Registrar Pagamento de Parcela</h3>
                                <p className="text-[11px] text-slate-400">Devedor: <strong>{cob.debtorName}</strong></p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPayingCobranca(null)}
                              className="text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Quick Debt Stats */}
                          <div className={`p-3 rounded-2xl border grid grid-cols-2 gap-2 text-xs ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-white/5'
                          }`}>
                            <div>
                              <div className="text-[10px] uppercase text-slate-400 font-bold">Total da Dívida</div>
                              <div className="text-xs font-mono font-bold mt-0.5">{formatCurrency(totalToPay)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-amber-500 font-bold">Saldo Restante Atual</div>
                              <div className="text-xs font-mono font-black text-amber-400 mt-0.5">{formatCurrency(remaining)}</div>
                            </div>
                          </div>

                          <form onSubmit={handleConfirmPayment} className="space-y-3.5">
                            {/* Valor Pago */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                                Valor Recebido nesta Parcela *
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={paymentAmountStr}
                                onChange={(e) => setPaymentAmountStr(handleMaskMoney(e.target.value))}
                                className={`w-full text-base font-mono font-black px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                                    : 'bg-slate-950 border-white/10 text-emerald-400 focus:border-emerald-500'
                                }`}
                                required
                              />

                              {/* Quick selection chips */}
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPaymentAmountStr(formatCurrency(Math.min(installmentVal, remaining)))}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer border ${
                                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                                  }`}
                                >
                                  1 Parcela ({formatCurrency(Math.min(installmentVal, remaining))})
                                </button>
                                {remaining > installmentVal && (
                                  <button
                                    type="button"
                                    onClick={() => setPaymentAmountStr(formatCurrency(remaining))}
                                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
                                  >
                                    Quitar Restante ({formatCurrency(remaining)})
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Mês de Competência */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                                Mês de Competência (Será somado na renda deste mês!) *
                              </label>
                              <input
                                type="month"
                                value={paymentMonthKey}
                                onChange={(e) => setPaymentMonthKey(e.target.value)}
                                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                                  isLight
                                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                                    : 'bg-slate-950 border-white/10 text-white focus:border-emerald-500'
                                }`}
                                required
                              />
                            </div>

                            {/* Data do Pagamento */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                                  Data do Recebimento
                                </label>
                                <input
                                  type="date"
                                  value={paymentDate}
                                  onChange={(e) => setPaymentDate(e.target.value)}
                                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${
                                    isLight
                                      ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                                      : 'bg-slate-950 border-white/10 text-white focus:border-emerald-500'
                                  }`}
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                                  Identificação / Parcela
                                </label>
                                <input
                                  type="text"
                                  value={paymentNote}
                                  onChange={(e) => setPaymentNote(e.target.value)}
                                  placeholder="Ex: Parcela 1 de 5"
                                  className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${
                                    isLight
                                      ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                                      : 'bg-slate-950 border-white/10 text-white focus:border-emerald-500'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Impact summary preview */}
                            {amtEntered > 0 && (
                              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                                isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/25'
                              }`}>
                                <div className="font-bold text-emerald-400 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Impacto no seu orçamento:</span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  • <strong className="text-emerald-400 font-mono">+{formatCurrency(amtEntered)}</strong> somado na renda de <strong>{formatMonthKey(paymentMonthKey)}</strong>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  • Restará <strong className="text-amber-400 font-mono">{formatCurrency(projectedRemaining)}</strong> nos meses seguintes {projectedRemaining <= 0 ? '(Dívida 100% quitada!)' : ''}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                disabled={isSubmittingPayment}
                                onClick={() => setPayingCobranca(null)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                                  isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                disabled={isSubmittingPayment}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                              >
                                <Check className="w-4 h-4" />
                                <span>{isSubmittingPayment ? 'Confirmando...' : 'Confirmar Recebimento'}</span>
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className={`p-4 border-t flex items-center justify-between gap-3 transition-colors ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/5'
          }`}>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Sincronizado em tempo real com o Firestore</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
            >
              Concluir
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
