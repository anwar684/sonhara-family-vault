import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Phone, Mail, Calendar, Wallet, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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

  // Calculate totals for Takaful
  const takafulPayments = payments?.filter(p => p.fund_type === 'takaful') || [];
  const takafulPaid = takafulPayments.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0);
  const takafulPending = takafulPayments.reduce((sum, p) => sum + (p.status === 'pending' ? p.due_amount - p.amount : 0), 0);
  const takafulTotalPaid = (member.takaful_paid_before_entry || 0) + takafulPaid;
  const takafulTotalPending = (member.takaful_pending_before_entry || 0) + takafulPending;

  // Calculate totals for Plus
  const plusPayments = payments?.filter(p => p.fund_type === 'plus') || [];
  const plusPaid = plusPayments.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0);
  const plusPending = plusPayments.reduce((sum, p) => sum + (p.status === 'pending' ? p.due_amount - p.amount : 0), 0);
  const plusTotalPaid = (member.plus_paid_before_entry || 0) + plusPaid;
  const plusTotalPending = (member.plus_pending_before_entry || 0) + plusPending;

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
          <div className="grid gap-6 md:grid-cols-3 mb-8">
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
          </div>

          {/* Fund Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Takaful Summary */}
            <Card className="border-navy/20">
              <CardHeader>
                <CardTitle className="text-navy">Sonhara Takaful</CardTitle>
                <CardDescription>Monthly contribution: {formatCurrency(member.takaful_amount)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(takafulTotalPaid)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10">
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold text-warning">{formatCurrency(takafulTotalPending)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plus Summary */}
            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold-dark">Sonhara Plus</CardTitle>
                <CardDescription>Monthly investment: {formatCurrency(member.plus_amount)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(plusTotalPaid)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10">
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold text-warning">{formatCurrency(plusTotalPending)}</p>
                  </div>
                </div>
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