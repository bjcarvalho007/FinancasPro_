import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cpu } from 'lucide-react';

export default function SplashLoader() {
  const [statusIdx, setStatusIdx] = useState(0);

  const loadingStatuses = [
    'Carregando cofre criptografado...',
    'Estabelecendo conexão segura SSL...',
    'Sincronizando banco de dados...',
    'Otimizando relatórios de caixa...',
    'Calculando metas e previsões de sobra...',
    'FinançasPro pronto!'
  ];

  useEffect(() => {
    const intervals = [1200, 2200, 3200, 4200, 4900];
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

  return (
    <div className="min-h-screen bg-[#070a13] bg-[radial-gradient(circle_at_50%_40%,#121b34_0%,#070a13_100%)] flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Decorative premium light glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Logo Card and Animation Ring */}
      <div className="relative flex flex-col items-center z-10">
        
        {/* Glow behind the logo */}
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5] 
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 rounded-full blur-2xl filter -m-4"
        />

        {/* Outer rotating/pulsing ring */}
        <div className="absolute -inset-2.5 rounded-[40px] border border-white/5 bg-gradient-to-tr from-indigo-500/10 via-transparent to-emerald-500/10 animate-[spin_10s_linear_infinite]" />

        {/* Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-[36px] bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden p-0.5"
        >
          {/* Internal diagonal shine effect */}
          <motion.div 
            animate={{ x: [-150, 150] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5, ease: "linear" }}
            className="absolute top-0 bottom-0 w-8 bg-white/10 skew-x-12 filter blur-md"
          />

          {/* Actual Application Logo */}
          <img 
            src="/app_icon.png" 
            alt="FinançasPro Logo" 
            className="w-full h-full object-cover rounded-[34px] shadow-inner"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Status texts and Loader Line */}
        <div className="mt-8 text-center space-y-4 px-6 max-w-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-1"
          >
            <h1 className="font-display font-black text-xl sm:text-2xl tracking-widest text-white leading-none">
              FINANÇAS<span className="text-emerald-400 font-extrabold">PRO</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.25em]">
              Plataforma Premium de Caixa
            </p>
          </motion.div>

          {/* Micro loading progress bar */}
          <div className="w-48 h-[3px] bg-white/5 rounded-full mx-auto overflow-hidden relative border border-white/5">
            <motion.div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full"
              initial={{ width: "8%" }}
              animate={{ 
                width: statusIdx === 0 ? "15%" :
                       statusIdx === 1 ? "35%" :
                       statusIdx === 2 ? "55%" :
                       statusIdx === 3 ? "75%" : "100%"
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Dynamic Status message handler */}
          <div className="h-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none flex items-center gap-1.5 justify-center"
              >
                {statusIdx < 5 ? (
                  <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {loadingStatuses[Math.min(statusIdx, loadingStatuses.length - 1)]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Subtle branding footer in margins */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-20">
        <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">
          BJC DESENVOLVIMENTOS • SECURE SYSTEMS
        </span>
      </div>
    </div>
  );
}
