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
  getDocFromServer,
  updateDoc
} from 'firebase/firestore';
import { Transaction, Category, Goal, Setting, AppNotification, ExtraEarning } from './types';
import AuthScreen from './components/AuthScreen';
import SplashLoader from './components/SplashLoader';
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
  CreditCard,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default built-in categories
const defaultCategories = [
  { icon: '🏠', label: 'Moradia', value: 'moradia' },
  { icon: '🛒', label: 'Mercado', value: 'mercado' },
  { icon: '🥩', label: 'Açougue / Carne', value: 'carne' },
  { icon: '🥖', label: 'Padaria', value: 'padaria' },
  { icon: '🚗', label: 'Transporte', value: 'transporte' },
  { icon: '⛽', label: 'Combustível', value: 'combustivel' },
  { icon: '🏥', label: 'Saúde', value: 'saude' },
  { icon: '💊', label: 'Farmácia', value: 'farmacia' },
  { icon: '📚', label: 'Educação', value: 'educacao' },
  { icon: '✨', label: 'Estética / Beleza', value: 'estetica' },
  { icon: '🎮', label: 'Lazer', value: 'lazer' },
  { icon: '🍽️', label: 'Restaurantes', value: 'restaurante' },
  { icon: '🛵', label: 'Delivery / Ifood', value: 'delivery' },
  { icon: '💳', label: 'Stream', value: 'assinaturas' },
  { icon: '🌐', label: 'Internet', value: 'comunicacao' },
  { icon: '🐾', label: 'Pets', value: 'pet' },
  { icon: '👕', label: 'Roupas', value: 'vestuario' },
  { icon: '🛋️', label: 'Casa / Móveis', value: 'casa' },
  { icon: '📈', label: 'Invest.', value: 'investimento' },
  { icon: '📄', label: 'Taxas / Imposto', value: 'imposto' },
  { icon: '💧', label: 'Água', value: 'agua' },
  { icon: '⚡', label: 'Energia', value: 'energia' },
  { icon: '🔥', label: 'Gás', value: 'gas' },
  { icon: '🎁', label: 'Presentes / Mimo', value: 'presentes' },
  { icon: '✈️', label: 'Viagem', value: 'viagem' },
  { icon: '💳', label: 'Cartão', value: 'cartao font-display' },
  { icon: '📦', label: 'Outros', value: 'outros' }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  
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
  const [activeTab, setActiveTab] = useState<'contas' | 'fixos' | 'variaveis' | 'parcelas' | 'dashboard' | 'goals' | 'settings' | 'admin'>('dashboard');
  
  // Layout and sorting settings for transactions categories (fixos, variaveis, parcelas)
  const [tabLayout, setTabLayout] = useState<'detalhado' | 'lista'>('detalhado');
  const [tabSortBy, setTabSortBy] = useState<'cadastro' | 'nome' | 'valor' | 'vencimento'>('cadastro');
  
  // Custom Toasts and Alerts
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [floatingAlert, setFloatingAlert] = useState<{ id: string; title: string; desc: string; type: string } | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [prevMonthKey, setPrevMonthKey] = useState(currentMonthKey);
  if (currentMonthKey !== prevMonthKey) {
    setPrevMonthKey(currentMonthKey);
    setDismissedAlerts({});
  }

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
    showThreeButtons?: boolean;
    confirmText2?: string;
    classNameConfirm2?: string;
    onConfirm2?: () => void;
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
  const [extraGastoInputs, setExtraGastoInputs] = useState<Record<string, string>>({});
  const [extensionInputs, setExtensionInputs] = useState<Record<string, number>>({});

  // Income parameters custom configuration trigger modal
  const [isIncomeOpen, setIsIncomeOpen] = useState<boolean>(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);
  const [tempIncomeStr, setTempIncomeStr] = useState<string>('');
  const [tempBalanceStr, setTempBalanceStr] = useState<string>('');
  const [tempExtraStr, setTempExtraStr] = useState<string>('');
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState<boolean>(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [celebratedTx, setCelebratedTx] = useState<{ name: string; amount: number } | null>(null);

  // Pull to refresh support variables
  const [startY, setStartY] = useState<number>(0);
  const [pullProgress, setPullProgress] = useState<number>(0);

  const monthsPortuguese = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const VIP_EMAILS = useMemo(() => ['bjcarvalho07@gmail.com', 'msouzacintia600@gmail.com'], []);

  const isVIP = useMemo(() => {
    return !!(user && user.email && VIP_EMAILS.includes(user.email.toLowerCase().trim()));
  }, [user, VIP_EMAILS]);

  const isWithinTwoDaysTrial = useMemo(() => {
    if (!user) return false;
    let creationDateStr = userProfile?.createdAt;
    
    let creationTime = Date.now();
    if (creationDateStr) {
      creationTime = Date.parse(creationDateStr);
    } else if (user.metadata.creationTime) {
      creationTime = Date.parse(user.metadata.creationTime);
    }
    
    const diff = Date.now() - creationTime;
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    return diff >= 0 && diff < twoDaysInMs;
  }, [user, userProfile]);

  const hasActiveSubscription = useMemo(() => {
    if (user && user.email && user.email.toLowerCase().trim() === 'irakellygaby1@icloud.com') {
      return true;
    }
    if (!userProfile) return false;
    
    if (userProfile.assinante !== true || !userProfile.dataVencimento) {
      return false;
    }
    
    const expiryTime = Date.parse(userProfile.dataVencimento);
    if (isNaN(expiryTime)) return false;
    
    return Date.now() <= expiryTime;
  }, [user, userProfile]);

  const hasAccess = isVIP || isWithinTwoDaysTrial || hasActiveSubscription;
  const isBlocked = !!(user && !hasAccess);

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

  // Profile snapshot stream
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    const unsubUserProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      let profileData = docSnap.exists() ? docSnap.data() : null;

      // Auto-liberação de 30 dias para o usuário irakellygaby1@icloud.com
      if (user && user.email && user.email.toLowerCase().trim() === 'irakellygaby1@icloud.com') {
        const targetExpiry = new Date('2026-07-09T23:29:39Z'); // 30 dias a partir de hoje (09/06/2026)
        const currentExpiryStr = profileData?.dataVencimento;
        const hasValidSub = profileData?.assinante === true && currentExpiryStr && Date.parse(currentExpiryStr) >= targetExpiry.getTime();

        if (!hasValidSub) {
          const userRef = doc(db, 'users', user.uid);
          setDoc(userRef, {
            assinante: true,
            dataVencimento: targetExpiry.toISOString(),
            paymentStatus: 'approved',
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            console.error("Erro ao auto-liberar acesso pro irakellygaby1@icloud.com:", err);
          });
        }
      }

      setUserProfile(profileData);
      setLoadingProfile(false);
    }, (error) => {
      console.error("Error reading user profile:", error);
      setLoadingProfile(false);
    });
    return unsubUserProfile;
  }, [user]);

  // Handle subscriber monthly check or update database accordingly
  useEffect(() => {
    if (user && userProfile && !isVIP) {
      if (userProfile.assinante === true && userProfile.dataVencimento) {
        const expiryTime = Date.parse(userProfile.dataVencimento);
        if (!isNaN(expiryTime) && Date.now() > expiryTime) {
          // Expirou! Set assinante: false in DB
          const userRef = doc(db, 'users', user.uid);
          updateDoc(userRef, { assinante: false }).catch((err) => {
            console.error("Erro ao desativar assinante expirado:", err);
          });
        }
      }
    }
  }, [user, userProfile, isVIP]);

  // Handle anti-fraud redirect callbacks
  useEffect(() => {
    const handlePaymentReturn = async () => {
      if (!user) return;
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      const paymentId = urlParams.get('payment_id');

      if (status === 'approved' && paymentId) {
        try {
          const userRef = doc(db, 'users', user.uid);
          
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          const dataVencimento = expiryDate.toISOString();

          await setDoc(userRef, {
            assinante: true,
            dataVencimento: dataVencimento,
            paymentId: paymentId,
            paymentStatus: status,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          triggerToast("Assinatura Ativada! Seu acesso premium foi liberado por 30 dias.", "success");

          // Clear search parameters
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (err) {
          console.error("Erro ao atualizar assinatura por pagamento de retorno:", err);
          triggerToast("Erro ao processar ativação de pagamento no banco de dados.", "error");
        }
      }
    };

    handlePaymentReturn();
  }, [user]);

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
          extras: {},
          monthlyIncome: {},
          monthlyBalance: {},
          extraEarnings: []
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

  // Alert triggers relocated beneath activeMonthTransactions definition for dynamic virtual projection compatibility

  // Toast helper triggers
  function triggerToast(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  }

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

  const getMonthsDiff = (startKey: string, targetKey: string): number => {
    const [startY, startM] = startKey.split('-').map(Number);
    const [targetY, targetM] = targetKey.split('-').map(Number);
    return (targetY - startY) * 12 + (targetM - startM);
  };

  const addMonthsToKey = (monthKey: string, monthsToAdd: number): string => {
    if (!monthsToAdd) return monthKey;
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    const totalMonths = (year * 12 + (month - 1)) + monthsToAdd;
    const newYear = Math.floor(totalMonths / 12);
    const newMonth = (totalMonths % 12) + 1;
    
    return `${newYear}-${String(newMonth).padStart(2, '0')}`;
  };

  const getInstallmentIndex = (tx: Transaction, currentMonth: string): string => {
    if (!tx.installmentsCount) {
      if (tx.target_payoff_month || tx.target_payoff_date) {
        const target = tx.target_payoff_month || (tx.target_payoff_date ? tx.target_payoff_date.substring(0, 7) : '');
        if (target) {
          const [yr, mn] = target.split('-');
          const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          const mIdx = parseInt(mn, 10) - 1;
          const label = mIdx >= 0 && mIdx < 12 ? `${monthNamesShort[mIdx]}/${yr}` : target;
          return `Meta: ${label}`;
        }
      }
      return '';
    }
    
    const masterId = tx.masterId || tx.id;
    // Find all real transactions of this same installment series in the database
    const seriesTransactions = transactions.filter(t => 
      !t.is_skipped &&
      (t.id === masterId || t.masterId === masterId)
    );

    // Filter to find how many have been paid (paid_amount > 0) in months strictly before the current month
    const paidBeforeCurrentMonth = seriesTransactions.filter(t => 
      t.monthKey < currentMonth && 
      (t.paid_amount || 0) > 0
    );
    const countPaidBefore = paidBeforeCurrentMonth.length;

    // Check if the current transaction itself is a paid transaction for this current month
    const isPaidCurrentMonth = tx.paid_amount > 0 || seriesTransactions.some(t => t.monthKey === currentMonth && (t.paid_amount || 0) > 0);

    if (isPaidCurrentMonth) {
      // Find where currentMonth ranks among paid months for this series
      const paidMonths = Array.from(new Set(
        seriesTransactions
          .filter(t => (t.paid_amount || 0) > 0)
          .map(t => t.monthKey)
      )).sort();
      
      const idx = paidMonths.indexOf(currentMonth);
      if (idx !== -1) {
        return `${idx + 1}/${tx.installmentsCount}`;
      }
      return `${countPaidBefore + 1}/${tx.installmentsCount}`;
    } else {
      // It is not paid, so the upcoming installment to pay is (countPaidBefore + 1)
      const nextIndex = countPaidBefore + 1;
      return `${nextIndex}/${tx.installmentsCount}`;
    }
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
    total_parcelado?: number;
    establishment?: string;
    installmentsCount?: number;
  }, forcePaidState?: 'paid' | 'unpaid') => {
    if (!user) return;

    if (!editingTransaction && data.type === 'variaveis' && !forcePaidState) {
      setConfirmModal({
        isOpen: true,
        title: 'Gasto variável já pago?',
        message: `O seu gasto variável "${data.name}" no valor de ${formatCurrency(data.amount)} já está pago ou deseja deixá-lo pendente para quitação posterior?`,
        showThreeButtons: true,
        confirmText: '✔️ Sim, já foi pago',
        confirmText2: '⏳ Não, deixar pendente',
        cancelText: 'Cancelar',
        classNameConfirm: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        classNameConfirm2: 'bg-indigo-600 hover:bg-indigo-700 text-white border-none',
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          handleSaveTransaction(data, 'paid');
        },
        onConfirm2: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          handleSaveTransaction(data, 'unpaid');
        }
      });
      return;
    }

    const docId = editingTransaction ? editingTransaction.id : `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const path = `transactions/${docId}`;
    
    // Merge existing item status if editing
    let fallbackPaid = editingTransaction ? editingTransaction.paid_amount : 0;
    let fallbackPaidAt = editingTransaction ? editingTransaction.paid_at : '';

    if (forcePaidState === 'paid') {
      fallbackPaid = data.amount;
      fallbackPaidAt = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (forcePaidState === 'unpaid') {
      fallbackPaid = 0;
      fallbackPaidAt = '';
    }

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

    if (data.total_parcelado !== undefined) {
      newTx.total_parcelado = data.total_parcelado;
    } else if (editingTransaction?.total_parcelado !== undefined) {
      newTx.total_parcelado = editingTransaction.total_parcelado;
    }

    if (data.establishment !== undefined) {
      newTx.establishment = data.establishment;
    } else if (editingTransaction?.establishment !== undefined) {
      newTx.establishment = editingTransaction.establishment;
    }

    if (data.installmentsCount !== undefined) {
      newTx.installmentsCount = data.installmentsCount;
    } else if (editingTransaction?.installmentsCount !== undefined) {
      newTx.installmentsCount = editingTransaction.installmentsCount;
    }

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
    const isVirtual = id.startsWith('v_');
    let realIdToTarget = id;
    
    if (isVirtual) {
      const lastUnderscore = id.lastIndexOf('_');
      realIdToTarget = id.substring(2, lastUnderscore);
    }

    // Find local reference
    const tx = transactions.find(t => t.id === realIdToTarget || (t.masterId === realIdToTarget && t.monthKey === currentMonthKey));
    const finalTx = tx || (transactions.find(t => t.id === realIdToTarget));
    
    const isRecurringOrInstallment = isVirtual || 
      (finalTx && (finalTx.type === 'fixos' || finalTx.type === 'parcelas' || !!finalTx.masterId));

    if (isRecurringOrInstallment) {
      const masterId = finalTx?.masterId || realIdToTarget;
      const txName = finalTx?.name || 'este lançamento';
      const isInstallment = finalTx?.type === 'parcelas' || (finalTx?.masterId && transactions.find(t => t.id === finalTx.masterId)?.type === 'parcelas');
      const typeLabel = isInstallment ? 'parcelada' : 'fixa recorrente';

      setConfirmModal({
        isOpen: true,
        title: 'Excluir Despesa Recorrente',
        message: `A despesa "${txName}" é uma conta ${typeLabel}. Como você deseja excluí-la?`,
        showThreeButtons: true,
        confirmText: 'Apenas deste mês',
        classNameConfirm: 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold',
        confirmText2: 'Toda a série (Geral)',
        classNameConfirm2: 'bg-rose-600 hover:bg-rose-700 text-white font-bold',
        cancelText: 'Cancelar',
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          if (!user) return;
          
          // Save a skip record for this master in this month
          const skipId = `skip_${masterId}_${currentMonthKey}`;
          const skipTx = {
            id: skipId,
            userId: user.uid,
            name: txName,
            amount: 0,
            paid_amount: 0,
            type: finalTx?.type || 'fixos',
            cat: finalTx?.cat || 'outros',
            due: finalTx?.due || '',
            masterId: masterId,
            monthKey: currentMonthKey,
            is_skipped: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const path = `transactions/${skipId}`;
          try {
            // Delete any existing real doc this month referencing this masterId
            const existingRealDocThisMonth = transactions.find(t => t.monthKey === currentMonthKey && (t.id === masterId || t.masterId === masterId) && t.id !== skipId);
            if (existingRealDocThisMonth) {
              await deleteDoc(doc(db, 'transactions', existingRealDocThisMonth.id));
            }
            
            await setDoc(doc(db, 'transactions', skipId), skipTx);
            triggerToast('Despesa removida apenas para este mês.', 'success');
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, path);
          }
        },
        onConfirm2: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          if (!user) return;
          // Delete master & all instances of this masterId
          const toDelete = transactions.filter(t => t.id === masterId || t.masterId === masterId);
          try {
            for (const docToDelete of toDelete) {
              await deleteDoc(doc(db, 'transactions', docToDelete.id));
            }
            triggerToast('Toda a série e lançamentos recorrentes foram removidos com sucesso.', 'success');
          } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, `transactions/${masterId}`);
          }
        }
      });
    } else {
      // Normal variable transaction (type === 'variaveis')
      const txName = finalTx?.name || 'este lançamento';
      const txAmount = finalTx ? finalTx.amount : 0;
      setConfirmModal({
        isOpen: true,
        title: 'Excluir Gasto Variável',
        message: `Deseja mesmo remover permanentemente a despesa "${txName}" de R$ ${txAmount.toFixed(2).replace('.', ',')}?`,
        confirmText: 'Confirmar Exclusão',
        cancelText: 'Manter Gasto',
        classNameConfirm: 'bg-rose-600 hover:bg-rose-700 text-white font-bold',
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          const path = `transactions/${realIdToTarget}`;
          try {
            await deleteDoc(doc(db, 'transactions', realIdToTarget));
            triggerToast('Gasto excluído com sucesso!', 'success');
          } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, path);
          }
        }
      });
    }
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

    const path = `settings/${user.uid}`;
    try {
      const updatedMonthlyIncome = { ...(settings.monthlyIncome || {}), [currentMonthKey]: incVal };
      const updatedMonthlyBalance = { ...(settings.monthlyBalance || {}), [currentMonthKey]: balVal };
      const updatedExtras = { ...(settings.extras || {}), [currentMonthKey]: extVal };

      await updateDoc(doc(db, 'settings', user.uid), {
        monthlyIncome: updatedMonthlyIncome,
        monthlyBalance: updatedMonthlyBalance,
        extras: updatedExtras
      });
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

    const path = `settings/${user.uid}`;
    try {
      const updatedExtras = { ...(settings.extras || {}), [targetMonthKey]: sumForMonth };
      await updateDoc(doc(db, 'settings', user.uid), {
        extraEarnings: updatedEarningList,
        extras: updatedExtras
      });
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

    const path = `settings/${user.uid}`;
    try {
      const updatedExtras = { ...(settings.extras || {}), [targetMonthKey]: sumForMonth };
      await updateDoc(doc(db, 'settings', user.uid), {
        extraEarnings: updatedEarningList,
        extras: updatedExtras
      });
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
      await updateDoc(doc(db, 'settings', user.uid), { theme: newTheme });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleCurrencyModify = async (newCurrency: 'BRL' | 'USD' | 'EUR') => {
    if (!user || !settings) return;
    setCurrency(newCurrency);
    const path = `settings/${user.uid}`;
    try {
      await updateDoc(doc(db, 'settings', user.uid), { currency: newCurrency });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handlePresetConfigsSave = async (inc: number, bal: number, alertDays?: number) => {
    if (!user || !settings) return;
    const path = `settings/${user.uid}`;
    try {
      const updates: any = { income: inc, balance: bal };
      if (alertDays !== undefined) {
        updates.alertThresholdDays = alertDays;
      }
      await updateDoc(doc(db, 'settings', user.uid), updates);
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
      await updateDoc(doc(db, 'settings', user.uid), {
        emailAlerts,
        whatsappAlerts,
        alertEmail,
        alertPhone
      });
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

    // Normalize real transactions of the current month to correctly use their single-month installment value
    const normalizedRealTransactions = realTransactionsThisMonth.map(t => {
      if (t.type === 'parcelas') {
        const masterId = t.masterId || t.id;
        const masterTx = transactions.find(m => m.id === masterId) || t;
        const extraGasto = masterTx.extra_gasto || 0;

        const totalVal = (t.total_parcelado || t.amount || 0) + extraGasto;
        const count = t.installmentsCount || 1;
        const installmentValue = totalVal / count;
        return {
          ...t,
          amount: t.paid_amount > 0 ? t.paid_amount : installmentValue,
          total_parcelado: totalVal
        };
      }
      return t;
    });

    // Find the absolute earliest month key where the user actually created/wrote a real transaction
    const nonVirtualUserTxs = transactions.filter(t => !t.id.startsWith('v_') && !t.is_skipped && t.monthKey);
    const earliestRealMonthKey = nonVirtualUserTxs.length > 0 
      ? nonVirtualUserTxs.reduce((min, t) => t.monthKey < min ? t.monthKey : min, nonVirtualUserTxs[0].monthKey) 
      : currentMonthKey;

    // If the currently viewed month is strictly before the earliest month they started adding data, show nothing
    if (currentMonthKey < earliestRealMonthKey) {
      return normalizedRealTransactions;
    }

    // 2. Find all unique master transaction templates (fixed and installments) in database
    const masterTransactions = transactions.filter(t => (t.type === 'fixos' || t.type === 'parcelas') && !t.id.startsWith('v_'));
    
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

    const enrichedTransactions = [...normalizedRealTransactions];

    mastersMap.forEach((masterTx) => {
      // Check if there is already a transaction for this month that matches this master
      const exists = normalizedRealTransactions.some(t => {
        if (t.id === masterTx.id) return true;
        if (masterTx.masterId && t.masterId === masterTx.masterId) return true;
        if (t.masterId === masterTx.id) return true;
        if (t.name.trim().toLowerCase() === masterTx.name.trim().toLowerCase()) return true;
        return false;
      });

      if (!exists) {
        const startMonthKey = masterTx.monthKey || (masterTx.createdAt ? masterTx.createdAt.substring(0, 7) : currentMonthKey);
        const monthsDiff = getMonthsDiff(startMonthKey, currentMonthKey);
        
        // Months before the transaction started: do not project
        if (monthsDiff < 0) {
          return;
        }

        // Verify installments bounds for type 'parcelas'
        if (masterTx.type === 'parcelas') {
          const masterId = masterTx.masterId || masterTx.id;
          
          const totalOriginalBase = masterTx.total_parcelado || masterTx.amount || 0;
          const totalExtraGasto = masterTx.extra_gasto || 0;
          const totalOriginal = totalOriginalBase + totalExtraGasto;
          
          const totalPaidAcrossMonths = transactions
            .filter(t => !t.is_skipped && t.type === 'parcelas' && (t.id === masterId || t.masterId === masterId))
            .reduce((sum, t) => sum + (t.paid_amount || 0), 0);
            
          const totalDevedorRestante = Math.max(0, totalOriginal - totalPaidAcrossMonths);

          // 1. Find standard end month key
          let standardEndMonthKey = startMonthKey;
          if (masterTx.installmentsCount) {
            standardEndMonthKey = addMonthsToKey(startMonthKey, masterTx.installmentsCount - 1);
          } else {
            standardEndMonthKey = masterTx.target_payoff_month || (masterTx.target_payoff_date ? masterTx.target_payoff_date.substring(0, 7) : currentMonthKey);
          }

          // 2. Find extended end month key
          const extendedEndMonthKey = addMonthsToKey(standardEndMonthKey, masterTx.extension_months || 0);

          // 3. Is current viewed month within active timeline?
          const isWithinTimeline = currentMonthKey <= extendedEndMonthKey;

          if (totalDevedorRestante <= 0.05) {
            // All installments are already paid and debt is fully settled!
            if (!isWithinTimeline) {
              return; // Outside timeline and paid off: do NOT project more.
            }
          }
        }

        // Create virtual projection
        const virtualId = `v_${masterTx.masterId || masterTx.id}_${currentMonthKey}`;
        
        let defaultAmount = 0;
        if (masterTx.type === 'parcelas') {
          const totalOriginalBase = masterTx.total_parcelado || masterTx.amount || 0;
          const totalExtraGasto = masterTx.extra_gasto || 0;
          const totalOriginal = totalOriginalBase + totalExtraGasto;
          
          if (masterTx.installmentsCount) {
            defaultAmount = totalOriginal / masterTx.installmentsCount;
          } else {
            const standardEndMonthKey = masterTx.target_payoff_month || (masterTx.target_payoff_date ? masterTx.target_payoff_date.substring(0, 7) : currentMonthKey);
            const monthsCount = getMonthsDiff(startMonthKey, standardEndMonthKey) + 1;
            defaultAmount = totalOriginal / Math.max(1, monthsCount);
          }
        } else {
          defaultAmount = masterTx.amount;
        }

        const virtualTx: Transaction = {
          id: virtualId,
          userId: masterTx.userId,
          name: masterTx.name,
          amount: defaultAmount,
          type: masterTx.type, // Keeps original type: 'fixos' or 'parcelas'
          cat: masterTx.cat,
          due: masterTx.due,
          paid_amount: 0,
          paid_at: '',
          masterId: masterTx.masterId || masterTx.id,
          monthKey: currentMonthKey,
          total_parcelado: masterTx.type === 'parcelas' ? ((masterTx.total_parcelado || masterTx.amount) + (masterTx.extra_gasto || 0)) : undefined,
          establishment: masterTx.establishment,
          installmentsCount: masterTx.installmentsCount,
          createdAt: masterTx.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          keep_showing: masterTx.keep_showing,
          extension_months: masterTx.extension_months,
          target_payoff_month: masterTx.target_payoff_month,
          target_payoff_date: masterTx.target_payoff_date
        };
        enrichedTransactions.push(virtualTx);
      }
    });

    return enrichedTransactions.filter(t => !t.is_skipped);
  }, [transactions, currentMonthKey]);

  // Alert triggers: Monitor upcoming / overdue bills due on mounting/ledger updates using activeMonthTransactions (enables virtual/projection compatibility)
  useEffect(() => {
    if (activeMonthTransactions.length === 0) {
      setFloatingAlert(null);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiring: { item: Transaction; diffInDays: number; isOverdue: boolean }[] = [];

    const thresholdDays = settings?.alertThresholdDays !== undefined ? settings.alertThresholdDays : 3;

    activeMonthTransactions.forEach(item => {
      // Avoid alerting if already dismissed by user
      if (dismissedAlerts[item.id]) return;

      const itemAmount = item.amount > 0 ? item.amount : (item.type === 'parcelas' ? (item.installmentsCount ? (item.total_parcelado || 0) / item.installmentsCount : (item.total_parcelado || 0)) : 0);
      const remainingDeficit = itemAmount - (item.paid_amount || 0);

      if (remainingDeficit > 0 && item.due) {
        const dayMatch = item.due.match(/\d+/);
        if (dayMatch) {
          const dueDay = parseInt(dayMatch[0], 10);
          
          // Ensure valid day matching month bounds to prevent rollover errors
          const currentYear = calendarDate.getFullYear();
          const currentMonth = calendarDate.getMonth();
          const maxDays = new Date(currentYear, currentMonth + 1, 0).getDate();
          const safeDueDay = Math.min(Math.max(1, dueDay), maxDays);

          const dueDate = new Date(currentYear, currentMonth, safeDueDay);
          dueDate.setHours(0, 0, 0, 0);

          const diffInMs = dueDate.getTime() - today.getTime();
          const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

          const isOverdue = diffInDays < 0;
          const isWithinUpcomingThreshold = diffInDays >= 0 && diffInDays <= thresholdDays;

          if (isOverdue || isWithinUpcomingThreshold) {
            expiring.push({ item, diffInDays, isOverdue });
          }
        }
      }
    });

    // Sort: Overdue first (oldest first), then upcoming (closest first)
    expiring.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? -1 : 1;
      }
      return a.diffInDays - b.diffInDays;
    });

    // Sync computed bills/alerts with Service Worker cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          reg.active.postMessage({
            type: 'SET_REMINDERS',
            bills: expiring.map(e => ({
              id: e.item.id,
              name: e.item.name,
              due: e.item.due,
              amount: e.item.amount || e.item.total_parcelado || 0
            }))
          });
        }
      }).catch(e => console.warn('SW Ready check failed:', e));
    }

    if (expiring.length > 0) {
      const { item, diffInDays, isOverdue } = expiring[0];
      
      const title = isOverdue ? '🚨 CONTA ATRASADA' : '⚠️ ATENÇÃO - VENCIMENTO';
      const desc = isOverdue
        ? `A despesa "${item.name}" está em ATRASO desde o dia ${item.due} deste mês. Regularize para evitar multas!`
        : `A despesa "${item.name}" está agendada para vencer no dia ${item.due}. Regularize para manter em dia o seu índice de sobras estimadas!`;

      setFloatingAlert({
        id: item.id,
        title,
        desc,
        type: 'vencimento'
      });

      // Browser Web Notifications integration with active visual styling
      if ('Notification' in window && Notification.permission === 'granted') {
        const sessionKey = `financaspro_notified_bill_${item.id}`;
        if (!sessionStorage.getItem(sessionKey)) {
          try {
            const hasServiceWorker = 'serviceWorker' in navigator;
            const notificationTitle = isOverdue ? 'Conta Atrasada!' : 'FinançasPro';
            const notificationOptions = {
              body: isOverdue 
                ? `Atenção: A despesa "${item.name}" está em atraso desde o dia ${item.due}.`
                : `Atenção: A despesa "${item.name}" vence no dia ${item.due}.`,
              icon: '/app_icon.png',
              badge: '/app_icon.png',
              vibrate: [200, 100, 200],
              tag: `financaspro-bill-${item.id}`,
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
  }, [activeMonthTransactions, calendarDate, settings?.alertThresholdDays, settings, dismissedAlerts]);

  const activeTabTransactions = useMemo(() => {
    let filtered: Transaction[] = [];
    if (activeTab === 'contas') {
      filtered = activeMonthTransactions.filter(t => t.type === 'fixos');
    } else {
      filtered = activeMonthTransactions.filter(t => t.type === activeTab);
    }

    const parseDueDay = (dueStr: string): number => {
      if (!dueStr) return 99;
      const num = parseInt(dueStr.replace(/\D/g, ''), 10);
      return isNaN(num) ? 99 : num;
    };

    const sorted = [...filtered];
    if (tabSortBy === 'nome') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else if (tabSortBy === 'valor') {
      sorted.sort((a, b) => b.amount - a.amount);
    } else if (tabSortBy === 'vencimento') {
      sorted.sort((a, b) => parseDueDay(a.due) - parseDueDay(b.due));
    }
    return sorted;
  }, [activeMonthTransactions, activeTab, tabSortBy]);

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
  const leftoverCash = totalInflowsSum - totalSpentInMonth;

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
    if (activeTab === 'goals' || activeTab === 'settings' || activeTab === 'admin') {
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

  const isLoadingAll = loadingUser || (user ? loadingProfile : false);

  if (isLoadingAll) {
    return <SplashLoader />;
  }

  if (!user) {
    return <AuthScreen onSuccess={() => window.location.reload()} showToast={triggerToast} />;
  }

  if (user && isBlocked) {
    return (
      <div className={`min-h-screen w-full flex flex-col justify-between p-4 md:p-8 bg-[#070a13] bg-[radial-gradient(circle_at_50%_0%,#152039_0%,#070a13_100%)] overflow-y-auto ${
        theme === 'light' ? 'bg-[#f4f7fa]' : 'bg-[#070a13]'
      }`}>
        
        {/* Header bar across the access screen */}
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-4 border-b border-white/5 mb-6 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center glow-emerald shadow-emerald-500/10 shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-display font-extrabold text-[17px] tracking-tight text-white leading-none">
                FINANÇAS<span className="text-emerald-400 font-black ml-0.5">PRO</span>
              </span>
              <span className="text-[8.5px] text-slate-500 font-extrabold uppercase tracking-widest block leading-tight mt-0.5">Gestão de Caixa Seguro</span>
            </div>
          </div>

          <button
            onClick={executeLogout}
            className="px-4 py-2 rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wider text-rose-450 hover:text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da Conta
          </button>
        </div>

        {/* Blocker Main Content */}
        <div className="w-full max-w-xl mx-auto py-4 flex-1 flex flex-col justify-center animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 md:p-8 rounded-3xl bg-[#090e1b] border border-white/5 shadow-2xl relative overflow-hidden"
          >
            {/* Background absolute glowing effect */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-6">
              <span className="text-[10px] text-amber-450 font-extrabold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-4 animate-pulse">
                <AlertCircle className="w-4 h-4 text-amber-450" /> Período de Teste Encerrado
              </span>
              
              <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight leading-snug">
                Seu período de acesso terminou. Deseja continuar usando o sistema?
              </h2>
              
              <p className="text-xs text-slate-400 mt-2.5 font-light leading-relaxed max-w-md mx-auto">
                Não perca a organização e as projeções automatizadas de fluxo do seu caixa. Ative sua assinatura corporativa premium e garanta seu acesso contínuo.
              </p>
            </div>

            {/* Urgency batch section */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Lote Promocional: Apenas para os 10 primeiros assinantes!
                </h4>
                <p className="text-[10.5px] text-amber-450 leading-relaxed font-semibold">
                  Aproveite o preço promocional com mais de 60% de desconto definitivo.
                </p>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="py-6 px-4 md:px-8 rounded-2xl bg-slate-950/40 border border-white/5 text-center mb-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                Melhor Custo-Benefício
              </div>
              
              <div className="flex justify-center items-baseline gap-2 mt-2">
                <span className="text-xs text-slate-500 line-through font-bold">R$ 32,99/mês</span>
                <span className="text-[11px] text-slate-400 font-bold">por apenas</span>
              </div>
              
              <div className="flex justify-center items-baseline gap-1 mt-1">
                <span className="text-emerald-450 font-black text-lg">R$</span>
                <span className="text-4xl font-extrabold text-white tracking-tight leading-none">11,99</span>
                <span className="text-slate-400 text-xs font-bold">/ mês</span>
              </div>

              <p className="text-[10.5px] mt-2.5 text-slate-550 font-medium uppercase tracking-wider">
                Recorrente mensal • Sem fidelidade ou taxas de cancelamento
              </p>
            </div>

            {/* CTA action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowPaymentInfoModal(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-750 hover:from-emerald-500 hover:to-emerald-650 text-white font-extrabold py-4 px-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/15 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                Ativar Meu Acesso Premium
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={executeLogout}
                className="w-full text-xs text-slate-500 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none mt-2"
              >
                ← Voltar para login com outra conta
              </button>
            </div>

            {/* Trust Footer Badges */}
            <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pagamento 100% Protegido pelo Mercado Pago
            </div>
          </motion.div>
        </div>

        {/* Floating high-converting footer credit note */}
        <div className="mt-8 text-center select-none text-[9px] text-slate-500 hover:text-slate-400 uppercase tracking-widest font-black transition-all">
          BJC DESENVOLVIMENTOS • FINANÇASPRO premium
        </div>

        {showPaymentInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-45"
              onClick={() => setShowPaymentInfoModal(false)}
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0f1524] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-50 flex flex-col space-y-4 text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] text-amber-450 font-extrabold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3 text-amber-450" /> Vagas Limitadas
                  </span>
                  <h4 className="font-display font-black text-base text-white tracking-tight leading-snug mt-1.5">
                    Oferta de Lançamento Limitada
                  </h4>
                </div>
                <button
                  onClick={() => setShowPaymentInfoModal(false)}
                  className="p-1 px-2 rounded-lg bg-slate-900 border border-white/10 text-slate-450 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-450 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[10.5px] font-black uppercase text-amber-400 tracking-wider leading-none">
                      Lote Promocional de Estreia
                    </h5>
                    <p className="text-[9.5px] text-amber-300 font-semibold mt-1">
                      10 primeiras assinaturas garantem o valor especial de 11,99 mensal após o preenchimento das vagas promocionais, novas assinaturas serão realizadas pelo valor regular do plano.
                    </p>
                  </div>
                </div>

                <div className="space-y-0.5 bg-slate-950/50 p-2.5 rounded-xl border border-white/5 text-center">
                  <p className="text-[9.5px] text-slate-500 font-black uppercase tracking-wider">Você garante o valor de:</p>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-slate-450 line-through font-bold">R$ 32,99</span>
                    <span className="text-lg font-black text-emerald-400">R$ 11,99</span>
                    <span className="text-[9.5px] text-slate-400 font-semibold">/ mês</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-normal font-light">
                  As <strong className="font-bold text-white">10 primeiras assinaturas</strong> garantem o valor especial de <strong className="font-bold text-emerald-400">R$ 11,99 mensal</strong>. Após o preenchimento das vagas promocionais, novas assinaturas serão realizadas pelo valor regular do plano.
                </p>
              </div>

              <div className="flex gap-2.5 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setShowPaymentInfoModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/10 text-slate-400 font-bold uppercase tracking-wider transition-colors cursor-pointer text-[10px]"
                >
                  Voltar
                </button>
                <a
                  href="https://mpago.la/1SfRUJ2"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowPaymentInfoModal(false)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-4 rounded-xl uppercase tracking-wider shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-1 cursor-pointer border-none text-[10px] no-underline"
                >
                  Ir para o Pagamento
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
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
              onClick={() => {
                if (floatingAlert) {
                  setDismissedAlerts(prev => ({ ...prev, [floatingAlert.id]: true }));
                }
                setFloatingAlert(null);
              }}
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
              onClick={() => {
                if (floatingAlert) {
                  setDismissedAlerts(prev => ({ ...prev, [floatingAlert.id]: true }));
                }
                setFloatingAlert(null);
              }}
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
              <div className="min-w-0">
                <h2 className={`font-display font-black text-[17px] sm:text-lg tracking-tight leading-none ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  FINANÇAS<span className="text-emerald-400 font-extrabold ml-0.5">PRO</span>
                </h2>
                {isVIP ? (
                  <span className="inline-flex items-center gap-1 text-[9.5px] text-emerald-400 font-extrabold uppercase tracking-wider block mt-1">
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" /> Membro VIP
                  </span>
                ) : hasActiveSubscription ? (
                  <span className="inline-flex items-center gap-1 text-[9.5px] text-indigo-400 font-extrabold uppercase tracking-wider block mt-1">
                    <CheckCircle className="w-3 h-3 text-indigo-400 shrink-0" /> Assinante PRO
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9.5px] text-amber-500 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500 shrink-0" /> Conta Grátis
                    </span>
                    <button
                      onClick={() => setShowPaymentInfoModal(true)}
                      className="text-[8px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-0.5 ml-1"
                    >
                      Assinar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Top Right Controls - Pro visual layout */}
            <div className="flex items-center gap-3">
              {/* Hot button to subscribe for desktop trial accounts */}
              {isWithinTwoDaysTrial && !isVIP && !hasActiveSubscription && (
                <button
                  onClick={() => setShowPaymentInfoModal(true)}
                  className="hidden md:flex px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white items-center gap-2 cursor-pointer border border-emerald-500/25 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> Ativar Premium (PRO)
                </button>
              )}

              {/* User profile details (hidden on mobile, ultra elegant on desktop) */}
              <div className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border ${
                theme === 'light' ? 'bg-slate-50 border-slate-200/60 text-slate-705' : 'bg-white/3 border-white/5 text-slate-300'
              }`}>
                <div className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center font-bold text-[11px] shrink-0 select-none ${
                  isVIP 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : hasActiveSubscription
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {user.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="min-w-0 pr-1 text-left">
                  <span className={`text-[8.5px] uppercase font-black tracking-wider block leading-tight ${
                    isVIP 
                      ? 'text-emerald-400' 
                      : hasActiveSubscription
                      ? 'text-indigo-400'
                      : 'text-amber-500'
                  }`}>
                    {isVIP ? '👑 Membro VIP' : hasActiveSubscription ? '⭐ Assinante PRO' : '⚡ Conta Grátis'}
                  </span>
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
          {activeTab !== 'dashboard' && activeTab !== 'contas' && activeTab !== 'variaveis' && activeTab !== 'parcelas' && activeTab !== 'fixos' && renderSummaryCardsMobile()}

          {/* If on dashboard or transaction list tabs, render the two cards side-by-side above the month selector */}
          {(activeTab === 'dashboard' || activeTab === 'contas' || activeTab === 'variaveis' || activeTab === 'parcelas' || activeTab === 'fixos') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Card 1: Sobra Estimada de Caixa */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={handleOpenIncome}
                className={`p-5 rounded-3xl ${
                  theme === 'light' 
                    ? 'bg-gradient-to-br from-[#f0fdf4] to-white border-slate-205 text-slate-900 shadow-md shadow-emerald-100/10 hover:border-emerald-350' 
                    : 'bg-gradient-to-br from-[#0c2617]/50 to-slate-950/20 border border-emerald-500/15 text-white shadow-xl hover:border-emerald-500/35'
                } border flex items-center justify-between cursor-pointer transition-all group`}
              >
                <div>
                  <span className={`text-[10px] font-black ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest block mb-1`}>
                    💎 Sobra Estimada de Caixa
                  </span>
                  <h3 className={`font-mono text-2xl font-black ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-450'} tracking-tight leading-none`}>
                    {formatCurrency(leftoverCash)}
                  </h3>
                  <span className={`text-[10px] ${theme === 'light' ? 'text-emerald-600 font-bold' : 'text-emerald-400/80'} block font-bold uppercase tracking-wider mt-1.5`}>
                    Do total disponível de {formatCurrency(totalInflowsSum)}
                  </span>
                </div>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  theme === 'light' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
              </motion.div>

              {/* Card 2: Total a Pagar Pendente */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setIsPendingDebtListOpen(true)}
                className={`p-5 rounded-3xl ${
                  theme === 'light' 
                    ? 'bg-white border-slate-205 shadow-md shadow-slate-100/10 text-slate-900 hover:border-indigo-305' 
                    : 'bg-slate-950/40 border border-white/5 text-white shadow-xl hover:border-slate-800'
                } border flex items-center justify-between cursor-pointer transition-all group`}
              >
                <div>
                  <span className={`text-[10px] font-black ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest block mb-1`}>
                    💸 Total a Pagar Pendente
                  </span>
                  <h3 className="font-mono text-2xl font-black text-rose-450 tracking-tight leading-none">
                    {formatCurrency(pendingTotalDebt)}
                  </h3>
                  <span className={`text-[10px] ${theme === 'light' ? 'text-slate-450 font-bold' : 'text-slate-500'} block font-bold uppercase tracking-wider mt-1.5`}>
                    Comprometido do mês: {formatCurrency(totalSpentInMonth)}
                  </span>
                </div>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  theme === 'light' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
              </motion.div>
            </div>
          )}

          {/* Ledger Calendar Month Navigator */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-205 shadow-sm text-slate-900' : 'bg-white/3 border-white/5 text-white'
          } mb-4`}>
            {/* Centered Month Navigator alignment */}
            <div className={`flex items-center gap-3 ${(activeTab === 'dashboard' || activeTab === 'contas' || activeTab === 'variaveis' || activeTab === 'parcelas' || activeTab === 'fixos') ? 'mx-auto md:translate-x-[48px]' : ''}`}>
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
              <h4 className={`font-display font-black text-sm uppercase tracking-widest select-none min-w-[200px] text-center ${
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

            {/* Novo button showing only for lists or offset container */}
            {(activeTab === 'contas' || activeTab === 'variaveis' || activeTab === 'parcelas' || activeTab === 'fixos') ? (
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setIsAddOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold leading-none select-none flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15"
              >
                <Plus className="w-4 h-4" /> Novo
              </button>
            ) : (
              <div className="hidden md:block w-24 shrink-0" />
            )}
          </div>


          {/* Grid Layout that splits screen on PC, but rolls standard single col on Mobile */}
          {activeTab !== 'dashboard' && activeTab !== 'goals' && activeTab !== 'settings' && activeTab !== 'admin' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main lists column */}
              <div className="lg:col-span-8 space-y-4">
                <main className="space-y-4 pt-1">
                  {/* Controls Bar for layout style and sorting */}
                  <div className={`p-3 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
                    theme === 'light' 
                      ? 'bg-slate-50/50 border-slate-200/60 shadow-xs' 
                      : 'bg-white/2 border-white/5'
                  }`}>
                    {/* Left: layout switcher */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider mr-1 shrink-0 ${
                        theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        Layout:
                      </span>
                      <button
                        onClick={() => setTabLayout('detalhado')}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          tabLayout === 'detalhado' 
                            ? theme === 'light' 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : theme === 'light' 
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200' 
                              : 'bg-white/3 hover:bg-white/8 text-slate-400'
                        }`}
                      >
                        📊 Detalhado
                      </button>
                      <button
                        onClick={() => setTabLayout('lista')}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          tabLayout === 'lista' 
                            ? theme === 'light' 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : theme === 'light' 
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200' 
                              : 'bg-white/3 hover:bg-white/8 text-slate-400'
                        }`}
                      >
                        📋 Lista Simples
                      </button>
                    </div>

                    {/* Right: sorting options */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider mr-1 shrink-0 ${
                        theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        Ordenar:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {([
                          { id: 'cadastro', label: '⭐ Padrão' },
                          { id: 'nome', label: '🔤 Nome' },
                          { id: 'valor', label: '💰 Valor' },
                          { id: 'vencimento', label: '📅 Dia' }
                        ] as const).map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setTabSortBy(opt.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              tabSortBy === opt.id 
                                ? theme === 'light'
                                  ? 'bg-indigo-50 text-indigo-600 font-extrabold border border-indigo-200'
                                  : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                                : theme === 'light' 
                                  ? 'bg-transparent border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-150/50' 
                                  : 'bg-transparent border border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

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

                          if (tabLayout === 'lista') {
                            return (
                              <div
                                key={tx.id}
                                className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                                  theme === 'light' 
                                    ? 'bg-white border-slate-200/80 hover:border-indigo-155 hover:shadow-xs' 
                                    : 'bg-white/2 border border-white/5 hover:border-white/10'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 w-full animate-fadeIn">
                                  <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => handleOpenEdit(tx)}>
                                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-base shadow-sm shrink-0 ${
                                      theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border border-white/5'
                                    }`}>
                                      {categoryObj.icon}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className={`font-display font-bold text-[13.5px] truncate flex items-center gap-1.5 leading-none ${
                                        theme === 'light' ? 'text-slate-800' : 'text-white'
                                      }`}>
                                        {tx.name} {isPaid && <span className="text-emerald-450 font-sans font-black">✓</span>}
                                        {tx.type === 'fixos' && (
                                          <span className="text-[8.5px] shrink-0 font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">Fixo</span>
                                        )}
                                        {tx.type === 'variaveis' && (
                                          <span className="text-[8.5px] shrink-0 font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/10">Variável</span>
                                        )}
                                        {tx.type === 'parcelas' && (
                                          <span className="text-[8.5px] shrink-0 font-extrabold uppercase px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-500 border border-pink-500/10">
                                            Parcela {getInstallmentIndex(tx, currentMonthKey) || 'Ativa'}
                                          </span>
                                        )}
                                      </h4>
                                      <p className="text-[10px] text-slate-550/90 font-medium truncate mt-0.5 flex flex-wrap items-center gap-1">
                                        <span>{categoryObj.label} • {formatCurrency(tx.amount)}</span>
                                        {tx.establishment && (
                                          <span className="text-indigo-400 font-bold ml-1">🏢 {tx.establishment}</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => handleOpenPay(tx.id)}
                                      className={`px-2.5 py-1 rounded-md text-[9.5px] font-black tracking-wider uppercase cursor-pointer transition-all ${
                                        isPaid 
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                          : theme === 'light'
                                            ? 'bg-slate-100 hover:bg-slate-205 border border-slate-200 text-slate-705'
                                            : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5'
                                      }`}
                                    >
                                      {isPaid ? 'PAGO' : 'PAGAR'}
                                    </button>

                                    <button
                                      onClick={() => handleDeleteTransaction(tx.id)}
                                      className="w-7 h-7 rounded-md bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/5 text-rose-400 flex items-center justify-center cursor-pointer transition-colors text-[10px]"
                                      title="Deletar lançamento"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>

                                {/* Legend underneath paid accounts */}
                                <div className={`pt-1.5 border-t border-dashed ${
                                  theme === 'light' ? 'border-slate-100' : 'border-white/5'
                                } flex items-center justify-between gap-1.5`}>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px]">{isPaid ? '🟢' : '🟡'}</span>
                                    <span className={`text-[9.5px] font-extrabold uppercase tracking-wider ${
                                      isPaid 
                                        ? theme === 'light' ? 'text-emerald-700/90' : 'text-emerald-400'
                                        : theme === 'light' ? 'text-amber-600/90' : 'text-amber-500'
                                    }`}>
                                      {isPaid 
                                        ? tx.paid_at ? `Pago no dia ${tx.paid_at}` : 'Pago (Liquidado)'
                                        : `Aguardando • Vencimento: ${tx.due || 'Sem data'}`
                                      }
                                    </span>
                                  </div>
                                  {tx.paid_amount > 0 && !isPaid && (
                                    <span className="text-[9.5px] font-black uppercase text-amber-500">
                                      Parcial: {formatCurrency(tx.paid_amount)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          // DETALHADO (Detailed style)
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
                                      {tx.type === 'parcelas' && (
                                        <span className="text-[9.5px] shrink-0 font-extrabold uppercase px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                          Parcela {getInstallmentIndex(tx, currentMonthKey) || 'Ativa'}
                                        </span>
                                      )}
                                    </h4>
                                    <p className="text-[11.5px] text-slate-500 mt-1 uppercase font-semibold tracking-wider flex flex-wrap items-center gap-1">
                                      <span>{tx.due || 'Sem vencimento'} • {categoryObj.label}</span>
                                      {tx.establishment && (
                                        <span className="text-indigo-400 font-bold ml-1">🏢 {tx.establishment}</span>
                                      )}
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
                                            ? 'bg-slate-100 hover:bg-slate-205 border border-slate-200 text-slate-707'
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

                              {/* Detailed payment status legend */}
                              <div className={`pt-2 border-t border-dashed ${
                                theme === 'light' ? 'border-slate-150' : 'border-white/5'
                              } flex flex-wrap items-center justify-between gap-2`}>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs shrink-0">{isPaid ? '🟢' : '🟡'}</span>
                                  <span className={`text-[10.5px] font-bold uppercase tracking-wider ${
                                    isPaid 
                                      ? theme === 'light' ? 'text-emerald-700/95' : 'text-emerald-400'
                                      : theme === 'light' ? 'text-amber-600/95' : 'text-amber-500/90'
                                  }`}>
                                    {isPaid 
                                      ? tx.paid_at ? `Pago no dia ${tx.paid_at}` : 'Pago (Liquidado)'
                                      : `Aguardando Pagamento • Vencimento: ${tx.due || 'Sem data'}`
                                    }
                                  </span>
                                </div>
                                {tx.paid_amount > 0 && !isPaid && (
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                    theme === 'light' ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                  }`}>
                                    Pago Parcial: {formatCurrency(tx.paid_amount)}
                                  </span>
                                )}
                              </div>

                              {/* Interactive installment planner p/ user escolher valor no mês */}
                              {tx.type === 'parcelas' && (() => {
                                // Calculate dynamic remaining debt
                                const masterId = tx.masterId || tx.id;
                                const masterTx = transactions.find(t => t.id === masterId) || tx;
                                const totalOriginalBase = masterTx.total_parcelado || masterTx.amount || 0;
                                const totalExtraGasto = masterTx.extra_gasto || 0;
                                const totalOriginal = totalOriginalBase + totalExtraGasto;
                                
                                // Sum all payments in type 'parcelas' that belong to this system
                                const totalPaidAcrossMonths = transactions
                                  .filter(t => t.type === 'parcelas' && (t.id === masterId || t.masterId === masterId))
                                  .reduce((sum, t) => sum + (t.paid_amount || 0), 0);
                                  
                                const totalDevedorRestante = Math.max(0, totalOriginal - totalPaidAcrossMonths);

                                const startMonthKey = masterTx.monthKey || (masterTx.createdAt ? masterTx.createdAt.substring(0, 7) : currentMonthKey);
                                const monthsDiff = getMonthsDiff(startMonthKey, currentMonthKey);

                                const handleLancarPagamento = async () => {
                                  const currentValStr = installmentInputs[tx.id] !== undefined
                                    ? installmentInputs[tx.id]
                                    : "R$ 0,00";
                                  const newVal = handleParseMoney(currentValStr);
                                  if (newVal <= 0) return;

                                  const idxStr = getInstallmentIndex(tx, currentMonthKey) || '';

                                  const executePayment = async () => {
                                    const finishedPaying = newVal > 0;
                                    const updatedTx = { 
                                      ...tx, 
                                      amount: newVal,
                                      paid_amount: newVal, 
                                      paid_at: finishedPaying ? new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
                                      updatedAt: new Date().toISOString() 
                                    };
                                    const path = `transactions/${tx.id}`;
                                    try {
                                      await setDoc(doc(db, 'transactions', tx.id), updatedTx);
                                      setInstallmentInputs(prev => ({ ...prev, [tx.id]: "R$ 0,00" }));
                                      
                                      // Check if this was the last remaining installment of the plan!
                                      const finalRemaining = totalDevedorRestante - newVal;
                                      const isLastIdx = idxStr ? (idxStr.split('/')[0] === idxStr.split('/')[1] || idxStr.split('/')[0] === String(tx.installmentsCount)) : false;
                                      
                                      if (isLastIdx || finalRemaining <= 0.05) {
                                        setCelebratedTx({ name: tx.name, amount: totalOriginalBase });
                                        setShowCelebrationModal(true);
                                      } else {
                                        triggerToast(`Pagamento de ${formatCurrency(newVal)} lançado com sucesso!`, 'success');
                                      }
                                    } catch (err) {
                                      handleFirestoreError(err, OperationType.UPDATE, path);
                                    }
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                  };

                                  setConfirmModal({
                                    isOpen: true,
                                    title: '❓ Confirmar Parcela',
                                    message: `Este valor de ${formatCurrency(newVal)} é referente ao pagamento de uma das parcelas do parcelamento "${tx.name}" (${idxStr ? `Parcela ${idxStr}` : 'parcela'})? Ao confirmar, daremos baixa nesta parcela.`,
                                    confirmText: 'Sim, dar baixa na parcela',
                                    cancelText: 'Cancelar',
                                    classNameConfirm: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                                    onConfirm: executePayment
                                  });
                                };

                                const handleManterMostrando = async () => {
                                  const path = `transactions/${masterId}`;
                                  try {
                                    const docRef = doc(db, 'transactions', masterId);
                                    await updateDoc(docRef, {
                                      keep_showing: true,
                                      updatedAt: new Date().toISOString()
                                    });
                                    triggerToast(`Gasto "${tx.name}" mantido ativo com sucesso e sem avisos!`, 'success');
                                  } catch (err) {
                                    handleFirestoreError(err, OperationType.UPDATE, path);
                                  }
                                };

                                const handleQuitarTudo = () => {
                                  const newVal = totalDevedorRestante;
                                  if (newVal <= 0) return;

                                  const executePayment = async () => {
                                    const updatedTx = { 
                                      ...tx, 
                                      amount: newVal,
                                      paid_amount: newVal, 
                                      paid_at: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                      updatedAt: new Date().toISOString() 
                                    };
                                    const path = `transactions/${tx.id}`;
                                    try {
                                      await setDoc(doc(db, 'transactions', tx.id), updatedTx);
                                      triggerToast(`Quitação efetuada! Pagamento de ${formatCurrency(newVal)} lançado com sucesso.`, 'success');
                                      
                                      setCelebratedTx({ name: tx.name, amount: totalOriginalBase });
                                      setShowCelebrationModal(true);
                                    } catch (err) {
                                      handleFirestoreError(err, OperationType.UPDATE, path);
                                    }
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                  };

                                  setConfirmModal({
                                    isOpen: true,
                                    title: '💰 Quitar Lançamento',
                                    message: `Você deseja pagar todo o saldo devedor restante de ${formatCurrency(newVal)} para o parcelamento "${tx.name}"? Isso liquidará totalmente a dívida.`,
                                    confirmText: 'Sim, quitar valor total',
                                    cancelText: 'Cancelar',
                                    classNameConfirm: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                                    onConfirm: executePayment
                                  });
                                };
                                
                                const standardEndMonthKey = masterTx.installmentsCount 
                                  ? addMonthsToKey(startMonthKey, masterTx.installmentsCount - 1)
                                  : (masterTx.target_payoff_month || (masterTx.target_payoff_date ? masterTx.target_payoff_date.substring(0, 7) : currentMonthKey));
                                
                                const extendedEndMonthKey = addMonthsToKey(standardEndMonthKey, masterTx.extension_months || 0);
                                const isDeadlineEnded = currentMonthKey > extendedEndMonthKey;

                                return (
                                  <div className={`pt-3.5 border-t border-dashed ${theme === 'light' ? 'border-slate-150' : 'border-white/5'} flex flex-col gap-4 mt-1.5 p-4 rounded-2xl ${
                                    theme === 'light' ? 'bg-indigo-50/20 border border-slate-200' : 'bg-indigo-950/10 border border-white/5'
                                  }`}>
                                    {/* Warn end of installment count or payoff target period */}
                                    {isDeadlineEnded && totalDevedorRestante > 0.05 && !masterTx.keep_showing && (
                                      <div className={`p-4 rounded-2xl border ${
                                        theme === 'light' 
                                          ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-md shadow-amber-100/30' 
                                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                                      } flex flex-col gap-3.5 ml-0`}>
                                        <div className="flex items-start gap-2.5">
                                          <span className="text-base shrink-0">⚠️</span>
                                          <div className="space-y-1">
                                            <h5 className="font-display font-extrabold text-xs uppercase tracking-wider">
                                              Prazo de planejamento encerrado!
                                            </h5>
                                            <p className="text-[11.5px] leading-relaxed opacity-95">
                                              O prazo determinado para este controle ({masterTx.installmentsCount ? `${masterTx.installmentsCount} meses` : `Meta ${standardEndMonthKey}`}) finalizou, porém ainda resta um saldo pendente de <strong className="font-bold">{formatCurrency(totalDevedorRestante)}</strong>.
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-dashed border-amber-500/20">
                                          <div className="flex items-center gap-2 bg-black/10 p-1.5 rounded-xl border border-amber-500/5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 pl-1">Mais meses:</span>
                                            <div className="flex items-center gap-1">
                                              <button 
                                                onClick={() => setExtensionInputs(prev => ({ ...prev, [tx.id]: Math.max(1, (prev[tx.id] || 3) - 1) }))}
                                                className={`w-6 h-6 rounded text-xs font-bold font-mono shrink-0 cursor-pointer border-none flex items-center justify-center ${
                                                  theme === 'light' ? 'bg-amber-100 hover:bg-amber-200 text-amber-955' : 'bg-slate-800 hover:bg-slate-705 text-slate-200'
                                                }`}
                                              >
                                                -
                                              </button>
                                              <span className="w-8 text-center text-xs font-extrabold font-mono text-amber-500">
                                                {extensionInputs[tx.id] || 3}
                                              </span>
                                              <button 
                                                onClick={() => setExtensionInputs(prev => ({ ...prev, [tx.id]: (prev[tx.id] || 3) + 1 }))}
                                                className={`w-6 h-6 rounded text-xs font-bold font-mono shrink-0 cursor-pointer border-none flex items-center justify-center ${
                                                  theme === 'light' ? 'bg-amber-100 hover:bg-amber-200 text-amber-955' : 'bg-slate-800 hover:bg-slate-705 text-slate-200'
                                                }`}
                                              >
                                                +
                                              </button>
                                            </div>
                                            <button
                                              onClick={async () => {
                                                const path = `transactions/${masterId}`;
                                                const countToAdd = extensionInputs[tx.id] || 3;
                                                try {
                                                  const currentExt = masterTx.extension_months || 0;
                                                  const newExt = currentExt + countToAdd;
                                                  const docRef = doc(db, 'transactions', masterId);
                                                  await updateDoc(docRef, {
                                                    extension_months: newExt,
                                                    updatedAt: new Date().toISOString()
                                                  });
                                                  triggerToast(`Planejamento de "${tx.name}" estendido por mais ${countToAdd} meses com sucesso!`, 'success');
                                                } catch (err) {
                                                  handleFirestoreError(err, OperationType.UPDATE, path);
                                                }
                                              }}
                                              className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none"
                                            >
                                              🔄 Estender
                                            </button>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={handleManterMostrando}
                                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                                theme === 'light' 
                                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                                                  : 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-white/5'
                                              }`}
                                            >
                                              📌 Manter Gasto
                                            </button>
                                            
                                            <button
                                              onClick={handleQuitarTudo}
                                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer border-none shadow-sm shadow-emerald-600/10 active:scale-95 transition-all"
                                            >
                                              💰 Quitar tudo
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                      <div className="space-y-1">
                                        <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
                                          💳 Demonstrativo do Parcelamento
                                        </span>
                                        <div className="flex flex-col gap-1 text-[11.5px] leading-relaxed">
                                          <div className="text-slate-400">
                                            <span>Valor inicial devido: </span>
                                            <strong className={theme === 'light' ? 'text-slate-700' : 'text-slate-205'}>
                                              {formatCurrency(totalOriginalBase)}
                                            </strong>
                                          </div>
                                          <div className="text-slate-400 flex items-center gap-1">
                                            <span>📉 Saldo devedor atual: </span>
                                            <strong className="text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/10">
                                              {formatCurrency(totalDevedorRestante)}
                                            </strong>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Input to add extra spending */}
                                      <div className={`p-3 rounded-2xl border flex flex-col gap-1.5 sm:min-w-[220px] ${
                                        theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/40 border-white/5'
                                      }`}>
                                        <span className={`text-[9.5px] uppercase tracking-wider font-extrabold block ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>
                                          ➕ Adicionar Gasto Extra
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <div className={`relative rounded-xl border ${
                                            theme === 'light' ? 'bg-white border-slate-300 focus-within:border-amber-400' : 'bg-slate-950/50 border-white/5 focus-within:border-amber-500'
                                          } transition-all px-2.5 py-1.5 flex items-center shadow-inner`}>
                                            <input
                                              type="text"
                                              inputMode="numeric"
                                              placeholder="R$ 0,00"
                                              value={extraGastoInputs[masterId] || ''}
                                              onChange={(e) => {
                                                const masked = handleMaskMoney(e.target.value);
                                                setExtraGastoInputs(prev => ({ ...prev, [masterId]: masked }));
                                              }}
                                              onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  const valStr = extraGastoInputs[masterId];
                                                  if (!valStr || valStr === 'R$ 0,00') return;
                                                  const valueToAdd = handleParseMoney(valStr);
                                                  if (valueToAdd <= 0) return;

                                                  const path = `transactions/${masterId}`;
                                                  try {
                                                    const docRef = doc(db, 'transactions', masterId);
                                                    await updateDoc(docRef, {
                                                      extra_gasto: totalExtraGasto + valueToAdd,
                                                      updatedAt: new Date().toISOString()
                                                    });
                                                    setExtraGastoInputs(prev => ({ ...prev, [masterId]: '' }));
                                                    triggerToast(`Gasto extra de ${formatCurrency(valueToAdd)} adicionado com sucesso!`, 'success');
                                                  } catch (err) {
                                                    handleFirestoreError(err, OperationType.UPDATE, path);
                                                  }
                                                }
                                              }}
                                              className={`w-20 bg-transparent font-mono font-bold text-xs focus:outline-none p-0 leading-none ${
                                                theme === 'light' ? 'text-slate-800' : 'text-slate-150'
                                              }`}
                                            />
                                          </div>
                                          <button
                                            onClick={async () => {
                                              const valStr = extraGastoInputs[masterId];
                                              if (!valStr || valStr === 'R$ 0,00') return;
                                              const valueToAdd = handleParseMoney(valStr);
                                              if (valueToAdd <= 0) return;

                                              const path = `transactions/${masterId}`;
                                              try {
                                                const docRef = doc(db, 'transactions', masterId);
                                                await updateDoc(docRef, {
                                                  extra_gasto: totalExtraGasto + valueToAdd,
                                                  updatedAt: new Date().toISOString()
                                                });
                                                setExtraGastoInputs(prev => ({ ...prev, [masterId]: '' }));
                                                triggerToast(`Gasto extra de ${formatCurrency(valueToAdd)} adicionado com sucesso!`, 'success');
                                              } catch (err) {
                                                handleFirestoreError(err, OperationType.UPDATE, path);
                                              }
                                            }}
                                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/10 active:scale-95 border-none shrink-0"
                                          >
                                            Somar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-t border-dashed border-white/5 pt-3">
                                      <div className="space-y-0.5">
                                        <span className={`text-[10px] uppercase tracking-wider font-extrabold block ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
                                          Quanto deseja pagar este mês?
                                        </span>
                                        <span className="text-[9.5px] text-slate-500 leading-tight block">
                                          Digite o valor e clique no botão Lançar ou tecle Enter
                                        </span>
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className={`relative rounded-xl border ${
                                          theme === 'light' ? 'bg-slate-50 border-slate-205 focus-within:border-indigo-400' : 'bg-slate-950/40 border-white/5 focus-within:border-indigo-500'
                                        } transition-all px-3.5 py-2 flex items-center shadow-inner`}>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="R$ 0,00"
                                            value={
                                              installmentInputs[tx.id] !== undefined
                                                ? installmentInputs[tx.id]
                                                : "R$ 0,00"
                                            }
                                            onChange={(e) => {
                                              const masked = handleMaskMoney(e.target.value);
                                              setInstallmentInputs(prev => ({ ...prev, [tx.id]: masked }));
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleLancarPagamento();
                                              }
                                            }}
                                            className={`w-32 bg-transparent text-right font-mono font-bold text-xs focus:outline-none p-0 leading-none ${
                                              theme === 'light' ? 'text-slate-800' : 'text-slate-150'
                                            }`}
                                          />
                                        </div>
                                        <button
                                          onClick={handleLancarPagamento}
                                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/15 active:scale-95 flex items-center gap-1.5 shrink-0 border-none"
                                        >
                                          <span>🚀</span>
                                          <span>Lançar</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
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
                    baseIncome={settings?.income ?? 0}
                    baseBalance={settings?.balance ?? 0}
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

              <div className="flex flex-col gap-2 pt-2">
                {confirmModal.showThreeButtons ? (
                  <>
                    <button
                      onClick={confirmModal.onConfirm}
                      className={`w-full py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] rounded-xl ${
                        confirmModal.classNameConfirm || 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {confirmModal.confirmText || 'Apenas este mês'}
                    </button>
                    {confirmModal.onConfirm2 && (
                      <button
                        onClick={confirmModal.onConfirm2}
                        className={`w-full py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] rounded-xl ${
                          confirmModal.classNameConfirm2 || 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        {confirmModal.confirmText2 || 'Toda a série'}
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                      className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all duration-200 ${
                        theme === 'light'
                          ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'
                          : 'bg-slate-900 border-white/10 hover:bg-slate-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      {confirmModal.cancelText || 'Cancelar'}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
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
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* UNIFIED FULLY-RESPONSIVE DOCKED BOTTOM BAR (BOTH PC & MOBILE) */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl transition-all duration-300 ${
        theme === 'light' 
          ? 'bg-white/95 border-slate-200/80 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] text-slate-850' 
          : 'bg-[#090d1af5] border-white/5 shadow-[0_-8px_30px_rgb(0,0,0,0.4)] text-slate-100'
      } px-1.5 pb-safe pt-2 flex items-center justify-around h-16`}>
        <div className="max-w-4xl w-full mx-auto flex items-center justify-around h-full">
          {( () => {
            const tabs = [
              { id: 'dashboard', val: 'Dashboard', icon: LayoutDashboard },
              { id: 'contas', val: 'Fixas', icon: Receipt },
              { id: 'variaveis', val: 'Variados', icon: Coins },
              { id: 'parcelas', val: 'Parcelados', icon: CreditCard },
              { id: 'goals', val: 'Metas', icon: Target },
              { id: 'settings', val: 'Ajustes', icon: Settings }
            ];
            return tabs;
          })().map((tab) => {
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
      {showPaymentInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-45"
            onClick={() => setShowPaymentInfoModal(false)}
          />
          
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[#0f1524] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-50 flex flex-col space-y-4 text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] text-amber-450 font-extrabold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 text-amber-450" /> Vagas Limitadas
                </span>
                <h4 className="font-display font-black text-base text-white tracking-tight leading-snug mt-1.5">
                  Oferta de Lançamento Limitada
                </h4>
              </div>
              <button
                onClick={() => setShowPaymentInfoModal(false)}
                className="p-1 px-2 rounded-lg bg-slate-900 border border-white/10 text-slate-450 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-450 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-[10.5px] font-black uppercase text-amber-400 tracking-wider leading-none">
                    Lote Promocional de Estreia
                  </h5>
                  <p className="text-[9.5px] text-amber-300 font-semibold mt-1">
                    10 primeiras assinaturas garantem o valor especial de 11,99 mensal após o preenchimento das vagas promocionais, novas assinaturas serão realizadas pelo valor regular do plano.
                  </p>
                </div>
              </div>

              <div className="space-y-0.5 bg-slate-950/50 p-2.5 rounded-xl border border-white/5 text-center">
                <p className="text-[9.5px] text-slate-500 font-black uppercase tracking-wider">Você garante o valor de:</p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-slate-450 line-through font-bold">R$ 32,99</span>
                  <span className="text-lg font-black text-emerald-400">R$ 11,99</span>
                  <span className="text-[9.5px] text-slate-400 font-semibold">/ mês</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-normal font-light">
                As <strong className="font-bold text-white">10 primeiras assinaturas</strong> garantem o valor especial de <strong className="font-bold text-emerald-400">R$ 11,99 mensal</strong>. Após o preenchimento das vagas promocionais, novas assinaturas serão realizadas pelo valor regular do plano.
              </p>
            </div>

            <div className="flex gap-2.5 text-center text-xs">
              <button
                type="button"
                onClick={() => setShowPaymentInfoModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/10 text-slate-400 font-bold uppercase tracking-wider transition-colors cursor-pointer text-[10px]"
              >
                Voltar
              </button>
              <a
                href="https://mpago.la/1SfRUJ2"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPaymentInfoModal(false)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-4 rounded-xl uppercase tracking-wider shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-1 cursor-pointer border-none text-[10px] no-underline"
              >
                Ir para o Pagamento
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        </div>
      )}

      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-45"
            onClick={() => {
              setShowCelebrationModal(false);
              setCelebratedTx(null);
            }}
          />
          
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-50 text-center space-y-6 border transition-all ${
              theme === 'light'
                ? 'bg-white border-emerald-100 text-slate-900 shadow-emerald-100/40'
                : 'bg-gradient-to-b from-slate-900 to-[#0e1627] border-emerald-500/20 text-white shadow-emerald-500/10'
            }`}
          >
            {/* Animated Celebration Icon */}
            <div className="relative mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/15 animate-bounce">
              🏆
              <span className="absolute -top-1 -right-1 text-base">✨</span>
              <span className="absolute -bottom-1 -left-1 text-base">🎉</span>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-500/10 border border-emerald-400/25 px-3 py-1 rounded-full inline-flex items-center gap-1.5 justify-center">
                🎉 Objetivo Concluído!
              </span>
              <h2 className={`font-display font-black text-xl leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Parabéns pela competência por ter pago todo parcelamento!
              </h2>
              <div className={`p-4 rounded-2xl text-left border ${
                theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/40 border-white/5'
              }`}>
                <div className="text-[11px] text-slate-500 uppercase font-black tracking-wider">Lançamento quitado:</div>
                <div className={`text-base font-bold mt-0.5 truncate ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  {celebratedTx?.name || 'Gasto Parcelado'}
                </div>
                {celebratedTx?.amount && (
                  <div className="text-xs text-slate-400 mt-1">
                    Valor total original: <strong className="font-semibold text-emerald-400">{formatCurrency(celebratedTx.amount)}</strong>
                  </div>
                )}
              </div>
              <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                Você atingiu a liquidação total desse planejamento financeiro e demonstrou excelente responsabilidade econômica. Cada parcelamento finalizado é um grande passo rumo à sua liberdade e tranquilidade! Continue guiando seus gastos com precisão. 🏆✨
              </p>
            </div>

            <button
              onClick={() => {
                setShowCelebrationModal(false);
                setCelebratedTx(null);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-450 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-lg shadow-emerald-500/15 active:scale-[0.98] border-none"
            >
              Excelente, obrigado! 🌟
            </button>
          </motion.div>
        </div>
      )}

      <OnboardingTutorial 
        theme={theme} 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
        onOpen={() => setIsTutorialOpen(true)} 
      />
    </div>
  );
}
