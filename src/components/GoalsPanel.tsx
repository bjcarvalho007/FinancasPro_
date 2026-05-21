import React, { useState } from 'react';
import { Goal } from '../types';
import { Target, Trash2, Plus, PlusCircle, Minus, Calendar, Percent, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GoalsPanelProps {
  goals: Goal[];
  onCreateGoal: (title: string, targetAmount: number, currentAmount: number, deadline: string) => void;
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
  const [deadline, setDeadline] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Deposit/Withdraw helper per goal
  const [activeGoalIdForTransaction, setActiveGoalIdForTransaction] = useState<string | null>(null);
  const [goalTxAmountStr, setGoalTxAmountStr] = useState<string>('');
  const [isDeposit, setIsDeposit] = useState<boolean>(true);

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
    const current = parseMoney(currentAmountStr);
    
    if (target <= 0) {
      setError("Por favor, informe um valor de meta alvo maior que zero.");
      return;
    }

    onCreateGoal(title, target, current, deadline || 'Dezembro 2026');
    
    setTitle('');
    setTargetAmountStr('');
    setCurrentAmountStr('');
    setDeadline('');
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

  return (
    <div className="space-y-6">
      {/* Header and Toggle of custom goal form */}
      <div className="flex items-center justify-between">
        <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-300">
          Metas & Reservas Financeiras Alvo
        </h4>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <Target className="w-4 h-4" />
          {showAddGoal ? 'Cancelar Nova' : 'Nova Meta'}
        </button>
      </div>

      <AnimatePresence>
        {showAddGoal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 space-y-4 overflow-hidden"
          >
            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              🎯 Configurar Novo Objetivo
            </h5>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-250 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </motion.div>
              )}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nome/Objetivo da Meta</label>
                <input
                  type="text"
                  placeholder="Ex: Reserva de Emergência, Viagem Europa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Meta Final Alvo (R$)</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(maskMoney(e.target.value))}
                    className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Valor Inicial Salvo (R$)</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={currentAmountStr}
                    onChange={(e) => setCurrentAmountStr(maskMoney(e.target.value))}
                    className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Data Limite Estimada</label>
                <input
                  type="text"
                  placeholder="Ex: Dezembro 2026, Em 1 ano"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Ativar Meta Financeira
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card list matching layout logic */}
      {goals.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl text-xs text-slate-500 select-none">
          Nenhuma meta ou plano ativo para o período. Comece definindo seu fundo emergencial!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.max(0, Math.round((g.currentAmount / g.targetAmount) * 100)));
            const isFinished = pct >= 100;

            return (
              <motion.div
                key={g.id}
                layout
                className={`p-5 rounded-3xl border flex flex-col justify-between transition-all relative ${
                  isFinished 
                    ? 'bg-emerald-950/20 border-emerald-500/30 glow-emerald' 
                    : 'bg-slate-950/40 border-white/5 hover:border-white/10'
                }`}
              >
                {isFinished && (
                  <span className="absolute top-4 right-4 text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> CONCLUÍDO
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-display font-black text-slate-100 text-base">{g.title}</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" /> Prazo: {g.deadline}
                      </p>
                    </div>
                  </div>

                  {/* Wallet value details */}
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xl font-extrabold text-white">
                      {formatMoney(g.currentAmount)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      de {formatMoney(g.targetAmount)} Alvo
                    </span>
                  </div>

                  {/* Dynamic Progress indicator */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>Eficiência:</span>
                      <span className={isFinished ? 'text-emerald-400' : 'text-indigo-400'}>{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${
                          isFinished 
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-form to contribute on a deposit or withdraw */}
                {activeGoalIdForTransaction === g.id ? (
                  <div className="mt-4 p-3 bg-slate-900 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                      <span>{isDeposit ? '📥 Creditar na Meta' : '📤 Resgatar da Meta'}</span>
                      <button onClick={() => setActiveGoalIdForTransaction(null)} className="text-slate-500">✕</button>
                    </div>

                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={goalTxAmountStr}
                      onChange={(e) => setGoalTxAmountStr(maskMoney(e.target.value))}
                      className="w-full bg-slate-950 border border-white/5 text-xs px-3 py-2.5 rounded-lg text-white font-mono"
                      required
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={handleGoalTxSubmit}
                        className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex gap-2 justify-between items-center pt-4 border-t border-white/5">
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

                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-500 bg-rose-500/5 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                      title="Excluir Meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
