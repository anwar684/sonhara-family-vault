import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MemberTable } from '@/components/dashboard/MemberTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Search, Filter, UserPlus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useFamilyMembers, useCreateFamilyMember, useDeleteFamilyMember, FamilyMemberDB } from '@/hooks/useFamilyMembers';
import { EditMemberDialog } from '@/components/members/EditMemberDialog';

export default function Members() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: membersData, isLoading } = useFamilyMembers();
  const createMember = useCreateFamilyMember();
  const deleteMember = useDeleteFamilyMember();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberDB | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    email: '',
    takafulAmount: '300',
    plusAmount: '1000',
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
    });

    setIsAddModalOpen(false);
    setNewMember({ name: '', phone: '', email: '', takafulAmount: '300', plusAmount: '1000' });
  };

  const handleEditMember = (member: FamilyMember) => {
    const dbMember = membersData?.find(m => m.id === member.id);
    if (dbMember) {
      setSelectedMember(dbMember);
      setIsEditModalOpen(true);
    }
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
              onEdit={handleEditMember}
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

      {/* Add Member Modal - Simplified */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add New Member</DialogTitle>
            <DialogDescription>
              Add a new family member. You can add more details by editing after creation.
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="takaful">Takaful Monthly (PKR)</Label>
                <Input
                  id="takaful"
                  type="number"
                  value={newMember.takafulAmount}
                  onChange={(e) => setNewMember({ ...newMember, takafulAmount: e.target.value })}
                  placeholder="300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plus">Plus Monthly (PKR)</Label>
                <Input
                  id="plus"
                  type="number"
                  value={newMember.plusAmount}
                  onChange={(e) => setNewMember({ ...newMember, plusAmount: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleAddMember} disabled={createMember.isPending}>
              {createMember.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <EditMemberDialog 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        member={selectedMember} 
      />

      <Footer />
    </div>
  );
}
