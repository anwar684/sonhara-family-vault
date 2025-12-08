import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRejectCase } from '@/hooks/useBeneficiaries';
import { BeneficiaryCase, Beneficiary, caseTypeLabels, caseTypeIcons } from '@/types/beneficiary';

interface RejectCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: (BeneficiaryCase & { beneficiary: Beneficiary }) | null;
}

export function RejectCaseDialog({ open, onOpenChange, caseData }: RejectCaseDialogProps) {
  const rejectCase = useRejectCase();
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;

    await rejectCase.mutateAsync({
      caseId: caseData.id,
      reason,
    });

    setReason('');
    onOpenChange(false);
  };

  if (!caseData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2 text-destructive">
            <span>{caseTypeIcons[caseData.case_type]}</span>
            Reject Request
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this assistance request
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Case</span>
              <span className="font-medium">{caseData.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Beneficiary</span>
              <span className="font-medium">{caseData.beneficiary?.name}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this request is being rejected..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={rejectCase.isPending}>
              {rejectCase.isPending ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
