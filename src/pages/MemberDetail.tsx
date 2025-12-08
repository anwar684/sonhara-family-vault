import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, User, Phone, Mail, Calendar, Wallet, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch member details
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['family-member', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch member payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['member-payments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', id)
        .order('month', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleLogout = () => navigate('/');

  const isLoading = memberLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isLoggedIn userRole="admin" userName="Admin" onLogout={handleLogout} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isLoggedIn userRole="admin" userName="Admin" onLogout={handleLogout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Member not found</h2>
            <Button onClick={() => navigate('/members')}>Back to Members</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate totals
  const totalPaid = payments?.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0) || 0;
  const totalPending = payments?.reduce((sum, p) => sum + (p.status === 'pending' ? p.due_amount - p.amount : 0), 0) || 0;
  const totalContribution = (member.initial_contribution || 0) + totalPaid;

  // Group payments by fund type
  const takafulPayments = payments?.filter(p => p.fund_type === 'takaful') || [];
  const plusPayments = payments?.filter(p => p.fund_type === 'plus') || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: 'bg-success/10 text-success',
      pending: 'bg-warning/10 text-warning',
      overdue: 'bg-destructive/10 text-destructive',
    };
    return (
      <Badge className={cn('capitalize', variants[status] || 'bg-muted text-muted-foreground')}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isLoggedIn userRole="admin" userName="Admin" onLogout={handleLogout} />

      <main className="flex-1 py-8">
        <div className="container max-w-5xl">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate('/members')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>

          {/* Member Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-navy flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {member.name.charAt(0)}
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-navy">{member.name}</h1>
                <Badge
                  variant={member.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    'mt-1',
                    member.status === 'active'
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {member.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Member Info Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{member.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{member.email || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">
                      {format(new Date(member.joined_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gold/10">
                    <Wallet className="h-5 w-5 text-gold-dark" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contribution</p>
                    <p className="font-bold text-gold-dark">{formatCurrency(totalContribution)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contribution Summary */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="bg-gradient-to-br from-navy/5 to-navy/10 border-navy/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Initial Contribution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-navy">{formatCurrency(member.initial_contribution || 0)}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Amounts */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-navy">Sonhara Takaful</CardTitle>
                <CardDescription>Monthly contribution amount</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-navy">{formatCurrency(member.takaful_amount)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gold-dark">Sonhara Plus</CardTitle>
                <CardDescription>Monthly investment amount</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gold-dark">{formatCurrency(member.plus_amount)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All contributions made by this member</CardDescription>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Month</TableHead>
                        <TableHead>Fund Type</TableHead>
                        <TableHead className="text-right">Due Amount</TableHead>
                        <TableHead className="text-right">Paid Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Paid Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment, index) => (
                        <TableRow
                          key={payment.id}
                          className={cn(index % 2 === 0 ? 'bg-background' : 'bg-muted/10')}
                        >
                          <TableCell className="font-medium">{payment.month}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              payment.fund_type === 'takaful' ? 'border-navy text-navy' : 'border-gold text-gold-dark'
                            )}>
                              {payment.fund_type === 'takaful' ? 'Takaful' : 'Plus'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(payment.due_amount)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {payment.paid_date 
                              ? format(new Date(payment.paid_date), 'MMM dd, yyyy')
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment records found for this member.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}