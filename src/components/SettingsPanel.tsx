import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { auth, db } from '../firebase';
import { useLanguage } from '../utils/i18n';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { Settings, Download, Trash2, ShieldAlert, ShieldCheck, KeyRound, DollarSign, Eye, RefreshCw, Sun, Moon, AlertTriangle, Bell, FileDown, FileSpreadsheet, Mail, Smartphone, Radio, ArrowRight, Check, AlertCircle, MessageCircle, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportPremiumPDF, exportPremiumSpreadsheet } from '../utils/reportGenerator';

interface SettingsPanelProps {
  currentTheme: 'dark' | 'light';
  onChangeTheme: (theme: 'dark' | 'light') => void;
  currentCurrency: 'BRL' | 'USD' | 'EUR';
  onChangeCurrency: (currency: 'BRL' | 'USD' | 'EUR') => void;
  baseIncome: number;
  baseBalance: number;
  onSavePreferences: (income: number, balance: number, alertDays?: number) => void;
  onSaveAlertSettings?: (emailAlerts: boolean, whatsappAlerts: boolean, alertEmail: string, alertPhone: string) => Promise<void>;
  transactions: Transaction[];
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
  alertThresholdDays?: number;
  settings?: any;
  onOpenTutorial?: () => void;
  getFinancialSnapshot?: () => any;
}

export default function SettingsPanel({
  currentTheme,
  onChangeTheme,
  currentCurrency,
  onChangeCurrency,
  baseIncome,
  baseBalance,
  onSavePreferences,
  onSaveAlertSettings,
  transactions,
  showToast,
  alertThresholdDays = 3,
  settings = null,
  onOpenTutorial,
  getFinancialSnapshot
}: SettingsPanelProps) {
  const { t, lang, formatCurrency } = useLanguage();
  const [incStr, setIncStr] = useState<string>(
    baseIncome > 0 ? formatCurrency(baseIncome) : ''
  );
  const [balStr, setBalStr] = useState<string>(
    baseBalance > 0 ? formatCurrency(baseBalance) : ''
  );
  const [alertDays, setAlertDays] = useState<number>(alertThresholdDays);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState<boolean>(false);
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>('all');

  const [emailAlerts, setEmailAlerts] = useState<boolean>(settings?.emailAlerts ?? false);
  const [whatsappAlerts, setWhatsappAlerts] = useState<boolean>(settings?.whatsappAlerts ?? false);
  const [alertEmail, setAlertEmail] = useState<string>(settings?.alertEmail ?? auth.currentUser?.email ?? '');
  const [alertPhone, setAlertPhone] = useState<string>(settings?.alertPhone ?? '');
  const [isAlertSimulatorOpen, setIsAlertSimulatorOpen] = useState<boolean>(false);
  const [simulatorChannel, setSimulatorChannel] = useState<'email' | 'whatsapp' | null>(null);

  // Web Push states & helper functions
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const [backgroundTestCountdown, setBackgroundTestCountdown] = useState<number | null>(null);
  const [serverPushStatus, setServerPushStatus] = useState<any>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  const loadServerStatus = async () => {
    if (!auth.currentUser) return;
    try {
      const res = await fetch(`/api/push/status/${auth.currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setServerPushStatus(data);
        if (data.isSubscribed) {
          setIsPushSubscribed(true);
        }
      }
    } catch (e) {}
  };

  // Detect Web Push capabilities and current state on load
  useEffect(() => {
    setIsInIframe(window.self !== window.top);

    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsPushSupported(true);
      
      const initCheck = async () => {
        try {
          let reg = await navigator.serviceWorker.getRegistration();
          if (!reg) {
            reg = await navigator.serviceWorker.register('/sw.js');
          }
          const sub = await reg?.pushManager?.getSubscription();
          setIsPushSubscribed(!!sub);
          loadServerStatus();
        } catch (e) {}
      };

      initCheck();
    }
  }, []);

  const ensureDevicePushSubscription = async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      showToast('Notificações não são suportadas neste navegador ou dispositivo.', 'warning');
      return null;
    }

    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch (e) {
        console.warn('Erro ao solicitar permissão de notificações:', e);
      }
    }

    if (perm !== 'granted') {
      if (isInIframe) {
        showToast('⚠️ No modo de pré-visualização, as notificações podem ser bloqueadas pelo navegador. Abra em Nova Aba para conceder permissão!', 'warning');
      } else {
        showToast('Permissão de notificações não concedida. Toque no ícone de cadeado na barra de endereço do navegador para permitir.', 'warning');
      }
      return null;
    }

    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      const keyRes = await fetch('/api/push/vapid-public-key');
      if (!keyRes.ok) throw new Error('Falha ao buscar chave pública VAPID');
      const { publicKey } = await keyRes.json();
      if (!publicKey || publicKey.length < 65) throw new Error('Chave VAPID inválida');

      if (sub) {
        try {
          const expectedKeyArray = urlBase64ToUint8Array(publicKey);
          const rawKey = sub.options.applicationServerKey;
          let match = false;
          if (rawKey) {
            const rawKeyArray = new Uint8Array(rawKey);
            if (rawKeyArray.length === expectedKeyArray.length) {
              match = rawKeyArray.every((byte, idx) => byte === expectedKeyArray[idx]);
            }
          }
          if (!match) {
            console.log('🔄 Renovando inscrição push com a nova chave pública VAPID...');
            await sub.unsubscribe().catch(() => {});
            sub = null;
          }
        } catch (e) {
          await sub.unsubscribe().catch(() => {});
          sub = null;
        }
      }

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      if (auth.currentUser && sub) {
        const snap = getFinancialSnapshot ? getFinancialSnapshot() : null;
        // 1. Send subscription & current bills to Express API for background sweeps
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: auth.currentUser.uid,
            subscription: sub,
            ...(snap || {
              settings: {
                income: baseIncome || settings?.income || 0,
                balance: baseBalance || settings?.balance || 0,
                monthlyIncome: settings?.monthlyIncome || {},
                monthlyBalance: settings?.monthlyBalance || {},
                extras: settings?.extras || {}
              },
              bills: (transactions || []).map(t => ({
                id: t.id,
                name: t.name,
                due: t.due,
                amount: Number(t.amount) || 0,
                paid_amount: Number(t.paid_amount) || 0,
                type: t.type,
                monthKey: t.monthKey,
                isOverdue: t.isOverdue,
                cat: t.cat || 'Geral'
              }))
            })
          })
        }).catch(() => {});

        // 2. Backup to Firestore
        try {
          const cleanEndpoint = sub.endpoint
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(sub.endpoint.length - 60);
          const subId = `sub_${auth.currentUser.uid}_${cleanEndpoint}`;

          await setDoc(doc(db, 'push_subscriptions', subId), {
            id: subId,
            userId: auth.currentUser.uid,
            subscription: JSON.stringify(sub),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (e) {}
      }

      setIsPushSubscribed(true);
      return sub;
    } catch (err: any) {
      console.warn('Erro ao obter assinatura push:', err);
      if (isInIframe) {
        showToast('Dica: Abra o FinançasPro em Nova Aba para ativar o Service Worker de notificações nativas.', 'warning');
      }
      return null;
    }
  };

  const togglePushSubscription = async () => {
    if (!isPushSupported) return;
    setPushLoading(true);
    try {
      if (isPushSubscribed) {
        let reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await sub.unsubscribe();
          }
        }
        setIsPushSubscribed(false);
        showToast('Inscrição de notificações removida para este dispositivo.', 'success');
        loadServerStatus();
      } else {
        const sub = await ensureDevicePushSubscription();
        if (sub) {
          showToast('Dispositivo conectado com sucesso! Varreduras automáticas às 08:00 (Manhã) e 12:00 (Meio-Dia).', 'success');
          loadServerStatus();
        }
      }
    } catch (err) {
      console.error('Erro ao alternar Web Push:', err);
      showToast('Falha ao configurar Web Push de notificações.', 'error');
    } finally {
      setPushLoading(false);
    }
  };

  const triggerImmediateNotificationCheck = async (mode: 'bills' | 'smart' | 'both' = 'both') => {
    if (!auth.currentUser) return;
    setPushLoading(true);
    try {
      showToast(`Disparando verificação imediata (${mode === 'bills' ? 'Contas' : mode === 'smart' ? 'Inteligente' : 'Completa'})...`, 'warning');
      const sub = await ensureDevicePushSubscription();
      const snap = getFinancialSnapshot ? getFinancialSnapshot() : null;

      const res = await fetch('/api/push/trigger-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: auth.currentUser.uid,
          subscription: sub,
          mode,
          ...(snap || {
            settings: {
              income: baseIncome || settings?.income || 0,
              balance: baseBalance || settings?.balance || 0,
              monthlyIncome: settings?.monthlyIncome || {},
              monthlyBalance: settings?.monthlyBalance || {},
              extras: settings?.extras || {}
            },
            bills: (transactions || []).map(t => ({
              id: t.id,
              name: t.name,
              due: t.due,
              amount: Number(t.amount) || 0,
              paid_amount: Number(t.paid_amount) || 0,
              type: t.type,
              monthKey: t.monthKey,
              isOverdue: t.isOverdue,
              cat: t.cat || 'Geral'
            }))
          })
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao disparar.');
      if (data.result && data.result.sent > 0) {
        showToast(`✅ Alerta enviado para ${data.result.sent} dispositivo(s)!`, 'success');
      } else {
        showToast('ℹ️ Varredura executada! Notificação processada com sucesso.', 'warning');
      }
      loadServerStatus();
    } catch (err: any) {
      showToast(err.message || 'Erro ao disparar alerta imediato.', 'error');
    } finally {
      setPushLoading(false);
    }
  };

  const triggerDelayedBackgroundPush = async (delaySeconds: number = 10, mode: 'bills' | 'smart' | 'both' = 'both') => {
    if (!auth.currentUser) return;
    setPushLoading(true);
    try {
      // Always guarantee the device is subscribed and the subscription is sent to the server
      const sub = await ensureDevicePushSubscription();
      const snap = getFinancialSnapshot ? getFinancialSnapshot() : null;

      const res = await fetch('/api/push/test-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: auth.currentUser.uid, 
          delaySeconds,
          mode,
          subscription: sub,
          ...(snap || {
            settings: {
              income: baseIncome || settings?.income || 0,
              balance: baseBalance || settings?.balance || 0,
              monthlyIncome: settings?.monthlyIncome || {},
              monthlyBalance: settings?.monthlyBalance || {},
              extras: settings?.extras || {}
            },
            bills: (transactions || []).map(t => ({
              id: t.id,
              name: t.name,
              due: t.due,
              amount: Number(t.amount) || 0,
              paid_amount: Number(t.paid_amount) || 0,
              type: t.type,
              monthKey: t.monthKey,
              isOverdue: t.isOverdue,
              cat: t.cat || 'Geral'
            }))
          })
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao agendar teste.');
      }

      showToast(`Alerta (${mode === 'bills' ? 'Contas' : mode === 'smart' ? 'Inteligente' : 'Completo'}) agendado! Bloqueie a tela ou feche o app agora. Chegará em ${delaySeconds}s.`, 'success');
      setBackgroundTestCountdown(delaySeconds);
      let remaining = delaySeconds;
      const interval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(interval);
          setBackgroundTestCountdown(null);
        } else {
          setBackgroundTestCountdown(remaining);
        }
      }, 1000);
      loadServerStatus();
    } catch (err: any) {
      showToast(err.message || 'Falha ao acionar teste.', 'error');
      setBackgroundTestCountdown(null);
    } finally {
      setPushLoading(false);
    }
  };

  const triggerTestPush = async () => {
    if (!isPushSubscribed) {
      showToast('Por favor, ative a notificação Web Push primeiro.', 'warning');
      return;
    }
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        showToast('Assinatura não localizada no navegador.', 'error');
        return;
      }

      const res = await fetch('/api/notify/email-and-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: auth.currentUser?.email || '',
          title: '🚨 Teste de Notificação - FinançasPro',
          body: 'As notificações em tempo real estão configuradas e prontas no servidor! Você receberá alertas mesmo com o app fechado.',
          pushSubscriptions: [sub],
          detailedTransactions: []
        })
      });

      if (res.ok) {
        showToast('Alerta de teste enviado com sucesso!', 'success');
      } else {
        showToast('Falha ao acionar despacho da notificação.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setPushLoading(false);
    }
  };

  // Sync state values when settings object loads/changes
  useEffect(() => {
    if (settings) {
      setEmailAlerts(!!settings.emailAlerts);
      setWhatsappAlerts(!!settings.whatsappAlerts);
      if (settings.alertEmail) setAlertEmail(settings.alertEmail);
      if (settings.alertPhone) setAlertPhone(settings.alertPhone);
    }
  }, [settings]);

  useEffect(() => {
    setIncStr(baseIncome > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseIncome) : '');
  }, [baseIncome]);

  useEffect(() => {
    setBalStr(baseBalance > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseBalance) : '');
  }, [baseBalance]);

  const formatMoney = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleMoneyInput = (val: string, setter: (s: string) => void) => {
    let numeric = val.replace(/\D/g, "");
    if (!numeric) {
      setter("");
      return;
    }
    setter(formatMoney(parseFloat(numeric) / 100));
  };

  const parseMoney = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  // Compile list of available months in user data (either from settings or transactions)
  const uniqueMonths = Array.from(
    new Set([
      ...transactions.map(t => t.monthKey),
      ...Object.keys(settings?.monthlyIncome || {}),
      ...Object.keys(settings?.monthlyBalance || {}),
      ...Object.keys(settings?.extras || {})
    ].filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  const formatMonthLabel = (key: string) => {
    if (!key || !key.includes('-')) return key;
    const [year, month] = key.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const idx = parseInt(month, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${months[idx]} ${year}`;
    }
    return key;
  };

  const handleSaveConfigs = () => {
    const inc = parseMoney(incStr);
    const bal = parseMoney(balStr);
    onSavePreferences(inc, bal, alertDays);
    showToast('Preferências base salvas com sucesso!', 'success');
  };

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Build the projection list of all unpaid and projected transactions for the current month
  const realTransactionsThisMonth = transactions.filter(t => t.monthKey === currentMonthKey);
  const masterTransactions = transactions.filter(t => (t.type === 'fixos' || t.type === 'parcelas') && !t.id.startsWith('v_'));
  const mastersMap = new Map<string, Transaction>();
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

  const enrichedTransactions = [...realTransactionsThisMonth];

  mastersMap.forEach((masterTx) => {
    const exists = realTransactionsThisMonth.some(t => {
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
          if (!isWithinTimeline) {
            return;
          }
        }
      }

      const virtualId = `v_${masterTx.masterId || masterTx.id}_${currentMonthKey}`;
      
      let defaultAmount = 0;
      if (masterTx.type === 'parcelas') {
        if (masterTx.amount && masterTx.amount > 0 && masterTx.amount !== (masterTx.total_parcelado || 0)) {
          defaultAmount = masterTx.amount;
        } else {
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
        }
      } else {
        defaultAmount = masterTx.amount;
      }

      const virtualTx: Transaction = {
        id: virtualId,
        userId: masterTx.userId,
        name: masterTx.name,
        amount: defaultAmount,
        type: masterTx.type,
        cat: masterTx.cat,
        due: masterTx.due,
        paid_amount: 0,
        paid_at: '',
        masterId: masterTx.masterId || masterTx.id,
        monthKey: currentMonthKey,
        total_parcelado: masterTx.type === 'parcelas' ? (masterTx.total_parcelado || masterTx.amount || 0) : undefined,
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

  const activeMonthTransactions = enrichedTransactions.filter(t => !t.is_skipped);

  const pendingDebts = activeMonthTransactions.filter(t => {
    const isCcInstallment = t.type === 'parcelas';
    const amountToCheck = t.amount > 0 ? t.amount : (isCcInstallment ? (t.total_parcelado || 0) : 0);
    return amountToCheck - (t.paid_amount || 0) > 0;
  });

  const handleSaveAlerts = async () => {
    if (onSaveAlertSettings) {
      await onSaveAlertSettings(emailAlerts, whatsappAlerts, alertEmail, alertPhone);
      showToast('Autorizações de alerta salvas com sucesso!', 'success');
    }
  };

  const handleOpenWhatsAppSim = () => {
    if (!alertPhone.trim()) {
      showToast('Por favor, cadastre e salve seu telefone para testar o envio.', 'warning');
      return;
    }
    const cleanPhone = alertPhone.replace(/\D/g, '');
    
    // Format message
    let text = `🚨 *FinançasPro - Lembrete de Despesas* 🚨\n\n`;
    text += `Olá! Identificamos contas agendadas com vencimento próximo em aberto:\n\n`;
    
    if (pendingDebts.length === 0) {
      text += `✅ Excelente! Não há contas em aberto mapeadas para este período.`;
    } else {
      pendingDebts.forEach(d => {
        const amt = d.amount > 0 ? d.amount : (d.type === 'parcelas' ? (d.total_parcelado || 0) : 0);
        const rem = amt - (d.paid_amount || 0);
        text += `• *${d.name}*: Resta pagar *R$ ${rem.toFixed(2).replace('.', ',')}* (Dia ${d.due})\n`;
      });
    }
    
    text += `\n\n_Dica: Acesse o portal FinançasPro para marcar como pagas e manter sua sobra estimada atualizada._\n👉 https://ai.studio/build`;
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
    showToast('Link do WhatsApp gerado! Redirecionando...', 'success');
  };

  const handlePasswordReset = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('E-mail de atualização de senha enviado!', 'success');
    } catch (err: any) {
      showToast('Falha ao acionar recuperação de senha.', 'error');
    }
  };

  // Premium PDF download
  const handleExportPremiumPDF = () => {
    if (transactions.length === 0) {
      showToast('Nenhum lançamento gravado para exportar.', 'warning');
      return;
    }
    try {
      const userEmail = auth.currentUser?.email || 'Premium User';
      exportPremiumPDF({
        transactions,
        baseIncome,
        baseBalance,
        currentCurrency,
        userEmail,
        selectedMonthKey: selectedReportMonth,
        settings,
      });
      showToast('Demonstrativo PDF Premium gerado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar relatório em PDF.', 'error');
    }
  };

  // Corporate styled spreadsheet download
  const handleExportPremiumSpreadsheet = () => {
    if (transactions.length === 0) {
      showToast('Nenhum lançamento gravado para exportar.', 'warning');
      return;
    }
    try {
      const userEmail = auth.currentUser?.email || 'Premium User';
      exportPremiumSpreadsheet({
        transactions,
        baseIncome,
        baseBalance,
        currentCurrency,
        userEmail,
        selectedMonthKey: selectedReportMonth,
        settings,
      });
      showToast('Planilha de Auditoria Geral baixada com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar relatório em Planilha.', 'error');
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountOpen(true);
  };

  const executeDeleteAccount = async () => {
    setIsDeleteAccountOpen(false);
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        showToast('Conta excluída definitivamente. Sentiremos sua falta!', 'success');
        window.location.reload();
      }
    } catch (err: any) {
      showToast('Por segurança, re-autentique-se antes de excluir sua conta.', 'error');
    }
  };

  const isLight = currentTheme === 'light';

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Configuration Title Card */}
      <div className="p-6 rounded-3xl glass-panel border-white/5 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-display font-black text-white text-base">{t('painelPreferencias', 'Painel de Preferências')}</h4>
            <p className="text-xs text-slate-500">{t('ajusteParametrosVisuales', 'Ajuste os parâmetros visuais, cambiais e operacionais do seu aplicativo.')}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          {/* Theme selector */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">{t('temaDoApp', 'Tema do App')}</span>
              <span className="text-[10px] text-slate-500">{t('alternarContraste', 'Alternar contraste da plataforma.')}</span>
            </div>
            <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1 gap-1">
              <button
                id="btn-theme-dark"
                onClick={() => onChangeTheme('dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  currentTheme === 'dark' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
              <button
                id="btn-theme-light"
                onClick={() => onChangeTheme('light')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  currentTheme === 'light' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
            </div>
          </div>

          {/* Currency selection */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">{t('moedaConversora', 'Moeda Conversora')}</span>
              <span className="text-[10px] text-slate-500">{t('defineSimboloExibicao', 'Define o símbolo de exibição.')}</span>
            </div>
            <select
              value={currentCurrency}
              onChange={(e) => onChangeCurrency(e.target.value as any)}
              className="bg-slate-900 border border-white/5 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="BRL">Real (R$) 🇧🇷</option>
              <option value="USD">Dólar ($) 🇺🇸</option>
              <option value="EUR">Euro (€) 🇪🇺</option>
            </select>
          </div>

          {/* Day alert threshold */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">{t('antecedenciaAvisos', 'Antecedência dos Avisos')}</span>
              <span className="text-[10px] text-slate-500">{t('mapearFaturasAntes', 'Mapear faturas quantos dias antes do vencimento.')}</span>
            </div>
            <select
              value={alertDays}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setAlertDays(val);
                onSavePreferences(parseMoney(incStr), parseMoney(balStr), val);
                showToast(`${t('alertaConfiguradoPara', 'Alerta configurado para')} ${val} ${t('diasAntecedencia', 'dias de antecedência!')}`, 'success');
              }}
              className="bg-slate-900 border border-white/5 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="1">1 {t('diaAntes', 'dia antes')}</option>
              <option value="2">2 {t('diasAntes', 'dias antes')}</option>
              <option value="3">3 {t('diasAntes', 'dias antes')}</option>
              <option value="5">5 {t('diasAntes', 'dias antes')}</option>
              <option value="7">7 {t('diasAntes', 'dias antes')}</option>
              <option value="10">10 dias antes</option>
              <option value="15">15 dias antes</option>
            </select>
          </div>



          {/* Web Push configuration section */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            {isInIframe && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-[11px] text-amber-200/90 leading-tight">
                    Para que o celular receba notificações com a tela bloqueada, o app precisa estar aberto em sua aba própria ou instalado.
                  </p>
                </div>
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-[10px] uppercase tracking-wider shrink-0 transition-colors"
                >
                  Abrir em Nova Aba
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="max-w-[70%]">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isPushSubscribed ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {t('alertasSegundoPlano', 'Alertas em Segundo Plano (PWA)')}
                </span>
                <span className="text-[10px] text-slate-400 block leading-normal mt-0.5">
                  {t('recebaAvisosInstantaneos', 'Varreduras automáticas de vencimentos pela manhã (08:00) e ao meio-dia (12:00) no horário de Brasília.')}
                </span>
              </div>
              <button
                onClick={togglePushSubscription}
                disabled={!isPushSupported || pushLoading}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPushSubscribed ? 'bg-indigo-600' : 'bg-slate-800'
                } ${(!isPushSupported || pushLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPushSubscribed ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Server Status Badge & Diagnostics */}
            <div className="p-4 bg-slate-900/80 border border-white/10 rounded-2xl flex flex-col gap-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isPushSubscribed ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50' : 'bg-amber-400'}`} />
                  <span className="text-white font-semibold">
                    {isPushSubscribed ? 'Dispositivo conectado ao robô do servidor' : 'Dispositivo desconectado'}
                  </span>
                </div>
                {serverPushStatus?.currentBrasiliaTime && (
                  <div className="text-slate-400 text-[11px] bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    Horário em Brasília: <strong className="text-indigo-400 font-mono text-xs">{serverPushStatus.currentBrasiliaTime}</strong>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                <span>Aparelhos ativos: <strong className="text-slate-200">{serverPushStatus?.deviceCount || 0}</strong></span>
                <span>Contas monitoradas: <strong className="text-slate-200">{serverPushStatus?.billsCount || transactions?.length || 0}</strong></span>
              </div>
            </div>

            {isPushSupported && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => triggerDelayedBackgroundPush(10, 'bills')}
                    disabled={pushLoading || backgroundTestCountdown !== null}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3.5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/20 disabled:opacity-50"
                    title="Receba no aparelho a lista de todas as contas pendentes com app fechado"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Testar Pendências (10s)</span>
                  </button>
                  <button
                    onClick={() => triggerDelayedBackgroundPush(10, 'smart')}
                    disabled={pushLoading || backgroundTestCountdown !== null}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3.5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-950/20 disabled:opacity-50"
                    title="Receba os alertas inteligentes resumidos do dashboard com app fechado"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Testar Alertas Inteligentes (10s)</span>
                  </button>
                  <button
                    onClick={() => triggerDelayedBackgroundPush(10, 'both')}
                    disabled={pushLoading || backgroundTestCountdown !== null}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3.5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-950/20 disabled:opacity-50"
                    title="Receba as pendências e os alertas inteligentes sequenciais com app fechado"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Testar Ambos (10s)</span>
                  </button>
                  <button
                    onClick={() => triggerImmediateNotificationCheck('smart')}
                    disabled={pushLoading}
                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 font-bold py-2 px-3.5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    title="Executar análise e disparar alerta inteligente imediatamente"
                  >
                    {pushLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Disparar Inteligente Agora</span>
                  </button>
                  <button
                    onClick={() => triggerImmediateNotificationCheck('bills')}
                    disabled={pushLoading}
                    className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/20 font-bold py-2 px-3.5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    title="Verificar e disparar lista de contas pendentes imediatamente"
                  >
                    {pushLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Disparar Pendências Agora</span>
                  </button>
                </div>

                {backgroundTestCountdown !== null && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 animate-pulse">
                      {backgroundTestCountdown}
                    </span>
                    <span>
                      <strong>Bloqueie a tela ou feche o aplicativo agora!</strong> O alerta chegará no seu aparelho em {backgroundTestCountdown}s.
                    </span>
                  </div>
                )}
              </div>
            )}

            {!isPushSupported && (
              <p className="text-[9.5px] text-amber-500/80 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl leading-normal">
                ⚠️ {t('notificacoesNaosuportadas', 'As notificações push de segundo plano não são suportadas neste navegador ou dispositivo. Instale como PWA para garantir suporte total.')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preset values master base template */}
      <div className="p-6 rounded-3xl glass-panel border-white/5">
        <h5 className="font-display font-black text-white text-sm mb-4 leading-none">
          {t('parametrosEstimadosMedios', 'Parâmetros Estimados Médios')}
        </h5>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('rendaMensalBase', 'Renda Mensal Base')}</label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={incStr}
                onChange={(e) => handleMoneyInput(e.target.value, setIncStr)}
                className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none text-slate-200 text-xs px-4 py-3 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('reservaComercialMaos', 'Reserva Comercial / Mãos')}</label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={balStr}
                onChange={(e) => handleMoneyInput(e.target.value, setBalStr)}
                className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none text-slate-200 text-xs px-4 py-3 rounded-xl font-mono"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-normal">
            {t('valoresUsadosPreenchimento', 'Estes valores são usados para preenchimento automático das suas economias no início de cada novo mês.')}
          </p>

          <button
            onClick={handleSaveConfigs}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            {t('salvarPadroesCaixa', 'Salvar Padrões de Caixa')}
          </button>
        </div>
      </div>

      {/* Support Panel Card */}
      <div className="p-6 rounded-3xl glass-panel border-emerald-500/10 hover:border-emerald-500/20 transition-all bg-emerald-950/5">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-display font-black text-white text-sm leading-none">
              {t('centralAjudaSuporte', 'Central de Ajuda & Suporte')}
            </h5>
            <p className="text-[10px] text-slate-400 mt-1">
              {t('faleAtendimentoHumano', 'Fale com nosso atendimento humano ou tire dúvidas no WhatsApp.')}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-350 leading-relaxed font-light mb-4">
          {t('duvidasFuncionamento', 'Dúvidas sobre o funcionamento, faturas ou precisa de suporte técnico? Nosso atendimento via WhatsApp está sempre pronto para te ajudar a manter as finanças sob total controle.')}
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {onOpenTutorial && (
            <button
              type="button"
              onClick={onOpenTutorial}
              className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                currentTheme === 'light'
                  ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Ver Guia & FAQ do App
            </button>
          )}

          <a
            href="https://wa.me/5563992092699?text=Olá!%20Preciso%20de%20ajuda%20ou%20suporte%20no%20FinançasPro."
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md active:translate-y-0.5 cursor-pointer no-underline"
          >
            <MessageCircle className="w-4 h-4" />
            {t('falarSuporteWhatsApp', 'Falar com Suporte no WhatsApp')}
          </a>
        </div>
      </div>

      {/* Action panel for Exportation and Credentials */}
      <div className="p-6 rounded-3xl glass-panel border-white/5 space-y-4">
        <h5 className="font-display font-black text-white text-sm leading-none">
          {t('acoesSegurancaCorporativa', 'Ações e Segurança Corporativa')}
        </h5>

        <div className="space-y-4 pt-2">
          {/* Selector for PDF / Spreadsheet Scope */}
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
            <label className="block text-[9.5px] font-extrabold text-slate-350 uppercase tracking-widest leading-none">
              {t('abrangenciaRelatorios', 'Abrangência dos Relatórios')}
            </label>
            <p className="text-[9.5px] text-slate-500 leading-normal">
              {t('escolhaExtrairDiario', 'Escolha extrair do diário a relação de um mês específico ou o consolidado geral contendo todo o histórico acumulado.')}
            </p>
            <select
              value={selectedReportMonth}
              onChange={(e) => setSelectedReportMonth(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none cursor-pointer mt-1"
            >
              <option value="all">📊 {t('relatorioGeralHistorico', 'Relatório Geral (Todo o Histórico Acumulado)')}</option>
              {uniqueMonths.map(mKey => (
                <option key={mKey} value={mKey}>
                  📅 {t('relatorioMensal', 'Relatório Mensal')} — {formatMonthLabel(mKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {/* PDF Download Trigger */}
            <button
              id="btn-settings-export-pdf"
              onClick={handleExportPremiumPDF}
              className="w-full text-left p-3 rounded-xl bg-white/3 border border-white/5 hover:border-indigo-500/50 flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileDown className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-slate-300 block">{t('demonstrativoDetalhadoPDF', 'Demonstrativo Detalhado (.PDF)')} <span className="ml-1 px-1 bg-indigo-500/30 text-[8px] text-indigo-300 rounded font-black uppercase tracking-wider">Premium</span></span>
                  <span className="text-[9px] text-slate-500">{t('baixeRelatorioPolido', 'Baixe o relatório polido de faturas, categorias e fluxos para a abrangência selecionada.')}</span>
                </div>
              </div>
              <span className="text-slate-500 text-xs group-hover:text-white transition-colors">➔</span>
            </button>

            {/* Spreadsheet Download Trigger */}
            <button
              id="btn-settings-export-spreadsheet"
              onClick={handleExportPremiumSpreadsheet}
              className="w-full text-left p-3 rounded-xl bg-white/3 border border-white/5 hover:border-emerald-500/50 flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-slate-300 block">{t('exportarPlanilhaAuditoria', 'Exportar Planilha de Auditoria (.CSV)')}</span>
                  <span className="text-[9px] text-slate-500">{t('gerePlanilhaCorporativa', 'Gere uma planilha corporativa estruturada do período desejado para Excel ou Google Sheets.')}</span>
                </div>
              </div>
              <span className="text-slate-500 text-xs group-hover:text-white transition-colors">➔</span>
            </button>

            {/* Reset password trigger */}
            <button
              id="btn-settings-reset-pw"
              onClick={handlePasswordReset}
              className="w-full text-left p-3 rounded-xl bg-white/3 border border-white/5 hover:border-indigo-500/50 flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-slate-300 block">{t('redefinirSenhaUsuario', 'Redefinir Senha do Usuário')}</span>
                  <span className="text-[9px] text-slate-500">{t('recebaCodigoAcessoEmail', 'Receba um código de acesso por e-mail para atualizar a credencial.')}</span>
                </div>
              </div>
              <span className="text-slate-500 text-xs group-hover:text-white transition-colors">➔</span>
            </button>

            {/* Account deletion */}
            <button
              onClick={handleDeleteAccount}
              className="w-full text-left p-3 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/30 flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold text-rose-400 block">{t('excluirConta', 'Excluir Conta')}</span>
                  <span className="text-[9px] text-rose-500">{t('deletaPermanentemente', 'Deleta permanentemente seu cadastro e logs.')}</span>
                </div>
              </div>
              <span className="text-rose-500/60 text-xs group-hover:text-rose-500 transition-colors">➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Deletion Premium Modal */}
      <AnimatePresence>
        {isDeleteAccountOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteAccountOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 text-center space-y-5 border transition-all ${
                currentTheme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-100/30' 
                  : 'bg-[#0f1524] border-white/10 text-white'
              }`}
            >
              <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                currentTheme === 'light'
                  ? 'bg-rose-50 border-rose-100 text-rose-650'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-black text-sm uppercase tracking-wider text-rose-500">
                  {t('operacaoCriticaIrreversivel', 'Operação Crítica Irreversível!')}
                </h4>
                <p className={`text-xs leading-relaxed ${
                  currentTheme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {t('temCertezaDefinitiva', 'Você tem certeza definitiva? Ao prosseguir, seu perfil, configurações cambiais, e todos os lançamentos financeiros vinculados serão deletados permanentemente do banco de dados.')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  id="confirm-delete-account-btn"
                  onClick={executeDeleteAccount}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-rose-600/10 active:scale-[0.98] rounded-xl"
                >
                  {t('excluirPermanentemente', 'Excluir Permanentemente')}
                </button>
                <button
                  onClick={() => setIsDeleteAccountOpen(false)}
                  className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-all duration-200 ${
                    currentTheme === 'light'
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'bg-slate-900 border-white/10 hover:bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {t('voltarAoPainel', 'Voltar ao Painel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
