import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Users,
  Lock,
  ArrowLeft,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  onBack: () => void;
  triggerToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
  currentTheme?: 'dark' | 'light';
}

interface UserProfile {
  uid: string;
  email: string;
  token?: string;
  createdAt?: string;
  status?: 'trial' | 'active' | 'blocked';
  paymentStatus?: 'pago' | 'pendente' | 'expirado';
}

export default function AdminDashboard({ onBack, triggerToast, currentTheme = 'dark' }: AdminDashboardProps) {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Enforce security on load: expel if not administrative mail
  const adminEmail = 'bjcarvalho07@gmail.com';
  const currentUserEmail = auth.currentUser?.email;

  useEffect(() => {
    if (currentUserEmail !== adminEmail) {
      triggerToast('Acesso negado: Canal exclusivo do Administrador Geral.', 'error');
      signOut(auth).catch(() => {});
      onBack();
    }
  }, [currentUserEmail, onBack, triggerToast]);

  // Read all users directly from Firestore rules mapping
  useEffect(() => {
    if (currentUserEmail !== adminEmail) return;

    setLoading(true);
    const path = 'users';
    const unsub = onSnapshot(collection(db, path), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          uid: doc.id,
          email: data.email || '',
          token: data.token || '',
          createdAt: data.createdAt || '',
          status: data.status || 'active', // default value if not set
          paymentStatus: data.paymentStatus || (data.token ? 'pago' : 'pendente'), // fallback
        });
      });
      // Sort users by registration date or email
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setUsersList(list);
      setLoading(false);
    }, (error) => {
      console.error("Erro no canal de administração:", error);
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsub();
  }, [currentUserEmail]);

  // Compact rapid status adjust triggers
  const handleUpdateUserStatus = async (userUid: string, newStatus: 'active' | 'blocked', userEmail: string) => {
    setActionInProgress(userUid);
    const path = `users/${userUid}`;
    try {
      const userRef = doc(db, 'users', userUid);
      // We also update payment status accordingly or keep it
      const updatePayload: Partial<UserProfile> = {
        status: newStatus,
      };

      if (newStatus === 'active') {
        updatePayload.paymentStatus = 'pago';
      } else if (newStatus === 'blocked') {
        updatePayload.paymentStatus = 'expirado';
      }

      await updateDoc(userRef, updatePayload);
      triggerToast(`Usuário ${userEmail} alterado para ${newStatus === 'active' ? 'ATIVO' : 'BLOQUEADO'} com sucesso!`, 'success');
    } catch (err: any) {
      console.error(err);
      triggerToast('Falha ao atualizar o status do usuário.', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter list based on search term
  const filteredUsers = usersList.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.token || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUserEmail !== adminEmail) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Lock className="w-12 h-12 text-rose-500 animate-bounce" />
        <p className="text-sm font-semibold tracking-wide uppercase text-slate-400 font-display">Acesso Estritamente Restrito</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-indigo-950/15 border border-indigo-500/15 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-505/10 border border-indigo-500/10 px-2 py-0.5 rounded-md inline-block mb-1">
              Painel de Controle do Dono
            </span>
            <h3 className="font-display font-black text-xl text-white tracking-tight leading-none">
              Gestão de Usuários e Licenciamento
            </h3>
          </div>
        </div>

        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-white/5 border border-white/5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer self-start md:self-center"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao App
        </button>
      </div>

      {/* Analytics Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Total de Usuários</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-black text-white">{usersList.length}</span>
            <Users className="w-4 h-4 text-indigo-400 self-center" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
          <span className="text-[10px] text-emerald-450 font-extrabold uppercase tracking-widest block">Usuários Ativos / Pagos</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-black text-emerald-400">
              {usersList.filter(u => u.status === 'active').length}
            </span>
            <UserCheck className="w-4 h-4 text-emerald-400 self-center" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
          <span className="text-[10px] text-rose-450 font-extrabold uppercase tracking-widest block">Contas Bloqueadas</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-black text-rose-400">
              {usersList.filter(u => u.status === 'blocked').length}
            </span>
            <UserX className="w-4 h-4 text-rose-450 self-center" />
          </div>
        </div>
      </div>

      {/* Users management table container */}
      <div className="rounded-3xl bg-[#090e1b] border border-white/5 overflow-hidden shadow-2xl space-y-4 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search bar widget */}
          <div className="w-full sm:max-w-md relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por e-mail ou código de token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-500"
            />
          </div>

          <div className="text-[10px] text-slate-550 font-bold uppercase tracking-wider shrink-0">
            {filteredUsers.length} de {usersList.length} Usuários
          </div>
        </div>

        {/* Live Users Table Grid */}
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          {loading ? (
            <div className="p-12 text-center text-slate-450 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              <span className="text-xs uppercase font-extrabold tracking-widest">Sincronizando usuários em tempo real...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Nenhum usuário encontrado correspondente ao filtro.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-white/5 text-[9.5px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3.5">E-mail do Usuário</th>
                  <th className="px-4 py-3.5">Status de Acesso</th>
                  <th className="px-4 py-3.5">Status de Pagamento</th>
                  <th className="px-4 py-3.5">Assinado em / Token</th>
                  <th className="px-4 py-3.5 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-medium">
                {filteredUsers.map((userProfile) => {
                  const isUserActive = userProfile.status === 'active';
                  const isUserBlocked = userProfile.status === 'blocked';
                  const isUserTrial = userProfile.status === 'trial';

                  // Payment statuses
                  const hasPaidToken = !!userProfile.token;
                  const isPaid = userProfile.paymentStatus === 'pago';
                  const isExpired = userProfile.paymentStatus === 'expirado';
                  const isPending = userProfile.paymentStatus === 'pendente' && !hasPaidToken;

                  return (
                    <tr key={userProfile.uid} className="hover:bg-white/1 transition-all">
                      <td className="px-4 py-4 space-y-0.5">
                        <span className="font-bold text-white block truncate max-w-[220px]">
                          {userProfile.email}
                        </span>
                        <span className="font-mono text-[9px] text-slate-500 select-all block">
                          uID: {userProfile.uid}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {isUserActive && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-450">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Ativo (Active)
                          </span>
                        )}
                        {isUserBlocked && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-450">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Bloqueado (Blocked)
                          </span>
                        )}
                        {isUserTrial && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-405" />
                            Avaliando (Trial)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-950/30 border border-emerald-600/20 text-emerald-400">
                            <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" /> Ativo / Pago
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-950/30 border border-rose-600/20 text-rose-400">
                            Não Pagou / Expirou
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-950/30 border border-amber-600/20 text-amber-400">
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 space-y-0.5 font-mono text-[10px]">
                        <span className="text-slate-450 block">
                          {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('pt-BR') : 'Sem registro'}
                        </span>
                        {userProfile.token ? (
                          <span className="text-slate-500 block text-[9px] select-all truncate max-w-[120px]" title={userProfile.token}>
                            Token: {userProfile.token}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic block text-[9px]">Sem Token Vinculado</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={actionInProgress === userProfile.uid}
                            onClick={() => handleUpdateUserStatus(userProfile.uid, 'active', userProfile.email)}
                            className={`p-1.5 md:px-2.5 md:py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 ${
                              isUserActive
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-not-allowed'
                                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            Ativar
                          </button>
                          <button
                            type="button"
                            disabled={actionInProgress === userProfile.uid}
                            onClick={() => handleUpdateUserStatus(userProfile.uid, 'blocked', userProfile.email)}
                            className={`p-1.5 md:px-2.5 md:py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 ${
                              isUserBlocked
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-450 cursor-not-allowed'
                                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            Bloquear
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
