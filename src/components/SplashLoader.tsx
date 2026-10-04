import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Sun, Sunset, Moon, Sparkles, ShieldCheck } from 'lucide-react';

interface SplashLoaderProps {
  userName?: string;
}

export default function SplashLoader({ userName }: SplashLoaderProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [statusText, setStatusText] = useState('Iniciando ambiente seguro...');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStatusText('Sincronizando seus dados com segurança...');
    }, 800);
    const t2 = setTimeout(() => {
      setStatusText('Tudo pronto para você!');
    }, 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Time-of-day greeting determination
  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();
    
    // Greeting & Icon selection
    let period: 'morning' | 'afternoon' | 'night' = 'night';
    let salutation = 'Boa noite';
    
    if (hour >= 5 && hour < 12) {
      period = 'morning';
      salutation = 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
      period = 'afternoon';
      salutation = 'Boa tarde';
    } else {
      period = 'night';
      salutation = 'Boa noite';
    }

    // Determine first name if available
    let name = userName?.trim();
    if (!name && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('finpro_last_username');
        if (cached) name = cached.trim();
      } catch (e) {}
    }

    const firstName = name ? name.split(' ')[0] : '';
    
    return {
      period,
      salutation,
      firstName
    };
  }, [userName]);

  // Subtle floating background particles
  const particles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: (i * 13) % 100,
      y: (i * 23 + 10) % 100,
      size: 3 + (i % 3) * 2,
      duration: 3 + (i % 3) * 1.5,
      delay: (i * 0.2) % 2
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-[#030712] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans">
      
      {/* Background radial gradients for fintech atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] bg-emerald-500/12 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] sm:w-[620px] h-[480px] sm:h-[620px] bg-cyan-500/8 rounded-full blur-[130px] pointer-events-none" />

      {/* Floating ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0.1, y: 0 }}
            animate={{ 
              opacity: [0.15, 0.6, 0.15],
              y: [-12, 12, -12],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
            className="absolute rounded-full bg-emerald-400/40 blur-[1px]"
          />
        ))}
      </div>

      {/* Center Container */}
      <div className="relative flex flex-col items-center z-10 px-6 max-w-sm w-full">
        
        {/* ==================================================== */}
        {/* 1. ANIMATED EMBLEM ARENA */}
        {/* ==================================================== */}
        <div className="relative flex items-center justify-center mb-6">
          
          {/* Outer Rotating Energy Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border border-dashed border-emerald-500/25 pointer-events-none"
          />

          {/* Secondary Counter-Rotating Accent Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            className="absolute w-44 h-44 sm:w-48 sm:h-48 rounded-full border border-cyan-400/10 pointer-events-none"
          />

          {/* Pulsing Luminous Aura behind card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ 
              opacity: [0.35, 0.75, 0.35], 
              scale: [0.95, 1.1, 0.95] 
            }}
            transition={{ 
              duration: 2.8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 via-teal-400/25 to-cyan-400/20 rounded-3xl blur-2xl filter -m-3"
          />

          {/* Main Logo Shield / Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.65, y: 18 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: [0, -4, 0] 
            }}
            transition={{ 
              opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
              y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-[#0e211e] via-[#091715] to-[#040c0b] border-2 border-emerald-400/40 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.35),inset_0_1px_20px_rgba(255,255,255,0.12)] relative overflow-hidden"
          >
            {/* Metallic Sheen Ray Sweep */}
            <motion.div 
              initial={{ x: "-120%" }}
              animate={{ x: "240%" }}
              transition={{ 
                duration: 1.6, 
                repeat: Infinity, 
                repeatDelay: 2.2, 
                ease: "easeInOut" 
              }}
              className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-20 filter blur-[2px] pointer-events-none"
            />

            {/* Inner Glow Border */}
            <div className="absolute inset-0.5 rounded-[26px] sm:rounded-[30px] border border-emerald-400/20 pointer-events-none" />

            {/* Emblem Image with fallback */}
            {!imageError ? (
              <img 
                src="/app_icon.png" 
                alt="FinançasPro Emblema" 
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover drop-shadow-[0_4px_16px_rgba(16,185,129,0.6)] transition-all duration-300 ${
                  imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              />
            ) : null}

            {/* Fallback Icon if image fails or before load */}
            {(!imageLoaded || imageError) && (
              <TrendingUp className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
            )}
          </motion.div>
        </div>

        {/* ==================================================== */}
        {/* 2. TIME-BASED GREETING ("Bom dia / Boa noite") */}
        {/* ==================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-center flex flex-col items-center"
        >
          {/* Small Time Kicker Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold tracking-wide mb-2 shadow-sm">
            {greetingInfo.period === 'morning' && <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
            {greetingInfo.period === 'afternoon' && <Sunset className="w-3.5 h-3.5 text-orange-400 animate-pulse" />}
            {greetingInfo.period === 'night' && <Moon className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />}
            <span>{greetingInfo.salutation}!</span>
          </div>

          {/* Main Welcome Message */}
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            {greetingInfo.firstName ? (
              <>
                Olá, <span className="text-emerald-400">{greetingInfo.firstName}</span>!
              </>
            ) : (
              'Bem-vindo de volta!'
            )}
          </h2>

          {greetingInfo.firstName && (
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Bem-vindo de volta ao seu painel
            </p>
          )}

          {/* Brand Signature */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="font-display font-extrabold text-xs tracking-widest text-slate-400">
              FINANÇAS<span className="text-emerald-400 font-black">PRO</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">·</span>
            <span className="text-[10px] text-emerald-400/90 font-semibold tracking-wider uppercase">
              Inteligência de Caixa
            </span>
          </div>
        </motion.div>

        {/* ==================================================== */}
        {/* 3. SLEEK PROGRESS BAR & STATUS */}
        {/* ==================================================== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
          className="w-full mt-6 flex flex-col items-center"
        >
          {/* Progress track */}
          <div className="w-48 sm:w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
              initial={{ width: "8%" }}
              animate={{ width: ["8%", "45%", "85%", "100%"] }}
              transition={{ 
                duration: 2.2, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.7)] relative"
            >
              {/* Tip Glow */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            </motion.div>
          </div>

          {/* Micro Status Reassurance */}
          <div className="flex items-center gap-1.5 mt-2.5 text-[10.5px] text-slate-400 font-medium min-h-[16px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <motion.span
              key={statusText}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {statusText}
            </motion.span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
