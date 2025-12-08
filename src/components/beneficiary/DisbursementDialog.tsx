import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddDisbursement, useCompleteCase } from '@/hooks/useBeneficiaries';
import { useAuth } from '@/contexts/AuthContext';
import { BeneficiaryCase, Beneficiary, caseTypeLabels, caseTypeIcons } from '@/types/beneficiary';
import { formatCurrency } from '@/lib/mockData';
import { Progress } from '@/components/ui/progress';

interface DisbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: (BeneficiaryCase & { beneficiary: Beneficiary }) | null;
}

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money (JazzCash/EasyPaisa)' },
  { value: 'cheque', label: 'Cheque' },
];

export function DisbursementDialog({ open, onOpenChange, caseData }: DisbursementDialogProps) {
  const { user } = useAuth();
  const addDisbursement = useAddDisbursement();
  const completeCase = useCompleteCase();

  const [formData, setFormData] = useState({
    amount: '',
    payment_method: '',
    reference_number: '',
    notes: '',
  });

  const remainingAmount = caseData 
    ? Number(caseData.approved_amount) - Number(caseData.disbursed_amount)
    : 0;

  const disbursementProgress = caseData?.approved_amount 
    ? (Number(caseData.disbursed_amount) / Number(caseData.approved_amount)) * 100 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !caseData) return;

    await addDisbursement.mutateAsync({
      case_id: caseData.id,
      amount: parseFloat(formData.amount),
      disbursed_by: user.id,
      payment_method: formData.payment_method,
      reference_number: formData.reference_number,
      notes: formData.notes,
    });

    // Check if fully disbursed
    const newTotal = Number(caseData.disbursed_amount) + parseFloat(formData.amount);
    if (newTotal >= Number(caseData.approved_amount)) {
      await completeCase.mutateAsync(caseData.id);
    }

    setFormData({
      amount: '',
      payment_method: '',
      reference_number: '',
      notes: '',
    });
    onOpenChange(false);
  };

  if (!caseData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <span>{caseTypeIcons[caseData.case_type]}</span>
            Record Disbursement
          </DialogTitle>
          <DialogDescription>
            Record a payment for {caseData.beneficiary?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Approved Amount</span>
              <span className="font-bold">{formatCurrency(Number(caseData.approved_amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Already Disbursed</span>
              <span className="font-medium text-blue-600">{formatCurrency(Number(caseData.disbursed_amount))}</span>
            </div>
            <Progress value={disbursementProgress} className="h-2" />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <span className="font-bold text-green-600">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  min="0"
                  max={remainingAmount}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="Transaction ID or reference"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this payment..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold" disabled={addDisbursement.isPending}>
                {addDisbursement.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
