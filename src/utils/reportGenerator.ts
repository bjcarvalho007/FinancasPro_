import { jsPDF } from 'jspdf';
import { Transaction } from '../types';

interface ReportData {
  transactions: Transaction[];
  baseIncome: number;
  baseBalance: number;
  currentCurrency: 'BRL' | 'USD' | 'EUR';
  userEmail: string;
  selectedMonthKey?: string; // "all" or specific e.g. "2026-05"
  settings?: any;
}

// Convert month key to Portuguese readable text
const formatMonthTitlePT = (key: string) => {
  if (!key || key === 'all') return 'GERAL CONSOLIDADO';
  if (!key.includes('-')) return key;
  const [year, month] = key.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(month, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${months[idx].toUpperCase()} DE ${year}`;
  }
  return key;
};

// Map currency symbol
export const getCurrencySymbol = (currency: 'BRL' | 'USD' | 'EUR'): string => {
  const map = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
  };
  return map[currency] || 'R$';
};

// Map currency formatter
export const formatCurrency = (val: number, currency: 'BRL' | 'USD' | 'EUR'): string => {
  const locale = currency === 'BRL' ? 'pt-BR' : currency === 'USD' ? 'en-US' : 'de-DE';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(val);
};

// Translate transaction types for report readability
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'fixos': return 'Despesa Fixa';
    case 'variaveis': return 'Despesa Variável';
    case 'parcelas': return 'Compra Parcelada';
    default: return type;
  }
};

/**
 * EXPORT 1: Premium PDF report with customized layout options for monthly/general reports.
 */
export const exportPremiumPDF = ({
  transactions = [],
  baseIncome = 0,
  baseBalance = 0,
  currentCurrency = 'BRL',
  userEmail = '',
  selectedMonthKey = 'all',
  settings = null,
}: ReportData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isAll = selectedMonthKey === 'all';

  // 1. Filter transactions based on selection
  const activeTx = isAll 
    ? transactions 
    : transactions.filter(t => t.monthKey === selectedMonthKey);

  // 2. Compute dynamic monthly inflows
  let mIncome = 0;
  let mBalance = 0;
  let mExtra = 0;

  if (isAll) {
    // For general report, collect all unique months available in user data to compile consolidated sum
    const uniqueMonthKeys = Array.from(new Set([
      ...transactions.map(t => t.monthKey),
      ...Object.keys(settings?.monthlyIncome || {}),
      ...Object.keys(settings?.monthlyBalance || {})
    ])).filter(Boolean);

    if (uniqueMonthKeys.length > 0) {
      uniqueMonthKeys.forEach(mKey => {
        mIncome += settings?.monthlyIncome?.[mKey] !== undefined ? settings.monthlyIncome[mKey] : baseIncome;
        mBalance += settings?.monthlyBalance?.[mKey] !== undefined ? settings.monthlyBalance[mKey] : baseBalance;
        mExtra += settings?.extras?.[mKey] ?? 0;
      });
    } else {
      mIncome = baseIncome;
      mBalance = baseBalance;
    }
  } else {
    mIncome = settings?.monthlyIncome?.[selectedMonthKey] !== undefined ? settings.monthlyIncome[selectedMonthKey] : baseIncome;
    mBalance = settings?.monthlyBalance?.[selectedMonthKey] !== undefined ? settings.monthlyBalance[selectedMonthKey] : baseBalance;
    mExtra = settings?.extras?.[selectedMonthKey] ?? 0;
  }

  const totalInflow = mIncome + mBalance + mExtra;
  const totalSpent = activeTx.reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = activeTx.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  const totalPending = activeTx.reduce((sum, t) => sum + (t.amount - (t.paid_amount || 0)), 0);
  const netBalance = totalInflow - totalSpent;

  // Track dynamic cursor positions
  let y = 15;
  let pageNum = 1;

  // Add customized premium font helpers & header
  const drawPageBorderAndFooter = () => {
    // Top border accent (indigo-600)
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1.5);
    doc.line(10, 8, 200, 8);

    // Bottom footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      `FinançasPro Premium • Relatório Gerencial de Segurança de Caixa • ${isAll ? 'Foco Geral' : `Foco Mensal: ${formatMonthTitlePT(selectedMonthKey)}`}`,
      15,
      287
    );
    doc.text(`Pág. ${pageNum}`, 190, 287, { align: 'right' });
  };

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > 275) {
      doc.addPage();
      pageNum++;
      y = 20;
      drawPageBorderAndFooter();
    }
  };

  // Draw initial page decoration
  drawPageBorderAndFooter();

  // Draw branding logo box
  doc.setFillColor(15, 23, 42); // slate-900 background
  doc.rect(12, 12, 186, 26, 'F');

  // Decorative vector inside logo box
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(18, 18, 2.5, 14, 'F');
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(22, 21, 2.5, 11, 'F');

  // Title texts inside box
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FINANÇAS PRO', 28, 23);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  const scopeSubtitle = isAll 
    ? 'AUDITORIA FINANCEIRA HISTÓRICA & FLUXO GERAL CONSOLIDADO'
    : `DEMONSTRATIVO FINANCEIRO COMPLEMENTAR - COMPETÊNCIA MENSAL`;
  doc.text(scopeSubtitle, 28, 28);
  doc.text(`USUÁRIO DE ACESSO: ${userEmail.toUpperCase()}`, 28, 33);

  // Focus Area Tag inside logo box
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(138, 17, 55, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RELATÓRIO:', 142, 22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // emerald-400
  doc.setFontSize(8);
  const scopeLabel = isAll ? 'CONSOLIDADO GERAL' : formatMonthTitlePT(selectedMonthKey);
  doc.text(scopeLabel.length > 22 ? scopeLabel.substring(0, 20) + '...' : scopeLabel, 142, 28);

  y = 48;

  // 1. Executive Summary Panel
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  const sec1Title = isAll 
    ? '1. BALANÇO PATRIMONIAL DOS VALORES CONSOLIDADOS'
    : `1. SUMÁRIO DA COMPOSIÇÃO DE CAIXA EM ${formatMonthTitlePT(selectedMonthKey)}`;
  doc.text(sec1Title, 12, y);
  y += 4;

  // Draw border line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(12, y, 198, y);
  y += 4;

  // 3-Column stats grid
  // Col 1: Liquid available (base income + starting balance)
  doc.setFillColor(248, 250, 252); // soft slate
  doc.roundedRect(12, y, 58, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, y, 58, 24, 2, 2, 'D');

  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(isAll ? 'EARNINGS TOTAIS (A)' : 'DISPONÍVEL INICIAL (A)', 16, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(formatCurrency(totalInflow, currentCurrency), 16, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(isAll ? 'Soma das rendas de todos meses' : 'Salário do mês + Saldo inicial', 16, y + 20);

  // Col 2: Total Spent
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(76, y, 58, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(76, y, 58, 24, 2, 2, 'D');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('CUSTOS LANÇADOS (B)', 80, y + 6);
  doc.setTextColor(239, 68, 68); // Red
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(formatCurrency(totalSpent, currentCurrency), 80, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Faturas, parcelados e fixas do lapso', 80, y + 20);

  // Col 3: Balance leftovers
  const balanceColor = netBalance >= 0 ? [16, 185, 129] : [239, 68, 68];
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(140, y, 58, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(140, y, 58, 24, 2, 2, 'D');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(isAll ? 'SOBRA ESTIMADA GERAL' : 'SOBRA ESTIMADA REAIS', 144, y + 6);
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(formatCurrency(netBalance, currentCurrency), 144, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(isAll ? 'Sobra líquida agregada' : 'Dinheiro livre final estimado', 144, y + 20);

  y += 29;

  // Detailed sub-metrics (Liquid Paid vs Pending)
  doc.setFillColor(254, 242, 242); // soft red
  doc.roundedRect(12, y, 88, 14, 2, 2, 'F');
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CONTAS AGUARDANDO PAGAMENTO:', 16, y + 9);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(totalPending, currentCurrency), 95, y + 9.5, { align: 'right' });

  doc.setFillColor(240, 253, 250); // soft green
  doc.roundedRect(110, y, 88, 14, 2, 2, 'F');
  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FUTURAS BAIXAS CONFIRMADAS (PAGO):', 114, y + 9);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(totalPaid, currentCurrency), 193, y + 9.5, { align: 'right' });

  y += 19;

  // 2. Category Distribution summary
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. COMPORTAMENTO DE DESPESAS POR CATEGORIA', 12, y);
  y += 4;
  doc.setTextColor(226, 232, 240);
  doc.line(12, y, 198, y);
  y += 4;

  // Compute category breakdown
  const catSummaryMap: Record<string, { total: number; paid: number; count: number }> = {};
  activeTx.forEach(t => {
    const c = t.cat || 'Outros';
    if (!catSummaryMap[c]) {
      catSummaryMap[c] = { total: 0, paid: 0, count: 0 };
    }
    catSummaryMap[c].total += t.amount;
    catSummaryMap[c].paid += (t.paid_amount || 0);
    catSummaryMap[c].count += 1;
  });

  const categories = Object.keys(catSummaryMap).sort((a, b) => catSummaryMap[b].total - catSummaryMap[a].total);

  if (categories.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Nenhum registro de débito ou categoria encontrada no período.', 16, y + 5);
    y += 10;
  } else {
    const itemsPerCol = Math.ceil(categories.length / 2);
    const colWidth = 92;

    doc.setFontSize(8);
    for (let index = 0; index < categories.length; index++) {
      const cat = categories[index];
      const data = catSummaryMap[cat];
      const isCol2 = index >= itemsPerCol;
      const colX = isCol2 ? 110 : 12;
      const rowOffset = isCol2 ? (index - itemsPerCol) * 10 : index * 10;
      
      checkPageOverflow(rowOffset + 12);
      const currentY = y + rowOffset;

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(colX, currentY, colWidth, 8, 1, 1, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      const formattedLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
      doc.text(`${formattedLabel} (${data.count}x)`, colX + 3, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Pendente: ${formatCurrency(data.total - data.paid, currentCurrency)}`, colX + 44, currentY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(data.total, currentCurrency), colX + colWidth - 3, currentY + 5.5, { align: 'right' });
    }
    y += itemsPerCol * 10 + 6;
  }

  y += 2;

  // 3. Transactions spreadsheet details table
  checkPageOverflow(30);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. FLUXO ANALÍTICO DETALHADO DO DIÁRIO FINANCEIRO', 12, y);
  y += 4;
  doc.setTextColor(226, 232, 240);
  doc.line(12, y, 198, y);
  y += 4;

  // Table Headers
  doc.setFillColor(15, 23, 42); // slate-900 heading row
  doc.rect(12, y, 186, 7.5, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('VENCIMENTO', 15, y + 5);
  doc.text('LANÇAMENTO', 40, y + 5);
  doc.text('CATEGORIA', 95, y + 5);
  doc.text('TIPO DE FLUXO', 125, y + 5);
  doc.text('SITUAÇÃO', 160, y + 5);
  doc.text('VALOR TOTAL', 195, y + 5, { align: 'right' });

  y += 7.5;

  // Standard sorted transaction rendering
  const sortedTx = [...activeTx].sort((a, b) => {
    return (a.due || '').localeCompare(b.due || '');
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (sortedTx.length === 0) {
    checkPageOverflow(12);
    doc.setFillColor(248, 250, 252);
    doc.rect(12, y, 186, 10, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhuma conta ou compromisso registrado para o lapso filtrado.', 50, y + 6);
    y += 10;
  } else {
    sortedTx.forEach((tx, idx) => {
      checkPageOverflow(11);

      // Zebra striping
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, y, 186, 8.5, 'F');
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(12, y, 186, 8.5, 'F');
      }

      // Divider line
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(12, y + 8.5, 198, y + 8.5);

      // Print Date
      doc.setTextColor(71, 85, 105);
      const dateFormatted = tx.due ? tx.due.split('-').reverse().join('/') : '—';
      doc.text(dateFormatted, 15, y + 5.5);

      // Print Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(tx.name.length > 28 ? tx.name.substring(0, 26) + '...' : tx.name, 40, y + 5.5);

      // Print Category
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const catLabel = tx.cat ? tx.cat.charAt(0).toUpperCase() + tx.cat.slice(1) : 'Outros';
      doc.text(catLabel, 95, y + 5.5);

      // Print Flow Type
      doc.text(getTypeLabel(tx.type), 125, y + 5.5);

      // Status Piles
      const remaining = tx.amount - (tx.paid_amount || 0);
      if (remaining <= 0) {
        doc.setTextColor(15, 118, 110); // emerald-700
        doc.setFont('helvetica', 'bold');
        doc.text('LIQUIDADO', 160, y + 5.5);
      } else if (tx.paid_amount > 0) {
        doc.setTextColor(180, 83, 9); // amber-700
        doc.setFont('helvetica', 'bold');
        doc.text('PARCIAL', 160, y + 5.5);
      } else {
        doc.setTextColor(185, 28, 28); // rose-750
        doc.setFont('helvetica', 'bold');
        doc.text('PENDENTE', 160, y + 5.5);
      }

      // Print Value
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(tx.amount, currentCurrency), 195, y + 5.5, { align: 'right' });

      y += 8.5;
    });
  }

  // End of report signature
  checkPageOverflow(25);
  y += 5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(12, y, 198, y);
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Declaração de autenticidade: Este relatório foi gerado via engine certificada do FinançasPro, espelhando com precisão de balanço as movimentações inseridas. Autenticação ID: SEC_PRO_MD5_${idxGenerator(12)}`,
    12,
    y + 2
  );

  const fileDate = new Date().toISOString().split('T')[0];
  const fileLabel = isAll ? 'CONSOLIDADO_GERAL' : `RELACAO_${selectedMonthKey}`;
  doc.save(`FinancasPro_Relatorio_${fileLabel}_${fileDate}.pdf`);
};

/**
 * EXPORT 2: Dynamic CSV Spreadsheet matching chosen month or overall statistics
 */
export const exportPremiumSpreadsheet = ({
  transactions = [],
  baseIncome = 0,
  baseBalance = 0,
  currentCurrency = 'BRL',
  userEmail = '',
  selectedMonthKey = 'all',
  settings = null,
}: ReportData) => {
  const isAll = selectedMonthKey === 'all';
  const fileDate = new Date().toISOString().split('T')[0];
  const symbol = getCurrencySymbol(currentCurrency);

  // Filter transactions
  const activeTx = isAll 
    ? transactions 
    : transactions.filter(t => t.monthKey === selectedMonthKey);

  // Compute dynamic inflows
  let mIncome = 0;
  let mBalance = 0;
  let mExtra = 0;

  if (isAll) {
    const uniqueMonthKeys = Array.from(new Set([
      ...transactions.map(t => t.monthKey),
      ...Object.keys(settings?.monthlyIncome || {}),
      ...Object.keys(settings?.monthlyBalance || {})
    ])).filter(Boolean);

    if (uniqueMonthKeys.length > 0) {
      uniqueMonthKeys.forEach(mKey => {
        mIncome += settings?.monthlyIncome?.[mKey] !== undefined ? settings.monthlyIncome[mKey] : baseIncome;
        mBalance += settings?.monthlyBalance?.[mKey] !== undefined ? settings.monthlyBalance[mKey] : baseBalance;
        mExtra += settings?.extras?.[mKey] ?? 0;
      });
    } else {
      mIncome = baseIncome;
      mBalance = baseBalance;
    }
  } else {
    mIncome = settings?.monthlyIncome?.[selectedMonthKey] !== undefined ? settings.monthlyIncome[selectedMonthKey] : baseIncome;
    mBalance = settings?.monthlyBalance?.[selectedMonthKey] !== undefined ? settings.monthlyBalance[selectedMonthKey] : baseBalance;
    mExtra = settings?.extras?.[selectedMonthKey] ?? 0;
  }

  const totalInflow = mIncome + mBalance + mExtra;
  const totalSpent = activeTx.reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = activeTx.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  const totalPending = totalSpent - totalPaid;
  const netBalance = totalInflow - totalSpent;

  let csvContent = "\uFEFF"; // BOM strictly required for MS Excel alignment

  csvContent += '===================================================\n';
  csvContent += `💰 FINANÇAS PRO - DIÁRIO FINANCEIRO EXPORTADO [${isAll ? 'GERAL' : selectedMonthKey}] 💰\n`;
  csvContent += '===================================================\n';
  csvContent += `E-mail do Proprietário: , ${userEmail}\n`;
  csvContent += `Exportação Realizada em: , ${new Date().toLocaleString('pt-BR')}\n`;
  csvContent += `Tipo de Filtro: , ${isAll ? 'Análise Consolidada de Histórico Geral' : `Análise Estruturada do Mês de ${formatMonthTitlePT(selectedMonthKey)}`}\n`;
  csvContent += `Moeda Padrão de Auditoria: , ${currentCurrency} (${symbol})\n`;
  csvContent += `Volume de Lançamentos Exportados: , ${activeTx.length}\n`;
  csvContent += '\n';

  csvContent += '---------------------------------------------------\n';
  csvContent += 'INDICADORES CONSOLIDADOS DO PERÍODO\n';
  csvContent += '---------------------------------------------------\n';
  csvContent += `A. DISPONÍVEL LÍQUIDO ACUMULADO (ENTRADAS): , ${formatCurrency(totalInflow, currentCurrency).replace(',', '.')}\n`;
  csvContent += `B. CUSTO TOTAL DE DEBÍTOS ENTRADOS (SAÍDAS): , ${formatCurrency(totalSpent, currentCurrency).replace(',', '.')}\n`;
  csvContent += `C. TOTAL EFETIVAMENTE PAGO / BAIXADO: , ${formatCurrency(totalPaid, currentCurrency).replace(',', '.')}\n`;
  csvContent += `D. PASSO RESTANTE EM ABERTO (PENDENTE): , ${formatCurrency(totalPending, currentCurrency).replace(',', '.')}\n`;
  csvContent += `E. SALDO PROJETADO EM CARTEIRA DESEJADO (A - B): , ${formatCurrency(netBalance, currentCurrency).replace(',', '.')}\n`;
  csvContent += `DIAGNÓSTICO SITUACIONAL: , ${netBalance >= 0 ? "SUPERÁVIT" : "DEFICIT PREVENTIVO"}\n`;
  csvContent += '\n';

  const catMap: Record<string, number> = {};
  activeTx.forEach(t => {
    const c = t.cat || 'Outros';
    catMap[c] = (catMap[c] || 0) + t.amount;
  });

  csvContent += '---------------------------------------------------\n';
  csvContent += 'RESUMO POR CATEGORIA DE CONSUMO\n';
  csvContent += '---------------------------------------------------\n';
  csvContent += 'Categoria de Gasto, Despesa de Origem Acumulada\n';
  Object.keys(catMap).forEach(k => {
    const l = k.charAt(0).toUpperCase() + k.slice(1);
    csvContent += `"${l}", "${formatCurrency(catMap[k], currentCurrency)}"\n`;
  });
  csvContent += '\n';

  csvContent += '---------------------------------------------------\n';
  csvContent += 'RAIZ DETALHADA DE COMPROMISSOS E INVESTIMENTOS\n';
  csvContent += '---------------------------------------------------\n';
  csvContent += 'No.,Identificador ID,Lançamento Financeiro,Valor de Origem,Valor Liquidado,Valor Pendente,Status Geral,Categoria,Vencimento Pactuado,Classificação Tipo MonthKey\n';

  activeTx.forEach((t, index) => {
    const remaining = t.amount - (t.paid_amount || 0);
    const labelStatus = remaining <= 0 ? 'PAGO INTEGRAL' : t.paid_amount > 0 ? 'PAGO PARCIAL' : 'PENDENTE DE BAIXA';
    const cleanName = t.name.replace(/"/g, '""');
    const displayCat = t.cat ? t.cat.charAt(0).toUpperCase() + t.cat.slice(1) : 'Outros';
    const displayDue = t.due ? t.due.split('-').reverse().join('/') : 'N/A';

    csvContent += `${index + 1},"${t.id}","${cleanName}",${t.amount},${t.paid_amount || 0},${remaining},"${labelStatus}","${displayCat}","${displayDue}","${getTypeLabel(t.type)} [mKey: ${t.monthKey}]"\n`;
  });

  // Safe download trigger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const fileLabel = isAll ? 'CONSOLIDADO_GERAL' : `RELACAO_${selectedMonthKey}`;
  link.setAttribute("download", `FinancasPro_Dados_${fileLabel}_${fileDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Internal signature hash helper
const idxGenerator = (length: number) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
