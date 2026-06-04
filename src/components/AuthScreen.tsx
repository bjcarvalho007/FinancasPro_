import { useState, FormEvent, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDocFromServer } from 'firebase/firestore';
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

  const [isGmailPromptOpen, setIsGmailPromptOpen] = useState<boolean>(false);
  const [promptGmailEmail, setPromptGmailEmail] = useState<string>('');
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [pendingWhatsappUrl, setPendingWhatsappUrl] = useState<string>('');

  const handleOpenWhatsappVerify = (messageText: string) => {
    setGmailError(null);
    setPromptGmailEmail('');
    setPendingWhatsappUrl(`https://wa.me/5563992092699?text=${encodeURIComponent(messageText)}`);
    setIsGmailPromptOpen(true);
  };

  // Save presentation choice to localStorage to provide bespoke user memory
  useEffect(() => {
    try {
      localStorage.setItem('finpro_show_pitch', String(showPitch));
    } catch (_) {}
  }, [showPitch]);

  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');
  const [tokenVerified, setTokenVerified] = useState<boolean | null>(null);
  const [verifyingToken, setVerifyingToken] = useState<boolean>(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [isCadastroMode, setIsCadastroMode] = useState<boolean>(false);

  const verifyToken = async (tokenValue: string) => {
    setVerifyingToken(true);
    setErrorAlert(null);
    try {
      const tokenDocRef = doc(db, "tokens_pagos", tokenValue);
      const docSnap = await getDocFromServer(tokenDocRef);
      if (docSnap && docSnap.exists()) {
        const tokenData = docSnap.data();
        if (tokenData.used === true) {
          setTokenVerified(false);
          setErrorAlert("Bloqueio de Registro: Este token de pagamento já foi utilizado para criar uma conta.");
        } else {
          setTokenVerified(true);
          if (tokenData.email) {
            setVerifiedEmail(tokenData.email);
            setEmail(tokenData.email); // Pré-preenche o e-mail cadastrado no checkout
          }
        }
      } else {
        setTokenVerified(false);
        setErrorAlert("Buscando confirmação... Seu pagamento está sendo processado pelo Stripe. Se você acabou de pagar, aguarde alguns segundos e clique em 'Verificar Novamente'.");
      }
    } catch (err: any) {
      console.error("Erro na verificação do token:", err);
      setTokenVerified(false);
      setErrorAlert("Erro ao conectar ao banco de dados para verificar seu token. Por favor, tente novamente.");
    } finally {
      setVerifyingToken(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const isCadastro = window.location.pathname.startsWith('/cadastro') || !!tokenParam;
    
    if (isCadastro) {
      setIsCadastroMode(true);
      setShowPitch(false); // Garante que o formulário de cadastro tem prioridade
      if (!tokenParam) {
        setTokenVerified(false);
        setErrorAlert("Bloqueio de Registro: Você não pode criar uma conta premium sem realizar o pagamento de R$ 9,99 antes.");
        return;
      }
      setToken(tokenParam);
      verifyToken(tokenParam);
    }
  }, []);

  const handleStripeCheckout = async () => {
    setCheckoutLoading(true);
    setErrorAlert(null);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        let errMsg = 'Falha ao iniciar o fluxo de pagamento do Stripe.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      
      const publishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        // Fallback robustamente caso a chave pública não esteja injetada localmente mas a URL esteja presente
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error("Erro de Configuração: VITE_STRIPE_PUBLISHABLE_KEY não foi definida.");
      }

      const stripe: any = await loadStripe(publishableKey);
      if (!stripe) {
        throw new Error("Não foi possível carregar a integração do Stripe Checkout.");
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.id,
      });

      if (error) {
        throw new Error(error.message || "Erro ao redirecionar para o Stripe Checkout.");
      }
    } catch (err: any) {
      console.error("Erro ao iniciar faturamento do Stripe:", err);
      setErrorAlert(err.message || 'Erro ao conectar ao servidor de faturamento.');
    } finally {
      setCheckoutLoading(false);
    }
  };

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
        showToast('Sucesso! Se o e-mail estiver cadastrado, o link de recuperação foi enviado. Verifique seu e-mail.', 'success');
        setIsResetMode(false);
      } catch (err: any) {
        console.error("Erro no envio do e-mail de recuperação:", err);
        if (err?.code === 'auth/invalid-email') {
          setErrorAlert('O formato do e-mail informado é inválido. Por favor, verifique.');
          setShakeTrigger(prev => prev + 1);
        } else {
          // Em ambientes com proteção contra enumeração, o Firebase pode lançar erros genéricos.
          // Para garantir a melhor UX e não travar usuários legítimos, exibimos a mensagem de sucesso padrão.
          showToast('Solicitação processada! Verifique sua caixa de entrada ou spam.', 'success');
          setIsResetMode(false);
        }
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

  const handleCadastroSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorAlert(null);

    if (!token) {
      setErrorAlert("Bloqueio de Registro: Um token de faturamento válido é necessário para prosseguir.");
      setShakeTrigger(prev => prev + 1);
      return;
    }

    if (!email || !email.includes("@")) {
      setErrorAlert("Por favor, informe um endereço de email válido.");
      setShakeTrigger(prev => prev + 1);
      return;
    }

    if (!password || password.length < 6) {
      setErrorAlert("Por favor, informe uma senha segura com 6 ou mais caracteres.");
      setShakeTrigger(prev => prev + 1);
      return;
    }

    setLoading(true);
    try {
      // 1. Double check the token in Firestore before registration
      const tokenDocRef = doc(db, "tokens_pagos", token);
      const tokenSnap = await getDocFromServer(tokenDocRef).catch(() => null);
      if (!tokenSnap || !tokenSnap.exists()) {
        throw new Error("Bloqueio de Registro: O token de pagamento informado é inválido.");
      }

      const tokenData = tokenSnap.data();
      if (tokenData.used === true) {
        throw new Error("Bloqueio de Registro: Este token de pagamento já foi utilizado para criar uma conta.");
      }

      // 2. Cria a conta do usuário no Firebase Auth (automatic login occurs here)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const registeredUser = userCredential.user;

      // 3. Mark the token as claimed/used associated with the uid
      await setDoc(doc(db, "tokens_pagos", token), {
        used: true,
        userId: registeredUser.uid,
        usedAt: new Date().toISOString()
      }, { merge: true });

      // 4. Vincula o token e inicializa os dados básicos do usuário no Firestore
      await setDoc(doc(db, "users", registeredUser.uid), {
        uid: registeredUser.uid,
        email: email,
        token: token,
        createdAt: new Date().toISOString()
      }, { merge: true });

      showToast("Garantia ativa. Sua conta de Membro Premium foi gerada com sucesso!", "success");
      onSuccess();
    } catch (err: any) {
      console.error("Erro ao registrar no Firebase Auth:", err);
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
          {isCadastroMode ? (
            /* ================= VIEW C: PREMIUM REGISTRATION / SIGNUP FORM ================= */
            <motion.div
              key="cadastro-view"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-md animate-fade-in"
            >
              <div className="p-6 md:p-8 rounded-3xl bg-[#090e1b] border border-white/5 shadow-2xl relative">
                <div className="absolute top-4 right-4 text-emerald-400 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>

                {/* Compact brand marker */}
                <div className="text-center mb-6">
                  <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-block mb-3">
                    ✨ Compra Confirmada - Acesso Premium
                  </span>
                  <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
                    Crie sua Conta Premium
                  </h2>
                  <p className="text-xs text-slate-400 mt-1.5 font-light leading-relaxed">
                    Defina abaixo sua senha privada para começar a organizar suas finanças de forma premium hoje mesmo.
                  </p>
                </div>

                {verifyingToken ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-spin">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse font-mono">
                      Validando faturamento no Stripe...
                    </p>
                  </div>
                ) : tokenVerified === false ? (
                  <div className="space-y-6">
                    {/* Custom Error Alert */}
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-400 mt-0.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 text-[11px] leading-relaxed font-semibold">
                        <span className="font-extrabold text-rose-200 block mb-0.5 uppercase tracking-wide text-[8.5px]">Acesso de Cadastro Bloqueado</span>
                        {errorAlert || "Você não pode criar uma conta premium sem antes realizar o pagamento."}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() => verifyToken(token)}
                        className="w-full bg-gradient-to-r from-indigo-650 to-indigo-750 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/5"
                      >
                        Verificar Novamente
                      </button>

                      <button
                        type="button"
                        onClick={handleStripeCheckout}
                        disabled={checkoutLoading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
                      >
                        {checkoutLoading ? "Iniciando pagamento..." : "Adquirir Acesso por R$ 9,99"}
                        {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCadastroMode(false);
                          window.location.search = ""; // Limpa os parâmetros
                        }}
                        className="w-full text-xs text-slate-450 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none mt-2"
                      >
                        ← Voltar para Acesso Direto
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulario de Cadastro Ativo */
                  <form onSubmit={handleCadastroSubmit} className="space-y-4">
                    {errorAlert && (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-400 mt-0.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 text-[11px] leading-relaxed font-semibold">
                          <span className="font-extrabold text-rose-200 block mb-0.5 uppercase tracking-wide text-[8.5px]">Erro de cadastro</span>
                          {errorAlert}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Seu E-mail Premium</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu.email@gmail.com"
                          required
                          disabled={!!verifiedEmail}
                          className="w-full bg-[#030610] border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-100 placeholder-slate-500 text-[13px] pl-11 pr-4 py-3 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Escolha Sua Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimo de 6 caracteres"
                          required
                          className="w-full bg-[#030610] border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-100 placeholder-slate-500 text-[13px] pl-11 pr-4 py-3 rounded-xl transition-all"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/15 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Criando Conta...' : 'Criar Minha Conta & Acessar'}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                    
                    <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold leading-relaxed pt-2">
                      🔒 Você usará este e-mail e senha para acessar o painel corporativo a qualquer momento.
                    </p>
                  </form>
                )}
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
                      ? 'Insira seu email de assinante para receber o link de recuperação.' 
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
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/15 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
                  >
                    {loading ? 'Processando...' : isResetMode ? 'Enviar Link' : 'Acessar Meu Painel'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <div className="mt-5 text-center space-y-4">
                  {isResetMode ? (
                    <button 
                      type="button"
                      onClick={() => setIsResetMode(false)}
                      className="text-xs text-slate-450 hover:text-white transition-colors font-bold bg-transparent border-none cursor-pointer"
                    >
                      ← Voltar para Acesso Direto
                    </button>
                  ) : (
                    <div className="pt-5 border-t border-white/5 space-y-4">
                      <p className="text-xs text-slate-400 leading-normal font-semibold">
                        Ainda não possui uma assinatura ativa?
                      </p>

                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStripeCheckout();
                        }}
                        disabled={checkoutLoading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/15 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
                      >
                        {checkoutLoading ? "Iniciando..." : "Quero Assinar"}
                        {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Gmail identification prompt modal before WhatsApp redirection */}
      {isGmailPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsGmailPromptOpen(false)}
          />
          
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[#0f1524] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-display font-black text-sm text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Mail className="w-4.5 h-4.5 text-emerald-400 animate-pulse" /> Identificar Seu Gmail
                </h4>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Para ser atendido com prioridade máxima, informe o seu e-mail do Gmail cadastrado ou desejado.
                </p>
              </div>
              <button
                onClick={() => setIsGmailPromptOpen(false)}
                className="p-1 px-2 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Seu e-mail (@gmail.com)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                  <input 
                    type="email" 
                    value={promptGmailEmail}
                    onChange={(e) => {
                      setPromptGmailEmail(e.target.value);
                      setGmailError(null);
                    }}
                    placeholder="seu.email@gmail.com"
                    autoFocus
                    className="w-full bg-slate-950/70 border border-white/5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-100 placeholder-slate-500 text-[13px] pl-11 pr-4 py-3 rounded-xl transition-all font-mono"
                  />
                </div>
              </div>

              {gmailError && (
                <p className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                  ⚠️ {gmailError}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setIsGmailPromptOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/15 text-slate-450 font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const clean = promptGmailEmail.trim().toLowerCase();
                  if (!clean) {
                    setGmailError('Por favor, digite o seu endereço de e-mail.');
                    return;
                  }
                  if (!clean.endsWith('@gmail.com')) {
                    setGmailError('É obrigatório que o e-mail informado seja do domínio @gmail.com.');
                    return;
                  }
                  
                  const finalUrl = `${pendingWhatsappUrl}%20-%20Email:%20${encodeURIComponent(clean)}`;
                  window.open(finalUrl, '_blank');
                  setIsGmailPromptOpen(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-500/15 transition-all cursor-pointer"
              >
                Prosseguir para o Zap
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating high-converting footer credit note */}
      <div className="mt-4 text-center select-none text-[10px] text-slate-500 hover:text-slate-400 uppercase tracking-widest font-black transition-all">
        BJC DESENVOLVIMENTOS • FINANÇASPRO premium
      </div>
    </div>
  );
}
