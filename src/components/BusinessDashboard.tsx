import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { BusinessProfile, BusinessService, BusinessBooking, Transaction } from '../types';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Briefcase, 
  Settings, 
  Sparkles, 
  DollarSign, 
  Scissors, 
  ExternalLink,
  ChevronRight,
  MapPin,
  Phone,
  Search,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BusinessDashboardProps {
  userId: string;
  triggerToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ userId, triggerToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'appointments' | 'services' | 'setup'>('overview');
  
  // Data states
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [services, setServices] = useState<BusinessService[]>([]);
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Copying link state
  const [copied, setCopied] = useState(false);

  // New/Edit Service Form States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<BusinessService | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [serviceDuration, setServiceDuration] = useState<number>(30);
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceActive, setServiceActive] = useState(true);

  // Setup / Profile Form States
  const [bizName, setBizName] = useState('');
  const [bizDescription, setBizDescription] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizWorkingDays, setBizWorkingDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);
  const [bizHoursStart, setBizHoursStart] = useState('08:00');
  const [bizHoursEnd, setBizHoursEnd] = useState('18:00');
  const [bizLunchStart, setBizLunchStart] = useState('12:00');
  const [bizLunchEnd, setBizLunchEnd] = useState('13:00');
  const [bizActive, setBizActive] = useState(true);
  const [savingSetup, setSavingSetup] = useState(false);

  // Filter & Search states for Appointments
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');
  const [bookingSearch, setBookingSearch] = useState('');

  // Real-time listener for profile, services, and bookings
  useEffect(() => {
    setLoading(true);

    // 1. Listen to Profile
    const profileRef = doc(db, 'business_profiles', userId);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as BusinessProfile;
        setProfile(data);
        
        // Populate form
        setBizName(data.name || '');
        setBizDescription(data.description || '');
        setBizPhone(data.phone || '');
        setBizAddress(data.address || '');
        setBizWorkingDays(data.workingDays || []);
        setBizHoursStart(data.workingHoursStart || '08:00');
        setBizHoursEnd(data.workingHoursEnd || '18:00');
        setBizLunchStart(data.lunchStart || '');
        setBizLunchEnd(data.lunchEnd || '');
        setBizActive(data.active ?? true);
      } else {
        // Business Profile doesn't exist yet, we will offer to initialize it
        setProfile(null);
      }
    });

    // 2. Listen to Services
    const servicesRef = collection(db, 'business_services');
    const servicesQuery = query(servicesRef, where('userId', '==', userId));
    const unsubServices = onSnapshot(servicesQuery, (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id })) as BusinessService[];
      setServices(list);
    });

    // 3. Listen to Bookings
    const bookingsRef = collection(db, 'business_bookings');
    const bookingsQuery = query(bookingsRef, where('userId', '==', userId));
    const unsubBookings = onSnapshot(bookingsQuery, (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id })) as BusinessBooking[];
      // Sort: closest date and time first
      list.sort((a, b) => {
        const dateA = `${a.date}T${a.time}`;
        const dateB = `${b.date}T${b.time}`;
        return dateB.localeCompare(dateA); // most recent bookings first, we can reverse as needed
      });
      setBookings(list);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubServices();
      unsubBookings();
    };
  }, [userId]);

  // Create or Update Business Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim()) {
      triggerToast('O nome do negócio é obrigatório.', 'warning');
      return;
    }

    try {
      setSavingSetup(true);
      const profileData: any = {
        userId,
        name: bizName.trim(),
        description: (bizDescription || '').trim(),
        workingDays: bizWorkingDays || ['seg', 'ter', 'qua', 'qui', 'sex'],
        workingHoursStart: bizHoursStart || '08:00',
        workingHoursEnd: bizHoursEnd || '18:00',
        active: bizActive === undefined ? true : bizActive,
        updatedAt: new Date().toISOString()
      };

      if (!profile) {
        profileData.createdAt = new Date().toISOString();
      } else if (profile.createdAt) {
        profileData.createdAt = profile.createdAt;
      } else {
        profileData.createdAt = new Date().toISOString();
      }

      if (bizPhone && bizPhone.trim()) {
        profileData.phone = bizPhone.trim();
      }
      if (bizAddress && bizAddress.trim()) {
        profileData.address = bizAddress.trim();
      }
      if (bizLunchStart && bizLunchStart.trim()) {
        profileData.lunchStart = bizLunchStart.trim();
      }
      if (bizLunchEnd && bizLunchEnd.trim()) {
        profileData.lunchEnd = bizLunchEnd.trim();
      }

      await setDoc(doc(db, 'business_profiles', userId), profileData);
      triggerToast('Configurações da agenda salvas com sucesso!', 'success');
    } catch (err) {
      console.error('Error saving profile:', err);
      const msg = err instanceof Error ? err.message : String(err);
      triggerToast(`Erro ao salvar configurações: ${msg}`, 'error');
    } finally {
      setSavingSetup(false);
    }
  };

  // Create or Update Service
  const handleSaveService = async (e: React.FormEvent) => {
    if (!serviceName.trim() || servicePrice <= 0 || serviceDuration <= 0) {
      triggerToast('Preencha os dados do serviço corretamente.', 'warning');
      return;
    }

    try {
      if (editingService) {
        // Update
        const serviceRef = doc(db, 'business_services', editingService.id);
        await updateDoc(serviceRef, {
          name: serviceName,
          price: Number(servicePrice),
          duration: Number(serviceDuration),
          description: serviceDescription,
          active: serviceActive
        });
        triggerToast('Serviço atualizado com sucesso!', 'success');
      } else {
        // Create
        const newId = 'srv_' + Math.random().toString(36).substring(2, 11);
        const serviceData: BusinessService = {
          id: newId,
          userId,
          name: serviceName,
          price: Number(servicePrice),
          duration: Number(serviceDuration),
          description: serviceDescription,
          active: serviceActive,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'business_services', newId), serviceData);
        triggerToast('Serviço adicionado com sucesso!', 'success');
      }

      // Reset form
      setIsServiceModalOpen(false);
      setEditingService(null);
      setServiceName('');
      setServicePrice(0);
      setServiceDuration(30);
      setServiceDescription('');
      setServiceActive(true);
    } catch (err) {
      console.error('Error saving service:', err);
      triggerToast('Erro ao salvar serviço.', 'error');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza de que deseja remover este serviço?')) return;
    try {
      await deleteDoc(doc(db, 'business_services', serviceId));
      triggerToast('Serviço removido com sucesso.', 'success');
    } catch (err) {
      console.error('Error deleting service:', err);
      triggerToast('Erro ao remover serviço.', 'error');
    }
  };

  const handleToggleServiceActive = async (service: BusinessService) => {
    try {
      const serviceRef = doc(db, 'business_services', service.id);
      const newActive = service.active === undefined ? false : !service.active;
      await updateDoc(serviceRef, { active: newActive });
      triggerToast(`Serviço marcado como ${newActive ? 'disponível' : 'indisponível'}!`, 'success');
    } catch (err) {
      console.error('Error toggling service active:', err);
      triggerToast('Erro ao alterar disponibilidade do serviço.', 'error');
    }
  };

  // Booking status transition helper (accept, reject, complete)
  const handleUpdateBookingStatus = async (booking: BusinessBooking, newStatus: 'accepted' | 'rejected' | 'completed' | 'cancelled') => {
    try {
      const bookingRef = doc(db, 'business_bookings', booking.id);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      triggerToast(`Agendamento de ${booking.clientName} marcado como ${
        newStatus === 'accepted' ? 'Confirmado' :
        newStatus === 'rejected' ? 'Recusado' :
        newStatus === 'completed' ? 'Concluído' : 'Cancelado'
      }!`, 'success');

      // If marked as COMPLETED, offer or automatically log as an Income transaction in Personal Finance!
      if (newStatus === 'completed') {
        const autoLog = confirm(`Deseja registrar o valor de R$ ${booking.servicePrice.toFixed(2)} como uma receita (ganho) no seu fluxo de caixa financeiro?`);
        if (autoLog) {
          const transId = 't_' + Math.random().toString(36).substring(2, 11);
          const monthKey = booking.date.substring(0, 7); // YYYY-MM
          
          const newTransaction: Transaction = {
            id: transId,
            userId,
            name: `Serviço: ${booking.serviceName} (${booking.clientName})`,
            amount: booking.servicePrice,
            type: 'variaveis', // we log it in variables as income (negative variable expenses function as extra income or we can treat as standard negative or custom, let's look at how positive incomes are handled in transactions, wait, in this app incomes are represented as extras or settings balance, or variable transactions with specific tags or names)
            cat: 'Receita',
            due: booking.date,
            paid_amount: booking.servicePrice,
            paid_at: new Date().toISOString(),
            monthKey,
            createdAt: new Date().toISOString(),
            classification: 'profissional'
          };

          await setDoc(doc(db, 'transactions', transId), newTransaction);
          triggerToast('Receita adicionada automaticamente no seu painel financeiro!', 'success');
        }
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      triggerToast('Erro ao atualizar agendamento.', 'error');
    }
  };

  const handleCopyBookingLink = () => {
    const link = `${window.location.origin}?agenda=${userId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      triggerToast('Link de agendamento copiado para a área de transferência!', 'success');
      setTimeout(() => setCopied(false), 3000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
      triggerToast('Erro ao copiar link.', 'error');
    });
  };

  const toggleDay = (day: string) => {
    if (bizWorkingDays.includes(day)) {
      setBizWorkingDays(bizWorkingDays.filter(d => d !== day));
    } else {
      setBizWorkingDays([...bizWorkingDays, day]);
    }
  };

  // Calculations for stats card
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const acceptedBookingsCount = bookings.filter(b => b.status === 'accepted').length;
  const completedBookingsCount = bookings.filter(b => b.status === 'completed').length;
  
  const totalRevenueThisMonth = bookings
    .filter(b => {
      if (b.status !== 'completed' && b.status !== 'accepted') return false;
      const bookingMonth = b.date.substring(0, 7); // YYYY-MM
      const currentMonth = new Date().toISOString().substring(0, 7);
      return bookingMonth === currentMonth;
    })
    .reduce((sum, b) => sum + b.servicePrice, 0);

  // Filtered booking list
  const filteredBookings = bookings.filter(b => {
    const matchesFilter = bookingFilter === 'all' || b.status === bookingFilter;
    const matchesSearch = b.clientName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                          b.serviceName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                          b.clientEmail.toLowerCase().includes(bookingSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* HEADER SECTION WITH QUICK LINK */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl shrink-0">
            <Briefcase className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                {profile ? profile.name : 'Minha Agenda & Negócios'}
              </h2>
              {profile && (
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  profile.active 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {profile.active ? 'Ativa' : 'Pausada'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-light max-w-xl">
              Crie serviços, gerencie agendamentos de clientes, defina seu expediente e compartilhe seu link de agendamento online.
            </p>
          </div>
        </div>

        {profile && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-stretch md:self-auto">
            <button
              onClick={handleCopyBookingLink}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Link Copiado!' : 'Copiar Link da Agenda'}
            </button>
            <a
              href={`${window.location.origin}?agenda=${userId}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Página
            </a>
          </div>
        )}
      </div>

      {/* STATS BENTO GRID (only if profile is configured) */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-wider">Aguardando Confirmação</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-400">{pendingBookingsCount}</span>
              <span className="text-[10px] text-slate-400 block font-medium">solicitações pendentes</span>
            </div>
          </div>

          <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-wider">Próximas Agendadas</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-indigo-400">{acceptedBookingsCount}</span>
              <span className="text-[10px] text-slate-400 block font-medium">agendamentos ativos</span>
            </div>
          </div>

          <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-wider">Faturamento Previsto</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-400">R$ {totalRevenueThisMonth.toFixed(2).replace('.', ',')}</span>
              <span className="text-[10px] text-slate-400 block font-medium">este mês (confirmados/concluídos)</span>
            </div>
          </div>

          <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-wider">Serviços Ativos</span>
              <Scissors className="w-4 h-4 text-teal-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-teal-400">{services.filter(s => s.active).length}</span>
              <span className="text-[10px] text-slate-400 block font-medium">procedimentos ofertados</span>
            </div>
          </div>

        </div>
      )}

      {/* DASHBOARD TAB SELECTOR */}
      {profile ? (
        <div className="flex border-b border-white/5 pb-2 text-xs gap-6 font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeSubTab === 'overview' ? 'text-white font-black' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Geral
            {activeSubTab === 'overview' && (
              <motion.div layoutId="subtab_underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('appointments')}
            className={`pb-2.5 transition-all relative cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'appointments' ? 'text-white font-black' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Agendamentos
            {pendingBookingsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            )}
            {activeSubTab === 'appointments' && (
              <motion.div layoutId="subtab_underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('services')}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeSubTab === 'services' ? 'text-white font-black' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Serviços
            {activeSubTab === 'services' && (
              <motion.div layoutId="subtab_underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('setup')}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeSubTab === 'setup' ? 'text-white font-black' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Configurar Agenda
            {activeSubTab === 'setup' && (
              <motion.div layoutId="subtab_underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
        </div>
      ) : null}

      {/* DASHBOARD TAB CONTENTS */}
      <div className="flex-1">
        
        {/* IF PROFILE NOT INITIALIZED */}
        {!profile ? (
          <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-8 md:p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-black text-white uppercase tracking-wider">Ative sua Agenda Profissional</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Você ainda não configurou seu perfil profissional/autônomo. Ative sua agenda online agora mesmo para liberar um link onde seus clientes podem agendar atendimentos diretamente de forma inteligente.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="w-full space-y-4 text-left border-t border-white/5 pt-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Nome do Negócio / Profissional *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Barbearia do João, Clínica Estética Bella, etc."
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Slogan ou Descrição Curta (Opcional)</label>
                <textarea
                  placeholder="Conte um pouco sobre seu serviço, especialidades ou termos de agendamento..."
                  rows={2}
                  value={bizDescription}
                  onChange={(e) => setBizDescription(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-xs text-white resize-none font-light"
                />
              </div>

              <button
                type="submit"
                disabled={savingSetup}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black uppercase tracking-wider rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                {savingSetup ? 'Ativando...' : 'Criar Perfil e Ativar Agenda Online'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* TAB 1: OVERVIEW & GENERAL WORKFLOW */}
            {activeSubTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Recent Pending Booking Requests */}
                <div className="md:col-span-2 bg-slate-900/20 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400" /> Solicitações Recentes Pendentes
                    </h3>
                    <button 
                      onClick={() => setActiveSubTab('appointments')} 
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider"
                    >
                      Ver Tudo
                    </button>
                  </div>

                  {bookings.filter(b => b.status === 'pending').length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white/2 border border-dashed border-white/5 rounded-2xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mb-2" />
                      <p className="text-xs text-slate-400 font-bold">Nenhuma solicitação pendente!</p>
                      <p className="text-[10px] text-slate-500 font-light mt-0.5">Sua agenda está em dia.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {bookings.filter(b => b.status === 'pending').map((booking) => (
                        <div key={booking.id} className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm">{booking.clientName}</span>
                              <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">
                                {booking.serviceName}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-400" /> {new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-teal-400" /> {booking.time} ({booking.serviceDuration} min)</span>
                              {booking.clientPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-400" /> {booking.clientPhone}</span>}
                            </div>
                            {booking.notes && (
                              <p className="text-[11px] text-slate-500 italic bg-white/2 p-2 rounded-lg mt-1 font-light">
                                "{booking.notes}"
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <button
                              onClick={() => handleUpdateBookingStatus(booking, 'rejected')}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer border border-red-500/15"
                              title="Recusar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(booking, 'accepted')}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-600/15"
                            >
                              <Check className="w-4 h-4" /> Confirmar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agenda Quick Config Summary */}
                <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-indigo-400" /> Configuração Rápida
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b border-white/3 py-1.5">
                        <span className="text-slate-500 font-medium">Link Ativo</span>
                        <span className={profile.active ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {profile.active ? 'Sim' : 'Pausado'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-white/3 py-1.5">
                        <span className="text-slate-500 font-medium">Expediente</span>
                        <span className="text-white font-bold">{profile.workingHoursStart} - {profile.workingHoursEnd}</span>
                      </div>
                      {profile.lunchStart && (
                        <div className="flex justify-between border-b border-white/3 py-1.5">
                          <span className="text-slate-500 font-medium">Intervalo Almoço</span>
                          <span className="text-white font-bold">{profile.lunchStart} - {profile.lunchEnd}</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1 border-b border-white/3 py-1.5">
                        <span className="text-slate-500 font-medium">Dias de Trabalho</span>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(d => {
                            const isWorking = profile.workingDays.includes(d);
                            return (
                              <span key={d} className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                                isWorking ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'bg-slate-950/20 text-slate-600'
                              }`}>
                                {d}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveSubTab('setup')}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-center font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Ajustar Expediente
                  </button>
                </div>

              </div>
            )}

            {/* TAB 2: APPOINTMENTS LISTING & ACTION MODULE */}
            {activeSubTab === 'appointments' && (
              <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 space-y-4">
                
                {/* Filters, Search & Search Input */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  
                  {/* Filter tabs */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {(['all', 'pending', 'accepted', 'completed', 'cancelled'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setBookingFilter(tab)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                          bookingFilter === tab
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {tab === 'all' ? 'Todos' :
                         tab === 'pending' ? 'Pendentes' :
                         tab === 'accepted' ? 'Confirmados' :
                         tab === 'completed' ? 'Concluídos' : 'Cancelados'}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar cliente..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl pl-10 pr-3 py-2 text-xs text-white font-medium"
                    />
                  </div>

                </div>

                {/* Appointments Render */}
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center gap-2">
                    <Calendar className="w-10 h-10 text-slate-600" />
                    <p className="text-xs text-slate-400 font-bold">Nenhum agendamento correspondente encontrado.</p>
                    <p className="text-[10px] text-slate-500 font-light">Seu histórico de agendamentos será listado aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredBookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs bg-slate-950/30 ${
                          booking.status === 'pending' ? 'border-amber-500/20 bg-amber-500/2' :
                          booking.status === 'accepted' ? 'border-indigo-500/20' :
                          booking.status === 'completed' ? 'border-emerald-500/10' : 'border-white/5 opacity-60'
                        }`}
                      >
                        {/* Booking Details */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-extrabold text-white text-sm">{booking.clientName}</span>
                            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">
                              {booking.serviceName}
                            </span>
                            
                            {/* Status badge */}
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                              booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                              booking.status === 'accepted' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {booking.status === 'pending' ? 'Pendente' :
                               booking.status === 'accepted' ? 'Confirmado' :
                               booking.status === 'completed' ? 'Concluído' : 
                               booking.status === 'cancelled' ? 'Cancelado' : 'Recusado'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> {new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-400" /> {booking.time} ({booking.serviceDuration} min)</span>
                            <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> R$ {booking.servicePrice.toFixed(2).replace('.', ',')}</span>
                            {booking.clientPhone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-400" /> {booking.clientPhone}</span>}
                          </div>

                          {booking.notes && (
                            <p className="text-[11px] text-slate-500 italic bg-white/2 p-2 rounded-lg mt-1 font-light">
                              "{booking.notes}"
                            </p>
                          )}
                        </div>

                        {/* Booking Management Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto border-t md:border-t-0 border-white/5 pt-3.5 md:pt-0 w-full md:w-auto justify-end">
                          
                          {/* PENDING ACTIONS */}
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(booking, 'rejected')}
                                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" /> Recusar
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(booking, 'accepted')}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-indigo-600/15"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" /> Confirmar Horário
                              </button>
                            </>
                          )}

                          {/* CONFIRMED ACTIONS */}
                          {booking.status === 'accepted' && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(booking, 'cancelled')}
                                className="px-3 py-2 bg-slate-900 border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-wider cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(booking, 'completed')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-600/15"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Concluir Atendimento
                              </button>
                            </>
                          )}

                          {/* COMPLETED/CANCELLED DISPLAY */}
                          {booking.status === 'completed' && (
                            <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-500/5 px-3 py-1.5 border border-emerald-500/15 rounded-xl">
                              <Check className="w-3.5 h-3.5" /> Atendimento Concluído
                            </span>
                          )}

                          {booking.status === 'cancelled' && (
                            <span className="text-[10px] text-slate-500 font-extrabold bg-slate-950/40 px-3 py-1.5 border border-white/5 rounded-xl">
                              Agendamento Cancelado
                            </span>
                          )}

                          {booking.status === 'rejected' && (
                            <span className="text-[10px] text-red-400 font-extrabold bg-red-500/5 px-3 py-1.5 border border-red-500/15 rounded-xl">
                              Solicitação Recusada
                            </span>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB 3: SERVICES CATALOG MANAGEMENT */}
            {activeSubTab === 'services' && (
              <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 space-y-4">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Catálogo de Procedimentos / Serviços
                  </h3>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setServiceName('');
                      setServicePrice(0);
                      setServiceDuration(30);
                      setServiceDescription('');
                      setIsServiceModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Novo Serviço
                  </button>
                </div>

                {/* Services Grid */}
                {services.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl">
                    <Scissors className="w-8 h-8 text-slate-600 mb-2 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Nenhum serviço cadastrado.</p>
                    <p className="text-[10px] text-slate-500 font-light mt-0.5">Cadastre seus primeiros serviços para exibir aos seus clientes.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {services.map((service) => (
                      <div key={service.id} className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col justify-between gap-3 text-xs hover:border-white/10 transition-all">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-3">
                            <h4 className="font-extrabold text-white text-sm leading-tight">{service.name}</h4>
                            <span className="text-emerald-400 font-black shrink-0">
                              R$ {service.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-light">
                              {service.description}
                            </p>
                          )}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleToggleServiceActive(service)}
                              className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase transition-all flex items-center gap-1 ${
                                service.active ?? true
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-500/10 text-slate-450 border border-white/5'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${service.active ?? true ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                              {(service.active ?? true) ? 'Disponível' : 'Indisponível'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/50 px-2 py-1 rounded-lg flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" /> {service.duration} min
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingService(service);
                                setServiceName(service.name);
                                setServicePrice(service.price);
                                setServiceDuration(service.duration);
                                setServiceDescription(service.description || '');
                                setServiceActive(service.active ?? true);
                                setIsServiceModalOpen(true);
                              }}
                              className="text-[10px] text-indigo-400 hover:text-white font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* MODAL / OVERLAY FOR CREATE/EDIT SERVICE */}
                <AnimatePresence>
                  {isServiceModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                      >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Scissors className="w-4 h-4 text-indigo-400" /> {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                          </h4>
                          <button 
                            onClick={() => setIsServiceModalOpen(false)}
                            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveService} className="p-6 space-y-4 text-xs text-left">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Nome do Procedimento *</label>
                            <input
                              required
                              type="text"
                              placeholder="Ex: Limpeza de Pele, Corte de Cabelo"
                              value={serviceName}
                              onChange={(e) => setServiceName(e.target.value)}
                              className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Preço (R$) *</label>
                              <input
                                required
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={servicePrice || ''}
                                onChange={(e) => setServicePrice(Number(e.target.value))}
                                className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Duração (Minutos) *</label>
                              <select
                                required
                                value={serviceDuration}
                                onChange={(e) => setServiceDuration(Number(e.target.value))}
                                className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                              >
                                <option value={15}>15 minutos</option>
                                <option value={30}>30 minutos</option>
                                <option value={45}>45 minutos</option>
                                <option value={60}>60 minutos (1h)</option>
                                <option value={90}>90 minutos (1h30)</option>
                                <option value={120}>120 minutos (2h)</option>
                                <option value={180}>180 minutos (3h)</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Descrição (Opcional)</label>
                            <textarea
                              placeholder="O que está incluso neste procedimento ou instruções de preparação..."
                              rows={3}
                              value={serviceDescription}
                              onChange={(e) => setServiceDescription(e.target.value)}
                              className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-xs text-white resize-none font-light"
                            />
                          </div>

                          {/* Service status / availability */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Disponibilidade do Serviço</label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-1 rounded-xl border border-white/10">
                              <button
                                type="button"
                                onClick={() => setServiceActive(true)}
                                className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  serviceActive
                                    ? 'bg-emerald-500/20 border border-emerald-500/35 text-emerald-450'
                                    : 'border border-transparent text-slate-500 hover:text-slate-350'
                                }`}
                              >
                                🟢 Ativo / Visível
                              </button>
                              <button
                                type="button"
                                onClick={() => setServiceActive(false)}
                                className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  !serviceActive
                                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                                    : 'border border-transparent text-slate-500 hover:text-slate-350'
                                }`}
                              >
                                ⚪ Indisponível
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-600/20"
                          >
                            {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                          </button>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

              </div>
            )}

            {/* TAB 4: CALENDAR / WORK HOURS CONFIGURATION */}
            {activeSubTab === 'setup' && (
              <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6">
                
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">
                  Configuração de Funcionamento & Expediente
                </h3>

                <form onSubmit={handleSaveProfile} className="space-y-5 text-xs text-left">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Nome da Empresa / Profissional *</label>
                      <input
                        required
                        type="text"
                        placeholder="Ex: Barbearia Estilo"
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Telefone / WhatsApp Profissional</label>
                      <input
                        type="tel"
                        placeholder="Ex: (11) 98888-8888"
                        value={bizPhone}
                        onChange={(e) => setBizPhone(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Descrição / Especialidades</label>
                    <textarea
                      placeholder="Sobre seu negócio..."
                      rows={2}
                      value={bizDescription}
                      onChange={(e) => setBizDescription(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-xs text-white resize-none font-light"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Endereço de Atendimento (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Av. Paulista, 1000 - Sala 42"
                      value={bizAddress}
                      onChange={(e) => setBizAddress(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                    />
                  </div>

                  {/* Working Days */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Dias Disponíveis para Atendimento</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { key: 'seg', label: 'Segunda' },
                        { key: 'ter', label: 'Terça' },
                        { key: 'qua', label: 'Quarta' },
                        { key: 'qui', label: 'Quinta' },
                        { key: 'sex', label: 'Sexta' },
                        { key: 'sab', label: 'Sábado' },
                        { key: 'dom', label: 'Domingo' }
                      ].map(day => {
                        const active = bizWorkingDays.includes(day.key);
                        return (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => toggleDay(day.key)}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                              active
                                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md'
                                : 'bg-slate-950/20 border-white/5 text-slate-500 hover:bg-slate-900'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expediente Hours */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/5 pt-4">
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Início do Expediente</label>
                      <input
                        required
                        type="time"
                        value={bizHoursStart}
                        onChange={(e) => setBizHoursStart(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Fim do Expediente</label>
                      <input
                        required
                        type="time"
                        value={bizHoursEnd}
                        onChange={(e) => setBizHoursEnd(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Início Almoço (Opcional)</label>
                      <input
                        type="time"
                        value={bizLunchStart}
                        onChange={(e) => setBizLunchStart(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Fim Almoço (Opcional)</label>
                      <input
                        type="time"
                        value={bizLunchEnd}
                        onChange={(e) => setBizLunchEnd(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium"
                      />
                    </div>

                  </div>

                  {/* Active scheduling link toggle */}
                  <div className="flex items-center gap-3 bg-slate-950/30 p-4 rounded-2xl border border-white/5">
                    <input
                      type="checkbox"
                      id="bizActiveCheck"
                      checked={bizActive}
                      onChange={(e) => setBizActive(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-white/10 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer bg-slate-950"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="bizActiveCheck" className="text-xs font-black text-white uppercase tracking-wider cursor-pointer">
                        Link de Agendamento Ativo para Clientes
                      </label>
                      <span className="text-[11px] text-slate-400 block font-light leading-relaxed">
                        Se desativado, os clientes não conseguirão acessar sua agenda online ou agendar horários temporariamente.
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSetup}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black uppercase tracking-wider rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    {savingSetup ? 'Salvando...' : 'Salvar Alterações do Expediente'}
                  </button>

                </form>

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
