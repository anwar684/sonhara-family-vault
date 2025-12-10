import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Loader2, UserCheck, Key, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FamilyMemberDB, useUpdateFamilyMember } from '@/hooks/useFamilyMembers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: FamilyMemberDB | null;
}

export function EditMemberDialog({ open, onOpenChange, member }: EditMemberDialogProps) {
  const updateMember = useUpdateFamilyMember();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'active',
    takafulAmount: '',
    plusAmount: '',
    takafulJoinedDate: new Date(),
    plusJoinedDate: new Date(),
    takafulPaidBefore: '',
    takafulPendingBefore: '',
    plusPaidBefore: '',
    plusPendingBefore: '',
  });

  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        phone: member.phone,
        email: member.email || '',
        status: member.status,
        takafulAmount: member.takaful_amount.toString(),
        plusAmount: member.plus_amount.toString(),
        takafulJoinedDate: member.takaful_joined_date ? new Date(member.takaful_joined_date) : new Date(),
        plusJoinedDate: member.plus_joined_date ? new Date(member.plus_joined_date) : new Date(),
        takafulPaidBefore: (member.takaful_paid_before_entry || 0).toString(),
        takafulPendingBefore: (member.takaful_pending_before_entry || 0).toString(),
        plusPaidBefore: (member.plus_paid_before_entry || 0).toString(),
        plusPendingBefore: (member.plus_pending_before_entry || 0).toString(),
      });
      setAccountEmail(member.email || '');
      setAccountPassword('');
    }
  }, [member]);

  const handleCreateAccount = async () => {
    if (!member || !accountEmail || !accountPassword) {
      toast({ title: 'Error', description: 'Email and password are required', variant: 'destructive' });
      return;
    }

    if (accountPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setCreatingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-member-account', {
        body: {
          email: accountEmail,
          password: accountPassword,
          memberId: member.id,
          fullName: member.name,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({ title: 'Success', description: 'Login credentials created successfully' });
      setAccountPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create account';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleSave = async () => {
    if (!member) return;

    await updateMember.mutateAsync({
      id: member.id,
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      status: formData.status,
      takaful_amount: parseFloat(formData.takafulAmount) || 0,
      plus_amount: parseFloat(formData.plusAmount) || 0,
      takaful_joined_date: format(formData.takafulJoinedDate, 'yyyy-MM-dd'),
      plus_joined_date: format(formData.plusJoinedDate, 'yyyy-MM-dd'),
      takaful_paid_before_entry: parseFloat(formData.takafulPaidBefore) || 0,
      takaful_pending_before_entry: parseFloat(formData.takafulPendingBefore) || 0,
      plus_paid_before_entry: parseFloat(formData.plusPaidBefore) || 0,
      plus_pending_before_entry: parseFloat(formData.plusPendingBefore) || 0,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Edit Member</DialogTitle>
          <DialogDescription>
            Update member details and contribution history.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Takaful Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm text-navy">Sonhara Takaful</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Monthly Amount (PKR)</Label>
                <Input
                  type="number"
                  value={formData.takafulAmount}
                  onChange={(e) => setFormData({ ...formData, takafulAmount: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Joining Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.takafulJoinedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.takafulJoinedDate}
                      onSelect={(date) => date && setFormData({ ...formData, takafulJoinedDate: date })}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Paid Before Entry (PKR)</Label>
                <Input
                  type="number"
                  value={formData.takafulPaidBefore}
                  onChange={(e) => setFormData({ ...formData, takafulPaidBefore: e.target.value })}
                  placeholder="Amount paid before adding to system"
                />
              </div>
              <div className="grid gap-2">
                <Label>Pending Before Entry (PKR)</Label>
                <Input
                  type="number"
                  value={formData.takafulPendingBefore}
                  onChange={(e) => setFormData({ ...formData, takafulPendingBefore: e.target.value })}
                  placeholder="Amount pending before adding to system"
                />
              </div>
            </div>
          </div>

          {/* Plus Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm text-gold-dark">Sonhara Plus</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Monthly Amount (PKR)</Label>
                <Input
                  type="number"
                  value={formData.plusAmount}
                  onChange={(e) => setFormData({ ...formData, plusAmount: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Joining Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.plusJoinedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.plusJoinedDate}
                      onSelect={(date) => date && setFormData({ ...formData, plusJoinedDate: date })}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Paid Before Entry (PKR)</Label>
                <Input
                  type="number"
                  value={formData.plusPaidBefore}
                  onChange={(e) => setFormData({ ...formData, plusPaidBefore: e.target.value })}
                  placeholder="Amount paid before adding to system"
                />
              </div>
              <div className="grid gap-2">
                <Label>Pending Before Entry (PKR)</Label>
                <Input
                  type="number"
                  value={formData.plusPendingBefore}
                  onChange={(e) => setFormData({ ...formData, plusPendingBefore: e.target.value })}
                  placeholder="Amount pending before adding to system"
                />
              </div>
            </div>
          </div>

          {/* Login Credentials Section */}
          <div className="space-y-4 p-4 border-2 border-dashed border-primary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm text-primary">Login Credentials</h4>
              {member?.user_id && (
                <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                  <UserCheck className="h-3 w-3" />
                  Account Active
                </span>
              )}
            </div>
            
            {member?.user_id ? (
              <p className="text-sm text-muted-foreground">
                This member has an active login account. They can login using their credentials.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Create login credentials for this member to access their dashboard.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Login Email *</Label>
                    <Input
                      type="email"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      placeholder="member@email.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder="Min 6 characters"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateAccount} 
                  disabled={creatingAccount || !accountEmail || !accountPassword}
                  className="w-full"
                >
                  {creatingAccount && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Login Credentials
                </Button>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMember.isPending}>
            {updateMember.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
