import { Beneficiary } from '@/types/beneficiary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, Users } from 'lucide-react';

interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
  onClick?: () => void;
}

export function BeneficiaryCard({ beneficiary, onClick }: BeneficiaryCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{beneficiary.name}</CardTitle>
          <Badge variant={beneficiary.is_family_member ? 'default' : 'secondary'}>
            {beneficiary.is_family_member ? 'Family' : 'External'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {beneficiary.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{beneficiary.phone}</span>
          </div>
        )}
        {beneficiary.relationship && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{beneficiary.relationship}</span>
          </div>
        )}
        {beneficiary.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{beneficiary.address}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
