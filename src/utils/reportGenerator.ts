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
  if (!key || key === 'all') return 'CONSOLIDADO GERAL';
  if (!key.includes('-')) return key;
  const [year, month] = key.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(month, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${months[idx].toUpperCase()} / ${year}`;
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
const getTypeLabel = (type: string, instInfo?: string) => {
  if (instInfo) return `Parcela ${instInfo}`;
  switch (type) {
    case 'fixos': return 'Conta Fixa';
    case 'variaveis': return 'Gasto Diário';
    case 'parcelas': return 'Parcelado';
    default: return type;
  }
};

// Truncate text safely using jsPDF measurement
const fitText = (doc: jsPDF, text: string, maxWidth: number): string => {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && doc.getTextWidth(truncated + '...') > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length > 0 ? truncated + '...' : '';
};

/**
 * EXPORT 1: Premium PDF report with executive summary, category breakdown,
 * analytic detailed transaction table, zero overlapping, and perfect two-pass pagination.
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
  const pageMargin = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - (pageMargin * 2); // 182mm

  // 1. Filter transactions based on selection
  const activeTx = isAll 
    ? transactions 
    : transactions.filter(t => t.monthKey === selectedMonthKey);

  // 2. Compute dynamic monthly inflows
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
        mIncome += settings?.monthlyIncome?.[mKey] || settings?.income || 0;
        mBalance += settings?.monthlyBalance?.[mKey] || settings?.balance || 0;
        mExtra += settings?.extras?.[mKey] ?? 0;
      });
    } else {
      mIncome = baseIncome;
      mBalance = baseBalance;
    }
  } else {
    mIncome = settings?.monthlyIncome?.[selectedMonthKey] || settings?.income || baseIncome;
    mBalance = settings?.monthlyBalance?.[selectedMonthKey] || settings?.balance || baseBalance;
    mExtra = settings?.extras?.[selectedMonthKey] ?? 0;
  }

  const totalInflow = mIncome + mBalance + mExtra;
  const totalSpent = activeTx.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPaid = activeTx.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  const totalPending = Math.max(0, totalSpent - totalPaid);
  const netBalance = totalInflow - totalSpent;

  let y = 14;

  // Table Column Configuration (Strict boundaries within 182mm)
  // Left: 14, Right: 196
  const cols = {
    due: { x: 16, width: 21 },          // Data / Vencimento: 16 - 37
    name: { x: 39, width: 57 },         // Descrição: 39 - 96
    cat: { x: 98, width: 27 },          // Categoria: 98 - 125
    type: { x: 127, width: 25 },        // Tipo: 127 - 152
    status: { x: 154, width: 17 },      // Situação: 154 - 171
    amount: { x: 194, width: 23 }       // Valor: right-aligned at 194
  };

  const drawTableHeader = (startY: number) => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(pageMargin, startY, contentWidth, 7.5, 1, 1, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    
    doc.text('DATA / VENC.', cols.due.x, startY + 5);
    doc.text('DESCRIÇÃO DO LANÇAMENTO', cols.name.x, startY + 5);
    doc.text('CATEGORIA', cols.cat.x, startY + 5);
    doc.text('TIPO', cols.type.x, startY + 5);
    doc.text('SITUAÇÃO', cols.status.x, startY + 5);
    doc.text('VALOR', cols.amount.x, startY + 5, { align: 'right' });
    return startY + 7.5;
  };

  const checkPageOverflow = (neededHeight: number): boolean => {
    if (y + neededHeight > 274) {
      doc.addPage();
      y = 18;
      // Re-draw section mini-header when continuing table
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('FINANÇAS PRO • DEMONSTRATIVO DETALHADO (CONTINUAÇÃO)', pageMargin, y);
      y += 4;
      y = drawTableHeader(y);
      return true;
    }
    return false;
  };

  // --- 1. HEADER BRANDING BLOCK ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(pageMargin, y, contentWidth, 25, 2, 2, 'F');

  // Decorative Accent Bars
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(pageMargin + 4, y + 4.5, 2.5, 16, 'F');
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(pageMargin + 7.5, y + 7, 2, 13.5, 'F');

  // Title texts
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('FINANÇAS PRO', pageMargin + 13, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const scopeSubtitle = isAll 
    ? 'DEMONSTRATIVO FINANCEIRO CONSOLIDADO • AUDITORIA GERAL'
    : `DEMONSTRATIVO FINANCEIRO MENSAL • COMPETÊNCIA ${formatMonthTitlePT(selectedMonthKey)}`;
  doc.text(scopeSubtitle, pageMargin + 13, y + 14);

  const displayUser = userEmail ? userEmail.toLowerCase() : 'usuário oficial';
  doc.text(`TITULAR DA CONTA: ${displayUser.length > 35 ? displayUser.substring(0, 32) + '...' : displayUser}`, pageMargin + 13, y + 19.5);

  // Period / Badge Box on Top-Right
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(132, y + 4, 60, 17, 1.5, 1.5, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('PERÍODO SELECIONADO:', 136, y + 9);

  doc.setTextColor(52, 211, 153); // emerald-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const periodText = isAll ? 'CONSOLIDADO GERAL' : formatMonthTitlePT(selectedMonthKey);
  doc.text(fitText(doc, periodText, 52), 136, y + 15.5);

  y += 30;

  // --- 2. EXECUTIVE SUMMARY (3 MAIN CARDS + 2 STATUS STRIPS) ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1. RESUMO EXECUTIVO DO FLUXO DE CAIXA', pageMargin, y);
  y += 3.5;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(pageMargin, y, pageMargin + contentWidth, y);
  y += 3.5;

  const cardGap = 3.5;
  const cardWidth = (contentWidth - (cardGap * 2)) / 3; // ~58.3mm
  const cardHeight = 21;

  // Card 1: Total Inflows
  const c1X = pageMargin;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c1X, y, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c1X, y, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TOTAL DE ENTRADAS', c1X + 4, y + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(formatCurrency(totalInflow, currentCurrency), c1X + 4, y + 12.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(isAll ? 'Soma das rendas de todos os meses' : 'Ganhos declarados + saldo inicial', c1X + 4, y + 17.5);

  // Card 2: Total Expenses
  const c2X = c1X + cardWidth + cardGap;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c2X, y, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c2X, y, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TOTAL DE SAÍDAS', c2X + 4, y + 5.5);

  doc.setTextColor(225, 29, 72); // rose-600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(formatCurrency(totalSpent, currentCurrency), c2X + 4, y + 12.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Fixas + Diárias + Parcelas do mês', c2X + 4, y + 17.5);

  // Card 3: Estimated Net Leftover
  const c3X = c2X + cardWidth + cardGap;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c3X, y, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c3X, y, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SOBRA ESTIMADA (A - B)', c3X + 4, y + 5.5);

  const isPositive = netBalance >= 0;
  doc.setTextColor(isPositive ? 5 : 225, isPositive ? 150 : 29, isPositive ? 105 : 72);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(formatCurrency(netBalance, currentCurrency), c3X + 4, y + 12.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(isPositive ? 'Previsão de caixa superavitária' : 'Atenção: saídas superam entradas', c3X + 4, y + 17.5);

  y += cardHeight + 3.5;

  // Sub-status strips (Pago vs Pendente)
  const stripWidth = (contentWidth - 4) / 2;
  
  // Paid Box
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(pageMargin, y, stripWidth, 10.5, 1.5, 1.5, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(pageMargin, y, stripWidth, 10.5, 1.5, 1.5, 'D');

  doc.setTextColor(4, 120, 87); // emerald-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('TOTAL JÁ QUITADO / PAGO:', pageMargin + 4, y + 6.8);
  doc.setFontSize(9);
  doc.text(formatCurrency(totalPaid, currentCurrency), pageMargin + stripWidth - 4, y + 6.8, { align: 'right' });

  // Pending Box
  const pendingX = pageMargin + stripWidth + 4;
  doc.setFillColor(255, 241, 242); // rose-50
  doc.roundedRect(pendingX, y, stripWidth, 10.5, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(pendingX, y, stripWidth, 10.5, 1.5, 1.5, 'D');

  doc.setTextColor(190, 18, 60); // rose-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('TOTAL A PAGAR PENDENTE:', pendingX + 4, y + 6.8);
  doc.setFontSize(9);
  doc.text(formatCurrency(totalPending, currentCurrency), pendingX + stripWidth - 4, y + 6.8, { align: 'right' });

  y += 15.5;

  // --- 3. CATEGORY DISTRIBUTION ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. DISTRIBUIÇÃO POR CATEGORIA DE GASTOS', pageMargin, y);
  y += 3.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(pageMargin, y, pageMargin + contentWidth, y);
  y += 3.5;

  const catSummaryMap: Record<string, { total: number; paid: number; count: number }> = {};
  activeTx.forEach(t => {
    const c = t.cat ? t.cat.trim() : 'Outros';
    if (!catSummaryMap[c]) {
      catSummaryMap[c] = { total: 0, paid: 0, count: 0 };
    }
    catSummaryMap[c].total += (t.amount || 0);
    catSummaryMap[c].paid += (t.paid_amount || 0);
    catSummaryMap[c].count += 1;
  });

  const categories = Object.keys(catSummaryMap).sort((a, b) => catSummaryMap[b].total - catSummaryMap[a].total);

  if (categories.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Nenhum gasto ou categoria registrada no período selecionado.', pageMargin + 2, y + 4);
    y += 8;
  } else {
    // 2-column clean card grid, evaluated row-by-row so page breaks NEVER desynchronize columns
    const catColWidth = (contentWidth - 4) / 2;
    const catRowHeight = 7.5;
    const numRows = Math.ceil(categories.length / 2);

    for (let r = 0; r < numRows; r++) {
      checkPageOverflow(catRowHeight + 2);

      const idx1 = r * 2;
      const idx2 = r * 2 + 1;

      // Col 1 Item
      if (idx1 < categories.length) {
        const cat1 = categories[idx1];
        const data1 = catSummaryMap[cat1];
        const col1X = pageMargin;

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(col1X, y, catColWidth, catRowHeight, 1, 1, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(col1X, y, catColWidth, catRowHeight, 1, 1, 'D');

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        const catName1 = cat1.charAt(0).toUpperCase() + cat1.slice(1);
        doc.text(fitText(doc, `${catName1} (${data1.count})`, catColWidth - 44), col1X + 3, y + 5);

        const percent1 = totalSpent > 0 ? ((data1.total / totalSpent) * 100).toFixed(0) : '0';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`${percent1}%`, col1X + catColWidth - 34, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 41, 59);
        doc.text(formatCurrency(data1.total, currentCurrency), col1X + catColWidth - 3, y + 5, { align: 'right' });
      }

      // Col 2 Item
      if (idx2 < categories.length) {
        const cat2 = categories[idx2];
        const data2 = catSummaryMap[cat2];
        const col2X = pageMargin + catColWidth + 4;

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(col2X, y, catColWidth, catRowHeight, 1, 1, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(col2X, y, catColWidth, catRowHeight, 1, 1, 'D');

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        const catName2 = cat2.charAt(0).toUpperCase() + cat2.slice(1);
        doc.text(fitText(doc, `${catName2} (${data2.count})`, catColWidth - 44), col2X + 3, y + 5);

        const percent2 = totalSpent > 0 ? ((data2.total / totalSpent) * 100).toFixed(0) : '0';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`${percent2}%`, col2X + catColWidth - 34, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 41, 59);
        doc.text(formatCurrency(data2.total, currentCurrency), col2X + catColWidth - 3, y + 5, { align: 'right' });
      }

      y += catRowHeight + 2;
    }
    y += 2;
  }

  y += 2;

  // --- 4. ANALYTIC DETAILED TRANSACTIONS TABLE ---
  checkPageOverflow(24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('3. DEMONSTRATIVO DETALHADO DOS LANÇAMENTOS', pageMargin, y);
  y += 3.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(pageMargin, y, pageMargin + contentWidth, y);
  y += 3.5;

  y = drawTableHeader(y);

  // Sort transactions chronologically by due date
  const sortedTx = [...activeTx].sort((a, b) => {
    return (a.due || '').localeCompare(b.due || '');
  });

  if (sortedTx.length === 0) {
    checkPageOverflow(10);
    doc.setFillColor(248, 250, 252);
    doc.rect(pageMargin, y, contentWidth, 9, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Nenhum compromisso financeiro cadastrado no período.', pageMargin + 6, y + 6);
    y += 9;
  } else {
    sortedTx.forEach((tx, idx) => {
      checkPageOverflow(8);

      // Alternating background
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(pageMargin, y, contentWidth, 7.2, 'F');
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(pageMargin, y, contentWidth, 7.2, 'F');
      }

      // Fine row bottom divider
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(pageMargin, y + 7.2, pageMargin + contentWidth, y + 7.2);

      // Col 1: Vencimento / Data
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      const dateFormatted = tx.due ? tx.due.split('-').reverse().join('/') : '—';
      doc.text(dateFormatted, cols.due.x, y + 4.8);

      // Col 2: Descrição / Lançamento (Strict truncation to never touch category column)
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      const safeName = fitText(doc, tx.name || 'Sem descrição', cols.name.width - 2);
      doc.text(safeName, cols.name.x, y + 4.8);

      // Col 3: Categoria
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      const catLabel = tx.cat ? tx.cat.charAt(0).toUpperCase() + tx.cat.slice(1) : 'Outros';
      const safeCat = fitText(doc, catLabel, cols.cat.width - 2);
      doc.text(safeCat, cols.cat.x, y + 4.8);

      // Col 4: Tipo de Despesa
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      const typeDesc = getTypeLabel(tx.type, (tx as any).installmentInfo);
      const safeType = fitText(doc, typeDesc, cols.type.width - 2);
      doc.text(safeType, cols.type.x, y + 4.8);

      // Col 5: Status / Situação (Pill badge styled)
      const remaining = (tx.amount || 0) - (tx.paid_amount || 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      if (remaining <= 0) {
        doc.setTextColor(4, 120, 87); // emerald-700
        doc.text('PAGO', cols.status.x, y + 4.8);
      } else if ((tx.paid_amount || 0) > 0) {
        doc.setTextColor(180, 83, 9); // amber-700
        doc.text('PARCIAL', cols.status.x, y + 4.8);
      } else {
        doc.setTextColor(190, 18, 60); // rose-700
        doc.text('PENDENTE', cols.status.x, y + 4.8);
      }

      // Col 6: Valor (Strictly right-aligned with safety padding)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(tx.amount || 0, currentCurrency), cols.amount.x, y + 4.8, { align: 'right' });

      y += 7.2;
    });

    // Totals Row at table bottom
    checkPageOverflow(9.5);
    doc.setFillColor(241, 245, 249);
    doc.rect(pageMargin, y, contentWidth, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(pageMargin, y, contentWidth, 8, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`TOTALIZADOR DO PERÍODO (${sortedTx.length} ITENS)`, cols.due.x, y + 5.2);

    doc.setTextColor(190, 18, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(`Pendente: ${formatCurrency(totalPending, currentCurrency)}`, cols.type.x, y + 5.2);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(formatCurrency(totalSpent, currentCurrency), cols.amount.x, y + 5.2, { align: 'right' });

    y += 11;
  }

  // --- 5. TWO-PASS FOOTER & PAGE NUMBERING ---
  const totalPages = doc.getNumberOfPages();
  const nowFormatted = new Date().toLocaleString('pt-BR');

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Top accent rule
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(pageMargin, 6, contentWidth, 1, 'F');

    // Bottom footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(pageMargin, 283, pageMargin + contentWidth, 283);

    // Bottom footer texts
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `FinançasPro • Demonstrativo Financeiro Oficial • Emitido em ${nowFormatted}`,
      pageMargin,
      288
    );
    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${i} de ${totalPages}`, pageMargin + contentWidth, 288, { align: 'right' });
  }

  const fileDate = new Date().toISOString().split('T')[0];
  const fileLabel = isAll ? 'CONSOLIDADO_GERAL' : `MENSAL_${selectedMonthKey}`;
  doc.save(`FinancasPro_Demonstrativo_${fileLabel}_${fileDate}.pdf`);
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
        mIncome += settings?.monthlyIncome?.[mKey] || settings?.income || 0;
        mBalance += settings?.monthlyBalance?.[mKey] || settings?.balance || 0;
        mExtra += settings?.extras?.[mKey] ?? 0;
      });
    } else {
      mIncome = baseIncome;
      mBalance = baseBalance;
    }
  } else {
    mIncome = settings?.monthlyIncome?.[selectedMonthKey] || settings?.income || baseIncome;
    mBalance = settings?.monthlyBalance?.[selectedMonthKey] || settings?.balance || baseBalance;
    mExtra = settings?.extras?.[selectedMonthKey] ?? 0;
  }

  const totalInflow = mIncome + mBalance + mExtra;
  const totalSpent = activeTx.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPaid = activeTx.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  const totalPending = totalSpent - totalPaid;
  const netBalance = totalInflow - totalSpent;

  let csvContent = "\uFEFF"; // BOM strictly required for MS Excel alignment

  csvContent += '===================================================\n';
  csvContent += `FINANÇAS PRO - DIÁRIO FINANCEIRO EXPORTADO [${isAll ? 'GERAL' : selectedMonthKey}]\n`;
  csvContent += '===================================================\n';
  csvContent += `E-mail da Conta: , ${userEmail}\n`;
  csvContent += `Data de Exportação: , ${new Date().toLocaleString('pt-BR')}\n`;
  csvContent += `Filtro: , ${isAll ? 'Consolidado Geral' : `Mês de ${formatMonthTitlePT(selectedMonthKey)}`}\n`;
  csvContent += `Moeda: , ${currentCurrency} (${symbol})\n`;
  csvContent += `Total de Lançamentos: , ${activeTx.length}\n`;
  csvContent += '\n';

  csvContent += '---------------------------------------------------\n';
  csvContent += 'INDICADORES DO PERÍODO\n';
  csvContent += '---------------------------------------------------\n';
  csvContent += `A. ENTRADAS TOTAIS: , ${formatCurrency(totalInflow, currentCurrency).replace(',', '.')}\n`;
  csvContent += `B. SAÍDAS TOTAIS: , ${formatCurrency(totalSpent, currentCurrency).replace(',', '.')}\n`;
  csvContent += `C. TOTAL QUITADO / PAGO: , ${formatCurrency(totalPaid, currentCurrency).replace(',', '.')}\n`;
  csvContent += `D. TOTAL PENDENTE: , ${formatCurrency(totalPending, currentCurrency).replace(',', '.')}\n`;
  csvContent += `E. SOBRA ESTIMADA (A - B): , ${formatCurrency(netBalance, currentCurrency).replace(',', '.')}\n`;
  csvContent += '\n';

  const catMap: Record<string, number> = {};
  activeTx.forEach(t => {
    const c = t.cat ? t.cat.trim() : 'Outros';
    catMap[c] = (catMap[c] || 0) + (t.amount || 0);
  });

  csvContent += '---------------------------------------------------\n';
  csvContent += 'RESUMO POR CATEGORIA\n';
  csvContent += '---------------------------------------------------\n';
  csvContent += 'Categoria, Valor Total\n';
  Object.keys(catMap).forEach(k => {
    const l = k.charAt(0).toUpperCase() + k.slice(1);
    csvContent += `"${l}", "${formatCurrency(catMap[k], currentCurrency)}"\n`;
  });
  csvContent += '\n';

  csvContent += '---------------------------------------------------\n';
  csvContent += 'DETALHAMENTO DOS LANÇAMENTOS\n';
  csvContent += '---------------------------------------------------\n';
  csvContent += 'No.,Vencimento,Descrição,Categoria,Tipo,Situação,Valor Total,Valor Pago,Valor Pendente\n';

  activeTx.forEach((t, index) => {
    const remaining = (t.amount || 0) - (t.paid_amount || 0);
    const labelStatus = remaining <= 0 ? 'PAGO' : (t.paid_amount || 0) > 0 ? 'PARCIAL' : 'PENDENTE';
    const cleanName = (t.name || '').replace(/"/g, '""');
    const displayCat = t.cat ? t.cat.charAt(0).toUpperCase() + t.cat.slice(1) : 'Outros';
    const displayDue = t.due ? t.due.split('-').reverse().join('/') : '—';

    csvContent += `${index + 1},"${displayDue}","${cleanName}","${displayCat}","${getTypeLabel(t.type, (t as any).installmentInfo)}","${labelStatus}",${t.amount || 0},${t.paid_amount || 0},${remaining}\n`;
  });

  // Safe download trigger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const fileLabel = isAll ? 'CONSOLIDADO_GERAL' : `MENSAL_${selectedMonthKey}`;
  link.setAttribute("download", `FinancasPro_Dados_${fileLabel}_${fileDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
