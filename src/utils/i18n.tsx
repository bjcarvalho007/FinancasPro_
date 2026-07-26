import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    
    // Dashboard & Analytics
    resumoDashboard: 'Resumo Financeiro & Saúde de Caixa',
    visaoAtiva: 'Mês Selecionado',
    historicoGeral: 'Histórico Consolidado',
    rendaDisponivel: 'Renda Total Disponivel',
    entradasMes: 'Entradas do Mês',
    saudeFinanceira: 'Saúde Financeira',
    alertasInteligentes: 'Alertas Inteligentes',
    excelente: 'Excelente',
    atencao: 'Atenção Necessária',
    critico: 'Crítico - Orçamento Excedido',
    distribuicaoGastos: 'Distribuição de Gastos por Categoria',
    evolucaoMensal: 'Evolução de Gastos & Receitas',
    ultimosLancamentos: 'Últimos Lançamentos Registrados',
    semGastosCategoria: 'Nenhum gasto registrado nesta categoria.',
    
    // Settings Panel
    configuracoesConta: 'Configurações da Conta & Preferências',
    perfilUsuario: 'Perfil do Usuário',
    aparenciaTema: 'Aparência & Tema Visual',
    modoEscuro: 'Modo Escuro (Dark)',
    modoClaro: 'Modo Claro (Light)',
    moedaSistema: 'Moeda do Sistema',
    alertasNotificacoes: 'Alertas & Notificações de Vencimento',
    antecedenciaDias: 'Dias de antecedência para avisos',
    ativarEmail: 'Notificações por E-mail',
    ativarWhatsapp: 'Notificações por WhatsApp',
    exportarRelatorios: 'Exportar Dados & Relatórios',
    gerarPdf: 'Baixar Relatório PDF Completo',
    exportarCsv: 'Exportar Planilha Excel (CSV)',
    selecionarMesRelatorio: 'Selecione o mês para o relatório',
    todosOsMeses: 'Todos os Meses (Histórico Geral)',
    excluirConta: 'Excluir Conta Permanentemente',
    salvarPreferencias: 'Salvar Alterações',
    
    // Goals Panel
    minhasMetas: 'Minhas Metas Financeiras',
    novaMeta: 'Nova Meta de Economia',
    nomeMeta: 'Nome da Meta',
    valorAlvo: 'Valor Objetivo',
    valorGuardado: 'Valor Guardado',
    progresso: 'Progresso',
    prazoFinal: 'Prazo Limite',
    adicionarEconomia: 'Aportar / Economizar',
    metaConcluida: 'Meta Alcançada! 🎉',
    semMetas: 'Você ainda não cadastrou nenhuma meta financeira.',
    
    // Transaction Modal & Cards
    novaTransacao: 'Nova Transação',
    editarTransacao: 'Editar Transação',
    descricao: 'Descrição / Nome',
    valor: 'Valor',
    vencimento: 'Data de Vencimento',
    categoria: 'Categoria',
    tipoConta: 'Tipo de Lançamento',
    contaFixa: 'Conta Fixa',
    gastoVariavelTipo: 'Gasto Variável',
    parceladoTipo: 'Parcelado',
    numParcelas: 'Número de Parcelas',
    observacao: 'Observação / Nota',
    salvar: 'Salvar',
    cancelar: 'Cancelar',
    
    // Extra Earnings Manager
    ganhosExtrasTitulo: 'Ganhos Extras do Mês',
    novoGanhoExtra: 'Adicionar Ganho Extra',
    fonteOrigem: 'Origem / Fonte do Dinheiro',
    semExtras: 'Nenhum ganho extra adicionado neste mês.',
    
    // Common Controls
    ambienteSeguro: 'Ambiente Seguro',
    topo: 'Topo',
    voltarTopo: 'Voltar ao Topo',
    adicionarConta: 'Adicionar Lançamento',
    buscar: 'Buscar transação...',
    filtrar: 'Filtrar',
    faturados: 'Faturados / Pagos',
    pendentes: 'Pendentes',
    todos: 'Todos',
    limparFiltros: 'Limpar Filtros',
    semLancamentos: 'Sem lançamentos registrados',
    paraOMesSelecionado: 'para o mês selecionado.',
    
    // Categories
    catAlimentacao: 'Alimentação',
    catMoradia: 'Moradia',
    catTransporte: 'Transporte',
    catLazer: 'Lazer',
    catSaude: 'Saúde',
    catEducacao: 'Educação',
    catOutros: 'Outros',

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

    // Landing / Auth Screen (Fora do App)
    gestaoCaixaSeguro: 'Gestão de Caixa Seguro',
    irDiretoAcesso: 'Ir direto para Acesso',
    oQueEComoAdquirir: '💡 O Que é / Como Adquirir?',
    plataformaProfissional: '⚡ Plataforma Profissional',
    domineSuasFinancas: 'Domine Suas Finanças com Inteligência Real',
    pitchDescricao: 'Diga adeus às planilhas complexas e anotações perdidas. O FinançasPro é um ecossistema projetado para quem busca precisão cirúrgica e clareza no fluxo de caixa.',
    analyticsCompleto: 'Analytics Completo',
    analyticsDesc: 'Visão global e por categoria automatizada e rica em detalhes.',
    gestaoParcelas: 'Gestão de Parcelas',
    parcelasDesc: 'Abatimento progressivo do saldo devedor sem juros ocultos selvagens.',
    metasInteligentes: 'Metas Inteligentes',
    metasDesc: 'Defina objetivos e acompanhe suas conquistas mês a mês.',
    segurancaMaxima: 'Segurança Máxima',
    segurancaDesc: 'Dados criptografados na nuvem do Firebase para total privacidade.',
    ofertaPremium: 'Oferta Premium',
    ofertaDesc: 'Tenha acesso completo para gerenciar suas despesas fixas, variáveis e parcelas sem estresse ou complicações.',
    queroAssinar: 'Quero Assinar',
    acessoCorporativoCompleto: 'Acesso Corporativo Completo',
    pagamentoProtegido: 'Pagamento 100% Protegido',
    acesseSuaConta: 'Acesse sua Conta',
    recuperarSenha: 'Recuperar Senha',
    digiteDadosSeguranca: 'Digite seus dados de segurança corporativos abaixo.',
    insiraEmailRecuperacao: 'Insira seu email de assinante para receber o link de recuperação.',
    emailCredenciado: 'E-mail Credenciado',
    senhaProvisoria: 'Senha Provisória ou Pessoal',
    esqueceuSenha: 'Esqueceu?',
    acessarMeuPainel: 'Acessar Meu Painel',
    enviarLink: 'Enviar Link',
    processando: 'Processando...',
    aindaNaoPossuiAssinatura: 'Ainda não possui uma assinatura ativa?',
    criarContaTeste: 'Criar Conta (Teste de 5 Dias)',
    voltarAcessoDireto: '← Voltar para Acesso Direto',
    testeGratisAtivado: '⚡ Teste Grátis de 5 Dias Ativado',
    compraConfirmada: '✨ Compra Confirmada - Acesso Premium',
    crieContaTeste: 'Crie sua Conta de Teste',
    crieContaPremium: 'Crie sua Conta Premium',
    definaCredenciaisTeste: 'Defina abaixo suas credenciais para iniciar seu teste gratuito de 5 dias hoje mesmo.',
    definaCredenciaisPremium: 'Defina abaixo sua senha privada para começar a organizar suas finanças de forma premium hoje mesmo.',
    seuEmail: 'Seu E-mail',
    seuEmailPremium: 'Seu E-mail Premium',
    escolhaSuaSenha: 'Escolha Sua Senha',
    criarContaIniciarTeste: 'Criar Conta & Iniciar Teste',
    criarMinhaContaAcessar: 'Criar Minha Conta & Acessar',
    criandoConta: 'Criando Conta...',
    voltarLogin: '← Voltar para login',
    notaAcessoSeguro: '🔒 Você usará este e-mail e senha para acessar o painel corporativo a qualquer momento.',
    vagasLimitadas: 'Vagas Limitadas',
    ofertaLancamentoLimitada: 'Oferta de Lançamento Limitada',
    lotePromocionalEstreia: 'Lote Promocional de Estreia',
    textoLotePromocional: 'Apenas 8 assinaturas promocionais disponíveis! Restam apenas 5 vagas promocionais com valor especial de R$ 11,99 mensal. Após o preenchimento destas vagas, novas assinaturas serão realizadas pelo valor regular do plano.',
    voceGaranteValor: 'Você garante o valor de:',
    porMes: '/ mês',
    voltar: 'Voltar',
    irParaPagamento: 'Ir para o Pagamento',
    identificarGmail: 'Identificar Seu Gmail',
    identificarGmailDesc: 'Para ser atendido com prioridade máxima, informe o seu e-mail do Gmail cadastrado ou desejado.',
    seuEmailGmail: 'Seu e-mail (@gmail.com)',
    prosseguirZap: 'Prosseguir para o Zap',
    realizarPagamento: 'Realizar Pagamento',
    acessoCadastroBloqueado: 'Acesso de Cadastro Bloqueado',
    acessoNegadoPagamento: 'Acesso negado. Por favor, realize o pagamento para liberar o seu cadastro.',
    erroCadastro: 'Erro de cadastro',
    erroLogin: 'Erro no login',
    minimoCaracteres: 'Mínimo de 6 caracteres',
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
    
    // Dashboard & Analytics
    resumoDashboard: 'Resumen Financiero y Salud de Caja',
    visaoAtiva: 'Mes Seleccionado',
    historicoGeral: 'Histórico Consolidado',
    rendaDisponivel: 'Ingreso Total Disponible',
    entradasMes: 'Ingresos del Mes',
    saudeFinanceira: 'Salud Financiera',
    alertasInteligentes: 'Alertas Inteligentes',
    excelente: 'Excelente',
    atencao: 'Atención Necesaria',
    critico: 'Crítico - Presupuesto Excedido',
    distribuicaoGastos: 'Distribución de Gastos por Categoría',
    evolucaoMensal: 'Evolución de Gastos e Ingresos',
    ultimosLancamentos: 'Últimos Registros Guardados',
    semGastosCategoria: 'Sin gastos registrados en esta categoría.',
    
    // Settings Panel
    configuracoesConta: 'Configuración de la Cuenta y Preferencias',
    perfilUsuario: 'Perfil de Usuario',
    aparenciaTema: 'Apariencia y Tema Visual',
    modoEscuro: 'Modo Oscuro (Dark)',
    modoClaro: 'Modo Claro (Light)',
    moedaSistema: 'Moneda del Sistema',
    alertasNotificacoes: 'Alertas y Notificaciones de Vencimiento',
    antecedenciaDias: 'Días de antelación para avisos',
    ativarEmail: 'Notificaciones por Correo',
    ativarWhatsapp: 'Notificaciones por WhatsApp',
    exportarRelatorios: 'Exportar Datos e Informes',
    gerarPdf: 'Descargar Informe PDF Completo',
    exportarCsv: 'Exportar Hoja Excel (CSV)',
    selecionarMesRelatorio: 'Seleccione el mes para el informe',
    todosOsMeses: 'Todos los Meses (Histórico General)',
    excluirConta: 'Eliminar Cuenta Permanentemente',
    salvarPreferencias: 'Guardar Cambios',
    
    // Goals Panel
    minhasMetas: 'Mis Metas Financieras',
    novaMeta: 'Nueva Meta de Ahorro',
    nomeMeta: 'Nombre de la Meta',
    valorAlvo: 'Monto Objetivo',
    valorGuardado: 'Monto Ahorrado',
    progresso: 'Progreso',
    prazoFinal: 'Fecha Límite',
    adicionarEconomia: 'Aportar / Ahorrar',
    metaConcluida: '¡Meta Alcanzada! 🎉',
    semMetas: 'Aún no ha registrado ninguna meta financiera.',
    
    // Transaction Modal & Cards
    novaTransacao: 'Nueva Transacción',
    editarTransacao: 'Editar Registro',
    descricao: 'Descripción / Nombre',
    valor: 'Monto',
    vencimento: 'Fecha de Vencimiento',
    categoria: 'Categoría',
    tipoConta: 'Tipo de Registro',
    contaFixa: 'Gasto Fijo',
    gastoVariavelTipo: 'Gasto Variable',
    parceladoTipo: 'Cuota / Plazo',
    numParcelas: 'Número de Cuotas',
    observacao: 'Observación / Nota',
    salvar: 'Guardar',
    cancelar: 'Cancelar',
    
    // Extra Earnings Manager
    ganhosExtrasTitulo: 'Ingresos Extra del Mes',
    novoGanhoExtra: 'Agregar Ingreso Extra',
    fonteOrigem: 'Origen / Fuente del Dinero',
    semExtras: 'Sin ingresos extra agregados este mes.',
    
    // Common Controls
    ambienteSeguro: 'Entorno Seguro',
    topo: 'Inicio',
    voltarTopo: 'Volver al Inicio',
    adicionarConta: 'Agregar Registro',
    buscar: 'Buscar transacción...',
    filtrar: 'Filtrar',
    faturados: 'Facturados / Pagados',
    pendentes: 'Pendientes',
    todos: 'Todos',
    limparFiltros: 'Limpiar Filtros',
    semLancamentos: 'Sin registros encontrados',
    paraOMesSelecionado: 'para el mes seleccionado.',
    
    // Categories
    catAlimentacao: 'Alimentación',
    catMoradia: 'Vivienda',
    catTransporte: 'Transporte',
    catLazer: 'Ocio / Entretenimiento',
    catSaude: 'Salud',
    catEducacao: 'Educación',
    catOutros: 'Otros',

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

    // Landing / Auth Screen
    gestaoCaixaSeguro: 'Gestión de Caja Segura',
    irDiretoAcesso: 'Ir directo al Acceso',
    oQueEComoAdquirir: '💡 ¿Qué es / Cómo adquirir?',
    plataformaProfissional: '⚡ Plataforma Profesional',
    domineSuasFinancas: 'Domine Sus Finanzas con Inteligencia Real',
    pitchDescricao: 'Diga adiós a las hojas de cálculo complejas y notas perdidas. FinançasPro es un ecosistema diseñado para quienes buscan precisión y claridad en el flujo de caja.',
    analyticsCompleto: 'Analítica Completa',
    analyticsDesc: 'Visión global y por categoría automatizada y detallada.',
    gestaoParcelas: 'Gestión de Cuotas',
    parcelasDesc: 'Deducción progresiva del saldo deudor sin intereses ocultos.',
    metasInteligentes: 'Metas Inteligentes',
    metasDesc: 'Defina objetivos y siga sus logros mes a mes.',
    segurancaMaxima: 'Máxima Seguridad',
    segurancaDesc: 'Datos encriptados en la nube de Firebase para total privacidad.',
    ofertaPremium: 'Oferta Premium',
    ofertaDesc: 'Obtenga acceso completo para gestionar sus gastos fijos, variables y cuotas sin estrés ni complicaciones.',
    queroAssinar: 'Quiero Suscribirme',
    acessoCorporativoCompleto: 'Acceso Corporativo Completo',
    pagamentoProtegido: 'Pago 100% Protegido',
    acesseSuaConta: 'Inicie Sesión',
    recuperarSenha: 'Recuperar Contraseña',
    digiteDadosSeguranca: 'Ingrese sus credenciales de seguridad a continuación.',
    insiraEmailRecuperacao: 'Ingrese su e-mail de suscriptor para recibir el enlace de recuperación.',
    emailCredenciado: 'Correo Electrónico',
    senhaProvisoria: 'Contraseña',
    esqueceuSenha: '¿Olvidó?',
    acessarMeuPainel: 'Acceder a mi Panel',
    enviarLink: 'Enviar Enlace',
    processando: 'Procesando...',
    aindaNaoPossuiAssinatura: '¿Aún no tiene una suscripción activa?',
    criarContaTeste: 'Crear Cuenta (Prueba de 5 Días)',
    voltarAcessoDireto: '← Volver al Acceso Directo',
    testeGratisAtivado: '⚡ Prueba Gratuita de 5 Días Activada',
    compraConfirmada: '✨ Compra Confirmada - Acceso Premium',
    crieContaTeste: 'Cree su Cuenta de Prueba',
    crieContaPremium: 'Cree su Cuenta Premium',
    definaCredenciaisTeste: 'Defina sus credenciales a continuación para iniciar su prueba gratuita de 5 días hoy mismo.',
    definaCredenciaisPremium: 'Defina su contraseña a continuación para comenzar a organizar sus finanzas hoy mismo.',
    seuEmail: 'Su Correo',
    seuEmailPremium: 'Su Correo Premium',
    escolhaSuaSenha: 'Elija su Contraseña',
    criarContaIniciarTeste: 'Crear Cuenta e Iniciar Prueba',
    criarMinhaContaAcessar: 'Crear Mi Cuenta y Acceder',
    criandoConta: 'Creando Cuenta...',
    voltarLogin: '← Volver al inicio de sesión',
    notaAcessoSeguro: '🔒 Usará este correo y contraseña para acceder al panel corporativo en cualquier momento.',
    vagasLimitadas: 'Plazas Limitadas',
    ofertaLancamentoLimitada: 'Oferta de Lanzamiento Limitada',
    lotePromocionalEstreia: 'Lote Promocional de Estreno',
    textoLotePromocional: '¡Solo 8 suscripciones promocionales disponibles! Quedan solo 5 plazas a un precio especial de R$ 11,99 mensual.',
    voceGaranteValor: 'Usted asegura el precio de:',
    porMes: '/ mes',
    voltar: 'Volver',
    irParaPagamento: 'Ir al Pago',
    identificarGmail: 'Identificar su Gmail',
    identificarGmailDesc: 'Para recibir atención prioritaria, indique su correo de Gmail.',
    seuEmailGmail: 'Su correo (@gmail.com)',
    prosseguirZap: 'Continuar a WhatsApp',
    realizarPagamento: 'Realizar Pago',
    acessoCadastroBloqueado: 'Acceso de Registro Bloqueado',
    acessoNegadoPagamento: 'Acceso denegado. Por favor, realice el pago para liberar su registro.',
    erroCadastro: 'Error de registro',
    erroLogin: 'Error de inicio de sesión',
    minimoCaracteres: 'Mínimo 6 caracteres',
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
    
    // Dashboard & Analytics
    resumoDashboard: 'Financial Overview & Cash Health',
    visaoAtiva: 'Selected Month',
    historicoGeral: 'Lifetime History',
    rendaDisponivel: 'Total Income Available',
    entradasMes: 'Monthly Inflow',
    saudeFinanceira: 'Financial Health',
    alertasInteligentes: 'Smart Alerts',
    excelente: 'Excellent',
    atencao: 'Attention Needed',
    critico: 'Critical - Budget Exceeded',
    distribuicaoGastos: 'Spending Distribution by Category',
    evolucaoMensal: 'Monthly Income & Expense Trends',
    ultimosLancamentos: 'Recent Transactions',
    semGastosCategoria: 'No expenses recorded in this category.',
    
    // Settings Panel
    configuracoesConta: 'Account Settings & Preferences',
    perfilUsuario: 'User Profile',
    aparenciaTema: 'Appearance & Theme',
    modoEscuro: 'Dark Mode',
    modoClaro: 'Light Mode',
    moedaSistema: 'System Currency',
    alertasNotificacoes: 'Alerts & Due Date Notifications',
    antecedenciaDias: 'Advance days for reminders',
    ativarEmail: 'Email Notifications',
    ativarWhatsapp: 'WhatsApp Notifications',
    exportarRelatorios: 'Export Data & Reports',
    gerarPdf: 'Download Complete PDF Report',
    exportarCsv: 'Export Excel Spreadsheet (CSV)',
    selecionarMesRelatorio: 'Select month for report',
    todosOsMeses: 'All Months (Lifetime History)',
    excluirConta: 'Delete Account Permanently',
    salvarPreferencias: 'Save Changes',
    
    // Goals Panel
    minhasMetas: 'My Financial Goals',
    novaMeta: 'New Savings Goal',
    nomeMeta: 'Goal Name',
    valorAlvo: 'Target Amount',
    valorGuardado: 'Amount Saved',
    progresso: 'Progress',
    prazoFinal: 'Deadline',
    adicionarEconomia: 'Deposit / Save',
    metaConcluida: 'Goal Reached! 🎉',
    semMetas: 'You have not added any financial goals yet.',
    
    // Transaction Modal & Cards
    novaTransacao: 'New Transaction',
    editarTransacao: 'Edit Entry',
    descricao: 'Description / Name',
    valor: 'Amount',
    vencimento: 'Due Date',
    categoria: 'Category',
    tipoConta: 'Entry Type',
    contaFixa: 'Fixed Expense',
    gastoVariavelTipo: 'Variable Spending',
    parceladoTipo: 'Installment',
    numParcelas: 'Number of Installments',
    observacao: 'Note / Comment',
    salvar: 'Save',
    cancelar: 'Cancel',
    
    // Extra Earnings Manager
    ganhosExtrasTitulo: 'Extra Income for Month',
    novoGanhoExtra: 'Add Extra Income',
    fonteOrigem: 'Income Source',
    semExtras: 'No extra earnings recorded this month.',
    
    // Common Controls
    ambienteSeguro: 'Secure Environment',
    topo: 'Top',
    voltarTopo: 'Back to Top',
    adicionarConta: 'Add Entry',
    buscar: 'Search transaction...',
    filtrar: 'Filter',
    faturados: 'Billed / Paid',
    pendentes: 'Pending',
    todos: 'All',
    limparFiltros: 'Clear Filters',
    semLancamentos: 'No entries registered',
    paraOMesSelecionado: 'for the selected month.',
    
    // Categories
    catAlimentacao: 'Food / Dining',
    catMoradia: 'Housing',
    catTransporte: 'Transport',
    catLazer: 'Leisure / Entertainment',
    catSaude: 'Health',
    catEducacao: 'Education',
    catOutros: 'Others',

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

    // Landing / Auth Screen
    gestaoCaixaSeguro: 'Secure Cash Flow Management',
    irDiretoAcesso: 'Go directly to Login',
    oQueEComoAdquirir: '💡 What is it / How to buy?',
    plataformaProfissional: '⚡ Professional Platform',
    domineSuasFinancas: 'Master Your Finances with Real Intelligence',
    pitchDescricao: 'Say goodbye to complex spreadsheets and lost notes. FinançasPro is an ecosystem designed for surgical precision and cash flow clarity.',
    analyticsCompleto: 'Full Analytics',
    analyticsDesc: 'Automated, rich global and category insights.',
    gestaoParcelas: 'Installment Management',
    parcelasDesc: 'Progressive debt reduction without hidden fees.',
    metasInteligentes: 'Smart Goals',
    metasDesc: 'Set goals and track your achievements month by month.',
    segurancaMaxima: 'Maximum Security',
    segurancaDesc: 'Encrypted data in Firebase cloud for complete privacy.',
    ofertaPremium: 'Premium Offer',
    ofertaDesc: 'Get full access to manage your fixed, variable, and installment expenses stress-free.',
    queroAssinar: 'Subscribe Now',
    acessoCorporativoCompleto: 'Full Corporate Access',
    pagamentoProtegido: '100% Secure Payment',
    acesseSuaConta: 'Log In to Your Account',
    recuperarSenha: 'Recover Password',
    digiteDadosSeguranca: 'Enter your security credentials below.',
    insiraEmailRecuperacao: 'Enter your subscriber email to receive the reset link.',
    emailCredenciado: 'Authorized Email',
    senhaProvisoria: 'Password',
    esqueceuSenha: 'Forgot?',
    acessarMeuPainel: 'Access My Dashboard',
    enviarLink: 'Send Link',
    processando: 'Processing...',
    aindaNaoPossuiAssinatura: 'Don’t have an active subscription yet?',
    criarContaTeste: 'Create Account (5-Day Free Trial)',
    voltarAcessoDireto: '← Back to Direct Access',
    testeGratisAtivado: '⚡ 5-Day Free Trial Activated',
    compraConfirmada: '✨ Purchase Confirmed - Premium Access',
    crieContaTeste: 'Create Your Trial Account',
    crieContaPremium: 'Create Your Premium Account',
    definaCredenciaisTeste: 'Set your credentials below to start your 5-day free trial today.',
    definaCredenciaisPremium: 'Set your password below to start organizing your finances today.',
    seuEmail: 'Your Email',
    seuEmailPremium: 'Your Premium Email',
    escolhaSuaSenha: 'Choose Your Password',
    criarContaIniciarTeste: 'Create Account & Start Trial',
    criarMinhaContaAcessar: 'Create My Account & Log In',
    criandoConta: 'Creating Account...',
    voltarLogin: '← Back to log in',
    notaAcessoSeguro: '🔒 You will use this email and password to access your dashboard at any time.',
    vagasLimitadas: 'Limited Slots',
    ofertaLancamentoLimitada: 'Limited Launch Offer',
    lotePromocionalEstreia: 'Debut Promotional Batch',
    textoLotePromocional: 'Only 8 promotional subscriptions available! Only 5 spots remain at a special price of R$ 11.99/month.',
    voceGaranteValor: 'You lock in the price of:',
    porMes: '/ month',
    voltar: 'Back',
    irParaPagamento: 'Proceed to Payment',
    identificarGmail: 'Identify Your Gmail',
    identificarGmailDesc: 'To receive top priority support, enter your registered Gmail address.',
    seuEmailGmail: 'Your email (@gmail.com)',
    prosseguirZap: 'Proceed to WhatsApp',
    realizarPagamento: 'Make Payment',
    acessoCadastroBloqueado: 'Registration Access Blocked',
    acessoNegadoPagamento: 'Access denied. Please complete payment to unlock your registration.',
    erroCadastro: 'Registration error',
    erroLogin: 'Log in error',
    minimoCaracteres: 'Minimum 6 characters',
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
    
    // Dashboard & Analytics
    resumoDashboard: 'Aperçu Financier et Santé de Trésorerie',
    visaoAtiva: 'Mois Sélectionné',
    historicoGeral: 'Historique Consolidé',
    rendaDisponivel: 'Revenu Total Disponible',
    entradasMes: 'Entrées du Mois',
    saudeFinanceira: 'Santé Financière',
    alertasInteligentes: 'Alertes Intelligentes',
    excelente: 'Excellente',
    atencao: 'Attention Requise',
    critico: 'Critique - Budget Dépassé',
    distribuicaoGastos: 'Répartition des Dépenses par Catégorie',
    evolucaoMensal: 'Évolution des Revenus et Dépenses',
    ultimosLancamentos: 'Dernières Entrées Enregistrées',
    semGastosCategoria: 'Aucune dépense enregistrée dans cette catégorie.',
    
    // Settings Panel
    configuracoesConta: 'Paramètres du Compte et Préférences',
    perfilUsuario: 'Profil Utilisateur',
    aparenciaTema: 'Apparence et Thème Visuel',
    modoEscuro: 'Mode Sombre',
    modoClaro: 'Mode Clair',
    moedaSistema: 'Devise du Système',
    alertasNotificacoes: 'Alertes et Notifications d’Échéance',
    antecedenciaDias: 'Jours de préavis pour rappels',
    ativarEmail: 'Notifications par E-mail',
    ativarWhatsapp: 'Notifications par WhatsApp',
    exportarRelatorios: 'Exporter Données et Rapports',
    gerarPdf: 'Télécharger Rapport PDF Complet',
    exportarCsv: 'Exporter Feuille Excel (CSV)',
    selecionarMesRelatorio: 'Sélectionner le mois pour le rapport',
    todosOsMeses: 'Tous les Mois (Historique Général)',
    excluirConta: 'Supprimer le Compte Définitivement',
    salvarPreferencias: 'Enregistrer les Modifications',
    
    // Goals Panel
    minhasMetas: 'Mes Objectifs Financiers',
    novaMeta: 'Nouvel Objectif d’Épargne',
    nomeMeta: 'Nom de l’Objectif',
    valorAlvo: 'Montant Cible',
    valorGuardado: 'Montant Épargné',
    progresso: 'Progrès',
    prazoFinal: 'Date Limite',
    adicionarEconomia: 'Ajouter à l’Épargne',
    metaConcluida: 'Objectif Atteint! 🎉',
    semMetas: 'Vous n’avez pas encore ajouté d’objectifs financiers.',
    
    // Transaction Modal & Cards
    novaTransacao: 'Nouvelle Transaction',
    editarTransacao: 'Modifier l’Entrée',
    descricao: 'Description / Nom',
    valor: 'Montant',
    vencimento: 'Date d’Échéance',
    categoria: 'Catégorie',
    tipoConta: 'Type d’Entrée',
    contaFixa: 'Dépense Fixe',
    gastoVariavelTipo: 'Dépense Variable',
    parceladoTipo: 'Versement / Échéance',
    numParcelas: 'Nombre d’Échéances',
    observacao: 'Remarque / Note',
    salvar: 'Enregistrer',
    cancelar: 'Annuler',
    
    // Extra Earnings Manager
    ganhosExtrasTitulo: 'Gains Extras du Mois',
    novoGanhoExtra: 'Ajouter un Gain Extra',
    fonteOrigem: 'Source du Revenu',
    semExtras: 'Aucun gain extra enregistré ce mois-ci.',
    
    // Common Controls
    ambienteSeguro: 'Environnement Sécurisé',
    topo: 'Haut',
    voltarTopo: 'Retour en Haut',
    adicionarConta: 'Ajouter une Entrée',
    buscar: 'Rechercher une transaction...',
    filtrar: 'Filtrer',
    faturados: 'Facturés / Payés',
    pendentes: 'En attente',
    todos: 'Tous',
    limparFiltros: 'Effacer les Filtres',
    semLancamentos: 'Aucune entrée enregistrée',
    paraOMesSelecionado: 'pour le mois sélectionné.',
    
    // Categories
    catAlimentacao: 'Alimentation',
    catMoradia: 'Logement',
    catTransporte: 'Transport',
    catLazer: 'Loisirs / Sorties',
    catSaude: 'Santé',
    catEducacao: 'Éducation',
    catOutros: 'Autres',

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
    excluir: 'Delete',
    editar: 'Modifier',
    concluido: 'Payé / Terminé',
    pendente: 'En attente',

    // Landing / Auth Screen
    gestaoCaixaSeguro: 'Gestion de Trésorerie Sécurisée',
    irDiretoAcesso: 'Accéder directement',
    oQueEComoAdquirir: '💡 En savoir plus / S’abonner',
    plataformaProfissional: '⚡ Plateforme Professionnelle',
    domineSuasFinancas: 'Maîtrisez Vos Finances avec une Vraie Intelligence',
    pitchDescricao: 'Dites adieu aux feuilles de calcul complexes. FinançasPro est un écosystème conçu pour une précision chirurgicale et une clarté totale.',
    analyticsCompleto: 'Analytique Complète',
    analyticsDesc: 'Vue globale et par catégorie automatisée et détaillée.',
    gestaoParcelas: 'Gestion des Échéances',
    parcelasDesc: 'Déduction progressive du solde sans frais cachés.',
    metasInteligentes: 'Objectifs Intelligents',
    metasDesc: 'Définissez des objectifs et suivez vos progrès mois par mois.',
    segurancaMaxima: 'Sécurité Maximale',
    segurancaDesc: 'Données chiffrées sur le cloud Firebase pour une confidentialité totale.',
    ofertaPremium: 'Offre Premium',
    ofertaDesc: 'Bénéficiez d’un accès complet pour gérer vos dépenses fixes, variables et échéances sans stress.',
    queroAssinar: 'S’abonner Maintenant',
    acessoCorporativoCompleto: 'Accès Entreprise Complet',
    pagamentoProtegido: 'Paiement 100% Sécurisé',
    acesseSuaConta: 'Connexion à Votre Compte',
    recuperarSenha: 'Récupérer le Mot de Passe',
    digiteDadosSeguranca: 'Saisissez vos identifiants de sécurité ci-dessous.',
    insiraEmailRecuperacao: 'Saisissez votre e-mail d’abonné pour recevoir le lien de réinitialisation.',
    emailCredenciado: 'E-mail Autorisé',
    senhaProvisoria: 'Mot de Passe',
    esqueceuSenha: 'Oublié ?',
    acessarMeuPainel: 'Accéder à Mon Tableau de Bord',
    enviarLink: 'Envoyer le Lien',
    processando: 'Traitement en cours...',
    aindaNaoPossuiAssinatura: 'Vous n’avez pas encore d’abonnement actif ?',
    criarContaTeste: 'Créer un Compte (Essai Gratuit de 5 Jours)',
    voltarAcessoDireto: '← Retour à l’Accès Direct',
    testeGratisAtivado: '⚡ Essai Gratuit de 5 Jours Activé',
    compraConfirmada: '✨ Achat Confirmé - Accès Premium',
    crieContaTeste: 'Créez Votre Compte d’Essai',
    crieContaPremium: 'Créez Votre Compte Premium',
    definaCredenciaisTeste: 'Définissez vos identifiants ci-dessous pour démarrer votre essai gratuit de 5 jours dès aujourd’hui.',
    definaCredenciaisPremium: 'Définissez votre mot de passe ci-dessous pour commencer à organiser vos finances dès aujourd’hui.',
    seuEmail: 'Votre E-mail',
    seuEmailPremium: 'Votre E-mail Premium',
    escolhaSuaSenha: 'Choisissez Votre Mot de Passe',
    criarContaIniciarTeste: 'Créer un Compte & Démarrer L’essai',
    criarMinhaContaAcessar: 'Créer Mon Compte & Accéder',
    criandoConta: 'Création du Compte...',
    voltarLogin: '← Retour à la connexion',
    notaAcessoSeguro: '🔒 Vous utiliserez cet e-mail et ce mot de passe pour accéder à votre tableau de bord.',
    vagasLimitadas: 'Places Limitées',
    ofertaLancamentoLimitada: 'Offre de Lancement Limitée',
    lotePromocionalEstreia: 'Offre Promotionnelle de Lancement',
    textoLotePromocional: 'Seulement 8 abonnements promotionnels disponibles ! Il ne reste que 5 places au prix spécial de 11,99 R$/mois.',
    voceGaranteValor: 'Vous garantissez le prix de :',
    porMes: '/ mois',
    voltar: 'Retour',
    irParaPagamento: 'Procéder au Paiement',
    identificarGmail: 'Identifier Votre Gmail',
    identificarGmailDesc: 'Pour un support prioritaire, saisissez votre adresse Gmail.',
    seuEmailGmail: 'Votre e-mail (@gmail.com)',
    prosseguirZap: 'Continuer vers WhatsApp',
    realizarPagamento: 'Effectuer le Paiement',
    acessoCadastroBloqueado: 'Accès à l’Inscription Bloqué',
    acessoNegadoPagamento: 'Accès refusé. Veuillez effectuer le paiement pour débloquer votre inscription.',
    erroCadastro: 'Erreur d’inscription',
    erroLogin: 'Erreur de connexion',
    minimoCaracteres: 'Minimum 6 caractères',
  }
};

export function getTranslation(key: string, lang: Language): string {
  const dict = translations[lang] || translations['pt'];
  return dict[key] || translations['pt'][key] || key;
}

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  monthsList: string[];
  formatMonthKey: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('financaspro_lang');
    return (saved === 'es' || saved === 'en' || saved === 'pt' || saved === 'fr') ? (saved as Language) : 'pt';
  });

  useEffect(() => {
    localStorage.setItem('financaspro_lang', lang);
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[lang] || translations['pt'];
    if (dict[key]) return dict[key];
    if (translations['pt'][key]) return translations['pt'][key];
    return fallback || key;
  };

  const monthsList = monthsByLang[lang] || monthsByLang['pt'];

  const formatMonthKey = (key: string): string => {
    if (!key || !key.includes('-')) return key;
    const [year, month] = key.split('-');
    const idx = parseInt(month, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${monthsList[idx]} ${year}`;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, monthsList, formatMonthKey }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    const lang = 'pt';
    const monthsList = monthsByLang['pt'];
    return {
      lang: 'pt',
      setLang: () => {},
      t: (key: string, fallback?: string) => translations['pt'][key] || fallback || key,
      monthsList,
      formatMonthKey: (key: string) => {
        if (!key || !key.includes('-')) return key;
        const [year, month] = key.split('-');
        const idx = parseInt(month, 10) - 1;
        return (idx >= 0 && idx < 12) ? `${monthsList[idx]} ${year}` : key;
      }
    };
  }
  return context;
};
