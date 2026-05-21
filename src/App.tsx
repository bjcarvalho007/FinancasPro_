import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { Transaction, Category, Goal, Setting, AppNotification } from './types';
import AuthScreen from './components/AuthScreen';
import TransactionFormModal from './components/TransactionFormModal';
import DashboardAnalytics from './components/DashboardAnalytics';
import GoalsPanel from './components/GoalsPanel';
import SettingsPanel from './components/SettingsPanel';
import { 
  TrendingUp, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Target, 
  LogOut, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Bell, 
  FolderLock,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default built-in categories
const defaultCategories = [
  { icon: '🏠', label: 'Moradia', value: 'moradia' },
  { icon: '🛒', label: 'Mercado', value: 'mercado' },
  { icon: '🚗', label: 'Transporte', value: 'transporte' },
  { icon: '🏥', label: 'Saúde', value: 'saude' },
  { icon: '📚', label: 'Educação', value: 'educacao' },
  { icon: '✨', label: 'Estética', value: 'estetica' },
  { icon: '🎮', label: 'Lazer', value: 'lazer' },
  { icon: '🍽️', label: 'Comida', value: 'restaurante' },
  { icon: '💳', label: 'Stream', value: 'assinaturas' },
  { icon: '🌐', label: 'Internet', value: 'comunicacao' },
  { icon: '🐾', label: 'Pets', value: 'pet' },
  { icon: '👕', label: 'Roupas', value: 'vestuario' },
  { icon: '🛋️', label: 'Casa', value: 'casa' },
  { icon: '📈', label: 'Invest.', value: 'investimento' },
  { icon: '📄', label: 'Taxas', value: 'imposto' },
  { icon: '💳', label: 'Cartão', value: 'cartao font-display' },
  { icon: '📦', label: 'Outros', value: 'outros' }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  
  // App Data State loaded directly from Firestore
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isFirebaseOffline, setIsFirebaseOffline] = useState<boolean>(false);
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL');

  // Ledger timeline Navigation state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const currentMonthKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}`;

  // Tabs context
  const [activeTab, setActiveTab] = useState<'fixos' | 'variaveis' | 'parcelas' | 'dashboard' | 'goals' | 'settings'>('fixos');
  
  // Custom Toasts and Alerts
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [floatingAlert, setFloatingAlert] = useState<{ id: string; title: string; desc: string; type: string } | null>(null);

  // Modal display parameters
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isPayOpen, setIsPayOpen] = useState<boolean>(false);
  const [payTransactionId, setPayTransactionId] = useState<string | null>(null);
  const [confirmValueStr, setConfirmValueStr] = useState<string>('');

  // Income parameters custom configuration trigger modal
  const [isIncomeOpen, setIsIncomeOpen] = useState<boolean>(false);
  const [tempIncomeStr, setTempIncomeStr] = useState<string>('');
  const [tempBalanceStr, setTempBalanceStr] = useState<string>('');
  const [tempExtraStr, setTempExtraStr] = useState<string>('');

  // Pull to refresh support variables
  const [startY, setStartY] = useState<number>(0);
  const [pullProgress, setPullProgress] = useState<number>(0);

  const monthsPortuguese = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Validate Firestore Access on Boot as mandated by Skill rules
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('the client is offline') || error.message.includes('Failed to get document')) {
            console.warn("Firebase connection checked: Sandbox/database offline state detected. Showing helpful guidelines.");
            setIsFirebaseOffline(true);
          }
        }
      }
    }
    testConnection();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });
    return unsubscribe;
  }, []);

  // Fire up Firestore Snapshot streams when Authenticated
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setGoals([]);
      setSettings(null);
      setNotifications([]);
      return;
    }

    const uid = user.uid;

    // Stream 1: Transactions owner-filtered query
    const transactionsPath = 'transactions';
    const qTransactions = query(collection(db, transactionsPath), where('userId', '==', uid));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Transaction);
      });
      setTransactions(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, transactionsPath);
    });

    // Stream 2: Custom Categories
    const categoriesPath = 'categories';
    const qCategories = query(collection(db, categoriesPath), where('userId', '==', uid));
    const unsubCategories = onSnapshot(qCategories, (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Category);
      });
      setCategories(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, categoriesPath);
    });

    // Stream 3: Goals
    const goalsPath = 'goals';
    const qGoals = query(collection(db, goalsPath), where('userId', '==', uid));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      const items: Goal[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Goal);
      });
      setGoals(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, goalsPath);
    });

    // Stream 4: Settings
    const settingsPath = `settings/${uid}`;
    const unsubSettings = onSnapshot(doc(db, 'settings', uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Setting;
        setSettings(data);
        if (data.theme) setTheme(data.theme);
        if (data.currency) setCurrency(data.currency);
      } else {
        // Bootstrap standard empty settings if none present
        const initData: Setting = {
          userId: uid,
          currency: 'BRL',
          theme: 'dark',
          income: 0,
          balance: 0,
          extras: {}
        };
        setDoc(doc(db, 'settings', uid), initData).catch(e => {
          handleFirestoreError(e, OperationType.CREATE, `settings/${uid}`);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, settingsPath);
    });

    // Stream 5: Notifications
    const notificationsPath = 'notifications';
    const qNotifications = query(collection(db, notificationsPath), where('userId', '==', uid));
    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      const items: AppNotification[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as AppNotification);
      });
      setNotifications(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, notificationsPath);
    });

    return () => {
      unsubTransactions();
      unsubCategories();
      unsubGoals();
      unsubSettings();
      unsubNotifications();
    };
  }, [user]);

  // Alert triggers: Monitor upcoming bills due on mounting/ledger updates
  useEffect(() => {
    if (transactions.length === 0) {
      setFloatingAlert(null);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiring: Transaction[] = [];

    // Check items for current month and filter unpaid ones matching today or tomorrow
    const filteredThisMonth = transactions.filter(t => t.monthKey === currentMonthKey);
    filteredThisMonth.forEach(item => {
      const remainingDeficit = item.amount - (item.paid_amount || 0);
      if (remainingDeficit > 0 && item.due) {
        const dayMatch = item.due.match(/\d+/);
        if (dayMatch) {
          const dueDay = parseInt(dayMatch[0]);
          const dueDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), dueDay);
          dueDate.setHours(0, 0, 0, 0);

          const diffInMs = dueDate.getTime() - today.getTime();
          const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
          
          if (diffInDays >= 0 && diffInDays <= 1) {
            expiring.push(item);
          }
        }
      }
    });

    if (expiring.length > 0) {
      const targetBill = expiring[0];
      setFloatingAlert({
        id: targetBill.id,
        title: '⚠️ Contas a Vencer',
        desc: `"${targetBill.name}" (${formatCurrency(targetBill.amount)}) vence nos próximos dias!`,
        type: 'vencimento'
      });
    } else {
      setFloatingAlert(null);
    }
  }, [transactions, currentMonthKey]);

  // Toast helper triggers
  const triggerToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const formatCurrency = (val: number): string => {
    const symb = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    const c = currency === 'USD' ? 'USD' : currency === 'EUR' ? 'EUR' : 'BRL';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: c }).format(val);
  };

  const handleMaskMoney = (val: string): string => {
    let numeric = val.replace(/\D/g, "");
    if (!numeric) return "";
    return formatCurrency(parseFloat(numeric) / 100);
  };

  const handleParseMoney = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  // Switch ledger timeline month helper
  const handleMonthTurn = (direction: number) => {
    const nextDate = new Date(calendarDate);
    nextDate.setMonth(calendarDate.getMonth() + direction);
    setCalendarDate(nextDate);
  };

  // Transaction Actions Bound to Firestore
  const handleSaveTransaction = async (data: {
    name: string;
    amount: number;
    type: 'fixos' | 'variaveis' | 'parcelas';
    cat: string;
    due: string;
  }) => {
    if (!user) return;
    const docId = editingTransaction ? editingTransaction.id : `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const path = `transactions/${docId}`;
    
    // Merge existing item status if editing
    const fallbackPaid = editingTransaction ? editingTransaction.paid_amount : 0;
    const fallbackPaidAt = editingTransaction ? editingTransaction.paid_at : '';

    const newTx: Transaction = {
      id: docId,
      userId: user.uid,
      name: data.name,
      amount: data.amount,
      type: data.type,
      cat: data.cat,
      due: data.due,
      monthKey: currentMonthKey,
      paid_amount: fallbackPaid,
      paid_at: fallbackPaidAt,
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'transactions', docId), newTx);
      triggerToast('Gasto registrado com segurança no Firestore!', 'success');
      setEditingTransaction(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const confirm = window.confirm("Deseja mesmo remover permanentemente esse gasto?");
    if (!confirm) return;
    const path = `transactions/${id}`;
    
    try {
      await deleteDoc(doc(db, 'transactions', id));
      triggerToast('Lançamento excluído!', 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddOpen(true);
  };

  // Payments / Income confirmation flow
  const handleOpenPay = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;
    setPayTransactionId(txId);
    const pendingVal = tx.amount - (tx.paid_amount || 0);
    setConfirmValueStr(formatCurrency(pendingVal));
    setIsPayOpen(true);
  };

  const handleApplyPayment = async () => {
    if (!payTransactionId || !user) return;
    const payVal = handleParseMoney(confirmValueStr);
    if (payVal <= 0) return;

    const tx = transactions.find(t => t.id === payTransactionId);
    if (!tx) return;

    const targetPaidSum = (tx.paid_amount || 0) + payVal;
    const finishedPaying = targetPaidSum >= tx.amount;

    const path = `transactions/${payTransactionId}`;
    const updatedTx: Transaction = {
      ...tx,
      paid_amount: targetPaidSum,
      paid_at: finishedPaying ? new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'transactions', payTransactionId), updatedTx);
      triggerToast('Liquidação de débito registrada!', 'success');
      setIsPayOpen(false);
      setPayTransactionId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  // Preset configuration and extras cumulative earnings save
  const handleOpenIncome = () => {
    const inc = settings?.income || 0;
    const bal = settings?.balance || 0;
    const ext = settings?.extras?.[currentMonthKey] || 0;

    setTempIncomeStr(inc > 0 ? formatCurrency(inc) : '');
    setTempBalanceStr(bal > 0 ? formatCurrency(bal) : '');
    setTempExtraStr(ext > 0 ? formatCurrency(ext) : '');
    setIsIncomeOpen(true);
  };

  const handleSaveIncomeConfigs = async () => {
    if (!user || !settings) return;
    const incVal = handleParseMoney(tempIncomeStr);
    const balVal = handleParseMoney(tempBalanceStr);
    const extVal = handleParseMoney(tempExtraStr);

    const oldExtrasMap = settings.extras || {};
    const updatedSettings: Setting = {
      ...settings,
      income: incVal,
      balance: balVal,
      extras: {
        ...oldExtrasMap,
        [currentMonthKey]: extVal
      }
    };

    const path = `settings/${user.uid}`;
    try {
      await setDoc(doc(db, 'settings', user.uid), updatedSettings);
      triggerToast('Ganhos do mês atualizados!', 'success');
      setIsIncomeOpen(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  // Standard category creating via modal callback
  const handleCreateCustomCategory = async (icon: string, label: string) => {
    if (!user) return;
    const id = `cat_${Date.now()}`;
    const val = label.toLowerCase().replace(/\s+/g, '-');
    const newCategory: Category = {
      id,
      userId: user.uid,
      icon,
      label,
      value: val
    };

    const path = `categories/${id}`;
    try {
      await setDoc(doc(db, 'categories', id), newCategory);
      triggerToast('Categoria criada!', 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  // Goals operations bound: ADD/PROGRESS/DELETE
  const handleCreateGoal = async (title: string, target: number, current: number, deadline: string) => {
    if (!user) return;
    const id = `goal_${Date.now()}`;
    const newG: Goal = {
      id,
      userId: user.uid,
      title,
      targetAmount: target,
      currentAmount: current,
      deadline,
      createdAt: new Date().toISOString()
    };

    const path = `goals/${id}`;
    try {
      await setDoc(doc(db, 'goals', id), newG);
      triggerToast('Objetivo ativado com sucesso!', 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, delta: number) => {
    if (!user) return;
    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;

    const upcomingAmount = Math.max(0, targetGoal.currentAmount + delta);
    const updatedGoal: Goal = {
      ...targetGoal,
      currentAmount: upcomingAmount
    };

    const path = `goals/${goalId}`;
    try {
      await setDoc(doc(db, 'goals', goalId), updatedGoal);
      triggerToast(delta > 0 ? 'Depósito adicionado!' : 'Fundos resgatados!', 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const confirm = window.confirm("Deseja de fato remover essa meta de poupança?");
    if (!confirm) return;
    const path = `goals/${goalId}`;

    try {
      await deleteDoc(doc(db, 'goals', goalId));
      triggerToast('Plano de meta excluído.', 'success');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // Settings pane customization changes
  const handleThemeModify = async (newTheme: 'dark' | 'light') => {
    if (!user || !settings) return;
    setTheme(newTheme);
    const path = `settings/${user.uid}`;
    try {
      await setDoc(doc(db, 'settings', user.uid), { ...settings, theme: newTheme });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleCurrencyModify = async (newCurrency: 'BRL' | 'USD' | 'EUR') => {
    if (!user || !settings) return;
    setCurrency(newCurrency);
    const path = `settings/${user.uid}`;
    try {
      await setDoc(doc(db, 'settings', user.uid), { ...settings, currency: newCurrency });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handlePresetConfigsSave = async (inc: number, bal: number) => {
    if (!user || !settings) return;
    const path = `settings/${user.uid}`;
    try {
      await setDoc(doc(db, 'settings', user.uid), { ...settings, income: inc, balance: bal });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  // Pull to refresh gestures events
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = document.getElementById('main-scroller-view');
    if (container && container.scrollTop === 0) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const container = document.getElementById('main-scroller-view');
    if (startY > 0 && container && container.scrollTop === 0) {
      const currentY = e.touches[0].pageY;
      const progress = Math.max(0, currentY - startY);
      setPullProgress(Math.min(progress * 0.35, 60));
    }
  };

  const handleTouchEnd = () => {
    if (pullProgress > 38) {
      triggerToast('Atualizando dados do Caixa...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
    setPullProgress(0);
    setStartY(0);
  };

  // Logout trigger user friendly
  const handleUserLogout = async () => {
    const confirm = window.confirm("Deseja realmente desconectar-se do painel?");
    if (!confirm) return;
    try {
      await signOut(auth);
      triggerToast('Sessão encerrada com sucesso.', 'success');
    } catch (e) {
      triggerToast('Ocorreu uma falha ao desconectar.', 'error');
    }
  };

  // Math ledger computation definitions
  const activeMonthCategoryList = [...defaultCategories, ...categories];
  const activeMonthTransactions = transactions.filter(t => t.monthKey === currentMonthKey);
  const activeTabTransactions = activeMonthTransactions.filter(t => t.type === activeTab);

  // Summaries Calculations
  const inc = settings?.income || 0;
  const bal = settings?.balance || 0;
  const ext = settings?.extras?.[currentMonthKey] || 0;
  
  // Total funds active
  const totalInflowsSum = inc + bal + ext;

  const totalSpentInMonth = activeMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalPaidInMonth = activeMonthTransactions.reduce((sum, t) => sum + (t?.paid_amount || 0), 0);
  const leftoverCash = totalInflowsSum - totalSpentInMonth;

  // Unpaid total estimate
  const pendingTotalDebt = Math.max(0, totalSpentInMonth - totalPaidInMonth);

  // Categorical summaries for quick widgets
  const fixosSum = activeMonthTransactions.filter(t => t.type === 'fixos').reduce((sum, t) => sum + t.amount, 0);
  const variableSum = activeMonthTransactions.filter(t => t.type === 'variaveis').reduce((sum, t) => sum + t.amount, 0);
  const parcelasSum = activeMonthTransactions.filter(t => t.type === 'parcelas').reduce((sum, t) => sum + t.amount, 0);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center glow-indigo animate-pulse">
          <TrendingUp className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="text-center space-y-1.5 animate-pulse">
          <h3 className="font-display font-extrabold text-white text-base tracking-tight">FINANÇAS<span className="text-indigo-400">PRO</span></h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Carregando cofre criptografado</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={() => window.location.reload()} showToast={triggerToast} />;
  }

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${
      theme === 'light' ? 'bg-[#f4f7fa] text-slate-900 font-sans' : 'bg-[#070a13] text-slate-100 font-sans'
    }`}>
      {/* Dynamic Animated Toast */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -40, x: '-50%' }}
          animate={{ opacity: 1, y: 16, x: '-50%' }}
          exit={{ opacity: 0, y: -40, x: '-50%' }}
          className={`fixed left-1/2 -translate-x-1/2 z-50 text-xs font-bold px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl leading-none ${
            toastType === 'error' 
              ? 'bg-rose-500 text-white' 
              : toastType === 'warning' 
                ? 'bg-amber-500 text-slate-950' 
                : 'bg-emerald-500 text-white shadow-emerald-500/15 border border-emerald-400/20'
          }`}
        >
          {toastType === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toastMessage}
        </motion.div>
      )}

      {/* Dynamic Floating Due alert matching user logic */}
      {floatingAlert && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 p-4 rounded-2xl glass-panel border-rose-500/20 shadow-2xl glow-indigo flex gap-3 items-center justify-between"
        >
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">{floatingAlert.title}</h5>
              <p className="text-xs text-slate-400 font-light max-w-[190px] truncate">{floatingAlert.desc}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('fixos');
              handleOpenPay(floatingAlert.id);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-[10px] font-bold tracking-wider cursor-pointer font-display"
          >
            PAGAR
          </button>
        </motion.div>
      )}

      {/* Pull down visual indicator block layout */}
      {pullProgress > 0 && (
        <div 
          style={{ height: `${pullProgress}px` }} 
          className="bg-indigo-500/15 flex items-center justify-center text-[10px] font-bold text-indigo-400 tracking-widest uppercase transition-all overflow-hidden select-none"
        >
          {pullProgress > 38 ? 'Solte para Atualizar...' : 'Puxe para Atualizar'}
        </div>
      )}

      {/* Main scrolling wrapper */}
      <div 
        id="main-scroller-view"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
          {isFirebaseOffline && (
            <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/20 text-amber-200 text-xs space-y-3 shadow-xl relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-[12px] uppercase tracking-wide text-white leading-tight">
                    Aviso de Sincronização / Modo Offline
                  </h4>
                  <p className="text-slate-350 text-[11px] font-light leading-relaxed mt-1">
                    Detectamos que o Firestore está inacessível ou operando offline. Isso geralmente ocorre por dois motivos:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px] font-light mt-2">
                    <li>
                      <strong className="text-slate-100">Restrição de Iframe:</strong> Navegadores modernos (como Chrome, Safari ou Brave) de forma inteligente bloqueiam cookies de terceiros e conexões de sockets dentro de frames de visualização prévia.
                    </li>
                    <li>
                      <strong className="text-slate-100">Banco de Dados não Criado:</strong> Certifique-se de ter ativado o <strong className="text-amber-400">Cloud Firestore</strong> no console do seu Firebase para o projeto <code className="bg-amber-950/40 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[10px]">financaspro-bcbb4</code>.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] tracking-wider uppercase cursor-pointer transition-colors"
                >
                  Abrir em Nova Aba ↗
                </button>
                <button
                  type="button"
                  onClick={() => setIsFirebaseOffline(false)}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-[10px] tracking-wider uppercase cursor-pointer border border-white/10 transition-colors"
                >
                  Entendi, Continuar
                </button>
              </div>
            </div>
          )}

          {/* Main Top Header Block */}
          <header className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center glow-emerald">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-display font-black text-white text-base tracking-tight leading-none">
                  FINANÇAS<span className="text-emerald-400">PRO</span>
                </h2>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block mt-1">SaaS de Gestão Segura</span>
              </div>
            </div>

            {/* Quick Profile / Action Menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenIncome}
                className="bg-white/3 hover:bg-white/6 text-slate-200 border border-white/5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" /> Ganhos do Mês
              </button>
              
              <button
                onClick={handleUserLogout}
                className="w-10 h-10 rounded-xl bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 flex items-center justify-center text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Sair da plataforma"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Quick interactive parameters estimates dashboard cards */}
          {activeTab !== 'dashboard' && activeTab !== 'goals' && activeTab !== 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Core card leftover surplus */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={handleOpenIncome}
                className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/70 to-teal-950/15 border border-emerald-500/30 glow-emerald relative overflow-hidden flex flex-col justify-between cursor-pointer group"
              >
                <div className="absolute top-4 right-4 text-emerald-400/40 group-hover:text-emerald-400 group-hover:rotate-12 transition-all">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sobra Estimada de Caixa</span>
                  <h3 className="font-mono text-3xl font-extrabold text-white tracking-tight leading-none mb-2">
                    {formatCurrency(leftoverCash)}
                  </h3>
                </div>
                <div className="text-[11px] text-emerald-400/80 font-bold uppercase tracking-wider mt-4">
                  Sobre disponível de {formatCurrency(totalInflowsSum)}
                </div>
              </motion.div>

              {/* Core card liabilities total */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setActiveTab('dashboard')}
                className="p-6 rounded-3xl bg-slate-950/40 border border-white/5 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total a Pagar Pendente</span>
                  <h3 className="font-mono text-3xl font-extrabold text-rose-400 tracking-tight leading-none mb-2">
                    {formatCurrency(pendingTotalDebt)}
                  </h3>
                </div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-4">
                  Comprometido do mês: {formatCurrency(totalSpentInMonth)}
                </div>
              </motion.div>
            </div>
          )}

          {/* Ledger Calendar Month Navigator */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/3 border border-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleMonthTurn(-1)}
                className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className="font-display font-black text-white text-sm tracking-wide select-none min-w-[124px] text-center">
                {monthsPortuguese[calendarDate.getMonth()].toUpperCase()} {calendarDate.getFullYear()}
              </h4>
              <button
                onClick={() => handleMonthTurn(1)}
                className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 hover:border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsAddOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold leading-none select-none flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15"
            >
              <Plus className="w-4 h-4" /> Novo
            </button>
          </div>

          {/* Navigational Segment Tabs */}
          <div className="flex gap-1 bg-slate-950/60 p-1 rounded-2xl border border-white/5 overflow-x-auto pr-2">
            {[
              { id: 'fixos', val: '📌 FIXOS' },
              { id: 'variaveis', val: '📊 VARIÁVEIS' },
              { id: 'parcelas', val: '💳 PARCELAS' },
              { id: 'dashboard', val: '📉 DASHBOARD' },
              { id: 'goals', val: '🎯 METAS' },
              { id: 'settings', val: '⚙️ CONFIGS' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all select-none cursor-pointer flex-shrink-0 ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400' 
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {tab.val}
              </button>
            ))}
          </div>

          {/* Active Tab Screen Render */}
          <main className="space-y-4 pt-1">
            {activeTab === 'dashboard' ? (
              <DashboardAnalytics
                transactions={activeMonthTransactions}
                categoriesList={activeMonthCategoryList}
                totalAvailable={totalInflowsSum}
                leftover={leftoverCash}
                income={inc}
                balance={bal}
                extra={ext}
              />
            ) : activeTab === 'goals' ? (
              <GoalsPanel
                goals={goals}
                onCreateGoal={handleCreateGoal}
                onUpdateGoalProgress={handleUpdateGoalProgress}
                onDeleteGoal={handleDeleteGoal}
              />
            ) : activeTab === 'settings' ? (
              <SettingsPanel
                currentTheme={theme}
                onChangeTheme={handleThemeModify}
                currentCurrency={currency}
                onChangeCurrency={handleCurrencyModify}
                baseIncome={inc}
                baseBalance={bal}
                onSavePreferences={handlePresetConfigsSave}
                transactions={transactions}
                showToast={triggerToast}
              />
            ) : (
              /* Normal transactional listings lists */
              <div className="space-y-3">
                {activeTabTransactions.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-white/5 rounded-3xl text-xs text-slate-500 select-none">
                    Sem lançamentos registrados sob "{activeTab.toUpperCase()}" para o mês selecionado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTabTransactions.map((tx) => {
                      const categoryObj = activeMonthCategoryList.find(c => c.value === tx.cat) || { icon: '📦' };
                      const remDue = tx.amount - (tx.paid_amount || 0);
                      const isPaid = remDue <= 0;

                      return (
                        <div
                          key={tx.id}
                          className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between gap-4 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 cursor-pointer" onClick={() => handleOpenEdit(tx)}>
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-lg shadow-sm">
                              {categoryObj.icon}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-display font-bold text-white text-xs truncate flex items-center gap-1.5 leading-tight">
                                {tx.name} {isPaid && <span className="text-emerald-400">✓</span>}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
                                {tx.due || 'Sem vencimento'} • {tx.cat} 
                                {tx.paid_amount > 0 && !isPaid && ` • Parcial: ${formatCurrency(tx.paid_amount)}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-extrabold text-white">
                              {formatCurrency(tx.amount)}
                            </span>
                            
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleOpenPay(tx.id)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wider uppercase cursor-pointer transition-colors ${
                                  isPaid 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5'
                                }`}
                              >
                                {isPaid ? 'PAGO' : 'PAGAR'}
                              </button>

                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="w-8 h-8 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/5 text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                                title="Deletar lançamento"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Standard Page Footer credits/helpline */}
          <footer className="pt-10 border-t border-white/5 text-center space-y-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold block">BJC DESENVOLVIMENTOS SAAS</span>
            <p className="text-[11px] text-slate-400 font-light max-w-sm mx-auto leading-relaxed">
              Dúvidas ou suporte na integração? Envie um e-mail para <a href="mailto:bjcarvalho007@gmail.com" className="text-indigo-400 hover:underline">bjcarvalho007@gmail.com</a> ou fale diretamente com nossa engenharia.
            </p>
          </footer>
        </div>
      </div>

      {/* Transaction Add/Edit Form Overlay Modal */}
      <TransactionFormModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        categoriesList={activeMonthCategoryList}
        onCreateCategory={handleCreateCustomCategory}
      />

      {/* Sub-Modal confirmation download for Payments */}
      {isPayOpen && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0f1524] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 space-y-4"
            >
              <div>
                <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider mb-1">Confirmar Baixa</h4>
                <p className="text-xs text-slate-400">Informe ou parcialize o pagamento de faturas.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Valor do Pagamento (R$)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={confirmValueStr}
                  onChange={(e) => setConfirmValueStr(handleMaskMoney(e.target.value))}
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 text-sm px-4 py-3 rounded-xl font-mono"
                />
              </div>

              <div className="flex gap-3">
                <button
                  id="modal-confirm-pay-btn"
                  onClick={handleApplyPayment}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Dar Baixa Completa/Parcial
                </button>
                <button
                  onClick={() => setIsPayOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-slate-400 hover:text-white text-[11px] font-bold cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Income Adjustment Overlay Modal configuration */}
      {isIncomeOpen && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsIncomeOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0f1524] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 space-y-4"
            >
              <div>
                <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider mb-1">💸 Ganhos da Competência</h4>
                <p className="text-xs text-slate-400">Configure suas rendas básicas e faturamento complementar.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1">Renda Mensal do Mês</label>
                  <input
                    id="income-modal-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={tempIncomeStr}
                    onChange={(e) => setTempIncomeStr(handleMaskMoney(e.target.value))}
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1">Reserva / Dinheiro em Mãos</label>
                  <input
                    id="balance-modal-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={tempBalanceStr}
                    onChange={(e) => setTempBalanceStr(handleMaskMoney(e.target.value))}
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1">Rendas Extras Acumuladas</label>
                  <input
                    id="extra-modal-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={tempExtraStr}
                    onChange={(e) => setTempExtraStr(handleMaskMoney(e.target.value))}
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  id="income-modal-save-btn"
                  onClick={handleSaveIncomeConfigs}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Atualizar Receitas
                </button>
                <button
                  onClick={() => setIsIncomeOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-slate-450 hover:text-white text-[11px] font-bold cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
