export type CaseType = 'funeral' | 'education' | 'medical' | 'marriage' | 'emergency' | 'welfare';
export type CaseStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Beneficiary {
  id: string;
  family_member_id?: string;
  name: string;
  phone?: string;
  relationship?: string;
  address?: string;
  notes?: string;
  is_family_member: boolean;
  created_at: string;
  updated_at: string;
}

export interface BeneficiaryCase {
  id: string;
  beneficiary_id: string;
  requested_by?: string;
  case_type: CaseType;
  title: string;
  description?: string;
  requested_amount: number;
  approved_amount?: number;
  disbursed_amount: number;
  status: CaseStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  beneficiary?: Beneficiary;
  requester_name?: string;
  approver_name?: string;
}

export interface CaseDisbursement {
  id: string;
  case_id: string;
  amount: number;
  disbursed_by?: string;
  disbursement_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  // Joined fields
  disbursed_by_name?: string;
}

export const caseTypeLabels: Record<CaseType, string> = {
  funeral: 'Funeral Assistance',
  education: 'Education Support',
  medical: 'Medical Treatment',
  marriage: 'Marriage/Dowry Support',
  emergency: 'Emergency Help',
  welfare: 'General Welfare',
};

export const caseTypeIcons: Record<CaseType, string> = {
  funeral: '🕊️',
  education: '📚',
  medical: '🏥',
  marriage: '💒',
  emergency: '🚨',
  welfare: '🤝',
};

export const caseStatusColors: Record<CaseStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};
