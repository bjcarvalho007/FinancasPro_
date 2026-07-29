import { useState, useEffect, useRef, MouseEvent, TouchEvent, ChangeEvent } from 'react';
import { Transaction, Category } from '../types';
import { useLanguage } from '../utils/i18n';
import { X, Check, Landmark, Calendar, DollarSign, Layers, Plus, AlertCircle, Sparkles, Trash2, ArrowLeft, Search, Camera, Image, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const EMOJI_OPTIONS = [
  '⚽', '🏀', '🎾', '🏐', '🏋️', '🥊', '🚴', '🏊', '🛹', '🏎️', '⛳', '🧘', '🏆',
  '🍔', '🍕', '🍣', '🍦', '☕', '🍺', '🍿', '🍖', '🥑', '🍩', '🍹', '🥖', '🥩',
  '🚗', '⛽', '🚌', '✈️', '🛵', '🔧', '🚕', '🚲', '⛵', '🚂', '🅿️',
  '🎮', '🎬', '🎵', '🎧', '🎟️', '📷', '🎨', '🎲', '🎯', '📺', '🎪',
  '🏠', '🔌', '📶', '🛋️', '🧹', '💧', '🪴', '🔑', '🛠️', '💡', '⚡', '🔥',
  '🏥', '💊', '🩺', '💇', '💈', '🧴', '💄', '🧼', '🦷', '👓', '💅', '✨',
  '🎓', '📚', '🖊️', '💻', '💼', '📊', '📝', '🔬', '🏫',
  '🛍️', '👕', '👠', '💍', '🏷️', '⌚', '🎒', '💰', '💳', '📈', '🏦', '💎',
  '🎁', '🐾', '👶', '🚀', '🎈', '🎂', '🐶', '🐱', '🌲', '🔮', '🌟', '📱'
];

const PRESET_SUGGESTIONS = [
  { icon: '⚽', label: 'Futebol / Pelada' },
  { icon: '🏋️', label: 'Academia / Fitness' },
  { icon: '💈', label: 'Barbeiro / Salão' },
  { icon: '🎮', label: 'Jogos / Steam' },
  { icon: '🐾', label: 'Pet Shop / Vet' },
  { icon: '🍿', label: 'Cinema / Lazer' },
  { icon: '🚗', label: 'Uber / Táxi' },
  { icon: '✈️', label: 'Viagem / Férias' },
  { icon: '💊', label: 'Farmácia' },
  { icon: '🍕', label: 'Restaurante / Pizza' },
  { icon: '🎓', label: 'Cursos / Idiomas' },
  { icon: '🧼', label: 'Limpeza & Casa' },
];

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    amount: number;
    type: 'fixos' | 'variaveis' | 'parcelas';
    cat: string;
    due: string;
    total_parcelado?: number;
    establishment?: string;
    installmentsCount?: number;
  }) => void;
  initialData?: Transaction | null;
  categoriesList: Category[];
  onCreateCategory: (icon: string, label: string) => void;
  onDeleteCategory?: (category: Category) => void;
  defaultType?: 'fixos' | 'variaveis' | 'parcelas';
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categoriesList,
  onCreateCategory,
  onDeleteCategory,
  defaultType = 'fixos'
}: TransactionFormModalProps) {
  const { t, formatCurrency } = useLanguage();
  const [name, setName] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [type, setType] = useState<'fixos' | 'variaveis' | 'parcelas'>('fixos');
  const [cat, setCat] = useState<string>('moradia');
  const [due, setDue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<string>('');
  const [installmentsCount, setInstallmentsCount] = useState<string>('');
  const [installmentAmountStr, setInstallmentAmountStr] = useState<string>('');
  
  // AI Receipt Camera Scanner state
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccessNote, setScanSuccessNote] = useState<string | null>(null);

  // Custom interactive sub-state for creating categories on the flow
  const [showCatDropdown, setShowCatDropdown] = useState<boolean>(false);
  const [showAddCustomCat, setShowAddCustomCat] = useState<boolean>(false);
  const [customCatIcon, setCustomCatIcon] = useState<string>('🏷️');
  const [customCatName, setCustomCatName] = useState<string>('');
  const [catSearch, setCatSearch] = useState<string>('');

  // Long-press deletion state and drag/scroll detection
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const pressStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);

  const handlePressStart = (item: Category, e: MouseEvent | TouchEvent) => {
    isLongPressRef.current = false;
    hasDraggedRef.current = false;

    const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY;
    if (clientX !== undefined && clientY !== undefined) {
      pressStartPosRef.current = { x: clientX, y: clientY };
    }

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (!hasDraggedRef.current) {
        isLongPressRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(60); } catch (err) {}
        }
        setCategoryToDelete(item);
      }
    }, 500);
  };

  const handlePressMove = (e: TouchEvent | MouseEvent) => {
    if (!pressStartPosRef.current) return;
    const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY;

    if (clientX !== undefined && clientY !== undefined) {
      const dx = Math.abs(clientX - pressStartPosRef.current.x);
      const dy = Math.abs(clientY - pressStartPosRef.current.y);

      // Threshold of 8px movement indicates dragging/scrolling
      if (dx > 8 || dy > 8) {
        hasDraggedRef.current = true;
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }
  };

  const handlePressEnd = (item: Category) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!hasDraggedRef.current && !isLongPressRef.current) {
      setCat(item.value);
      setShowCatDropdown(false);
      setCatSearch('');
      setShowAddCustomCat(false);
    }
    pressStartPosRef.current = null;
    setTimeout(() => {
      isLongPressRef.current = false;
      hasDraggedRef.current = false;
    }, 120);
  };

  const handlePressCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    hasDraggedRef.current = true;
    pressStartPosRef.current = null;
  };

  const compressImageFile = (file: File, maxDimension = 1200, quality = 0.8): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem no navegador.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = 'image/jpeg';
        const base64 = canvas.toDataURL(mimeType, quality);
        resolve({ base64, mimeType });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Falha ao carregar a imagem capturada.'));
      };
      img.src = url;
    });
  };

  const handleReceiptScan = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);
    setScanSuccessNote(null);

    try {
      let base64 = '';
      let mimeType = file.type || 'image/jpeg';

      try {
        const compressed = await compressImageFile(file, 1200, 0.8);
        base64 = compressed.base64;
        mimeType = compressed.mimeType;
      } catch (e) {
        // Fallback: Read file directly if canvas compression fails
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch('/api/gemini/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mimeType
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao processar a imagem do comprovante.');
      }

      const data = json.data || {};

      // Smart extraction with fallback: priority on Establishment/Name and Amount
      const extractedName = data.name || data.establishment || 'Gasto com Comprovante';
      setName(extractedName);

      if (data.establishment || data.name) {
        setEstablishment(data.establishment || data.name || '');
      }

      if (data.amount !== undefined && data.amount !== null && !isNaN(Number(data.amount))) {
        setAmountStr(formatMoney(Number(data.amount)));
      }

      // Type fallback
      if (data.type && ['fixos', 'variaveis', 'parcelas'].includes(data.type)) {
        setType(data.type as any);
      } else {
        setType('variaveis');
      }

      // Date fallback
      if (data.due) {
        setDue(data.due);
      }

      // Category matching or default to 'outros'
      if (data.cat) {
        const matched = categoriesList.find(c => 
          c.value === data.cat || 
          c.value.toLowerCase() === data.cat.toLowerCase() ||
          c.label.toLowerCase().includes(data.cat.toLowerCase())
        );
        if (matched) {
          setCat(matched.value);
        } else {
          setCat('outros');
        }
      } else {
        setCat('outros');
      }

      setScanSuccessNote(data.summary || `Preenchido: R$ ${data.amount || ''} em ${extractedName}`);
    } catch (err: any) {
      console.error('Falha ao escanear comprovante:', err);
      const errMsg = err.message || '';
      if (errMsg.includes('GEMINI_API_KEY')) {
        setError(errMsg);
      } else {
        setError('Erro ao ler a foto do comprovante: ' + (errMsg || 'Tente tirar outra foto mais nítida.'));
      }
    } finally {
      setIsScanning(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const justOpenedRef = useRef<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setScanSuccessNote(null);
      setIsScanning(false);
      justOpenedRef.current = true;
      if (initialData) {
        setName(initialData.name);
        setAmountStr(formatMoney(initialData.type === 'parcelas' ? (initialData.total_parcelado || initialData.amount) : initialData.amount));
        setType(initialData.type);
        setCat(initialData.cat);
        setDue(initialData.due || '');
        setEstablishment(initialData.establishment || '');
        setInstallmentsCount(initialData.installmentsCount ? String(initialData.installmentsCount) : '');
        setInstallmentAmountStr(initialData.type === 'parcelas' ? formatMoney(initialData.amount || 0) : '');
      } else {
        setName('');
        setAmountStr('');
        setType(defaultType);
        setCat('moradia');
        setDue('');
        setEstablishment('');
        setInstallmentsCount('');
        setInstallmentAmountStr('');
      }
      setShowCatDropdown(false);
      setShowAddCustomCat(false);
      setCustomCatName('');
    }
  }, [isOpen, initialData, defaultType]);

  // Dynamically calculate and pre-fill monthly installment if total or count changes (if not already custom modified by user)
  useEffect(() => {
    if (type === 'parcelas' && amountStr) {
      if (justOpenedRef.current && initialData) {
        // If we just opened the modal to edit an existing item, do NOT recalculate and overwrite the custom loaded value
        justOpenedRef.current = false;
        return;
      }
      justOpenedRef.current = false;

      const totalVal = parseMoney(amountStr);
      const count = parseInt(installmentsCount, 10);
      if (totalVal > 0) {
        if (count > 0) {
          const calculated = totalVal / count;
          setInstallmentAmountStr(formatMoney(calculated));
        } else {
          setInstallmentAmountStr(formatMoney(totalVal));
        }
      }
    }
  }, [amountStr, installmentsCount, type]);

  const formatMoney = (val: number): string => {
    return formatCurrency(val);
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
    setError(null);
    if (!name.trim()) {
      setError("Por favor, preencha a descrição do lançamento de forma clara.");
      return;
    }
    const amountVal = parseMoney(amountStr);
    if (amountVal <= 0) {
      setError("Por favor, digite um valor maior de lançamento que zero.");
      return;
    }

    const totalVal = type === 'parcelas' ? amountVal : undefined;
    const installmentsNum = type === 'parcelas' && installmentsCount ? parseInt(installmentsCount, 10) : undefined;

    if (type === 'parcelas' && installmentsNum !== undefined && (isNaN(installmentsNum) || installmentsNum <= 0)) {
      setError("Por favor, digite uma quantidade de parcelas válida (número maior que zero).");
      return;
    }

    const finalInstallmentAmt = type === 'parcelas' ? parseMoney(installmentAmountStr) : undefined;
    const computedAmt = type === 'parcelas'
      ? (finalInstallmentAmt && finalInstallmentAmt > 0 ? finalInstallmentAmt : (installmentsNum ? amountVal / installmentsNum : amountVal))
      : amountVal;

    onSave({
      name,
      amount: computedAmt,
      type,
      cat,
      due: due.trim() || '',
      total_parcelado: totalVal || undefined,
      establishment: establishment.trim() || undefined,
      installmentsCount: installmentsNum || undefined
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
  const filteredCategories = categoriesList.filter(item =>
    !catSearch.trim() || item.label.toLowerCase().includes(catSearch.toLowerCase().trim())
  );

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
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-extrabold text-lg text-white">
              {initialData ? `✏️ ${t('editarTransacao', 'Editar Lançamento')}` : `💸 ${t('novaTransacao', 'Novo Lançamento')}`}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick AI Camera / Gallery Receipt Scanner */}
          {!initialData && (
            <div className="mb-5 space-y-2">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleReceiptScan}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReceiptScan}
              />

              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1 text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" /> Leitura Automática por IA (Gemini)
                </span>
                <span className="text-[9px] text-slate-500 font-medium">Preenche sem salvar foto</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Option 1: Direct Camera Snap */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isScanning}
                  className="relative group overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 transition-all shadow-md shadow-indigo-500/10 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <div className="bg-[#0b0f19] hover:bg-[#121827] p-3 rounded-[15px] flex items-center gap-2.5 transition-colors h-full">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                      {isScanning ? (
                        <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-400" />
                      ) : (
                        <Camera className="w-4.5 h-4.5 text-indigo-400" />
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <span className="text-xs font-extrabold text-white block truncate">
                        {isScanning ? "Lendo..." : "📷 Tirar Foto"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Abrir câmera
                      </span>
                    </div>
                  </div>
                </button>

                {/* Option 2: Gallery Picker */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isScanning}
                  className="relative group overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 transition-all shadow-md shadow-purple-500/10 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <div className="bg-[#0b0f19] hover:bg-[#121827] p-3 rounded-[15px] flex items-center gap-2.5 transition-colors h-full">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                      {isScanning ? (
                        <Loader2 className="w-4.5 h-4.5 animate-spin text-purple-400" />
                      ) : (
                        <Image className="w-4.5 h-4.5 text-purple-400" />
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <span className="text-xs font-extrabold text-white block truncate">
                        {isScanning ? "Lendo..." : "🖼️ Galeria"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Escolher da galeria
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {scanSuccessNote && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-start justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-250 mb-0.5">✨ Dados extraídos com sucesso!</span>
                  <span className="opacity-90">{scanSuccessNote}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScanSuccessNote(null)}
                className="text-emerald-400/60 hover:text-emerald-300 text-xs font-bold p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-250 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{error}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Description input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" /> {t('descricao', 'Descrição do Gastos / Receita')}
              </label>
              <input
                id="modal-desc-input"
                type="text"
                placeholder={t('placeholderDesc', 'Ex: Aluguel, Supermercado, Freelance')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-sm px-4 py-3.5 rounded-xl transition-all font-medium"
              />
            </div>

            {/* Transaction type selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> {t('tipoConta', 'Tipo de Fluxo Financeiro')}
              </label>
              <select
                id="modal-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 focus:outline-none text-slate-200 text-sm px-4 py-3.5 rounded-xl transition-all cursor-pointer font-semibold"
              >
                <option value="fixos">📌 {t('contaFixa', 'Gasto Fixo (Se repete mensalmente)')}</option>
                <option value="variaveis">📊 {t('gastoVariavelTipo', 'Gasto Variável (Apenas neste mês)')}</option>
                <option value="parcelas">💳 {t('parceladoTipo', 'Parcelamento Fatura (Débito parcelado)')}</option>
              </select>
            </div>

            {/* Optional Establishment Info */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                🏢 {t('estabelecimento', 'Estabelecimento / Beneficiário (Opcional)')}
              </label>
              <input
                id="modal-establishment-input"
                type="text"
                placeholder="Ex: Amazon, Mercado Livre, etc."
                value={establishment}
                onChange={(e) => setEstablishment(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-sm px-4 py-3.5 rounded-xl transition-all font-medium"
              />
            </div>

            {/* Quantity of Installments & Monthly Installment Amount (only for parcelas) */}
            {type === 'parcelas' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      🔢 {t('numParcelas', 'Quantidade de Parcelas')}
                    </label>
                    <input
                      id="modal-installments-count-input"
                      type="number"
                      min="1"
                      placeholder="Ex: 5, 10, 12, etc."
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-sm px-4 py-3.5 rounded-xl transition-all font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-bold">
                      💡 {t('valorParcelaDesteMes', 'Valor da Parcela deste Mês')}
                    </label>
                    <input
                      id="modal-installment-amount-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={installmentAmountStr}
                      onChange={(e) => {
                        let numeric = e.target.value.replace(/\D/g, "");
                        if (!numeric) {
                          setInstallmentAmountStr("");
                          return;
                        }
                        const valFloat = parseFloat(numeric) / 100;
                        setInstallmentAmountStr(formatMoney(valFloat));
                      }}
                      className="w-full bg-slate-950/50 border border-yellow-500/20 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-yellow-400 text-sm px-4 py-3.5 rounded-xl transition-all font-mono font-bold"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">
                      {t('sistemaUsaraValorSobra', 'O sistema usará este valor para calcular a sobra do mês.')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Custom Interactive Category Selector Trigger */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">📁 {t('categoria', 'Categoria')}</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Clique p/ abrir tela cheia</span>
              </label>
              
              <div
                id="modal-cat-trigger"
                onClick={() => setShowCatDropdown(true)}
                className="w-full bg-slate-950/50 border border-indigo-500/30 hover:border-indigo-400 text-slate-200 text-sm px-4 py-3 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-all shadow-inner group"
              >
                <span className="font-semibold flex items-center gap-3">
                  <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-white/10 shadow-sm">{activeCategoryObject?.icon || '📦'}</span> 
                  <div>
                    <span className="text-white font-extrabold block text-sm">{activeCategoryObject?.label || 'Outros'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Toque para selecionar ou ver todas em tela cheia</span>
                  </div>
                </span>
                <div className="flex items-center gap-1.5 bg-indigo-600/20 group-hover:bg-indigo-600 px-3 py-1.5 rounded-xl text-indigo-300 group-hover:text-white text-xs font-bold transition-all border border-indigo-500/30">
                  <span>Ver Categorias</span>
                  <span className="text-xs">→</span>
                </div>
              </div>
            </div>

            {/* Split row: Amount and Due date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> {type === 'parcelas' ? t('valorTotalParcelado', 'Valor Total Parcelado') : t('valor', 'Valor')}
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
                  <Calendar className="w-3.5 h-3.5" /> {t('vencimento', 'Data de Vencimento')}
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
              {t('salvar', 'Salvar')}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-center cursor-pointer"
            >
              {t('cancelar', 'Cancelar')}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Full Screen Category Selection View Overlay */}
      {showCatDropdown && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] bg-[#0b0f19] flex flex-col p-4 sm:p-6 text-white overflow-hidden select-none"
        >
          {/* Header with prominent Voltar button */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-3 gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowCatDropdown(false);
                setCatSearch('');
                setShowAddCustomCat(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-white font-bold text-xs shadow-lg transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:-translate-x-1 transition-transform" />
              <span>Voltar ao Formulário</span>
            </button>

            <div className="text-right">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center justify-end gap-2">
                <span>📁 Central de Categorias</span>
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Escolha uma categoria para sua movimentação ou crie uma nova
              </p>
            </div>
          </div>

          {/* Main Container */}
          <div className="flex-1 min-h-0 flex flex-col max-w-5xl w-full mx-auto space-y-4">
            {/* Search Input & Action Button */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Pesquisar categoria por nome (ex: futebol, mercado, academia...)"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 text-xs pl-10 pr-4 py-3 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                />
                {catSearch && (
                  <button
                    type="button"
                    onClick={() => setCatSearch('')}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAddCustomCat(!showAddCustomCat)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                  showAddCustomCat
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                    : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{showAddCustomCat ? 'Fechar Criador' : 'Nova Categoria'}</span>
              </button>
            </div>

            {/* Custom Category Creator inside full view */}
            {showAddCustomCat && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-3xl bg-slate-900/95 border border-indigo-500/40 space-y-3.5 shadow-2xl shrink-0 max-h-[340px] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> {t('criarCategoriaPersonalizada', 'Nova Categoria Personalizada')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomCat(false)}
                    className="text-slate-500 hover:text-slate-300 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Idea Chips */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    💡 Sugestões Rápidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                    {PRESET_SUGGESTIONS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomCatIcon(preset.icon);
                          setCustomCatName(preset.label);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-indigo-600/30 hover:border-indigo-500 border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon selector grid */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    🎨 Galeria de Ícones:
                  </span>
                  <div className="grid grid-cols-7 sm:grid-cols-12 gap-1.5 max-h-[110px] overflow-y-auto p-2 rounded-2xl bg-slate-950 border border-white/10 mb-2.5">
                    {EMOJI_OPTIONS.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomCatIcon(emoji)}
                        className={`h-8 w-8 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                          customCatIcon === emoji
                            ? 'bg-indigo-600 text-white scale-110 shadow-md ring-2 ring-indigo-400'
                            : 'hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Selected Icon Preview & Name Input */}
                  <div className="flex gap-2.5 items-center">
                    <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-indigo-500/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {customCatIcon}
                    </div>
                    <input
                      type="text"
                      placeholder={t('nomeCategoria', 'Nome da categoria (ex: Futebol, Academia...)')}
                      value={customCatName}
                      onChange={(e) => setCustomCatName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-white/10 text-xs px-3.5 py-3 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomCat(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {t('cancelar', 'Cancelar')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {t('salvar', 'Salvar Categoria')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Categories Grid Area (Full Height Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between mb-3 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-1">
                <span>Todas as Categorias ({filteredCategories.length})</span>
                <span>💡 Pressione & segure p/ apagar</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pb-8">
                {/* Quick Create Card */}
                <div
                  onClick={() => setShowAddCustomCat(true)}
                  className="p-4 rounded-2xl bg-slate-900/40 border-2 border-dashed border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-600/10 text-indigo-300 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[110px] group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                    Criar Nova
                  </span>
                </div>

                {filteredCategories.map((item) => {
                  const isSelected = cat === item.value;
                  return (
                    <div
                      key={item.value}
                      onMouseDown={(e) => handlePressStart(item, e)}
                      onMouseMove={(e) => handlePressMove(e)}
                      onMouseUp={() => handlePressEnd(item)}
                      onMouseLeave={handlePressCancel}
                      onTouchStart={(e) => handlePressStart(item, e)}
                      onTouchMove={(e) => handlePressMove(e)}
                      onTouchEnd={() => handlePressEnd(item)}
                      className={`group relative p-4 rounded-2xl text-center cursor-pointer transition-all border select-none min-h-[110px] flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600/30 border-2 border-indigo-400 text-white shadow-xl shadow-indigo-600/25 scale-[1.02]'
                          : 'bg-slate-900/60 border-white/10 text-slate-200 hover:bg-slate-800/80 hover:border-white/20'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 left-2 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3" /> Atual
                        </span>
                      )}

                      {onDeleteCategory && (
                        <button
                          type="button"
                          title="Excluir Categoria"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handlePressCancel();
                            setCategoryToDelete(item);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-950/80 hover:bg-rose-600 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer border border-white/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <span className="text-3xl sm:text-4xl mb-2 transition-transform group-hover:scale-110 drop-shadow-md">
                        {item.icon}
                      </span>
                      <span className="text-xs uppercase font-extrabold tracking-wider truncate max-w-full px-1">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal for Category Deletion */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0f1524] border border-white/10 p-6 rounded-3xl max-w-xs w-full shadow-2xl space-y-4 text-center relative z-[131]"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
              {categoryToDelete.icon || '🗑️'}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Excluir Categoria?
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Tem certeza que deseja apagar a categoria <strong className="text-white">"{categoryToDelete.label}"</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCategory) {
                    onDeleteCategory(categoryToDelete);
                  }
                  if (cat === categoryToDelete.value) {
                    setCat('outros');
                  }
                  setCategoryToDelete(null);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Apagar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
