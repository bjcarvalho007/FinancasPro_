import { useState } from 'react';
import { Transaction } from '../types';
import { auth } from '../firebase';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { Settings, Download, Trash2, ShieldAlert, KeyRound, DollarSign, Eye, RefreshCw, Sun, Moon } from 'lucide-react';

interface SettingsPanelProps {
  currentTheme: 'dark' | 'light';
  onChangeTheme: (theme: 'dark' | 'light') => void;
  currentCurrency: 'BRL' | 'USD' | 'EUR';
  onChangeCurrency: (currency: 'BRL' | 'USD' | 'EUR') => void;
  baseIncome: number;
  baseBalance: number;
  onSavePreferences: (income: number, balance: number) => void;
  transactions: Transaction[];
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
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
  showToast
}: SettingsPanelProps) {
  const [incStr, setIncStr] = useState<string>(
    baseIncome > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseIncome) : ''
  );
  const [balStr, setBalStr] = useState<string>(
    baseBalance > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseBalance) : ''
  );

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
    onSavePreferences(inc, bal);
    showToast('Preferências base salvas com sucesso!', 'success');
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

  // Real, functional CSV exporting of all real Firestore entries!
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('Nenhum lançamento gravado para exportar.', 'warning');
      return;
    }

    let csvContent = "\uFEFF"; // Byte Order Mark for Excel compatibility
    csvContent += "ID,Descrição,Valor (R$),Moeda,Fluxo,Categoria,Vencimento,Valor Pago,Status Pagamento,Mes de Lancamento\n";

    transactions.forEach(t => {
      const isPaid = t.paid_amount >= t.amount ? "PAGO" : t.paid_amount > 0 ? "PARTIAL" : "PENDENTE";
      csvContent += `"${t.id}","${t.name.replace(/"/g, '""')}",${t.amount},"${currentCurrency}","${t.type}","${t.cat}","${t.due}",${t.paid_amount},"${isPaid}","${t.monthKey}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financaspro_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Dados exportados com sucesso em CSV!', 'success');
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "TEM CERTEZA DEFINITIVA? Esta operação é irreversível e removerá sua conta e todos os lançamentos financeiros vinculados do Firestore."
    );
    if (!confirm) return;

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
            <p className="text-xs text-slate-500">Ajuste os parâmetros visuais, cambiais e operacionais do seu SaaS.</p>
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

      {/* Action panel for Exportation and Credentials */}
      <div className="p-6 rounded-3xl glass-panel border-white/5 space-y-4">
        <h5 className="font-display font-black text-white text-sm leading-none">
          Ações e Segurança Corporativa
        </h5>

        <div className="space-y-2 pt-2">
          {/* CSV Download Trigger */}
          <button
            id="btn-settings-export"
            onClick={handleExportCSV}
            className="w-full text-left p-3 rounded-xl bg-white/3 border border-white/5 hover:border-indigo-500/50 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold text-slate-300 block">Exportar Relatório Geral (.CSV)</span>
                <span className="text-[9px] text-slate-500">Extraia todas as transações para Excel ou Planilhas.</span>
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
                <span className="text-xs font-bold text-rose-400 block">Excluir Conta SaaS</span>
                <span className="text-[9px] text-rose-500">Deleta permanentemente seu cadastro e logs.</span>
              </div>
            </div>
            <span className="text-rose-500/60 text-xs group-hover:text-rose-500 transition-colors">➔</span>
          </button>
        </div>
      </div>
    </div>
  );
}
