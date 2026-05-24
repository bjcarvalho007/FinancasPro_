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
        </div>
        
        {sortedCategories.length === 0 ? (
          <div className={`h-48 flex flex-col items-center justify-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            <BarChart2 className="w-8 h-8 opacity-25 mb-2" />
            Aguardando lançamentos para compor gráfico de colunas
          </div>
        ) : (
          <div className="w-full flex flex-col justify-center">
            {/* Advanced Responsive HTML Column Chart with Guidance Ticks */}
            <div className="w-full relative py-4">
              {(() => {
                const maxAmountValue = Math.max(...sortedCategories.map(c => c.amountValue), 1);
                // Standardize scale to prevent clipping and give 10% breathing room
                const scaleMax = maxAmountValue * 1.15;
                const yTicks = [1, 0.75, 0.5, 0.25, 0];

                return (
                  <div className="space-y-6">
                    {/* Dynamic Tooltip Header Bar when a segment is highlighted */}
                    <div className="h-10 flex items-center justify-between px-2">
                      {hoveredBar ? (() => {
                        const item = sortedCategories.find(c => c.key === hoveredBar);
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
                                {item.pct}% de todas as saídas
                              </span>
                            </div>
                          </div>
                        );
                      })() : (
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          Passe o mouse nas colunas para detalhar os gastos
                        </span>
                      )}

                      {hoveredBar && (() => {
                        const item = sortedCategories.find(c => c.key === hoveredBar);
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

                    {/* Chart Grid Area */}
                    <div className="relative h-44 w-full flex items-end">
                      {/* Guideline ticks positioned absolutely behind columns */}
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

                      {/* Bars container overlayed above ticks */}
                      <div className="absolute inset-y-0 left-16 right-0 flex items-end justify-around pb-7">
                        {sortedCategories.map((item) => {
                          const style = getCategoryThemeStyle(item.key);
                          const precisePctOfMax = (item.amountValue / scaleMax) * 100;
                          const isHovered = hoveredBar === item.key;

                          return (
                            <div
                              key={item.key}
                              className="flex flex-col items-center group relative h-full justify-end cursor-pointer"
                              style={{ width: `${100 / sortedCategories.length}%`, maxWidth: '58px' }}
                              onMouseEnter={() => setHoveredBar(item.key)}
                              onMouseLeave={() => setHoveredBar(null)}
                            >
                              {/* Interactive capture panel */}
                              <div className="absolute inset-0 bg-transparent z-10" />

                              {/* Main Bar Column */}
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
                                  {/* Polish glare highlight inside the column bar top */}
                                  <div className="w-full h-1 bg-white/30 rounded-full opacity-65" />
                                </motion.div>
                              </div>

                              {/* Emoji marker sits precisely on X-axis */}
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

                    {/* Category labels bottom helper row to prevent truncation / clipping */}
                    <div className="flex justify-around pl-16 pt-1 text-[8.5px] uppercase font-bold tracking-widest text-slate-500 select-none">
                      {sortedCategories.map((item) => (
                        <span 
                          key={item.key} 
                          className={`truncate text-center transition-colors duration-200 ${
                            hoveredBar === item.key 
                              ? (isLight ? 'text-indigo-600' : 'text-indigo-400') 
                              : 'text-slate-400'
                          }`} 
                          style={{ width: `${100 / sortedCategories.length}%`, maxWidth: '58px' }}
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
