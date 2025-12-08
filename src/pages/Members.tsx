import { useState } from 'react';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MemberTable } from '@/components/dashboard/MemberTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FamilyMember } from '@/types';
import { Plus, Search, Filter, UserPlus, Loader2, CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useFamilyMembers, useCreateFamilyMember, useDeleteFamilyMember } from '@/hooks/useFamilyMembers';
import { cn } from '@/lib/utils';

export default function Members() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: membersData, isLoading } = useFamilyMembers();
  const createMember = useCreateFamilyMember();
  const deleteMember = useDeleteFamilyMember();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    email: '',
    takafulAmount: '300',
    plusAmount: '1000',
    takafulJoinedDate: new Date(),
    plusJoinedDate: new Date(),
  });

  // Transform DB data to FamilyMember type
  const members: FamilyMember[] = (membersData || []).map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    email: m.email || undefined,
    status: m.status as 'active' | 'inactive',
    takafulAmount: m.takaful_amount,
    plusAmount: m.plus_amount,
    joinedDate: m.joined_date,
    avatarUrl: m.avatar_url || undefined,
  }));

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate months between joining date and now
  const calculateMonths = (joinedDate: Date) => {
    const now = new Date();
    const months = (now.getFullYear() - joinedDate.getFullYear()) * 12 + (now.getMonth() - joinedDate.getMonth());
    return Math.max(0, months);
  };

  const takafulMonths = calculateMonths(newMember.takafulJoinedDate);
  const plusMonths = calculateMonths(newMember.plusJoinedDate);
  const takafulTotal = takafulMonths * (parseFloat(newMember.takafulAmount) || 0);
  const plusTotal = plusMonths * (parseFloat(newMember.plusAmount) || 0);

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields.',
        variant: 'destructive',
      });
      return;
    }

    await createMember.mutateAsync({
      name: newMember.name,
      phone: newMember.phone,
      email: newMember.email || undefined,
      takaful_amount: parseFloat(newMember.takafulAmount) || 0,
      plus_amount: parseFloat(newMember.plusAmount) || 0,
      initial_contribution: 0,
      joined_date: format(newMember.takafulJoinedDate, 'yyyy-MM-dd'),
      takaful_joined_date: format(newMember.takafulJoinedDate, 'yyyy-MM-dd'),
      plus_joined_date: format(newMember.plusJoinedDate, 'yyyy-MM-dd'),
    });

    setIsAddModalOpen(false);
    setNewMember({ name: '', phone: '', email: '', takafulAmount: '300', plusAmount: '1000', takafulJoinedDate: new Date(), plusJoinedDate: new Date() });
  };

  const handleDeleteMember = (member: FamilyMember) => {
    deleteMember.mutate(member.id);
  };

  const handleLogout = () => navigate('/');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header isLoggedIn userRole="admin" userName="Admin" onLogout={handleLogout} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isLoggedIn userRole="admin" userName="Admin" onLogout={handleLogout} />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-navy mb-1">Family Members</h1>
              <p className="text-muted-foreground">
                Manage {members.length} family members and their contribution settings
              </p>
            </div>
            <Button variant="gold" onClick={() => setIsAddModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name, phone or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Members Table */}
          {filteredMembers.length > 0 ? (
            <MemberTable
              members={filteredMembers}
              onView={(m) => navigate(`/members/${m.id}`)}
              onEdit={(m) => toast({ title: 'Edit', description: `Edit ${m.name}` })}
              onDelete={handleDeleteMember}
            />
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No members found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Add Member Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add New Member</DialogTitle>
            <DialogDescription>
              Add a new family member to the contribution system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                placeholder="+92 300 0000000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            {/* Takaful Section */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm text-navy">Sonhara Takaful</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="takaful">Monthly Amount (PKR)</Label>
                  <Input
                    id="takaful"
                    type="number"
                    value={newMember.takafulAmount}
                    onChange={(e) => setNewMember({ ...newMember, takafulAmount: e.target.value })}
                    placeholder="300"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Joining Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newMember.takafulJoinedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newMember.takafulJoinedDate ? format(newMember.takafulJoinedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newMember.takafulJoinedDate}
                        onSelect={(date) => date && setNewMember({ ...newMember, takafulJoinedDate: date })}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total Payable: <span className="font-semibold text-foreground">{takafulMonths} months × PKR {parseFloat(newMember.takafulAmount) || 0} = PKR {takafulTotal.toLocaleString()}</span>
              </p>
            </div>

            {/* Plus Section */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm text-navy">Sonhara Plus</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plus">Monthly Amount (PKR)</Label>
                  <Input
                    id="plus"
                    type="number"
                    value={newMember.plusAmount}
                    onChange={(e) => setNewMember({ ...newMember, plusAmount: e.target.value })}
                    placeholder="1000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Joining Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newMember.plusJoinedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newMember.plusJoinedDate ? format(newMember.plusJoinedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newMember.plusJoinedDate}
                        onSelect={(date) => date && setNewMember({ ...newMember, plusJoinedDate: date })}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total Payable: <span className="font-semibold text-foreground">{plusMonths} months × PKR {parseFloat(newMember.plusAmount) || 0} = PKR {plusTotal.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleAddMember} disabled={createMember.isPending}>
              {createMember.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {createMember.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
