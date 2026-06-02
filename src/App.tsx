import React, { useState, useEffect, useMemo } from 'react';
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
import { Transaction, Category, Goal, Setting, AppNotification, ExtraEarning } from './types';
import AuthScreen from './components/AuthScreen';
import TransactionFormModal from './components/TransactionFormModal';
import DashboardAnalytics from './components/DashboardAnalytics';
import GoalsPanel from './components/GoalsPanel';
import SettingsPanel from './components/SettingsPanel';
import OnboardingTutorial from './components/OnboardingTutorial';
import ExtraEarningsManager from './components/ExtraEarningsManager';
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
  ArrowRightLeft,
  LayoutDashboard,
  Receipt,
  Coins,
  CreditCard
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
  const [activeTab, setActiveTab] = useState<'contas' | 'fixos' | 'variaveis' | 'parcelas' | 'dashboard' | 'goals' | 'settings'>('contas');
  
  // Custom Toasts and Alerts
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [floatingAlert, setFloatingAlert] = useState<{ id: string; title: string; desc: string; type: string } | null>(null);

  // Modal display parameters
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Custom confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    classNameConfirm?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [isPayOpen, setIsPayOpen] = useState<boolean>(false);
  const [payTransactionId, setPayTransactionId] = useState<string | null>(null);
  const [confirmValueStr, setConfirmValueStr] = useState<string>('');
  const [isPendingDebtListOpen, setIsPendingDebtListOpen] = useState<boolean>(false);
  const [installmentInputs, setInstallmentInputs] = useState<Record<string, string>>({});

  // Income parameters custom configuration trigger modal
  const [isIncomeOpen, setIsIncomeOpen] = useState<boolean>(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);
  const [tempIncomeStr, setTempIncomeStr] = useState<string>('');
  const [tempBalanceStr, setTempBalanceStr] = useState<string>('');
  const [tempExtraStr, setTempExtraStr] = useState<string>('');
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

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

      // Request notification permissions automatically on login/load to enable background PWA notifications
      if (currentUser && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            console.log('Notificações ativadas pelo usuário!');
          }
        });
      }
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

    const thresholdDays = settings?.alertThresholdDays !== undefined ? settings.alertThresholdDays : 3;

    // Check items for current month and filter unpaid ones matching today or configured threshold
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
          
          if (diffInDays >= 0 && diffInDays <= thresholdDays) {
            expiring.push(item);
          }
        }
      }
    });

    // Sync current computed upcoming bills with the Service Worker cache for absolute background dispatch
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          reg.active.postMessage({
            type: 'SET_REMINDERS',
            bills: expiring.map(e => ({
              id: e.id,
              name: e.name,
              due: e.due,
              amount: e.amount
            }))
          });
        }
      });
    }

    if (expiring.length > 0) {
      const targetBill = expiring[0];
      setFloatingAlert({
        id: targetBill.id,
        title: '⚠️ ATENÇÃO - VENCIMENTO',
        desc: `A despesa "${targetBill.name}" está agendada para vencer no dia ${targetBill.due}. Regularize para manter em dia o seu índice de sobras estimadas!`,
        type: 'vencimento'
      });

      // Browser Web Notifications integration with active PWA app-launch visual styling
      if ('Notification' in window && Notification.permission === 'granted') {
        const sessionKey = `financaspro_notified_bill_${targetBill.id}`;
        if (!sessionStorage.getItem(sessionKey)) {
          try {
            const hasServiceWorker = 'serviceWorker' in navigator;
            const notificationTitle = 'FinançasPro';
            const notificationOptions = {
              body: `Atenção: A despesa "${targetBill.name}" vence no dia ${targetBill.due}.`,
              icon: '/app_icon.png',
              badge: '/app_icon.png',
              vibrate: [200, 100, 200],
              tag: `financaspro-bill-${targetBill.id}`,
              renotify: true
            };

            if (hasServiceWorker) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(notificationTitle, notificationOptions);
              }).catch(() => {
                new Notification(notificationTitle, notificationOptions);
              });
            } else {
              new Notification(notificationTitle, notificationOptions);
            }
            sessionStorage.setItem(sessionKey, 'true');
          } catch (e) {
            console.warn('System browser notification list fallback: ', e);
          }
        }
      }
    } else {
      setFloatingAlert(null);
    }
  }, [transactions, currentMonthKey, settings?.alertThresholdDays, settings]);

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

    // Determine robust masterId identifier if this belongs to a series
    let inferredMasterId = editingTransaction?.masterId;
    if (!inferredMasterId && editingTransaction?.id) {
      if (editingTransaction.id.startsWith('v_')) {
        const parts = editingTransaction.id.split('_');
        if (parts.length >= 2) {
          inferredMasterId = parts[1]; // Extract the original master ID
        }
      } else if (
        editingTransaction.type === 'fixos' || 
        data.type === 'fixos' || 
        editingTransaction.type === 'parcelas' || 
        data.type === 'parcelas'
      ) {
        inferredMasterId = editingTransaction.id;
      }
    }
    if (!inferredMasterId && (data.type === 'fixos' || data.type === 'parcelas')) {
      inferredMasterId = docId;
    }

    const newTx: any = {
      id: docId,
      userId: user.uid,
      name: data.name,
      amount: data.amount,
      type: data.type,
      cat: data.cat,
      due: data.due,
      monthKey: editingTransaction ? editingTransaction.monthKey : currentMonthKey,
      paid_amount: fallbackPaid,
      paid_at: fallbackPaidAt || '',
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (inferredMasterId) {
      newTx.masterId = inferredMasterId;
    }

    try {
      await setDoc(doc(db, 'transactions', docId), newTx);
      triggerToast('Gasto registrado com segurança no Firestore!', 'success');
      setEditingTransaction(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    let confirmMessage = "Deseja mesmo remover permanentemente esse gasto?";
    const isVirtual = id.startsWith('v_');
    let realIdToDelete = id;

    if (isVirtual) {
      confirmMessage = "Esta é uma despesa fixa recorrente. Ao confirmar, ela será removida de todos os meses. Deseja prosseguir?";
      const lastUnderscore = id.lastIndexOf('_');
      realIdToDelete = id.substring(2, lastUnderscore);
    }

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Lançamento Recorrente',
      message: confirmMessage,
      confirmText: 'Confirmar Exclusão',
      cancelText: 'Manter Lançamento',
      classNameConfirm: 'bg-rose-600 hover:bg-rose-700 text-white font-bold',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const path = `transactions/${realIdToDelete}`;
        try {
          await deleteDoc(doc(db, 'transactions', realIdToDelete));
          triggerToast('Lançamento excluído com sucesso!', 'success');
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, path);
        }
      }
    });
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddOpen(true);
  };

  // Payments / Income confirmation flow
  const handleOpenPay = (txId: string) => {
    const tx = activeMonthTransactions.find(t => t.id === txId);
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

    const tx = activeMonthTransactions.find(t => t.id === payTransactionId);
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
    const incVal = settings?.monthlyIncome?.[currentMonthKey] ?? 0;
    const balVal = settings?.monthlyBalance?.[currentMonthKey] ?? 0;
    const ext = settings?.extras?.[currentMonthKey] || 0;

    setTempIncomeStr(incVal > 0 ? formatCurrency(incVal) : '');
    setTempBalanceStr(balVal > 0 ? formatCurrency(balVal) : '');
    setTempExtraStr(ext > 0 ? formatCurrency(ext) : '');
    setIsIncomeOpen(true);
  };

  const handleSaveIncomeConfigs = async () => {
    if (!user || !settings) return;
    const incVal = handleParseMoney(tempIncomeStr);
    const balVal = handleParseMoney(tempBalanceStr);
    const extVal = handleParseMoney(tempExtraStr);

    const oldMonthlyIncome = settings.monthlyIncome || {};
    const oldMonthlyBalance = settings.monthlyBalance || {};
    const oldExtrasMap = settings.extras || {};

    // Auto-update standard fallback if not set yet
    const baseInc = settings.income || incVal;
    const baseBal = settings.balance || balVal;

    const updatedSettings: Setting = {
      ...settings,
      income: baseInc,
      balance: baseBal,
      monthlyIncome: {
        ...oldMonthlyIncome,
        [currentMonthKey]: incVal
      },
      monthlyBalance: {
        ...oldMonthlyBalance,
        [currentMonthKey]: balVal
      },
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

  const handleAddExtraEarning = async (earning: Omit<ExtraEarning, 'id' | 'createdAt'>) => {
    if (!user || !settings) return;
    const newId = `ext_${Date.now()}`;
    const newEarning: ExtraEarning = {
      ...earning,
      id: newId,
      createdAt: new Date().toISOString()
    };

    const currentEarningList = settings.extraEarnings || [];
    const updatedEarningList = [...currentEarningList, newEarning];

    // Compute the sum of all itemized extra earnings for this monthKey
    const targetMonthKey = earning.monthKey;
    const sameMonthEarnings = updatedEarningList.filter(item => item.monthKey === targetMonthKey);
    const sumForMonth = sameMonthEarnings.reduce((acc, item) => acc + item.amount, 0);

    const oldExtrasMap = settings.extras || {};
    const updatedSettings: Setting = {
      ...settings,
      extras: {
        ...oldExtrasMap,
        [targetMonthKey]: sumForMonth
      },
      extraEarnings: updatedEarningList
    };

    const path = `settings/${user.uid}`;
    try {
      await setDoc(doc(db, 'settings', user.uid), updatedSettings);
      if (targetMonthKey === currentMonthKey) {
        setTempExtraStr(formatCurrency(sumForMonth));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleDeleteExtraEarning = async (id: string) => {
    if (!user || !settings) return;
    const currentEarningList = settings.extraEarnings || [];
    const targetEarning = currentEarningList.find(item => item.id === id);
    if (!targetEarning) return;

    const targetMonthKey = targetEarning.monthKey;
    const updatedEarningList = currentEarningList.filter(item => item.id !== id);

    // Compute the sum of all itemized extra earnings for this monthKey after deletion
    const sameMonthEarnings = updatedEarningList.filter(item => item.monthKey === targetMonthKey);
    const sumForMonth = sameMonthEarnings.reduce((acc, item) => acc + item.amount, 0);

    const oldExtrasMap = settings.extras || {};
    const updatedSettings: Setting = {
      ...settings,
      extras: {
        ...oldExtrasMap,
        [targetMonthKey]: sumForMonth
      },
      extraEarnings: updatedEarningList
    };

    const path = `settings/${user.uid}`;
    try {
      await setDoc(doc(db, 'settings', user.uid), updatedSettings);
      if (targetMonthKey === currentMonthKey) {
        setTempExtraStr(sumForMonth > 0 ? formatCurrency(sumForMonth) : '');
      }
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
  const handleCreateGoal = async (
    title: string,
    target: number,
    current: number,
    deadline: string,
    initialAmount?: number,
    monthlyContribution?: number,
    targetMonths?: number
  ) => {
    if (!user) return;
    const id = `goal_${Date.now()}`;
    const newG: Goal = {
      id,
      userId: user.uid,
      title,
      targetAmount: target,
      currentAmount: current,
      deadline,
      initialAmount: initialAmount || 0,
      monthlyContribution: monthlyContribution || 0,
      targetMonths: targetMonths || 12,
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

  const handleDeleteGoal = (goalId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover Meta Poupança',
      message: 'Você tem certeza definitiva? Esta ação removerá eternamente este planejamento de metas do sistema.',
      confirmText: 'Remover Meta',
      cancelText: 'Manter Planejamento',
      classNameConfirm: 'bg-rose-600 hover:bg-rose-700 text-white font-bold',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const path = `goals/${goalId}`;
        try {
          await deleteDoc(doc(db, 'goals', goalId));
          triggerToast('Plano de meta excluído.', 'success');
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, path);
        }
      }
    });
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

  const handlePresetConfigsSave = async (inc: number, bal: number, alertDays?: number) => {
    if (!user || !settings) return;
    const path = `settings/${user.uid}`;
    try {
      const payload: any = { ...settings, income: inc, balance: bal };
      if (alertDays !== undefined) {
        payload.alertThresholdDays = alertDays;
      }
      await setDoc(doc(db, 'settings', user.uid), payload);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleUpdateAlertSettings = async (
    emailAlerts: boolean,
    whatsappAlerts: boolean,
    alertEmail: string,
    alertPhone: string
  ) => {
    if (!user || !settings) return;
    const path = `settings/${user.uid}`;
    try {
      const updatedSettings: Setting = {
        ...settings,
        emailAlerts,
        whatsappAlerts,
        alertEmail,
        alertPhone
      };
      await setDoc(doc(db, 'settings', user.uid), updatedSettings);
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
  const handleUserLogout = () => {
    setIsLogoutOpen(true);
  };

  const executeLogout = async () => {
    setIsLogoutOpen(false);
    try {
      await signOut(auth);
      triggerToast('Sessão encerrada com sucesso.', 'success');
    } catch (e) {
      triggerToast('Ocorreu uma falha ao desconectar.', 'error');
    }
  };

  // Math ledger computation definitions
  const activeMonthCategoryList = [...defaultCategories, ...categories];
  const activeMonthTransactions = useMemo(() => {
    // 1. Get real transactions for this month
    const realTransactionsThisMonth = transactions.filter(t => t.monthKey === currentMonthKey);

    // 2. Find all unique master transaction templates (fixed and installments) in database
    const masterTransactions = transactions.filter(t => t.type === 'fixos' || t.type === 'parcelas');
    
    // Group them uniquely by recurring identity to avoid duplicates.
    const mastersMap = new Map<string, Transaction>();
    
    // Sort so the latest updated templates come first
    const sortedMasters = [...masterTransactions].sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || '';
      const dateB = b.updatedAt || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    for (const tx of sortedMasters) {
      const matchKey = tx.masterId || `name_${tx.name.trim().toLowerCase()}`;
      if (!mastersMap.has(matchKey)) {
        mastersMap.set(matchKey, tx);
      }
    }

    const enrichedTransactions = [...realTransactionsThisMonth];

    mastersMap.forEach((masterTx) => {
      // Check if there is already a transaction for this month that matches this master
      const exists = realTransactionsThisMonth.some(t => {
        if (t.id === masterTx.id) return true;
        if (masterTx.masterId && t.masterId === masterTx.masterId) return true;
        if (t.masterId === masterTx.id) return true;
        if (t.name.trim().toLowerCase() === masterTx.name.trim().toLowerCase()) return true;
        return false;
      });

      if (!exists) {
        // Create virtual projection
        const virtualId = `v_${masterTx.masterId || masterTx.id}_${currentMonthKey}`;
        const virtualTx: Transaction = {
          id: virtualId,
          userId: masterTx.userId,
          name: masterTx.name,
          amount: masterTx.amount,
          type: masterTx.type, // Keeps original type: 'fixos' or 'parcelas'
          cat: masterTx.cat,
          due: masterTx.due,
          paid_amount: 0,
          paid_at: '',
          masterId: masterTx.masterId || masterTx.id,
          monthKey: currentMonthKey,
          createdAt: masterTx.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        enrichedTransactions.push(virtualTx);
      }
    });

    return enrichedTransactions;
  }, [transactions, currentMonthKey]);

  const activeTabTransactions = useMemo(() => {
    if (activeTab === 'contas') {
      return activeMonthTransactions.filter(t => t.type === 'fixos');
    }
    return activeMonthTransactions.filter(t => t.type === activeTab);
  }, [activeMonthTransactions, activeTab]);

  // Summaries Calculations
  const inc = settings?.monthlyIncome?.[currentMonthKey] ?? 0;
  const bal = settings?.monthlyBalance?.[currentMonthKey] ?? 0;
  const ext = settings?.extras?.[currentMonthKey] || 0;
  
  // Total funds active
  const totalInflowsSum = inc + bal + ext;

  const totalSpentInMonth = activeMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalPaidInMonth = activeMonthTransactions.reduce((sum, t) => sum + (t?.paid_amount || 0), 0);
  const totalSpentFixoAndVariavel = activeMonthTransactions
    .filter(t => t.type === 'fixos' || t.type === 'variaveis')
    .reduce((sum, t) => sum + t.amount, 0);
  const leftoverCash = totalInflowsSum - totalSpentFixoAndVariavel;

  // Unpaid total estimate for fixed and variables of the month only
  const activeMonthFixAndVar = activeMonthTransactions.filter(t => t.type === 'fixos' || t.type === 'variaveis');
  const spentFixAndVar = activeMonthFixAndVar.reduce((sum, t) => sum + t.amount, 0);
  const paidFixAndVar = activeMonthFixAndVar.reduce((sum, t) => sum + (t?.paid_amount || 0), 0);
  const pendingTotalDebt = Math.max(0, spentFixAndVar - paidFixAndVar);

  // Categorical summaries for quick widgets
  const fixosSum = activeMonthTransactions.filter(t => t.type === 'fixos').reduce((sum, t) => sum + t.amount, 0);
  const variableSum = activeMonthTransactions.filter(t => t.type === 'variaveis').reduce((sum, t) => sum + t.amount, 0);
  const parcelasSum = activeMonthTransactions.filter(t => t.type === 'parcelas').reduce((sum, t) => sum + t.amount, 0);
  const renderSummaryCardsMobile = () => {
    if (activeTab === 'dashboard' || activeTab === 'goals' || activeTab === 'settings') {
      return null;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {/* Core card leftover surplus */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={handleOpenIncome}
          className={`p-6 rounded-3xl ${
            theme === 'light' 
              ? 'bg-gradient-to-br from-[#effaf3] to-white border-[#b7ebd1] text-slate-900 shadow-sm shadow-emerald-100/30' 
              : 'bg-gradient-to-br from-emerald-950/70 to-teal-950/15 border-emerald-500/30 text-white shadow-xl shadow-black/20'
          } border glow-emerald relative overflow-hidden flex flex-col justify-between cursor-pointer group`}
        >
          <div className="absolute top-4 right-4 text-emerald-400/40 group-hover:text-emerald-400 group-hover:rotate-12 transition-all">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-widest block mb-1`}>Sobra Estimada de Caixa</span>
            <h3 className={`font-mono text-3xl font-extrabold ${theme === 'light' ? 'text-emerald-700' : 'text-white'} tracking-tight leading-none mb-2`}>
              {formatCurrency(leftoverCash)}
            </h3>
          </div>
          <div className={`text-[11px] ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400/80'} font-bold uppercase tracking-wider mt-4`}>
            Sobre disponível de {formatCurrency(totalInflowsSum)}
          </div>
        </motion.div>

        {/* Core card liabilities total */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => setIsPendingDebtListOpen(true)}
          className={`p-6 rounded-3xl ${
            theme === 'light' 
              ? 'bg-white border-slate-200 shadow-sm shadow-slate-100/30 text-slate-900 hover:border-indigo-300' 
              : 'bg-slate-950/40 border-white/5 text-white shadow-xl hover:border-slate-800'
          } border flex flex-col justify-between cursor-pointer transition-all`}
        >
          <div>
            <span className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest block mb-1`}>Total a Pagar Pendente</span>
            <h3 className="font-mono text-3xl font-extrabold text-rose-450 tracking-tight leading-none mb-2">
              {formatCurrency(pendingTotalDebt)}
            </h3>
          </div>
          <div className={`text-[11px] font-bold uppercase tracking-wider mt-4 ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
            Comprometido do mês: {formatCurrency(totalSpentInMonth)}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderSummaryCardsPC = () => {
    return (
      <div className="space-y-4 hidden lg:flex flex-col">
        {/* PC Stacked Leftover Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={handleOpenIncome}
          className={`p-6 rounded-3xl ${
            theme === 'light' 
              ? 'bg-gradient-to-br from-[#f0fdf4] to-white border-emerald-200 text-slate-900 shadow-md shadow-emerald-100/10' 
              : 'bg-gradient-to-br from-emerald-950/40 to-teal-950/15 border border-emerald-500/20 text-white shadow-xl shadow-black/20'
          } border glow-emerald relative overflow-hidden flex flex-col h-32 justify-between cursor-pointer group`}
        >
          <div className="absolute top-4 right-4 text-emerald-400/40 group-hover:text-emerald-400 group-hover:rotate-12 transition-all">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-[9px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest block mb-1`}>Sobra Estimada de Caixa</span>
            <h3 className={`font-mono text-2xl font-black ${theme === 'light' ? 'text-emerald-700' : 'text-white'} tracking-tight leading-none`}>
              {formatCurrency(leftoverCash)}
            </h3>
          </div>
          <div className={`text-[10px] ${theme === 'light' ? 'text-emerald-650' : 'text-emerald-400/80'} font-extrabold uppercase tracking-wider`}>
            Do total de {formatCurrency(totalInflowsSum)}
          </div>
        </motion.div>

        {/* PC Stacked Liabilities Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => setIsPendingDebtListOpen(true)}
          className={`p-6 rounded-3xl ${
            theme === 'light' 
              ? 'bg-white border-slate-205 shadow-md shadow-slate-100/10 text-slate-900 hover:border-indigo-300' 
              : 'bg-slate-950/40 border-white/5 text-white shadow-xl shadow-black/20 hover:border-slate-800'
          } border flex flex-col h-32 justify-between cursor-pointer transition-all`}
        >
          <div>
            <span className={`text-[9px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest block mb-1`}>Total a Pagar Pendente</span>
            <h3 className="font-mono text-2xl font-black text-rose-400 tracking-tight leading-none">
              {formatCurrency(pendingTotalDebt)}
            </h3>
          </div>
          <div className={`text-[10px] ${theme === 'light' ? 'text-slate-450' : 'text-slate-500'} font-extrabold uppercase tracking-wider`}>
            Comprometido: {formatCurrency(totalSpentInMonth)}
          </div>
        </motion.div>
      </div>
    );
  };

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

      {/* Dynamic Floating Due alert matching user logic - Remastered Premium Visual Design */}
      {floatingAlert && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className={`fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[55] p-5 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.15)] flex flex-col gap-4 transition-all border backdrop-blur-xl ${
            theme === 'light'
              ? 'bg-white/95 border-rose-200/80 text-slate-900 shadow-slate-200/50'
              : 'bg-slate-950/95 border-rose-550/30 text-slate-100'
          }`}
        >
          {/* Accent colored indicator line at the top */}
          <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 rounded-full" />

          <div className="flex items-start justify-between w-full gap-3 mt-1">
            <div className="flex gap-3.5 items-start">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-500/15 flex items-center justify-center text-rose-500 shrink-0 relative shadow-inner">
                <span className="absolute inset-0 rounded-2xl bg-rose-500/5 animate-ping opacity-75" />
                <Bell className="w-5 h-5 text-rose-550 relative z-10 animate-swing" />
              </div>
              <div className="space-y-1.5">
                <h5 className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${theme === 'light' ? 'text-rose-600' : 'text-rose-400 font-display'}`}>
                  <span>{floatingAlert.title}</span>
                  <span className="inline-flex items-center rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-500 ring-1 ring-inset ring-rose-500/20">Urgente</span>
                </h5>
                <p className={`text-xs font-bold leading-relaxed pr-1 ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                  {floatingAlert.desc}
                </p>
              </div>
            </div>
            <button
              onClick={() => setFloatingAlert(null)}
              className={`p-1.5 rounded-xl transition-all cursor-pointer text-xs font-bold hover:scale-110 active:scale-95 ${
                theme === 'light' ? 'hover:bg-slate-105 text-slate-500 hover:text-slate-900' : 'hover:bg-white/5 text-slate-500 hover:text-white'
              }`}
              title="Dispensar alerta"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 w-full pt-1.5">
            <button
              onClick={() => setFloatingAlert(null)}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-bold tracking-widest transition-all cursor-pointer text-center uppercase border ${
                theme === 'light' 
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' 
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-300 border-white/5'
              }`}
            >
              AGENDAR DEPOIS
            </button>
            <button
              onClick={() => {
                setActiveTab('fixos');
                handleOpenPay(floatingAlert.id);
                setFloatingAlert(null);
              }}
              className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-450 text-white py-3 rounded-2xl text-[10px] font-black tracking-widest cursor-pointer font-display transition-all text-center uppercase shadow-lg shadow-rose-600/20"
            >
              EFETUAR PAGAMENTO
            </button>
          </div>
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
        className="flex-1 overflow-y-auto h-screen pb-28 lg:pb-28"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 md:py-8 space-y-6">
          {isFirebaseOffline && (
            <div className="p-5 rounded-3xl bg-amber-955/20 border border-amber-500/20 text-text-amber-200 text-xs space-y-3 shadow-xl relative overflow-hidden">
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

          {/* Unified High-Converting Top Header Block (Both PC & Mobile) */}
          <header className={`flex items-center justify-between pb-4 border-b transition-colors duration-300 ${
            theme === 'light' ? 'border-slate-200/80' : 'border-white/5'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center glow-emerald shrink-0">
                <TrendingUp className="w-5.5 h-5.5 text-emerald-400" />
              </div>
              <div>
                <h2 className={`font-display font-black text-[17px] sm:text-lg tracking-tight leading-none ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  FINANÇAS<span className="text-emerald-400 font-extrabold ml-0.5">PRO</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mt-1">Sistema de Gestão Segura</span>
              </div>
            </div>

            {/* Top Right Controls - Pro visual layout */}
            <div className="flex items-center gap-3">
              {/* User profile details (hidden on mobile, ultra elegant on desktop) */}
              <div className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border ${
                theme === 'light' ? 'bg-slate-50 border-slate-200/60 text-slate-705' : 'bg-white/3 border-white/5 text-slate-300'
              }`}>
                <div className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center font-bold text-[11px] shrink-0 select-none ${
                  theme === 'light' ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                }`}>
                  {user.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="min-w-0 pr-1 text-left">
                  <span className="text-[8.5px] uppercase font-bold tracking-wider text-slate-500 block leading-tight">Membro Premium</span>
                  <p className="text-xs font-semibold truncate leading-tight max-w-[150px]" title={user.email || ''}>
                    {user.email || 'Conectado'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenIncome}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  theme === 'light' 
                    ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm' 
                    : 'bg-white/3 hover:bg-white/6 text-slate-200 border border-white/5'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-400" /> Ganhos
              </button>
              
              <button
                onClick={handleUserLogout}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
                  theme === 'light'
                    ? 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700'
                    : 'bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 text-rose-450'
                }`}
                title="Sair da plataforma"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Render Mobile summary cards */}
          {renderSummaryCardsMobile()}

          {/* Ledger Calendar Month Navigator */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-205 shadow-sm text-slate-900' : 'bg-white/3 border-white/5 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleMonthTurn(-1)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-800' 
                    : 'bg-slate-900 border-white/5 hover:border-white/10 text-white'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className={`font-display font-black text-sm tracking-wide select-none min-w-[124px] text-center ${
                theme === 'light' ? 'text-slate-800' : 'text-white'
              }`}>
                {monthsPortuguese[calendarDate.getMonth()].toUpperCase()} {calendarDate.getFullYear()}
              </h4>
              <button
                onClick={() => handleMonthTurn(1)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-800' 
                    : 'bg-slate-900 border-white/5 hover:border-white/10 text-white'
                }`}
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


          {/* Grid Layout that splits screen on PC, but rolls standard single col on Mobile */}
          {activeTab !== 'dashboard' && activeTab !== 'goals' && activeTab !== 'settings' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main lists column */}
              <div className="lg:col-span-8 space-y-4">
                <main className="space-y-4 pt-1">
                  <div className="space-y-3">
                    {activeTabTransactions.length === 0 ? (
                      <div className={`p-12 text-center border border-dashed rounded-3xl text-xs select-none ${
                        theme === 'light' ? 'border-slate-300 text-slate-500 bg-white' : 'border-white/5 text-slate-500'
                      }`}>
                        Sem lançamentos registrados sob "{activeTab.toUpperCase()}" para o mês selecionado.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeTabTransactions.map((tx) => {
                          const categoryObj = activeMonthCategoryList.find(c => c.value === tx.cat) || { icon: '📦', label: tx.cat || 'Outros' };
                          const remDue = tx.amount - (tx.paid_amount || 0);
                          const isPaid = remDue <= 0;

                          return (
                            <div
                              key={tx.id}
                              className={`p-4 rounded-3xl border flex flex-col gap-3.5 transition-all ${
                                theme === 'light' 
                                  ? 'bg-white border-slate-200/80 hover:border-indigo-100 hover:shadow-sm' 
                                  : 'bg-white/2 border border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4 w-full">
                                <div className="flex items-center gap-3.5 min-w-0 cursor-pointer" onClick={() => handleOpenEdit(tx)}>
                                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shadow-sm shrink-0 ${
                                    theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border border-white/5'
                                  }`}>
                                    {categoryObj.icon}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className={`font-display font-bold text-[14.5px] truncate flex items-center gap-1.5 leading-tight ${
                                      theme === 'light' ? 'text-slate-800' : 'text-white'
                                    }`}>
                                      {tx.name} {isPaid && <span className="text-emerald-450 font-sans">✓</span>}
                                      {tx.type === 'fixos' && (
                                        <span className="text-[9.5px] shrink-0 font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Fixo</span>
                                      )}
                                      {tx.type === 'variaveis' && (
                                        <span className="text-[9.5px] shrink-0 font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Variável</span>
                                      )}
                                    </h4>
                                    <p className="text-[11.5px] text-slate-500 mt-1 uppercase font-semibold tracking-wider">
                                      {tx.due || 'Sem vencimento'} • {categoryObj.label} 
                                      {tx.paid_amount > 0 && !isPaid && ` • Parcial: ${formatCurrency(tx.paid_amount)}`}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className={`font-mono text-[14.5px] font-black shrink-0 ${
                                    theme === 'light' ? 'text-slate-900' : 'text-white'
                                  }`}>
                                    {formatCurrency(tx.amount)}
                                  </span>
                                  
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleOpenPay(tx.id)}
                                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase cursor-pointer transition-all ${
                                        isPaid 
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                          : theme === 'light'
                                            ? 'bg-slate-100 hover:bg-slate-205 border border-slate-200 text-slate-700'
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

                              {/* Interactive installment planner p/ user escolher valor no mês */}
                              {tx.type === 'parcelas' && (
                                <div className={`pt-3 border-t border-dashed ${theme === 'light' ? 'border-slate-150' : 'border-white/5'} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
                                  <div className="space-y-0.5">
                                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>Definir quanto pagar este mês</span>
                                    <span className="text-[9px] text-slate-500 font-normal leading-tight block">Modifica o valor a liquidar neste período</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`relative rounded-xl border ${
                                      theme === 'light' ? 'bg-slate-50 border-slate-200 focus-within:border-indigo-400' : 'bg-slate-950/40 border-white/5 focus-within:border-indigo-500'
                                    } transition-all px-3 py-1.5 flex items-center`}>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="R$ 0,00"
                                        value={
                                          installmentInputs[tx.id] !== undefined
                                            ? installmentInputs[tx.id]
                                            : (tx.amount > 0 ? handleMaskMoney(tx.amount.toFixed(2).replace('.', '')) : "R$ 0,00")
                                        }
                                        onChange={(e) => {
                                          const masked = handleMaskMoney(e.target.value);
                                          setInstallmentInputs(prev => ({ ...prev, [tx.id]: masked }));
                                        }}
                                        onBlur={async () => {
                                          const currentValStr = installmentInputs[tx.id] !== undefined
                                            ? installmentInputs[tx.id]
                                            : (tx.amount > 0 ? handleMaskMoney(tx.amount.toFixed(2).replace('.', '')) : "R$ 0,00");
                                          const newVal = handleParseMoney(currentValStr);
                                          if (newVal !== tx.amount) {
                                            const path = `transactions/${tx.id}`;
                                            const updatedTx = { ...tx, amount: newVal, updatedAt: new Date().toISOString() };
                                            try {
                                              await setDoc(doc(db, 'transactions', tx.id), updatedTx);
                                              triggerToast(`Valor a pagar alterado para ${formatCurrency(newVal)}`, 'success');
                                            } catch (err) {
                                              handleFirestoreError(err, OperationType.UPDATE, path);
                                            }
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            (e.currentTarget as HTMLInputElement).blur();
                                          }
                                        }}
                                        className={`w-28 bg-transparent text-right font-mono font-bold text-xs focus:outline-none p-0 leading-none ${
                                          theme === 'light' ? 'text-slate-800' : 'text-slate-100'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </main>
              </div>

              {/* Sidebar metrics persistent column for PC view */}
              <div className="hidden lg:flex flex-col gap-4 lg:col-span-4 sticky top-6">
                {renderSummaryCardsPC()}

                {/* Local Advisory / Quick guidance on PC */}
                <div className={`p-5 rounded-3xl border ${
                  theme === 'light' 
                    ? 'bg-slate-50 border-slate-200 text-slate-600' 
                    : 'bg-white/2 border-white/5 text-slate-400'
                } text-xs space-y-2`}>
                  <p className="font-bold text-indigo-400 uppercase tracking-wider text-[9px] flex items-center gap-1 leading-none">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Dificuldades de caixa?
                  </p>
                  <p className="font-light leading-relaxed text-[11px]">
                    {transactions.length === 0 
                      ? 'Adicione despesas recorrentes e parcelas para auditar suas margens de sobrevivência líquidas.'
                      : leftoverCash < 0 
                        ? 'Alerta crítico: Suas despesas excederam seus ganhos. Tente parcializar faturas ou reduzir despesas variáveis.'
                        : 'Organização em dia! Seu caixa está limpo e suas obrigações orçamentárias estão controladas.'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Dashboard, Goals, Settings screens occupy the full 12 column grid */
            <div className="w-full">
              <main className="space-y-4 pt-1">
                {activeTab === 'dashboard' ? (
                  <DashboardAnalytics
                    transactions={activeMonthTransactions}
                    allTransactions={transactions}
                    currentMonthKey={currentMonthKey}
                    categoriesList={activeMonthCategoryList}
                    totalAvailable={totalInflowsSum}
                    leftover={leftoverCash}
                    income={inc}
                    balance={bal}
                    extra={ext}
                    currentTheme={theme}
                    settings={settings}
                  />
                ) : activeTab === 'goals' ? (
                  <GoalsPanel
                    goals={goals}
                    onCreateGoal={handleCreateGoal}
                    onUpdateGoalProgress={handleUpdateGoalProgress}
                    onDeleteGoal={handleDeleteGoal}
                  />
                ) : (
                  <SettingsPanel
                    currentTheme={theme}
                    onChangeTheme={handleThemeModify}
                    currentCurrency={currency}
                    onChangeCurrency={handleCurrencyModify}
                    baseIncome={inc}
                    baseBalance={bal}
                    onSavePreferences={handlePresetConfigsSave}
                    onSaveAlertSettings={handleUpdateAlertSettings}
                    transactions={transactions}
                    showToast={triggerToast}
                    alertThresholdDays={settings?.alertThresholdDays !== undefined ? settings.alertThresholdDays : 3}
                    settings={settings}
                  />
                )}
              </main>
            </div>
          )}

          {/* Minimalist Visual Balance Spacing */}
          <div className="pt-8 pb-4 text-center text-[10px] text-slate-500 tracking-wide font-medium uppercase opacity-40 select-none">
            FinançasPro • BJC Desenvolvimentos
          </div>
        </div>
      </div>

      {/* Pending Transactions Selection Modal */}
      {isPendingDebtListOpen && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPendingDebtListOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0f1524] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[85vh] space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-rose-400" /> Contas Pendentes do Mês
                  </h4>
                  <p className="text-xs text-slate-400">
                    Selecione qualquer lançamento pendente de {monthsPortuguese[calendarDate.getMonth()]} para dar baixa ou parcelar.
                  </p>
                </div>
                <button
                  onClick={() => setIsPendingDebtListOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-1 space-y-3 max-h-[50vh] min-h-[200px]">
                {activeMonthTransactions.filter(
                  t => (t.type === 'fixos' || t.type === 'variaveis') && (t.paid_amount || 0) < t.amount
                ).length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl text-slate-400 text-xs py-12 flex flex-col items-center justify-center h-full">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mb-3 animate-pulse" />
                    Parabéns! Nenhuma conta pendente para {monthsPortuguese[calendarDate.getMonth()]} de {calendarDate.getFullYear()}. 🎉
                  </div>
                ) : (
                  activeMonthTransactions
                    .filter(t => (t.type === 'fixos' || t.type === 'variaveis') && (t.paid_amount || 0) < t.amount)
                    .map((tx) => {
                      const categoryObj = activeMonthCategoryList.find(c => c.value === tx.cat) || { icon: '📦', label: tx.cat || 'Outros' };
                      const remDue = tx.amount - (tx.paid_amount || 0);

                      return (
                        <div
                          key={tx.id}
                          onClick={() => {
                            setIsPendingDebtListOpen(false);
                            handleOpenPay(tx.id);
                          }}
                          className="p-3.5 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900 hover:border-indigo-500/40 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-base shrink-0">
                              {categoryObj.icon}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-[13px] text-white truncate group-hover:text-indigo-400 transition-colors leading-tight">
                                {tx.name}
                              </h5>
                              <p className="text-[10px] text-slate-450 mt-1 uppercase font-semibold">
                                Vencimento: {tx.due || 'Sem vencimento'} • {categoryObj.label}
                              </p>
                              {tx.paid_amount > 0 && (
                                <p className="text-[9.5px] text-amber-500 font-semibold mt-0.5">
                                  Pago Parcial: {formatCurrency(tx.paid_amount)} (Resta {formatCurrency(remDue)})
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-[13px] font-extrabold text-rose-400 block">
                              {formatCurrency(remDue)}
                            </span>
                            <span className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold group-hover:underline mt-0.5 block">
                              PAGAR ➔
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsPendingDebtListOpen(false)}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/15 text-slate-300 font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Fechar Lista
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

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
        defaultType={(activeTab === 'fixos' || activeTab === 'variaveis' || activeTab === 'parcelas') ? activeTab : 'fixos'}
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
              className="bg-[#0f1524] border border-white/10 w-full max-w-4xl rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div>
                <h4 className="font-display font-extrabold text-base text-white uppercase tracking-wider mb-1">💸 Ganhos da Competência</h4>
                <p className="text-xs text-slate-400">Configure suas rendas básicas, reserva e histórico de rendimentos adicionais.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Col 1: Standard configs */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Configurações Base</div>
                    
                    <div>
                      <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1">Renda Mensal do Mês</label>
                      <input
                        id="income-modal-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="R$ 0,00"
                        value={tempIncomeStr}
                        onChange={(e) => setTempIncomeStr(handleMaskMoney(e.target.value))}
                        className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl font-mono focus:outline-none"
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
                        className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 text-slate-100 text-xs px-4 py-3 rounded-xl font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">Soma Ganhos Extras</label>
                        <span className="text-[8px] bg-emerald-500/15 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Calculadora</span>
                      </div>
                      <input
                        id="extra-modal-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="R$ 0,00"
                        value={tempExtraStr}
                        onChange={(e) => setTempExtraStr(handleMaskMoney(e.target.value))}
                        className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500 text-slate-400 text-xs px-4 py-3 rounded-xl font-mono focus:outline-none"
                        disabled
                      />
                      <p className="text-[8.5px] text-slate-500 leading-relaxed mt-1.5">
                        Esta soma é atualizada de forma automática ao preencher/remover itens do histórico ao lado.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      id="income-modal-save-btn"
                      onClick={handleSaveIncomeConfigs}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Salvar Outros Confis
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsIncomeOpen(false)}
                      className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-slate-450 hover:text-white text-[11px] font-bold cursor-pointer"
                    >
                      Voltar
                    </button>
                  </div>
                </div>

                {/* Col 2: Extras detailed history manager */}
                <div className="lg:col-span-7">
                  <ExtraEarningsManager
                    currentMonthKey={currentMonthKey}
                    extraEarnings={settings?.extraEarnings || []}
                    currentCurrency={settings?.currency || 'BRL'}
                    onAddEarning={handleAddExtraEarning}
                    onDeleteEarning={handleDeleteExtraEarning}
                    showToast={triggerToast}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Logout Elegant Interactive Alert Modal */}
      {isLogoutOpen && (
        <AnimatePresence shadow-none="true">
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 text-center space-y-5 border transition-all ${
                theme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-100/30' 
                  : 'bg-[#0f1524] border-white/10 text-white'
              }`}
            >
              {/* Logout Icon Graphic */}
              <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                theme === 'light'
                  ? 'bg-rose-50 border-rose-100 text-rose-650'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <LogOut className="w-5 h-5" />
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-black text-sm uppercase tracking-wider">
                  Sair do Sistema?
                </h4>
                <p className={`text-xs leading-relaxed ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Ao desconectar, sua sessão segura será imediatamente finalizada e você precisará se autenticar novamente para visualizar o painel das suas economias.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  id="confirm-logout-btn"
                  onClick={executeLogout}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-rose-600/10 active:scale-[0.98] rounded-xl"
                >
                  Sim, Desconectar
                </button>
                <button
                  onClick={() => setIsLogoutOpen(false)}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'bg-slate-900 border-white/10 hover:bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* Global Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 text-center space-y-5 border transition-all ${
                theme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-100/30' 
                  : 'bg-[#0f1524] border-white/10 text-white'
              }`}
            >
              {/* Alert Warning Icon Graphic */}
              <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                theme === 'light'
                  ? 'bg-amber-50 border-amber-100 text-amber-600'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-black text-sm uppercase tracking-wider">
                  {confirmModal.title}
                </h4>
                <p className={`text-xs leading-relaxed ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {confirmModal.message}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  id="confirm-modal-exec-btn"
                  onClick={confirmModal.onConfirm}
                  className={`w-full py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] rounded-xl ${
                    confirmModal.classNameConfirm || 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {confirmModal.confirmText || 'Confirmar'}
                </button>
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'bg-slate-900 border-white/10 hover:bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {confirmModal.cancelText || 'Cancelar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNIFIED FLOATING CHAT / SUPPORT SYSTEM - COMPACT DIRECT ACTION */}
      <div className="fixed bottom-20 right-6 z-45">
        {/* Compact Support Icon Element */}
        <a
          href="https://wa.me/5563992092699?text=Olá!%20Preciso%20de%20ajuda%20ou%20suporte%20no%20FinançasPro."
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 relative border border-emerald-400/20"
          title="Falar com Suporte no WhatsApp"
        >
          <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-60 scale-105" />
          <svg 
            className="w-5.5 h-5.5 text-white relative z-10" 
            fill="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.4 0 9.794-4.394 9.797-9.797.002-2.618-1.015-5.08-2.87-6.935C16.3 2.016 13.834 1 11.207 1 5.801 1 1.405 5.395 1.4 10.799c-.001 1.517.41 3.003 1.192 4.316l-.1.365-.79 2.883 2.95-.773.355-.109zM17.51 14.1c-.322-.162-1.92-.95-2.217-1.058-.297-.107-.514-.162-.73.162-.217.324-.838 1.056-1.027 1.274-.19.216-.378.243-.7.08-.322-.162-1.36-.5-2.593-1.6-.957-.852-1.6-1.9-1.79-2.222-.19-.324-.02-.5-.18-.66-.145-.145-.323-.377-.485-.566-.16-.19-.214-.323-.32-.54-.108-.217-.054-.405-.027-.567.027-.162.217-.514.324-.73.108-.216.162-.351.243-.513.08-.162.04-.324.02-.486-.02-.162-.217-.514-.297-.7-.08-.194-.163-.167-.225-.17a6.3 6.3 0 0 0-.42-.01c-.135 0-.352.05-.536.25-.184.2-.705.69-.705 1.68 0 .99.72 1.94.82 2.072.1.13 1.414 2.16 3.428 3.03.48.207.854.33 1.145.424.482.153.92.13 1.267.08.386-.056 1.18-.48 1.346-.943.165-.46.165-.856.115-.94-.05-.08-.18-.135-.5-.297z"/>
          </svg>
        </a>
      </div>

      {/* UNIFIED FULLY-RESPONSIVE DOCKED BOTTOM BAR (BOTH PC & MOBILE) */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl transition-all duration-300 ${
        theme === 'light' 
          ? 'bg-white/95 border-slate-200/80 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] text-slate-850' 
          : 'bg-[#090d1af5] border-white/5 shadow-[0_-8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      } px-1.5 pb-safe pt-2 flex items-center justify-around h-16`}>
        <div className="max-w-4xl w-full mx-auto flex items-center justify-around h-full">
          {[
            { id: 'dashboard', val: 'Dashboard', icon: LayoutDashboard },
            { id: 'contas', val: 'Fixas', icon: Receipt },
            { id: 'variaveis', val: 'Variados', icon: Coins },
            { id: 'parcelas', val: 'Parcelados', icon: CreditCard },
            { id: 'goals', val: 'Metas', icon: Target },
            { id: 'settings', val: 'Ajustes', icon: Settings }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 cursor-pointer relative group transition-all"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isSelected 
                    ? theme === 'light'
                      ? 'bg-indigo-50 text-indigo-600 scale-110 font-bold' 
                      : 'bg-indigo-500/15 text-indigo-400 scale-110 font-bold'
                    : theme === 'light'
                      ? 'text-slate-500 group-hover:text-slate-800'
                      : 'text-slate-400 group-hover:text-white'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[9.5px] font-black tracking-tight mt-0.5 transition-all ${
                  isSelected 
                    ? theme === 'light' ? 'text-indigo-600 font-extrabold' : 'text-indigo-400 font-extrabold'
                    : theme === 'light' ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'
                }`}>
                  {tab.val}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <OnboardingTutorial 
        theme={theme} 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
        onOpen={() => setIsTutorialOpen(true)} 
      />
    </div>
  );
}
