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
import {
  usePendingBalances,
  useReportStats,
  useMonthlyPaymentTrends,
} from '@/hooks/useReportsData';
import { useMonthlyContributions, formatCurrency, formatMonth } from '@/hooks/useDashboardStats';
import {
  exportPendingBalancesToExcel,
  exportMonthlyTrendsToExcel,
  exportFullReportToExcel,
} from '@/lib/exportReports';
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Calendar,
  PieChart,
  Loader2,
  Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [pendingFilter, setPendingFilter] = useState<'all' | 'takaful' | 'plus'>('all');

  // Fetch real data
  const { data: stats, isLoading: statsLoading } = useReportStats();
  const { data: pendingBalances, isLoading: pendingLoading } = usePendingBalances(
    pendingFilter === 'all' ? undefined : pendingFilter
  );
  const { data: monthlyTrends, isLoading: trendsLoading } = useMonthlyPaymentTrends(selectedYear);
  const { data: takafulContributions } = useMonthlyContributions('takaful');
  const { data: plusContributions } = useMonthlyContributions('plus');

  const handleLogout = () => navigate('/');

  const handleExportPendingBalances = () => {
    if (!pendingBalances || !stats) return;
    
    exportPendingBalancesToExcel({
      data: pendingBalances,
      fundType: pendingFilter,
      stats,
    });
    
    toast({
      title: 'Export Complete',
      description: 'Pending balances report has been downloaded.',
    });
  };

  const handleExportMonthlyTrends = () => {
    if (!monthlyTrends) return;
    
    exportMonthlyTrendsToExcel(monthlyTrends, selectedYear);
    
    toast({
      title: 'Export Complete',
      description: 'Monthly trends report has been downloaded.',
    });
  };

  const handleExportFullReport = () => {
    if (!pendingBalances || !monthlyTrends || !stats) return;
    
    exportFullReportToExcel(pendingBalances, monthlyTrends, stats, selectedYear);
    
    toast({
      title: 'Export Complete',
      description: 'Complete financial report has been downloaded.',
    });
  };

  const isLoading = statsLoading || pendingLoading || trendsLoading;

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
            <div className="flex items-center gap-3">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <Calendar className="h-4 w-4 mr-2" />
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
                onClick={handleExportFullReport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Export Full Report
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

          {/* Charts */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="pending">Pending Balances</TabsTrigger>
              <TabsTrigger value="trends">Collection Trends</TabsTrigger>
              <TabsTrigger value="breakdown">Fund Breakdown</TabsTrigger>
            </TabsList>

            {/* Pending Balances Tab */}
            <TabsContent value="pending">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="font-serif text-xl font-bold">Pending Balances by Member</h3>
                  <div className="flex items-center gap-3">
                    <Select value={pendingFilter} onValueChange={(v) => setPendingFilter(v as typeof pendingFilter)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by fund" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Funds</SelectItem>
                        <SelectItem value="takaful">Takaful Only</SelectItem>
                        <SelectItem value="plus">Plus Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportPendingBalances}
                      disabled={!pendingBalances || pendingBalances.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {pendingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingBalances && pendingBalances.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Member</TableHead>
                          {(pendingFilter === 'all' || pendingFilter === 'takaful') && (
                            <>
                              <TableHead className="text-right">Takaful Pending</TableHead>
                              <TableHead>Pending Months</TableHead>
                            </>
                          )}
                          {(pendingFilter === 'all' || pendingFilter === 'plus') && (
                            <>
                              <TableHead className="text-right">Plus Pending</TableHead>
                              <TableHead>Pending Months</TableHead>
                            </>
                          )}
                          {pendingFilter === 'all' && (
                            <TableHead className="text-right">Total</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingBalances.map((member, index) => (
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
                            {(pendingFilter === 'all' || pendingFilter === 'takaful') && (
                              <>
                                <TableCell className="text-right font-medium text-warning">
                                  {member.takafulPending > 0 ? formatCurrency(member.takafulPending) : '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {member.takafulPendingMonths.slice(0, 3).map(month => (
                                      <Badge key={month} variant="outline" className="text-xs">
                                        {formatMonth(month)}
                                      </Badge>
                                    ))}
                                    {member.takafulPendingMonths.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{member.takafulPendingMonths.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </>
                            )}
                            {(pendingFilter === 'all' || pendingFilter === 'plus') && (
                              <>
                                <TableCell className="text-right font-medium text-warning">
                                  {member.plusPending > 0 ? formatCurrency(member.plusPending) : '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {member.plusPendingMonths.slice(0, 3).map(month => (
                                      <Badge key={month} variant="outline" className="text-xs">
                                        {formatMonth(month)}
                                      </Badge>
                                    ))}
                                    {member.plusPendingMonths.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{member.plusPendingMonths.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </>
                            )}
                            {pendingFilter === 'all' && (
                              <TableCell className="text-right font-bold text-destructive">
                                {formatCurrency(member.totalPending)}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {/* Totals row */}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell></TableCell>
                          <TableCell>TOTAL</TableCell>
                          {(pendingFilter === 'all' || pendingFilter === 'takaful') && (
                            <>
                              <TableCell className="text-right text-warning">
                                {formatCurrency(pendingBalances.reduce((sum, m) => sum + m.takafulPending, 0))}
                              </TableCell>
                              <TableCell></TableCell>
                            </>
                          )}
                          {(pendingFilter === 'all' || pendingFilter === 'plus') && (
                            <>
                              <TableCell className="text-right text-warning">
                                {formatCurrency(pendingBalances.reduce((sum, m) => sum + m.plusPending, 0))}
                              </TableCell>
                              <TableCell></TableCell>
                            </>
                          )}
                          {pendingFilter === 'all' && (
                            <TableCell className="text-right text-destructive">
                              {formatCurrency(pendingBalances.reduce((sum, m) => sum + m.totalPending, 0))}
                            </TableCell>
                          )}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <PieChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No pending dues from any member.</p>
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
                  
                  {/* Fund breakdown stats */}
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
                  
                  {/* Member stats by fund */}
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
