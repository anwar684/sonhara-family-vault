import * as XLSX from 'xlsx';
import { MemberPendingBalance, ReportStats } from '@/hooks/useReportsData';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface ExportPendingBalancesOptions {
  data: MemberPendingBalance[];
  fundType: 'all' | 'takaful' | 'plus';
  stats: ReportStats;
}

export function exportPendingBalancesToExcel({ data, fundType, stats }: ExportPendingBalancesOptions) {
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Sonhara Family Portal - Pending Balances Report'],
    ['Generated on:', new Date().toLocaleDateString()],
    [],
    ['Fund Summary'],
    ['', 'Takaful', 'Plus', 'Total'],
    ['Total Collected', stats.takaful.totalCollected + stats.takaful.historicalPaid, stats.plus.totalCollected + stats.plus.historicalPaid, stats.takaful.totalCollected + stats.takaful.historicalPaid + stats.plus.totalCollected + stats.plus.historicalPaid],
    ['Total Pending', stats.takaful.totalPending + stats.takaful.historicalPending, stats.plus.totalPending + stats.plus.historicalPending, stats.takaful.totalPending + stats.takaful.historicalPending + stats.plus.totalPending + stats.plus.historicalPending],
    ['Active Members', stats.takaful.activeMembers, stats.plus.activeMembers, ''],
    ['Members with Pending', stats.takaful.pendingMembers, stats.plus.pendingMembers, ''],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Pending balances sheet
  const pendingHeaders: (string | number)[] = ['#', 'Name', 'Phone'];
  
  if (fundType === 'all' || fundType === 'takaful') {
    pendingHeaders.push('Takaful Pending', 'Takaful Months');
  }
  if (fundType === 'all' || fundType === 'plus') {
    pendingHeaders.push('Plus Pending', 'Plus Months');
  }
  if (fundType === 'all') {
    pendingHeaders.push('Total Pending');
  }

  const pendingData: (string | number)[][] = [pendingHeaders];
  
  data.forEach((member, index) => {
    const row: (string | number)[] = [index + 1, member.name, member.phone];
    
    if (fundType === 'all' || fundType === 'takaful') {
      row.push(member.takafulPending, member.takafulPendingMonths.map(m => formatMonth(m)).join(', '));
    }
    if (fundType === 'all' || fundType === 'plus') {
      row.push(member.plusPending, member.plusPendingMonths.map(m => formatMonth(m)).join(', '));
    }
    if (fundType === 'all') {
      row.push(member.totalPending);
    }
    
    pendingData.push(row);
  });

  // Add totals row
  const totalsRow: (string | number)[] = ['', 'TOTAL', ''];
  if (fundType === 'all' || fundType === 'takaful') {
    totalsRow.push(data.reduce((sum, m) => sum + m.takafulPending, 0), '');
  }
  if (fundType === 'all' || fundType === 'plus') {
    totalsRow.push(data.reduce((sum, m) => sum + m.plusPending, 0), '');
  }
  if (fundType === 'all') {
    totalsRow.push(data.reduce((sum, m) => sum + m.totalPending, 0));
  }
  pendingData.push(totalsRow);

  const pendingSheet = XLSX.utils.aoa_to_sheet(pendingData);
  
  // Set column widths
  pendingSheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 25 },  // Name
    { wch: 15 },  // Phone
    { wch: 15 },  // Takaful Pending
    { wch: 30 },  // Takaful Months
    { wch: 15 },  // Plus Pending
    { wch: 30 },  // Plus Months
    { wch: 15 },  // Total
  ];
  
  XLSX.utils.book_append_sheet(workbook, pendingSheet, 'Pending Balances');

  // Generate filename
  const fundLabel = fundType === 'all' ? 'All-Funds' : fundType === 'takaful' ? 'Takaful' : 'Plus';
  const filename = `Sonhara_Pending_Balances_${fundLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
}

interface MonthlyTrendData {
  month: string;
  takafulPaid: number;
  takafulPending: number;
  plusPaid: number;
  plusPending: number;
}

export function exportMonthlyTrendsToExcel(data: MonthlyTrendData[], year: string) {
  const workbook = XLSX.utils.book_new();
  
  const headers = ['Month', 'Takaful Paid', 'Takaful Pending', 'Plus Paid', 'Plus Pending', 'Total Paid', 'Total Pending'];
  const sheetData = [
    ['Sonhara Family Portal - Monthly Collection Report'],
    ['Year:', year],
    ['Generated on:', new Date().toLocaleDateString()],
    [],
    headers,
  ];

  data.forEach(row => {
    sheetData.push([
      formatMonth(row.month),
      row.takafulPaid,
      row.takafulPending,
      row.plusPaid,
      row.plusPending,
      row.takafulPaid + row.plusPaid,
      row.takafulPending + row.plusPending,
    ] as any);
  });

  // Add totals
  const totals = data.reduce(
    (acc, row) => ({
      takafulPaid: acc.takafulPaid + row.takafulPaid,
      takafulPending: acc.takafulPending + row.takafulPending,
      plusPaid: acc.plusPaid + row.plusPaid,
      plusPending: acc.plusPending + row.plusPending,
    }),
    { takafulPaid: 0, takafulPending: 0, plusPaid: 0, plusPending: 0 }
  );

  sheetData.push([
    'TOTAL',
    totals.takafulPaid,
    totals.takafulPending,
    totals.plusPaid,
    totals.plusPending,
    totals.takafulPaid + totals.plusPaid,
    totals.takafulPending + totals.plusPending,
  ] as any);

  const sheet = XLSX.utils.aoa_to_sheet(sheetData);
  sheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, sheet, 'Monthly Trends');

  const filename = `Sonhara_Monthly_Report_${year}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportFullReportToExcel(
  pendingBalances: MemberPendingBalance[],
  monthlyTrends: MonthlyTrendData[],
  stats: ReportStats,
  year: string
) {
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Sonhara Family Portal - Complete Financial Report'],
    ['Year:', year],
    ['Generated on:', new Date().toLocaleDateString()],
    [],
    ['OVERVIEW'],
    ['Total Members:', stats.totalMembers],
    ['Active Members:', stats.activeMembers],
    [],
    ['FUND SUMMARY'],
    ['', 'Takaful', 'Plus', 'Total'],
    ['Total Collected (System)', stats.takaful.totalCollected, stats.plus.totalCollected, stats.takaful.totalCollected + stats.plus.totalCollected],
    ['Historical Paid', stats.takaful.historicalPaid, stats.plus.historicalPaid, stats.takaful.historicalPaid + stats.plus.historicalPaid],
    ['Grand Total Collected', stats.takaful.totalCollected + stats.takaful.historicalPaid, stats.plus.totalCollected + stats.plus.historicalPaid, stats.takaful.totalCollected + stats.takaful.historicalPaid + stats.plus.totalCollected + stats.plus.historicalPaid],
    [],
    ['Total Pending (System)', stats.takaful.totalPending, stats.plus.totalPending, stats.takaful.totalPending + stats.plus.totalPending],
    ['Historical Pending', stats.takaful.historicalPending, stats.plus.historicalPending, stats.takaful.historicalPending + stats.plus.historicalPending],
    ['Grand Total Pending', stats.takaful.totalPending + stats.takaful.historicalPending, stats.plus.totalPending + stats.plus.historicalPending, stats.takaful.totalPending + stats.takaful.historicalPending + stats.plus.totalPending + stats.plus.historicalPending],
    [],
    ['Active Members in Fund', stats.takaful.activeMembers, stats.plus.activeMembers, ''],
    ['Members with Pending', stats.takaful.pendingMembers, stats.plus.pendingMembers, ''],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Monthly trends sheet
  const trendsData = [
    ['MONTHLY COLLECTION TRENDS'],
    [],
    ['Month', 'Takaful Paid', 'Takaful Pending', 'Plus Paid', 'Plus Pending', 'Total Paid', 'Total Pending'],
  ];

  monthlyTrends.forEach(row => {
    trendsData.push([
      formatMonth(row.month),
      row.takafulPaid,
      row.takafulPending,
      row.plusPaid,
      row.plusPending,
      row.takafulPaid + row.plusPaid,
      row.takafulPending + row.plusPending,
    ] as any);
  });

  const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
  trendsSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Monthly Trends');

  // Pending balances sheet
  const pendingData = [
    ['PENDING BALANCES BY MEMBER'],
    [],
    ['#', 'Name', 'Phone', 'Takaful Pending', 'Takaful Months', 'Plus Pending', 'Plus Months', 'Total Pending'],
  ];

  pendingBalances.forEach((member, index) => {
    pendingData.push([
      index + 1,
      member.name,
      member.phone,
      member.takafulPending,
      member.takafulPendingMonths.map(m => formatMonth(m)).join(', '),
      member.plusPending,
      member.plusPendingMonths.map(m => formatMonth(m)).join(', '),
      member.totalPending,
    ] as any);
  });

  // Add totals
  pendingData.push([
    '',
    'TOTAL',
    '',
    pendingBalances.reduce((sum, m) => sum + m.takafulPending, 0),
    '',
    pendingBalances.reduce((sum, m) => sum + m.plusPending, 0),
    '',
    pendingBalances.reduce((sum, m) => sum + m.totalPending, 0),
  ] as any);

  const pendingSheet = XLSX.utils.aoa_to_sheet(pendingData);
  pendingSheet['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, pendingSheet, 'Pending Balances');

  const filename = `Sonhara_Complete_Report_${year}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
