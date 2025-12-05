import { FamilyMember, Payment, DashboardStats, MonthlyContribution, MemberSummary } from '@/types';

export const mockMembers: FamilyMember[] = [
  {
    id: '1',
    name: 'Ahmed Khan',
    phone: '+92 300 1234567',
    email: 'ahmed@example.com',
    status: 'active',
    takafulAmount: 5000,
    plusAmount: 2000,
    joinedDate: '2024-01-01',
  },
  {
    id: '2',
    name: 'Fatima Begum',
    phone: '+92 301 2345678',
    email: 'fatima@example.com',
    status: 'active',
    takafulAmount: 3000,
    plusAmount: 1500,
    joinedDate: '2024-01-01',
  },
  {
    id: '3',
    name: 'Hassan Ali',
    phone: '+92 302 3456789',
    email: 'hassan@example.com',
    status: 'active',
    takafulAmount: 4000,
    plusAmount: 2000,
    joinedDate: '2024-02-01',
  },
  {
    id: '4',
    name: 'Zainab Malik',
    phone: '+92 303 4567890',
    email: 'zainab@example.com',
    status: 'inactive',
    takafulAmount: 2500,
    plusAmount: 1000,
    joinedDate: '2024-01-15',
  },
  {
    id: '5',
    name: 'Omar Farooq',
    phone: '+92 304 5678901',
    email: 'omar@example.com',
    status: 'active',
    takafulAmount: 6000,
    plusAmount: 3000,
    joinedDate: '2024-03-01',
  },
];

export const mockPayments: Payment[] = [
  // Ahmed's payments
  { id: 'p1', memberId: '1', fundType: 'takaful', amount: 5000, dueAmount: 5000, month: '2024-01', paidDate: '2024-01-15', status: 'paid' },
  { id: 'p2', memberId: '1', fundType: 'plus', amount: 2000, dueAmount: 2000, month: '2024-01', paidDate: '2024-01-15', status: 'paid' },
  { id: 'p3', memberId: '1', fundType: 'takaful', amount: 5000, dueAmount: 5000, month: '2024-02', paidDate: '2024-02-10', status: 'paid' },
  { id: 'p4', memberId: '1', fundType: 'plus', amount: 2000, dueAmount: 2000, month: '2024-02', paidDate: '2024-02-10', status: 'paid' },
  { id: 'p5', memberId: '1', fundType: 'takaful', amount: 3000, dueAmount: 5000, month: '2024-03', status: 'partial' },
  { id: 'p6', memberId: '1', fundType: 'plus', amount: 0, dueAmount: 2000, month: '2024-03', status: 'pending' },
  
  // Fatima's payments
  { id: 'p7', memberId: '2', fundType: 'takaful', amount: 3000, dueAmount: 3000, month: '2024-01', paidDate: '2024-01-20', status: 'paid' },
  { id: 'p8', memberId: '2', fundType: 'plus', amount: 1500, dueAmount: 1500, month: '2024-01', paidDate: '2024-01-20', status: 'paid' },
  { id: 'p9', memberId: '2', fundType: 'takaful', amount: 3000, dueAmount: 3000, month: '2024-02', paidDate: '2024-02-18', status: 'paid' },
  { id: 'p10', memberId: '2', fundType: 'plus', amount: 1500, dueAmount: 1500, month: '2024-02', paidDate: '2024-02-18', status: 'paid' },
  { id: 'p11', memberId: '2', fundType: 'takaful', amount: 3000, dueAmount: 3000, month: '2024-03', paidDate: '2024-03-15', status: 'paid' },
  { id: 'p12', memberId: '2', fundType: 'plus', amount: 1500, dueAmount: 1500, month: '2024-03', paidDate: '2024-03-15', status: 'paid' },
  
  // Hassan's payments
  { id: 'p13', memberId: '3', fundType: 'takaful', amount: 4000, dueAmount: 4000, month: '2024-02', paidDate: '2024-02-25', status: 'paid' },
  { id: 'p14', memberId: '3', fundType: 'plus', amount: 2000, dueAmount: 2000, month: '2024-02', paidDate: '2024-02-25', status: 'paid' },
  { id: 'p15', memberId: '3', fundType: 'takaful', amount: 0, dueAmount: 4000, month: '2024-03', status: 'pending' },
  { id: 'p16', memberId: '3', fundType: 'plus', amount: 0, dueAmount: 2000, month: '2024-03', status: 'pending' },
  
  // Omar's payments
  { id: 'p17', memberId: '5', fundType: 'takaful', amount: 6000, dueAmount: 6000, month: '2024-03', paidDate: '2024-03-05', status: 'paid' },
  { id: 'p18', memberId: '5', fundType: 'plus', amount: 3000, dueAmount: 3000, month: '2024-03', paidDate: '2024-03-05', status: 'paid' },
];

export const getDashboardStats = (): DashboardStats => {
  const activeMembers = mockMembers.filter(m => m.status === 'active');
  
  const takafulPayments = mockPayments.filter(p => p.fundType === 'takaful');
  const plusPayments = mockPayments.filter(p => p.fundType === 'plus');
  
  const currentMonth = '2024-03';
  
  return {
    takaful: {
      fundType: 'takaful',
      totalCollected: takafulPayments.reduce((sum, p) => sum + p.amount, 0),
      totalPending: takafulPayments.reduce((sum, p) => sum + (p.dueAmount - p.amount), 0),
      activeMembers: activeMembers.length,
      currentMonthCollection: takafulPayments.filter(p => p.month === currentMonth).reduce((sum, p) => sum + p.amount, 0),
      currentMonthPending: takafulPayments.filter(p => p.month === currentMonth).reduce((sum, p) => sum + (p.dueAmount - p.amount), 0),
    },
    plus: {
      fundType: 'plus',
      totalCollected: plusPayments.reduce((sum, p) => sum + p.amount, 0),
      totalPending: plusPayments.reduce((sum, p) => sum + (p.dueAmount - p.amount), 0),
      activeMembers: activeMembers.length,
      currentMonthCollection: plusPayments.filter(p => p.month === currentMonth).reduce((sum, p) => sum + p.amount, 0),
      currentMonthPending: plusPayments.filter(p => p.month === currentMonth).reduce((sum, p) => sum + (p.dueAmount - p.amount), 0),
    },
    totalMembers: mockMembers.length,
    activeMembers: activeMembers.length,
  };
};

export const getMonthlyContributions = (fundType: 'takaful' | 'plus'): MonthlyContribution[] => {
  const months = ['2024-01', '2024-02', '2024-03'];
  return months.map(month => {
    const monthPayments = mockPayments.filter(p => p.fundType === fundType && p.month === month);
    return {
      month,
      fundType,
      totalDue: monthPayments.reduce((sum, p) => sum + p.dueAmount, 0),
      totalPaid: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      totalPending: monthPayments.reduce((sum, p) => sum + (p.dueAmount - p.amount), 0),
      memberCount: monthPayments.length,
    };
  });
};

export const getMemberSummary = (memberId: string): { takaful: MemberSummary; plus: MemberSummary } => {
  const member = mockMembers.find(m => m.id === memberId);
  const memberPayments = mockPayments.filter(p => p.memberId === memberId);
  
  const takafulPayments = memberPayments.filter(p => p.fundType === 'takaful');
  const plusPayments = memberPayments.filter(p => p.fundType === 'plus');
  
  return {
    takaful: {
      memberId,
      memberName: member?.name || '',
      fundType: 'takaful',
      totalPaid: takafulPayments.reduce((sum, p) => sum + p.amount, 0),
      totalPending: takafulPayments.reduce((sum, p) => sum + (p.dueAmount - p.amount), 0),
      pendingMonths: takafulPayments.filter(p => p.status !== 'paid').map(p => p.month),
      lastPaymentDate: takafulPayments.filter(p => p.paidDate).sort((a, b) => (b.paidDate || '').localeCompare(a.paidDate || ''))[0]?.paidDate,
    },
    plus: {
      memberId,
      memberName: member?.name || '',
      fundType: 'plus',
      totalPaid: plusPayments.reduce((sum, p) => sum + p.amount, 0),
      totalPending: plusPayments.reduce((sum, p) => sum + (p.dueAmount - p.amount), 0),
      pendingMonths: plusPayments.filter(p => p.status !== 'paid').map(p => p.month),
      lastPaymentDate: plusPayments.filter(p => p.paidDate).sort((a, b) => (b.paidDate || '').localeCompare(a.paidDate || ''))[0]?.paidDate,
    },
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
