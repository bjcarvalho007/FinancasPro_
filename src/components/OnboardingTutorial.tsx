import React, { useState } from 'react';
import { useLanguage } from '../utils/i18n';
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
  CheckCircle2, 
  Bell, 
  MessageCircle,
  BookOpen,
  ListOrdered
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingTutorialProps {
  theme: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function OnboardingTutorial({ theme, isOpen, onClose, onOpen }: OnboardingTutorialProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [activeView, setActiveView] = useState<'step_by_step' | 'summary'>('step_by_step');

  const handleFinish = () => {
    localStorage.setItem('finançaspro_tutorial_seen_v2', 'true');
    setCurrentStep(0);
    onClose();
  };

  const steps = [
    {
      title: 'Boas-vindas ao FinançasPro',
      subtitle: 'O que o aplicativo faz por você',
      icon: <TrendingUp className="w-9 h-9 text-emerald-400" />,
      description: 'O FinançasPro é o seu gerenciador financeiro inteligente. Ele calcula em tempo real a sobra de caixa prevista para o seu mês, projeta contas futuras automaticamente e ajuda você a ter total previsibilidade e paz financeira sem complicação de planilhas.',
      color: "from-emerald-500/20 to-teal-500/5",
      badge: 'Início',
      tip: 'O sistema calcula automaticamente a sua sobra real de dinheiro somando suas rendas e subtraindo todas as suas contas fixas, gastos e parcelas do mês.'
    },
    {
      title: 'Passo 1: Ganhos, Salário e Saldo',
      subtitle: 'Defina o seu ponto de partida',
      icon: <DollarSign className="w-9 h-9 text-emerald-400" />,
      description: 'No botão "Ganhos" (no topo da tela), informe sua Renda/Salário mensal e o Saldo Inicial (dinheiro que sobrou do mês anterior ou está na conta). Você também pode registrar rendimentos Extras sempre que receber valores pontuais.',
      color: "from-teal-500/20 to-green-500/5",
      badge: 'Passo 1 de 7',
      tip: 'Configure seu salário uma vez e o sistema manterá sua renda projetada mensalmente para calcular sua sobra líquida com precisão.'
    },
    {
      title: 'Passo 2: Contas Fixas Recorrentes',
      subtitle: 'Projeção automática para meses futuros',
      icon: <Calendar className="w-9 h-9 text-indigo-400" />,
      description: 'Cadastre suas despesas que se repetem todo mês (aluguel, condomínio, luz, internet, assinaturas). Você só precisa cadastrar uma única vez: o sistema replica essas contas automaticamente para todos os meses futuros aguardando sua quitação.',
      color: "from-indigo-500/20 to-indigo-600/5",
      badge: 'Passo 2 de 7',
      tip: 'Quando pagar a conta no mês, basta marcar o botão de quitação (Pagar). As contas dos meses futuros continuam abertas e calculadas.'
    },
    {
      title: 'Passo 3: Gastos Variáveis do Dia a Dia',
      subtitle: 'Controle de consumo mensal',
      icon: <Receipt className="w-9 h-9 text-amber-500" />,
      description: 'Registre os gastos avulsos do mês atual (alimentação, supermercado, combustível, farmácia, lazer). Esses gastos pertencem apenas ao mês em que foram lançados e ajudam você a enxergar com clareza para onde seu dinheiro foi.',
      color: "from-amber-500/20 to-orange-500/5",
      badge: 'Passo 3 de 7',
      tip: 'Categorize seus gastos variáveis para identificar facilmente quais categorias estão consumindo a maior fatia da sua renda.'
    },
    {
      title: 'Passo 4: Compras Parceladas e Cartão',
      subtitle: 'Previsibilidade sem sustos na fatura',
      icon: <CreditCard className="w-9 h-9 text-sky-400" />,
      description: 'Ao fazer compras parceladas no cartão de crédito, cadastre o valor da parcela e a quantidade total. O FinançasPro agenda automaticamente cada mês futuro, informando o número da parcela (ex: 3/10) e o saldo devedor restante.',
      color: "from-sky-500/20 to-blue-500/5",
      badge: 'Passo 4 de 7',
      tip: 'Se antecipar parcelas ou tiver gastos adicionais no cartão, use a opção de quitar ou adicionar valor extra diretamente na parcela.'
    },
    {
      title: 'Passo 5: Dashboard e Sobra de Caixa',
      subtitle: 'Seu cockpit financeiro em tempo real',
      icon: <LayoutDashboard className="w-9 h-9 text-violet-400" />,
      description: 'No Dashboard, você acompanha o termômetro do seu mês: a "Sobra Estimada de Caixa", o "Total a Pagar Pendente", gráficos de rateio por tipo de gasto e o comparativo percentual das suas despesas.',
      color: "from-violet-500/20 to-fuchsia-500/5",
      badge: 'Passo 5 de 7',
      tip: 'A Sobra Estimada mostra exatamente quanto sobrará após quitar todas as contas previstas do mês atual.'
    },
    {
      title: 'Passo 6: Metas e Cofrinhos',
      subtitle: 'Economize para realizar objetivos',
      icon: <Target className="w-9 h-9 text-pink-400" />,
      description: 'Na aba "Metas", crie objetivos de economia (reserva de emergência, viagens, compras planejadas). Defina o valor alvo e adicione aportes conforme economizar para acompanhar a barra de progresso até a realização.',
      color: "from-pink-500/20 to-rose-500/5",
      badge: 'Passo 6 de 7',
      tip: 'Transforme sobras de caixa em aportes para suas metas e veja seu patrimônio crescer mês a mês.'
    },
    {
      title: 'Passo 7: Suporte e Dúvidas Rápidas',
      subtitle: 'Atendimento humano no WhatsApp',
      icon: <MessageCircle className="w-9 h-9 text-emerald-400" />,
      description: 'Sempre que precisar de ajuda, suporte técnico ou tirar dúvidas sobre o funcionamento do FinançasPro, nossa equipe está disponível diretamente no WhatsApp para te atender com agilidade.',
      color: "from-emerald-500/20 to-teal-500/10",
      badge: 'Passo 7 de 7',
      tip: 'Clique no botão abaixo para iniciar uma conversa direta com nossa equipe de suporte no WhatsApp.'
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
      {/* Floating FAQ Action Button */}
      <div className="fixed bottom-20 right-6 z-45">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpen}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer border ${
            theme === 'light'
              ? 'bg-slate-900 border-slate-800 text-white shadow-slate-900/15 hover:bg-slate-800'
              : 'bg-[#0f1524]/95 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10 hover:border-emerald-400 hover:text-emerald-300 font-bold'
          }`}
          title="FAQ & Como Funciona o FinançasPro"
        >
          <div className="relative">
            <HelpCircle className="w-5.5 h-5.5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleFinish}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10"
            />

            {/* Modal Onboarding container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className={`w-full max-w-xl rounded-3xl p-6 md:p-7 shadow-2xl relative overflow-hidden z-20 border ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-[#0f1524] border-white/10 text-white'
              }`}
            >
              {/* Background ambient lighting */}
              <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              {/* Top Navigation Bar: Title & View Switcher */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                    <HelpCircle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm md:text-base leading-tight">
                      FAQ & Como Funciona
                    </h3>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                      Guia Oficial FinançasPro
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex p-0.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                    <button
                      onClick={() => setActiveView('step_by_step')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        activeView === 'step_by_step'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <ListOrdered className="w-3 h-3" /> Passo a Passo
                    </button>
                    <button
                      onClick={() => setActiveView('summary')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        activeView === 'summary'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3 h-3" /> Resumo
                    </button>
                  </div>

                  <button
                    onClick={handleFinish}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      theme === 'light' ? 'bg-slate-100 text-slate-500 hover:text-slate-900' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                    title="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View 1: Step-by-Step Interactive Guide */}
              {activeView === 'step_by_step' && (
                <div className="pt-4">
                  {/* Step Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-emerald-400'
                    }`}>
                      {steps[currentStep].badge}
                    </span>

                    {/* Step jump indicator */}
                    <div className="flex gap-1">
                      {steps.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentStep(i)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            i === currentStep 
                              ? 'w-5 bg-emerald-500' 
                              : `w-1.5 ${theme === 'light' ? 'bg-slate-200 hover:bg-slate-400' : 'bg-white/15 hover:bg-white/30'}`
                          }`}
                          title={`Ir para passo ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Active Step Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 min-h-[260px] flex flex-col justify-between"
                    >
                      <div>
                        {/* Title block */}
                        <div className="flex items-center gap-3.5 mb-3">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${steps[currentStep].color} border border-slate-200/60 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm`}>
                            {steps[currentStep].icon}
                          </div>
                          <div>
                            <h3 className="font-display font-black text-base md:text-lg tracking-tight leading-snug">
                              {steps[currentStep].title}
                            </h3>
                            <p className="text-xs text-emerald-500 font-bold tracking-wide mt-0.5">
                              {steps[currentStep].subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className={`text-xs md:text-sm leading-relaxed ${
                          theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                        }`}>
                          {steps[currentStep].description}
                        </p>
                      </div>

                      {/* Practical Tip Callout */}
                      {steps[currentStep].tip && (
                        <div className={`p-3 rounded-xl text-[11px] leading-relaxed border flex items-start gap-2 ${
                          theme === 'light' 
                            ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        }`}>
                          <span className="text-sm shrink-0">💡</span>
                          <div>
                            <strong>Dica Prática:</strong> {steps[currentStep].tip}
                          </div>
                        </div>
                      )}

                      {/* Final step WhatsApp link */}
                      {currentStep === steps.length - 1 && (
                        <div className="space-y-2 pt-1">
                          <a
                            href="https://wa.me/5563992092699?text=Olá!%20Preciso%20de%20ajuda%20ou%20suporte%20no%20FinançasPro."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                          >
                            <MessageCircle className="w-4.5 h-4.5" />
                            Falar com Suporte no WhatsApp
                          </a>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                        currentStep === 0
                          ? 'opacity-40 cursor-not-allowed border-transparent'
                          : theme === 'light'
                            ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                    </button>

                    <button
                      onClick={nextStep}
                      className="h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/10 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {currentStep === steps.length - 1 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Concluir Guia
                        </>
                      ) : (
                        <>
                          Próximo <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* View 2: Quick Concise Summary of What the App Does */}
              {activeView === 'summary' && (
                <div className="pt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  <div className={`p-3.5 rounded-2xl border ${
                    theme === 'light' ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  }`}>
                    <h4 className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                      O que o FinançasPro faz por você?
                    </h4>
                    <p className="text-[11px] leading-relaxed mt-1">
                      O aplicativo calcula sua <strong>Sobra Real de Caixa</strong> no final do mês antes mesmo de você pagar todas as faturas, projetando contas recorrentes para todos os meses futuros sem retrabalho.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/5 text-slate-200'
                    }`}>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        1
                      </div>
                      <div className="text-[11.5px] leading-normal">
                        <strong className="text-emerald-500 block">Rendas & Ganhos:</strong>
                        Cadastre seu salário e saldo inicial no botão <strong>Ganhos</strong> no topo para ter a base de cálculo exata.
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/5 text-slate-200'
                    }`}>
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        2
                      </div>
                      <div className="text-[11.5px] leading-normal">
                        <strong className="text-indigo-500 block">Contas Fixas Recorrentes:</strong>
                        Lance contas mensais (aluguel, internet, luz) uma única vez. O app projeta automaticamente para todos os meses futuros.
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/5 text-slate-200'
                    }`}>
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        3
                      </div>
                      <div className="text-[11.5px] leading-normal">
                        <strong className="text-amber-500 block">Gastos Variáveis do Dia a Dia:</strong>
                        Lance compras de mercado, transporte e lazer para saber exatamente onde seu dinheiro está sendo gasto no mês.
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/5 text-slate-200'
                    }`}>
                      <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        4
                      </div>
                      <div className="text-[11.5px] leading-normal">
                        <strong className="text-sky-500 block">Parcelados & Cartão:</strong>
                        Controle compras divididas com previsão automática do número de parcelas restantes e do saldo devedor.
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/5 text-slate-200'
                    }`}>
                      <div className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        5
                      </div>
                      <div className="text-[11.5px] leading-normal">
                        <strong className="text-violet-500 block">Dashboard & Sobra Estimada:</strong>
                        Acompanhe o rateio visual de despesas, sua nota de controle e quanto vai sobrar na conta no final do mês.
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/5 text-slate-200'
                    }`}>
                      <div className="w-7 h-7 rounded-lg bg-pink-500/15 text-pink-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        6
                      </div>
                      <div className="text-[11.5px] leading-normal">
                        <strong className="text-pink-500 block">Metas & Poupança:</strong>
                        Crie objetivos financeiros com prazos e acompanhe seus aportes até a realização de cada meta.
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href="https://wa.me/5563992092699?text=Olá!%20Preciso%20de%20ajuda%20ou%20suporte%20no%20FinançasPro."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Falar com Suporte no WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

