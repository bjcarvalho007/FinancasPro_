import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { auth, db } from '../firebase';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { Settings, Download, Trash2, ShieldAlert, KeyRound, DollarSign, Eye, RefreshCw, Sun, Moon, AlertTriangle, Bell, FileDown, FileSpreadsheet, Mail, Smartphone, Radio, ArrowRight, Check, AlertCircle } from 'lucide-react';
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
  transactions: Transaction[];
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
  alertThresholdDays?: number;
}

export default function SettingsPanel({
  currentTheme,
  onChangeTheme,
  currentCurrency,
  onChangeCurrency,
  baseIncome,
  baseBalance,
  onSavePreferences,
  transactions,
  showToast,
  alertThresholdDays = 3
}: SettingsPanelProps) {
  const [incStr, setIncStr] = useState<string>(
    baseIncome > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseIncome) : ''
  );
  const [balStr, setBalStr] = useState<string>(
    baseBalance > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseBalance) : ''
  );
  const [alertDays, setAlertDays] = useState<number>(alertThresholdDays);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState<boolean>(false);

  const [notifyEmail, setNotifyEmail] = useState<string>(
    localStorage.getItem('financaspro_notify_email') || auth.currentUser?.email || ''
  );
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [isTestingAlerts, setIsTestingAlerts] = useState<boolean>(false);

  // Safe converter for cryptographic base64 string to public application key encoding
  const urlBase64ToUint8Array = (base64String: string) => {
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
  };

  // Load and check service worker subscription status in browser
  useEffect(() => {
    async function checkPushSubscription() {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.pushManager) {
            const subscription = await registration.pushManager.getSubscription();
            setIsPushSubscribed(!!subscription);
          }
        } catch (e) {
          console.warn('Verification of push status bypassed: ', e);
        }
      }
    }
    checkPushSubscription();
  }, []);

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

  const handleSaveConfigs = () => {
    const inc = parseMoney(incStr);
    const bal = parseMoney(balStr);
    onSavePreferences(inc, bal, alertDays);
    showToast('Preferências base salvas com sucesso!', 'success');
  };

  const handleEnableLocalNotifications = async () => {
    if (!('Notification' in window)) {
      showToast('Este navegador não suporta notificações de área de trabalho.', 'warning');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        showToast('Notificações autorizadas com sucesso!', 'success');
        new Notification('FinançasPro Alertas', {
          body: 'Notificações ativadas! Você receberá alertas dos vencimentos de suas frentes financeiras.',
          icon: '/favicon.ico'
        });
      } else if (permission === 'denied') {
        showToast('Permissão negada. Ative manualmente no navegador.', 'warning');
      }
    } catch (e) {
      showToast('Limite do navegador ou sandbox de segurança impediu solicitação direta.', 'warning');
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      showToast('Seu dispositivo ou navegador não suporta alertas push.', 'warning');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        showToast('Permissão de notificações recusada.', 'warning');
        return;
      }

      const keyRes = await fetch('/api/push/vapid-public-key');
      if (!keyRes.ok) {
        throw new Error('Falha ao obter chaves de criptografia push.');
      }
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        throw new Error('Chave pública push vazia.');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const user = auth.currentUser;
      if (user) {
        const subId = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
        await setDoc(doc(db, 'push_subscriptions', subId), {
          id: subId,
          userId: user.uid,
          subscription: JSON.parse(JSON.stringify(subscription)),
          createdAt: new Date().toISOString()
        });
        
        setIsPushSubscribed(true);
        showToast('Dispositivo registrado para alertas push (mesmo com app fechado)!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Erro na ativação do Web Push: ${err.message || err}`, 'error');
    }
  };

  const handleDispatchTestAlert = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setIsTestingAlerts(true);
    try {
      showToast('Iniciando disparo consolidado (SMTP + Mobile Push)...', 'success');

      const pushSubs: any[] = [];
      const querySnapshot = await getDocs(
        query(collection(db, 'push_subscriptions'), where('userId', '==', user.uid))
      );
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.subscription) {
          pushSubs.push(data.subscription);
        }
      });

      localStorage.setItem('financaspro_notify_email', notifyEmail.trim());

      const listExpiring = transactions.filter(t => {
        const remaining = t.amount - (t.paid_amount || 0);
        return remaining > 0;
      }).slice(0, 5);

      const response = await fetch('/api/notify/email-and-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail.trim(),
          title: '🚨 Teste Consolidado - Alertas de Vencimento Ativos',
          body: `Você possui atualmente ${listExpiring.length} faturas aguardando liquidação no FinançasPro. O monitoramento em segundo plano está totalmente ativo e com alta prioridade de segurança.`,
          pushSubscriptions: pushSubs,
          detailedTransactions: listExpiring
        })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor de e-mail.');
      }

      const body = await response.json();
      if (body.emailStatus && body.emailStatus.includes('Simulado')) {
        showToast('Push real enviado! E-mail detalhado impresso no console do servidor (SMTP pendente).', 'success');
      } else {
        showToast('E-mail (SMTP) e alertas push disparados com sucesso!', 'success');
      }
    } catch (e: any) {
      console.error(e);
      showToast(`Erro no teste: ${e.message || e}`, 'error');
    } finally {
      setIsTestingAlerts(false);
    }
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

  // Real, functional PDF exporting with custom styled layouts!
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
      });
      showToast('Demonstrativo PDF Premium gerado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar relatório em PDF.', 'error');
    }
  };

  // Real, functional corporate styled spreadsheet exporting!
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

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Configuration Title Card */}
      <div className="p-6 rounded-3xl glass-panel border-white/5 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-display font-black text-white text-base">Painel de Preferências</h4>
            <p className="text-xs text-slate-500">Ajuste os parâmetros visuais, cambiais e operacionais do seu aplicativo.</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          {/* Theme selector */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">Tema do App</span>
              <span className="text-[10px] text-slate-500">Alternar contraste da plataforma.</span>
            </div>
            <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1 gap-1">
              <button
                id="btn-theme-dark"
                onClick={() => onChangeTheme('dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
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
              <span className="text-xs font-bold text-slate-300 block">Moeda Conversora</span>
              <span className="text-[10px] text-slate-500">Define o símbolo de exibição.</span>
            </div>
            <select
              value={currentCurrency}
              onChange={(e) => onChangeCurrency(e.target.value as any)}
              className="bg-slate-900 border border-white/5 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none"
            >
              <option value="BRL">Real (R$) 🇧🇷</option>
              <option value="USD">Dólar ($) 🇺🇸</option>
              <option value="EUR">Euro (€) 🇪🇺</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preset values master base template */}
      <div className="p-6 rounded-3xl glass-panel border-white/5">
        <h5 className="font-display font-black text-white text-sm mb-4 leading-none">
          Parâmetros Estimados Médios
        </h5>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Renda Mensal Base (R$)</label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={incStr}
                onChange={(e) => handleMoneyInput(e.target.value, setIncStr)}
                className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none text-slate-200 text-xs px-4 py-3 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reserva Comercial / Mãos (R$)</label>
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
            Estes valores são usados para preenchimento automático das suas economias no início de cada novo mês.
          </p>

          <button
            onClick={handleSaveConfigs}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            Salvar Padrões de Caixa
          </button>
        </div>
      </div>

      {/* Notifications and Alerts System */}
      <div className="p-6 rounded-3xl glass-panel border-white/5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h5 className="font-display font-black text-white text-sm leading-none">Central de Alertas & Notificações</h5>
            <p className="text-[10px] text-slate-500 font-medium">Configure avisos instantâneos por e-mail e push no celular.</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          {/* Day alert threshold */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">Antecedência dos Avisos</span>
              <span className="text-[10px] text-slate-500">Mapear faturas quantos dias antes do vencimento.</span>
            </div>
            <select
              value={alertDays}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setAlertDays(val);
                onSavePreferences(parseMoney(incStr), parseMoney(balStr), val);
                showToast(`Alerta configurado para ${val} dias de antecedência!`, 'success');
              }}
              className="bg-slate-900 border border-white/5 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="1">1 dia antes</option>
              <option value="2">2 dias antes</option>
              <option value="3">3 dias antes</option>
              <option value="5">5 dias antes</option>
              <option value="7">7 dias antes</option>
              <option value="10">10 dias antes</option>
              <option value="15">15 dias antes</option>
            </select>
          </div>

          {/* Email alerting panel */}
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Avisos por E-mail (Gmail)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Receba um sumário executivo com a tabela analítica contendo todas as contas e projeções que vencem nos próximos dias.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="seu.email@gmail.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                className="flex-1 bg-slate-900 border border-white/5 text-slate-200 text-xs px-3 py-2.5 rounded-xl font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
              <button
                onClick={() => {
                  if (!notifyEmail.trim().endsWith('@gmail.com') && notifyEmail.trim() !== '') {
                    showToast('Selecione preferencialmente um e-mail do domínio @gmail.com para prioridade.', 'warning');
                  }
                  localStorage.setItem('financaspro_notify_email', notifyEmail.trim());
                  showToast('E-mail de avisos salvo para monitoramento!', 'success');
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] px-4 rounded-xl cursor-pointer transition-colors uppercase tracking-wider"
              >
                Salvar
              </button>
            </div>
          </div>

          {/* Background PWA Push alerting panel */}
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Notificações Push (Mesmo com App Fechado)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Ative o protocolo Web Push de alta frequência. Este dispositivo exibirá alertas urgentes de faturas direto na tela, agindo exatamente como um app nativo, mesmo com a aba fechada.
            </p>
            
            <div className="flex flex-col gap-2 pt-1.5">
              {isPushSubscribed ? (
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Notificações Ativas Neste Aparelho! (Frequência Corporativa)
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-medium">
                  Push desativado ou permissão pendente. Instale o PWA e ative abaixo.
                </div>
              )}

              <button
                onClick={handleEnablePushNotifications}
                className={`w-full py-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer text-center ${
                  isPushSubscribed
                    ? 'bg-slate-900 border border-emerald-500/20 text-emerald-450 hover:bg-slate-850'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                }`}
              >
                {isPushSubscribed ? '🔄 Recadastrar/Testar Conexão Push' : '📲 Cadastrar Aparelho para Alertas Push'}
              </button>
            </div>
          </div>

          {/* Test drive section */}
          <div className="pt-2">
            <button
              disabled={isTestingAlerts}
              onClick={handleDispatchTestAlert}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-black py-3.5 rounded-xl text-[10.5px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
            >
              {isTestingAlerts ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Disparando Ciclo De Teste...
                </>
              ) : (
                <>
                  <span>⚡ Executar Teste de Disparo (E-mail + Push)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action panel for Exportation and Credentials */}
      <div className="p-6 rounded-3xl glass-panel border-white/5 space-y-4">
        <h5 className="font-display font-black text-white text-sm leading-none">
          Ações e Segurança Corporativa
        </h5>

        <div className="space-y-2 pt-2">
          {/* PDF Download Trigger */}
          <button
            id="btn-settings-export-pdf"
            onClick={handleExportPremiumPDF}
            className="w-full text-left p-3 rounded-xl bg-white/3 border border-white/5 hover:border-indigo-500/50 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileDown className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold text-slate-300 block">Demonstrativo Detalhado (.PDF)  <span className="ml-1 px-1 bg-indigo-500/30 text-[8px] text-indigo-300 rounded font-black uppercase tracking-wider">Premium</span></span>
                <span className="text-[9px] text-slate-500">Baixe um relatório polido resumido do mês, faturas, categorias e fluxo.</span>
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
                <span className="text-xs font-bold text-slate-300 block">Exportar Planilha de Auditoria (.CSV)</span>
                <span className="text-[9px] text-slate-500">Gere uma planilha corporativa estruturada pronta para Excel ou Google Sheets.</span>
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
                <span className="text-xs font-bold text-slate-300 block">Redefinir Senha do Usuário</span>
                <span className="text-[9px] text-slate-500">Receba um código de acesso por e-mail para atualizar a credencial.</span>
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
                <span className="text-xs font-bold text-rose-400 block">Excluir Conta</span>
                <span className="text-[9px] text-rose-500">Deleta permanentemente seu cadastro e logs.</span>
              </div>
            </div>
            <span className="text-rose-500/60 text-xs group-hover:text-rose-500 transition-colors">➔</span>
          </button>
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
                  Operação Crítica Irreversível!
                </h4>
                <p className={`text-xs leading-relaxed ${
                  currentTheme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Você tem certeza definitiva? Ao prosseguir, seu perfil, configurações cambiais, e todos os lançamentos financeiros vinculados serão deletados permanentemente do banco de dados.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  id="confirm-delete-account-btn"
                  onClick={executeDeleteAccount}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-rose-600/10 active:scale-[0.98] rounded-xl"
                >
                  Excluir Permanentemente
                </button>
                <button
                  onClick={() => setIsDeleteAccountOpen(false)}
                  className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-all duration-200 ${
                    currentTheme === 'light'
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      : 'bg-slate-900 border-white/10 hover:bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  Voltar ao Painel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
