import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCaseDisbursements } from '@/hooks/useBeneficiaries';
import { BeneficiaryCase, Beneficiary, caseTypeLabels, caseTypeIcons, caseStatusColors } from '@/types/beneficiary';
import { formatCurrency } from '@/lib/mockData';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Calendar, Phone, MapPin } from 'lucide-react';

interface CaseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: (BeneficiaryCase & { beneficiary: Beneficiary }) | null;
}

export function CaseDetailsDialog({ open, onOpenChange, caseData }: CaseDetailsDialogProps) {
  const { data: disbursements = [] } = useCaseDisbursements(caseData?.id || '');

  if (!caseData) return null;

  const disbursementProgress = caseData.approved_amount 
    ? (Number(caseData.disbursed_amount) / Number(caseData.approved_amount)) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{caseTypeIcons[caseData.case_type]}</span>
            <div>
              <DialogTitle className="font-serif text-xl">{caseData.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={caseStatusColors[caseData.status]}>
                  {caseData.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {caseTypeLabels[caseData.case_type]}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Beneficiary Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Beneficiary
            </h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{caseData.beneficiary?.name}</span>
                {caseData.beneficiary?.is_family_member && (
                  <Badge variant="secondary" className="text-xs">Family</Badge>
                )}
              </div>
              {caseData.beneficiary?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{caseData.beneficiary.phone}</span>
                </div>
              )}
              {caseData.beneficiary?.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{caseData.beneficiary.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Financial Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Requested</p>
                <p className="text-xl font-bold">{formatCurrency(Number(caseData.requested_amount))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-bold text-green-600">
                  {caseData.approved_amount ? formatCurrency(Number(caseData.approved_amount)) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disbursed</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(Number(caseData.disbursed_amount))}
                </p>
              </div>
            </div>
            {caseData.approved_amount && (
              <div className="space-y-1">
                <Progress value={disbursementProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {disbursementProgress.toFixed(0)}% disbursed
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {caseData.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Description
              </h3>
              <p className="text-sm">{caseData.description}</p>
            </div>
          )}

          {/* Rejection Reason */}
          {caseData.status === 'rejected' && caseData.rejection_reason && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-2">
              <h3 className="font-semibold text-sm text-destructive uppercase tracking-wide">
                Rejection Reason
              </h3>
              <p className="text-sm">{caseData.rejection_reason}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Timeline
            </h3>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Requested:</span>
                <span>{format(new Date(caseData.created_at), 'PPP')}</span>
              </div>
              {caseData.approved_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Approved:</span>
                  <span>{format(new Date(caseData.approved_at), 'PPP')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Disbursements History */}
          {disbursements.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Disbursement History
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disbursements.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm">
                        {format(new Date(d.disbursement_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(d.amount))}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {d.payment_method?.replace('_', ' ') || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.reference_number || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
