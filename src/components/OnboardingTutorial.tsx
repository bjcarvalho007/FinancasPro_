import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Receipt, 
  CreditCard, 
  DollarSign, 
  LayoutDashboard, 
  Target, 
  CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingTutorialProps {
  theme: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function OnboardingTutorial({ theme, isOpen, onClose, onOpen }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Automatically open tutorial on first login if not seen yet
  useEffect(() => {
    const hasSeen = localStorage.getItem('finançaspro_tutorial_seen_v2');
    if (!hasSeen) {
      // Small timeout to let elements slide-in first
      const timer = setTimeout(() => {
        onOpen();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [onOpen]);

  const handleFinish = () => {
    localStorage.setItem('finançaspro_tutorial_seen_v2', 'true');
    setCurrentStep(0);
    onClose();
  };

  const steps = [
    {
      title: "Boas-vindas ao FinançasPro!",
      subtitle: "Seu cockpit financeiro premium",
      icon: <TrendingUp className="w-10 h-10 text-emerald-400" />,
      description: "Esqueça planilhas confusas ou sistemas corporativos burocráticos. O FinançasPro foi feito para pessoas que valorizam precisão e um visual impecável. Vamos te guiar rapidamente sobre como funciona sua nova gestão de caixa inteligente.",
      color: "from-emerald-500/20 to-teal-500/5",
      badge: "Início"
    },
    {
      title: "📌 Contas Recorrentes (Contas/Fixos)",
      subtitle: "Preveja o futuro sem falhas",
      icon: <Calendar className="w-10 h-10 text-indigo-400" />,
      description: "Aqui ficam suas contas fixas (aluguel, condomínio, internet, assinaturas). O nosso motor projeta essas contas automaticamente para todos os meses futuros! Basta cadastrá-las uma única vez e elas aparecerão todo mês aguardando seu clique de quitação.",
      color: "from-indigo-500/20 to-indigo-600/5",
      badge: "Passo 1 de 5"
    },
    {
      title: "📊 Gastos do Cotidiano (Variados)",
      subtitle: "Para onde está indo o dinheiro?",
      icon: <Receipt className="w-10 h-10 text-amber-500" />,
      description: "São as suas despesas variáveis que acontecem apenas no mês atual (restaurantes, transporte, farmácia, lazer). Registre esses gastos rápidos para mapear furos de orçamento e entender seu padrão de consumo mensal sem mistérios.",
      color: "from-amber-500/20 to-orange-500/5",
      badge: "Passo 2 de 5"
    },
    {
      title: "💳 Compras Parceladas (Parcelados)",
      subtitle: "Inteligência futura em parcelas",
      icon: <CreditCard className="w-10 h-10 text-sky-400" />,
      description: "Ideal para quando você parcela uma compra no cartão de crédito. Você insere o valor total e o histórico de parcelados monitora quanto ainda resta pagar nos devedores e o peso acumulado disso no seu saldo disponível de longo prazo.",
      color: "from-sky-500/20 to-blue-500/5",
      badge: "Passo 3 de 5"
    },
    {
      title: "💵 Rendas, Saldo e Sobras",
      subtitle: "O cálculo exato do seu bolso",
      icon: <DollarSign className="w-10 h-10 text-emerald-400" />,
      description: "No botão 'Ganhos', configure seu Salário/Renda padrão, as sobras do mês anterior (Saldo Inicial) e eventuais rendimentos Extras. O FinançasPro abate todas as suas contas cadastradas de forma cumulativa, te dando a sobra exata estimada para poupar livremente.",
      color: "from-teal-500/20 to-green-500/5",
      badge: "Passo 4 de 5"
    },
    {
      title: "💎 Dashboard & Metas Reais",
      subtitle: "Govemança de caixa e metas",
      icon: <LayoutDashboard className="w-10 h-10 text-violet-400" />,
      description: "Na aba 'Dashboard', consulte sua nota de controle e ganhe orientações automáticas de como policiar seus limites. Use a aba de 'Metas' para criar objetivos de poupança (metas de investimento, cofrinhos) e adicione fundos conforme economiza para realizar seus sonhos passo a passo.",
      color: "from-violet-500/20 to-fuchsia-500/5",
      badge: "Passo 5 de 5"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <>
      {/* Floating Action Button - Always available to user to trigger description review */}
      <div className="fixed bottom-20 left-6 z-[60]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpen}
          className={`flex items-center gap-2 pl-4 pr-5 py-3 rounded-full text-xs font-bold leading-none shadow-2xl transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-slate-900 text-white shadow-slate-900/20 border border-slate-800'
              : 'bg-[#0f1524]/95 hover:bg-[#0f1524] text-slate-100 border border-emerald-500/30 shadow-emerald-500/10 hover:border-emerald-500/50'
          }`}
          title="Ver Tutorial do Aplicativo"
        >
          <div className="relative">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span>Como Usar</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleFinish}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Onboarding container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className={`w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden z-10 border ${
                theme === 'light'
                  ? 'bg-white border-slate-205 text-slate-900'
                  : 'bg-[#0f1524] border-white/10 text-white'
              }`}
            >
              {/* Animated corner decorations */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-slate-400'
                }`}>
                  {steps[currentStep].badge}
                </span>
                
                <button
                  onClick={handleFinish}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    theme === 'light' ? 'bg-slate-100 text-slate-400 hover:text-slate-700' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                  title="Pular guia rápido"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active Step Content Slider */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-6 min-h-[290px] flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Icon Container with backdrop blend */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${steps[currentStep].color} border border-white/5 flex items-center justify-center shrink-0`}>
                        {steps[currentStep].icon}
                      </div>
                      <div>
                        <h3 className={`font-display font-black text-lg md:text-xl tracking-tight leading-tight ${
                          theme === 'light' ? 'text-slate-900 font-bold' : 'text-slate-50'
                        }`}>
                          {steps[currentStep].title}
                        </h3>
                        <p className="text-xs text-emerald-400 font-bold tracking-wide mt-0.5 uppercase">
                          {steps[currentStep].subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Step detailed text description */}
                    <p className={`text-sm tracking-normal leading-relaxed font-normal ${
                      theme === 'light' ? 'text-slate-600' : 'text-slate-300'
                    }`}>
                      {steps[currentStep].description}
                    </p>
                  </div>

                  {/* Feature tips callout block on specific views */}
                  {currentStep === 1 && (
                    <div className={`p-3.5 rounded-2xl text-[11px] leading-snug border ${
                      theme === 'light' ? 'bg-indigo-50/50 border-indigo-100 text-indigo-750' : 'bg-indigo-950/15 border-indigo-500/10 text-indigo-300'
                    }`}>
                      💡 <strong>Super Dica:</strong> Ganhos e faturas fixados ajudam você a ver se terá dinheiro no fim do mês mesmo antes de pagar qualquer uma de suas contas!
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className={`p-3.5 rounded-2xl text-[11px] leading-snug border ${
                      theme === 'light' ? 'bg-sky-50/50 border-sky-100 text-sky-750' : 'bg-sky-950/15 border-sky-500/10 text-sky-300'
                    }`}>
                      💡 <strong>Gestão de Cartão:</strong> Acompanhando as parcelas que restam (Ex: 3/10) você reduz gastos desnecessários que engessam seu saldo pros próximos meses.
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className={`p-3.5 rounded-2xl text-[11px] leading-snug border ${
                      theme === 'light' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-750' : 'bg-emerald-950/15 border-emerald-500/10 text-emerald-300'
                    }`}>
                      💡 <strong>Sobra Líquida:</strong> Sempre reabasteça as sobras acumuladas de meses passados informando o valor em &quot;Saldo Inicial&quot;. Isso assegura a precisão do seu montante!
                    </div>
                  )}

                  {currentStep === steps.length - 1 && (
                    <div className={`p-3.5 rounded-2xl text-[11px] leading-snug border ${
                      theme === 'light' ? 'bg-violet-50/50 border-violet-100 text-violet-750' : 'bg-violet-950/15 border-violet-500/10 text-violet-300'
                    } flex items-center gap-2 font-medium`}>
                      <Sparkles className="w-4 h-4 text-violet-400 animate-pulse shrink-0" />
                      <span>Seu onboarding está completo! Pronto para usufruir de ferramentas financeiras premium.</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer controls & indicators */}
              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                {/* Dots Indicator */}
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === currentStep 
                          ? 'w-5 bg-emerald-400' 
                          : `w-1.5 ${theme === 'light' ? 'bg-slate-200 hover:bg-slate-350' : 'bg-white/10 hover:bg-white/20'}`
                      }`}
                      title={`Ir para o slide ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Back and Next navigation buttons */}
                <div className="flex gap-2.5">
                  {currentStep > 0 && (
                    <button
                      onClick={prevStep}
                      className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                        theme === 'light'
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                  )}

                  <button
                    onClick={nextStep}
                    className="h-10 px-5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer font-display"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Concluído
                      </>
                    ) : (
                      <>
                        Avançar <ChevronRight className="w-4 h-4" />
                      </>
                    )}
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
