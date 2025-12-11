import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatCard } from '@/components/dashboard/StatCard';
import { PaymentHistory } from '@/components/dashboard/PaymentHistory';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, AlertCircle, Calendar, Download, Phone, Mail, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatMonth = (monthStr: string) => {
  const date = new Date(monthStr + '-01');
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export default function MyDashboard() {
  const navigate = useNavigate();
  const { user, userRole, isLoading: authLoading, signOut } = useAuth();

  // Redirect admins to admin dashboard, unauthenticated to login
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (userRole === 'admin') {
        navigate('/dashboard');
      }
    }
  }, [user, userRole, authLoading, navigate]);

  // Fetch the family member linked to this user
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['my-family-member', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch payments for this member
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['my-payments', member?.id],
    queryFn: async () => {
      if (!member?.id) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', member.id)
        .order('month', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!member?.id,
  });

  const handleLogout = () => signOut();

  if (memberLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isLoggedIn userRole="member" userName="" onLogout={handleLogout} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-navy" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isLoggedIn userRole="member" userName="" onLogout={handleLogout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-warning" />
            <h2 className="font-serif text-xl font-bold mb-2">Account Not Linked</h2>
            <p className="text-muted-foreground">
              Your account is not linked to a family member record. Please contact the administrator.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate summary from payments
  const takafulPayments = payments.filter(p => p.fund_type === 'takaful');
  const plusPayments = payments.filter(p => p.fund_type === 'plus');

  const takafulPaid = takafulPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) + Number(member.takaful_paid_before_entry || 0);
  const takafulPending = takafulPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.due_amount), 0) + Number(member.takaful_pending_before_entry || 0);
  const plusPaid = plusPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) + Number(member.plus_paid_before_entry || 0);
  const plusPending = plusPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.due_amount), 0) + Number(member.plus_pending_before_entry || 0);

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');

  // Convert to PaymentHistory format
  const formatPaymentsForHistory = (pmts: typeof payments) => {
    return pmts.map(p => ({
      id: p.id,
      memberId: p.member_id,
      fundType: p.fund_type as 'takaful' | 'plus',
      month: p.month,
      amount: Number(p.amount),
      dueAmount: Number(p.due_amount),
      status: p.status as 'paid' | 'pending' | 'partial',
      paidDate: p.paid_date || undefined,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        isLoggedIn
        userRole="member"
        userName={member.name}
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
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground mb-1">
                    Welcome, {member.name.split(' ')[0]}!
                  </h1>
                  <p className="text-primary-foreground/70">
                    Member since {new Date(member.joined_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {member.phone}
                </div>
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Takaful Paid"
              value={formatCurrency(takafulPaid)}
              subtitle="Total contributions"
              icon={Wallet}
              variant="navy"
            />
            <StatCard
              title="Takaful Pending"
              value={formatCurrency(takafulPending)}
              subtitle={`${pendingPayments.filter(p => p.fund_type === 'takaful').length} months`}
              icon={AlertCircle}
              variant={takafulPending > 0 ? 'warning' : 'default'}
            />
            <StatCard
              title="Plus Paid"
              value={formatCurrency(plusPaid)}
              subtitle="Total investments"
              icon={TrendingUp}
              variant="gold"
            />
            <StatCard
              title="Plus Pending"
              value={formatCurrency(plusPending)}
              subtitle={`${pendingPayments.filter(p => p.fund_type === 'plus').length} months`}
              icon={AlertCircle}
              variant={plusPending > 0 ? 'warning' : 'default'}
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
                  {formatCurrency(Number(member.takaful_amount))}
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
                  {formatCurrency(Number(member.plus_amount))}
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
                <PaymentHistory payments={formatPaymentsForHistory(pendingPayments)} />
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
                <PaymentHistory payments={formatPaymentsForHistory(paidPayments.slice(0, 6))} />
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
