export type Language = 'pt' | 'es' | 'en' | 'fr';

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
  currency: 'BRL' | 'EUR' | 'USD';
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'pt', label: 'Português (BR)', flag: '🇧🇷', currency: 'BRL' },
  { code: 'es', label: 'Español (ES)', flag: '🇪🇸', currency: 'EUR' },
  { code: 'en', label: 'English (US)', flag: '🇺🇸', currency: 'USD' },
  { code: 'fr', label: 'Français (FR)', flag: '🇫🇷', currency: 'EUR' }
];

export const monthsByLang: Record<Language, string[]> = {
  pt: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  es: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  fr: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
};

export const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Top Bar & Branding
    ganhos: 'Ganhos',
    idioma: 'Idioma',
    selecionarIdioma: 'Selecione o Idioma do Sistema',
    membroVIP: '👑 Membro VIP',
    assinantePRO: '⭐ Assinante PRO',
    contaGratis: '⚡ Conta Grátis',
    sair: 'Sair da plataforma',
    
    // Navigation Tabs
    dashboard: 'Dashboard',
    contasFixas: 'Contas Fixas',
    fixas: 'Fixas',
    gastoVariavel: 'Gasto Variável',
    variados: 'Variados',
    parcelados: 'Parcelados',
    metas: 'Metas',
    configuracoes: 'Configurações',
    ajustes: 'Ajustes',
    
    // Summary Cards
    sobraEstimada: 'Sobra Estimada de Caixa',
    sobraLivre: 'Sobra Livre para Investir / Poupar',
    rendaCadastrada: 'Renda mensal cadastrada',
    definirGanhos: 'Definir Ganhos',
    totalPendente: 'Total a Pagar Pendente',
    comprometidoMes: 'Comprometido do mês',
    
    // Common Controls
    ambienteSeguro: 'Ambiente Seguro',
    topo: 'Topo',
    voltarTopo: 'Voltar ao Topo',
    novaTransacao: 'Nova Transação',
    adicionarConta: 'Adicionar Lançamento',
    buscar: 'Buscar transação...',
    filtrar: 'Filtrar',
    faturados: 'Faturados / Pagos',
    pendentes: 'Pendentes',
    todos: 'Todos',
    limparFiltros: 'Limpar Filtros',
    semLancamentos: 'Sem lançamentos registrados',
    paraOMesSelecionado: 'para o mês selecionado.',
    
    // Modals & Panels
    ganhosCompetencia: 'Ganhos da Competência',
    gerenciarGanhos: 'Configurar Renda, Sobra Anterior e Extras do mês',
    salarioRendaPadrao: 'Salário / Renda Padrão Mensal',
    sobraAnterior: 'Saldo Inicial (Sobras do Mês Anterior)',
    ganhosExtrasSoma: 'Soma de Ganhos Extras do Mês',
    salvarGanhos: 'Salvar Ganhos',
    gerenciarExtras: 'Gerenciar Ganhos Extras',
    
    // Notifications & Premium
    avisoExpiracaoTitulo: 'Seu Plano Premium vence em breve! ✨',
    avisoExpiracaoDesc: 'Olá! Percebemos que faltam poucos dias para a data de vencimento do seu plano Premium. Se quiser continuar aproveitando o controle total das suas finanças sem qualquer interrupção, você já pode renovar seu mês de uso de forma simples e suave.',
    renovarMes: 'Renovar Mês Agora ⚡',
    
    // Export & Tools
    exportarRelatorio: 'Exportar Relatório PDF / CSV',
    baixaAutomatica: 'Baixa Automática',
    duplicar: 'Duplicar',
    excluir: 'Excluir',
    editar: 'Editar',
    concluido: 'Pago / Concluído',
    pendente: 'Pendente',
  },
  es: {
    // Top Bar & Branding
    ganhos: 'Ingresos',
    idioma: 'Idioma',
    selecionarIdioma: 'Seleccionar Idioma del Sistema',
    membroVIP: '👑 Miembro VIP',
    assinantePRO: '⭐ Suscriptor PRO',
    contaGratis: '⚡ Cuenta Gratuita',
    sair: 'Cerrar sesión',
    
    // Navigation Tabs
    dashboard: 'Panel Principal',
    contasFixas: 'Gastos Fijos',
    fixas: 'Fijos',
    gastoVariavel: 'Gasto Variable',
    variados: 'Variables',
    parcelados: 'Cuotas / A plazos',
    metas: 'Metas',
    configuracoes: 'Configuración',
    ajustes: 'Ajustes',
    
    // Summary Cards
    sobraEstimada: 'Excedente Estimado de Caja',
    sobraLivre: 'Excedente Libre para Invertir / Ahorrar',
    rendaCadastrada: 'Ingreso mensual registrado',
    definirGanhos: 'Definir Ingresos',
    totalPendente: 'Total Pendiente de Pago',
    comprometidoMes: 'Comprometido del mes',
    
    // Common Controls
    ambienteSeguro: 'Entorno Seguro',
    topo: 'Inicio',
    voltarTopo: 'Volver al Inicio',
    novaTransacao: 'Nueva Transacción',
    adicionarConta: 'Agregar Registro',
    buscar: 'Buscar transacción...',
    filtrar: 'Filtrar',
    faturados: 'Facturados / Pagados',
    pendentes: 'Pendientes',
    todos: 'Todos',
    limparFiltros: 'Limpiar Filtros',
    semLancamentos: 'Sin registros encontrados',
    paraOMesSelecionado: 'para el mes seleccionado.',
    
    // Modals & Panels
    ganhosCompetencia: 'Ingresos del Mes',
    gerenciarGanhos: 'Configurar Salario, Saldo Anterior y Extras',
    salarioRendaPadrao: 'Salario / Ingreso Mensual Estándar',
    sobraAnterior: 'Saldo Inicial (Restos del Mes Anterior)',
    ganhosExtrasSoma: 'Suma de Ingresos Extra del Mes',
    salvarGanhos: 'Guardar Ingresos',
    gerenciarExtras: 'Gestionar Ingresos Extra',
    
    // Notifications & Premium
    avisoExpiracaoTitulo: '¡Su Plan Premium vence pronto! ✨',
    avisoExpiracaoDesc: '¡Hola! Faltan pocos días para el vencimiento de su plan Premium. Si desea seguir disfrutando del control total de sus finanzas sin interrupciones, puede renovar su suscripción fácilmente.',
    renovarMes: 'Renovar Mes Ahora ⚡',
    
    // Export & Tools
    exportarRelatorio: 'Exportar Informe PDF / CSV',
    baixaAutomatica: 'Pago Automático',
    duplicar: 'Duplicar',
    excluir: 'Eliminar',
    editar: 'Editar',
    concluido: 'Pagado / Completado',
    pendente: 'Pendiente',
  },
  en: {
    // Top Bar & Branding
    ganhos: 'Earnings',
    idioma: 'Language',
    selecionarIdioma: 'Select System Language',
    membroVIP: '👑 VIP Member',
    assinantePRO: '⭐ PRO Subscriber',
    contaGratis: '⚡ Free Account',
    sair: 'Sign out',
    
    // Navigation Tabs
    dashboard: 'Dashboard',
    contasFixas: 'Fixed Expenses',
    fixas: 'Fixed',
    gastoVariavel: 'Variable Spending',
    variados: 'Variable',
    parcelados: 'Installments',
    metas: 'Financial Goals',
    configuracoes: 'Settings',
    ajustes: 'Settings',
    
    // Summary Cards
    sobraEstimada: 'Estimated Cash Surplus',
    sobraLivre: 'Free Surplus to Save / Invest',
    rendaCadastrada: 'Registered monthly income',
    definirGanhos: 'Set Earnings',
    totalPendente: 'Total Pending Payment',
    comprometidoMes: 'Committed this month',
    
    // Common Controls
    ambienteSeguro: 'Secure Environment',
    topo: 'Top',
    voltarTopo: 'Back to Top',
    novaTransacao: 'New Transaction',
    adicionarConta: 'Add Entry',
    buscar: 'Search transaction...',
    filtrar: 'Filter',
    faturados: 'Billed / Paid',
    pendentes: 'Pending',
    todos: 'All',
    limparFiltros: 'Clear Filters',
    semLancamentos: 'No entries registered',
    paraOMesSelecionado: 'for the selected month.',
    
    // Modals & Panels
    ganhosCompetencia: 'Monthly Earnings',
    gerenciarGanhos: 'Configure Salary, Prior Balance, and Extra Income',
    salarioRendaPadrao: 'Standard Monthly Salary / Income',
    sobraAnterior: 'Starting Balance (Previous Month Surplus)',
    ganhosExtrasSoma: 'Total Extra Earnings for Month',
    salvarGanhos: 'Save Earnings',
    gerenciarExtras: 'Manage Extra Income',
    
    // Notifications & Premium
    avisoExpiracaoTitulo: 'Your Premium Plan expires soon! ✨',
    avisoExpiracaoDesc: 'Hello! Only a few days remain until your Premium plan renewal date. To keep enjoying total control over your finances without interruption, you can easily renew your subscription.',
    renovarMes: 'Renew Month Now ⚡',
    
    // Export & Tools
    exportarRelatorio: 'Export PDF / CSV Report',
    baixaAutomatica: 'Auto Payoff',
    duplicar: 'Duplicate',
    excluir: 'Delete',
    editar: 'Edit',
    concluido: 'Paid / Completed',
    pendente: 'Pending',
  },
  fr: {
    // Top Bar & Branding
    ganhos: 'Gains',
    idioma: 'Langue',
    selecionarIdioma: 'Sélectionner la Langue du Système',
    membroVIP: '👑 Membre VIP',
    assinantePRO: '⭐ Abonné PRO',
    contaGratis: '⚡ Compte Gratuit',
    sair: 'Se déconnecter',
    
    // Navigation Tabs
    dashboard: 'Tableau de Bord',
    contasFixas: 'Dépenses Fixes',
    fixas: 'Fixes',
    gastoVariavel: 'Dépenses Variables',
    variados: 'Variables',
    parcelados: 'Versements',
    metas: 'Objectifs',
    configuracoes: 'Paramètres',
    ajustes: 'Réglages',
    
    // Summary Cards
    sobraEstimada: 'Excédent de Trésorerie Estimé',
    sobraLivre: 'Solde Libre pour Épargner / Investir',
    rendaCadastrada: 'Revenu mensuel enregistré',
    definirGanhos: 'Définir les Gains',
    totalPendente: 'Total Restant à Payer',
    comprometidoMes: 'Engagé ce mois-ci',
    
    // Common Controls
    ambienteSeguro: 'Environnement Sécurisé',
    topo: 'Haut',
    voltarTopo: 'Retour en Haut',
    novaTransacao: 'Nouvelle Transaction',
    adicionarConta: 'Ajouter une Entrée',
    buscar: 'Rechercher une transaction...',
    filtrar: 'Filtrer',
    faturados: 'Facturés / Payés',
    pendentes: 'En attente',
    todos: 'Tous',
    limparFiltros: 'Effacer les Filtres',
    semLancamentos: 'Aucune entrée enregistrée',
    paraOMesSelecionado: 'pour le mois sélectionné.',
    
    // Modals & Panels
    ganhosCompetencia: 'Gains du Mois',
    gerenciarGanhos: 'Configurer Salaire, Solde Précédent et Extras',
    salarioRendaPadrao: 'Salaire / Revenu Mensuel Standard',
    sobraAnterior: 'Solde Initial (Reste du Mois Précédent)',
    ganhosExtrasSoma: 'Total des Gains Extras du Mois',
    salvarGanhos: 'Enregistrer les Gains',
    gerenciarExtras: 'Gérer les Revenus Extras',
    
    // Notifications & Premium
    avisoExpiracaoTitulo: 'Votre Plan Premium expire bientôt! ✨',
    avisoExpiracaoDesc: 'Bonjour! Il ne reste que quelques jours avant l’échéance de votre abonnement Premium. Pour continuer à bénéficier d’un contrôle total sans interruption, vous pouvez renouveler facilement.',
    renovarMes: 'Renouveler le Mois ⚡',
    
    // Export & Tools
    exportarRelatorio: 'Exporter Rapport PDF / CSV',
    baixaAutomatica: 'Paiement Automatique',
    duplicar: 'Dupliquer',
    excluir: 'Supprimer',
    editar: 'Modifier',
    concluido: 'Payé / Terminé',
    pendente: 'En attente',
  }
};

export function getTranslation(key: string, lang: Language): string {
  const dict = translations[lang] || translations['pt'];
  return dict[key] || translations['pt'][key] || key;
}
