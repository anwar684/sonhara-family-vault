import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContributionChart } from '@/components/dashboard/ContributionChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  mockMembers,
  mockPayments,
  getDashboardStats,
  getMonthlyContributions,
  formatCurrency,
  formatMonth,
} from '@/lib/mockData';
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Calendar,
  PieChart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState('2024');

  const stats = getDashboardStats();
  const takafulContributions = getMonthlyContributions('takaful');
  const plusContributions = getMonthlyContributions('plus');

  const handleLogout = () => navigate('/');

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: 'Export Started',
      description: `Your ${format.toUpperCase()} report is being generated...`,
    });
  };

  // Pie chart data for collection status
  const collectionStatusData = [
    { name: 'Takaful Collected', value: stats.takaful.totalCollected, color: 'hsl(215, 60%, 22%)' },
    { name: 'Takaful Pending', value: stats.takaful.totalPending, color: 'hsl(215, 60%, 50%)' },
    { name: 'Plus Collected', value: stats.plus.totalCollected, color: 'hsl(43, 74%, 49%)' },
    { name: 'Plus Pending', value: stats.plus.totalPending, color: 'hsl(43, 74%, 70%)' },
  ];

  // Member status breakdown
  const memberStatusData = [
    { name: 'Active Members', value: stats.activeMembers, color: 'hsl(142, 71%, 45%)' },
    { name: 'Inactive Members', value: stats.totalMembers - stats.activeMembers, color: 'hsl(215, 20%, 65%)' },
  ];

  // Pending dues by member
  const pendingByMember = mockMembers
    .filter((m) => m.status === 'active')
    .map((member) => {
      const memberPayments = mockPayments.filter((p) => p.memberId === member.id);
      const pending = memberPayments.reduce((sum, p) => sum + (p.dueAmount - p.amount), 0);
      return { name: member.name, pending };
    })
    .filter((m) => m.pending > 0)
    .sort((a, b) => b.pending - a.pending);

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
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="gold" onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Collection"
              value={formatCurrency(stats.takaful.totalCollected + stats.plus.totalCollected)}
              icon={Wallet}
              variant="gold"
            />
            <StatCard
              title="Total Pending"
              value={formatCurrency(stats.takaful.totalPending + stats.plus.totalPending)}
              icon={TrendingDown}
              variant="warning"
            />
            <StatCard
              title="Collection Rate"
              value={`${Math.round(
                ((stats.takaful.totalCollected + stats.plus.totalCollected) /
                  (stats.takaful.totalCollected + stats.plus.totalCollected + stats.takaful.totalPending + stats.plus.totalPending)) *
                  100
              )}%`}
              icon={TrendingUp}
              variant="navy"
            />
            <StatCard
              title="Active Members"
              value={`${stats.activeMembers} / ${stats.totalMembers}`}
              icon={Users}
              variant="default"
            />
          </div>

          {/* Charts */}
          <Tabs defaultValue="trends" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="trends">Collection Trends</TabsTrigger>
              <TabsTrigger value="breakdown">Fund Breakdown</TabsTrigger>
              <TabsTrigger value="pending">Pending Dues</TabsTrigger>
            </TabsList>

            {/* Collection Trends Tab */}
            <TabsContent value="trends">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-serif text-xl font-bold mb-6">Monthly Collection Trends</h3>
                <ContributionChart takafulData={takafulContributions} plusData={plusContributions} />
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
                </div>
              </div>
            </TabsContent>

            {/* Pending Dues Tab */}
            <TabsContent value="pending">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-serif text-xl font-bold mb-4">Pending Dues by Member</h3>
                {pendingByMember.length > 0 ? (
                  <div className="space-y-4">
                    {pendingByMember.map((member, index) => (
                      <div
                        key={member.name}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning font-semibold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-warning">
                            {formatCurrency(member.pending)}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">pending</span>
                        </div>
                      </div>
                    ))}
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
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
