import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatCard } from '@/components/dashboard/StatCard';
import { FundCard } from '@/components/dashboard/FundCard';
import { MemberTable } from '@/components/dashboard/MemberTable';
import { ContributionChart } from '@/components/dashboard/ContributionChart';
import { PaymentHistory } from '@/components/dashboard/PaymentHistory';
import { Button } from '@/components/ui/button';
import { 
  useDashboardStats, 
  useMonthlyContributions, 
  useRecentPayments,
  formatCurrency 
} from '@/hooks/useDashboardStats';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FamilyMember } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, userRole, isLoading: authLoading } = useAuth();

  // Redirect non-admins to their appropriate dashboard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (userRole !== 'admin') {
        navigate('/my-dashboard');
      }
    }
  }, [user, userRole, authLoading, navigate]);
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: takafulContributions } = useMonthlyContributions('takaful');
  const { data: plusContributions } = useMonthlyContributions('plus');
  const { data: recentPaymentsData } = useRecentPayments(6);
  const { data: membersData, isLoading: membersLoading } = useFamilyMembers();

  // Transform members data
  const members: FamilyMember[] = (membersData || []).slice(0, 5).map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    email: m.email || undefined,
    status: m.status as 'active' | 'inactive',
    takafulAmount: m.takaful_amount,
    plusAmount: m.plus_amount,
    joinedDate: m.joined_date,
    avatarUrl: m.avatar_url || undefined,
  }));

  // Transform recent payments for PaymentHistory
  const recentPayments = (recentPaymentsData || []).map(p => ({
    id: p.id,
    memberId: p.member_id,
    fundType: p.fund_type as 'takaful' | 'plus',
    month: p.month,
    amount: p.amount,
    dueAmount: p.due_amount,
    status: p.status as 'paid' | 'pending' | 'partial',
    paidDate: p.paid_date || undefined,
    notes: p.notes || undefined,
  }));

  const memberNames = (membersData || []).reduce((acc, m) => ({ ...acc, [m.id]: m.name }), {} as Record<string, string>);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    await queryClient.invalidateQueries({ queryKey: ['monthly-contributions'] });
    await queryClient.invalidateQueries({ queryKey: ['recent-payments'] });
    await queryClient.invalidateQueries({ queryKey: ['family-members'] });
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    navigate('/');
  };

  const isLoading = statsLoading || membersLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        isLoggedIn 
        userRole="admin" 
        userName="Admin" 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-navy mb-1">Admin Dashboard</h1>
              <p className="text-muted-foreground">Overview of both family funds and member activities</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="gold" asChild>
                <Link to="/members/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Members"
                value={stats?.totalMembers?.toString() || '0'}
                subtitle={`${stats?.activeMembers || 0} active`}
                icon={Users}
                variant="navy"
              />
              <StatCard
                title="Total Takaful"
                value={formatCurrency(stats?.takaful?.totalCollected || 0)}
                subtitle={`${formatCurrency(stats?.takaful?.totalPending || 0)} pending`}
                icon={Wallet}
                variant="navy"
              />
              <StatCard
                title="Total Plus"
                value={formatCurrency(stats?.plus?.totalCollected || 0)}
                subtitle={`${formatCurrency(stats?.plus?.totalPending || 0)} pending`}
                icon={TrendingUp}
                variant="gold"
              />
              <StatCard
                title="Pending Dues"
                value={formatCurrency((stats?.takaful?.totalPending || 0) + (stats?.plus?.totalPending || 0))}
                subtitle="Requires attention"
                icon={AlertCircle}
                variant="warning"
              />
            </div>
          )}

          {/* Fund Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <FundCard
              fundType="takaful"
              totalCollected={stats?.takaful?.totalCollected || 0}
              totalPending={stats?.takaful?.totalPending || 0}
              activeMembers={stats?.takaful?.activeMembers || 0}
              currentMonthCollection={stats?.takaful?.currentMonthCollection || 0}
            />
            <FundCard
              fundType="plus"
              totalCollected={stats?.plus?.totalCollected || 0}
              totalPending={stats?.plus?.totalPending || 0}
              activeMembers={stats?.plus?.activeMembers || 0}
              currentMonthCollection={stats?.plus?.currentMonthCollection || 0}
            />
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
              <h2 className="font-serif text-xl font-bold mb-4">Monthly Collections</h2>
              <ContributionChart
                takafulData={takafulContributions}
                plusData={plusContributions}
              />
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold">Recent Payments</h2>
                <Link to="/payments" className="text-sm text-gold hover:underline">
                  View All
                </Link>
              </div>
              <PaymentHistory 
                payments={recentPayments} 
                showMember 
                memberNames={memberNames}
              />
            </div>
          </div>

          {/* Member Table */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold">Family Members</h2>
              <Link to="/members" className="text-sm text-gold hover:underline">
                Manage All
              </Link>
            </div>
            <MemberTable
              members={members}
              onView={(m) => navigate(`/members/${m.id}`)}
              onEdit={(m) => navigate(`/members/${m.id}/edit`)}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
