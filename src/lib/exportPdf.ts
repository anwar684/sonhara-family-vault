import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TakafulPendingMember, PlusPendingMember, MemberContributionSummary } from '@/hooks/useMemberContributions';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function exportTakafulPendingToPdf(data: TakafulPendingMember[]) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(27, 60, 107); // Navy color
  doc.text('Sonhara Takaful - Pending Balances Report', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Summary
  const totalPending = data.reduce((sum, m) => sum + m.totalPending, 0);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Members with Pending: ${data.length}`, 14, 38);
  doc.text(`Total Pending Amount: ${formatCurrency(totalPending)}`, 14, 45);
  
  // Table
  autoTable(doc, {
    startY: 55,
    head: [['#', 'Name', 'Phone', 'Monthly Amount', 'Pending Amount', 'Pending Months']],
    body: data.map((member, index) => [
      index + 1,
      member.name,
      member.phone,
      formatCurrency(member.monthlyAmount),
      formatCurrency(member.totalPending),
      member.pendingMonths.slice(0, 3).map(m => formatMonth(m)).join(', ') + 
        (member.pendingMonths.length > 3 ? ` +${member.pendingMonths.length - 3} more` : ''),
    ]),
    foot: [['', 'TOTAL', '', '', formatCurrency(totalPending), '']],
    theme: 'striped',
    headStyles: { fillColor: [27, 60, 107] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 45 },
    },
  });
  
  doc.save(`Sonhara_Takaful_Pending_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportPlusPendingToPdf(data: PlusPendingMember[]) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(196, 153, 55); // Gold color
  doc.text('Sonhara Plus - Pending Balances Report', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Summary
  const totalPending = data.reduce((sum, m) => sum + m.totalPending, 0);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Members with Pending: ${data.length}`, 14, 38);
  doc.text(`Total Pending Amount: ${formatCurrency(totalPending)}`, 14, 45);
  
  // Table
  autoTable(doc, {
    startY: 55,
    head: [['#', 'Name', 'Phone', 'Monthly Amount', 'Pending Amount', 'Pending Months']],
    body: data.map((member, index) => [
      index + 1,
      member.name,
      member.phone,
      formatCurrency(member.monthlyAmount),
      formatCurrency(member.totalPending),
      member.pendingMonths.slice(0, 3).map(m => formatMonth(m)).join(', ') + 
        (member.pendingMonths.length > 3 ? ` +${member.pendingMonths.length - 3} more` : ''),
    ]),
    foot: [['', 'TOTAL', '', '', formatCurrency(totalPending), '']],
    theme: 'striped',
    headStyles: { fillColor: [196, 153, 55] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 45 },
    },
  });
  
  doc.save(`Sonhara_Plus_Pending_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportMemberContributionsToPdf(data: MemberContributionSummary[]) {
  const doc = new jsPDF('landscape');
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(27, 60, 107);
  doc.text('Sonhara - Member Contributions Report', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Summary totals
  const totalPaid = data.reduce((sum, m) => sum + m.totalPaid, 0);
  const totalPending = data.reduce((sum, m) => sum + m.totalPending, 0);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Members: ${data.length}`, 14, 38);
  doc.text(`Total Collected: ${formatCurrency(totalPaid)}`, 14, 45);
  doc.text(`Total Pending: ${formatCurrency(totalPending)}`, 100, 45);
  
  // Table
  autoTable(doc, {
    startY: 55,
    head: [[
      '#', 'Name', 'Phone',
      'Takaful Monthly', 'Takaful Paid', 'Takaful Pending',
      'Plus Monthly', 'Plus Paid', 'Plus Pending',
      'Total Paid', 'Total Pending'
    ]],
    body: data.map((member, index) => [
      index + 1,
      member.name,
      member.phone,
      formatCurrency(member.takafulMonthlyAmount),
      formatCurrency(member.takafulTotalPaid),
      formatCurrency(member.takafulTotalPending),
      formatCurrency(member.plusMonthlyAmount),
      formatCurrency(member.plusTotalPaid),
      formatCurrency(member.plusTotalPending),
      formatCurrency(member.totalPaid),
      formatCurrency(member.totalPending),
    ]),
    foot: [[
      '', 'TOTAL', '',
      '', formatCurrency(data.reduce((sum, m) => sum + m.takafulTotalPaid, 0)), formatCurrency(data.reduce((sum, m) => sum + m.takafulTotalPending, 0)),
      '', formatCurrency(data.reduce((sum, m) => sum + m.plusTotalPaid, 0)), formatCurrency(data.reduce((sum, m) => sum + m.plusTotalPending, 0)),
      formatCurrency(totalPaid), formatCurrency(totalPending),
    ]],
    theme: 'striped',
    headStyles: { fillColor: [27, 60, 107], fontSize: 8 },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' },
      9: { cellWidth: 25, halign: 'right' },
      10: { cellWidth: 25, halign: 'right' },
    },
  });
  
  doc.save(`Sonhara_Member_Contributions_${new Date().toISOString().slice(0, 10)}.pdf`);
}
