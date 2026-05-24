import { useState, FormEvent } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, Sparkles, TrendingUp, ShieldCheck, HelpCircle, ArrowRight, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export default function AuthScreen({ onSuccess, showToast }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [isResetMode, setIsResetMode] = useState<boolean>(false);
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);

  const getAuthErrorMessage = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'A senha inserida está incorreta ou as credenciais fornecidas são inválidas. Verifique os dados e tente novamente.';
      case 'auth/user-not-found':
        return 'Nenhum usuário correspondente a este e-mail foi encontrado em nosso sistema.';
      case 'auth/email-already-in-use':
        return 'Este endereço de e-mail já está sendo utilizado por outro usuário.';
      case 'auth/weak-password':
        return 'A senha fornecida é muito fraca. Ela deve conter no mínimo 6 caracteres.';
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
        setErrorAlert(getAuthErrorMessage(err));
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

    if (isRegister) {
      if (password.length < 6) {
        setErrorAlert('A senha precisa ter no mínimo 6 caracteres por segurança.');
        setShakeTrigger(prev => prev + 1);
        return;
      }
      if (password !== confirmPassword) {
        setErrorAlert('As senhas digitadas não coincidem. Digite novamente.');
        setShakeTrigger(prev => prev + 1);
        return;
      }
      
      setLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Conta criada com sucesso!', 'success');
        onSuccess();
      } catch (err: any) {
        setErrorAlert(getAuthErrorMessage(err));
        setShakeTrigger(prev => prev + 1);
      } finally {
        setLoading(false);
      }
    } else {
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
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorAlert(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast('Autenticado com sucesso via Google!', 'success');
      onSuccess();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorAlert('Falha na autenticação via Google. Conexão cancelada ou indisponível.');
        setShakeTrigger(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-[#070a13] bg-[radial-gradient(circle_at_50%_0%,#152039_0%,#070a13_100%)]">
      {/* Content wrapper */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 flex-1">
        {/* Visual left column for branding / SaaS intro */}
      <div className="w-full md:w-1/2 max-w-lg p-6 md:p-12 text-left hidden md:flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center glow-emerald shadow-emerald-500/10">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="font-display font-extrabold text-2xl tracking-tight text-white leading-none">
            FINANÇAS<span className="text-emerald-400 font-bold ml-1">PRO</span>
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-display font-extrabold text-4xl text-white tracking-tight leading-tight mb-4"
        >
          Controle financeiro inteligente de verdade.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-slate-400 text-base mb-8 max-w-sm font-light leading-relaxed"
        >
          Seja para organizar os gastos do dia a dia, planejar metas de futuro ou auditar o caixa da sua empresa. Uma experiência premium com total segurança.
        </motion.p>

        {/* Dynamic highlights list */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Segurança de Nível SaaS</h4>
              <p className="text-xs text-slate-400">Total blindagem contra vazamentos e privacidade garantida por usuário.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 font-display">IA Insights Avançada</h4>
              <p className="text-xs text-slate-400">Conselhos automáticos e score de saúde orçamentário em tempo real.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Authentication card container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-3xl glass-panel glow-indigo border-white/5 shadow-2xl relative"
      >
        <div className="absolute top-4 right-4 text-emerald-400 animate-pulse hidden md:block">
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Screen Heading */}
        <div className="text-center mb-8">
          <div className="md:hidden flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              FINANÇAS<span className="text-emerald-400 ml-0.5">PRO</span>
            </span>
          </div>

          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
            {isResetMode ? 'Recuperar Acesso' : isRegister ? 'Criar sua conta SaaS' : 'Acesse sua Conta'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 font-light">
            {isResetMode 
              ? 'Insira seu email para recuperar sua senha' 
              : isRegister 
                ? 'Preencha os campos para começar a economizar' 
                : 'Insira suas credenciais abaixo para carregar seu caixa'}
          </p>
        </div>

        {/* Animated Custom Error Banner */}
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
              className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3 relative overflow-hidden shadow-lg shadow-rose-950/20"
            >
              <div className="w-5 h-5 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-400 mt-0.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 text-[11px] leading-relaxed pr-5 font-semibold">
                <span className="font-extrabold text-rose-200 block mb-0.5 uppercase tracking-wide text-[9px]">Falha na Operação</span>
                {errorAlert}
              </div>
              <button
                type="button"
                onClick={() => setErrorAlert(null)}
                className="absolute top-3 right-3 text-rose-400/50 hover:text-rose-200 transition-colors p-1 rounded-lg hover:bg-rose-500/15 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegister && !isResetMode && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome Completo</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm px-4 py-3.5 rounded-xl transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Endereço de E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                id="auth-email-input"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                required
                className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm pl-11 pr-4 py-3.5 rounded-xl transition-all"
              />
            </div>
          </div>

          {!isResetMode && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Senha Secreta</label>
                {!isRegister && (
                  <button 
                    type="button" 
                    onClick={() => { setIsResetMode(true); setIsRegister(false); }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  id="auth-password-input"
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required={!isResetMode}
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm pl-11 pr-4 py-3.5 rounded-xl transition-all"
                />
              </div>
            </div>
          )}

          {isRegister && !isResetMode && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm pl-11 pr-4 py-3.5 rounded-xl transition-all"
                />
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button 
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processando...' : isResetMode ? 'Enviar Link' : isRegister ? 'Confirmar Cadastro' : 'Entrar na Plataforma'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="mt-5 text-center">
          {isResetMode ? (
            <button 
              onClick={() => setIsResetMode(false)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Voltar para o Login
            </button>
          ) : (
            <p className="text-xs text-slate-400">
              {isRegister ? 'Já possui uma conta?' : 'Novo por aqui?'}
              <button 
                id="auth-toggle-mode-btn"
                onClick={() => setIsRegister(!isRegister)}
                className="text-indigo-400 font-bold ml-1.5 hover:text-indigo-300 hover:underline transition-all"
              >
                {isRegister ? 'Acessar agora' : 'Criar conta premium'}
              </button>
            </p>
          )}
        </div>

        {/* Divider line */}
        <div className="relative my-6 select-none max-w-sm mx-auto">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-[#0f1524] px-3.5 text-slate-500 font-semibold">Ou acesse com</span></div>
        </div>

        {/* Google Authentication */}
        <button 
          id="auth-google-btn"
          onClick={handleGoogleAuth}
          disabled={loading}
          type="button"
          className="w-full bg-[#111726] border border-white/5 hover:bg-[#161e31] focus:outline-none text-slate-200 mt-2 py-3.5 px-4 rounded-xl text-xs font-semibold select-none flex items-center justify-center gap-3 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4.5 h-4.5 text-slate-300" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.4-2.4C17.3 1.7 14.9 1 12.24 1c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.5 0 10-4.5 10-10 0-.6-.05-1.2-.15-1.715H12.24z"/>
          </svg>
          Entrar com a Conta Google
        </button>
      </motion.div>
      </div>

      {/* Standard page footer credits/helpline */}
      <footer className="mt-8 pt-6 border-t border-white/5 w-full max-w-md text-center space-y-1.5 shrink-0">
        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold block">BJC DESENVOLVIMENTOS SAAS</span>
        <p className="text-[10px] text-slate-400 font-light leading-relaxed">
          Dúvidas ou suporte na integração? <a href="https://wa.me/5563992092699?text=Olá,%20gostaria%20de%20suporte%20no%20FinançasPro" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Fale diretamente com nossa engenharia</a>.
        </p>
      </footer>
    </div>
  );
}
