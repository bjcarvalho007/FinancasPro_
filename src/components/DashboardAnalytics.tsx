import { useState } from 'react';
import { Transaction, Category } from '../types';
import { 
  Sparkles, 
  BarChart2, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Wallet, 
  ArrowUpRight, 
  DollarSign, 
  CheckCircle2, 
  Percent, 
  ShieldAlert, 
  ListChecks, 
  History, 
  Calendar,
  Activity,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardAnalyticsProps {
  transactions: Transaction[]; // Active month transactions
  allTransactions?: Transaction[]; // ALL lifetime transactions
  currentMonthKey?: string; // e.g. "2026-05"
  categoriesList: Category[];
  totalAvailable: number;
  leftover: number;
  income: number;
  balance: number;
  extra: number;
  currentTheme?: 'dark' | 'light';
}

export default function DashboardAnalytics({
  transactions = [],
  allTransactions = [],
  currentMonthKey = '2026-05',
  categoriesList = [],
  totalAvailable = 0,
  leftover = 0,
  income = 0,
  balance = 0,
  extra = 0,
  currentTheme = 'dark'
}: DashboardAnalyticsProps) {
  // Toggle between active month 'current' or total lifetime records 'history'
  const [activeDashboardMode, setActiveDashboardMode] = useState<'current' | 'history'>('current');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const isLight = currentTheme === 'light';
  const todayStr = '2026-05-29'; // Dynamic reference baseline for overdue liabilities

  // Format key-value months cleanly (Brazilian calendar)
  const formatMonthKey = (key: string) => {
    if (!key || !key.includes('-')) return key;
    const [year, month] = key.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const idx = parseInt(month, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${months[idx]} ${year}`;
    }
    return key;
  };

  // Safe list fallbacks
  const listActive = transactions;
  const listAll = allTransactions.length > 0 ? allTransactions : transactions;

  // 1. DYNAMIC COLOR SCHEME REFERENCE FOR CATEGORIES
  const getCategoryThemeStyle = (key: string) => {
    const styles: Record<string, { bg: string, border: string, text: string, color1: string, color2: string }> = {
      moradia: {
        bg: isLight ? 'bg-blue-50/50' : 'bg-blue-500/5',
        border: isLight ? 'border-blue-200' : 'border-blue-500/10',
        text: isLight ? 'text-blue-700 font-bold' : 'text-blue-400',
        color1: '#3b82f6',
        color2: '#1d4ed8'
      },
      mercado: {
        bg: isLight ? 'bg-amber-50/50' : 'bg-amber-500/5',
        border: isLight ? 'border-amber-200' : 'border-amber-500/10',
        text: isLight ? 'text-amber-700 font-bold' : 'text-amber-400',
        color1: '#f59e0b',
        color2: '#d97706'
      },
      transporte: {
        bg: isLight ? 'bg-teal-50/50' : 'bg-teal-500/5',
        border: isLight ? 'border-teal-200' : 'border-teal-500/10',
        text: isLight ? 'text-teal-700 font-bold' : 'text-teal-400',
        color1: '#0d9488',
        color2: '#0f766e'
      },
      saude: {
        bg: isLight ? 'bg-rose-50/50' : 'bg-rose-500/5',
        border: isLight ? 'border-rose-200' : 'border-rose-500/10',
        text: isLight ? 'text-rose-700 font-bold' : 'text-rose-400',
        color1: '#f43f5e',
        color2: '#be123c'
      },
      educacao: {
        bg: isLight ? 'bg-violet-50/50' : 'bg-violet-500/5',
        border: isLight ? 'border-violet-200' : 'border-violet-500/10',
        text: isLight ? 'text-violet-700 font-bold' : 'text-violet-400',
        color1: '#8b5cf6',
        color2: '#6d28d9'
      },
      estetica: {
        bg: isLight ? 'bg-purple-50/50' : 'bg-purple-500/5',
        border: isLight ? 'border-purple-200' : 'border-purple-500/10',
        text: isLight ? 'text-purple-700 font-bold' : 'text-purple-400',
        color1: '#a855f7',
        color2: '#7e22ce'
      },
      lazer: {
        bg: isLight ? 'bg-pink-50/50' : 'bg-pink-500/5',
        border: isLight ? 'border-pink-200' : 'border-pink-500/10',
        text: isLight ? 'text-pink-700 font-bold' : 'text-pink-400',
        color1: '#ec4899',
        color2: '#9d174d'
      },
      restaurante: {
        bg: isLight ? 'bg-orange-50/50' : 'bg-orange-500/5',
        border: isLight ? 'border-orange-200' : 'border-orange-500/10',
        text: isLight ? 'text-orange-700 font-bold' : 'text-orange-400',
        color1: '#f97316',
        color2: '#c2410c'
      },
      assinaturas: {
        bg: isLight ? 'bg-cyan-50/50' : 'bg-cyan-500/5',
        border: isLight ? 'border-cyan-200' : 'border-cyan-500/10',
        text: isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400',
        color1: '#06b6d4',
        color2: '#0891b2'
      },
      comunicacao: {
        bg: isLight ? 'bg-lime-50/50' : 'bg-lime-500/5',
        border: isLight ? 'border-lime-200' : 'border-lime-500/10',
        text: isLight ? 'text-lime-700 font-bold' : 'text-lime-400',
        color1: '#84cc16',
        color2: '#4d7c0f'
      },
      outros: {
        bg: isLight ? 'bg-slate-100' : 'bg-slate-500/5',
        border: isLight ? 'border-slate-200' : 'border-slate-500/10',
        text: isLight ? 'text-slate-700 font-bold' : 'text-slate-400',
        color1: '#64748b',
        color2: '#475569'
      }
    };
    return styles[key] || styles.outros;
  };

  // ==========================================
  // A. COMPUTE ACTIVE MONTH SCORE (MÊS ATUAL)
  // ==========================================
  const totalSpentMonth = listActive.reduce((sum, t) => sum + t.amount, 0);
  const totalPaidMonth = listActive.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  const totalUnpaidMonth = Math.max(0, totalSpentMonth - totalPaidMonth);
  const paidInMonthRatio = totalSpentMonth > 0 ? (totalPaidMonth / totalSpentMonth) * 100 : 100;

  // Split spend typologies for month
  const totalFixosMonth = listActive.filter(t => t.type === 'fixos').reduce((sum, t) => sum + t.amount, 0);
  const totalVariaveisMonth = listActive.filter(t => t.type === 'variaveis').reduce((sum, t) => sum + t.amount, 0);
  const totalParcelasMonth = listActive.filter(t => t.type === 'parcelas').reduce((sum, t) => sum + t.amount, 0);

  // Indicadores de Equilíbrio
  const liquidezScoreMonth = totalAvailable > 0 
    ? Math.max(10, Math.min(100, Math.round(100 - (totalSpentMonth / totalAvailable) * 100))) 
    : 45;
  const adimplenciaScoreMonth = Math.round(paidInMonthRatio);

  const overdueMonthTransactions = listActive.filter(t => (t.paid_amount || 0) < t.amount && t.due < todayStr);
  const pontualidadeScoreMonth = Math.max(15, Math.min(100, 100 - overdueMonthTransactions.length * 25));

  // Nota de controle do mês
  const activeMonthHealthScore = Math.round(
    liquidezScoreMonth * 0.40 + 
    adimplenciaScoreMonth * 0.40 + 
    pontualidadeScoreMonth * 0.20
  );

  let activeMonthLabel = 'Organização Excelente';
  let activeMonthColor = 'text-emerald-400';
  let activeStrokeColor = '#10b981';
  if (activeMonthHealthScore < 50) {
    activeMonthLabel = 'Atenção Necessária';
    activeMonthColor = 'text-rose-400';
    activeStrokeColor = '#f43f5e';
  } else if (activeMonthHealthScore < 75) {
    activeMonthLabel = 'Equilibrado';
    activeMonthColor = 'text-amber-400';
    activeStrokeColor = '#f59e0b';
  }

  // Notificações do Mês Focado
  const monthAlerts: { id: string; type: 'error' | 'warning' | 'success'; text: string; details?: string }[] = [];
  
  if (overdueMonthTransactions.length > 0) {
    monthAlerts.push({
      id: 'month-overdue',
      type: 'error',
      text: `${overdueMonthTransactions.length} contas aguardando pagamento neste mês`,
      details: `Lembre-se de verificar suas contas agendadas e marcar como pagas para manter seu controle perfeito: ${overdueMonthTransactions.map(t => `'${t.name}'`).join(', ')}.`
    });
  }

  const activeMonthSpentRatio = totalAvailable > 0 ? (totalSpentMonth / totalAvailable) * 100 : 0;
  if (activeMonthSpentRatio > 85) {
    monthAlerts.push({
      id: 'month-overspending',
      type: 'error',
      text: 'Limite de gastos quase atingido (mais de 85% do planejado)',
      details: `Você já comprometeu ${Math.round(activeMonthSpentRatio)}% do seu saldo total planejado para despesas.`
    });
  } else if (activeMonthSpentRatio > 65) {
    monthAlerts.push({
      id: 'month-warning-limit',
      type: 'warning',
      text: 'Seus gastos estão tomando uma boa parte do orçamento',
      details: `Consumo estável, representando ${Math.round(activeMonthSpentRatio)}% do seu limite. Resta apenas R$ ${leftover.toFixed(2)} disponíveis.`
    });
  }

  // Find category leakage for current month
  categoriesList.forEach(c => {
    const totalCat = listActive.filter(t => t.cat === c.value).reduce((sum, t) => sum + t.amount, 0);
    const catRatio = totalSpentMonth > 0 ? (totalCat / totalSpentMonth) * 100 : 0;
    if (catRatio > 40 && totalCat > 100) {
      monthAlerts.push({
        id: `month-leak-${c.value}`,
        type: 'warning',
        text: `Concentração de gastos em: ${c.label}`,
        details: `A categoria ${c.icon} ${c.label} representa ${Math.round(catRatio)}% do seu consumo total deste mês.`
      });
    }
  });

  if (monthAlerts.length === 0) {
    monthAlerts.push({
      id: 'month-success',
      type: 'success',
      text: 'Tudo perfeito! Suas contas estão em total conformidade e organizadas',
      details: 'Disponibilidade financeira ideal, sem transações com data pendente e com consumo planejado sob controle!'
    });
  }

  // ==========================================
  // B. COMPUTE LIFETIME HISTORICAL SCORE (VISÃO GERAL)
  // ==========================================
  const totalSpentAll = listAll.reduce((sum, t) => sum + t.amount, 0);
  const totalPaidAll = listAll.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  const totalUnpaidAll = Math.max(0, totalSpentAll - totalPaidAll);
  
  // Dynamic Score parameters
  const quitacaoScoreAll = totalSpentAll > 0 ? Math.round((totalPaidAll / totalSpentAll) * 100) : 100;
  
  // Find all unpaid historical transactions with PAST due dates (unreconciled past items)
  const pastUnreconciledTx = listAll.filter(t => (t.paid_amount || 0) < t.amount && t.due < todayStr);
  const conciliacaoScoreAll = Math.max(10, Math.min(100, 100 - pastUnreconciledTx.length * 10));

  // Installment strain: percentage of installments against all record values
  const totalParcelasAll = listAll.filter(t => t.type === 'parcelas').reduce((sum, t) => sum + t.amount, 0);
  const totalFixosAll = listAll.filter(t => t.type === 'fixos').reduce((sum, t) => sum + t.amount, 0);
  const totalVariaveisAll = listAll.filter(t => t.type === 'variaveis').reduce((sum, t) => sum + t.amount, 0);

  const installmentRatio = totalSpentAll > 0 ? (totalParcelasAll / totalSpentAll) * 100 : 0;
  const alavancagemScoreAll = Math.max(15, Math.min(100, 100 - Math.round(installmentRatio * 1.5)));

  // Global historical health score combined
  const globalHealthScore = Math.round(
    quitacaoScoreAll * 0.40 + 
    conciliacaoScoreAll * 0.40 + 
    alavancagemScoreAll * 0.20
  );

  let globalLabel = 'Organização Perfeita';
  let globalColor = 'text-emerald-400';
  let globalStrokeColor = '#10b981';
  if (globalHealthScore < 50) {
    globalLabel = 'Ajustes no Histórico Requeridos';
    globalColor = 'text-rose-400';
    globalStrokeColor = '#f43f5e';
  } else if (globalHealthScore < 75) {
    globalLabel = 'Bons Resultados Gerais';
    globalColor = 'text-amber-400';
    globalStrokeColor = '#f59e0b';
  }

  // Histórico de Inteligência Consolidada
  const historyAlerts: { id: string; type: 'error' | 'warning' | 'success'; text: string; details?: string }[] = [];

  const legacyPending = pastUnreconciledTx.filter(t => t.monthKey !== currentMonthKey);
  if (legacyPending.length > 0) {
    historyAlerts.push({
      id: 'history-legacy-unpaid',
      type: 'error',
      text: `${legacyPending.length} contas pendentes em meses anteriores`,
      details: `Dica amigável: Navegue para os meses passados no topo do painel e marque-as como pagas se já foram concluídas.`
    });
  }

  if (installmentRatio > 45) {
    historyAlerts.push({
      id: 'history-excessive-card',
      type: 'warning',
      text: `Uso considerável de compras parceladas (${Math.round(installmentRatio)}% do histórico)`,
      details: `Suas parcelas pendentes somam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalParcelasAll)}. Controlar novas parcelizações ajuda a manter as sobras sempre altas.`
    });
  }

  // Find negative months in historical balance
  const uniqueMonths = Array.from(new Set(listAll.map(t => t.monthKey)));
  let deficitMonthsCount = 0;
  uniqueMonths.forEach(mKey => {
    const listMonth = listAll.filter(t => t.monthKey === mKey);
    const spentMonth = listMonth.reduce((sum, t) => sum + t.amount, 0);
    if (spentMonth > income && income > 0) {
      deficitMonthsCount++;
    }
  });

  if (deficitMonthsCount > 0) {
    historyAlerts.push({
      id: 'history-deficit-warning',
      type: 'warning',
      text: `Meses em que seus gastos superaram sua renda base: ${deficitMonthsCount} ocorrência(s)`,
      details: `Em alguns meses anteriores, seu consumo superou a renda padrão cadastrada nas configurações.`
    });
  }

  if (historyAlerts.length === 0) {
    historyAlerts.push({
      id: 'history-clean-success',
      type: 'success',
      text: 'Histórico impecável: Tudo em dia nos meses anteriores!',
      details: 'Parabéns pela persistência e organização! Todos os seus meses passados estão fechados e concluídos.'
    });
  }

  // Determine standard charts based on the selection
  const activeScores = activeDashboardMode === 'current' 
    ? {
        score: activeMonthHealthScore,
        label: activeMonthLabel,
        colorClass: activeMonthColor,
        stroke: activeStrokeColor,
        metrics: [
          { name: 'Sobras Financeiras', val: liquidezScoreMonth, desc: 'Dinheiro livre em relação aos ganhos' },
          { name: 'Contas Pagas', val: adimplenciaScoreMonth, desc: 'Porcentagem do que já foi quitado' },
          { name: 'Organização de Prazos', val: pontualidadeScoreMonth, desc: 'Verifica se restam pendências para hoje' }
        ],
        alerts: monthAlerts,
        totalSpent: totalSpentMonth,
        totalPaid: totalPaidMonth,
        totalUnpaid: totalUnpaidMonth,
        splits: { fixos: totalFixosMonth, variaveis: totalVariaveisMonth, parcelas: totalParcelasMonth }
      }
    : {
        score: globalHealthScore,
        label: globalLabel,
        colorClass: globalColor,
        stroke: globalStrokeColor,
        metrics: [
          { name: 'Consistência de Pagamento', val: quitacaoScoreAll, desc: 'Porcentagem consolidada de contas pagas' },
          { name: 'Acompanhamento', val: conciliacaoScoreAll, desc: 'Controle de fechamento de meses antigos' },
          { name: 'Uso de Parcelas', val: alavancagemScoreAll, desc: 'Porcentagem de custos em formato parcelado' }
        ],
        alerts: historyAlerts,
        totalSpent: totalSpentAll,
        totalPaid: totalPaidAll,
        totalUnpaid: totalUnpaidAll,
        splits: { fixos: totalFixosAll, variaveis: totalVariaveisAll, parcelas: totalParcelasAll }
      };

  // Group by category based on current selected mode
  const currentModeTransactions = activeDashboardMode === 'current' ? listActive : listAll;
  const modeCategoryTotals: Record<string, number> = {};
  let modeTotalSpent = 0;
  
  currentModeTransactions.forEach(t => {
    const catKey = t.cat || 'outros';
    modeCategoryTotals[catKey] = (modeCategoryTotals[catKey] || 0) + t.amount;
    modeTotalSpent += t.amount;
  });

  const modeSortedCategories = Object.entries(modeCategoryTotals)
    .map(([key, value]) => {
      const catObj = categoriesList.find(c => c.value === key) || { icon: '📦', label: 'Outros', value: 'outros', id: '', userId: '' };
      return {
        ...catObj,
        key,
        amountValue: value,
        pct: modeTotalSpent > 0 ? Math.round((value / modeTotalSpent) * 100) : 0
      };
    })
    .sort((a, b) => b.amountValue - a.amountValue);

  // Highest expense item based on mode
  let highestExpenseItem = { name: 'Nenhum', amount: 0, cat: 'outros' };
  currentModeTransactions.forEach(t => {
    if (t.amount > highestExpenseItem.amount) {
      highestExpenseItem = { name: t.name, amount: t.amount, cat: t.cat };
    }
  });

  // Projeção Próxima e Médio custo
  const averageItemCost = currentModeTransactions.length > 0 ? (modeTotalSpent / currentModeTransactions.length) : 0;

  // Render variables helper
  const fmt = (v: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  };

  const circumference = 2 * Math.PI * 34;
  const strokeDashoffsetCurrent = circumference - (activeMonthHealthScore / 100) * circumference;
  const strokeDashoffsetHistory = circumference - (globalHealthScore / 100) * circumference;

  // Evolution of balance for the last months
  const monthlyBalanceEvolution = uniqueMonths.map(mKey => {
    const monthTx = listAll.filter(t => t.monthKey === mKey);
    const spent = monthTx.reduce((sum, t) => sum + t.amount, 0);
    const paid = monthTx.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
    // Rough monthly revenue: base income + extras for that month
    return {
      monthKey: mKey,
      label: formatMonthKey(mKey),
      spent,
      paid,
      balance: income - spent,
      txCount: monthTx.length
    };
  }).sort((a, b) => b.monthKey.localeCompare(a.monthKey)).slice(0, 5); // display 5 newest months

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: SUPERIOR INTUITIVE BENTO CONTROLS (DIVERGENT POINTS CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BENTO CARD A: ACTIVE MONTH SCORE (CLICKABLE TOGGLE) */}
        <button
          onClick={() => setActiveDashboardMode('current')}
          className={`w-full text-left p-6 rounded-3xl transition-all duration-300 relative overflow-hidden border flex flex-col sm:flex-row items-center gap-6 cursor-pointer ${
            activeDashboardMode === 'current'
              ? isLight 
                ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-500/10 hover:border-indigo-600 scale-[1.01]' 
                : 'bg-[#090d1c]/90 border-indigo-500/60 shadow-2xl shadow-indigo-500/10 scale-[1.01]'
              : isLight
                ? 'bg-white hover:bg-slate-50/70 border-slate-200/80 hover:border-slate-300 opacity-80'
                : 'bg-[#090d1c]/40 hover:bg-[#090d1c]/60 border-white/5 hover:border-white/10 opacity-70'
          }`}
        >
          {activeDashboardMode === 'current' && (
            <div className="absolute top-3 right-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-widest leading-none">
              Visualização Ativa
            </div>
          )}

          {/* Radial circular progress chart */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" className="fill-none stroke-white/5" strokeWidth="6" />
              <motion.circle
                cx="40" cy="40" r="34" className="fill-none stroke-linecap-round"
                stroke={activeStrokeColor} strokeWidth="6" strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeDashoffsetCurrent }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className="font-mono text-2xl font-extrabold text-white leading-none">
                {activeMonthHealthScore}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pontos</span>
            </div>
          </div>

          {/* Descriptive Context */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/5 ${activeMonthColor}`}>
                ● {activeMonthLabel}
              </span>
              <span className="text-[9.5px] text-slate-500 font-extrabold uppercase tracking-widest flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5 text-indigo-400" /> Mês: {formatMonthKey(currentMonthKey)}
              </span>
            </div>
            <h3 className="font-display font-black text-sm text-slate-100 tracking-tight leading-tight">
              Desempenho do Mês
            </h3>
            <p className="text-[11.5px] text-slate-400 leading-normal font-light">
              Mede o quanto sobrou no seu bolso e o progresso dos pagamentos registrados para o mês de {formatMonthKey(currentMonthKey)}.
            </p>

            {/* Sub-metrics progress tracks */}
            <div className="space-y-1 pt-1 opacity-90">
              <div className="flex justify-between text-[9px] font-bold text-slate-400">
                <span>Liquidez</span>
                <span>{liquidezScoreMonth}%</span>
              </div>
              <div className="h-1 w-full bg-slate-950/45 rounded-full overflow-hidden">
                <div style={{ width: `${liquidezScoreMonth}%` }} className="bg-indigo-500 h-full rounded-full" />
              </div>
            </div>
          </div>
        </button>

        {/* BENTO CARD B: GLOBAL LFETIME AUDIT SCORE (CLICKABLE TOGGLE) */}
        <button
          onClick={() => setActiveDashboardMode('history')}
          className={`w-full text-left p-6 rounded-3xl transition-all duration-300 relative overflow-hidden border flex flex-col sm:flex-row items-center gap-6 cursor-pointer ${
            activeDashboardMode === 'history'
              ? isLight 
                ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-500/10 hover:border-indigo-600 scale-[1.01]' 
                : 'bg-[#090d1c]/90 border-indigo-500/60 shadow-2xl shadow-indigo-500/10 scale-[1.01]'
              : isLight
                ? 'bg-white hover:bg-slate-50/70 border-slate-200/80 hover:border-slate-300 opacity-80'
                : 'bg-[#090d1c]/40 hover:bg-[#090d1c]/60 border-white/5 hover:border-white/10 opacity-70'
          }`}
        >
          {activeDashboardMode === 'history' && (
            <div className="absolute top-3 right-3 bg-zinc-400/10 text-slate-200 border border-slate-400/20 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-widest leading-none">
              Visualização Ativa
            </div>
          )}

          {/* Radial circular progress chart */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" className="fill-none stroke-white/5" strokeWidth="6" />
              <motion.circle
                cx="40" cy="40" r="34" className="fill-none stroke-linecap-round"
                stroke={globalStrokeColor} strokeWidth="6" strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeDashoffsetHistory }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className="font-mono text-2xl font-extrabold text-white leading-none">
                {globalHealthScore}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Nível</span>
            </div>
          </div>

          {/* Descriptive Context */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/5 ${globalColor}`}>
                ● {globalLabel}
              </span>
              <span className="text-[9.5px] text-slate-500 font-extrabold uppercase tracking-widest flex items-center gap-0.5">
                <History className="w-2.5 h-2.5 text-indigo-400" /> Histórico Geral (Tudo)
              </span>
            </div>
            <h3 className="font-display font-black text-sm text-slate-100 tracking-tight leading-tight">
              Planejamento Geral
            </h3>
            <p className="text-[11.5px] text-slate-400 leading-normal font-light">
              Mede seu controle geral de contas ao longo do tempo, o fechamento correto dos meses anteriores e o peso de parcelas futuras.
            </p>

            {/* Sub-metrics progress tracks */}
            <div className="space-y-1 pt-1 opacity-90">
              <div className="flex justify-between text-[9px] font-bold text-slate-400">
                <span>Adimplência Global</span>
                <span>{quitacaoScoreAll}%</span>
              </div>
              <div className="h-1 w-full bg-slate-950/45 rounded-full overflow-hidden">
                <div style={{ width: `${quitacaoScoreAll}%` }} className="bg-emerald-500 h-full rounded-full" />
              </div>
            </div>
          </div>
        </button>

      </div>

      {/* INTELLIGENCE RECOMMENDATIONS BOX BASED ON SELECTED MODE */}
      <motion.div
        layout
        className="p-5 rounded-r-3xl border-l-[4px] border-indigo-500 bg-indigo-500/5 flex items-start gap-4 animate-in fade-in duration-300"
      >
        <Lightbulb className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1 select-none">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
            ⚡ Recomendação Inteligente (IA FinançasPro: {activeDashboardMode === 'current' ? 'Mês Focado' : 'Histórico Geral'})
          </h4>
          <p className="text-[12.5px] text-slate-350 leading-relaxed font-light">
            {activeDashboardMode === 'current' ? (
              // Active Month Advice
              transactions.length === 0 ? (
                <span><strong>Pronto para monitorar:</strong> Adicione suas contas e despesas para acompanhar seu planejamento financeiro de {formatMonthKey(currentMonthKey)}.</span>
              ) : activeMonthSpentRatio > 85 ? (
                <span>🚨 <strong>Atenção ao saldo disponível:</strong> Seus gastos cadastrados representam <strong>{Math.round(activeMonthSpentRatio)}%</strong> do seu limite mensal. O maior valor registrado é de <strong>&quot;{highestExpenseItem.name}&quot;</strong> ({fmt(highestExpenseItem.amount)}). Procure focar em manter as contas prioritárias pagas antes de fazer novas despesas variáveis.</span>
              ) : activeMonthSpentRatio > 60 ? (
                <span>⚠️ <strong>Saldo próximo ao limite:</strong> Você comprometeu <strong>{Math.round(activeMonthSpentRatio)}%</strong> da sua renda total do mês. Restam {fmt(leftover)} livres. É um excelente momento para conter despesas extras e assegurar esse saldo positivo.</span>
              ) : (
                <span>💎 <strong>Excelente controle mensal!</strong> Você utilizou apenas <strong>{Math.round(activeMonthSpentRatio)}%</strong> do seu orçamento disponível. Com uma ótima folga de <strong>{fmt(leftover)}</strong>, você está em uma ótima posição para guardar o excedente em suas metas ou cofrinhos!</span>
              )
            ) : (
              // Historical Long-Term Advice
              allTransactions.length === 0 ? (
                <span><strong>Sem histórico suficiente:</strong> Ao cadastrar suas transações ao longo do tempo, você verá insights completos de evolução e controle de gastos históricos aqui.</span>
              ) : pastUnreconciledTx.length > 0 ? (
                <span>🔴 <strong>Contas anteriores aguardando pagamento:</strong> Foram encontradas <strong>{pastUnreconciledTx.length} contas de meses anteriores</strong> ainda pendentes de fechamento. Para manter seu histórico correto, acesse as abas dos meses passados e registre o pagamento se já tiverem sido pagas.</span>
              ) : installmentRatio > 40 ? (
                <span>⚠️ <strong>Foco nos parcelamentos:</strong> Suas parcelas futuras representam <strong>{Math.round(installmentRatio)}%</strong> do seu histórico geral de gastos ({fmt(totalParcelasAll)}). Acompanhar as parcelas ativamente ajuda você a não sobrecarregar sua renda futura.</span>
              ) : (
                <span>💎 <strong>Organização Fantástica!</strong> Sua pontuação consolidada de <strong>{globalHealthScore} pontos</strong> indica controle excepcional! Você mantém seu histórico limpo sem pendências de meses passados abertas, e suas parcelas futuras estão perfeitamente equilibradas.</span>
              )
            )}
          </p>
        </div>
      </motion.div>

      {/* SECTION 2: COMPARATIVE ALERTS (ALERTA EM TODAS AS CONTAS INTELIGENTES SEPARADOS) */}
      <div className={`p-6 rounded-3xl border transition-colors duration-300 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#090d1c]/45 border-white/5'
      }`}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-400 animate-pulse" />
            <h4 className="font-display font-black text-sm text-slate-100 uppercase tracking-wider">
              Avisos & Alertas Importantes ({activeDashboardMode === 'current' ? 'Mês Atual' : 'Histórico Geral'})
            </h4>
          </div>
          <span className="text-[9px] font-black uppercase text-slate-500 bg-white/5 px-2.5 py-1 rounded-md tracking-wider">
            {activeScores.alerts.length} Notificações Ativas
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {activeScores.alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  alert.type === 'error'
                    ? 'bg-rose-500/5 border-rose-500/10 text-rose-300'
                    : alert.type === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/10 text-amber-300'
                      : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                  alert.type === 'error'
                    ? 'bg-rose-500/10 text-rose-450'
                    : alert.type === 'warning'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {alert.type === 'error' ? '🔴' : alert.type === 'warning' ? '⚠️' : '💚'}
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-[12.5px] font-black tracking-tight text-slate-100 leading-tight">
                    {alert.text}
                  </h5>
                  <p className="text-[11.5px] text-slate-400 font-light leading-relaxed mt-1">
                    {alert.details}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* SECTION 3: KEY METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Custo Crítico / Maior</span>
          <span className="text-base font-mono font-extrabold text-rose-400 truncate block mb-0.5" title={highestExpenseItem.name}>
            {fmt(highestExpenseItem.amount)}
          </span>
          <span className="text-[10px] text-slate-500 truncate block font-bold uppercase tracking-wider">
            {highestExpenseItem.name}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Média por Contrato</span>
          <span className="text-base font-mono font-extrabold text-slate-200 block mb-0.5">
            {fmt(averageItemCost)}
          </span>
          <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">
            Total {currentModeTransactions.length} registros
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Relação Comprometida</span>
          <span className="text-base font-mono font-extrabold text-amber-400 block mb-0.5">
            {fmt(activeScores.totalSpent)}
          </span>
          <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">
            Total de obrigações registradas
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Saldo Liquidado Real</span>
          <span className="text-base font-mono font-extrabold text-emerald-400 block mb-0.5">
            {fmt(activeScores.totalPaid)}
          </span>
          <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">
            Amortizado até agora
          </span>
        </div>

      </div>

      {/* SECTION 4: BAR COLUMN ALLOCATION PIE CHART */}
      <div className={`p-6 rounded-3xl transition-all duration-300 border ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl shadow-slate-100/35 text-slate-800' 
          : 'glass-panel border-white/5 shadow-2xl text-slate-100'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h4 className={`font-display font-extrabold text-sm tracking-wide flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <BarChart2 className="w-4 h-4 text-emerald-400" /> 
            Distribuição de Gastos do Escopo ({activeDashboardMode === 'current' ? 'Mês Focado' : 'Tudo'})
          </h4>
        </div>
        
        {modeSortedCategories.length === 0 ? (
          <div className={`h-48 flex flex-col items-center justify-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            <BarChart2 className="w-8 h-8 opacity-25 mb-2" />
            Aguardando lançamentos para compor gráfico de colunas
          </div>
        ) : (
          <div className="w-full flex flex-col justify-center">
            <div className="w-full relative py-4">
              {(() => {
                const maxAmountValue = Math.max(...modeSortedCategories.map(c => c.amountValue), 1);
                const scaleMax = maxAmountValue * 1.15;
                const yTicks = [1, 0.75, 0.5, 0.25, 0];

                return (
                  <div className="space-y-6">
                    {/* Tooltip detail bar */}
                    <div className="h-10 flex items-center justify-between px-2">
                      {hoveredBar ? (() => {
                        const item = modeSortedCategories.find(c => c.key === hoveredBar);
                        if (!item) return <div />;
                        const style = getCategoryThemeStyle(item.key);
                        return (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: style.color1 }} />
                            <span className="text-lg leading-none">{item.icon}</span>
                            <div>
                              <span className={`text-[11px] font-extrabold uppercase tracking-widest ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                {item.label}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-bold">
                                {item.pct}% das despesas listadas
                              </span>
                            </div>
                          </div>
                        );
                      })() : (
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          Passe o mouse nas colunas para detalhar desvios
                        </span>
                      )}

                      {hoveredBar && (() => {
                        const item = modeSortedCategories.find(c => c.key === hoveredBar);
                        if (!item) return null;
                        return (
                          <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg ${
                            isLight ? 'bg-slate-100 text-slate-950 border border-slate-200' : 'bg-white/5 text-white border border-white/5'
                          }`}>
                            {fmt(item.amountValue)}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Columns structure */}
                    <div className="relative h-44 w-full flex items-end">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                        {yTicks.map((tick, i) => (
                          <div key={i} className="flex items-center w-full h-0">
                            <span className={`text-[9px] font-mono font-extrabold w-16 text-right pr-3 select-none flex-shrink-0 ${
                              isLight ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {fmt(tick * scaleMax)}
                            </span>
                            <div className={`flex-1 border-t border-dashed ${
                              isLight ? 'border-slate-100/85' : 'border-white/5'
                            }`} />
                          </div>
                        ))}
                      </div>

                      <div className="absolute inset-y-0 left-16 right-0 flex items-end justify-around pb-7">
                        {modeSortedCategories.map((item) => {
                          const style = getCategoryThemeStyle(item.key);
                          const precisePctOfMax = (item.amountValue / scaleMax) * 100;
                          const isHovered = hoveredBar === item.key;

                          return (
                            <div
                              key={item.key}
                              className="flex flex-col items-center group relative h-full justify-end cursor-pointer"
                              style={{ width: `${100 / modeSortedCategories.length}%`, maxWidth: '58px' }}
                              onMouseEnter={() => setHoveredBar(item.key)}
                              onMouseLeave={() => setHoveredBar(null)}
                            >
                              <div className="absolute inset-0 bg-transparent z-10" />

                              <div className="w-6 sm:w-8 h-full flex items-end justify-center relative rounded-t-xl overflow-hidden bg-slate-500/5 group-hover:bg-slate-500/10 transition-all duration-300">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${precisePctOfMax}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className="w-full rounded-t-xl opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-start p-1"
                                  style={{
                                    background: `linear-gradient(180deg, ${style.color1}, ${style.color2})`,
                                    boxShadow: isHovered ? `0 0 15px ${style.color1}40` : 'none',
                                  }}
                                >
                                  <div className="w-full h-1 bg-white/30 rounded-full opacity-65" />
                                </motion.div>
                              </div>

                              <div className={`absolute -bottom-5 flex flex-col items-center transition-transform ${isHovered ? 'scale-110' : ''}`}>
                                <span className="text-sm leading-none drop-shadow-sm select-none">
                                  {item.icon}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-around pl-16 pt-1 text-[8.5px] uppercase font-bold tracking-widest text-slate-500 select-none">
                      {modeSortedCategories.map((item) => (
                        <span 
                          key={item.key} 
                          className={`truncate text-center transition-colors duration-200 ${
                            hoveredBar === item.key 
                              ? (isLight ? 'text-indigo-600' : 'text-indigo-400') 
                              : 'text-slate-400'
                          }`} 
                          style={{ width: `${100 / modeSortedCategories.length}%`, maxWidth: '58px' }}
                        >
                          {item.label.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* COMPOSITION PROGRESS TRACK */}
      <div className="p-5 rounded-3xl glass-panel border-white/5">
        <h4 className="font-display font-extrabold text-sm text-slate-200 mb-4 uppercase tracking-wider">
          Composição Proporcional de Saídas ({activeDashboardMode === 'current' ? 'Mês Focado' : 'Tudo'})
        </h4>
        
        {(() => {
          const sumSplits = activeScores.splits.fixos + activeScores.splits.variaveis + activeScores.splits.parcelas;
          const pctFix = sumSplits > 0 ? Math.round((activeScores.splits.fixos / sumSplits) * 100) : 0;
          const pctVar = sumSplits > 0 ? Math.round((activeScores.splits.variaveis / sumSplits) * 100) : 0;
          const pctPar = sumSplits > 0 ? Math.round((activeScores.splits.parcelas / sumSplits) * 100) : 0;

          return (
            <div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden flex">
                <div style={{ width: `${pctFix}%` }} className="bg-indigo-505 bg-indigo-500 h-full" title="Fixos"></div>
                <div style={{ width: `${pctVar}%` }} className="bg-emerald-500 h-full" title="Variáveis"></div>
                <div style={{ width: `${pctPar}%` }} className="bg-amber-500 h-full" title="Parcelamentos"></div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center select-none">
                <div>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1.5" />
                  <span className="text-[10px] font-bold text-slate-400">Fixos: {pctFix}%</span>
                  <span className="block text-[10px] font-mono font-semibold text-slate-500">{fmt(activeScores.splits.fixos)}</span>
                </div>
                <div>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
                  <span className="text-[10px] font-bold text-slate-400">Variáveis: {pctVar}%</span>
                  <span className="block text-[10px] font-mono font-semibold text-slate-500">{fmt(activeScores.splits.variaveis)}</span>
                </div>
                <div>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
                  <span className="text-[10px] font-bold text-slate-400">Parcelados: {pctPar}%</span>
                  <span className="block text-[10px] font-mono font-semibold text-slate-500">{fmt(activeScores.splits.parcelas)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SECTION 5: EVOLUTION TIMELINE (SÓ APARECE EM HISTÓRICO GERAL PARA AUMENTAR INTELIGENCIA) */}
      {activeDashboardMode === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-3xl border transition-colors duration-300 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#090d1c]/45 border-white/5'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-indigo-400" />
            <h4 className="font-display font-black text-sm text-slate-100 uppercase tracking-wider">
              Evolução e Margem Líquida (Últimos Ciclos Ativos)
            </h4>
          </div>

          {monthlyBalanceEvolution.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Nenhum histórico registrado.</p>
          ) : (
            <div className="space-y-3">
              {monthlyBalanceEvolution.map((evol) => {
                const isPositive = evol.balance >= 0;
                return (
                  <div 
                    key={evol.monthKey}
                    className={`p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4`}
                  >
                    <div>
                      <span className="text-xs font-black text-slate-200">{evol.label}</span>
                      <div className="flex gap-2 text-[10.5px] text-slate-450 mt-1">
                        <span>Lançamentos: <strong>{evol.txCount}</strong></span>
                        <span>•</span>
                        <span>Despesa total: <strong>{fmt(evol.spent)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Saldo Mensal</span>
                        <span className={`text-[12.5px] font-mono font-extrabold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {evol.balance > 0 ? '+' : ''}{fmt(evol.balance)}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider leading-none select-none ${
                        isPositive 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                      }`}>
                        {isPositive ? '✔ Superávit' : '🗙 Déficit'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
