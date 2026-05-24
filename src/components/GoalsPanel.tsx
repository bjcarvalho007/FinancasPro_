import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { 
  Target, 
  Trash2, 
  Plus, 
  Minus, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  TrendingUp, 
  LineChart, 
  HelpCircle, 
  Coins, 
  ArrowUpRight, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GoalsPanelProps {
  goals: Goal[];
  onCreateGoal: (
    title: string,
    targetAmount: number,
    currentAmount: number,
    deadline: string,
    initialAmount?: number,
    monthlyContribution?: number,
    targetMonths?: number
  ) => void;
  onUpdateGoalProgress: (goalId: string, amountToChange: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function GoalsPanel({
  goals,
  onCreateGoal,
  onUpdateGoalProgress,
  onDeleteGoal
}: GoalsPanelProps) {
  const [showAddGoal, setShowAddGoal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [targetAmountStr, setTargetAmountStr] = useState<string>('');
  const [currentAmountStr, setCurrentAmountStr] = useState<string>('');
  const [initialAmountStr, setInitialAmountStr] = useState<string>('');
  const [monthlyContributionStr, setMonthlyContributionStr] = useState<string>('');
  const [targetMonths, setTargetMonths] = useState<number>(12);
  const [deadline, setDeadline] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Expanded intelligence view toggle per card
  const [focusedPredictiveGoalId, setFocusedPredictiveGoalId] = useState<string | null>(null);

  // Deposit/Withdraw helper per goal
  const [activeGoalIdForTransaction, setActiveGoalIdForTransaction] = useState<string | null>(null);
  const [goalTxAmountStr, setGoalTxAmountStr] = useState<string>('');
  const [isDeposit, setIsDeposit] = useState<boolean>(true);

  // Generate automated deadline text when targetMonths is shifted
  useEffect(() => {
    if (targetMonths) {
      const date = new Date();
      date.setMonth(date.getMonth() + targetMonths);
      const ptBRMonths = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      setDeadline(`${ptBRMonths[date.getMonth()]} ${date.getFullYear()}`);
    }
  }, [targetMonths]);

  const formatMoney = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const maskMoney = (val: string): string => {
    let numeric = val.replace(/\D/g, "");
    if (!numeric) return "";
    return formatMoney(parseFloat(numeric) / 100);
  };

  const parseMoney = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Por favor, preencha o título da meta.");
      return;
    }
    const target = parseMoney(targetAmountStr);
    const initial = parseMoney(initialAmountStr);
    const current = parseMoney(currentAmountStr) || initial; // defaults to initial
    const monthly = parseMoney(monthlyContributionStr);
    
    if (target <= 0) {
      setError("Por favor, informe uma meta de valor final maior que zero.");
      return;
    }

    if (current > target) {
      setError("O valor já acumulado não pode ser maior que o valor alvo da meta final.");
      return;
    }

    onCreateGoal(
      title, 
      target, 
      current, 
      deadline || `${targetMonths} meses`, 
      initial, 
      monthly, 
      targetMonths
    );
    
    // reset form fields
    setTitle('');
    setTargetAmountStr('');
    setCurrentAmountStr('');
    setInitialAmountStr('');
    setMonthlyContributionStr('');
    setTargetMonths(12);
    setShowAddGoal(false);
  };

  const handleGoalTxSubmit = () => {
    if (!activeGoalIdForTransaction) return;
    const val = parseMoney(goalTxAmountStr);
    if (val <= 0) return;

    onUpdateGoalProgress(activeGoalIdForTransaction, isDeposit ? val : -val);
    setActiveGoalIdForTransaction(null);
    setGoalTxAmountStr('');
  };

  // Predictive simulator mathematical calculator
  const getPredictiveIntelligence = (g: Goal) => {
    const target = g.targetAmount;
    const current = g.currentAmount;
    const initial = g.initialAmount || 0;
    const monthly = g.monthlyContribution || 0;
    const monthsLimit = g.targetMonths || 12;

    const neededToTarget = Math.max(0, target - current);
    
    // Required monthly flow to reach on predicted timeline
    const optimalMonthlyContribution = monthsLimit > 0 ? neededToTarget / monthsLimit : 0;
    
    // True speed: when will they finish with their planned monthly contribution?
    const plannedMonthsToReach = monthly > 0 ? Math.ceil(neededToTarget / monthly) : 0;

    // Compound Interest comparison: simulate standard 100% CDI active monthly yield rate (estimate 0.8% net monthly)
    const monthlyInterestRate = 0.008; 
    let simBalanceCDI = current;
    let simSavingsPure = current;
    const plotCDIPoints: { x: number; y: number; val: number }[] = [];
    const plotPurePoints: { x: number; y: number; val: number }[] = [];

    const simMonths = Math.max(6, monthsLimit);
    for (let m = 0; m <= simMonths; m++) {
      if (m > 0) {
        simBalanceCDI = (simBalanceCDI + monthly) * (1 + monthlyInterestRate);
        simSavingsPure = simSavingsPure + monthly;
      }
      plotCDIPoints.push({
        x: (m / simMonths) * 100,
        y: 100 - Math.min(100, (simBalanceCDI / target) * 100),
        val: simBalanceCDI
      });
      plotPurePoints.push({
        x: (m / simMonths) * 100,
        y: 100 - Math.min(100, (simSavingsPure / target) * 100),
        val: simSavingsPure
      });
    }

    const totalCDIAccrued = Math.round(plotCDIPoints[plotCDIPoints.length - 1].val);
    const earnedInterest = Math.max(0, totalCDIAccrued - (current + (monthly * simMonths)));

    // Feasibility calculation score based on planned monthly aporte vs required monthly velocity
    let feasibilityScore: 'Alta' | 'Moderada' | 'Desafiadora' = 'Moderada';
    let statusColor = 'text-amber-400';
    let statusBg = 'bg-amber-400/10';

    if (monthly >= optimalMonthlyContribution && monthly > 0) {
      feasibilityScore = 'Alta';
      statusColor = 'text-emerald-400';
      statusBg = 'bg-emerald-400/10';
    } else if (monthly === 0 || (monthly < optimalMonthlyContribution * 0.5)) {
      feasibilityScore = 'Desafiadora';
      statusColor = 'text-rose-450';
      statusBg = 'bg-rose-550/10';
    }

    return {
      neededToTarget,
      optimalMonthlyContribution,
      plannedMonthsToReach,
      earnedInterest,
      feasibilityScore,
      statusColor,
      statusBg,
      plotCDIPoints,
      plotPurePoints
    };
  };

  return (
    <div className="space-y-6">
      {/* Header and Toggle of custom goal form */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            Metas do Futuro & Inteligência Preditiva
          </h4>
          <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
            Crie objetivos financeiros com simulação avançada de aportes e curva de juros CDI.
          </p>
        </div>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md select-none"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          {showAddGoal ? 'Cancelar Nova' : 'Adicionar Nova Meta'}
        </button>
      </div>

      <AnimatePresence>
        {showAddGoal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6 rounded-2xl bg-[#0b0f19]/80 border border-indigo-500/10 shadow-xl space-y-4 overflow-hidden relative"
          >
            {/* Ambient Background Glow inside form */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <h5 className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400 animate-bounce" />
              Configurar Novo Planejamento Financeiro Técnico
            </h5>
            
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </motion.div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-405 uppercase tracking-widest mb-1.5">Nome/Objetivo da Meta</label>
                  <input
                    type="text"
                    required
                    maxLength={35}
                    placeholder="Ex: Novo Carro, Fundo de Emergência, Intercâmbio"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-405 uppercase tracking-widest mb-1.5 font-sans">Valor Alvo Final Objetivo (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(maskMoney(e.target.value))}
                    className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl transition-all font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-405 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    Valor de Partida / Inicial <span className="text-[8px] text-indigo-400 lowercase italic font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={initialAmountStr}
                    onChange={(e) => setInitialAmountStr(maskMoney(e.target.value))}
                    className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 text-xs px-4 py-2.5 rounded-xl transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-405 uppercase tracking-widest mb-1.5">
                    Valor já Guardado / Em Andamento
                  </label>
                  <input
                    type="text"
                    placeholder="Deixe em branco p/ usar o Inicial"
                    value={currentAmountStr}
                    onChange={(e) => setCurrentAmountStr(maskMoney(e.target.value))}
                    className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs px-4 py-2.5 rounded-xl transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-405 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    Aporte Mensal Planejado <span className="text-[8px] text-indigo-400 lowercase italic font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={monthlyContributionStr}
                    onChange={(e) => setMonthlyContributionStr(maskMoney(e.target.value))}
                    className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs px-4 py-2.5 rounded-xl transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[9px] font-bold text-slate-405 uppercase tracking-widest">Prazo para Alcançar a Meta</label>
                    <span className="text-[10px] font-mono font-black text-indigo-400">{targetMonths} meses</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={targetMonths}
                    onChange={(e) => setTargetMonths(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                    <span>1 mês</span>
                    <span>12 meses</span>
                    <span>3 anos (36m)</span>
                    <span>5 anos (60m)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-405 uppercase tracking-widest mb-1.5">Data Final Estimada de Destino</label>
                  <input
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 text-slate-350 text-xs px-4 py-2.5 rounded-xl font-bold"
                    placeholder="Ex: Janeiro 2027"
                  />
                </div>
              </div>

              {/* Dynamic Preview Engine in Real Time Creation */}
              {parseMoney(targetAmountStr) > 0 && (
                <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10.5px] text-slate-350 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-semibold flex items-center gap-1 text-slate-300">
                    <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    Ritmo Requerido Recomendado:
                  </span>
                  <span className="font-mono text-xs font-extrabold text-indigo-300">
                    {formatMoney(Math.max(0, (parseMoney(targetAmountStr) - (parseMoney(currentAmountStr) || parseMoney(initialAmountStr))) / targetMonths))}/mês durante estes {targetMonths} meses.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-[11px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/15"
              >
                Gerar Meta e Iniciar Monitoramento de Caixa
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card list matching layout logic */}
      {goals.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl text-xs text-slate-500 select-none flex flex-col items-center justify-center gap-3">
          <Target className="w-8 h-8 text-slate-650 animate-pulse" />
          <span>Nenhuma meta do futuro ou reserva ativa. Defina seu primeiro objetivo financeiro para ver análises gráficas.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {goals.map((g) => {
            const pct = Math.min(100, Math.max(0, Math.round((g.currentAmount / g.targetAmount) * 100)));
            const isFinished = pct >= 100;
            const intel = getPredictiveIntelligence(g);
            const isInspectingIntelligence = focusedPredictiveGoalId === g.id;

            return (
              <motion.div
                key={g.id}
                layout
                className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isFinished 
                    ? 'bg-emerald-950/10 border-emerald-500/20' 
                    : 'bg-slate-950/30 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Decorative glowing gradient backdrop */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Card Top Title Bar */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-black text-slate-100 text-lg leading-tight tracking-tight select-none">
                        {g.title}
                      </h4>
                      {isFinished ? (
                        <span className="text-[8.5px] font-mono font-black text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Sucesso total
                        </span>
                      ) : g.monthlyContribution && g.monthlyContribution > 0 ? (
                        <span className={`text-[8.5px] font-mono font-black ${intel.statusColor} ${intel.statusBg} px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1`}>
                          <Zap className="w-2.5 h-2.5 shrink-0" /> Prioridade {intel.feasibilityScore}
                        </span>
                      ) : null}
                    </div>
                    
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-1 select-none">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400/80" /> Prazo final: {g.deadline} · {g.targetMonths || 12} meses planejados
                    </p>
                  </div>

                  {/* Financial Counters */}
                  <div className="flex items-baseline md:text-right gap-2 md:block">
                    <span className="font-mono text-2xl font-extrabold text-white block">
                      {formatMoney(g.currentAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-widest mt-0.5">
                      de <strong className="font-mono text-indigo-300">{formatMoney(g.targetAmount)}</strong> alvo
                    </span>
                  </div>
                </div>

                {/* Progress bar visualizer */}
                <div className="space-y-1.5 py-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 select-none">
                    <span className="uppercase tracking-widest text-[9px] text-indigo-200">Progresso Atual</span>
                    <span className={isFinished ? 'text-emerald-400 font-mono text-xs' : 'text-indigo-400 font-mono text-xs font-black'}>
                      {pct}%
                    </span>
                  </div>
                  
                  <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden p-0.5 border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full relative group ${
                        isFinished 
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400' 
                          : 'bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500'
                      }`}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-full" />
                    </motion.div>
                  </div>

                  {/* Start, current, target labels row */}
                  <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                    <span>Início: {formatMoney(g.initialAmount || 0)}</span>
                    {!isFinished && <span>Falta: {formatMoney(intel.neededToTarget)}</span>}
                    <span>Meta: {formatMoney(g.targetAmount)}</span>
                  </div>
                </div>

                {/* ADVANCED TECHNOLOGY SECTION: PREDICTIVE INTEL ENGINE */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setFocusedPredictiveGoalId(isInspectingIntelligence ? null : g.id)}
                      className="text-[10.5px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors uppercase tracking-widest select-none cursor-pointer"
                    >
                      <LineChart className="w-4 h-4 text-indigo-400" />
                      {isInspectingIntelligence ? 'Ocultar Análise Preditiva ▲' : 'Ver Estatísticas Avançadas & Trajetória CDI ▼'}
                    </button>

                    {g.monthlyContribution && g.monthlyContribution > 0 ? (
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">
                        Aporte: <strong className="text-white bg-slate-900 border border-white/5 px-2 py-0.5 rounded-md">{formatMoney(g.monthlyContribution)}/mês</strong>
                      </span>
                    ) : (
                      <span className="text-[9px] text-rose-350 italic">Sem aporte mensal cadastrado</span>
                    )}
                  </div>

                  <AnimatePresence>
                    {isInspectingIntelligence && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-5 overflow-hidden pt-2"
                      >
                        {/* 4-Column Intelligence Data Panel */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="p-3 rounded-2xl bg-slate-900/50 border border-white/5">
                            <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-1 select-none">Investimento Necessário</span>
                            <span className="font-mono text-xs font-bold text-white block">
                              {formatMoney(intel.optimalMonthlyContribution)}
                            </span>
                            <span className="text-[7.5px] text-slate-450 block font-semibold leading-tight mt-1">Aporte ideal p/ atingir no prazo exato</span>
                          </div>

                          <div className="p-3 rounded-2xl bg-slate-900/50 border border-white/5">
                            <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-1 select-none">Tempo Estimado Real</span>
                            <span className="font-mono text-xs font-bold text-white block">
                              {intel.plannedMonthsToReach > 0 ? `${intel.plannedMonthsToReach} meses` : 'N/A'}
                            </span>
                            <span className="text-[7.5px] text-slate-450 block font-semibold leading-tight mt-1">Tempo com ritmo de aporte planejado</span>
                          </div>

                          <div className="p-3 rounded-2xl bg-[#081220]/75 border border-indigo-900/15">
                            <span className="block text-[8px] text-indigo-400 font-bold uppercase tracking-widest mb-1 select-none">Auxílio de Juros CDI</span>
                            <span className="font-mono text-xs font-bold text-emerald-400 block flex items-center gap-1">
                              + {formatMoney(intel.earnedInterest)} <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 inline" />
                            </span>
                            <span className="text-[7.5px] text-slate-450 block font-semibold leading-tight mt-1">Estimado rindindo 100% CDI livre</span>
                          </div>

                          <div className="p-3 rounded-2xl bg-slate-900/50 border border-white/5">
                            <span className="block text-[8px] text-slate-550 font-bold uppercase tracking-widest mb-1 select-none">Eficiência de Viabilidade</span>
                            <span className={`text-xs font-black block uppercase ${intel.statusColor}`}>
                              {intel.feasibilityScore}
                            </span>
                            <span className="text-[7.5px] text-slate-450 block font-semibold leading-tight mt-1">Comparando planos de investimento</span>
                          </div>
                        </div>

                        {/* Interactive Prediction SVG Graph Box */}
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[9px] uppercase tracking-widest font-black text-slate-450 flex items-center gap-1.5 select-none">
                              <LineChart className="w-3.5 h-3.5 text-indigo-400" />
                              Curva Preditiva Estimada ({g.targetMonths || 12} meses de simulação)
                            </span>
                            <div className="flex gap-4 text-[8px] font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1 text-slate-500">
                                <span className="w-2 h-0.5 border-t-2 border-dashed border-slate-650" /> Poupança Física
                              </span>
                              <span className="flex items-center gap-1 text-emerald-400">
                                <span className="w-2 h-0.5 bg-emerald-400" /> Rendimento 100% CDI
                              </span>
                            </div>
                          </div>

                          {/* Line Chart Draw */}
                          <div className="h-28 w-full relative pt-2">
                            {/* Graphic back grid lines */}
                            <div className="absolute inset-x-0 top-0 border-t border-dashed border-white/5 h-0" />
                            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/5 h-0" />
                            <div className="absolute inset-x-0 bottom-0 border-t border-white/10 h-0" />

                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                              <defs>
                                <linearGradient id="cdiGlow" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
                                  <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                                </linearGradient>
                              </defs>

                              {/* Pure saving dashed trajectory line */}
                              <polyline
                                fill="none"
                                stroke="#475569"
                                strokeWidth="0.8"
                                strokeDasharray="2"
                                points={intel.plotPurePoints.map(p => `${p.x},${p.y}`).join(' ')}
                              />

                              {/* CDI savings filled area */}
                              <polyline
                                fill="url(#cdiGlow)"
                                stroke="none"
                                points={`0,100 ${intel.plotCDIPoints.map(p => `${p.x},${p.y}`).join(' ')} 100,100`}
                              />

                              {/* CDI savings trajectory line */}
                              <polyline
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="1.5"
                                points={intel.plotCDIPoints.map(p => `${p.x},${p.y}`).join(' ')}
                              />

                              {/* Interactive plotted circles */}
                              {intel.plotCDIPoints.filter((_, i) => i === 0 || i === Math.floor(intel.plotCDIPoints.length / 2) || i === intel.plotCDIPoints.length - 1).map((p, idx) => (
                                <g key={idx}>
                                  <circle cx={p.x} cy={p.y} r="1.5" fill="#10b981" />
                                </g>
                              ))}
                            </svg>

                            {/* Label coordinates overlay */}
                            <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-500 font-extrabold select-none">
                              {formatMoney(g.targetAmount)}
                            </div>
                            <div className="absolute bottom-1 right-2 text-[8px] font-mono text-emerald-400 font-extrabold select-none">
                              Proj. CDI: {formatMoney(intel.plotCDIPoints[intel.plotCDIPoints.length - 1].val)}
                            </div>
                          </div>
                        </div>

                        {/* IA Tip box */}
                        <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 text-[10.5px] text-indigo-300 leading-relaxed flex items-start gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-extrabold uppercase tracking-wider text-[9px] block text-indigo-200 mb-0.5">Dica da Engenharia de Caixa</span>
                            {isFinished ? (
                              "Sua meta foi plenamente concluída de forma brilhante! Se quiser manter este dinheiro para emergências estruturadas, o ideal é investir em CDBs de liquidez diária operantes a 100% CDI para não sofrer resgates parciais sob inflação constante."
                            ) : g.monthlyContribution && g.monthlyContribution >= intel.optimalMonthlyContribution ? (
                              `Seu cronograma está no caminho correto! O aporte planejado de ${formatMoney(g.monthlyContribution)} garantirá a obtenção do valor antes do prazo. Sugestão tecnológica: Aplique em ativos pós-fixados isentos de imposto de renda (como LCI/LCA) com liquidez no prazo planejado de ${g.deadline}.`
                            ) : g.monthlyContribution && g.monthlyContribution > 0 ? (
                              `Aporte parcial detectado. Com ${formatMoney(g.monthlyContribution)} mensais, você vai atrasar e precisará de aprox. ${intel.plannedMonthsToReach} meses para alcançar o alvo. Recomenda-se aumentar em R$ ${(intel.optimalMonthlyContribution - g.monthlyContribution).toFixed(2)} por mês para acelerar e ficar em conformidade com o cronograma.`
                            ) : (
                              "Configure um valor em 'Aporte Mensal Planejado' no formulário para usufruir de nossa simulação computacional inteligente de taxa de juros composta CDI e projeção gráfica avançada do plano de economias!"
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sub-form to contribute on a deposit or withdraw */}
                {activeGoalIdForTransaction === g.id ? (
                  <div className="mt-4 p-3.5 bg-slate-900 border border-white/5 rounded-2xl space-y-3 relative z-20">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                      <span>{isDeposit ? '📥 Creditar na Meta' : '📤 Resgatar da Meta'}</span>
                      <button onClick={() => setActiveGoalIdForTransaction(null)} className="text-slate-500 hover:text-white">✕</button>
                    </div>

                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={goalTxAmountStr}
                      onChange={(e) => setGoalTxAmountStr(maskMoney(e.target.value))}
                      className="w-full bg-slate-950 border border-white/5 text-xs px-3 py-2.5 rounded-lg text-white font-mono"
                      required
                      autoFocus
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={handleGoalTxSubmit}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Confirmar Transação
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2 justify-between items-center pt-4 border-t border-white/5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setActiveGoalIdForTransaction(g.id);
                          setIsDeposit(true);
                        }}
                        className="p-2 bg-slate-900/80 border border-white/5 rounded-xl hover:border-indigo-500/50 hover:text-indigo-400 transition-all text-slate-400 text-xs font-bold cursor-pointer"
                        title="Depositar fundos"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveGoalIdForTransaction(g.id);
                          setIsDeposit(false);
                        }}
                        className="p-2 bg-slate-900/80 border border-white/5 rounded-xl hover:border-rose-500/50 hover:text-rose-400 transition-all text-slate-400 text-xs font-bold cursor-pointer"
                        title="Resgatar / sacar fundos"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDeleteGoal(g.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-450 bg-rose-500/5 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                        title="Excluir Meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
