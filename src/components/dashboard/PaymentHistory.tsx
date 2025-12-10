import { Payment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatMonth } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface PaymentHistoryProps {
  payments: Payment[];
  showMember?: boolean;
  memberNames?: Record<string, string>;
}

export function PaymentHistory({ payments, showMember = false, memberNames = {} }: PaymentHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [markingPaymentId, setMarkingPaymentId] = useState<string | null>(null);

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
      setMarkingPaymentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment.',
        variant: 'destructive',
      });
      setMarkingPaymentId(null);
    },
  });

  const handleMarkAsPaid = (payment: Payment) => {
    setMarkingPaymentId(payment.id);
    markAsPaid.mutate(payment);
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
            {payment.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAsPaid(payment)}
                disabled={markingPaymentId === payment.id}
              >
                {markingPaymentId === payment.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Mark Paid'
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
