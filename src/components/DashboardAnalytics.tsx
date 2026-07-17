import { useState } from 'react';
import { Transaction, Category } from '../types';
import { 
  Sparkles, 
  BarChart2, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle, 
  Lightbulb, 
  Wallet, 
  DollarSign, 
  CheckCircle2, 
  Percent, 
  ShieldAlert, 
  ListChecks, 
  History, 
  Calendar,
  Activity,
  ChevronRight,
  Info,
  X,
  Receipt,
  Coins,
  CreditCard
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
  settings?: any;
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
  currentTheme = 'dark',
  settings = null
}: DashboardAnalyticsProps) {
  // Toggle between active month 'current' or total lifetime records 'history'
  const [activeDashboardMode, setActiveDashboardMode] = useState<'current' | 'history'>('current');
  const [metricsScope, setMetricsScope] = useState<'month' | 'general'>('month');
  const [showAssistantTip, setShowAssistantTip] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [showIntelligentAlertsModal, setShowIntelligentAlertsModal] = useState(false);

  const isLight = currentTheme === 'light';
  const todayStr = '2026-05-29'; // Dynamic reference baseline for overdue liabilities

  // Variables for extra earnings detail dashboard section
  const extraHistory = settings?.extraEarnings || [];
  const filteredExtras = extraHistory.filter((item: any) => {
    if (activeDashboardMode === 'current') {
      return item.monthKey === currentMonthKey;
    }
    return true;
  }).sort((a: any, b: any) => b.date.localeCompare(a.date));

  const totalExtras = filteredExtras.reduce((sum: number, item: any) => sum + item.amount, 0);
  const topSource = filteredExtras.length > 0 
    ? [...filteredExtras].sort((a: any, b: any) => b.amount - a.amount)[0] 
    : null;

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
  const listAllRaw = allTransactions.length > 0 ? allTransactions : transactions;

  // Normalize listAll:
  // 1. Only include transactions with monthKey <= currentMonthKey (exclude future months ahead of selected month)
  // 2. For 'parcelas' transactions, normalize their evaluated amount to use the correct monthly due value instead of the total balance.
  const listAll = listAllRaw
    .filter(t => !t.monthKey || t.monthKey <= currentMonthKey)
    .map(t => {
      if (t.type === 'parcelas') {
        const masterId = t.masterId || t.id;
        const masterTx = listAllRaw.find(m => m.id === masterId) || t;
        const extraGasto = masterTx.extra_gasto || 0;

        const totalOriginalBase = masterTx.total_parcelado || masterTx.amount || 0;
        const totalVal = totalOriginalBase + extraGasto;
        const count = masterTx.installmentsCount || 1;
        
        // If the specific month transaction t has its own custom amount, prioritize it!
        const installmentValue = (t.amount && t.amount > 0)
          ? t.amount
          : ( (masterTx.amount && masterTx.amount > 0 && masterTx.amount !== (masterTx.total_parcelado || 0))
              ? masterTx.amount
              : (totalVal / count) );

        return {
          ...t,
          amount: t.paid_amount > 0 ? t.paid_amount : installmentValue,
          total_parcelado: totalOriginalBase
        };
      }
      return t;
    });

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

  const overdueMonthTransactions = listActive.filter(t => (t.paid_amount || 0) < t.amount && t.due && t.due < todayStr);
  const pontualidadeScoreMonth = Math.max(15, Math.min(100, 100 - overdueMonthTransactions.length * 25));

  // Nota de controle do mês
  const rawMonthHealthScore = Math.round(
    liquidezScoreMonth * 0.40 + 
    adimplenciaScoreMonth * 0.40 + 
    pontualidadeScoreMonth * 0.20
  );

  // Se sobrou algo o cara no mes fez uma boa gestão - give high bonus and clear designation
  const hasLeftover = leftover > 0;
  const activeMonthHealthScore = hasLeftover 
    ? Math.min(100, rawMonthHealthScore + 15) // Boost score for successful dynamic monthly leftover
    : leftover < 0 
      ? Math.max(15, rawMonthHealthScore - 15) // Penalize slightly for deficit
      : rawMonthHealthScore;

  let activeMonthLabel = 'Tudo Certo';
  let activeMonthColor = 'text-emerald-400';
  let activeStrokeColor = '#10b981';

  if (leftover > 0) {
    activeMonthLabel = 'Superavit (Sobrou Dinheiro)';
    activeMonthColor = 'text-emerald-400';
    activeStrokeColor = '#10b981';
  } else if (leftover < 0) {
    activeMonthLabel = 'Atenção (Gasto Alto)';
    activeMonthColor = 'text-rose-400';
    activeStrokeColor = '#f43f5e';
  } else {
    if (activeMonthHealthScore < 50) {
      activeMonthLabel = 'Precisa de Atenção';
      activeMonthColor = 'text-rose-400';
      activeStrokeColor = '#f43f5e';
    } else if (activeMonthHealthScore < 75) {
      activeMonthLabel = 'Contas no Limite';
      activeMonthColor = 'text-amber-400';
      activeStrokeColor = '#f59e0b';
    } else {
      activeMonthLabel = 'Muito Organizado';
      activeMonthColor = 'text-emerald-400';
      activeStrokeColor = '#10b981';
    }
  }

  // Notificações do Mês Focado
  const monthAlerts: { id: string; type: 'error' | 'warning' | 'success'; text: string; details?: string }[] = [];

  // Explicar se sobrou e destacar a boa gestão
  if (leftover > 0) {
    monthAlerts.push({
      id: 'month-leftover-management-success',
      type: 'success',
      text: `Muito bem! Sobrou ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(leftover)} no mês`,
      details: `Você gastou menos do que tinha disponível neste mês de ${formatMonthKey(currentMonthKey)}! Esse dinheiro que sobrou livre pode ser guardado, investido ou usado para realizar suas metas.`
    });
  } else if (leftover < 0) {
    monthAlerts.push({
      id: 'month-leftover-management-deficit',
      type: 'error',
      text: `Gasto acima do orçamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(leftover))}`,
      details: `Seus gastos e contas neste mês foram maiores que sua renda disponível. Tente reduzir as despesas extras nas próximas semanas.`
    });
  } else if (totalAvailable > 0) {
    monthAlerts.push({
      id: 'month-leftover-management-even',
      type: 'warning',
      text: 'Contas no limite (zero sobras)',
      details: 'Você conseguiu pagar tudo em dia, mas não sobrou nenhum dinheirinho livre após quitar as contas deste mês.'
    });
  }

  if (overdueMonthTransactions.length > 0) {
    monthAlerts.push({
      id: 'month-overdue',
      type: 'error',
      text: `${overdueMonthTransactions.length} contas atrasadas neste mês`,
      details: `Por favor, lembre-se de conferir e marcar como pagas as seguintes contas: ${overdueMonthTransactions.map(t => `'${t.name}'`).join(', ')}.`
    });
  }

  const activeMonthSpentRatio = totalAvailable > 0 ? (totalSpentMonth / totalAvailable) * 100 : 0;
  if (activeMonthSpentRatio > 85) {
    monthAlerts.push({
      id: 'month-overspending',
      type: 'error',
      text: 'Atenção: Quase todo o seu dinheiro já foi usado (mais de 85% comprometido)',
      details: `Você já comprometeu ${Math.round(activeMonthSpentRatio)}% da sua grana neste mês com despesas.`
    });
  } else if (activeMonthSpentRatio > 65) {
    monthAlerts.push({
      id: 'month-warning-limit',
      type: 'warning',
      text: 'Seus gastos estão tomando boa parte da sua renda',
      details: `Suas despesas consomem ${Math.round(activeMonthSpentRatio)}% de toda a sua renda disponível neste ciclo.`
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
        text: `Gasto concentrado em: ${c.label}`,
        details: `A categoria ${c.icon} ${c.label} representa ${Math.round(catRatio)}% de tudo que você gastou neste mês.`
      });
    }
  });

  if (monthAlerts.length === 0) {
    monthAlerts.push({
      id: 'month-success',
      type: 'success',
      text: 'Tudo excelente! Suas contas estão organizadas e em dia',
      details: 'Nenhuma conta atrasada e gastos dentro do planejado. Excelente trabalho!'
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
  const pastUnreconciledTx = listAll.filter(t => (t.paid_amount || 0) < t.amount && t.due && t.due < todayStr);
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

  let globalLabel = 'Tudo Pago no Passado!';
  let globalColor = 'text-emerald-400';
  let globalStrokeColor = '#10b981';
  if (globalHealthScore < 50) {
    globalLabel = 'Ficou Conta Pendente';
    globalColor = 'text-rose-400';
    globalStrokeColor = '#f43f5e';
  } else if (globalHealthScore < 75) {
    globalLabel = 'Bons Resultados';
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
      text: `${legacyPending.length} conta(s) pendente(s) em meses passados`,
      details: `Dica amigável: Mude para os meses anteriores no menu superior e marque essas contas como pagas se você já pagou elas.`
    });
  }

  if (installmentRatio > 45) {
    historyAlerts.push({
      id: 'history-excessive-card',
      type: 'warning',
      text: `Muitas parcelas no cartão (${Math.round(installmentRatio)}% do total)`,
      details: `Suas faturas parceladas somam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalParcelasAll)}. Evitar novos parcelamentos ajuda a ter mais dinheiro livre todo mês.`
    });
  }

  // Find negative months in historical balance
  const uniqueMonths = Array.from(new Set(listAll.map(t => t.monthKey)));
  let deficitMonthsCount = 0;
  uniqueMonths.forEach(mKey => {
    const listMonth = listAll.filter(t => t.monthKey === mKey);
    const spentMonth = listMonth.reduce((sum, t) => sum + t.amount, 0);
    const mIncome = settings?.monthlyIncome?.[mKey] || settings?.income || 0;
    const mBalance = settings?.monthlyBalance?.[mKey] || settings?.balance || 0;
    const mExtra = settings?.extras?.[mKey] ?? 0;
    const totalInflows = mIncome + mBalance + mExtra;
    if (spentMonth > totalInflows && totalInflows > 0) {
      deficitMonthsCount++;
    }
  });

  if (deficitMonthsCount > 0) {
    historyAlerts.push({
      id: 'history-deficit-warning',
      type: 'warning',
      text: `Meses em que gastou mais do que ganhou: ${deficitMonthsCount} ocorrência(s)`,
      details: `Em alguns meses anteriores, seu consumo superou a renda padrão cadastrada nas configurações.`
    });
  }

  if (historyAlerts.length === 0) {
    historyAlerts.push({
      id: 'history-clean-success',
      type: 'success',
      text: 'Tudo certinho nos meses passados!',
      details: 'Parabéns pela organização! Todas as suas faturas dos meses anteriores já foram pagas.'
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
          { name: 'Dinheiro Livre', val: liquidezScoreMonth, desc: 'Dinheiro que sobrou em relação aos ganhos' },
          { name: 'Contas Pagas', val: adimplenciaScoreMonth, desc: 'Porcentagem de contas que já foram quitadas' },
          { name: 'Contas em Dia', val: pontualidadeScoreMonth, desc: 'Verifica se restam contas vencidas sem pagar' }
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
          { name: 'Contas Pagas', val: quitacaoScoreAll, desc: 'Porcentagem de todas as contas que você já pagou' },
          { name: 'Verificação Mensal', val: conciliacaoScoreAll, desc: 'Garantia de que os meses anteriores terminaram pagos' },
          { name: 'Nível de Parcelas', val: alavancagemScoreAll, desc: 'Quanto de parcelamentos você tem no total' }
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

  // Deduplicate and combine all system alerts to meet "e que nada se repita" requirement
  const allSystemAlerts = [...historyAlerts, ...monthAlerts];
  const uniqueSystemAlerts = allSystemAlerts.reduce((acc, current) => {
    const isDuplicate = acc.some(item => item.text.trim().toLowerCase() === current.text.trim().toLowerCase());
    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof monthAlerts);

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
    
    // Dynamic per-month metrics using settings mappings
    const mIncome = settings?.monthlyIncome?.[mKey] || settings?.income || 0;
    const mBalance = settings?.monthlyBalance?.[mKey] || settings?.balance || 0;
    const mExtra = settings?.extras?.[mKey] ?? 0;
    const totalInflows = mIncome + mBalance + mExtra;
    const leftoverMargin = totalInflows - spent;

    return {
      monthKey: mKey,
      label: formatMonthKey(mKey),
      spent,
      paid,
      balance: leftoverMargin,
      txCount: monthTx.length
    };
  }).sort((a, b) => b.monthKey.localeCompare(a.monthKey)).slice(0, 5); // display 5 newest months

  // ========================================================
  // PREVIOUS MONTH VS CURRENT MONTH COMPARISON LOGIC
  // ========================================================
  const getPreviousMonthKey = (monthKey: string) => {
    if (!monthKey || !monthKey.includes('-')) return '';
    const [yearStr, monthStr] = monthKey.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const prevMonthKey = getPreviousMonthKey(currentMonthKey);
  const prevMonthLabel = formatMonthKey(prevMonthKey);
  const currentMonthLabel = formatMonthKey(currentMonthKey);

  // Previous month transactions
  const prevMonthTransactions = listAll.filter(t => t.monthKey === prevMonthKey);

  // Compute stats for previous month
  const prevSpent = prevMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const prevPaid = prevMonthTransactions.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  const prevIncome = settings?.monthlyIncome?.[prevMonthKey] || settings?.income || 0;
  const prevBalanceOld = settings?.monthlyBalance?.[prevMonthKey] || settings?.balance || 0;
  const prevExtra = settings?.extras?.[prevMonthKey] || 0;
  const prevTotalAvailable = prevIncome + prevBalanceOld + prevExtra;
  const prevLeftover = prevTotalAvailable - prevSpent;

  // Current month stats copy for clarity
  const currSpent = totalSpentMonth;
  const currTotalAvailable = totalAvailable;
  const currLeftover = leftover;

  // Deltas and percentage changes
  const spentDelta = currSpent - prevSpent;
  const leftoverDelta = currLeftover - prevLeftover;
  const availableDelta = currTotalAvailable - prevTotalAvailable;

  const spentPercentSelect = prevSpent > 0 ? (spentDelta / prevSpent) * 100 : 0;
  const leftoverPercentSelect = prevLeftover !== 0 ? (leftoverDelta / Math.abs(prevLeftover)) * 100 : 0;
  const availablePercentSelect = prevTotalAvailable > 0 ? (availableDelta / prevTotalAvailable) * 100 : 0;

  // Mapping the aliases for JSX matching
  const hasPrevData = prevMonthTransactions.length > 0 || prevTotalAvailable > 0;
  const curInflows = currTotalAvailable;
  const prevInflows = prevTotalAvailable;
  const inflowDiff = availableDelta;
  const inflowPct = availablePercentSelect;
  const curSpent = currSpent;
  const spentDiff = spentDelta;
  const spentPct = spentPercentSelect;
  const curLeftover = currLeftover;
  const leftoverDiff = leftoverDelta;
  const leftoverPct = leftoverPercentSelect;

  const prevAdimplencia = prevSpent > 0 ? Math.round((prevPaid / prevSpent) * 100) : 100;
  const currentAdimplencia = currSpent > 0 ? Math.round((totalPaidMonth / currSpent) * 100) : 100;
  const adimplenciaDiff = currentAdimplencia - prevAdimplencia;

  const prevFixos = prevMonthTransactions.filter(t => t.type === 'fixos').reduce((sum, t) => sum + t.amount, 0);
  const prevVariaveis = prevMonthTransactions.filter(t => t.type === 'variaveis').reduce((sum, t) => sum + t.amount, 0);
  const prevParcelas = prevMonthTransactions.filter(t => t.type === 'parcelas').reduce((sum, t) => sum + t.amount, 0);

  // Proportional percentages mapping
  const prevInflowSum = prevInflows > 0 ? prevInflows : (prevSpent + Math.max(0, prevLeftover));
  const pctPrevFix = prevInflowSum > 0 ? (prevFixos / prevInflowSum) * 100 : 0;
  const pctPrevVar = prevInflowSum > 0 ? (prevVariaveis / prevInflowSum) * 100 : 0;
  const pctPrevPar = prevInflowSum > 0 ? (prevParcelas / prevInflowSum) * 100 : 0;
  const pctPrevLeft = prevInflowSum > 0 ? (Math.max(0, prevLeftover) / prevInflowSum) * 100 : 0;

  const curInflowSum = curInflows > 0 ? curInflows : (curSpent + Math.max(0, curLeftover));
  const pctCurFix = curInflowSum > 0 ? (totalFixosMonth / curInflowSum) * 100 : 0;
  const pctCurVar = curInflowSum > 0 ? (totalVariaveisMonth / curInflowSum) * 100 : 0;
  const pctCurPar = curInflowSum > 0 ? (totalParcelasMonth / curInflowSum) * 100 : 0;
  const pctCurLeft = curInflowSum > 0 ? (Math.max(0, curLeftover) / curInflowSum) * 100 : 0;

  // Analytical qualitative summary
  const moMAnalysisNarrative = (() => {
    let text = "";
    let positiveCount = 0;
    let negativeCount = 0;
    
    if (inflowDiff > 0) {
      text += `Você recebeu **${fmt(inflowDiff)}** a mais (+${inflowPct.toFixed(1)}%) do que no mês de ${formatMonthKey(prevMonthKey)}. `;
      positiveCount++;
    } else if (inflowDiff < 0) {
      text += `Sua renda total disponível encolheu em **${fmt(Math.abs(inflowDiff))}** (-${Math.abs(inflowPct).toFixed(1)}%). `;
      negativeCount++;
    } else {
      text += `Sua renda disponível se manteve idêntica à do mês passado. `;
    }

    if (spentDiff > 0) {
      text += `Por outro lado, as contas e gastos consolidaram um aumento de **${fmt(spentDiff)}** (+${spentPct.toFixed(1)}%). `;
      if (inflowDiff > 0) {
        text += `Isso significa que o dinheiro extra obtido acabou indo para despesas novas. `;
      } else {
        text += `Como você ganhou menos e gastou mais, recomendamos evitar novas compras até reequilibrar seu saldo. `;
      }
      negativeCount++;
    } else if (spentDiff < 0) {
      text += `Que boa notícia! Seus gastos diminuíram em **${fmt(Math.abs(spentDiff))}** (-${Math.abs(spentPct).toFixed(1)}%), mostrando ótimo controle das suas faturas! `;
      positiveCount++;
    } else {
      text += `Você gastou a mesma quantia que no mês correspondente anterior. `;
    }

    if (leftoverDiff > 0) {
      text += `Dessa forma, a sobra de dinheiro livre cresceu em **${fmt(leftoverDiff)}** comparado a ${formatMonthKey(prevMonthKey)}. Continue operando com essa incrível disciplina!`;
      positiveCount++;
    } else if (leftoverDiff < 0) {
      text += `Com isso, o saldo que sobrou na carteira diminuiu em **${fmt(Math.abs(leftoverDiff))}**. Dica: revise pequenos desvios em faturas e economize para voltar a ter uma sobra maior.`;
      negativeCount++;
    } else {
      text += `Sua sobra mensal de dinheiro permaneceu equilibrada. Continue monitorando para acumular um dinheirinho livre!`;
    }

    return { 
      text, 
      status: positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral' as 'positive' | 'negative' | 'neutral'
    };
  })();

  if (listAll.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 rounded-3xl border ${
            isLight 
              ? 'bg-gradient-to-br from-[#f5f3ff] via-white to-white border-violet-100 shadow-md shadow-violet-100/10 text-slate-900' 
              : 'bg-[#090d1c]/60 border border-indigo-500/15 text-white shadow-xl'
          }`}
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className={`p-4 rounded-2xl shrink-0 border ${
              isLight ? 'bg-violet-50 border-violet-100 text-violet-600' : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400'
            }`}>
              <Sparkles className="w-8 h-8 animate-pulse text-indigo-400" />
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-1">
                  Seja muito bem-vindo ao FinançasPro Premium
                </span>
                <h2 className="font-display font-black text-2xl tracking-tight leading-none mb-2">
                  Pronto para estruturar sua vida financeira? 🚀
                </h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} leading-relaxed font-light`}>
                  Seu painel de análise avançada e inteligência está esperando seu primeiro lançamento. Como este é o seu primeiro acesso e não há transações cadastradas ainda, siga o guia passo a passo abaixo para desbloquear suas métricas em poucos segundos:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-150' : 'bg-slate-900/40 border-white/5'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black flex items-center justify-center">1</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-205'}`}>Definir Ganhos</span>
                  </div>
                  <p className={`text-[11px] ${isLight ? 'text-slate-505' : 'text-slate-450'} leading-relaxed font-light`}>
                    Toque no botão <strong className="text-emerald-450 font-black">Ganhos</strong> no topo para cadastrar seu salário ou saldo em mãos do mês.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-150' : 'bg-slate-900/40 border-white/5'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black flex items-center justify-center">2</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-205'}`}>Primeiro Lançamento</span>
                  </div>
                  <p className={`text-[11px] ${isLight ? 'text-slate-505' : 'text-slate-450'} leading-relaxed font-light`}>
                    Clique em <strong className="text-indigo-400">Novo Lançamento</strong> para registrar suas primeiras faturas ou despesas recorrentes.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-150' : 'bg-slate-900/40 border-white/5'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black flex items-center justify-center">3</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-205'}`}>Acompanhar Insights</span>
                  </div>
                  <p className={`text-[11px] ${isLight ? 'text-slate-505' : 'text-slate-450'} leading-relaxed font-light`}>
                    Pronto! Nosso sistema calculará automaticamente o seu <strong className="text-indigo-400">Score de Saúde</strong> e apresentará insights!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Informative summary card inside empty dashboard */}
        <div className={`p-6 rounded-3xl border ${
          isLight ? 'bg-white/70 border-slate-200' : 'bg-[#090d1c]/40 border-white/5'
        } text-center space-y-4 max-w-lg mx-auto py-10`}>
          <div className="w-12 h-12 rounded-full bg-slate-500/5 border border-white/5 mx-auto flex items-center justify-center">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className={`font-display font-medium text-xs sm:text-sm uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-slate-250'}`}>Aguardando Seus Dados</h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'} leading-relaxed font-light`}>
              Assim que você registrar sua primeira despesa fixa, variável ou parcelada, este gráfico e os cartões de inteligência financeira serão gerados em tempo real de forma totalmente automatizada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxMonthVal = Math.max(totalFixosMonth, totalVariaveisMonth, totalParcelasMonth);
  const countFixosMonth = listActive.filter(t => t.type === 'fixos').length;
  const countVariaveisMonth = listActive.filter(t => t.type === 'variaveis').length;
  const countParcelasMonth = listActive.filter(t => t.type === 'parcelas').length;
  const pctFixos = totalSpentMonth > 0 ? Math.round((totalFixosMonth / totalSpentMonth) * 100) : 0;
  const pctVariaveis = totalSpentMonth > 0 ? Math.round((totalVariaveisMonth / totalSpentMonth) * 100) : 0;
  const pctParcelas = totalSpentMonth > 0 ? Math.round((totalParcelasMonth / totalSpentMonth) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* COMPARATIVO DE COMPROMISSOS DE GASTOS POR ABAS */}
      <div className={`p-5 rounded-3xl border transition-all ${
        isLight 
          ? 'bg-white border-slate-200/90 shadow-sm shadow-slate-100/50' 
          : 'bg-[#090d1c]/80 border-white/5 shadow-2xl shadow-black/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3.5 border-b border-dashed border-slate-200 dark:border-white/5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-0.5">
              ⚖️ Rateio de Despesas do Mês
            </span>
            <h4 className={`font-display font-black text-sm md:text-base tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Distribuição Financeira por Aba ({formatMonthKey(currentMonthKey)})
            </h4>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'} font-medium`}>
              Identifique em tempo real qual tipo de compromisso está consumindo a maior parte do seu orçamento.
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
              Total Comprometido: {fmt(totalSpentMonth)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Contas Fixas */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
              totalFixosMonth === maxMonthVal && maxMonthVal > 0
                ? isLight 
                  ? 'bg-rose-50/30 border-rose-250 hover:border-rose-350' 
                  : 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                : isLight
                  ? 'bg-slate-50/40 border-slate-200/80 hover:border-slate-300'
                  : 'bg-white/2 border-white/5 hover:border-white/10'
            }`}
          >
            {totalFixosMonth === maxMonthVal && maxMonthVal > 0 && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            )}
            
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  totalFixosMonth === maxMonthVal && maxMonthVal > 0
                    ? 'bg-rose-500/15 text-rose-500'
                    : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  <Receipt className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className={`font-display font-black text-xs uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Contas Fixas
                  </h5>
                  <span className={`text-[9.5px] font-bold ${isLight ? 'text-slate-450' : 'text-slate-500'} block`}>
                    {countFixosMonth} {countFixosMonth === 1 ? 'lançamento ativo' : 'lançamentos ativos'}
                  </span>
                </div>
              </div>

              {totalFixosMonth === maxMonthVal && maxMonthVal > 0 && (
                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/10 shrink-0">
                  ⚠️ Maior Gasto
                </span>
              )}
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className={`font-mono text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {fmt(totalFixosMonth)}
                </span>
                <span className="text-[10px] text-slate-450 font-bold font-mono">
                  ({pctFixos}%)
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalFixosMonth === maxMonthVal && maxMonthVal > 0 ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${pctFixos}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Gastos Variáveis */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
              totalVariaveisMonth === maxMonthVal && maxMonthVal > 0
                ? isLight 
                  ? 'bg-rose-50/30 border-rose-250 hover:border-rose-350' 
                  : 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                : isLight
                  ? 'bg-slate-50/40 border-slate-200/80 hover:border-slate-300'
                  : 'bg-white/2 border-white/5 hover:border-white/10'
            }`}
          >
            {totalVariaveisMonth === maxMonthVal && maxMonthVal > 0 && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            )}
            
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  totalVariaveisMonth === maxMonthVal && maxMonthVal > 0
                    ? 'bg-rose-500/15 text-rose-500'
                    : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  <Coins className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className={`font-display font-black text-xs uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Gastos Variáveis
                  </h5>
                  <span className={`text-[9.5px] font-bold ${isLight ? 'text-slate-450' : 'text-slate-500'} block`}>
                    {countVariaveisMonth} {countVariaveisMonth === 1 ? 'lançamento ativo' : 'lançamentos ativos'}
                  </span>
                </div>
              </div>

              {totalVariaveisMonth === maxMonthVal && maxMonthVal > 0 && (
                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/10 shrink-0">
                  ⚠️ Maior Gasto
                </span>
              )}
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className={`font-mono text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {fmt(totalVariaveisMonth)}
                </span>
                <span className="text-[10px] text-slate-450 font-bold font-mono">
                  ({pctVariaveis}%)
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalVariaveisMonth === maxMonthVal && maxMonthVal > 0 ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${pctVariaveis}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Card 3: Parcelados */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
              totalParcelasMonth === maxMonthVal && maxMonthVal > 0
                ? isLight 
                  ? 'bg-rose-50/30 border-rose-250 hover:border-rose-350' 
                  : 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                : isLight
                  ? 'bg-slate-50/40 border-slate-200/80 hover:border-slate-300'
                  : 'bg-white/2 border-white/5 hover:border-white/10'
            }`}
          >
            {totalParcelasMonth === maxMonthVal && maxMonthVal > 0 && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            )}
            
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  totalParcelasMonth === maxMonthVal && maxMonthVal > 0
                    ? 'bg-rose-500/15 text-rose-500'
                    : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className={`font-display font-black text-xs uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Gastos Parcelados
                  </h5>
                  <span className={`text-[9.5px] font-bold ${isLight ? 'text-slate-450' : 'text-slate-500'} block`}>
                    {countParcelasMonth} {countParcelasMonth === 1 ? 'parcela este mês' : 'parcelas este mês'}
                  </span>
                </div>
              </div>

              {totalParcelasMonth === maxMonthVal && maxMonthVal > 0 && (
                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/10 shrink-0">
                  ⚠️ Maior Gasto
                </span>
              )}
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className={`font-mono text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {fmt(totalParcelasMonth)}
                </span>
                <span className="text-[10px] text-slate-450 font-bold font-mono">
                  ({pctParcelas}%)
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalParcelasMonth === maxMonthVal && maxMonthVal > 0 ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${pctParcelas}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* SECTION 1: SUPERIOR INTUITIVE BENTO CONTROLS (DIVERGENT POINTS CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BENTO CARD A: ACTIVE MONTH SCORE (CLICKABLE TOGGLE) */}
        <button
          onClick={() => {
            setActiveDashboardMode('current');
            setShowAssistantTip(true);
          }}
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
              Como você foi no mês
            </h3>
            <p className="text-[11.5px] text-slate-400 leading-normal font-light">
              Mede quanto sobrou do seu dinheiro e se as suas contas do mês de {formatMonthKey(currentMonthKey)} já foram pagas.
            </p>

            {/* Sub-metrics progress tracks */}
            <div className="space-y-1 pt-1 opacity-90">
              <div className="flex justify-between text-[9px] font-bold text-slate-400">
                <span>Dinheiro que sobrou</span>
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
          onClick={() => {
            setActiveDashboardMode('history');
            setShowAssistantTip(true);
          }}
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
              Resumo de todas as contas
            </h3>
            <p className="text-[11.5px] text-slate-400 leading-normal font-light">
              Mede o controle das suas contas ao longo do tempo, se tem parcelas futuras acumuladas e se os meses passados terminaram pagos.
            </p>

            {/* Sub-metrics progress tracks */}
            <div className="space-y-1 pt-1 opacity-90">
              <div className="flex justify-between text-[9px] font-bold text-slate-400">
                <span>Total de contas pagas</span>
                <span>{quitacaoScoreAll}%</span>
              </div>
              <div className="h-1 w-full bg-slate-950/45 rounded-full overflow-hidden">
                <div style={{ width: `${quitacaoScoreAll}%` }} className="bg-emerald-500 h-full rounded-full" />
              </div>
            </div>
          </div>
        </button>

      </div>

      {/* FLOATING ANIMATED ASSISTANT TIP MODAL (OPENS ON CARD CLICK) */}
      <AnimatePresence>
        {showAssistantTip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssistantTip(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className={`relative w-full max-w-lg overflow-hidden rounded-3xl border p-6 shadow-2xl select-none z-10 ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-800' 
                  : 'bg-[#0a0f24] border-indigo-500/20 text-slate-100'
              }`}
            >
              {/* Top border decorative accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400">
                    <Lightbulb className="w-5 h-5 animate-pulse text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block leading-tight">
                      🤖 FinançasPro Assistente
                    </span>
                    <h3 className={`font-display font-black text-sm sm:text-base tracking-tight leading-none mt-1 ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      Dica: {activeDashboardMode === 'current' ? 'Como você foi no Mês' : 'Resumo de todas as contas'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssistantTip(false)}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer border-none hover:rotate-90 hover:scale-105 active:scale-95 ${
                    isLight 
                      ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700' 
                      : 'text-slate-500 hover:bg-white/5 hover:text-white'
                  }`}
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content body */}
              <div className="my-5 leading-relaxed font-sans">
                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'bg-indigo-50/20 border-slate-200/50' : 'bg-indigo-950/10 border-white/5'
                }`}>
                  <p className={`text-[12.5px] leading-relaxed font-light ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {activeDashboardMode === 'current' ? (
                      // Active Month Advice
                      transactions.length === 0 ? (
                        <span><strong>Pronto para começar:</strong> Adicione suas contas e ganhos para ver como está seu planejamento financeiro de {formatMonthKey(currentMonthKey)}.</span>
                      ) : leftover > 0 ? (
                        <span>💎 <strong>Excelente resultado!</strong> Sobrou <strong>{fmt(leftover)}</strong> livre no seu bolso após o pagamento das despesas planejadas para este mês. Você fez um ótimo controle do dinheiro em {formatMonthKey(currentMonthKey)}! Esse saldo é excelente para poupar ou realizar metas.</span>
                      ) : leftover < 0 ? (
                        <span>🚨 <strong>Atenção (Gasto um pouco alto):</strong> Seus gastos e contas superaram o dinheiro disponível deste mês em <strong>{fmt(Math.abs(leftover))}</strong>. No momento, você gastou mais do que ganhou. Recomendamos priorizar contas básicas e evitar compras extras até equilibrar o saldo.</span>
                      ) : (
                        <span>⚠️ <strong>Saldo no limite perfeito:</strong> Você fechou o mês de {formatMonthKey(currentMonthKey)} equilibrado em <strong>R$ 0,00</strong>. Não há saldo negativo, mas também não sobrou nenhuma quantia livre para poupar. Tente controlar pequenas despesas extras para fazer sobrar dinheiro no próximo mês.</span>
                      )
                    ) : (
                      // Historical Long-Term Advice / Planejamento Geral
                      allTransactions.length === 0 ? (
                        <span><strong>Sem histórico suficiente:</strong> Cadastre as contas do seu dia a dia e logo você verá dicas de evolução detalhadas aqui.</span>
                      ) : pastUnreconciledTx.length > 0 ? (
                        <span>🔴 <strong>Lembrete de contas pendentes:</strong> Encontramos <strong>{pastUnreconciledTx.length} conta(s) de meses anteriores</strong> que ainda não foram marcadas como pagas. Para manter seu controle em ordem, mude para os meses passados no topo da tela e registre a quitação delas se já tiver pago.</span>
                      ) : installmentRatio > 40 ? (
                        <span>⚠️ <strong>Cuidado com o peso de parcelas:</strong> Seus parcelamentos no cartão comprometem <strong>{Math.round(installmentRatio)}%</strong> do seu histórico financeiro ({fmt(totalParcelasAll)}). Muitas compras parceladas prendem sua renda futura. Evite novos parcelamentos até aliviar essa porcentagem!</span>
                      ) : globalHealthScore >= 75 ? (
                        <span>💎 <strong>Organização brilhante!</strong> Suas faturas antigas estão pagas, você não tem nenhuma pendência pendente e seus parcelamentos comprometem apenas <strong>{Math.round(installmentRatio)}%</strong> do seu orçamento — uma margem perfeitamente saudável de segurança!</span>
                      ) : (
                        <span>📈 <strong>Rumo ao equilíbrio!:</strong> O seu nível geral de controle está em <strong>{globalHealthScore} pontos</strong>. Concentre-se em fazer sobrar um dinheirinho mês a mês para subir sua nota.</span>
                      )
                    )}
                  </p>
                </div>
              </div>

              {/* Close Button Footer */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setShowAssistantTip(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/15 hover:shadow-indigo-500/20 active:scale-95 border-none"
                >
                  Entendi, obrigado!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECTION 2: COMPARATIVE ALERTS (INTERACTIVE TRIGGER CARD) */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setShowIntelligentAlertsModal(true)}
        className={`w-full text-left p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group shadow-lg cursor-pointer ${
          isLight 
            ? 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-slate-100/35 hover:shadow-slate-250/50 text-slate-800' 
            : 'bg-gradient-to-br from-[#0a0f1d] to-[#060a15] hover:to-[#080d1d] border-white/5 shadow-black/25 text-slate-100'
        }`}
      >
        {/* Animated sheen effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isLight 
                ? 'bg-indigo-50 border-indigo-150 text-indigo-600' 
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 glow-indigo'
            }`}>
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/15 text-indigo-400'
                }`}>
                  🧠 Diagnóstico Exclusivo
                </span>
                {uniqueSystemAlerts.length > 0 && (
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full animate-pulse ${
                    isLight ? 'bg-rose-50 text-rose-700' : 'bg-rose-500/15 text-rose-450'
                  }`}>
                    {uniqueSystemAlerts.length} Notificações de Saúde
                  </span>
                )}
              </div>
              <h4 className={`font-display font-black text-base tracking-tight mt-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Avisos & Alertas Importantes (Histórico Geral)
              </h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} font-light mt-1`}>
                Toque para abrir seu painel inteligente com feed de evolução comparativo, desvios e diagnósticos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] uppercase tracking-wider px-4.5 py-3 rounded-xl transition-all shadow-md group-hover:shadow-indigo-500/15 shrink-0 self-start md:self-center border-none">
            Analisar Painel
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </motion.button>

      {/* INTELLIGENT ALERTS MODAL CENTER */}
      <AnimatePresence>
        {showIntelligentAlertsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowIntelligentAlertsModal(false)}
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col space-y-5 ${
                isLight ? 'bg-white border border-slate-200 text-slate-800' : 'bg-[#0a0f1d] border border-white/10 text-slate-100'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-1.5 text-indigo-400 font-extrabold text-[9.5px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> IA de Diagnóstico FinançasPro
                  </div>
                  <h4 className={`font-display font-black text-lg tracking-tight mt-1 ${isLight ? 'text-slate-955' : 'text-white'}`}>
                    Avisos & Alertas Importantes
                  </h4>
                </div>
                <button
                  onClick={() => setShowIntelligentAlertsModal(false)}
                  className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500' 
                      : 'bg-slate-900 hover:bg-slate-850 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Area */}
              <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                
                {/* 1. Feed de Evolução Inteligente Section */}
                <div className="space-y-2">
                  <h5 className={`text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Mostrando Feed de Evolução Inteligente
                  </h5>
                  {hasPrevData ? (
                    <div className={`p-4 rounded-2xl border-l-4 flex items-start gap-3.5 leading-relaxed text-[12px] font-light ${
                      moMAnalysisNarrative.status === 'positive'
                        ? isLight ? 'bg-emerald-50/65 border-emerald-500 text-slate-900 font-medium' : 'bg-emerald-500/5 border-emerald-500 text-emerald-250'
                        : moMAnalysisNarrative.status === 'negative'
                          ? isLight ? 'bg-rose-50/65 border-rose-500 text-slate-900 font-medium' : 'bg-rose-500/5 border-rose-500 text-rose-250'
                          : isLight ? 'bg-slate-50 border-slate-400 text-slate-900 font-medium' : 'bg-white/2 border-indigo-400/50 text-slate-200'
                    }`}>
                      <Sparkles className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${
                        moMAnalysisNarrative.status === 'positive' ? 'text-emerald-500' : 'text-rose-500'
                      }`} />
                      <div className="space-y-1 flex-1 text-left">
                        <h6 className={`text-[10px] font-black uppercase tracking-widest ${
                          moMAnalysisNarrative.status === 'positive' 
                            ? isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400' 
                            : isLight ? 'text-rose-700 font-bold' : 'text-rose-450'
                        }`}>
                          Feed de Evolução Inteligente ({moMAnalysisNarrative.status === 'positive' ? 'Avanço Saudável' : moMAnalysisNarrative.status === 'negative' ? 'Necessita Ajustes' : 'Paridade de Caixa'})
                        </h6>
                        <p className={`leading-relaxed text-[11.5px] ${isLight ? 'text-slate-800' : 'text-slate-305'}`}>
                          {moMAnalysisNarrative.text.split('**').map((item, idx) => idx % 2 === 1 ? <strong key={idx} className={isLight ? 'text-slate-950 font-black' : 'text-white'}>{item}</strong> : item)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-2xl border flex items-start gap-3.5 leading-relaxed text-[11.5px] font-light ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/2 border-white/5 text-slate-400'
                    }`}>
                      <Sparkles className="w-4.5 h-4.5 shrink-0 mt-0.5 text-indigo-400" />
                      <div className="space-y-1 flex-1 text-left">
                        <h6 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                          Histórico de Meses Não Encontrado
                        </h6>
                        <p className="mt-1">
                          Adicione transações em mais de um ciclo mensal para habilitar a geração de seu Feed Comparativo Inteligente.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. List of Deduplicated Alerts */}
                <div className="space-y-2">
                  <h5 className={`text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    ⚠️ Alertas de Caixa & Faturas
                  </h5>
                  {uniqueSystemAlerts.length === 0 ? (
                    <div className={`p-4 rounded-2xl border text-center ${
                      isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                    }`}>
                      <p className="text-xs font-bold uppercase tracking-wider">🎉 Saúde financeira está excelente!</p>
                      <p className="text-[10.5px] text-slate-400 mt-1">Nenhum desvio foi detectado no balanceamento das suas despesas.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {uniqueSystemAlerts.map((alert) => (
                        <div
                          key={alert.id}
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
                          <div className="min-w-0 flex-1 text-left">
                            <h6 className={`text-xs font-black tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                              {alert.text}
                            </h6>
                            {alert.details && (
                              <p className={`text-[11px] ${isLight ? 'text-slate-650' : 'text-slate-400'} font-light leading-relaxed mt-1`}>
                                {alert.details}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Close Button footer modal */}
              <div className="flex justify-end pt-2 border-t border-white/5">
                <button
                  onClick={() => setShowIntelligentAlertsModal(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/15 hover:shadow-indigo-500/20 active:scale-95 border-none"
                >
                  Entendi, Obrigado!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECTION 3: KEY METRICS FILTER CONTROLS */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border transition-all duration-300 ${
        isLight 
          ? 'bg-white border-slate-200 shadow-md shadow-slate-100/40 text-slate-800' 
          : 'bg-gradient-to-r from-[#0a0f1d] to-[#070b16] border-white/5 text-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isLight 
              ? 'bg-indigo-50 border-indigo-150 text-indigo-600' 
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className={`text-[9px] font-black uppercase tracking-widest block leading-none ${
              isLight ? 'text-indigo-600' : 'text-indigo-400'
            }`}>
              Análise Avançada
            </span>
            <h4 className={`font-display font-black text-xs sm:text-sm tracking-tight leading-tight mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Escopo Ativo de Métricas do Painel
            </h4>
          </div>
        </div>

        <div className={`flex p-1 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-200/80' : 'bg-slate-950/45 border-white/5'} self-start sm:self-auto`}>
          <button
            onClick={() => setMetricsScope('month')}
            className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none flex items-center gap-2 ${
              metricsScope === 'month'
                ? isLight
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                  : 'bg-indigo-550 text-white shadow-lg font-extrabold'
                : isLight
                  ? 'bg-transparent text-slate-500 hover:text-slate-800'
                  : 'bg-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📅 Análise do Mês
          </button>
          <button
            onClick={() => setMetricsScope('general')}
            className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none flex items-center gap-2 ${
              metricsScope === 'general'
                ? isLight
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                  : 'bg-indigo-550 text-white shadow-lg font-extrabold'
                : isLight
                  ? 'bg-transparent text-slate-500 hover:text-slate-800'
                  : 'bg-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🌍 Análise Geral
          </button>
        </div>
      </div>

      {/* SECTION 3: KEY METRICS GRID */}
      {(() => {
        const isScopeMonth = metricsScope === 'month';
        const scopeTransactions = isScopeMonth ? listActive : listAll;

        // Calculate highest expense item based on active scopeTransactions
        let highestExpense = { name: 'Nenhum', amount: 0, cat: 'outros' };
        scopeTransactions.forEach(t => {
          if (t.amount > highestExpense.amount) {
            highestExpense = { name: t.name, amount: t.amount, cat: t.cat };
          }
        });

        const totalSpentVal = isScopeMonth ? totalSpentMonth : totalSpentAll;
        const totalPaidVal = isScopeMonth ? totalPaidMonth : totalPaidAll;
        const totalUnpaidVal = isScopeMonth ? totalUnpaidMonth : totalUnpaidAll;

        // Calculate average cost per items based on active scopeTransactions and total spent
        const averageCost = scopeTransactions.length > 0 ? (totalSpentVal / scopeTransactions.length) : 0;

        const historicalTotalInflow = uniqueMonths.reduce((sum, mKey) => {
          const mIncome = settings?.monthlyIncome?.[mKey] || settings?.income || 0;
          const mBalance = settings?.monthlyBalance?.[mKey] || settings?.balance || 0;
          const mExtra = settings?.extras?.[mKey] ?? 0;
          return sum + mIncome + mBalance + mExtra;
        }, 0);
        const historicalLeftover = historicalTotalInflow - totalSpentAll;
        const estimatedSurplus = isScopeMonth ? leftover : historicalLeftover;

        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/2 border-white/5'
            }`}>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>Custo Crítico / Maior</span>
                <span className={`text-base font-mono font-extrabold truncate block mb-0.5 ${
                  isLight ? 'text-rose-600' : 'text-rose-400'
                }`} title={highestExpense.name}>
                  {fmt(highestExpense.amount)}
                </span>
              </div>
              <span className={`text-[10px] truncate block font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-500'
              }`}>
                {highestExpense.name}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/2 border-white/5'
            }`}>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>Média por gastos</span>
                <span className={`text-base font-mono font-extrabold block mb-0.5 ${
                  isLight ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  {fmt(averageCost)}
                </span>
              </div>
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-500'
              }`}>
                Total {scopeTransactions.length} registros
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/2 border-white/5'
            }`}>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>Relação Comprometida</span>
                <span className={`text-base font-mono font-extrabold block mb-0.5 ${
                  isLight ? 'text-amber-600 font-bold' : 'text-amber-400'
                }`}>
                  {fmt(totalSpentVal)}
                </span>
              </div>
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-500'
              }`}>
                Obrigações registradas
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/2 border-white/5'
            }`}>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>Saldo Liquidado Real</span>
                <span className={`text-base font-mono font-extrabold block mb-0.5 ${
                  isLight ? 'text-emerald-600' : 'text-emerald-400'
                }`}>
                  {fmt(totalPaidVal)}
                </span>
              </div>
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-500'
              }`}>
                Quitado até o momento
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/2 border-white/5'
            }`}>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>A Pagar Pendente</span>
                <span className={`text-base font-mono font-extrabold block mb-0.5 ${
                  isLight ? 'text-orange-600' : 'text-orange-400'
                }`}>
                  {fmt(totalUnpaidVal)}
                </span>
              </div>
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-500'
              }`}>
                Pendente de quitação
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/2 border-white/5'
            }`}>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 font-black ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>Sobra Estimada</span>
                <span className={`text-base font-mono font-extrabold block mb-0.5 ${
                  estimatedSurplus >= 0 
                    ? isLight ? 'text-emerald-600' : 'text-emerald-400' 
                    : 'text-rose-500'
                }`}>
                  {fmt(estimatedSurplus)}
                </span>
              </div>
              <span className={`text-[10px] block font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-500'
              }`}>
                Saldo livre projetado
              </span>
            </div>

          </div>
        );
      })()}

      {/* COMPARATIVO INTERMENSAL (MÊS ANTERIOR VS MÊS ATUAL) */}
      <div className={`p-6 rounded-3xl transition-all duration-300 border ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl shadow-slate-100/35 text-slate-800' 
          : 'glass-panel border-white/5 shadow-2xl text-slate-150'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5 border-b border-white/5 pb-4">
          <div>
            <h4 className={`font-display font-black text-sm tracking-wide flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              <Activity className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
              Comparativo Intermensal: {formatMonthKey(prevMonthKey)} vs. {formatMonthKey(currentMonthKey)}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">Evolução do orçamento, despesas ativas e variação líquida entre os ciclos.</p>
          </div>
          <span className={`text-[9.5px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
            isLight 
              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' 
              : 'bg-white/5 text-slate-400'
          }`}>
            Análise Dinâmica MoM
          </span>
        </div>

        {!hasPrevData ? (
          <div className="py-7 text-center rounded-2xl bg-slate-500/5 border border-dashed border-white/5 p-6">
            <TrendingUp className="w-8 h-8 text-indigo-400/50 mx-auto mb-3" />
            <h5 className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Aguardando histórico financeiro
            </h5>
            <p className="text-[11px] text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Para ver esta visão comparativa automatizada, continue utilizando o FinançasPro! Assim que tiver lançamentos ativos cadastrados no mês anterior ({formatMonthKey(prevMonthKey)}), o sistema cruzará os dados automaticamente aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Grid of relative bento metrics with variance badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Receipts/Inflows */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/2 border-white/5'
              }`}>
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block mb-1">Entradas (MoM)</span>
                
                <div className="flex items-baseline justify-between gap-1 mt-1">
                  <span className={`text-base font-mono font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>
                    {fmt(curInflows)}
                  </span>
                  <span className={`text-xs font-mono text-slate-500`}>
                    Antes: {fmt(prevInflows)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Variação Geral</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black tracking-wide flex items-center gap-0.5 ${
                    inflowDiff > 0
                      ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400'
                      : inflowDiff < 0
                        ? isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/10 text-rose-400'
                        : 'bg-white/5 text-slate-400'
                  }`}>
                    {inflowDiff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : inflowDiff < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                    {inflowDiff > 0 ? '+' : ''}{inflowPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Card 2: Spent/Outflows */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/2 border-white/5'
              }`}>
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block mb-1">Gastos (MoM)</span>
                
                <div className="flex items-baseline justify-between gap-1 mt-1">
                  <span className={`text-base font-mono font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>
                    {fmt(curSpent)}
                  </span>
                  <span className={`text-xs font-mono text-slate-500`}>
                    Antes: {fmt(prevSpent)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Variação Geral</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black tracking-wide flex items-center gap-0.5 ${
                    spentDiff < 0
                      ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400'
                      : spentDiff > 0
                        ? isLight ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-500/10 text-rose-400'
                        : 'bg-white/5 text-slate-400'
                  }`}>
                    {spentDiff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : spentDiff < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                    {spentDiff > 0 ? '+' : ''}{spentPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Card 3: Leftover/Sobra */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/2 border-white/5'
              }`}>
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block mb-1">Sobras Estimadas</span>
                
                <div className="flex items-baseline justify-between gap-1 mt-1">
                  <span className={`text-base font-mono font-extrabold ${
                    curLeftover >= 0 
                      ? isLight ? 'text-emerald-700' : 'text-emerald-400' 
                      : isLight ? 'text-rose-700' : 'text-rose-450'
                  }`}>
                    {fmt(curLeftover)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Antes: {fmt(prevLeftover)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium font-bold uppercase tracking-wider">Variação Geral</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black tracking-wide flex items-center gap-0.5 ${
                    leftoverDiff > 0
                      ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400'
                      : leftoverDiff < 0
                        ? isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/10 text-rose-400'
                        : 'bg-white/5 text-slate-400'
                  }`}>
                    {leftoverDiff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : leftoverDiff < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                    {leftoverDiff > 0 ? '+' : ''}{leftoverPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Card 4: Adimplência de Caixa */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/2 border-white/5'
              }`}>
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block mb-1">Taxa de Quitação</span>
                
                <div className="flex items-baseline justify-between gap-1 mt-1">
                  <span className={`text-base font-mono font-extrabold ${isLight ? 'text-slate-900 border-rose-550/15' : 'text-slate-250'}`}>
                    {currentAdimplencia}%
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Antes: {prevAdimplencia}%
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium font-bold uppercase tracking-wider">Desvio Pontos</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black tracking-wide ${
                    adimplenciaDiff > 0
                      ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400'
                      : adimplenciaDiff < 0
                        ? isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/10 text-rose-400'
                        : 'bg-white/5 text-slate-400'
                  }`}>
                    {adimplenciaDiff > 0 ? `+${adimplenciaDiff} pp` : adimplenciaDiff < 0 ? `${adimplenciaDiff} pp` : 'Estável'}
                  </span>
                </div>
              </div>

            </div>

            {/* Side-by-Side Horizontal Continuous Distribution Progress Bars */}
            <div className={`p-5 rounded-2xl border ${
              isLight ? 'bg-slate-50/40 border-slate-150' : 'bg-slate-950/20 border-white/5'
            } space-y-5`}>
              <h5 className={`text-[10px] uppercase font-black tracking-widest ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                🗺 Distribuição Proporcional do Fluxo de Caixa (Mês Anterior vs Atual)
              </h5>

              <div className="space-y-4">
                {/* Previous month row */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className={isLight ? 'text-slate-750 font-bold' : 'text-slate-405'}>
                      {formatMonthKey(prevMonthKey)}
                    </span>
                    <span className="font-mono text-[10.5px] text-slate-500">
                      Entrada Total: <strong>{fmt(prevInflows)}</strong> • Sobra: <strong>{fmt(Math.max(0, prevLeftover))}</strong>
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-lg bg-slate-200/50 dark:bg-white/5 overflow-hidden flex shadow-inner">
                    {pctPrevFix > 0 && <div style={{ width: `${pctPrevFix}%` }} className="bg-indigo-550 dark:bg-indigo-500 h-full border-r border-white/10" title={`Fixos: ${pctPrevFix.toFixed(0)}%`} />}
                    {pctPrevVar > 0 && <div style={{ width: `${pctPrevVar}%` }} className="bg-emerald-600 dark:bg-emerald-500 h-full border-r border-white/10" title={`Variáveis: ${pctPrevVar.toFixed(0)}%`} />}
                    {pctPrevPar > 0 && <div style={{ width: `${pctPrevPar}%` }} className="bg-amber-600 dark:bg-amber-500 h-full border-r border-white/10" title={`Parcelas: ${pctPrevPar.toFixed(0)}%`} />}
                    {pctPrevLeft > 0 && <div style={{ width: `${pctPrevLeft}%` }} className="bg-teal-500 dark:bg-teal-400 h-full" title={`Excesso Livre: ${pctPrevLeft.toFixed(0)}%`} />}
                    {pctPrevLeft <= 0 && (pctPrevFix + pctPrevVar + pctPrevPar) > 100 && <div className="h-full bg-rose-600 flex-1" title="Déficit de orçamento" />}
                  </div>
                </div>

                {/* Current month row */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className={isLight ? 'text-slate-800 font-extrabold' : 'text-slate-200'}>
                      {formatMonthKey(currentMonthKey)} (Mês Selecionado)
                    </span>
                    <span className={`font-mono text-[10.5px] ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      Entrada Total: <strong>{fmt(curInflows)}</strong> • Sobra: <strong>{fmt(Math.max(0, curLeftover))}</strong>
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-lg bg-slate-200/50 dark:bg-white/5 overflow-hidden flex shadow-inner">
                    {pctCurFix > 0 && <div style={{ width: `${pctCurFix}%` }} className="bg-indigo-500 h-full border-r border-white/10" title={`Fixos: ${pctCurFix.toFixed(0)}%`} />}
                    {pctCurVar > 0 && <div style={{ width: `${pctCurVar}%` }} className="bg-emerald-500 h-full border-r border-white/10" title={`Variáveis: ${pctCurVar.toFixed(0)}%`} />}
                    {pctCurPar > 0 && <div style={{ width: `${pctCurPar}%` }} className="bg-amber-500 h-full border-r border-white/10" title={`Parcelas: ${pctCurPar.toFixed(0)}%`} />}
                    {pctCurLeft > 0 && <div style={{ width: `${pctCurLeft}%` }} className="bg-teal-400 h-full opacity-95" title={`Excesso Livre: ${pctCurLeft.toFixed(0)}%`} />}
                    {pctCurLeft <= 0 && (pctCurFix + pctCurVar + pctCurPar) > 100 && <div className="h-full bg-rose-500 flex-1 animate-pulse" title="Déficit de orçamento" />}
                  </div>
                </div>
              </div>

              {/* Legends container for structural understanding */}
              <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-white/5 text-[9.5px] font-bold uppercase tracking-wider text-slate-450 text-slate-400 select-none">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" /> Despesa Fixa
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Despesa Variável
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Debitos Parcelados
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-teal-400 inline-block" /> Sobra Estimada (Caixa Livre)
                </span>
              </div>
            </div>


            {/* O Feed de Evolução Inteligente foi consolidado na área de Alertas Inteligentes no topo */}

          </div>
        )}
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

                    <div className="flex justify-around pl-16 pt-1 text-slate-500 select-none">
                      {modeSortedCategories.map((item) => (
                        <span 
                          key={item.key} 
                          className={`truncate text-center transition-colors duration-200 uppercase font-black tracking-widest ${
                            hoveredBar === item.key 
                              ? (isLight ? 'text-indigo-600' : 'text-indigo-450') 
                              : 'text-slate-450 text-slate-400'
                          } xs:text-[9.5px] text-[7.5px]`} 
                          style={{ width: `${100 / modeSortedCategories.length}%`, maxWidth: '58px' }}
                          title={item.label}
                        >
                          <span className="sm:inline hidden">{item.label.split(' ')[0]}</span>
                          <span className="sm:hidden inline">{item.label.substring(0, 3).toUpperCase()}</span>
                        </span>
                      ))}
                    </div>

                    {/* Interactive legend list especially designed for optimized mobile devices, wrapping cleanly */}
                    <div className="sm:hidden flex flex-wrap gap-x-2 gap-y-1.5 justify-center pt-4 border-t border-white/5 px-2 select-none">
                      {modeSortedCategories.map((item) => {
                        const style = getCategoryThemeStyle(item.key);
                        const isHovered = hoveredBar === item.key;
                        return (
                          <div 
                            key={item.key}
                            onClick={() => setHoveredBar(hoveredBar === item.key ? null : item.key)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all duration-200 border cursor-pointer ${
                              isHovered
                                ? 'bg-indigo-500/10 border-indigo-500/30 scale-105'
                                : isLight 
                                  ? 'bg-slate-50 border-slate-200' 
                                  : 'bg-white/3 border-white/5'
                            }`}
                          >
                            <span className="text-[12px]">{item.icon}</span>
                            <span className={`text-[8.5px] font-black uppercase tracking-wider ${isLight ? 'text-slate-500 font-bold' : 'text-slate-450'}`}>
                              {item.label.substring(0, 3).toUpperCase()}:
                            </span>
                            <span className={`text-[9.5px] font-extrabold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* DETALHAMENTO DE RENDAS EXTRAS CARD */}
      <div className={`p-6 rounded-3xl transition-all duration-300 border ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl shadow-slate-100/35 text-slate-800' 
          : 'glass-panel border-white/5 shadow-2xl text-slate-100'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h4 className={`font-display font-extrabold text-sm tracking-wide flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <TrendingUp className="w-4 h-4 text-emerald-400" /> 
              Rendas Extras & Serviços Recebidos ({activeDashboardMode === 'current' ? 'Mês Focado' : 'Histórico Geral'})
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">Breakdown detalhado dos ingressos financeiros e extras adicionados.</p>
          </div>
        </div>

        {/* Mini stats dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-4 select-none">
          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/2 border-white/5'}`}>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Total Extra Recebido</span>
            <span className="text-sm font-mono font-black text-emerald-400">
              {fmt(totalExtras)}
            </span>
          </div>
          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/2 border-white/5'}`}>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Serviços / Lançamentos</span>
            <span className={`text-sm font-mono font-black ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {filteredExtras.length} registros
            </span>
          </div>
          <div className={`p-3.5 rounded-2xl border col-span-2 md:col-span-1 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/2 border-white/5'}`}>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Maior Origem</span>
            <span className={`text-xs font-bold truncate block mt-0.5 uppercase ${isLight ? 'text-slate-755' : 'text-slate-350'}`} title={topSource?.source}>
              {topSource ? `${topSource.source} (${fmt(topSource.amount)})` : 'Nenhuma'}
            </span>
          </div>
        </div>

        {filteredExtras.length === 0 ? (
          <div className={`py-8 text-center text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-505'}`}>
            Nenhuma renda extra ou serviço adicional registrado para este escopo.
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
            {filteredExtras.map((item: any) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-150 hover:bg-slate-100/50' 
                    : 'bg-white/2 border-white/3 hover:border-white/10 hover:bg-white/3'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold block leading-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {item.source}
                    </span>
                    <div className="flex items-center gap-2 mt-1 select-none">
                      <span className="text-[9px] text-slate-500 font-mono">
                        {item.date.split('-').reverse().join('/')}
                      </span>
                      {activeDashboardMode === 'history' && (
                        <span className={`px-1.5 py-0.5 text-[8px] rounded font-bold ${
                          isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/5 text-slate-400'
                        }`}>
                          {item.monthKey}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-emerald-400">
                    {fmt(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
