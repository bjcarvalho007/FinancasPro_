import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ShieldCheck, Crown, Users, UserCheck, UserX, Search, Mail, Copy, Check, 
  Calendar, Sparkles, Clock, TrendingUp, Edit3, Zap, RefreshCw, Send,
  AlertTriangle, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface UserProfileData {
  uid: string;
  email: string;
  username?: string;
  displayName?: string;
  createdAt?: string;
  lastLoginAt?: string;
  assinante?: boolean;
  dataVencimento?: string;
  paymentStatus?: string;
  paymentSystem?: string;
  paymentId?: string;
}

interface AdminPanelProps {
  currentTheme: 'dark' | 'light';
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
  adminEmail: string;
}

export default function AdminPanel({
  currentTheme,
  showToast,
  adminEmail
}: AdminPanelProps) {
  const [usersList, setUsersList] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'premium' | 'free' | 'expiring'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserProfileData | null>(null);
  const [customDays, setCustomDays] = useState<number>(30);
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Stream all users from Firestore
  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const users: UserProfileData[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          users.push({
            uid: docSnap.id,
            email: data.email || 'Sem e-mail',
            username: data.username || data.displayName || '',
            displayName: data.displayName || '',
            createdAt: data.createdAt || '',
            lastLoginAt: data.lastLoginAt || '',
            assinante: data.assinante === true,
            dataVencimento: data.dataVencimento || '',
            paymentStatus: data.paymentStatus || '',
            paymentSystem: data.paymentSystem || '',
            paymentId: data.paymentId || ''
          });
        });

        // Ordenar por data de criação / login mais recente
        users.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setUsersList(users);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar lista de usuários no Admin:', error);
        setLoading(false);
        showToast('Erro ao carregar dados dos usuários do Firestore.', 'error');
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper calculation for days remaining
  const calculateDaysRemaining = (dataVencimento?: string) => {
    if (!dataVencimento) return null;
    const expiryMs = Date.parse(dataVencimento);
    if (isNaN(expiryMs)) return null;
    const diffMs = expiryMs - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = usersList.length;
    let premiumCount = 0;
    let freeCount = 0;
    let expiringSoonCount = 0;

    usersList.forEach((u) => {
      const days = calculateDaysRemaining(u.dataVencimento);
      const isPremium = u.assinante && days !== null && days > 0;
      
      if (isPremium) {
        premiumCount++;
        if (days <= 5) {
          expiringSoonCount++;
        }
      } else {
        freeCount++;
      }
    });

    const conversionRate = total > 0 ? ((premiumCount / total) * 100).toFixed(1) : '0';
    const totalRevenue = premiumCount * 11.99; // MRR estimado R$ 11,99 por assinante

    return {
      total,
      premiumCount,
      freeCount,
      expiringSoonCount,
      conversionRate,
      totalRevenue
    };
  }, [usersList]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        u.email.toLowerCase().includes(searchLower) ||
        (u.username && u.username.toLowerCase().includes(searchLower)) ||
        (u.uid && u.uid.toLowerCase().includes(searchLower));

      const days = calculateDaysRemaining(u.dataVencimento);
      const isPremium = u.assinante && days !== null && days > 0;

      if (!matchesSearch) return false;

      if (statusFilter === 'premium') return isPremium;
      if (statusFilter === 'free') return !isPremium;
      if (statusFilter === 'expiring') return isPremium && days !== null && days <= 5;

      return true;
    });
  }, [usersList, searchTerm, statusFilter]);

  // Copy email helper
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    showToast(`E-mail ${email} copiado para a área de transferência!`, 'success');
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Pre-fill email client mailto link
  const handleSendMarketingEmail = (email: string, username?: string) => {
    const name = username || email.split('@')[0];
    const subject = encodeURIComponent('✨ Convite Especial FinançasPro - Oferta Exclusiva de Acesso Premium');
    const body = encodeURIComponent(
      `Olá, ${name}!\n\n` +
      `Notei que você está utilizando o FinançasPro para gerenciar seu planejamento financeiro. Gostaria de te dar um presente exclusivo!\n\n` +
      `Com o Plano Premium do FinançasPro, você garante:\n` +
      `✅ Sincronização em tempo real de todas as suas contas\n` +
      `✅ Lançamentos e parcelamentos ilimitados\n` +
      `✅ Exportação em PDF e Excel para prestação de contas\n` +
      `✅ Relatórios e análises gráficas avançadas por categoria\n\n` +
      `Aproveite o valor promocional de apenas R$ 11,99/mês (desconto congelado para sempre).\n\n` +
      `Acesse o aplicativo agora mesmo para ativar o seu acesso completo!\n\n` +
      `Atenciosamente,\n` +
      `BJC Desenvolvimentos • FinançasPro`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Quick grant premium (+30 days or +365 days)
  const handleQuickGrant = async (userDoc: UserProfileData, daysToAdd: number) => {
    try {
      const userRef = doc(db, 'users', userDoc.uid);
      
      // Se já tem data de vencimento válida no futuro, soma aos dias existentes, senão soma a partir de hoje
      let baseDate = new Date();
      if (userDoc.dataVencimento) {
        const existingMs = Date.parse(userDoc.dataVencimento);
        if (!isNaN(existingMs) && existingMs > Date.now()) {
          baseDate = new Date(existingMs);
        }
      }
      
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      const newExpiryStr = baseDate.toISOString();

      await setDoc(userRef, {
        assinante: true,
        dataVencimento: newExpiryStr,
        paymentStatus: 'approved_admin',
        paymentSystem: 'AdminManual',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showToast(`Acesso Premium concedido por +${daysToAdd} dias para ${userDoc.email}!`, 'success');
    } catch (err) {
      console.error('Erro ao conceder acesso premium:', err);
      showToast('Falha ao atualizar status do usuário no banco de dados.', 'error');
    }
  };

  // Revoke premium
  const handleRevokePremium = async (userDoc: UserProfileData) => {
    try {
      const userRef = doc(db, 'users', userDoc.uid);
      await updateDoc(userRef, {
        assinante: false,
        paymentStatus: 'revoked_admin',
        updatedAt: new Date().toISOString()
      });
      showToast(`Acesso Premium revogado para ${userDoc.email}.`, 'warning');
    } catch (err) {
      console.error('Erro ao revogar acesso:', err);
      showToast('Falha ao revogar acesso do usuário.', 'error');
    }
  };

  // Custom date / days update handler
  const handleSaveCustomExpiry = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', editingUser.uid);
      
      let targetIsoDate = customExpiryDate;
      if (customDays > 0 && !customExpiryDate) {
        const d = new Date();
        d.setDate(d.getDate() + customDays);
        targetIsoDate = d.toISOString();
      }

      if (!targetIsoDate) {
        showToast('Por favor, defina um número de dias ou uma data válida.', 'error');
        setIsUpdating(false);
        return;
      }

      await setDoc(userRef, {
        assinante: true,
        dataVencimento: new Date(targetIsoDate).toISOString(),
        paymentStatus: 'approved_admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showToast(`Data de vencimento atualizada para ${editingUser.email}!`, 'success');
      setEditingUser(null);
    } catch (err) {
      console.error('Erro ao salvar nova data de vencimento:', err);
      showToast('Falha ao atualizar registro.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Admin Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all shadow-xl ${
        currentTheme === 'light'
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-900/40 shadow-slate-200'
          : 'bg-gradient-to-r from-slate-950 via-[#0d1326] to-slate-950 text-white border-indigo-500/30 shadow-black/80'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Painel do Administrador
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Logado como <strong className="text-white">{adminEmail}</strong>
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl tracking-tight text-white flex items-center gap-2">
              Gestão Geral de Usuários & Assinaturas ✨
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-light">
              Acompanhe em tempo real quem está usando a plataforma, gerencie validades de assinaturas, veja e-mails para marketing de conversão e ative acessos com um clique.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 500);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-300 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className={`p-5 rounded-3xl border transition-all ${
          currentTheme === 'light'
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-slate-900/80 border-white/10 text-white'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Registrados</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">{metrics.total}</div>
          <p className="text-[10px] text-slate-400 mt-1">Usuários na base de dados</p>
        </div>

        <div className={`p-5 rounded-3xl border transition-all ${
          currentTheme === 'light'
            ? 'bg-emerald-50/50 border-emerald-200 text-slate-900 shadow-sm'
            : 'bg-emerald-950/20 border-emerald-500/20 text-white'
        }`}>
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Assinantes Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">{metrics.premiumCount}</div>
          <p className="text-[10px] text-emerald-500/80 mt-1">Com acesso liberado</p>
        </div>

        <div className={`p-5 rounded-3xl border transition-all ${
          currentTheme === 'light'
            ? 'bg-amber-50/50 border-amber-200 text-slate-900 shadow-sm'
            : 'bg-amber-950/20 border-amber-500/20 text-white'
        }`}>
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Vencendo em Breve</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">{metrics.expiringSoonCount}</div>
          <p className="text-[10px] text-amber-500/80 mt-1">Expira em 5 dias ou menos</p>
        </div>

        <div className={`p-5 rounded-3xl border transition-all ${
          currentTheme === 'light'
            ? 'bg-indigo-50/50 border-indigo-200 text-slate-900 shadow-sm'
            : 'bg-indigo-950/20 border-indigo-500/20 text-white'
        }`}>
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">MRR Estimado</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-400">
            R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-indigo-400/80 mt-1">Taxa de Conversão: {metrics.conversionRate}%</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
        currentTheme === 'light'
          ? 'bg-white border-slate-200'
          : 'bg-slate-900/90 border-white/10'
      }`}>
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por e-mail, nome ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              currentTheme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-slate-950 border-white/10 text-white'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 border border-white/5'
            }`}
          >
            Todos ({metrics.total})
          </button>

          <button
            onClick={() => setStatusFilter('premium')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'premium'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 border border-white/5'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Premium ({metrics.premiumCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('free')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'free'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 border border-white/5'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-amber-400" />
            <span>Gratuitos ({metrics.freeCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('expiring')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'expiring'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 border border-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-300" />
            <span>Vencendo ({metrics.expiringSoonCount})</span>
          </button>
        </div>
      </div>

      {/* Users Cards / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
            <p>Carregando usuários do banco de dados...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl text-slate-400 text-xs font-semibold">
            Nenhum usuário encontrado para essa pesquisa ou filtro.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const daysRemaining = calculateDaysRemaining(u.dataVencimento);
            const isPremiumActive = u.assinante && daysRemaining !== null && daysRemaining > 0;
            const isExpiringSoon = isPremiumActive && daysRemaining <= 5;

            return (
              <div
                key={u.uid}
                className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  currentTheme === 'light'
                    ? 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                    : 'bg-slate-900/70 border-white/10 hover:border-indigo-500/40'
                }`}
              >
                {/* User Primary Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black shrink-0 border ${
                    isPremiumActive
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 border-white/10 text-slate-400'
                  }`}>
                    {isPremiumActive ? '👑' : '👤'}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-white truncate">
                        {u.username || u.email.split('@')[0]}
                      </span>

                      {/* Status Tag */}
                      {isPremiumActive ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                          isExpiringSoon
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          {isExpiringSoon ? 'Vencendo em breve' : 'Assinante Premium'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 text-slate-400 border border-white/10">
                          Gratuito / Trial
                        </span>
                      )}
                    </div>

                    {/* Email with copy & mailto */}
                    <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                      <span className="truncate">{u.email}</span>
                      <button
                        onClick={() => handleCopyEmail(u.email)}
                        className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Copiar e-mail"
                      >
                        {copiedEmail === u.email ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleSendMarketingEmail(u.email, u.username)}
                        className="p-1 hover:bg-indigo-500/20 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-sans font-bold"
                        title="Enviar e-mail de oferta com vantagens"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ofertar</span>
                      </button>
                    </div>

                    {/* Expiration Details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                      {u.dataVencimento ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          Vencimento:{' '}
                          <strong className="text-slate-200">
                            {new Date(u.dataVencimento).toLocaleDateString('pt-BR')}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-slate-500">Sem data de vencimento</span>
                      )}

                      {daysRemaining !== null && (
                        <span className={`font-bold ${
                          daysRemaining <= 0
                            ? 'text-rose-400'
                            : daysRemaining <= 5
                            ? 'text-amber-400 font-black'
                            : 'text-emerald-400'
                        }`}>
                          {daysRemaining > 0
                            ? `⏳ Restam ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}`
                            : `❌ Expirou há ${Math.abs(daysRemaining)} dia${Math.abs(daysRemaining) > 1 ? 's' : ''}`}
                        </span>
                      )}

                      {u.paymentSystem && (
                        <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[9.5px] uppercase font-mono text-slate-300 border border-white/5">
                          {u.paymentSystem}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Quick Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-white/5">
                  <button
                    onClick={() => handleQuickGrant(u, 30)}
                    className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Conceder +30 dias de acesso"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>+30 Dias</span>
                  </button>

                  <button
                    onClick={() => handleQuickGrant(u, 365)}
                    className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Conceder +1 ano de acesso"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>+1 Ano</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setCustomDays(30);
                      setCustomExpiryDate(
                        u.dataVencimento ? u.dataVencimento.split('T')[0] : ''
                      );
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                    title="Ajustar data manualmente"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {isPremiumActive && (
                    <button
                      onClick={() => handleRevokePremium(u)}
                      className="px-2.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all cursor-pointer"
                      title="Revogar Premium"
                    >
                      Revogar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Expiration Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-45"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1322] border border-indigo-500/30 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-50 space-y-4 text-white"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Ajustar Vencimento
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                    {editingUser.email}
                  </p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Escolha o número de dias:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 90, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setCustomDays(d);
                          const date = new Date();
                          date.setDate(date.getDate() + d);
                          setCustomExpiryDate(date.toISOString().split('T')[0]);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          customDays === d
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        +{d} dias
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Ou selecione a data exata no calendário:
                  </label>
                  <input
                    type="date"
                    value={customExpiryDate}
                    onChange={(e) => {
                      setCustomExpiryDate(e.target.value);
                      setCustomDays(0);
                    }}
                    className="w-full bg-slate-900 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 rounded-2xl border border-white/15 text-slate-400 hover:text-white font-bold text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSaveCustomExpiry}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Salvando...' : 'Salvar Alteração'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
