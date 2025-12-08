import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PaymentHistory } from '@/components/dashboard/PaymentHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/mockData';
import { Payment, FundType } from '@/types';
import { Plus, Search, Download, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Payments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: membersData, isLoading: membersLoading } = useFamilyMembers();
  
  // Fetch payments from database
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create payment mutation
  const createPayment = useMutation({
    mutationFn: async (payment: {
      member_id: string;
      fund_type: string;
      amount: number;
      due_amount: number;
      month: string;
      status: string;
      paid_date: string;
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Payment Recorded',
        description: 'Payment has been recorded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment.',
        variant: 'destructive',
      });
    },
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [fundFilter, setFundFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    memberId: '',
    fundType: 'takaful' as FundType,
    amount: '',
    month: new Date().toISOString().slice(0, 7),
  });

  // Transform DB members to name lookup
  const members = membersData || [];
  const memberNames = members.reduce(
    (acc, m) => ({ ...acc, [m.id]: m.name }),
    {} as Record<string, string>
  );

  // Transform DB payments to Payment type
  const payments: Payment[] = (paymentsData || []).map((p) => ({
    id: p.id,
    memberId: p.member_id,
    fundType: p.fund_type as FundType,
    amount: p.amount,
    dueAmount: p.due_amount,
    month: p.month,
    paidDate: p.paid_date || undefined,
    status: p.status as 'paid' | 'pending' | 'partial',
  }));

  const filteredPayments = payments.filter((payment) => {
    const memberName = memberNames[payment.memberId]?.toLowerCase() || '';
    const matchesSearch = memberName.includes(searchQuery.toLowerCase());
    const matchesFund = fundFilter === 'all' || payment.fundType === fundFilter;
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesFund && matchesStatus;
  });

  const takafulPayments = filteredPayments.filter((p) => p.fundType === 'takaful');
  const plusPayments = filteredPayments.filter((p) => p.fundType === 'plus');

  const handleAddPayment = async () => {
    if (!newPayment.memberId || !newPayment.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const member = members.find((m) => m.id === newPayment.memberId);
    const dueAmount = newPayment.fundType === 'takaful' 
      ? member?.takaful_amount || 0 
      : member?.plus_amount || 0;
    const amount = parseFloat(newPayment.amount);

    await createPayment.mutateAsync({
      member_id: newPayment.memberId,
      fund_type: newPayment.fundType,
      amount,
      due_amount: dueAmount,
      month: newPayment.month,
      status: amount >= dueAmount ? 'paid' : amount > 0 ? 'partial' : 'pending',
      paid_date: new Date().toISOString().split('T')[0],
    });

    setIsAddModalOpen(false);
    setNewPayment({ memberId: '', fundType: 'takaful', amount: '', month: new Date().toISOString().slice(0, 7) });
  };

  const isLoading = membersLoading || paymentsLoading;

  const handleLogout = () => navigate('/');

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isLoggedIn userRole="admin" userName="Admin" onLogout={handleLogout} />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-navy mb-1">Payment Management</h1>
              <p className="text-muted-foreground">
                Track and record contributions for both funds
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="gold" onClick={() => setIsAddModalOpen(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by member name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={fundFilter} onValueChange={setFundFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                <SelectItem value="takaful">Takaful</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments by Fund */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">All ({filteredPayments.length})</TabsTrigger>
              <TabsTrigger value="takaful">Takaful ({takafulPayments.length})</TabsTrigger>
              <TabsTrigger value="plus">Plus ({plusPayments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="bg-card rounded-xl border border-border p-6">
              <PaymentHistory payments={filteredPayments} showMember memberNames={memberNames} />
            </TabsContent>

            <TabsContent value="takaful" className="bg-card rounded-xl border border-border p-6">
              <PaymentHistory payments={takafulPayments} showMember memberNames={memberNames} />
            </TabsContent>

            <TabsContent value="plus" className="bg-card rounded-xl border border-border p-6">
              <PaymentHistory payments={plusPayments} showMember memberNames={memberNames} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Add Payment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Record Payment</DialogTitle>
            <DialogDescription>
              Record a contribution payment from a family member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select Member *</Label>
              <Select
                value={newPayment.memberId}
                onValueChange={(v) => setNewPayment({ ...newPayment, memberId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.filter(m => m.status === 'active').map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Fund Type *</Label>
              <Select
                value={newPayment.fundType}
                onValueChange={(v) => setNewPayment({ ...newPayment, fundType: v as FundType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="takaful">Sonhara Takaful</SelectItem>
                  <SelectItem value="plus">Sonhara Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="month">Month *</Label>
              <Input
                id="month"
                type="month"
                value={newPayment.month}
                onChange={(e) => setNewPayment({ ...newPayment, month: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (PKR) *</Label>
              <Input
                id="amount"
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={createPayment.isPending}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleAddPayment} disabled={createPayment.isPending}>
              {createPayment.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
