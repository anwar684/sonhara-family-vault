import { BeneficiaryCase, Beneficiary, caseTypeLabels, caseTypeIcons, caseStatusColors } from '@/types/beneficiary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/mockData';
import { format } from 'date-fns';
import { Eye, CheckCircle, XCircle, DollarSign } from 'lucide-react';

interface CaseCardProps {
  caseData: BeneficiaryCase & { beneficiary: Beneficiary };
  isAdmin?: boolean;
  onView?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDisburse?: () => void;
}

export function CaseCard({ 
  caseData, 
  isAdmin = false, 
  onView, 
  onApprove, 
  onReject,
  onDisburse,
}: CaseCardProps) {
  const disbursementProgress = caseData.approved_amount 
    ? (Number(caseData.disbursed_amount) / Number(caseData.approved_amount)) * 100 
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{caseTypeIcons[caseData.case_type]}</span>
            <div>
              <CardTitle className="text-base font-semibold line-clamp-1">
                {caseData.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {caseData.beneficiary?.name}
              </p>
            </div>
          </div>
          <Badge className={caseStatusColors[caseData.status]}>
            {caseData.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{caseTypeLabels[caseData.case_type]}</span>
          <span className="text-muted-foreground">
            {format(new Date(caseData.created_at), 'MMM d, yyyy')}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Requested</span>
            <span className="font-medium">{formatCurrency(Number(caseData.requested_amount))}</span>
          </div>
          {caseData.approved_amount && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Approved</span>
              <span className="font-medium text-green-600">{formatCurrency(Number(caseData.approved_amount))}</span>
            </div>
          )}
          {(caseData.status === 'approved' || caseData.status === 'completed') && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disbursed</span>
                <span className="font-medium text-blue-600">{formatCurrency(Number(caseData.disbursed_amount))}</span>
              </div>
              <Progress value={disbursementProgress} className="h-2 mt-2" />
            </>
          )}
        </div>

        {caseData.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {caseData.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          
          {isAdmin && caseData.status === 'pending' && (
            <>
              <Button variant="default" size="sm" onClick={onApprove}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button variant="destructive" size="sm" onClick={onReject}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          
          {isAdmin && caseData.status === 'approved' && Number(caseData.disbursed_amount) < Number(caseData.approved_amount) && (
            <Button variant="gold" size="sm" onClick={onDisburse}>
              <DollarSign className="h-4 w-4 mr-1" />
              Disburse
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
