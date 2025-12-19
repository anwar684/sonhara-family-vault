import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContributionChart } from '@/components/dashboard/ContributionChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useReportStats, useMonthlyPaymentTrends } from '@/hooks/useReportsData';
import {
  useTakafulPendingReport,
  usePlusPendingReport,
  useMemberContributions,
} from '@/hooks/useMemberContributions';
import { useMonthlyContributions, formatCurrency, formatMonth } from '@/hooks/useDashboardStats';
import { exportMonthlyTrendsToExcel, exportFullReportToExcel } from '@/lib/exportReports';
import {
  exportTakafulPendingToPdf,
  exportPlusPendingToPdf,
  exportMemberContributionsToPdf,
} from '@/lib/exportPdf';
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Calendar,
  Loader2,
  Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import * as XLSX from 'xlsx';

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Fetch real data
  const { data: stats, isLoading: statsLoading } = useReportStats();
  const { data: takafulPending, isLoading: takafulLoading } = useTakafulPendingReport();
  const { data: plusPending, isLoading: plusLoading } = usePlusPendingReport();
  const { data: memberContributions, isLoading: contributionsLoading } = useMemberContributions();
  const { data: monthlyTrends, isLoading: trendsLoading } = useMonthlyPaymentTrends(selectedYear);
  const { data: takafulContributions } = useMonthlyContributions('takaful');
  const { data: plusContributions } = useMonthlyContributions('plus');

  const handleLogout = () => navigate('/');

  // Export handlers
  const handleExportTakafulPendingPdf = () => {
    if (!takafulPending) return;
    exportTakafulPendingToPdf(takafulPending);
    toast({ title: 'Export Complete', description: 'Takaful pending report downloaded as PDF.' });
  };

  const handleExportTakafulPendingExcel = () => {
    if (!takafulPending) return;
    const workbook = XLSX.utils.book_new();
    const data = [
      ['Sonhara Takaful - Pending Balances Report'],
      ['Generated:', new Date().toLocaleDateString()],
      [],
      ['#', 'Name', 'Phone', 'Monthly Amount', 'Pending Amount', 'Pending Months'],
      ...takafulPending.map((m, i) => [
        i + 1,
        m.name,
        m.phone,
        m.monthlyAmount,
        m.totalPending,
        m.pendingMonths.map(mo => formatMonth(mo)).join(', '),
      ]),
      ['', 'TOTAL', '', '', takafulPending.reduce((sum, m) => sum + m.totalPending, 0), ''],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Takaful Pending');
    XLSX.writeFile(workbook, `Sonhara_Takaful_Pending_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: 'Export Complete', description: 'Takaful pending report downloaded as Excel.' });
  };

  const handleExportPlusPendingPdf = () => {
    if (!plusPending) return;
    exportPlusPendingToPdf(plusPending);
    toast({ title: 'Export Complete', description: 'Plus pending report downloaded as PDF.' });
  };

  const handleExportPlusPendingExcel = () => {
    if (!plusPending) return;
    const workbook = XLSX.utils.book_new();
    const data = [
      ['Sonhara Plus - Pending Balances Report'],
      ['Generated:', new Date().toLocaleDateString()],
      [],
      ['#', 'Name', 'Phone', 'Monthly Amount', 'Pending Amount', 'Pending Months'],
      ...plusPending.map((m, i) => [
        i + 1,
        m.name,
        m.phone,
        m.monthlyAmount,
        m.totalPending,
        m.pendingMonths.map(mo => formatMonth(mo)).join(', '),
      ]),
      ['', 'TOTAL', '', '', plusPending.reduce((sum, m) => sum + m.totalPending, 0), ''],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Plus Pending');
    XLSX.writeFile(workbook, `Sonhara_Plus_Pending_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: 'Export Complete', description: 'Plus pending report downloaded as Excel.' });
  };

  const handleExportContributionsPdf = () => {
    if (!memberContributions) return;
    exportMemberContributionsToPdf(memberContributions);
    toast({ title: 'Export Complete', description: 'Member contributions report downloaded as PDF.' });
  };

  const handleExportContributionsExcel = () => {
    if (!memberContributions) return;
    const workbook = XLSX.utils.book_new();
    const data = [
      ['Sonhara - Member Contributions Report'],
      ['Generated:', new Date().toLocaleDateString()],
      [],
      ['#', 'Name', 'Phone', 'Takaful Monthly', 'Takaful Paid', 'Takaful Pending', 'Plus Monthly', 'Plus Paid', 'Plus Pending', 'Total Paid', 'Total Pending'],
      ...memberContributions.map((m, i) => [
        i + 1,
        m.name,
        m.phone,
        m.takafulMonthlyAmount,
        m.takafulTotalPaid,
        m.takafulTotalPending,
        m.plusMonthlyAmount,
        m.plusTotalPaid,
        m.plusTotalPending,
        m.totalPaid,
        m.totalPending,
      ]),
      [
        '', 'TOTAL', '',
        '', memberContributions.reduce((sum, m) => sum + m.takafulTotalPaid, 0),
        memberContributions.reduce((sum, m) => sum + m.takafulTotalPending, 0),
        '', memberContributions.reduce((sum, m) => sum + m.plusTotalPaid, 0),
        memberContributions.reduce((sum, m) => sum + m.plusTotalPending, 0),
        memberContributions.reduce((sum, m) => sum + m.totalPaid, 0),
        memberContributions.reduce((sum, m) => sum + m.totalPending, 0),
      ],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Contributions');
    XLSX.writeFile(workbook, `Sonhara_Member_Contributions_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: 'Export Complete', description: 'Member contributions report downloaded as Excel.' });
  };

  const handleExportMonthlyTrends = () => {
    if (!monthlyTrends) return;
    exportMonthlyTrendsToExcel(monthlyTrends, selectedYear);
    toast({ title: 'Export Complete', description: 'Monthly trends report has been downloaded.' });
  };

  const handleExportFullReport = () => {
    if (!memberContributions || !monthlyTrends || !stats) return;
    // Convert memberContributions to the format expected by exportFullReportToExcel
    const pendingBalances = memberContributions.map(m => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      takafulPending: m.takafulTotalPending,
      takafulPendingMonths: [],
      plusPending: m.plusTotalPending,
      plusPendingMonths: [],
      totalPending: m.totalPending,
    }));
    exportFullReportToExcel(pendingBalances, monthlyTrends, stats, selectedYear);
    toast({ title: 'Export Complete', description: 'Complete financial report has been downloaded.' });
  };

  const isLoading = statsLoading || takafulLoading || plusLoading || contributionsLoading || trendsLoading;

  // Calculate totals for pie charts
  const totalTakafulCollected = (stats?.takaful.totalCollected || 0) + (stats?.takaful.historicalPaid || 0);
  const totalTakafulPending = (stats?.takaful.totalPending || 0) + (stats?.takaful.historicalPending || 0);
  const totalPlusCollected = (stats?.plus.totalCollected || 0) + (stats?.plus.historicalPaid || 0);
  const totalPlusPending = (stats?.plus.totalPending || 0) + (stats?.plus.historicalPending || 0);

  const collectionStatusData = [
    { name: 'Takaful Collected', value: totalTakafulCollected, color: 'hsl(215, 60%, 22%)' },
    { name: 'Takaful Pending', value: totalTakafulPending, color: 'hsl(215, 60%, 50%)' },
    { name: 'Plus Collected', value: totalPlusCollected, color: 'hsl(43, 74%, 49%)' },
    { name: 'Plus Pending', value: totalPlusPending, color: 'hsl(43, 74%, 70%)' },
  ];

  const memberStatusData = [
    { name: 'Active Members', value: stats?.activeMembers || 0, color: 'hsl(142, 71%, 45%)' },
    { name: 'Inactive Members', value: (stats?.totalMembers || 0) - (stats?.activeMembers || 0), color: 'hsl(215, 20%, 65%)' },
  ];

  const grandTotalCollected = totalTakafulCollected + totalPlusCollected;
  const grandTotalPending = totalTakafulPending + totalPlusPending;
  const collectionRate = grandTotalCollected + grandTotalPending > 0 
    ? Math.round((grandTotalCollected / (grandTotalCollected + grandTotalPending)) * 100) 
    : 0;

  // Generate year options
  const yearOptions = [];
  for (let year = parseInt(currentYear); year >= 2020; year--) {
    yearOptions.push(year.toString());
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isLoggedIn userRole="admin" userName="Admin" onLogout={handleLogout} />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-navy mb-1">Reports & Analytics</h1>
              <p className="text-muted-foreground">
                Comprehensive financial reports for both funds
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px] sm:w-[120px]">
                  <Calendar className="h-4 w-4 sm:mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="gold" 
                size="sm"
                className="text-xs sm:text-sm"
                onClick={handleExportFullReport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Export Full Report</span>
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Collection"
              value={formatCurrency(grandTotalCollected)}
              icon={Wallet}
              variant="gold"
            />
            <StatCard
              title="Total Pending"
              value={formatCurrency(grandTotalPending)}
              icon={TrendingDown}
              variant="warning"
            />
            <StatCard
              title="Collection Rate"
              value={`${collectionRate}%`}
              icon={TrendingUp}
              variant="navy"
            />
            <StatCard
              title="Active Members"
              value={`${stats?.activeMembers || 0} / ${stats?.totalMembers || 0}`}
              icon={Users}
              variant="default"
            />
          </div>

          {/* Reports Tabs */}
          <Tabs defaultValue="takaful-pending" className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:max-w-2xl sm:grid-cols-5">
                <TabsTrigger value="takaful-pending" className="text-xs sm:text-sm whitespace-nowrap">Takaful</TabsTrigger>
                <TabsTrigger value="plus-pending" className="text-xs sm:text-sm whitespace-nowrap">Plus</TabsTrigger>
                <TabsTrigger value="contributions" className="text-xs sm:text-sm whitespace-nowrap">Contrib.</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs sm:text-sm whitespace-nowrap">Trends</TabsTrigger>
                <TabsTrigger value="breakdown" className="text-xs sm:text-sm whitespace-nowrap">Breakdown</TabsTrigger>
              </TabsList>
            </div>

            {/* Takaful Pending Tab */}
            <TabsContent value="takaful-pending">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-navy">Takaful Pending Balances</h3>
                    <p className="text-sm text-muted-foreground">Member-wise pending dues for Takaful fund</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportTakafulPendingExcel} disabled={!takafulPending?.length}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportTakafulPendingPdf} disabled={!takafulPending?.length}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>

                {takafulLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : takafulPending && takafulPending.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead className="text-right">Monthly Amount</TableHead>
                          <TableHead className="text-right">Pending Amount</TableHead>
                          <TableHead>Pending Months</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {takafulPending.map((member, index) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {member.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(member.monthlyAmount)}</TableCell>
                            <TableCell className="text-right font-bold text-warning">
                              {formatCurrency(member.totalPending)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {member.pendingMonths.slice(0, 3).map(month => (
                                  <Badge key={month} variant="outline" className="text-xs">
                                    {formatMonth(month)}
                                  </Badge>
                                ))}
                                {member.pendingMonths.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{member.pendingMonths.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell></TableCell>
                          <TableCell>TOTAL ({takafulPending.length} members)</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatCurrency(takafulPending.reduce((sum, m) => sum + m.totalPending, 0))}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No pending Takaful dues from any member.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Plus Pending Tab */}
            <TabsContent value="plus-pending">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-gold">Plus Pending Balances</h3>
                    <p className="text-sm text-muted-foreground">Member-wise pending dues for Plus fund</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportPlusPendingExcel} disabled={!plusPending?.length}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPlusPendingPdf} disabled={!plusPending?.length}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>

                {plusLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : plusPending && plusPending.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead className="text-right">Monthly Amount</TableHead>
                          <TableHead className="text-right">Pending Amount</TableHead>
                          <TableHead>Pending Months</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plusPending.map((member, index) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {member.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(member.monthlyAmount)}</TableCell>
                            <TableCell className="text-right font-bold text-warning">
                              {formatCurrency(member.totalPending)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {member.pendingMonths.slice(0, 3).map(month => (
                                  <Badge key={month} variant="outline" className="text-xs">
                                    {formatMonth(month)}
                                  </Badge>
                                ))}
                                {member.pendingMonths.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{member.pendingMonths.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell></TableCell>
                          <TableCell>TOTAL ({plusPending.length} members)</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatCurrency(plusPending.reduce((sum, m) => sum + m.totalPending, 0))}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No pending Plus dues from any member.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Member Contributions Tab */}
            <TabsContent value="contributions">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold">Member Contributions Summary</h3>
                    <p className="text-sm text-muted-foreground">Complete contribution overview for all members</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportContributionsExcel} disabled={!memberContributions?.length}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportContributionsPdf} disabled={!memberContributions?.length}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>

                {contributionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : memberContributions && memberContributions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead className="text-right">Takaful Monthly</TableHead>
                          <TableHead className="text-right">Takaful Paid</TableHead>
                          <TableHead className="text-right">Takaful Pending</TableHead>
                          <TableHead className="text-right">Plus Monthly</TableHead>
                          <TableHead className="text-right">Plus Paid</TableHead>
                          <TableHead className="text-right">Plus Pending</TableHead>
                          <TableHead className="text-right">Total Paid</TableHead>
                          <TableHead className="text-right">Total Pending</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {memberContributions.map((member, index) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {member.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(member.takafulMonthlyAmount)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(member.takafulTotalPaid)}</TableCell>
                            <TableCell className="text-right text-warning">{member.takafulTotalPending > 0 ? formatCurrency(member.takafulTotalPending) : '-'}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(member.plusMonthlyAmount)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(member.plusTotalPaid)}</TableCell>
                            <TableCell className="text-right text-warning">{member.plusTotalPending > 0 ? formatCurrency(member.plusTotalPending) : '-'}</TableCell>
                            <TableCell className="text-right font-bold text-green-600">{formatCurrency(member.totalPaid)}</TableCell>
                            <TableCell className="text-right font-bold text-destructive">{member.totalPending > 0 ? formatCurrency(member.totalPending) : '-'}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell></TableCell>
                          <TableCell>TOTAL ({memberContributions.length} members)</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(memberContributions.reduce((sum, m) => sum + m.takafulTotalPaid, 0))}
                          </TableCell>
                          <TableCell className="text-right text-warning">
                            {formatCurrency(memberContributions.reduce((sum, m) => sum + m.takafulTotalPending, 0))}
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(memberContributions.reduce((sum, m) => sum + m.plusTotalPaid, 0))}
                          </TableCell>
                          <TableCell className="text-right text-warning">
                            {formatCurrency(memberContributions.reduce((sum, m) => sum + m.plusTotalPending, 0))}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(memberContributions.reduce((sum, m) => sum + m.totalPaid, 0))}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatCurrency(memberContributions.reduce((sum, m) => sum + m.totalPending, 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No members found</p>
                    <p className="text-sm">Add members to see their contribution summary.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Collection Trends Tab */}
            <TabsContent value="trends">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-xl font-bold">Monthly Collection Trends</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportMonthlyTrends}
                    disabled={!monthlyTrends}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                <ContributionChart 
                  takafulData={takafulContributions || []} 
                  plusData={plusContributions || []} 
                />
              </div>
            </TabsContent>

            {/* Fund Breakdown Tab */}
            <TabsContent value="breakdown">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-serif text-xl font-bold mb-4">Collection Status</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={collectionStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {collectionStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">Takaful Total</span>
                      <span className="font-bold">{formatCurrency(totalTakafulCollected + totalTakafulPending)}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">Plus Total</span>
                      <span className="font-bold">{formatCurrency(totalPlusCollected + totalPlusPending)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-serif text-xl font-bold mb-4">Member Status</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={memberStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {memberStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">Takaful Members</span>
                      <span className="font-bold">{stats?.takaful.activeMembers || 0} active</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">Plus Members</span>
                      <span className="font-bold">{stats?.plus.activeMembers || 0} active</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
