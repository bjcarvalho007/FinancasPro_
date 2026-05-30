import { useState, FormEvent, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Mail, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  X, 
  MessageSquare, 
  CheckCircle2, 
  Zap, 
  Coins, 
  BarChart2, 
  Target,
  ArrowLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export default function AuthScreen({ onSuccess, showToast }: AuthScreenProps) {
  // Defaults to false so returning users go directly to login without visual clutter
  const [showPitch, setShowPitch] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('finpro_show_pitch');
      return saved === 'true'; // Keep preference if they toggled pitch recently
    } catch (_) {
      return false;
    }
  });

  const [isResetMode, setIsResetMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);

  // Save presentation choice to localStorage to provide bespoke user memory
  useEffect(() => {
    try {
      localStorage.setItem('finpro_show_pitch', String(showPitch));
    } catch (_) {}
  }, [showPitch]);

  const getAuthErrorMessage = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'A senha inserida está incorreta ou as credenciais fornecidas são inválidas. Verifique os dados e tente novamente.';
      case 'auth/user-not-found':
        return 'Nenhum usuário correspondente a este e-mail foi encontrado em nosso sistema.';
      case 'auth/invalid-email':
        return 'O formato do endereço de e-mail informado é inválido.';
      case 'auth/user-disabled':
        return 'Esta conta foi desativada. Entre em contato com o suporte para reativação.';
      case 'auth/too-many-requests':
        return 'Acesso bloqueado temporariamente por excesso de tentativas incorretas. Tente novamente mais tarde.';
      default:
        return err?.message || 'Ocorreu um erro inesperado ao conectar. Por favor, tente novamente.';
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setErrorAlert(null);

    if (!email || !email.includes('@')) {
      setErrorAlert('Por favor, informe um endereço de email válido.');
      setShakeTrigger(prev => prev + 1);
      return;
    }

    if (isResetMode) {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('Link de recuperação enviado para o seu e-mail!', 'success');
        setIsResetMode(false);
      } catch (err: any) {
        if (err?.code === 'auth/user-not-found' || err?.code === 'auth/user-not-found-disabled' || err?.code === 'auth/invalid-credential') {
          setErrorAlert('Nenhum cadastro correspondente a este e-mail foi encontrado. Por favor, adquira suas credenciais Premium via WhatsApp.');
        } else {
          setErrorAlert(getAuthErrorMessage(err));
        }
        setShakeTrigger(prev => prev + 1);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorAlert('Por favor, insira sua senha de acesso.');
      setShakeTrigger(prev => prev + 1);
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Bem-vindo de volta!', 'success');
      onSuccess();
    } catch (err: any) {
      setErrorAlert(getAuthErrorMessage(err));
      setShakeTrigger(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const salesPitchWhatsappUrl = "https://wa.me/5563992092699?text=Olá!%20Gostaria%20de%20assinar%20o%20FinançasPro%20e%20liberar%20minhas%20credenciais%20de%20acesso.";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-[#070a13] bg-[radial-gradient(circle_at_50%_0%,#152039_0%,#070a13_100%)] overflow-y-auto">
      
      {/* Upper Navigation Header bar across the access screen */}
      <div className="w-full max-w-6xl flex items-center justify-between py-4 border-b border-white/5 mb-2 select-none">
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

        {/* Global Quick Toggle Switch - High Craft */}
        <button
          onClick={() => {
            setShowPitch(!showPitch);
            setErrorAlert(null);
          }}
          className={`px-4 py-2 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border cursor-pointer ${
            showPitch 
              ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/25' 
              : 'bg-emerald-600/15 border-emerald-500/30 text-emerald-450 hover:bg-emerald-600/25'
          }`}
        >
          {showPitch ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              Ir direto para Acesso
            </>
          ) : (
            <>
              <Info className="w-3.5 h-3.5" />
              💡 O Que é / Como Adquirir?
            </>
          )}
        </button>
      </div>

      {/* Main Responsive Dynamic Content Area */}
      <div className="w-full max-w-6xl flex flex-col items-center justify-center py-6 flex-1">
        <AnimatePresence mode="wait">
          {showPitch ? (
            /* ================= VIEW A: PRESENTATION / SALES LANDER ================= */
            <motion.div
              key="pitch-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 md:gap-12"
            >
              {/* Condensed Pitch details */}
              <div className="w-full lg:w-3/5 flex flex-col justify-center space-y-6 p-2">
                <div className="space-y-3">
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-max block">
                    🚀 Apresentação Oficial
                  </span>
                  <h1 className="font-display font-black text-3xl md:text-5xl text-white tracking-tight leading-tight">
                    Tenha as contas mais organizadas do <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">mercado</span>.
                  </h1>
                  <p className="text-slate-350 text-sm md:text-base font-light leading-relaxed">
                    Nossa ferramenta premium foi criada especificamente para centralizar, controlar e prever as contas do seu mês com agilidade absoluta. Sem spam, sem anúncios e com total controle de acesso.
                  </p>
                </div>

                {/* Grid summary features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex gap-3">
                    <div className="w-8.5 h-8.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-slate-100">Contas Fixas & Ganhos</h4>
                      <p className="text-[11.5px] text-slate-400 leading-normal mt-0.5">Monitore vencimentos recorrentes, margem de lucratividade e fluxo de caixa.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex gap-3">
                    <div className="w-8.5 h-8.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                      <Coins className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-slate-100">Gastos Variados & Parcelados</h4>
                      <p className="text-[11.5px] text-slate-400 leading-normal mt-0.5">Planeje faturas extras, controle parcelas ativas e evite dores de cabeça.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex gap-3">
                    <div className="w-8.5 h-8.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                      <BarChart2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-slate-100">IA Inteligência de Saúde</h4>
                      <p className="text-[11.5px] text-slate-400 leading-normal mt-0.5">Diagnóstico orçamentário profundo e sugestões táticas de forma automatizada.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex gap-3">
                    <div className="w-8.5 h-8.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-400">
                      <Target className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-slate-100">Cofrinhos / Metas CDI</h4>
                      <p className="text-[11.5px] text-slate-400 leading-normal mt-0.5">Rentabilize e simule projeções fiscais com precisão matemática refinada.</p>
                    </div>
                  </div>
                </div>

                {/* Activation call-to-action */}
                <div className="p-5 rounded-3xl bg-indigo-950/20 border border-indigo-500/20 relative overflow-hidden backdrop-blur-md">
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1">
                        <Zap className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                        Como obter meu login de acesso?
                      </span>
                      <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                        Garantimos privacidade de alto nível. Novos usuários ganham workspaces privativos configurados sob demanda pelo nosso administrador. Adquira instantaneamente pelo WhatsApp!
                      </p>
                    </div>
                    <a
                      href={salesPitchWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-3.5 rounded-2xl text-[10.5px] uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 shrink-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Assinar Premium Novo
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar Action Card - Back to Login shortcut */}
              <div className="w-full lg:w-2/5 flex items-center justify-center p-2">
                <div className="w-full max-w-md p-6 md:p-8 rounded-3xl bg-[#090e1b] border border-white/5 shadow-2xl text-center space-y-6">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                    <Lock className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-white tracking-tight">Já possui cadastro premium?</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1.5 max-w-xs mx-auto">
                      Se você contratou nosso plano e já possui o e-mail cadastrado, acesse clicando abaixo.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowPitch(false);
                      setErrorAlert(null);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Ir ao Painel de Acesso
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2">
                    <a
                      href={salesPitchWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-450 font-bold uppercase tracking-wider hover:underline"
                    >
                      Adquirir login Premium via WhatsApp →
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ================= VIEW B: CLEAN DIRECT CONNECT (DEFAULT) ================= */
            <motion.div
              key="login-view"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-md"
            >
              <div className="p-6 md:p-8 rounded-3xl bg-[#090e1b] border border-white/5 shadow-2xl relative">
                <div className="absolute top-4 right-4 text-emerald-400 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>

                {/* Compact brand marker */}
                <div className="text-center mb-6">
                  <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
                    {isResetMode ? 'Recuperar Senha' : 'Acesse seu Workspace'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1.5 font-light leading-relaxed">
                    {isResetMode 
                      ? 'Insira seu email premium para receber o link de recuperação.' 
                      : 'Digite seus dados de segurança corporativos abaixo.'}
                  </p>
                </div>

                {/* Custom Error Alert */}
                <AnimatePresence>
                  {errorAlert && (
                    <motion.div
                      key={shakeTrigger}
                      initial={{ opacity: 0, y: -12, scale: 0.95 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        x: [0, -12, 12, -10, 10, -5, 5, 0]
                      }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ 
                        type: 'spring', 
                        duration: 0.4,
                        x: { duration: 0.45, ease: 'easeInOut' }
                      }}
                      className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3 relative overflow-hidden"
                    >
                      <div className="w-5 h-5 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-400 mt-0.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 text-[11px] leading-relaxed pr-5 font-semibold">
                        <span className="font-extrabold text-rose-200 block mb-0.5 uppercase tracking-wide text-[8.5px]">Erro no login</span>
                        {errorAlert}
                      </div>
                      <button
                        type="button"
                        onClick={() => setErrorAlert(null)}
                        className="absolute top-3 right-3 text-rose-400/50 hover:text-rose-200 transition-colors p-1 rounded-lg hover:bg-rose-500/15 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">E-mail Credenciado</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input 
                        id="auth-email-input"
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemplo@financaspro.com"
                        required
                        className="w-full bg-slate-950/70 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-100 placeholder-slate-500 text-[13px] pl-11 pr-4 py-3 rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {!isResetMode && (
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Senha Provisória ou Pessoal</label>
                        <button 
                          type="button" 
                          onClick={() => setIsResetMode(true)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                        >
                          Esqueceu?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                        <input 
                          id="auth-password-input"
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required={!isResetMode}
                          className="w-full bg-slate-950/70 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-100 placeholder-slate-500 text-[13px] pl-11 pr-4 py-3 rounded-xl transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submission Trigger */}
                  <button 
                    id="auth-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/15 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Processando...' : isResetMode ? 'Enviar Link' : 'Acessar Meu Painel'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <div className="mt-5 text-center space-y-4">
                  {isResetMode ? (
                    <button 
                      onClick={() => setIsResetMode(false)}
                      className="text-xs text-slate-450 hover:text-white transition-colors font-bold"
                    >
                      ← Voltar para Acesso Direto
                    </button>
                  ) : (
                    <div className="space-y-3.5 pt-1.5 border-t border-white/5">
                      <div className="text-xs text-slate-400 leading-normal font-semibold">
                        Ainda não tem acesso cadastrado?
                        <button
                          onClick={() => {
                            setShowPitch(true);
                            setErrorAlert(null);
                          }}
                          className="text-indigo-400 font-extrabold ml-1.5 hover:text-indigo-300 hover:underline cursor-pointer"
                        >
                          Ver apresentação & Como Assinar →
                        </button>
                      </div>

                      <a 
                        href={salesPitchWhatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 font-black hover:text-emerald-300 hover:underline transition-all block uppercase tracking-widest text-[9.5px]"
                      >
                        ⚡ Liberar Acesso no WhatsApp →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating high-converting footer credit note */}
      <div className="mt-4 text-center select-none text-[10px] text-slate-500 hover:text-slate-400 uppercase tracking-widest font-black transition-all">
        BJC DESENVOLVIMENTOS • FINANÇASPRO premium
      </div>
    </div>
  );
}
