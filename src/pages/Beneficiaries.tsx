import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { BeneficiaryCard } from '@/components/beneficiary/BeneficiaryCard';
import { CaseCard } from '@/components/beneficiary/CaseCard';
import { BeneficiaryStats } from '@/components/beneficiary/BeneficiaryStats';
import { AddBeneficiaryDialog } from '@/components/beneficiary/AddBeneficiaryDialog';
import { RequestAssistanceDialog } from '@/components/beneficiary/RequestAssistanceDialog';
import { ApproveCaseDialog } from '@/components/beneficiary/ApproveCaseDialog';
import { RejectCaseDialog } from '@/components/beneficiary/RejectCaseDialog';
import { DisbursementDialog } from '@/components/beneficiary/DisbursementDialog';
import { CaseDetailsDialog } from '@/components/beneficiary/CaseDetailsDialog';
import { useBeneficiaries, useBeneficiaryCases } from '@/hooks/useBeneficiaries';
import { useAuth } from '@/contexts/AuthContext';
import { BeneficiaryCase, Beneficiary, CaseStatus } from '@/types/beneficiary';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Search, Heart, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Beneficiaries() {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const isAdmin = userRole === 'admin';

  const { data: beneficiaries = [], isLoading: loadingBeneficiaries } = useBeneficiaries();
  const { data: cases = [], isLoading: loadingCases } = useBeneficiaryCases();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [addBeneficiaryOpen, setAddBeneficiaryOpen] = useState(false);
  const [requestAssistanceOpen, setRequestAssistanceOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<(BeneficiaryCase & { beneficiary: Beneficiary }) | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const filteredBeneficiaries = beneficiaries.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.beneficiary?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        isLoggedIn={!!user}
        userRole={userRole || 'member'}
        userName={user?.email?.split('@')[0] || 'User'}
        onLogout={handleLogout}
      />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-navy mb-1 flex items-center gap-2">
                <Heart className="h-8 w-8 text-gold" />
                Beneficiary Assistance
              </h1>
              <p className="text-muted-foreground">
                Manage humanitarian aid requests funded by Sonhara Takaful
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setAddBeneficiaryOpen(true)}>
                <UserPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Beneficiary</span>
              </Button>
              <Button variant="gold" size="sm" className="text-xs sm:text-sm" onClick={() => setRequestAssistanceOpen(true)}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Request Assistance</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <BeneficiaryStats />

          {/* Tabs */}
          <Tabs defaultValue="cases" className="mt-8">
            <TabsList>
              <TabsTrigger value="cases">Assistance Cases</TabsTrigger>
              <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
            </TabsList>

            {/* Cases Tab */}
            <TabsContent value="cases" className="mt-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as CaseStatus | 'all')}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loadingCases ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {cases.length === 0
                      ? 'Start by requesting assistance for someone in need.'
                      : 'No cases match your search criteria.'}
                  </p>
                  <Button variant="gold" onClick={() => setRequestAssistanceOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Request Assistance
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCases.map((caseData) => (
                    <CaseCard
                      key={caseData.id}
                      caseData={caseData}
                      isAdmin={isAdmin}
                      onView={() => {
                        setSelectedCase(caseData);
                        setDetailsDialogOpen(true);
                      }}
                      onApprove={() => {
                        setSelectedCase(caseData);
                        setApproveDialogOpen(true);
                      }}
                      onReject={() => {
                        setSelectedCase(caseData);
                        setRejectDialogOpen(true);
                      }}
                      onDisburse={() => {
                        setSelectedCase(caseData);
                        setDisburseDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Beneficiaries Tab */}
            <TabsContent value="beneficiaries" className="mt-6">
              <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search beneficiaries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loadingBeneficiaries ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : filteredBeneficiaries.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Beneficiaries Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Add beneficiaries who may need assistance.
                  </p>
                  <Button variant="gold" onClick={() => setAddBeneficiaryOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Beneficiary
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBeneficiaries.map((beneficiary) => (
                    <BeneficiaryCard key={beneficiary.id} beneficiary={beneficiary} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Dialogs */}
      <AddBeneficiaryDialog open={addBeneficiaryOpen} onOpenChange={setAddBeneficiaryOpen} />
      <RequestAssistanceDialog open={requestAssistanceOpen} onOpenChange={setRequestAssistanceOpen} />
      <ApproveCaseDialog 
        open={approveDialogOpen} 
        onOpenChange={setApproveDialogOpen} 
        caseData={selectedCase}
      />
      <RejectCaseDialog 
        open={rejectDialogOpen} 
        onOpenChange={setRejectDialogOpen} 
        caseData={selectedCase}
      />
      <DisbursementDialog 
        open={disburseDialogOpen} 
        onOpenChange={setDisburseDialogOpen} 
        caseData={selectedCase}
      />
      <CaseDetailsDialog 
        open={detailsDialogOpen} 
        onOpenChange={setDetailsDialogOpen} 
        caseData={selectedCase}
      />
    </div>
  );
}
