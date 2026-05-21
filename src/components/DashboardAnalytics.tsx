import { useState } from 'react';
import { Transaction, Category } from '../types';
import { Sparkles, BarChart2, TrendingUp, AlertTriangle, Lightbulb, Wallet, ArrowUpRight, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardAnalyticsProps {
  transactions: Transaction[];
  categoriesList: Category[];
  totalAvailable: number;
  leftover: number;
  income: number;
  balance: number;
  extra: number;
}

export default function DashboardAnalytics({
  transactions,
  categoriesList,
  totalAvailable,
  leftover,
  income,
  balance,
  extra
}: DashboardAnalyticsProps) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

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
      <div className="p-5 rounded-3xl glass-panel border-white/5">
        <h4 className="font-display font-extrabold text-sm text-slate-200 mb-6 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-400" /> Distribuição de Gastos do Período
        </h4>
        
        {sortedCategories.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-500 text-xs">
            Aguardando lançamentos para compor gráfico de colunas
          </div>
        ) : (
          <div className="space-y-6">
            {/* Custom responsive Bar Chart via customizable inline SVG */}
            <div className="w-full overflow-x-auto">
              <svg className="w-full h-44 overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                {sortedCategories.slice(0, 6).map((item, idx) => {
                  const maxVal = Math.max(...sortedCategories.map(c => c.amountValue));
                  const barHeight = maxVal > 0 ? (item.amountValue / maxVal) * 80 : 0;
                  const x = 20 + idx * 45;
                  const y = 90 - barHeight;
                  const isHovered = hoveredBar === item.key;
                  
                  return (
                    <g key={item.key} className="cursor-pointer">
                      {/* Background hover guide */}
                      <rect
                        x={x - 8}
                        y="10"
                        width="30"
                        height="90"
                        fill={isHovered ? 'rgba(99, 102, 241, 0.05)' : 'transparent'}
                        rx="6"
                        onMouseEnter={() => setHoveredBar(item.key)}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      
                      {/* Interactive Bar */}
                      <rect
                        x={x}
                        y={y}
                        width="14"
                        height={barHeight}
                        fill={isHovered ? 'var(--color-indigo-400)' : 'url(#barGradient)'}
                        rx="4"
                        onMouseEnter={() => setHoveredBar(item.key)}
                        onMouseLeave={() => setHoveredBar(null)}
                      />

                      {/* Bar label matching emoji below */}
                      <text
                        x={x + 7}
                        y="108"
                        textAnchor="middle"
                        fill="#94a3b8"
                        className="text-[9px] font-bold"
                      >
                        {item.icon}
                      </text>

                      {/* Tooltip text inside the SVG */}
                      {isHovered && (
                        <g>
                          <rect
                            x={x - 25}
                            y={y - 20}
                            width="64"
                            height="16"
                            fill="#0b0f19"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                            rx="4"
                          />
                          <text
                            x={x + 7}
                            y={y - 9}
                            textAnchor="middle"
                            fill="#f8fafc"
                            className="text-[7.5px] font-bold font-mono"
                          >
                            {fmt(item.amountValue)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Shaders */}
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* List detailing expenditure by industry segment */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Detalhamento por Setor
              </h5>
              
              <div className="space-y-2">
                {sortedCategories.map((item) => (
                  <div key={item.key} className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg bg-white/3 w-8 h-8 rounded-lg flex items-center justify-center">
                        {item.icon}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white block">{item.label}</span>
                        <span className="text-[10px] text-slate-500">{item.pct}% de todas as saídas</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-slate-200">
                      {fmt(item.amountValue)}
                    </span>
                  </div>
                ))}
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
