import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ShieldCheck, Crown, Users, UserCheck, UserX, Search, Mail, Copy, Check, 
  Calendar, Sparkles, Clock, TrendingUp, Edit3, Zap, RefreshCw, Send,
  AlertTriangle, Filter, History, Laptop, Smartphone, Monitor, Globe, Activity, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface UserProfileData {
  uid: string;
  allUids?: string[];
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
  paymentApprovedAt?: string;
  dataAquisicao?: string;
}

interface AdminPanelProps {
  currentTheme: 'dark' | 'light';
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
  adminEmail: string;
}

const ALLOWED_ADMIN_EMAILS = ['bjcarvalho07@gmail.com', 'bjcarvalho007@gmail.com'];

export default function AdminPanel({
  currentTheme,
  showToast,
  adminEmail
}: AdminPanelProps) {
  const isAuthorized = useMemo(() => {
    return !!(adminEmail && ALLOWED_ADMIN_EMAILS.includes(adminEmail.toLowerCase().trim()));
  }, [adminEmail]);

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

  // Email Selection Modal State
  const [emailUserModal, setEmailUserModal] = useState<UserProfileData | null>(null);

  // Login History Modal State
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<UserProfileData | null>(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState<Array<{
    id: string;
    timestamp: string;
    device?: string;
    userAgent?: string;
    platform?: string;
    screen?: string;
    type?: string;
  }>>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Stream login history when a user is selected
  useEffect(() => {
    if (!selectedUserForLogs) {
      setSelectedUserLogs([]);
      return;
    }

    setLoadingLogs(true);
    const u = selectedUserForLogs;

    // Se for um usuário real do Firestore (não sintético vip_)
    if (u.uid && !u.uid.startsWith('vip_')) {
      const logsRef = collection(db, 'users', u.uid, 'login_history');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));

      getDocs(q)
        .then((snapshot) => {
          const list: any[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });

          // Se não houver logs salvos na subcoleção ainda, adicionar log derivado do lastLoginAt/createdAt
          if (list.length === 0) {
            if (u.lastLoginAt) {
              list.push({
                id: 'last_login',
                timestamp: u.lastLoginAt,
                device: 'Navegador / App',
                type: 'Último Acesso Registrado'
              });
            }
            if (u.createdAt && u.createdAt !== u.lastLoginAt) {
              list.push({
                id: 'created_at',
                timestamp: u.createdAt,
                device: 'Registro Inicial',
                type: 'Criação de Conta'
              });
            }
          }

          setSelectedUserLogs(list);
        })
        .catch((err) => {
          console.warn("Erro ao carregar histórico de logins do usuário:", err);
          const fallbackList: any[] = [];
          if (u.lastLoginAt) {
            fallbackList.push({
              id: 'last_login',
              timestamp: u.lastLoginAt,
              device: 'Navegador Web',
              type: 'Último Acesso'
            });
          }
          if (u.createdAt) {
            fallbackList.push({
              id: 'created_at',
              timestamp: u.createdAt,
              device: 'Registro Inicial',
              type: 'Criação da Conta'
            });
          }
          setSelectedUserLogs(fallbackList);
        })
        .finally(() => {
          setLoadingLogs(false);
        });
    } else {
      // Para VIPs/Sintéticos sem UID no Firestore
      const fallbackList: any[] = [];
      if (u.lastLoginAt) {
        fallbackList.push({
          id: 'last_login',
          timestamp: u.lastLoginAt,
          device: 'Navegador Web (VIP)',
          type: 'Acesso VIP Registrado'
        });
      }
      if (u.createdAt) {
        fallbackList.push({
          id: 'created_at',
          timestamp: u.createdAt,
          device: 'Ativação VIP',
          type: 'Concessão do Acesso'
        });
      }
      setSelectedUserLogs(fallbackList);
      setLoadingLogs(false);
    }
  }, [selectedUserForLogs]);

  // Stream all users from Firestore
  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const emailMap = new Map<string, UserProfileData & { allUids: string[] }>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rawEmail = data.email || 'Sem e-mail';
          const emailKey = rawEmail.toLowerCase().trim();

          const currentItem: UserProfileData & { allUids: string[] } = {
            uid: docSnap.id,
            allUids: [docSnap.id],
            email: rawEmail,
            username: data.username || data.displayName || '',
            displayName: data.displayName || '',
            createdAt: data.createdAt || '',
            lastLoginAt: data.lastLoginAt || '',
            assinante: data.assinante === true,
            dataVencimento: data.dataVencimento || '',
            paymentStatus: data.paymentStatus || '',
            paymentSystem: data.paymentSystem || '',
            paymentId: data.paymentId || '',
            paymentApprovedAt: data.paymentApprovedAt || data.dataAquisicao || '',
            dataAquisicao: data.dataAquisicao || data.paymentApprovedAt || ''
          };

          if (emailKey === 'sem e-mail' || !emailKey) {
            emailMap.set(`nouid_${docSnap.id}`, currentItem);
          } else if (!emailMap.has(emailKey)) {
            emailMap.set(emailKey, currentItem);
          } else {
            const existing = emailMap.get(emailKey)!;
            if (!existing.allUids.includes(docSnap.id)) {
              existing.allUids.push(docSnap.id);
            }

            const existingExp = existing.dataVencimento ? Date.parse(existing.dataVencimento) : 0;
            const currentExp = currentItem.dataVencimento ? Date.parse(currentItem.dataVencimento) : 0;
            const existingIsPrem = existing.assinante && existingExp > Date.now();
            const currentIsPrem = currentItem.assinante && currentExp > Date.now();

            let replace = false;
            if (currentIsPrem && !existingIsPrem) {
              replace = true;
            } else if (currentIsPrem === existingIsPrem) {
              const existingTime = Math.max(
                existing.createdAt ? Date.parse(existing.createdAt) || 0 : 0,
                existing.lastLoginAt ? Date.parse(existing.lastLoginAt) || 0 : 0
              );
              const currentTime = Math.max(
                currentItem.createdAt ? Date.parse(currentItem.createdAt) || 0 : 0,
                currentItem.lastLoginAt ? Date.parse(currentItem.lastLoginAt) || 0 : 0
              );
              if (currentTime > existingTime) {
                replace = true;
              }
            }

            if (replace) {
              const uids = existing.allUids;
              emailMap.set(emailKey, { ...currentItem, allUids: uids });
            } else {
              if (!existing.username && currentItem.username) existing.username = currentItem.username;
              if (!existing.dataVencimento && currentItem.dataVencimento) existing.dataVencimento = currentItem.dataVencimento;
              if (!existing.paymentApprovedAt && currentItem.paymentApprovedAt) existing.paymentApprovedAt = currentItem.paymentApprovedAt;
              if (!existing.dataAquisicao && currentItem.dataAquisicao) existing.dataAquisicao = currentItem.dataAquisicao;
            }
          }
        });

        const users = Array.from(emailMap.values());

        // Garantir exibição de e-mails VIPs configurados mesmo que ainda não tenham documento Firestore
        const KNOWN_VIP_EMAILS = ['msouzacintia600@gmail.com', 'teste@gmail.com'];
        KNOWN_VIP_EMAILS.forEach((vipEmail) => {
          const key = vipEmail.toLowerCase().trim();
          if (!emailMap.has(key)) {
            users.push({
              uid: `vip_${key.replace(/[^a-z0-9]/g, '_')}`,
              allUids: [`vip_${key.replace(/[^a-z0-9]/g, '_')}`],
              email: vipEmail,
              username: vipEmail.split('@')[0],
              displayName: vipEmail.split('@')[0],
              createdAt: new Date().toISOString(),
              lastLoginAt: '',
              assinante: true,
              dataVencimento: new Date('2030-12-31T23:59:59Z').toISOString(),
              paymentStatus: 'vip_access',
              paymentSystem: 'Acesso VIP'
            });
          }
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

  // Helper to format ISO date to readable PT-BR string
  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return null;
    const dateFormatted = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeFormatted = d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateFormatted} às ${timeFormatted}`;
  };

  // Helper to get acquisition date (for premium) or trial start date (for free)
  const getUserDateInfo = (u: UserProfileData, isPremium: boolean) => {
    if (isPremium) {
      const rawApproved = u.paymentApprovedAt || u.dataAquisicao;
      if (rawApproved) {
        const formatted = formatDateTime(rawApproved);
        if (formatted) return { type: 'premium', label: 'Adquirido em', value: formatted };
      }
      if (u.dataVencimento) {
        const expTime = Date.parse(u.dataVencimento);
        if (!isNaN(expTime)) {
          const estimatedAcq = new Date(expTime - 30 * 24 * 60 * 60 * 1000);
          return {
            type: 'premium',
            label: 'Adquirido em',
            value: estimatedAcq.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          };
        }
      }
      if (u.createdAt) {
        const formatted = formatDateTime(u.createdAt);
        if (formatted) return { type: 'premium', label: 'Adquirido em', value: formatted };
      }
      return { type: 'premium', label: 'Adquirido em', value: 'Data não informada' };
    } else {
      if (u.createdAt) {
        const formatted = formatDateTime(u.createdAt);
        if (formatted) return { type: 'free', label: 'Teste iniciado em', value: formatted };
      }
      if (u.lastLoginAt) {
        const formatted = formatDateTime(u.lastLoginAt);
        if (formatted) return { type: 'free', label: 'Teste iniciado em', value: formatted };
      }
      return { type: 'free', label: 'Teste iniciado em', value: 'Data não informada' };
    }
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

  // Pre-fill email client mailto link based on chosen template
  const handleSendTemplateEmail = (
    email: string,
    templateType: 'expiring_soon' | 'expired' | 'promotional',
    username?: string
  ) => {
    const name = username || email.split('@')[0];
    let subject = '';
    let body = '';

    if (templateType === 'expiring_soon') {
      subject = '⏳ Seu teste gratuito do FinançasPro está prestes a vencer! Não perca seu controle financeiro';
      body =
        `Olá, ${name}!\n\n` +
        `Passando para te avisar que faltam poucos dias para o término do seu período de teste gratuito do FinançasPro.\n\n` +
        `Não deixe seu controle financeiro parar! Garanta o Acesso Premium por apenas R$ 11,99/mês e continue aproveitando todas as vantagens sem nenhuma interrupção:\n` +
        `• Gestão completa de contas, receitas e despesas fixas\n` +
        `• Controle de parcelamentos e metas financeiras inteligentes\n` +
        `• Relatórios gráficos interativos e exportação em 1 clique\n\n` +
        `Ative seu Plano Premium agora mesmo antes que o período de teste acabe:\n` +
        `https://www.financaspro.solutions/\n\n` +
        `Atenciosamente,\n` +
        `Equipe FinançasPro`;
    } else if (templateType === 'expired') {
      subject = '🚨 Seu período de teste do FinançasPro acabou! Ative o Premium por R$ 11,99/mês';
      body =
        `Olá, ${name}!\n\n` +
        `Notamos que o seu período de teste gratuito do FinançasPro chegou ao fim.\n\n` +
        `Para continuar organizando suas finanças com receitas, despesas, parcelamentos e relatórios sem nenhuma interrupção, faça o upgrade para o FinançasPro Premium por apenas R$ 11,99/mês!\n\n` +
        `Aproveite para reativar seu acesso instantaneamente pelo link abaixo:\n` +
        `https://www.financaspro.solutions/\n\n` +
        `Atenciosamente,\n` +
        `Equipe FinançasPro`;
    } else {
      // promotional
      subject = '🚨 Restam apenas 2 vagas no valor promocional de R$ 11,99/mês | FinançasPro';
      body =
        `Olá, ${name}!\n\n` +
        `Restam APENAS 2 VAGAS para você garantir o Acesso Premium ao FinançasPro pelo valor promocional de R$ 11,99/mês!\n\n` +
        `Com o FinançasPro você conta com:\n` +
        `• Controle de receitas, despesas fixas e parcelamentos\n` +
        `• Gestão de metas financeiras e relatórios gráficos interativos\n` +
        `• Exportação de relatórios detalhados em 1 clique\n\n` +
        `Aproveite para liberar seu acesso antes que as vagas acabem:\n` +
        `https://www.financaspro.solutions/\n\n` +
        `Atenciosamente,\n` +
        `Equipe FinançasPro`;
    }

    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    showToast(`Cliente de e-mail aberto para ${email}!`, 'success');
    setEmailUserModal(null);
  };

  // Quick grant premium (+30 days or +365 days)
  const handleQuickGrant = async (userDoc: UserProfileData, daysToAdd: number) => {
    try {
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

      const nowIso = new Date().toISOString();
      const targetUids = userDoc.allUids && userDoc.allUids.length > 0 ? userDoc.allUids : [userDoc.uid];

      await Promise.all(
        targetUids.map((uid) =>
          setDoc(doc(db, 'users', uid), {
            assinante: true,
            dataVencimento: newExpiryStr,
            paymentStatus: 'approved_admin',
            paymentSystem: 'AdminManual',
            paymentApprovedAt: userDoc.paymentApprovedAt || userDoc.dataAquisicao || nowIso,
            dataAquisicao: userDoc.dataAquisicao || userDoc.paymentApprovedAt || nowIso,
            updatedAt: nowIso
          }, { merge: true })
        )
      );

      showToast(`Acesso Premium concedido por +${daysToAdd} dias para ${userDoc.email}!`, 'success');
    } catch (err) {
      console.error('Erro ao conceder acesso premium:', err);
      showToast('Falha ao atualizar status do usuário no banco de dados.', 'error');
    }
  };

  // Revoke premium
  const handleRevokePremium = async (userDoc: UserProfileData) => {
    try {
      const targetUids = userDoc.allUids && userDoc.allUids.length > 0 ? userDoc.allUids : [userDoc.uid];
      const nowIso = new Date().toISOString();
      await Promise.all(
        targetUids.map((uid) =>
          setDoc(doc(db, 'users', uid), {
            assinante: false,
            dataVencimento: nowIso,
            paymentStatus: 'revoked_admin',
            updatedAt: nowIso
          }, { merge: true })
        )
      );
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
      let targetExpiry: Date;

      if (customExpiryDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(customExpiryDate)) {
          targetExpiry = new Date(`${customExpiryDate}T23:59:59.999Z`);
        } else {
          targetExpiry = new Date(customExpiryDate);
        }
      } else if (customDays > 0) {
        targetExpiry = new Date();
        targetExpiry.setDate(targetExpiry.getDate() + customDays);
      } else {
        showToast('Por favor, defina um número de dias ou selecione uma data válida no calendário.', 'error');
        setIsUpdating(false);
        return;
      }

      if (isNaN(targetExpiry.getTime())) {
        showToast('Data selecionada inválida.', 'error');
        setIsUpdating(false);
        return;
      }

      const isFuture = targetExpiry.getTime() > Date.now();
      const nowIso = new Date().toISOString();
      const targetUids = editingUser.allUids && editingUser.allUids.length > 0 ? editingUser.allUids : [editingUser.uid];

      await Promise.all(
        targetUids.map((uid) =>
          setDoc(doc(db, 'users', uid), {
            assinante: isFuture,
            dataVencimento: targetExpiry.toISOString(),
            paymentStatus: isFuture ? 'approved_admin' : 'expired_admin',
            paymentSystem: 'AdminManual',
            updatedAt: nowIso
          }, { merge: true })
        )
      );

      showToast(`Data de vencimento (${targetExpiry.toLocaleDateString('pt-BR')}) atualizada com sucesso para ${editingUser.email}!`, 'success');
      setEditingUser(null);
      setCustomExpiryDate('');
      setCustomDays(0);
    } catch (err) {
      console.error('Erro ao salvar nova data de vencimento:', err);
      showToast('Falha ao atualizar data de vencimento no banco de dados.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className={`p-8 sm:p-12 rounded-3xl border text-center space-y-4 my-8 max-w-xl mx-auto shadow-2xl ${
        currentTheme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-white/10 text-white'
      }`}>
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-7 h-7 text-rose-500" />
        </div>
        <h3 className="font-display font-black text-xl tracking-tight">Acesso Restrito ao Administrador</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-light">
          Este painel é protegido por regras de segurança do Firebase no servidor e exclusivo para administradores. Seu usuário não possui autorização.
        </p>
      </div>
    );
  }

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

            // Effective expiration date for Free / Trial accounts (explicit dataVencimento or createdAt + 5 days)
            const effectiveFreeVencimento = u.dataVencimento || (u.createdAt ? new Date(Date.parse(u.createdAt) + 5 * 24 * 60 * 60 * 1000).toISOString() : null);
            const freeDaysRemaining = calculateDaysRemaining(effectiveFreeVencimento || undefined);
            const isFreeTrialActive = !isPremiumActive && freeDaysRemaining !== null && freeDaysRemaining > 0;

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
                      : isFreeTrialActive
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {isPremiumActive ? '👑' : isFreeTrialActive ? '⏳' : '👤'}
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
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          isFreeTrialActive
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {isFreeTrialActive ? `Trial Ativo (${freeDaysRemaining}d restante${freeDaysRemaining > 1 ? 's' : ''})` : 'Gratuito / Trial Expirado'}
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
                        onClick={() => setEmailUserModal(u)}
                        className="p-1 hover:bg-indigo-500/20 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-sans font-bold border border-indigo-500/30 px-2 py-0.5 bg-indigo-500/10"
                        title="Escolher modelo de e-mail para enviar ao usuário"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Enviar E-mail</span>
                      </button>
                    </div>

                    {/* Expiration and Acquisition / Trial Details */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] pt-1">
                      {/* 1. Acquisition Date for Premium or Trial Start Date for Free */}
                      {(() => {
                        const dateInfo = getUserDateInfo(u, isPremiumActive);
                        return (
                          <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-medium ${
                            dateInfo.type === 'premium'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                          }`}>
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{dateInfo.label}: <strong className="font-bold">{dateInfo.value}</strong></span>
                          </span>
                        );
                      })()}

                      {/* 2. Vencimento Date */}
                      {isPremiumActive && u.dataVencimento && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          Vencimento:{' '}
                          <strong className="text-white">
                            {new Date(u.dataVencimento).toLocaleDateString('pt-BR')}
                          </strong>
                        </span>
                      )}

                      {/* 3. Days Remaining */}
                      {daysRemaining !== null && isPremiumActive && (
                        <span className={`font-extrabold ${
                          daysRemaining <= 5 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                        }`}>
                          ⏳ Restam {daysRemaining} dia{daysRemaining > 1 ? 's' : ''}
                        </span>
                      )}

                      {!isPremiumActive && (
                        <>
                          {effectiveFreeVencimento ? (
                            <>
                              <span className="flex items-center gap-1 text-slate-300">
                                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                {freeDaysRemaining !== null && freeDaysRemaining > 0 ? 'Vencimento do Teste: ' : 'Venceu o teste em: '}
                                <strong className={freeDaysRemaining !== null && freeDaysRemaining <= 0 ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
                                  {new Date(effectiveFreeVencimento).toLocaleDateString('pt-BR')}
                                </strong>
                              </span>

                              {freeDaysRemaining !== null && freeDaysRemaining > 0 ? (
                                <span className="text-amber-400 font-extrabold">
                                  ⏳ Restam {freeDaysRemaining} dia{freeDaysRemaining > 1 ? 's' : ''} de teste
                                </span>
                              ) : (
                                <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                  ❌ Expirou em {new Date(effectiveFreeVencimento).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Sem data de vencimento</span>
                          )}
                        </>
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
                    onClick={() => setSelectedUserForLogs(u)}
                    className="px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Ver histórico de logins e acessos deste usuário"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Logins</span>
                  </button>

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

        {/* User Login History Modal */}
        {selectedUserForLogs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserForLogs(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-45"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1322] border border-cyan-500/30 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative z-50 space-y-5 text-white max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                      Histórico de Logins e Acessos
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                      {selectedUserForLogs.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUserForLogs(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Overview Quick Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/80 border border-white/5 text-xs shrink-0">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Status da Conta:</span>
                  <span className={`font-black ${selectedUserForLogs.assinante ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedUserForLogs.assinante ? '👑 Assinante Premium' : '👤 Gratuito'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Acessos Gravados:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {selectedUserLogs.length} registro{selectedUserLogs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Último Acesso:</span>
                  <span className="font-mono font-medium text-slate-200 text-[11px]">
                    {selectedUserForLogs.lastLoginAt ? formatDateTime(selectedUserForLogs.lastLoginAt) : 'Sem registro'}
                  </span>
                </div>
              </div>

              {/* Login Log Entries List */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 min-h-[220px]">
                {loadingLogs ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
                    <p>Buscando histórico de acessos no banco de dados...</p>
                  </div>
                ) : selectedUserLogs.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-400 text-xs font-medium space-y-2">
                    <Activity className="w-8 h-8 text-slate-500 mx-auto" />
                    <p>Nenhum registro de acesso detalhado encontrado para este usuário.</p>
                    <p className="text-[10px] text-slate-500">Novos logins efetuados serão gravados automaticamente aqui em tempo real.</p>
                  </div>
                ) : (
                  selectedUserLogs.map((log, index) => {
                    const isMobile = log.device?.toLowerCase().includes('iphone') || log.device?.toLowerCase().includes('android') || log.device?.toLowerCase().includes('ipad');
                    const isDesktop = log.device?.toLowerCase().includes('windows') || log.device?.toLowerCase().includes('mac') || log.device?.toLowerCase().includes('pc') || log.device?.toLowerCase().includes('linux');

                    return (
                      <div
                        key={log.id || index}
                        className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isMobile 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                              : isDesktop 
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                          }`}>
                            {isMobile ? <Smartphone className="w-4 h-4" /> : isDesktop ? <Monitor className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-200">
                                {log.device || 'Navegador Web'}
                              </span>

                              {index === 0 && (
                                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Mais Recente
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] font-mono text-cyan-300">
                              📅 {formatDateTime(log.timestamp) || log.timestamp}
                            </p>

                            {log.screen && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                Resolução da tela: {log.screen}
                              </p>
                            )}

                            {log.userAgent && (
                              <p className="text-[9.5px] text-slate-500 truncate max-w-sm font-mono" title={log.userAgent}>
                                {log.userAgent}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/5 inline-block">
                            {log.type || 'Sessão Ativa'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-white/10 text-right shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedUserForLogs(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Template Options Modal */}
      <AnimatePresence>
        {emailUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEmailUserModal(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-45"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0d1322] border border-indigo-500/30 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-50 space-y-5 text-white max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4 shrink-0">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-indigo-400" />
                    Enviar E-mail ao Usuário
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <span>Destinatário:</span>
                    <strong className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                      {emailUserModal.email}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailUserModal(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed shrink-0">
                Selecione qual mensagem deseja enviar para <strong className="text-white">{emailUserModal.username || emailUserModal.email}</strong>. Ao clicar na opção, o seu programa/cliente de e-mail será aberto automaticamente com o assunto e corpo preenchidos.
              </p>

              {/* Template List */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {/* Opção 1: Prestes a vencer */}
                <div
                  onClick={() => handleSendTemplateEmail(emailUserModal.email, 'expiring_soon', emailUserModal.username)}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer group flex items-start gap-3.5 shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-amber-300 group-hover:text-amber-200">
                        ⏳ Teste Prestes a Vencer
                      </h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Alerta Prévio
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Para usuários em teste gratuito com vencimento em breve. Alerta sobre o fim do teste e incentiva o upgrade para R$ 11,99/mês.
                    </p>
                  </div>
                </div>

                {/* Opção 2: Teste Expirado */}
                <div
                  onClick={() => handleSendTemplateEmail(emailUserModal.email, 'expired', emailUserModal.username)}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer group flex items-start gap-3.5 shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-rose-300 group-hover:text-rose-200">
                        🚨 Teste Gratuito Expirado
                      </h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Expirou
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Para usuários cujo teste gratuito já encerrou. Solicita a ativação do plano Premium por R$ 11,99/mês para desbloqueio do sistema.
                    </p>
                  </div>
                </div>

                {/* Opção 3: Oferta Promocional (2 Vagas) */}
                <div
                  onClick={() => handleSendTemplateEmail(emailUserModal.email, 'promotional', emailUserModal.username)}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer group flex items-start gap-3.5 shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-indigo-300 group-hover:text-indigo-200">
                        ✨ Oferta Promocional (2 Vagas)
                      </h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Promoção
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Mensagem com foco em escassez (restam 2 vagas na promoção) para incentivar a assinatura imediata por R$ 11,99/mês.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-white/10 text-right shrink-0">
                <button
                  type="button"
                  onClick={() => setEmailUserModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer border border-white/10"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
