import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../types';
import { formatDisplayDueDate } from '../App';
import { 
  X, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowUpDown,
  Building2,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GroupedExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  transactions: Transaction[];
  theme: 'dark' | 'light';
  onPay: (txId: string) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (txId: string) => void;
  onAddAnother: (name: string, defaultCat?: string) => void;
  categoryList: Category[];
  currentMonthName?: string;
  formatCurrency: (val: number) => string;
}

export default function GroupedExpensesModal({
  isOpen,
  onClose,
  groupName,
  transactions,
  theme,
  onPay,
  onEdit,
  onDelete,
  onAddAnother,
  categoryList,
  currentMonthName,
  formatCurrency
}: GroupedExpensesModalProps) {
  // Sort order: 'asc' = oldest to newest (e.g. Day 05 -> Day 19), 'desc' = newest to oldest
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const parseDueDay = (dueStr: string): number => {
    if (!dueStr) return 99;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueStr.trim())) {
      const parts = dueStr.trim().split('-');
      const day = parseInt(parts[2], 10);
      return isNaN(day) ? 99 : day;
    }
    const num = parseInt(dueStr.replace(/\D/g, ''), 10);
    return isNaN(num) ? 99 : num;
  };

  // Sort transactions by date according to sortOrder
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let cmp = 0;
      if (a.due && b.due && a.due.length >= 10 && b.due.length >= 10) {
        cmp = a.due.localeCompare(b.due);
      } else {
        cmp = parseDueDay(a.due) - parseDueDay(b.due);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [transactions, sortOrder]);

  // Aggregate stats
  const totalAmount = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const totalPaid = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  }, [transactions]);

  const totalPending = Math.max(0, totalAmount - totalPaid);
  const paidCount = transactions.filter(t => (t.amount - (t.paid_amount || 0)) <= 0.009).length;
  const isAllPaid = transactions.length > 0 && paidCount === transactions.length;

  const categoryObj = useMemo(() => {
    const firstCat = transactions[0]?.cat;
    return categoryList.find(c => c.value === firstCat) || { icon: '📦', label: firstCat || 'Variados' };
  }, [transactions, categoryList]);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl relative z-10 flex flex-col max-h-[92vh] border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
              : 'bg-[#0f1524] border-white/10 text-white shadow-black/80'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-dashed border-slate-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shadow-sm shrink-0 ${
                isLight ? 'bg-amber-100 border-amber-200 text-amber-900' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}>
                {categoryObj.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-display font-black text-lg sm:text-xl tracking-tight leading-snug truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {groupName}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
                    👥 {transactions.length} Lançamentos
                  </span>
                </div>
                <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Gastos agrupados por descrição {currentMonthName ? `• ${currentMonthName}` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer text-xs shrink-0 ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900' 
                  : 'bg-slate-900 hover:bg-slate-800 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Fechar janela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Aggregate Financial Metrics */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 py-3 shrink-0">
            <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950/60 border-white/5'
            }`}>
              <span className={`text-[9.5px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Total Geral
              </span>
              <span className={`font-mono text-sm sm:text-base font-black mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {formatCurrency(totalAmount)}
              </span>
              <span className={`text-[9px] font-medium mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {transactions.length} despesas
              </span>
            </div>

            <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-emerald-500/5 border-emerald-500/20'
            }`}>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-500">
                Total Pago
              </span>
              <span className="font-mono text-sm sm:text-base font-black mt-1 text-emerald-500">
                {formatCurrency(totalPaid)}
              </span>
              <span className="text-[9px] font-medium mt-0.5 text-emerald-500/90">
                {paidCount} de {transactions.length} liquidadas
              </span>
            </div>

            <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
              isLight ? 'bg-amber-50/60 border-amber-200/80' : 'bg-amber-500/5 border-amber-500/20'
            }`}>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-500">
                Pendente
              </span>
              <span className={`font-mono text-sm sm:text-base font-black mt-1 ${totalPending > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                {formatCurrency(totalPending)}
              </span>
              <span className={`text-[9px] font-medium mt-0.5 ${totalPending > 0 ? 'text-amber-500/90' : 'text-slate-400'}`}>
                {transactions.length - paidCount} a pagar
              </span>
            </div>
          </div>

          {/* Subheader Toolbar */}
          <div className="flex items-center justify-between gap-2 py-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Organizado por Data ({sortedTransactions.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Order Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
                title="Alterar ordenação por data"
              >
                <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                <span>{sortOrder === 'asc' ? 'Mais Antigos Primeiro' : 'Mais Recentes Primeiro'}</span>
              </button>

              {/* Add another expense shortcut */}
              <button
                type="button"
                onClick={() => onAddAnother(groupName, transactions[0]?.cat)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer border-none"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar Outro</span>
              </button>
            </div>
          </div>

          {/* Scrollable list of individual transactions organized by date */}
          <div className="flex-1 overflow-y-auto space-y-2.5 my-1 pr-1 custom-scrollbar min-h-[140px]">
            {sortedTransactions.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border border-dashed text-xs ${
                isLight ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-white/5 text-slate-500'
              }`}>
                Nenhum lançamento restante para esta descrição.
              </div>
            ) : (
              sortedTransactions.map((tx, idx) => {
                const remDue = tx.amount - (tx.paid_amount || 0);
                const isPaid = remDue <= 0.009;
                const isPartial = (tx.paid_amount || 0) > 0 && !isPaid;

                return (
                  <motion.div
                    key={tx.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: idx * 0.03 }}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isLight
                        ? isPaid 
                          ? 'bg-emerald-50/30 border-emerald-200/60'
                          : 'bg-slate-50/70 border-slate-200 hover:border-indigo-300'
                        : isPaid
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-slate-950/40 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left side: Date & Details */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isLight
                              ? 'bg-white border-slate-200 text-slate-700 shadow-xs'
                              : 'bg-slate-900 border-white/10 text-slate-300'
                        }`}>
                          {parseDueDay(tx.due)}º
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                              isLight ? 'bg-white border border-slate-200 text-slate-800' : 'bg-slate-900 border border-white/10 text-slate-200'
                            }`}>
                              📅 {formatDisplayDueDate(tx.due)}
                            </span>

                            {tx.establishment && (
                              <span className="text-[10.5px] font-medium text-indigo-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate max-w-[140px]">{tx.establishment}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10.5px] pt-0.5">
                            <span className={isPaid ? 'text-emerald-500 font-bold' : isPartial ? 'text-amber-500 font-bold' : isLight ? 'text-slate-500' : 'text-slate-400'}>
                              {isPaid 
                                ? tx.paid_at ? `Liquidado dia ${tx.paid_at}` : 'Pago integralmente'
                                : isPartial
                                  ? `Parcial: ${formatCurrency(tx.paid_amount || 0)} pago de ${formatCurrency(tx.amount)}`
                                  : 'Aguardando pagamento'
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Amount & Action buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-slate-200 dark:border-white/5">
                        <span className={`font-mono text-sm sm:text-base font-black ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {formatCurrency(tx.amount)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Payment Button */}
                          <button
                            type="button"
                            onClick={() => onPay(tx.id)}
                            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wider uppercase cursor-pointer transition-all border ${
                              isPaid
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/25'
                                : isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                            }`}
                          >
                            {isPaid ? 'PAGO' : 'PAGAR'}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => onEdit(tx)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-white/10'
                            }`}
                            title="Editar este lançamento"
                          >
                            <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => onDelete(tx.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer transition-colors"
                            title="Excluir este lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-dashed border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
            <span className={`text-[11px] font-medium truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Total acumulado de <strong>{formatCurrency(totalAmount)}</strong> em <strong>{transactions.length}</strong> {transactions.length === 1 ? 'gasto' : 'gastos'}
            </span>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
              }`}
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
