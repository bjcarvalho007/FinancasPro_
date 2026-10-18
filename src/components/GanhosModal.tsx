import React, { useState, useMemo } from 'react';
import { Setting, ExtraEarning, CobrancaItem } from '../types';
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
  Sparkles
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
  onToggleCobrancaStatus: (id: string, targetPaidMonthKey?: string) => Promise<void>;
  onDeleteCobranca: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
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
  const [cobrancaAmountStr, setCobrancaAmountStr] = useState<string>('');
  const [cobrancaDueDate, setCobrancaDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cobrancaMonthKey, setCobrancaMonthKey] = useState<string>(currentMonthKey);
  const [cobrancasScopeFilter, setCobrancasScopeFilter] = useState<'current' | 'all'>('current');
  const [cobrancasStatusFilter, setCobrancasStatusFilter] = useState<'all' | 'pendente' | 'pago'>('all');
  const [cobrancaSearch, setCobrancaSearch] = useState<string>('');

  const handleCreateCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cobrancaDebtor.trim()) {
      showToast('Informe o nome da pessoa que deve.', 'warning');
      return;
    }
    const amt = parseMoney(cobrancaAmountStr);
    if (amt <= 0) {
      showToast('Informe o valor da cobrança.', 'warning');
      return;
    }

    // Determine monthKey from due date if not custom
    let assignedMonth = cobrancaMonthKey;
    if (cobrancaDueDate && (!assignedMonth || cobrancasScopeFilter === 'current')) {
      const [y, m] = cobrancaDueDate.split('-');
      if (y && m) assignedMonth = `${y}-${m}`;
    }

    try {
      await onAddCobranca({
        debtorName: cobrancaDebtor.trim(),
        description: cobrancaDesc.trim() || undefined,
        amount: amt,
        dueDate: cobrancaDueDate || undefined,
        monthKey: assignedMonth || currentMonthKey,
        status: 'pendente'
      });
      setCobrancaDebtor('');
      setCobrancaDesc('');
      setCobrancaAmountStr('');
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
    return cobrancasAll
      .filter(c => c.status === 'pago' && (c.paidMonthKey === currentMonthKey || (!c.paidMonthKey && c.monthKey === currentMonthKey)))
      .reduce((sum, c) => sum + (c.paidAmount || c.amount || 0), 0);
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
      // Scope filter
      if (cobrancasScopeFilter === 'current') {
        const matchesRef = item.monthKey === currentMonthKey;
        const matchesPaid = item.paidMonthKey === currentMonthKey;
        if (!matchesRef && !matchesPaid) return false;
      }
      // Status filter
      if (cobrancasStatusFilter !== 'all' && item.status !== cobrancasStatusFilter) {
        return false;
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
      // Pending first, then by date
      if (a.status !== b.status) {
        return a.status === 'pendente' ? -1 : 1;
      }
      return (b.dueDate || b.createdAt).localeCompare(a.dueDate || a.createdAt);
    });
  }, [cobrancasAll, cobrancasScopeFilter, cobrancasStatusFilter, cobrancaSearch, currentMonthKey]);

  // Cobranças metrics
  const totalCobrancasPendentes = useMemo(() => {
    return cobrancasAll
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + c.amount, 0);
  }, [cobrancasAll]);

  const totalCobrancasGeral = useMemo(() => {
    return cobrancasAll.reduce((sum, c) => sum + c.amount, 0);
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
                      Liste quem deve para você. Ao marcar uma cobrança como <strong className="text-emerald-400">PAGA</strong>, ela é somada automaticamente na renda do mês!
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-500/20'
                  }`}>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Total Pendente a Receber</span>
                    </div>
                    <div className="text-xl font-black font-mono text-amber-400 mt-1">
                      {formatCurrency(totalCobrancasPendentes)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/20'
                  }`}>
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Recebido no Mês (Somado na Renda)</span>
                    </div>
                    <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                      +{formatCurrency(cobrancasPagasNoMes)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-white/5'
                  }`}>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Cobranças Cadastradas</span>
                    </div>
                    <div className="text-xl font-black font-mono mt-1">
                      {cobrancasAll.length}
                    </div>
                  </div>
                </div>

                {/* Form to Add New Cobranca */}
                <AnimatePresence>
                  {isAddingCobranca && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleCreateCobranca}
                      className={`p-5 rounded-2xl border space-y-4 overflow-hidden ${
                        isLight ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-950/60 border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4" />
                          <span>Cadastrar Pessoa que Deve</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddingCobranca(false)}
                          className="text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5">
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            Nome da Pessoa
                          </label>
                          <input
                            type="text"
                            value={cobrancaDebtor}
                            onChange={(e) => setCobrancaDebtor(e.target.value)}
                            placeholder="Ex: Carlos Oliveira, Juliana..."
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
                            }`}
                            required
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            Motivo / Descrição
                          </label>
                          <input
                            type="text"
                            value={cobrancaDesc}
                            onChange={(e) => setCobrancaDesc(e.target.value)}
                            placeholder="Ex: Empréstimo, Venda celular, Aluguel..."
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
                            }`}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            Valor Devido
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cobrancaAmountStr}
                            onChange={(e) => setCobrancaAmountStr(handleMaskMoney(e.target.value))}
                            placeholder="R$ 0,00"
                            className={`w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
                            }`}
                            required
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            Data Combinada / Vencimento
                          </label>
                          <input
                            type="date"
                            value={cobrancaDueDate}
                            onChange={(e) => setCobrancaDueDate(e.target.value)}
                            className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
                            }`}
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            Mês de Competência
                          </label>
                          <input
                            type="month"
                            value={cobrancaMonthKey}
                            onChange={(e) => setCobrancaMonthKey(e.target.value)}
                            className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                                : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingCobranca(false)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                            isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Salvar Cobrança
                        </button>
                      </div>
                    </motion.form>
                  )}
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
                        Pendentes
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
                        Pagas
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
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {filteredCobrancas.length === 0 ? (
                    <div className={`p-8 rounded-2xl border text-center space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/20 border-white/5'
                    }`}>
                      <Users className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
                      <div className="text-xs font-bold text-slate-400">Nenhuma cobrança encontrada</div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Clique em &quot;Nova Cobrança&quot; para registrar pessoas que devem para você.
                      </p>
                    </div>
                  ) : (
                    filteredCobrancas.map((item) => {
                      const isPago = item.status === 'pago';

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isPago
                              ? isLight
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-emerald-950/20 border-emerald-500/25'
                              : isLight
                              ? 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-white/5'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Person info */}
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                                isPago
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}>
                                {item.debtorName.charAt(0).toUpperCase()}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm leading-tight">{item.debtorName}</span>
                                  {isPago ? (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Pago
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> A Receber
                                    </span>
                                  )}
                                </div>

                                {item.description && (
                                  <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                                )}

                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                                  {item.dueDate && (
                                    <span className="flex items-center gap-1 font-mono">
                                      <Calendar className="w-3 h-3" />
                                      Combinado: {item.dueDate.split('-').reverse().join('/')}
                                    </span>
                                  )}
                                  {isPago && item.paidAt && (
                                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                                      <FileCheck className="w-3 h-3" />
                                      Pago em {item.paidAt.split('-').reverse().join('/')}
                                    </span>
                                  )}
                                  {isPago && (
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                      + {formatCurrency(item.paidAmount || item.amount)} somado na renda de {formatMonthKey(item.paidMonthKey || item.monthKey)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                              <div className="text-left sm:text-right">
                                <div className="text-[9px] uppercase font-bold text-slate-400">Valor</div>
                                <div className={`text-base font-black font-mono ${
                                  isPago ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                  {formatCurrency(item.amount)}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Toggle status button */}
                                {isPago ? (
                                  <button
                                    type="button"
                                    onClick={() => onToggleCobrancaStatus(item.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                                      isLight
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                                    }`}
                                    title="Desmarcar pagamento e reabrir cobrança"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Desmarcar</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onToggleCobrancaStatus(item.id, currentMonthKey)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                                    title="Marcar como recebido e somar à renda do mês"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Marcar Pago</span>
                                  </button>
                                )}

                                {/* Delete button */}
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
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
