import { Payment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatMonth } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle, Loader2, MoreVertical, Trash2, CheckCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface PaymentHistoryProps {
  payments: Payment[];
  showMember?: boolean;
  memberNames?: Record<string, string>;
}

export function PaymentHistory({ payments, showMember = false, memberNames = {} }: PaymentHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const markAsPaid = useMutation({
    mutationFn: async (payment: Payment) => {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          amount: payment.dueAmount,
          paid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', payment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Payment Updated',
        description: 'Payment has been marked as paid.',
      });
      setLoadingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment.',
        variant: 'destructive',
      });
      setLoadingId(null);
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Payment Deleted',
        description: 'Payment record has been deleted.',
      });
      setLoadingId(null);
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete payment.',
        variant: 'destructive',
      });
      setLoadingId(null);
    },
  });

  const handleMarkAsPaid = (payment: Payment) => {
    setLoadingId(payment.id);
    markAsPaid.mutate(payment);
  };

  const handleDeleteClick = (payment: Payment) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (paymentToDelete) {
      setLoadingId(paymentToDelete.id);
      deletePayment.mutate(paymentToDelete.id);
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      paid: 'bg-success/10 text-success',
      partial: 'bg-warning/10 text-warning',
      pending: 'bg-muted text-muted-foreground',
    };

    return (
      <Badge className={cn('capitalize', variants[status])}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className={cn(
            'flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md',
            payment.status === 'paid' && 'border-success/20 bg-success/5',
            payment.status === 'partial' && 'border-warning/20 bg-warning/5',
            payment.status === 'pending' && 'border-border bg-card'
          )}
        >
          <div className="flex items-center gap-4">
            {getStatusIcon(payment.status)}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatMonth(payment.month)}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    payment.fundType === 'takaful'
                      ? 'bg-navy/10 text-navy'
                      : 'bg-gold/20 text-gold-dark'
                  )}
                >
                  {payment.fundType === 'takaful' ? 'Takaful' : 'Plus'}
                </span>
              </div>
              {showMember && memberNames[payment.memberId] && (
                <p className="text-sm text-muted-foreground">
                  {memberNames[payment.memberId]}
                </p>
              )}
              {payment.paidDate && (
                <p className="text-xs text-muted-foreground">
                  Paid on {new Date(payment.paidDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold">
                {formatCurrency(payment.amount)}
                <span className="text-muted-foreground font-normal">
                  {' '}/ {formatCurrency(payment.dueAmount)}
                </span>
              </p>
              {payment.status !== 'paid' && (
                <p className="text-sm text-destructive">
                  Pending: {formatCurrency(payment.dueAmount - payment.amount)}
                </p>
              )}
            </div>
            {getStatusBadge(payment.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loadingId === payment.id}>
                  {loadingId === payment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {payment.status === 'pending' && (
                  <DropdownMenuItem onClick={() => handleMarkAsPaid(payment)}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => handleDeleteClick(payment)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record for {paymentToDelete && formatMonth(paymentToDelete.month)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
