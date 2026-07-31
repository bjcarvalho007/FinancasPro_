import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';

export default function SplashLoader() {
  return (
    <div className="min-h-screen bg-[#040811] bg-[radial-gradient(circle_at_50%_45%,#092222_0%,#040811_100%)] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans">
      
      {/* Soft Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Main Emerging Logo Arena */}
      <div className="relative flex flex-col items-center z-10">
        
        {/* Pulsing Aura */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.8, 0.4], scale: [0.8, 1.15, 1] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-teal-400/20 to-emerald-300/10 rounded-full blur-2xl filter -m-4"
        />

        {/* Logo Card Emerging */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-[36px] bg-[#0b1613] border border-emerald-500/30 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.25)] relative overflow-hidden"
        >
          {/* Subtle sheen highlight */}
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 filter blur-sm"
          />

          <TrendingUp className="w-14 h-14 text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,0.5)]" />
        </motion.div>

        {/* Emerging Title */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="mt-5 text-center"
        >
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-wider text-white">
            FINANÇAS<span className="text-emerald-400 font-extrabold">PRO</span>
          </h1>
        </motion.div>
      </div>
    </div>
  );
}


