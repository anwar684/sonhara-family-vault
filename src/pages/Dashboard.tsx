import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatCard } from '@/components/dashboard/StatCard';
import { FundCard } from '@/components/dashboard/FundCard';
import { MemberTable } from '@/components/dashboard/MemberTable';
import { ContributionChart } from '@/components/dashboard/ContributionChart';
import { PaymentHistory } from '@/components/dashboard/PaymentHistory';
import { Button } from '@/components/ui/button';
import { 
  mockMembers, 
  mockPayments, 
  getDashboardStats, 
  getMonthlyContributions,
  formatCurrency 
} from '@/lib/mockData';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const stats = getDashboardStats();
  const takafulContributions = getMonthlyContributions('takaful');
  const plusContributions = getMonthlyContributions('plus');
  const recentPayments = mockPayments.slice(-6).reverse();
  
  const memberNames = mockMembers.reduce((acc, m) => ({ ...acc, [m.id]: m.name }), {} as Record<string, string>);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleLogout = () => {
    navigate('/');
  };

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Members"
              value={stats.totalMembers.toString()}
              subtitle={`${stats.activeMembers} active`}
              icon={Users}
              variant="navy"
            />
            <StatCard
              title="Total Takaful"
              value={formatCurrency(stats.takaful.totalCollected)}
              subtitle={`${formatCurrency(stats.takaful.totalPending)} pending`}
              icon={Wallet}
              variant="navy"
            />
            <StatCard
              title="Total Plus"
              value={formatCurrency(stats.plus.totalCollected)}
              subtitle={`${formatCurrency(stats.plus.totalPending)} pending`}
              icon={TrendingUp}
              variant="gold"
            />
            <StatCard
              title="Pending Dues"
              value={formatCurrency(stats.takaful.totalPending + stats.plus.totalPending)}
              subtitle="Requires attention"
              icon={AlertCircle}
              variant="warning"
            />
          </div>

          {/* Fund Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <FundCard
              fundType="takaful"
              totalCollected={stats.takaful.totalCollected}
              totalPending={stats.takaful.totalPending}
              activeMembers={stats.takaful.activeMembers}
              currentMonthCollection={stats.takaful.currentMonthCollection}
            />
            <FundCard
              fundType="plus"
              totalCollected={stats.plus.totalCollected}
              totalPending={stats.plus.totalPending}
              activeMembers={stats.plus.activeMembers}
              currentMonthCollection={stats.plus.currentMonthCollection}
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
              members={mockMembers.slice(0, 5)}
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
