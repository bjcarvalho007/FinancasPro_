import React, { useState } from 'react';
import { ExtraEarning } from '../types';
import { Plus, Trash2, Calendar, Tag, Briefcase, DollarSign, TrendingUp, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExtraEarningsManagerProps {
  currentMonthKey: string;
  extraEarnings: ExtraEarning[];
  currentCurrency: 'BRL' | 'USD' | 'EUR';
  onAddEarning: (earning: Omit<ExtraEarning, 'id' | 'createdAt'>) => void;
  onDeleteEarning: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export default function ExtraEarningsManager({
  currentMonthKey,
  extraEarnings = [],
  currentCurrency,
  onAddEarning,
  onDeleteEarning,
  showToast,
}: ExtraEarningsManagerProps) {
  const [source, setSource] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMode, setFilterMode] = useState<'current' | 'all'>('current');

  const formatCurrency = (val: number): string => {
    const locale = currentCurrency === 'BRL' ? 'pt-BR' : currentCurrency === 'USD' ? 'en-US' : 'de-DE';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currentCurrency }).format(val);
  };

  const handleMaskMoney = (val: string): string => {
    let numeric = val.replace(/\D/g, "");
    if (!numeric) return "";
    return formatCurrency(parseFloat(numeric) / 100);
  };

  const parseMoney = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/[^\d]/g, "");
    return parseFloat(clean) / 100 || 0;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim()) {
      showToast('Por favor, informe a origem ou serviço.', 'warning');
      return;
    }
    const amountVal = parseMoney(amountStr);
    if (amountVal <= 0) {
      showToast('Por favor, informe um valor maior que zero.', 'warning');
      return;
    }
    if (!date) {
      showToast('Por favor, escolha uma data.', 'warning');
      return;
    }

    // Determine monthKey from chosen date
    const [year, month] = date.split('-');
    const mKey = `${year}-${month}`;

    onAddEarning({
      source: source.trim(),
      amount: amountVal,
      date,
      monthKey: mKey,
    });

    setSource('');
    setAmountStr('');
    showToast('Renda extra registrada com sucesso!', 'success');
  };

  // Filter items based on selected filter mode
  const filteredEarnings = extraEarnings.filter((item) => {
    if (filterMode === 'current') {
      return item.monthKey === currentMonthKey;
    }
    return true; // All history
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalFilteredSum = filteredEarnings.reduce((sum, item) => sum + item.amount, 0);

  // Format month name for display
  const formatMonthTitle = (key: string) => {
    if (!key || !key.includes('-')) return key;
    const [year, month] = key.split('-');
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const idx = parseInt(month, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${months[idx]} ${year}`;
    }
    return key;
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-display font-black text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Histórico de Rendas Extras
          </h5>
          <p className="text-[10px] text-slate-500">Registre ganhos alternativos por serviço ou vendas.</p>
        </div>
        
        {/* Toggle Scope */}
        <div className="flex items-center gap-1 bg-slate-900 border border-white/5 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterMode('current')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
              filterMode === 'current'
                ? 'bg-indigo-650 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mês Atual
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
              filterMode === 'all'
                ? 'bg-indigo-650 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Add New Earning Form */}
      <form onSubmit={handleAdd} className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5 text-emerald-400" /> Registrar Novo Ganho
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Origem ou Serviço</label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Ex: Freelance Logo, Aula Particular"
                className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 text-slate-200 text-xs pl-9 pr-3 py-2.5 rounded-xl placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Valor Recebido</label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => setAmountStr(handleMaskMoney(e.target.value))}
                placeholder="R$ 0,00"
                className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 text-slate-200 text-xs pl-9 pr-3 py-2.5 rounded-xl font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Data do Recebimento</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 text-slate-200 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Registrar
          </button>
        </div>
      </form>

      {/* Itemized List Panel */}
      <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
          <span>Relação de Entradas ({filteredEarnings.length})</span>
          <span className="text-emerald-400 font-mono text-xs">{formatCurrency(totalFilteredSum)}</span>
        </div>

        <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 text-slate-300">
          <AnimatePresence initial={false}>
            {filteredEarnings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6 text-slate-500 text-xs italic"
              >
                Nenhuma renda extra registrada para o filtro selecionado.
              </motion.div>
            ) : (
                filteredEarnings.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-900 border border-white/3 hover:border-white/5 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 leading-tight">
                          {item.source}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-500 font-mono flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {item.date.split('-').reverse().join('/')}
                          </span>
                          {filterMode === 'all' && (
                            <span className="px-1.5 py-0.5 bg-indigo-500/15 text-[8px] text-indigo-400 rounded font-bold">
                              {formatMonthTitle(item.monthKey)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black font-mono text-slate-100">
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteEarning(item.id)}
                        className="w-7 h-7 rounded-lg bg-rose-500/5 hover:bg-rose-500/15 text-rose-500 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors border border-rose-500/10"
                        title="Remover Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
