import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, AlertCircle, Wallet, Calendar, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats, useMonthlyContributions, formatCurrency, formatMonth } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function FundDetail() {
  const { fundType } = useParams<{ fundType: string }>();
  const navigate = useNavigate();
  const { user, userRole, isLoading: authLoading } = useAuth();

  const isTakaful = fundType === 'takaful';
  const validFundType = fundType === 'takaful' || fundType === 'plus';

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyContributions(
    validFundType ? (fundType as 'takaful' | 'plus') : 'takaful'
  );

  // Fetch total disbursed to beneficiaries for Takaful
  const { data: totalDisbursed = 0 } = useQuery({
    queryKey: ['total-disbursed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_disbursements')
        .select('amount');
      
      if (error) throw error;
      return data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
    },
    enabled: isTakaful,
  });

  // Redirect non-admins - match Dashboard pattern exactly
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (userRole !== 'admin') {
        navigate('/my-dashboard');
      }
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    if (!validFundType) {
      navigate('/dashboard');
    }
  }, [validFundType, navigate]);

  // Don't render until auth is resolved
  if (authLoading || !user || userRole !== 'admin') {
    return null;
  }

  if (!validFundType) {
    return null;
  }

  const fundStats = isTakaful ? stats?.takaful : stats?.plus;
  const isLoading = statsLoading || monthlyLoading;

  const chartData = monthlyData?.map(item => ({
    month: formatMonth(item.month),
    paid: item.totalPaid,
    pending: item.totalPending,
  })) || [];

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isLoggedIn 
        userRole="admin" 
        userName="Admin" 
        onLogout={handleLogout}
      />
      <main className="container mx-auto px-4 py-8">
        {/* Back Button & Title */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Sonhara {isTakaful ? 'Takaful' : 'Plus'}
            </h1>
            <p className="text-muted-foreground">
              {isTakaful ? 'Donation Fund - Humanitarian Assistance' : 'Investment Fund - Future Projects'}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={cn(
          'grid gap-6 mb-8',
          isTakaful ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        )}>
          <Card className={cn(
            'border-none shadow-lg',
            isTakaful ? 'bg-gradient-navy text-primary-foreground' : 'bg-gradient-gold text-navy-dark'
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium opacity-80">Total Collected</CardTitle>
              <Wallet className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32 bg-white/20" />
              ) : (
                <p className="text-2xl font-bold font-serif">
                  {formatCurrency(fundStats?.totalCollected || 0)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={cn(
            'border-none shadow-lg',
            isTakaful ? 'bg-gradient-navy text-primary-foreground' : 'bg-gradient-gold text-navy-dark'
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium opacity-80">Pending Amount</CardTitle>
              <AlertCircle className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32 bg-white/20" />
              ) : (
                <p className="text-2xl font-bold font-serif">
                  {formatCurrency(fundStats?.totalPending || 0)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={cn(
            'border-none shadow-lg',
            isTakaful ? 'bg-gradient-navy text-primary-foreground' : 'bg-gradient-gold text-navy-dark'
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium opacity-80">Active Members</CardTitle>
              <Users className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-white/20" />
              ) : (
                <p className="text-2xl font-bold font-serif">
                  {fundStats?.activeMembers || 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={cn(
            'border-none shadow-lg',
            isTakaful ? 'bg-gradient-navy text-primary-foreground' : 'bg-gradient-gold text-navy-dark'
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium opacity-80">This Month</CardTitle>
              <Calendar className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32 bg-white/20" />
              ) : (
                <p className="text-2xl font-bold font-serif">
                  {formatCurrency(fundStats?.currentMonthCollection || 0)}
                </p>
              )}
            </CardContent>
          </Card>

          {isTakaful && (
            <Card className="border-none shadow-lg bg-gradient-navy text-primary-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-80">Given to Beneficiaries</CardTitle>
                <Heart className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-32 bg-white/20" />
                ) : (
                  <p className="text-2xl font-bold font-serif">
                    {formatCurrency(totalDisbursed)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Monthly Trend Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                No payment data available yet
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value) => `₨${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`₨${value.toLocaleString()}`, '']}
                    />
                    <Bar
                      dataKey="paid"
                      name="Collected"
                      fill={isTakaful ? 'hsl(215, 60%, 22%)' : 'hsl(43, 74%, 49%)'}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="pending"
                      name="Pending"
                      fill={isTakaful ? 'hsl(215, 60%, 42%)' : 'hsl(43, 74%, 69%)'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fund Description */}
        <Card>
          <CardHeader>
            <CardTitle>About {isTakaful ? 'Sonhara Takaful' : 'Sonhara Plus'}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            {isTakaful ? (
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Sonhara Takaful</strong> is a donation-based fund where earning family members contribute monthly to support humanitarian causes within the family.
                </p>
                <p>
                  This fund is used to provide assistance for:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Funeral assistance</li>
                  <li>Children's education support</li>
                  <li>Medical treatment</li>
                  <li>Marriage and dowry support</li>
                  <li>Emergency financial help</li>
                  <li>General welfare support</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Sonhara Plus</strong> is an investment fund where all family members contribute small monthly amounts for future business projects and investments.
                </p>
                <p>
                  This fund is dedicated to:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Building family wealth through strategic investments</li>
                  <li>Funding future business ventures</li>
                  <li>Creating long-term financial security for the family</li>
                  <li>Supporting entrepreneurial initiatives within the family</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
