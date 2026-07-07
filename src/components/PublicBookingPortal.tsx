import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc 
} from 'firebase/firestore';
import { BusinessProfile, BusinessService, BusinessBooking } from '../types';
import { Calendar, Clock, User, Mail, Phone, FileText, CheckCircle2, ChevronRight, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PublicBookingPortalProps {
  ownerId: string;
  onBackToApp?: () => void;
}

export const PublicBookingPortal: React.FC<PublicBookingPortalProps> = ({ ownerId, onBackToApp }) => {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [services, setServices] = useState<BusinessService[]>([]);
  const [existingBookings, setExistingBookings] = useState<BusinessBooking[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedService, setSelectedService] = useState<BusinessService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(''); // HH:MM
  
  // Client info form
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Service, 2: Date/Time, 3: Form, 4: Success
  const [createdBooking, setCreatedBooking] = useState<BusinessBooking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch business profile and active services
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Profile
        const profileRef = doc(db, 'business_profiles', ownerId);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          setError('Este perfil de agendamento não existe ou não está ativo no momento.');
          setLoading(false);
          return;
        }

        const profileData = profileSnap.data() as BusinessProfile;
        if (!profileData.active) {
          setError('A agenda deste profissional está temporariamente desativada.');
          setLoading(false);
          return;
        }
        setProfile(profileData);

        // 2. Fetch Active Services
        const servicesRef = collection(db, 'business_services');
        const servicesQuery = query(
          servicesRef, 
          where('userId', '==', ownerId), 
          where('active', '==', true)
        );
        const servicesSnap = await getDocs(servicesQuery);
        const servicesList = servicesSnap.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as BusinessService[];
        
        setServices(servicesList);

        // 3. Fetch Bookings (only active/accepted ones to block schedule)
        const bookingsRef = collection(db, 'business_bookings');
        const bookingsQuery = query(
          bookingsRef,
          where('userId', '==', ownerId),
          where('status', 'in', ['pending', 'accepted', 'completed'])
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const bookingsList = bookingsSnap.docs.map(doc => doc.data() as BusinessBooking);
        setExistingBookings(bookingsList);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching public business data:', err);
        setError('Ocorreu um erro ao carregar a página de agendamentos. Tente novamente.');
        setLoading(false);
      }
    };

    if (ownerId) {
      fetchBusinessData();
    }
  }, [ownerId]);

  // Generate available dates (next 15 days starting from today)
  const getAvailableDates = () => {
    if (!profile) return [];
    const dates = [];
    const today = new Date();
    
    const dayMap: Record<string, string> = {
      '0': 'dom', '1': 'seg', '2': 'ter', '3': 'qua', '4': 'qui', '5': 'sex', '6': 'sab'
    };

    for (let i = 0; i < 15; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayOfWeek = dayMap[String(targetDate.getDay())];

      if (profile.workingDays.includes(dayOfWeek)) {
        dates.push({
          dateStr,
          dayOfWeek,
          label: targetDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
        });
      }
    }
    return dates;
  };

  // Generate hourly time slots for a selected date
  const getTimeSlots = () => {
    if (!profile || !selectedDate) return [];
    const slots = [];
    const [startHour, startMin] = profile.workingHoursStart.split(':').map(Number);
    const [endHour, endMin] = profile.workingHoursEnd.split(':').map(Number);
    
    let lunchStartH = -1, lunchStartM = -1;
    let lunchEndH = -1, lunchEndM = -1;
    if (profile.lunchStart && profile.lunchEnd) {
      [lunchStartH, lunchStartM] = profile.lunchStart.split(':').map(Number);
      [lunchEndH, lunchEndM] = profile.lunchEnd.split(':').map(Number);
    }

    const intervalMinutes = selectedService?.duration || 30; // default slot duration in minutes

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      // Check if slot falls in lunch time
      const isLunch = () => {
        if (lunchStartH === -1) return false;
        const totalMin = currentHour * 60 + currentMin;
        const lunchStartTotal = lunchStartH * 60 + lunchStartM;
        const lunchEndTotal = lunchEndH * 60 + lunchEndM;
        return totalMin >= lunchStartTotal && totalMin < lunchEndTotal;
      };

      // Check if this slot has already been booked on this date
      const isAlreadyBooked = () => {
        return existingBookings.some(b => b.date === selectedDate && b.time === slotTimeStr);
      };

      // Check if slot is in the past (if date is today)
      const isPast = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        if (selectedDate === todayStr) {
          const now = new Date();
          const slotTime = new Date();
          slotTime.setHours(currentHour, currentMin, 0, 0);
          return slotTime <= now;
        }
        return false;
      };

      if (!isLunch() && !isPast()) {
        slots.push({
          timeStr: slotTimeStr,
          available: !isAlreadyBooked()
        });
      }

      // Increment
      currentMin += intervalMinutes;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return slots;
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedService || !selectedDate || !selectedTime) return;
    if (!clientName || !clientEmail || !clientPhone) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      const bookingId = 'book_' + Math.random().toString(36).substring(2, 11);
      
      const newBooking: BusinessBooking = {
        id: bookingId,
        userId: ownerId,
        clientName,
        clientEmail,
        clientPhone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        notes: clientNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'business_bookings'), newBooking);
      setCreatedBooking(newBooking);
      setStep(4); // Success Step
    } catch (err) {
      console.error('Error submitting booking:', err);
      handleFirestoreError(err, OperationType.WRITE, 'business_bookings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#070a13] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-sm animate-pulse">Carregando agenda do profissional...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen w-full bg-[#070a13] flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl max-w-md flex flex-col items-center gap-3">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <h3 className="font-extrabold text-base">Agenda Indisponível</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error || 'Perfil indisponível no momento.'}</p>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#070a13] bg-[radial-gradient(circle_at_50%_0%,#152039_0%,#070a13_100%)] text-slate-100 font-sans p-4 md:p-8 flex flex-col items-center justify-start overflow-y-auto pb-20">
      
      {/* Header Back Button if accessed inside the app */}
      {onBackToApp && (
        <div className="w-full max-w-2xl flex justify-start mb-4">
          <button
            onClick={onBackToApp}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao aplicativo
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="w-full max-w-2xl bg-slate-900/40 border border-white/5 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden flex flex-col">
        
        {/* Banner with profile info */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-[#0d1222]/80 to-teal-950/40 p-6 md:p-8 border-b border-white/5 text-center relative">
          <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Agenda Ativa
          </div>
          
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{profile.name}</h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto mt-2 font-light leading-relaxed">{profile.description}</p>
          
          {/* Quick info badges */}
          <div className="flex flex-wrap justify-center items-center gap-3 mt-4 text-[10px] text-slate-400 font-medium">
            {profile.phone && (
              <span className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-indigo-400" /> {profile.phone}
              </span>
            )}
            {profile.address && (
              <span className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> {profile.address}
              </span>
            )}
            <span className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-teal-400" /> {profile.workingHoursStart} às {profile.workingHoursEnd}
            </span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="px-6 md:px-8 py-3 bg-slate-950/50 border-b border-white/5 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-black">
          <span className={step === 1 ? 'text-indigo-400 font-bold' : ''}>1. Serviço</span>
          <ChevronRight className="w-3 h-3 opacity-30" />
          <span className={step === 2 ? 'text-indigo-400 font-bold' : ''}>2. Data e Hora</span>
          <ChevronRight className="w-3 h-3 opacity-30" />
          <span className={step === 3 ? 'text-indigo-400 font-bold' : ''}>3. Identificação</span>
          <ChevronRight className="w-3 h-3 opacity-30" />
          <span className={step === 4 ? 'text-emerald-400 font-bold' : ''}>4. Confirmação</span>
        </div>

        {/* Active step content */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: SERVICE SELECTION */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 flex-1"
              >
                <div className="flex flex-col gap-1 mb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Selecione o Serviço Desejado</h3>
                  <p className="text-xs text-slate-400">Escolha um dos procedimentos prestados abaixo:</p>
                </div>

                {services.length === 0 ? (
                  <div className="text-center py-10 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-xs text-slate-400">Nenhum serviço disponível para agendamento no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 cursor-pointer ${
                          selectedService?.id === service.id
                            ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <h4 className="text-xs font-extrabold text-white">{service.name}</h4>
                          <span className="text-xs font-black text-emerald-400 shrink-0">
                            R$ {service.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-light">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/50 px-2 py-1 rounded-lg w-max mt-1">
                          <Clock className="w-3 h-3 text-indigo-400" /> {service.duration} minutos
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Next button */}
                <div className="flex justify-end pt-4 mt-auto">
                  <button
                    onClick={() => selectedService && setStep(2)}
                    disabled={!selectedService}
                    className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                      selectedService 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-600/30' 
                        : 'bg-slate-850 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Escolher Data <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME SELECTION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 flex-1"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Selecione Data e Horário</h3>
                    <p className="text-xs text-slate-400">Serviço: <span className="text-indigo-400 font-bold">{selectedService?.name}</span></p>
                  </div>
                </div>

                {/* Date slider */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Datas Disponíveis
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none pr-1">
                    {getAvailableDates().map((dateItem) => (
                      <button
                        key={dateItem.dateStr}
                        onClick={() => {
                          setSelectedDate(dateItem.dateStr);
                          setSelectedTime('');
                        }}
                        className={`px-3 py-2 rounded-xl text-center flex flex-col gap-1 cursor-pointer shrink-0 border transition-all duration-300 ${
                          selectedDate === dateItem.dateStr
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-black opacity-80">{dateItem.dayOfWeek}</span>
                        <span className="text-xs font-extrabold">{dateItem.dateStr.split('-')[2]}</span>
                        <span className="text-[9px] font-medium opacity-60">
                          {new Date(dateItem.dateStr + 'T12:00:00').toLocaleDateString('pt', {month: 'short'}).replace('.', '')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Grid */}
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Horários Disponíveis
                  </label>
                  
                  {!selectedDate ? (
                    <div className="text-center py-8 bg-slate-950/20 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1">
                      <p className="text-xs text-slate-400 font-semibold">Escolha uma data primeiro</p>
                      <p className="text-[10px] text-slate-500 font-light">Os horários são exibidos após selecionar uma data acima.</p>
                    </div>
                  ) : (
                    <div>
                      {getTimeSlots().length === 0 ? (
                        <div className="text-center py-6 bg-white/5 border border-white/10 rounded-2xl">
                          <p className="text-xs text-slate-400">Nenhum horário livre nesta data ou você está após o horário de expediente.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[180px] overflow-y-auto pr-1">
                          {getTimeSlots().map((slot) => (
                            <button
                              key={slot.timeStr}
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.timeStr)}
                              className={`py-2 px-1 rounded-xl text-[11px] font-black tracking-wide border transition-all cursor-pointer ${
                                !slot.available
                                  ? 'bg-white/2 border-transparent text-slate-600 line-through cursor-not-allowed'
                                  : selectedTime === slot.timeStr
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                                    : 'bg-white/5 border-white/5 text-emerald-400 hover:bg-white/10 hover:border-white/10'
                              }`}
                            >
                              {slot.timeStr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Back and Next */}
                <div className="flex justify-between pt-4 mt-auto border-t border-white/5">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => selectedDate && selectedTime && setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                      selectedDate && selectedTime
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-850 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Identificação <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CLIENT REGISTRATION / CONFIRMATION */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 flex-1"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Suas Informações</h3>
                    <p className="text-xs text-slate-400">Preencha seus dados para finalizar a solicitação:</p>
                  </div>
                </div>

                {/* Summary card */}
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Procedimento</span>
                    <span className="text-white font-extrabold">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Investimento</span>
                    <span className="text-emerald-400 font-black">R$ {selectedService?.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Agendamento</span>
                    <span className="text-teal-400 font-black">
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {selectedTime}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleCreateBooking} className="space-y-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" /> Nome Completo *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Carlos Eduardo Silveira"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email para Confirmação *
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="Ex: carlos@seuprovedor.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white transition-all font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-400" /> WhatsApp / Telefone *
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="Ex: (11) 99999-9999"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" /> Observações (Opcional)
                    </label>
                    <textarea
                      placeholder="Adicione alguma instrução ou preferência se necessário..."
                      rows={2}
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 hover:border-white/15 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-white transition-all font-light resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-between pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      {submitting ? 'Reservando...' : 'Confirmar Solicitação'} <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS PAGE */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 flex flex-col items-center justify-center text-center space-y-5"
              >
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Agendamento Solicitado!</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                    Sua solicitação de horário foi criada e enviada com sucesso para análise do profissional <strong className="text-white font-bold">{profile.name}</strong>.
                  </p>
                </div>

                {/* Receipt Details Card */}
                <div className="w-full max-w-sm bg-slate-950/40 p-5 rounded-2xl border border-white/5 text-xs text-left space-y-3">
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-white/5 pb-1.5">
                    Comprovante de Reserva
                  </div>
                  <div className="space-y-2 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cliente</span>
                      <span className="text-white font-bold">{createdBooking?.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Procedimento</span>
                      <span className="text-indigo-400 font-extrabold">{createdBooking?.serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duração</span>
                      <span>{createdBooking?.serviceDuration} minutos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Investimento</span>
                      <span className="text-emerald-400 font-black">
                        R$ {createdBooking?.servicePrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Data e Hora</span>
                      <span className="text-teal-400 font-bold">
                        {createdBooking && new Date(createdBooking.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {createdBooking?.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-semibold bg-white/2 border border-white/5 px-4 py-2 rounded-xl max-w-sm">
                  Um aviso de confirmação será enviado pelo profissional caso haja qualquer ajuste no seu horário. Guarde este comprovante!
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedService(null);
                      setSelectedDate('');
                      setSelectedTime('');
                      setStep(1);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-wider text-slate-300 transition-all cursor-pointer"
                  >
                    Novo Agendamento
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
