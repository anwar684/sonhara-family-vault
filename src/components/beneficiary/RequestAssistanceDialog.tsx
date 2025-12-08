import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCase, useBeneficiaries } from '@/hooks/useBeneficiaries';
import { useAuth } from '@/contexts/AuthContext';
import { CaseType, caseTypeLabels, caseTypeIcons } from '@/types/beneficiary';

interface RequestAssistanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedBeneficiaryId?: string;
}

export function RequestAssistanceDialog({ 
  open, 
  onOpenChange,
  preselectedBeneficiaryId,
}: RequestAssistanceDialogProps) {
  const { user } = useAuth();
  const { data: beneficiaries = [] } = useBeneficiaries();
  const createCase = useCreateCase();

  const [formData, setFormData] = useState({
    beneficiary_id: preselectedBeneficiaryId || '',
    case_type: '' as CaseType,
    title: '',
    description: '',
    requested_amount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await createCase.mutateAsync({
      beneficiary_id: formData.beneficiary_id,
      case_type: formData.case_type,
      title: formData.title,
      description: formData.description,
      requested_amount: parseFloat(formData.requested_amount),
      requested_by: user.id,
    });

    setFormData({
      beneficiary_id: '',
      case_type: '' as CaseType,
      title: '',
      description: '',
      requested_amount: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Request Assistance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="beneficiary">Select Beneficiary *</Label>
            <Select
              value={formData.beneficiary_id}
              onValueChange={(value) => setFormData({ ...formData, beneficiary_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a beneficiary" />
              </SelectTrigger>
              <SelectContent>
                {beneficiaries.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} {b.is_family_member ? '(Family)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_type">Assistance Type *</Label>
            <Select
              value={formData.case_type}
              onValueChange={(value) => setFormData({ ...formData, case_type: value as CaseType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type of assistance" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(caseTypeLabels) as CaseType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span>{caseTypeIcons[type]}</span>
                      <span>{caseTypeLabels[type]}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Medical treatment for Ahmed"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requested_amount">Requested Amount (PKR) *</Label>
            <Input
              id="requested_amount"
              type="number"
              value={formData.requested_amount}
              onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
              placeholder="Enter amount"
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about the assistance needed..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="gold" 
              disabled={createCase.isPending || !formData.beneficiary_id || !formData.case_type}
            >
              {createCase.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
