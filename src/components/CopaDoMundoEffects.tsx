import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, Star, Zap, X, Flame } from 'lucide-react';

interface CopaDoMundoEffectsProps {
  theme: 'dark' | 'light';
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speedX: number;
  speedY: number;
  rotation: number;
}

export default function CopaDoMundoEffects({ theme }: CopaDoMundoEffectsProps) {
  const [activeTab, setActiveTab] = useState<'closed' | 'widget' | 'penalty'>('closed');
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [goalsScored, setGoalsScored] = useState<number>(() => {
    return Number(localStorage.getItem('copa_gols_scored') || '0');
  });
  const [penaltyState, setPenaltyState] = useState<'idle' | 'kicked_success' | 'kicked_miss' | 'goalkeeper_save'>('idle');
  const [showGoalBanner, setShowGoalBanner] = useState<boolean>(false);
  const [ambientConfetti, setAmbientConfetti] = useState<boolean>(true);

  // Initialize background ambient soccer star particles
  useEffect(() => {
    if (!ambientConfetti) return;

    const interval = setInterval(() => {
      // Trigger small burst automatically
      triggerConfetti(3);
    }, 4000);

    return () => clearInterval(interval);
  }, [ambientConfetti]);

  // Handle Confetti animation frames
  useEffect(() => {
    if (confetti.length === 0) return;

    let animFrame: number;
    const updateConfetti = () => {
      setConfetti((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.speedX,
            y: p.y + p.speedY + 0.15, // gravity
            rotation: p.rotation + 3,
          }))
          .filter((p) => p.y < 120 && p.x > -10 && p.x < 110)
      );
      animFrame = requestAnimationFrame(updateConfetti);
    };

    animFrame = requestAnimationFrame(updateConfetti);
    return () => cancelAnimationFrame(animFrame);
  }, [confetti]);

  const triggerConfetti = (count: number) => {
    const colors = [
      '#22c55e', // Green
      '#eab308', // Yellow
      '#1d4ed8', // Blue
      '#ffffff', // White
    ];

    const newPieces: ConfettiPiece[] = Array.from({ length: count }).map((_, i) => {
      const isSideLaunch = Math.random() > 0.5;
      return {
        id: Date.now() + i + Math.random(),
        x: isSideLaunch ? (Math.random() > 0.5 ? 0 : 100) : Math.random() * 100,
        y: isSideLaunch ? Math.random() * 40 + 20 : 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 12 + 6,
        angle: Math.random() * 360,
        speedX: (Math.random() - 0.5) * 4 + (isSideLaunch ? (Math.random() > 0.5 ? 2 : -2) : 0),
        speedY: -(Math.random() * 7 + 5),
        rotation: Math.random() * 360,
      };
    });

    setConfetti((prev) => [...prev, ...newPieces].slice(-100)); // Cap at 100 particles for performance
  };

  const handleKick = (direction: 'left' | 'center' | 'right') => {
    if (penaltyState !== 'idle') return;

    // AI goalkeeper random direction choice
    const goalkeeperChoices: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
    const keeperDirection = goalkeeperChoices[Math.floor(Math.random() * goalkeeperChoices.length)];

    if (direction === keeperDirection) {
      // Saved by goalkeeper
      setPenaltyState('goalkeeper_save');
      setTimeout(() => {
        setPenaltyState('idle');
      }, 2500);
    } else {
      // Goal!
      setPenaltyState('kicked_success');
      const newScore = goalsScored + 1;
      setGoalsScored(newScore);
      localStorage.setItem('copa_gols_scored', String(newScore));

      // Visual fanfare!
      setShowGoalBanner(true);
      triggerConfetti(50);
      
      // Secondary bursts for rich atmosphere
      setTimeout(() => triggerConfetti(30), 450);
      setTimeout(() => triggerConfetti(30), 900);

      setTimeout(() => {
        setPenaltyState('idle');
        setShowGoalBanner(false);
      }, 3500);
    }
  };

  return (
    <>
      {/* 1. AMBIENT SKY CONFETTI CANVAS (ZERO CPU OVERHEAD) */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden select-none">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-sm transition-transform duration-75"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size * 0.4}px`,
              backgroundColor: p.color,
              transform: `rotate(${p.rotation}deg)`,
              opacity: 0.85,
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          />
        ))}
      </div>

      {/* 2. WORLD CUP INTRO / FLOATING BADGE (DISCREET & PREMIUM) */}
      {activeTab === 'closed' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="fixed bottom-26 lg:bottom-6 left-4 z-[52]"
        >
          <button
            onClick={() => {
              setActiveTab('widget');
              triggerConfetti(15);
            }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-full border shadow-2xl bg-gradient-to-r from-emerald-600 via-yellow-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 text-white font-sans text-xs font-black uppercase tracking-wider transition-all duration-300 scale-100 hover:scale-110 active:scale-95 border-yellow-400 group cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300"></span>
            </span>
            <Trophy className="w-4 h-4 animate-bounce text-yellow-300" />
            <span>Copa 🇧🇷</span>
          </button>
        </motion.div>
      )}

      {/* 3. EXPANDED WORLD CUP HUB MODAL */}
      <AnimatePresence>
        {activeTab === 'widget' && (
          <div className="fixed inset-0 bg-[#02050fef]/80 backdrop-blur-md flex items-center justify-center p-4 z-[110] font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className={`w-full max-w-md rounded-3xl border p-6 overflow-hidden relative shadow-[0_25px_60px_-15px_rgba(34,197,94,0.18)] ${
                theme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-900' 
                  : 'bg-[#0b0e17] border-white/5 text-slate-100'
              }`}
            >
              {/* Brazil Gradient Line Flag Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500" />

              {/* Close Button */}
              <button
                onClick={() => setActiveTab('closed')}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/5 text-slate-450'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Hub Header */}
              <div className="text-center space-y-2 mt-4">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 mb-2">
                  <Trophy className="w-8 h-8 text-yellow-400 animate-[pulse_2s_infinite]" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center justify-center gap-1.5">
                  Brasil Rumo ao Hexa! <span className="animate-bounce">🇧🇷</span>
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  FinançasPro celebra com a torcida brasileira na Copa! Divirta-se marcando gols e decore com confetes.
                </p>
              </div>

              {/* Score / Penalty Kick Arena Link */}
              <div className={`my-5 p-4 rounded-2xl border text-center relative overflow-hidden ${
                theme === 'light' ? 'bg-slate-50 border-slate-200/80' : 'bg-white/3 border-white/5'
              }`}>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Seus Gols na Copa
                </div>
                <div className="text-3xl font-black font-display tracking-wider text-emerald-400">
                  {goalsScored} <span className="text-yellow-400 text-lg uppercase font-black ml-1">Gols</span>
                </div>
                
                <button
                  onClick={() => {
                    setActiveTab('penalty');
                    setPenaltyState('idle');
                  }}
                  className="mt-3.5 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-900/10 hover:shadow-emerald-500/15 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  🥅 Jogar Penaltis
                </button>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-1">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-450" /> Chuva de Confetes Ambientais:
                  </span>
                  <button
                    onClick={() => {
                      setAmbientConfetti(!ambientConfetti);
                      if (!ambientConfetti) triggerConfetti(15);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-extrabold uppercase tracking-widest text-[9px] transition-all cursor-pointer ${
                      ambientConfetti
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : theme === 'light' ? 'bg-slate-100 text-slate-400' : 'bg-white/3 text-slate-500'
                    }`}
                  >
                    {ambientConfetti ? 'Ativado' : 'Desativado'}
                  </button>
                </div>

                <div className="h-px bg-white/5 my-2" />

                {/* Quick cheer buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerConfetti(40)}
                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all text-center cursor-pointer ${
                      theme === 'light'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
                    }`}
                  >
                    🎉 Soltar Confete
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('closed');
                      triggerConfetti(25);
                    }}
                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all text-center cursor-pointer ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-white/3 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Fechar Menu
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. PENALTY SHOOTOUT ARENA (KICK TO SCORE) */}
      <AnimatePresence>
        {activeTab === 'penalty' && (
          <div className="fixed inset-0 bg-[#02050fed]/90 backdrop-blur-md flex items-center justify-center p-4 z-[112] font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-xl rounded-3xl border p-6 relative overflow-hidden shadow-2xl ${
                theme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-900' 
                  : 'bg-[#080c16] border-white/5 text-slate-100'
              }`}
            >
              {/* Back to hub button */}
              <button
                onClick={() => setActiveTab('widget')}
                className={`absolute top-4 left-4 py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 border cursor-pointer ${
                  theme === 'light' 
                    ? 'hover:bg-slate-100 text-slate-600 border-slate-200' 
                    : 'hover:bg-white/5 text-slate-400 border-white/5'
                }`}
              >
                ← Voltar
              </button>

              <div className="text-center space-y-1 mb-5">
                <h4 className="text-sm font-black uppercase tracking-wider text-yellow-400">
                  Desafio de Penaltis FinançasPro
                </h4>
                <p className="text-[11px] text-slate-400">
                  Escolha uma direção para cobrar o penalti e comemore seu gol!
                </p>
              </div>

              {/* SOCCER STADIUM STAGE RENDER */}
              <div className="relative h-60 bg-gradient-to-b from-[#1a3821] to-[#122817] rounded-2xl border border-emerald-500/20 overflow-hidden flex flex-col justify-end items-center p-4">
                
                {/* Yard Lines & Goal Post */}
                <div className="absolute top-10 left-12 right-12 bottom-0 border-t-2 border-x-2 border-dashed border-white/10 pointer-events-none" />
                <div className="absolute top-10 left-4 right-4 h-24 border-4 border-b-0 border-white/30 bg-emerald-950/20 flex items-center justify-center">
                  {/* Goal Network Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-[size:10px_10px]" />
                  
                  {/* GOALKEEPER (Simple Animating Shield/Circle) */}
                  <motion.div
                    animate={
                      penaltyState === 'idle'
                        ? { x: [-35, 35, -35] }
                        : penaltyState === 'goalkeeper_save'
                        ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                        : { opacity: 0.5, y: [0, 20, 0] }
                    }
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-12 h-12 rounded-full border bg-amber-500/10 border-amber-500/30 flex items-center justify-center text-white font-black text-[12px] z-10 shadow-lg relative"
                  >
                    🧤
                  </motion.div>
                </div>

                {/* Score panel in stadium */}
                <div className="absolute top-3 right-4 bg-black/40 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-white/5">
                  Placar: {goalsScored} Gols
                </div>

                {/* SOCCER BALL WITH KICK ANIMATION */}
                <motion.div
                  initial={{ y: 0, scale: 1 }}
                  animate={
                    penaltyState === 'kicked_success'
                      ? { y: -110, x: [0, -30, -50], scale: 0.5, rotate: 720 }
                      : penaltyState === 'goalkeeper_save'
                      ? { y: -60, x: [0, 10, 15], scale: 0.6, rotate: 360 }
                      : { y: 0, x: 0, scale: 1 }
                  }
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-10 h-10 rounded-full border border-black/10 bg-white shadow-lg flex items-center justify-center text-xl select-none z-20"
                >
                  ⚽
                </motion.div>

                {/* GOOOOL Fanfare Overlay Banner */}
                <AnimatePresence>
                  {showGoalBanner && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center z-30"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], rotate: [-2, 2, -2] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="text-center space-y-1"
                      >
                        <h2 className="text-4xl font-black text-yellow-300 tracking-wider uppercase font-display drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                          GOL DO BRASIL!
                        </h2>
                        <p className="text-xs uppercase font-black tracking-widest text-white drop-shadow">
                          🇧🇷 Copa do Mundo +1 Gol 🇧🇷
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Defensive Save Banner */}
                {penaltyState === 'goalkeeper_save' && (
                  <div className="absolute inset-0 bg-rose-950/75 flex flex-col items-center justify-center z-30">
                    <h2 className="text-2xl font-black text-rose-450 tracking-widest uppercase mb-1">
                      DEFENDEU O GOLEIRO!
                    </h2>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-350">
                      Tente cobrar no outro canto!
                    </p>
                  </div>
                )}
              </div>

              {/* Action Kick Buttons */}
              <div className="mt-5 space-y-3">
                <div className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Onde cobrar o penalti?
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    disabled={penaltyState !== 'idle'}
                    onClick={() => handleKick('left')}
                    className="py-3 px-2 rounded-2xl border text-[11px] font-black uppercase tracking-wider bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/10 text-emerald-400 transition-all text-center disabled:opacity-40 cursor-pointer"
                  >
                    ↖ Canto Esquerdo
                  </button>
                  <button
                    disabled={penaltyState !== 'idle'}
                    onClick={() => handleKick('center')}
                    className="py-3 px-2 rounded-2xl border text-[11px] font-black uppercase tracking-wider bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/10 text-emerald-400 transition-all text-center disabled:opacity-40 cursor-pointer"
                  >
                    ⬆ Meio do Gol
                  </button>
                  <button
                    disabled={penaltyState !== 'idle'}
                    onClick={() => handleKick('right')}
                    className="py-3 px-2 rounded-2xl border text-[11px] font-black uppercase tracking-wider bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/10 text-emerald-400 transition-all text-center disabled:opacity-40 cursor-pointer"
                  >
                    ↗ Canto Direito
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
