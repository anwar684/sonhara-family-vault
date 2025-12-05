export type FundType = 'takaful' | 'plus';

export type MemberStatus = 'active' | 'inactive';

export type UserRole = 'admin' | 'member';

export interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: MemberStatus;
  takafulAmount: number;
  plusAmount: number;
  joinedDate: string;
  avatarUrl?: string;
  userId?: string;
}

export interface Payment {
  id: string;
  memberId: string;
  fundType: FundType;
  amount: number;
  dueAmount: number;
  month: string; // Format: YYYY-MM
  paidDate?: string;
  status: 'paid' | 'partial' | 'pending';
  notes?: string;
}

export interface MonthlyContribution {
  month: string;
  fundType: FundType;
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  memberCount: number;
}

export interface MemberSummary {
  memberId: string;
  memberName: string;
  fundType: FundType;
  totalPaid: number;
  totalPending: number;
  pendingMonths: string[];
  lastPaymentDate?: string;
}

export interface FundSummary {
  fundType: FundType;
  totalCollected: number;
  totalPending: number;
  activeMembers: number;
  currentMonthCollection: number;
  currentMonthPending: number;
}

export interface DashboardStats {
  takaful: FundSummary;
  plus: FundSummary;
  totalMembers: number;
  activeMembers: number;
}
