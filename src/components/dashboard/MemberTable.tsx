import { FamilyMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Eye, Phone, Mail, UserCheck, UserX } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface MemberTableProps {
  members: FamilyMember[];
  onEdit?: (member: FamilyMember) => void;
  onDelete?: (member: FamilyMember) => void;
  onView?: (member: FamilyMember) => void;
  showActions?: boolean;
}

export function MemberTable({
  members,
  onEdit,
  onDelete,
  onView,
  showActions = true,
}: MemberTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Member</TableHead>
            <TableHead className="font-semibold">Contact</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-center">Account</TableHead>
            <TableHead className="font-semibold text-right">Takaful</TableHead>
            <TableHead className="font-semibold text-right">Plus</TableHead>
            {showActions && <TableHead className="font-semibold text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member, index) => (
            <TableRow
              key={member.id}
              className={cn(
                'transition-colors hover:bg-muted/30',
                index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
              )}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-navy text-primary-foreground font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{member.email}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={member.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    member.status === 'active'
                      ? 'bg-success/10 text-success hover:bg-success/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {member.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {member.userId ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
                          <UserCheck className="h-4 w-4 text-success" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          <UserX className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      {member.userId ? 'Account linked - Can login' : 'No account - Add email to enable login'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-medium text-navy">
                  {formatCurrency(member.takafulAmount)}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-medium text-gold-dark">
                  {formatCurrency(member.plusAmount)}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onView?.(member)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit?.(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete?.(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
