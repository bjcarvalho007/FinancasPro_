import { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { X, Check, Landmark, Calendar, DollarSign, Layers, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    amount: number;
    type: 'fixos' | 'variaveis' | 'parcelas';
    cat: string;
    due: string;
  }) => void;
  initialData?: Transaction | null;
  categoriesList: Category[];
  onCreateCategory: (icon: string, label: string) => void;
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categoriesList,
  onCreateCategory
}: TransactionFormModalProps) {
  const [name, setName] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [type, setType] = useState<'fixos' | 'variaveis' | 'parcelas'>('fixos');
  const [cat, setCat] = useState<string>('moradia');
  const [due, setDue] = useState<string>('');
  
  // Custom interactive sub-state for creating categories on the flow
  const [showCatDropdown, setShowCatDropdown] = useState<boolean>(false);
  const [showAddCustomCat, setShowAddCustomCat] = useState<boolean>(false);
  const [customCatIcon, setCustomCatIcon] = useState<string>('🏷️');
  const [customCatName, setCustomCatName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setAmountStr(formatMoney(initialData.amount));
        setType(initialData.type);
        setCat(initialData.cat);
        setDue(initialData.due || '');
      } else {
        setName('');
        setAmountStr('');
        setType('fixos');
        setCat('moradia');
        setDue('Dia 10');
      }
      setShowCatDropdown(false);
      setShowAddCustomCat(false);
      setCustomCatName('');
    }
  }, [isOpen, initialData]);

  const formatMoney = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleAmountInput = (val: string) => {
    let numeric = val.replace(/\D/g, "");
    if (!numeric) {
      setAmountStr("");
      return;
    }
    const valFloat = parseFloat(numeric) / 100;
    setAmountStr(formatMoney(valFloat));
  };

  const parseMoney = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Por favor, preencha a descrição do lançamento.");
      return;
    }
    const amountVal = parseMoney(amountStr);
    if (amountVal <= 0) {
      alert("Por favor, digite um valor maior que zero.");
      return;
    }

    onSave({
      name,
      amount: amountVal,
      type,
      cat,
      due: due || 'Dia 10'
    });
    onClose();
  };

  const handleCreateCategory = () => {
    if (!customCatName.trim()) return;
    const key = customCatName.toLowerCase().replace(/\s+/g, '-');
    onCreateCategory(customCatIcon, customCatName);
    setCat(key);
    setCustomCatName('');
    setShowAddCustomCat(false);
    setShowCatDropdown(false);
  };

  const activeCategoryObject = categoriesList.find(c => c.value === cat) || categoriesList[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="bg-[#0f1524] border border-white/10 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-visible max-h-[90vh] overflow-y-auto z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-extrabold text-lg text-white">
              {initialData ? '✏️ Editar Lançamento' : '💸 Novo Lançamento SaaS'}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Description input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" /> Descrição do Gastos / Receita
              </label>
              <input
                id="modal-desc-input"
                type="text"
                placeholder="Exemplo: Aluguel do Escritório, Freelance Dev"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-sm px-4 py-3.5 rounded-xl transition-all font-medium"
              />
            </div>

            {/* Transaction type selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Tipo de Fluxo Financeiro
              </label>
              <select
                id="modal-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 focus:outline-none text-slate-200 text-sm px-4 py-3.5 rounded-xl transition-all cursor-pointer font-semibold"
              >
                <option value="fixos">📌 Gasto Fixo (Se repete mensalmente)</option>
                <option value="variaveis">📊 Gasto Variável (Apenas neste mês)</option>
                <option value="parcelas">💳 Parcelamento Fatura (Débito parcelado)</option>
              </select>
            </div>

            {/* Custom Interactive Category Selector */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                📁 Categoria
              </label>
              
              <div
                id="modal-cat-trigger"
                onClick={() => setShowCatDropdown(!showCatDropdown)}
                className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 text-slate-200 text-sm px-4 py-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
              >
                <span className="font-semibold flex items-center gap-2">
                  <span className="text-lg">{activeCategoryObject?.icon || '📦'}</span> 
                  {activeCategoryObject?.label || 'Outros'}
                </span>
                <span className="text-xs text-slate-500 select-none">▼</span>
              </div>

              {/* Expandable Category Selection Grid */}
              {showCatDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 right-0 mt-2 p-4 rounded-2xl bg-slate-900/95 border border-white/10 shadow-xl z-20"
                >
                  <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {categoriesList.map((item) => (
                      <div
                        key={item.value}
                        onClick={() => {
                          setCat(item.value);
                          setShowCatDropdown(false);
                        }}
                        className={`p-2 rounded-xl text-center cursor-pointer transition-colors border ${
                          cat === item.value 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                            : 'bg-slate-950/40 border-transparent text-slate-300 hover:bg-slate-950/80'
                        }`}
                      >
                        <span className="block text-lg mb-1">{item.icon}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider truncate block">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Button to show Create Custom Category form */}
                  {!showAddCustomCat ? (
                    <button
                      onClick={() => setShowAddCustomCat(true)}
                      className="w-full mt-3 p-2 border border-dashed border-white/10 hover:border-indigo-500 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-400" /> Criar Categoria Personalizada
                    </button>
                  ) : (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
                      <div className="flex gap-2">
                        {/* Simple emoji selector */}
                        <select
                          value={customCatIcon}
                          onChange={(e) => setCustomCatIcon(e.target.value)}
                          className="bg-slate-900 border border-white/10 text-lg p-1.5 rounded-lg text-center"
                        >
                          <option>🏷️</option><option>💰</option><option>🏠</option><option>🎮</option>
                          <option>🎁</option><option>🚀</option><option>🥑</option><option>💈</option>
                          <option>🛠️</option><option>💡</option><option>🍔</option><option>💊</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Nome da categoria"
                          value={customCatName}
                          onChange={(e) => setCustomCatName(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/10 text-xs px-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowAddCustomCat(false)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateCategory}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 font-display"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Split row: Amount and Due date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor (R$)
                </label>
                <input
                  id="modal-amount-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={amountStr}
                  onChange={(e) => handleAmountInput(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-sm px-4 py-3.5 rounded-xl transition-all font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Dia Vencimento
                </label>
                <input
                  id="modal-due-input"
                  type="text"
                  placeholder="Ex: Dia 10 ou 10/05"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-sm px-4 py-3.5 rounded-xl transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              id="modal-save-btn"
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 active:translate-y-0.5 transition-all text-center cursor-pointer"
            >
              Gravar Lançamento
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-center cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
