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
  onSaveAlertSettings?: (emailAlerts: boolean, whatsappAlerts: boolean, alertEmail: string, alertPhone: string) => Promise<void>;
  transactions: Transaction[];
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
  alertThresholdDays?: number;
  settings?: any;
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
  settings = null
}: SettingsPanelProps) {
  const [incStr, setIncStr] = useState<string>(
    baseIncome > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseIncome) : ''
  );
  const [balStr, setBalStr] = useState<string>(
    baseBalance > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseBalance) : ''
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

  // Sync state values when settings object loads/changes
  useEffect(() => {
    if (settings) {
      setEmailAlerts(!!settings.emailAlerts);
      setWhatsappAlerts(!!settings.whatsappAlerts);
      if (settings.alertEmail) setAlertEmail(settings.alertEmail);
      if (settings.alertPhone) setAlertPhone(settings.alertPhone);
    }
  }, [settings]);

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
  const pendingDebts = transactions.filter(t => t.monthKey === currentMonthKey && t.paid_amount < t.amount);

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
        const rem = d.amount - (d.paid_amount || 0);
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
              <span className="text-xs font-bold text-slate-300 block">Moeda Conversora</span>
              <span className="text-[10px] text-slate-500">Define o símbolo de exibição.</span>
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

      {/* AUTORIZAÇÃO E CONFIGURAÇÃO DE ALERTAS AUTOMÁTICOS (EMAIL DE CAIXA) */}
      <div className="p-6 rounded-3xl glass-panel border-white/5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h5 className="font-display font-black text-white text-sm leading-none">
              Autorização de Alertas de E-mail
            </h5>
            <p className="text-[10px] text-slate-500 mt-1">Configure o recebimento de lembretes de vencimento direto no seu e-mail de forma automática.</p>
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-white/5">
          {/* E-mail alerts switch & input */}
          <div className="space-y-3 p-3 bg-white/2 rounded-2xl border border-white/3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Alertas automáticos por E-mail</span>
                  <span className="text-[9.5px] text-slate-500">Enviar lembretes iminentes antes da data de vencimento.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailAlerts ? 'bg-indigo-650' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailAlerts ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            
            {emailAlerts && (
              <div className="pt-1.5">
                <label className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">E-mail Destinatário para Alertas</label>
                <input
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 focus:border-indigo-500 focus:outline-none text-slate-200 text-xs px-3.5 py-2.5 rounded-xl block"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSaveAlerts}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Salvar Configuração de Alerta
          </button>

          {/* SIMULAÇÕES / TESTE DE DESPACHO */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1">Ambiente de Teste & Demonstração</span>
            <div className="flex justify-center">
              <button
                id="btn-test-email"
                onClick={() => {
                  setSimulatorChannel('email');
                  setIsAlertSimulatorOpen(true);
                }}
                className="w-full p-2.5 rounded-xl bg-indigo-550/10 border border-indigo-500/15 text-indigo-400 hover:bg-indigo-500/20 text-[9.5px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                📬 Simular E-mail de Notificação
              </button>
            </div>
            <p className="text-[8.5px] text-slate-500 text-center leading-normal mt-1">
              *Nota: No ambiente em nuvem, triggers automáticos são executados por uma rotina Cloud Scheduler (cron de retaguarda) vinculada ao seu Firestore. O botão acima simula a ação de disparo prévio para validar os dados cadastrados.
            </p>
          </div>
        </div>
      </div>

      {/* Action panel for Exportation and Credentials */}
      <div className="p-6 rounded-3xl glass-panel border-white/5 space-y-4">
        <h5 className="font-display font-black text-white text-sm leading-none">
          Ações e Segurança Corporativa
        </h5>

        <div className="space-y-4 pt-2">
          {/* Selector for PDF / Spreadsheet Scope */}
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
            <label className="block text-[9.5px] font-extrabold text-slate-350 uppercase tracking-widest leading-none">
              Abrangência dos Relatórios
            </label>
            <p className="text-[9.5px] text-slate-500 leading-normal">
              Escolha extrair do diário a relação de um mês específico ou o consolidado geral contendo todo o histórico acumulado.
            </p>
            <select
              value={selectedReportMonth}
              onChange={(e) => setSelectedReportMonth(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none cursor-pointer mt-1"
            >
              <option value="all">📊 Relatório Geral (Todo o Histórico Acumulado)</option>
              {uniqueMonths.map(mKey => (
                <option key={mKey} value={mKey}>
                  📅 Relatório Mensal — {formatMonthLabel(mKey)}
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
                  <span className="text-xs font-bold text-slate-300 block">Demonstrativo Detalhado (.PDF)  <span className="ml-1 px-1 bg-indigo-500/30 text-[8px] text-indigo-300 rounded font-black uppercase tracking-wider">Premium</span></span>
                  <span className="text-[9px] text-slate-500">Baixe o relatório polido de faturas, categorias e fluxos para a abrangência selecionada.</span>
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
                  <span className="text-[9px] text-slate-500">Gere uma planilha corporativa estruturada do período desejado para Excel ou Google Sheets.</span>
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

      {/* Simulator Modal for Email preview */}
      <AnimatePresence>
        {isAlertSimulatorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAlertSimulatorOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10 text-left space-y-4 border transition-all ${
                currentTheme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-slate-100/30' 
                  : 'bg-[#0f1524] border-white/10 text-white'
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-2 ${
                currentTheme === 'light' ? 'border-slate-100' : 'border-white/5'
              }`}>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  <h4 className={`font-display font-black text-xs uppercase tracking-wider ${
                    currentTheme === 'light' ? 'text-slate-800' : 'text-slate-200'
                  }`}>
                    Simulador de Alerta por E-mail (Preview)
                  </h4>
                </div>
                <button 
                  onClick={() => setIsAlertSimulatorOpen(false)}
                  className="text-slate-500 hover:text-slate-200 font-bold transition-all text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className={`p-3 rounded-xl space-y-1 text-[11px] font-mono ${
                  currentTheme === 'light' ? 'bg-slate-100 text-slate-650' : 'bg-slate-900/60 text-slate-300'
                }`}>
                  <div><strong>Destinatário:</strong> {alertEmail || 'seu-email@exemplo.com'}</div>
                  <div><strong>Assunto:</strong> ⚠️ Lembrete Importante: Contas Vencendo nos Próximos Dias</div>
                  <div><strong>Remetente:</strong> alertas@financaspro.com.br</div>
                </div>

                <div className={`p-5 rounded-2xl border text-slate-250 space-y-4 ${
                  currentTheme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-white/5'
                }`}>
                  <div className={`border-b pb-3 flex items-center justify-between ${
                    currentTheme === 'light' ? 'border-slate-200' : 'border-white/5'
                  }`}>
                    <span className="text-sm font-black text-indigo-500">FINANÇASPRO</span>
                    <span className="text-[9px] font-mono text-slate-500">2026</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs">Olá, <strong>{auth.currentUser?.email?.split('@')[0]}</strong>!</p>
                    <p className={`leading-relaxed text-[11px] ${
                      currentTheme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      Este é um comunicado automático autorizado do seu assistente de caixa. Identificamos as seguintes contas pendentes de regularização com vencimento próximo nos próximos dias:
                    </p>
                  </div>

                  <div className="space-y-2">
                    {pendingDebts.length === 0 ? (
                      <div className={`p-3 text-center text-[10px] italic rounded-xl ${
                        currentTheme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-slate-900/40 text-slate-450'
                      }`}>
                        Nenhuma conta pendente identificada para este mês! Parabéns pela organização. 🎉
                      </div>
                    ) : (
                      <div className={`border rounded-xl overflow-hidden text-[10px] ${
                        currentTheme === 'light' ? 'border-slate-200' : 'border-white/5'
                      }`}>
                        <div className={`p-2 font-bold grid grid-cols-3 border-b select-none ${
                          currentTheme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/3 border-white/5'
                        }`}>
                          <span>Descrição</span>
                          <span className="text-center">Vencimento</span>
                          <span className="text-right">Valor em Aberto</span>
                        </div>
                        {pendingDebts.map(d => (
                          <div key={d.id} className={`p-2 grid grid-cols-3 border-b last:border-0 ${
                            currentTheme === 'light' ? 'border-slate-150 hover:bg-slate-100/50' : 'border-white/3 hover:bg-white/2'
                          }`}>
                            <span className="font-bold">{d.name}</span>
                            <span className="text-center">Dia {d.due}</span>
                            <span className="text-right font-mono text-indigo-400">
                              R$ {(d.amount - d.paid_amount).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`pt-2 text-center border-t ${
                    currentTheme === 'light' ? 'border-slate-200' : 'border-white/5'
                  }`}>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Mantenha seu fluxo atualizado para garantir análises de sobras sempre fidedignas.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAlertSimulatorOpen(false);
                        showToast('Excelente! Simulação finalizada.', 'success');
                      }}
                      className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all"
                    >
                      Ok, Entendi
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
