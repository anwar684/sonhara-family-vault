import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatCard } from '@/components/dashboard/StatCard';
import { PaymentHistory } from '@/components/dashboard/PaymentHistory';
import { Button } from '@/components/ui/button';
import { mockMembers, mockPayments, getMemberSummary, formatCurrency, formatMonth } from '@/lib/mockData';
import { Wallet, TrendingUp, AlertCircle, Calendar, Download, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function MyDashboard() {
  const navigate = useNavigate();
  
  // Using first member as the logged-in user for demo
  const currentMember = mockMembers[0];
  const memberPayments = mockPayments.filter((p) => p.memberId === currentMember.id);
  const summary = getMemberSummary(currentMember.id);

  const handleLogout = () => navigate('/');

  const pendingPayments = memberPayments.filter((p) => p.status !== 'paid');
  const paidPayments = memberPayments.filter((p) => p.status === 'paid');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        isLoggedIn
        userRole="member"
        userName={currentMember.name}
        onLogout={handleLogout}
      />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Welcome Header */}
          <div className="bg-gradient-navy rounded-2xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold/20 text-gold text-2xl font-bold font-serif">
                  {currentMember.name.charAt(0)}
                </div>
                <div>
                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground mb-1">
                    Welcome, {currentMember.name.split(' ')[0]}!
                  </h1>
                  <p className="text-primary-foreground/70">
                    Member since {new Date(currentMember.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {currentMember.phone}
                </div>
                {currentMember.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {currentMember.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Takaful Paid"
              value={formatCurrency(summary.takaful.totalPaid)}
              subtitle="Total contributions"
              icon={Wallet}
              variant="navy"
            />
            <StatCard
              title="Takaful Pending"
              value={formatCurrency(summary.takaful.totalPending)}
              subtitle={`${summary.takaful.pendingMonths.length} months`}
              icon={AlertCircle}
              variant={summary.takaful.totalPending > 0 ? 'warning' : 'default'}
            />
            <StatCard
              title="Plus Paid"
              value={formatCurrency(summary.plus.totalPaid)}
              subtitle="Total investments"
              icon={TrendingUp}
              variant="gold"
            />
            <StatCard
              title="Plus Pending"
              value={formatCurrency(summary.plus.totalPending)}
              subtitle={`${summary.plus.pendingMonths.length} months`}
              icon={AlertCircle}
              variant={summary.plus.totalPending > 0 ? 'warning' : 'default'}
            />
          </div>

          {/* Monthly Amounts Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-navy/5 border border-navy/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy">Sonhara Takaful</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-navy/10 text-navy">
                  Donation Fund
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-navy">
                  {formatCurrency(currentMember.takafulAmount)}
                </span>
                <span className="text-muted-foreground">/ month</span>
              </div>
            </div>
            
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gold-dark">Sonhara Plus</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold-dark">
                  Investment Fund
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-gold-dark">
                  {formatCurrency(currentMember.plusAmount)}
                </span>
                <span className="text-muted-foreground">/ month</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pending Payments */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Pending Payments
                </h2>
                <span className="text-sm text-muted-foreground">
                  {pendingPayments.length} items
                </span>
              </div>
              
              {pendingPayments.length > 0 ? (
                <PaymentHistory payments={pendingPayments} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>All payments are up to date!</p>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold">Payment History</h2>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              
              {paidPayments.length > 0 ? (
                <PaymentHistory payments={paidPayments.slice(0, 6)} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No payments recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
