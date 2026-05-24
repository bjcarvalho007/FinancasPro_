import { useState } from 'react';
import { Transaction, Category } from '../types';
import { Sparkles, BarChart2, TrendingUp, AlertTriangle, Lightbulb, Wallet, ArrowUpRight, DollarSign, PieChart } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardAnalyticsProps {
  transactions: Transaction[];
  categoriesList: Category[];
  totalAvailable: number;
  leftover: number;
  income: number;
  balance: number;
  extra: number;
  currentTheme?: 'dark' | 'light';
}

export default function DashboardAnalytics({
  transactions,
  categoriesList,
  totalAvailable,
  leftover,
  income,
  balance,
  extra,
  currentTheme = 'dark'
}: DashboardAnalyticsProps) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [chartViewMode, setChartViewMode] = useState<'columns' | 'donut'>('columns');

  const isLight = currentTheme === 'light';

  const getCategoryThemeStyle = (key: string) => {
    const styles: Record<string, { bg: string, border: string, text: string, color1: string, color2: string }> = {
      moradia: {
        bg: isLight ? 'bg-blue-50/50' : 'bg-blue-500/5',
        border: isLight ? 'border-blue-200' : 'border-blue-500/10',
        text: isLight ? 'text-blue-700 font-bold' : 'text-blue-400',
        color1: '#3b82f6',
        color2: '#1d4ed8'
      },
      alimentacao: {
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
      lazer: {
        bg: isLight ? 'bg-pink-50/50' : 'bg-pink-500/5',
        border: isLight ? 'border-pink-200' : 'border-pink-500/10',
        text: isLight ? 'text-pink-700 font-bold' : 'text-pink-400',
        color1: '#ec4899',
        color2: '#9d174d'
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

  const categoryCount: Record<string, number> = {};
  transactions.forEach(t => {
    const catKey = t.cat || 'outros';
    categoryCount[catKey] = (categoryCount[catKey] || 0) + 1;
  });

  // Group transactions by category
  const categoryTotals: Record<string, number> = {};
  let totalSpent = 0;
  
  // Only calculate expenses (debt/outflow), ignoring income
  transactions.forEach(t => {
    // Standardize category key
    const catKey = t.cat || 'outros';
    categoryTotals[catKey] = (categoryTotals[catKey] || 0) + t.amount;
    totalSpent += t.amount;
  });

  // Calculate highest individual expense
  let highestExpense = { name: 'Nenhum', amount: 0, cat: 'outros' };
  transactions.forEach(t => {
    if (t.amount > highestExpense.amount) {
      highestExpense = { name: t.name, amount: t.amount, cat: t.cat };
    }
  });

  // Sort categories by expenditure
  const sortedCategories = Object.entries(categoryTotals)
    .map(([key, value]) => {
      const catObj = categoriesList.find(c => c.value === key) || { icon: '📦', label: 'Outros', value: 'outros', id: '', userId: '' };
      return {
        ...catObj,
        key,
        amountValue: value,
        pct: totalSpent > 0 ? Math.round((value / totalSpent) * 100) : 0
      };
    })
    .sort((a, b) => b.amountValue - a.amountValue);

  // Split into recurrent (fixos), variable (variaveis) and installment (parcelas)
  const totalFixos = transactions.filter(t => t.type === 'fixos').reduce((sum, t) => sum + t.amount, 0);
  const totalVariaveis = transactions.filter(t => t.type === 'variaveis').reduce((sum, t) => sum + t.amount, 0);
  const totalParcelas = transactions.filter(t => t.type === 'parcelas').reduce((sum, t) => sum + t.amount, 0);
  const totalAllLedges = totalFixos + totalVariaveis + totalParcelas;

  const pctFixos = totalAllLedges > 0 ? Math.round((totalFixos / totalAllLedges) * 100) : 0;
  const pctVariaveis = totalAllLedges > 0 ? Math.round((totalVariaveis / totalAllLedges) * 100) : 0;
  const pctParcelas = totalAllLedges > 0 ? Math.round((totalParcelas / totalAllLedges) * 100) : 0;

  // Health Score Calculation based on multi-factor liquidity
  let healthScore = 100;
  if (totalAvailable > 0) {
    const commitmentRate = (totalSpent / totalAvailable) * 100;
    // Over commitments deduct scores
    if (commitmentRate > 60) {
      healthScore -= Math.min(50, Math.round((commitmentRate - 60) * 1.2));
    }
    // High debt ratio deducts scores
    if (totalParcelas > totalAvailable * 0.4) {
      healthScore -= 15;
    }
  } else {
    healthScore = 50; // Neutral score when no inputs
  }

  // Bonus points for paying off debts
  const paidInMonth = transactions.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  const percentPaid = totalSpent > 0 ? (paidInMonth / totalSpent) * 100 : 0;
  healthScore += Math.round(percentPaid * 0.15);
  healthScore = Math.max(15, Math.min(100, healthScore));

  // Determine score color attributes
  let scoreColor = '#10b981'; // solid emerald
  let scoreClass = 'text-emerald-400';
  let scoreLabel = 'Excelente Caixa';
  if (healthScore < 50) {
    scoreColor = '#f43f5e'; // solid rose
    scoreClass = 'text-rose-400';
    scoreLabel = 'Crítico / Alerta Forte';
  } else if (healthScore < 75) {
    scoreColor = '#f59e0b'; // solid amber
    scoreClass = 'text-amber-400';
    scoreLabel = 'Equilibrado / Moderado';
  }

  // Gauge parameter
  const circumference = 2 * Math.PI * 34;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  // Local Personalized AI Smart Financial Assessment
  let financialAnalysis = '';
  if (transactions.length === 0) {
    financialAnalysis = '<strong>Pronto Para Monitorar:</strong> Adicione suas despesas mensais para que nosso algoritmo audite sua saúde orçamentária, verifique vazamentos de caixa e gere recomendações de alocação.';
  } else {
    const debtRatio = totalAvailable > 0 ? Math.round((totalSpent / totalAvailable) * 100) : 0;
    if (debtRatio >= 100) {
      financialAnalysis = `🚨 <strong>Devedor / Atenção Máxima:</strong> Seu total de saídas ultrapassou 100% da receita disponível. Seu maior dreno individual é <strong>"${highestExpense.name}"</strong> (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(highestExpense.amount)}). Reduza imediatamente gastos variáveis e evite novos parcelamentos no cartão de crédito.`;
    } else if (debtRatio > 70) {
      financialAnalysis = `⚠️ <strong>Comprometimento Elevado:</strong> Você já comprometeu <strong>${debtRatio}%</strong> de seus fundos com despesas neste mês. A sua margem líquida sobressalente é pequena (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(leftover)}). Cuidado com faturas acumuladas e busque renegociar despesas recorrentes.`;
    } else if (debtRatio > 45) {
      financialAnalysis = `📊 <strong>Zonas de Equilíbrio Ativa:</strong> O seu índice de comprometimento orçamentário está estável em <strong>${debtRatio}%</strong>. Você tem uma boa reserva de segurança. Para melhorar sua saúde física, tente poupar pelo menos 20% da sua renda e destine para investimentos.`;
    } else {
      financialAnalysis = `💎 <strong>Excelente Alocação Financeira:</strong> Sua taxa de poupança está incrível! Você consumiu apenas <strong>${debtRatio}%</strong> da sua verba. A sobra estimada de <strong>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(leftover)}</strong> representa excelente oportunidade para aportes em investimentos ou constituir uma robusta reserva de emergência.`;
    }
  }

  // Next month baseline forecast (current fixed master master master costs)
  const nextMonthForecast = totalFixos + totalParcelas;

  // Format currency
  const fmt = (v: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  };

  return (
    <div className="space-y-6">
      {/* Visual Health Score Indicator with procedural gauge dial */}
      <div className="p-6 rounded-3xl glass-panel border-white/5 shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              className="fill-none stroke-white/5"
              strokeWidth="6"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="34"
              className="fill-none stroke-linecap-round"
              stroke={scoreColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-extrabold text-white leading-none">
              {healthScore}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Pontos
            </span>
          </div>
        </div>

        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className={`text-xs font-extrabold px-3 py-1 bg-white/5 border border-white/5 rounded-full uppercase tracking-wider ${scoreClass}`}>
              ● {scoreLabel}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> IA Score
            </span>
          </div>
          <h3 className="font-display font-extrabold text-base text-slate-200">
            Diagnóstico Orçamentário
          </h3>
          <p className="text-xs text-slate-400 font-light leading-relaxed max-w-sm">
            Seu caixa corporativo ou pessoal é medido pelas margens de sobrevivência, índice de endividamento parcelado e velocidade de quitação de contas vencendo.
          </p>
        </div>
      </div>

      {/* Local Financial Advisory box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-r-3xl border-l-[4px] border-indigo-500 bg-indigo-500/5 flex items-start gap-4"
      >
        <Lightbulb className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Recomendações financeiras automáticas</h4>
          <p className="text-xs text-slate-300 font-normal leading-relaxed" dangerouslySetInnerHTML={{ __html: financialAnalysis }} />
        </div>
      </motion.div>

      {/* Dynamic Key Performance Metrics List */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Maior Custo</span>
          <span className="text-sm font-mono font-extrabold text-rose-400 truncate block mb-1" title={highestExpense.name}>
            {fmt(highestExpense.amount)}
          </span>
          <span className="text-[10px] text-slate-500 truncate block">
            {highestExpense.name}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Custo Médio / Item</span>
          <span className="text-sm font-mono font-extrabold text-slate-200 block mb-1">
            {fmt(transactions.length ? (totalSpent / transactions.length) : 0)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Sobre {transactions.length} registros
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Comprometimento Recorrente</span>
          <span className="text-sm font-mono font-extrabold text-amber-400 block mb-1">
            {totalAvailable > 0 ? Math.round((totalFixos / totalAvailable) * 100) : 0}%
          </span>
          <span className="text-[10px] text-slate-500 block">
            Despesas Fixas
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Projeção Próx. Mês</span>
          <span className="text-sm font-mono font-extrabold text-indigo-400 block mb-1">
            {fmt(nextMonthForecast)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Mantenha fixas e faturas
          </span>
        </div>
      </div>

      {/* SVG Custom Interactive Allocation Chart */}
      <div className={`p-6 rounded-3xl transition-all duration-300 border ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl shadow-slate-100/35 text-slate-800' 
          : 'glass-panel border-white/5 shadow-2xl text-slate-100'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h4 className={`font-display font-extrabold text-sm tracking-wide flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            <BarChart2 className="w-4 h-4 text-emerald-400" /> Distribuição de Gastos do Período
          </h4>
          <div className={`flex p-1 rounded-xl border transition-all ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-white/5'
          }`}>
            <button
              onClick={() => setChartViewMode('columns')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all duration-200 flex items-center gap-1 ${
                chartViewMode === 'columns'
                  ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow')
                  : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-100')
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Colunas
            </button>
            <button
              onClick={() => setChartViewMode('donut')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all duration-200 flex items-center gap-1 ${
                chartViewMode === 'donut'
                  ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow')
                  : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-100')
              }`}
            >
              <PieChart className="w-3.5 h-3.5" /> Setores
            </button>
          </div>
        </div>
        
        {sortedCategories.length === 0 ? (
          <div className={`h-48 flex flex-col items-center justify-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            <BarChart2 className="w-8 h-8 opacity-25 mb-2" />
            Aguardando lançamentos para compor gráfico de colunas
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Chart Area Component */}
            <div className="lg:col-span-7 flex flex-col items-center">
              {chartViewMode === 'columns' ? (
                /* Advanced Column Chart */
                <div className="w-full relative">
                  <div className="w-full overflow-x-auto select-none">
                    <svg className="w-full min-w-[380px] h-48 overflow-visible" viewBox="0 0 450 200" preserveAspectRatio="none">
                      {/* Grid Ticks & References */}
                      {(() => {
                        const maxVal = Math.max(...sortedCategories.map(c => c.amountValue), 10);
                        const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
                        const factor = orderOfMagnitude / 2 || 1;
                        const scaleMax = Math.ceil(maxVal / factor) * factor;

                        const marginX = 55;
                        const chartWidth = 370;
                        const chartHeight = 135;
                        const bottomY = 160;

                        const n = sortedCategories.length;
                        const colWidth = Math.min(28, chartWidth / (n + 1));
                        const spacing = (chartWidth - colWidth * n) / (n + 1);

                        const ticks = [0, 0.25, 0.5, 0.75, 1];

                        return (
                          <>
                            {/* Horizontal Reference Lines */}
                            {ticks.map((val) => {
                              const yPos = bottomY - val * chartHeight;
                              return (
                                <g key={`grid-line-${val}`}>
                                  <line
                                    x1={marginX - 5}
                                    y1={yPos}
                                    x2={marginX + chartWidth + 10}
                                    y2={yPos}
                                    stroke={isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)'}
                                    strokeDasharray="4 4"
                                  />
                                  <text
                                    x={marginX - 10}
                                    y={yPos + 3}
                                    textAnchor="end"
                                    fill={isLight ? '#64748b' : '#94a3b8'}
                                    className="text-[9px] font-mono font-medium"
                                  >
                                    {fmt(val * scaleMax)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Define Gradients dynamically */}
                            <defs>
                              {sortedCategories.map((item) => {
                                const style = getCategoryThemeStyle(item.key);
                                return (
                                  <linearGradient id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1" key={`grad-def-${item.key}`}>
                                    <stop offset="0%" stopColor={style.color1} />
                                    <stop offset="100%" stopColor={style.color2} />
                                  </linearGradient>
                                );
                              })}
                            </defs>

                            {/* Render Interactive Bars */}
                            {sortedCategories.map((item, idx) => {
                              const style = getCategoryThemeStyle(item.key);
                              const barHeight = (item.amountValue / scaleMax) * chartHeight;
                              const x = marginX + spacing + idx * (colWidth + spacing);
                              const y = bottomY - barHeight;
                              const isHovered = hoveredBar === item.key;

                              return (
                                <g key={`bar-${item.key}`} className="cursor-pointer">
                                  {/* Interaction Hover Backplate */}
                                  <rect
                                    x={x - spacing / 3}
                                    y={bottomY - chartHeight - 10}
                                    width={colWidth + (spacing * 2) / 3}
                                    height={chartHeight + 20}
                                    fill={isHovered ? (isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.03)') : 'transparent'}
                                    rx="8"
                                    onMouseEnter={() => setHoveredBar(item.key)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                  />

                                  {/* The Real Bar */}
                                  <motion.rect
                                    x={x}
                                    y={y}
                                    width={colWidth}
                                    height={barHeight}
                                    fill={`url(#grad-${item.key})`}
                                    rx="6"
                                    className="transition-all duration-150 origin-bottom"
                                    stroke={isHovered ? (isLight ? '#0f172a' : '#ffffff') : 'none'}
                                    strokeWidth={isHovered ? 1.5 : 0}
                                    onMouseEnter={() => setHoveredBar(item.key)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                  />

                                  {/* Label / emoji trigger on the bottom */}
                                  <text
                                    x={x + colWidth / 2}
                                    y={bottomY + 18}
                                    textAnchor="middle"
                                    fill={isHovered ? (isLight ? '#0f172a' : '#ffffff') : '#94a3b8'}
                                    className="text-[10px] font-bold"
                                    onMouseEnter={() => setHoveredBar(item.key)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                  >
                                    {item.icon}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  
                  {/* Floating HTML absolute Tooltip */}
                  {(() => {
                    const hoveredItem = hoveredBar ? sortedCategories.find(c => c.key === hoveredBar) : null;
                    if (!hoveredItem) return null;
                    const style = getCategoryThemeStyle(hoveredItem.key);
                    return (
                      <div className={`absolute top-0 right-0 p-3 rounded-xl border flex items-center gap-2.5 shadow-xl backdrop-blur-md animate-in fade-in duration-200 z-10 ${
                        isLight ? 'bg-white/95 border-slate-200 shadow-slate-100/40 text-slate-800' : 'bg-slate-900/95 border-white/10 shadow-black/80 text-white'
                      }`}>
                        <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: style.color1 }} />
                        <span className="text-base select-none">{hoveredItem.icon}</span>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">{hoveredItem.label}</p>
                          <p className="font-mono text-xs font-extrabold leading-none">{fmt(hoveredItem.amountValue)} <span className="text-[10px] text-slate-400 font-normal">({hoveredItem.pct}%)</span></p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* High Fidelity Donut Chart */
                <div className="w-full flex items-center justify-center relative py-2">
                  <svg className="w-full max-w-[240px] h-48 overflow-visible" viewBox="0 0 200 200">
                    {(() => {
                      const radius = 65;
                      const circ = 2 * Math.PI * radius; // 408.407
                      let accumulatedPct = 0;
                      const hoveredItem = hoveredBar ? sortedCategories.find(c => c.key === hoveredBar) : null;

                      return (
                        <>
                          {sortedCategories.map((item) => {
                            const style = getCategoryThemeStyle(item.key);
                            const strokeOffset = circ - (item.pct / 100) * circ;
                            const strokeRotation = (accumulatedPct / 100) * 360 - 90;
                            accumulatedPct += item.pct;
                            const isHovered = hoveredBar === item.key;

                            return (
                              <g key={`donut-group-${item.key}`}>
                                <circle
                                  cx="100"
                                  cy="100"
                                  r={radius}
                                  fill="transparent"
                                  stroke={style.color1}
                                  strokeWidth={isHovered ? 20 : 14}
                                  strokeDasharray={circ}
                                  strokeDashoffset={strokeOffset}
                                  transform={`rotate(${strokeRotation} 100 100)`}
                                  className="transition-all duration-300 ease-out cursor-pointer origin-center hover:opacity-95"
                                  onMouseEnter={() => setHoveredBar(item.key)}
                                  onMouseLeave={() => setHoveredBar(null)}
                                />
                              </g>
                            );
                          })}

                          {/* Center Text inside Donut hole */}
                          <g className="pointer-events-none select-none">
                            <text x="100" y="85" textAnchor="middle" fill={isLight ? '#64748b' : '#94a3b8'} className="text-[10px] font-extrabold uppercase tracking-widest leading-none">
                              {hoveredItem ? hoveredItem.label : 'Gasto Total'}
                            </text>
                            <text x="100" y="112" textAnchor="middle" fill={isLight ? '#0f172a' : '#ffffff'} className="text-sm font-mono font-black tracking-tight leading-none">
                              {fmt(hoveredItem ? hoveredItem.amountValue : totalSpent)}
                            </text>
                            <text x="100" y="130" textAnchor="middle" fill={isLight ? '#059669' : '#10b981'} className="text-[9.5px] font-extrabold tracking-wide">
                              {hoveredItem ? `${hoveredItem.pct}% do período` : `${transactions.length} Lançamentos`}
                            </text>
                          </g>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}
            </div>

            {/* List detailing expenditure by industry segment */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Detalhamento por Setor
                </span>
                <span className="text-[10px] text-slate-500 font-bold font-mono">
                  {sortedCategories.length} categorias
                </span>
              </div>
              
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {sortedCategories.map((item) => {
                  const style = getCategoryThemeStyle(item.key);
                  const isHovered = hoveredBar === item.key;
                  const itemQuantity = categoryCount[item.key] || 0;

                  return (
                    <div 
                      key={item.key} 
                      className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isHovered 
                          ? (isLight ? 'bg-slate-50 border-indigo-200 shadow-md translate-x-1' : 'bg-white/5 border-white/10 shadow-lg translate-x-1')
                          : (isLight ? 'bg-white border-slate-100' : 'bg-slate-950/40 border-transparent')
                      }`}
                      onMouseEnter={() => setHoveredBar(item.key)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-md w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isLight ? 'bg-slate-100 shadow-sm' : 'bg-white/4'
                          }`}>
                            {item.icon}
                          </span>
                          <div>
                            <span className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-white'}`}>{item.label}</span>
                            <span className={`text-[9.5px] font-semibold leading-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                              {itemQuantity} {itemQuantity === 1 ? 'lançamento' : 'lançamentos'} · {item.pct}%
                            </span>
                          </div>
                        </div>
                        <span className={`font-mono text-xs font-black ${isLight ? 'text-slate-950' : 'text-slate-100'}`}>
                          {fmt(item.amountValue)}
                        </span>
                      </div>
                      
                      {/* Fully responsive horizontal growth meter matching coordinates */}
                      <div className="h-1.5 w-full bg-slate-500/10 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${item.pct}%`,
                            background: `linear-gradient(90deg, ${style.color1}, ${style.color2})`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composition of Cash Flows (recurrent, flippant, installment) */}
      <div className="p-5 rounded-3xl glass-panel border-white/5">
        <h4 className="font-display font-extrabold text-sm text-slate-200 mb-4 uppercase tracking-wider">
          Composição de Despesas
        </h4>
        
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden flex">
          <div style={{ width: `${pctFixos}%` }} className="bg-indigo-500 h-full" title="Fixos"></div>
          <div style={{ width: `${pctVariaveis}%` }} className="bg-emerald-500 h-full" title="Variáveis"></div>
          <div style={{ width: `${pctParcelas}%` }} className="bg-amber-500 h-full" title="Parcelamentos"></div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1.5" />
            <span className="text-[10px] font-bold text-slate-400">Fixos: {pctFixos}%</span>
            <span className="block text-[10px] font-mono font-semibold text-slate-500">{fmt(totalFixos)}</span>
          </div>
          <div>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
            <span className="text-[10px] font-bold text-slate-400">Variáveis: {pctVariaveis}%</span>
            <span className="block text-[10px] font-mono font-semibold text-slate-500">{fmt(totalVariaveis)}</span>
          </div>
          <div>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
            <span className="text-[10px] font-bold text-slate-400 font-display">Parcelador: {pctParcelas}%</span>
            <span className="block text-[10px] font-mono font-semibold text-slate-500">{fmt(totalParcelas)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
