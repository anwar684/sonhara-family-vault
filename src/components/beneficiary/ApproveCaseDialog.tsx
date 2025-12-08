import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApproveCase } from '@/hooks/useBeneficiaries';
import { useAuth } from '@/contexts/AuthContext';
import { BeneficiaryCase, Beneficiary, caseTypeLabels, caseTypeIcons } from '@/types/beneficiary';
import { formatCurrency } from '@/lib/mockData';

interface ApproveCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: (BeneficiaryCase & { beneficiary: Beneficiary }) | null;
}

export function ApproveCaseDialog({ open, onOpenChange, caseData }: ApproveCaseDialogProps) {
  const { user } = useAuth();
  const approveCase = useApproveCase();
  const [approvedAmount, setApprovedAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !caseData) return;

    await approveCase.mutateAsync({
      caseId: caseData.id,
      approvedAmount: parseFloat(approvedAmount),
      approverId: user.id,
    });

    setApprovedAmount('');
    onOpenChange(false);
  };

  if (!caseData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <span>{caseTypeIcons[caseData.case_type]}</span>
            Approve Request
          </DialogTitle>
          <DialogDescription>
            Review and approve the assistance request for {caseData.beneficiary?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Case Type</span>
              <span className="font-medium">{caseTypeLabels[caseData.case_type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Beneficiary</span>
              <span className="font-medium">{caseData.beneficiary?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Requested Amount</span>
              <span className="font-bold text-lg">{formatCurrency(Number(caseData.requested_amount))}</span>
            </div>
          </div>

          {caseData.description && (
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Description</Label>
              <p className="text-sm">{caseData.description}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approved_amount">Approved Amount (PKR) *</Label>
              <Input
                id="approved_amount"
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder={caseData.requested_amount.toString()}
                min="0"
                max={caseData.requested_amount}
                required
              />
              <p className="text-xs text-muted-foreground">
                This amount will be funded from Sonhara Takaful
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold" disabled={approveCase.isPending}>
                {approveCase.isPending ? 'Approving...' : 'Approve Request'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
