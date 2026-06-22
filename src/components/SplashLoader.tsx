import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Trophy, Sparkles, Star, Zap, Activity } from 'lucide-react';

export default function SplashLoader() {
  const [statusIdx, setStatusIdx] = useState(0);

  const loadingStatuses = [
    'Conectando ao gramado virtual...',
    'Calibrando a bola oficial da Copa...',
    'Escalando a Seleção Brasileira...',
    'Aquecendo a torcida verde e amarela...',
    'Preparando o grito de GOOOL!...',
    'FinançasPro escalado para o Hexa! 🇧🇷'
  ];

  useEffect(() => {
    // Elegant progression matching the sporty Copa theme
    const intervals = [300, 600, 950, 1200, 1400];
    const timers: NodeJS.Timeout[] = [];

    intervals.forEach((delay, idx) => {
      const t = setTimeout(() => {
        setStatusIdx(idx + 1);
      }, delay);
      timers.push(t);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Generate some celebratory green and gold particle sparks
  const celebratorySparks = Array.from({ length: 25 }).map((_, i) => {
    const isGold = i % 2 === 0;
    return {
      id: i,
      color: isGold ? '#f59e0b' : '#22c55e', // Gold vs Green
      delay: i * 0.1,
      size: Math.random() * 8 + 4,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 1.5 + 1.5,
    };
  });

  return (
    <div className="min-h-screen bg-[#040811] bg-[radial-gradient(circle_at_50%_40%,#091d14_0%,#040811_100%)] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans">
      
      {/* 1. BRAZIL WORLD CUP THEMATIC GLOWS */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Dynamic glowing circular rings representing stadium spotlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/5 rounded-full animate-[spin_40s_linear_infinite] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-yellow-500/5 rounded-full animate-[spin_20s_linear_infinite_reverse] pointer-events-none" />

      {/* Ambient celebrating sparks floating across outer areas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        {celebratorySparks.map((spark) => (
          <motion.div
            key={spark.id}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 1, 0] }}
            transition={{
              duration: spark.duration,
              repeat: Infinity,
              delay: spark.delay,
              ease: "easeInOut",
            }}
            className="absolute rounded-full"
            style={{
              left: `${spark.x}%`,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              backgroundColor: spark.color,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Main Flag/Trophy Container */}
      <div className="relative flex flex-col items-center z-10">
        
        {/* Shiny Brazilian Ribbon Aura background */}
        <motion.div 
          animate={{ 
            scale: [1, 1.12, 1],
            opacity: [0.6, 0.9, 0.6] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-yellow-500/10 to-indigo-500/15 rounded-full blur-3xl filter -m-6"
        />

        {/* 5 pentacampeão stars on top with pulsing 6th star (Rumo ao Hexa) */}
        <div className="flex items-center gap-1.5 mb-5">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-[pulse_1.5s_infinite]" />
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-[pulse_1.5s_infinite_0.2s]" />
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-[pulse_1.5s_infinite_0.4s]" />
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-[pulse_1.5s_infinite_0.6s]" />
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-[pulse_1.5s_infinite_0.8s]" />
          {/* Pulsing outline star representing the future Hexa! */}
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="relative"
          >
            <Star className="w-5 h-5 text-emerald-400 fill-emerald-500/30 font-bold" />
            <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
            </span>
          </motion.div>
        </div>

        {/* Golden Trophy Arena */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-[40px] bg-[#0c1611]/90 border border-emerald-500/20 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden p-0.5"
        >
          {/* Brazil dynamic glow strip inside */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-yellow-400/5 to-transparent pointer-events-none" />
          
          <motion.div 
            animate={{ x: [-150, 150] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: "linear" }}
            className="absolute top-0 bottom-0 w-10 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent skew-x-12 filter blur-md"
          />

          {/* Golden Cup Core */}
          <motion.div
            animate={{ rotate: [-2, 2, -2], y: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center"
          >
            <Trophy className="w-14 h-14 text-yellow-400 filter drop-shadow-[0_4px_12px_rgba(234,179,8,0.4)] animate-pulse" />
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider mt-1.5">
              COPA DO MUNDO
            </span>
          </motion.div>
        </motion.div>

        {/* Stadium Theme & Branding Header */}
        <div className="mt-8 text-center space-y-4 px-6 max-w-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="space-y-1.5"
          >
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-wide text-white leading-none">
              FINANÇAS<span className="text-yellow-400 font-extrabold">PRO</span>
            </h1>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.25em]">
                Rumo ao HeXa na Copa • 2026🇧🇷
              </p>
            </div>
          </motion.div>

          {/* Micro loading progress bar with Green and Yellow Gradient */}
          <div className="w-52 h-[4px] bg-white/5 rounded-full mx-auto overflow-hidden relative border border-white/5 shadow-inner">
            <motion.div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-400 rounded-full"
              initial={{ width: "10%" }}
              animate={{ 
                width: statusIdx === 0 ? "15%" :
                       statusIdx === 1 ? "40%" :
                       statusIdx === 2 ? "60%" :
                       statusIdx === 3 ? "80%" : "100%"
               }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            />
          </div>

          {/* Brazil World Cup status sequence */}
          <div className="h-7 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-[10.5px] text-yellow-300 font-black uppercase tracking-widest leading-none flex items-center gap-2 justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              >
                {statusIdx < 5 ? (
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-[bounce_1s_infinite]" />
                )}
                {loadingStatuses[Math.min(statusIdx, loadingStatuses.length - 1)]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Premium Brazil-Coloured corner accents mimicking confetti banners */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-emerald-500/25 rounded-tl-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-yellow-400/25 rounded-tr-3xl pointer-events-none" />
      
      {/* Subtle branding footer */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-30">
        <span className="text-[9px] font-mono font-bold tracking-widest text-[#22c55e] uppercase">
          🇧🇷 SELEÇÃO FINANÇASPRO • TORCIDA OFICIAL 🇧🇷
        </span>
      </div>
    </div>
  );
}
