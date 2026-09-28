export type LTCGroup = 1 | 2 | 3 | 4;

export interface ElderlyPatient {
  id: string;
  citizenId: string;
  name: string;
  age: number;
  gender: 'ชาย' | 'หญิง';
  address: string;
  villageNo: string;
  villageName: string;
  ltcGroup: LTCGroup;
  taiScore: string;
  adlScore: number;
  chronicDiseases: string[];
  caregiverId: string;
  caregiverName: string;
  phone: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  avatarUrl: string;
  lastVisitDate: string;
  monthlyQuota: number;
  visitsThisMonth: number;
  targetVisitsPerMonth: number;
  status?: 'active' | 'discharged' | 'deceased';
  statusDate?: string;
  statusReason?: string;
  fiscalYear?: string;
}

export interface VisitRecord {
  id: string;
  elderlyId: string;
  elderlyName: string;
  elderlyAge: number;
  elderlyGroup: LTCGroup;
  caregiverId: string;
  caregiverName: string;
  visitDate: string;
  visitTime: string;
  weight?: number;
  height?: number;
  bmi?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  pulse?: number;
  spo2?: number;
  temp?: number;
  adlScore: number;
  taiCategory: string;
  chronicSelected: string[];
  physicalFindings: string[];
  examNotes: string;
  carePlan: string;
  photos: string[];
  coordinates: {
    lat: number;
    lng: number;
    accuracy: number;
    address: string;
  };
  caregiverSignature: string;
  status: 'draft' | 'submitted' | 'approved';
  submittedAt: string;
  cmReviewStatus?: 'pending' | 'approved' | 'need_correction';
  cmReviewComment?: string;
  cmReviewedAt?: string;
}

export interface CaregiverUser {
  id: string;
  code: string;
  name: string;
  role: 'caregiver' | 'care_manager' | 'director' | 'admin';
  position?: string;
  phone: string;
  hospital: string;
  subdistrict: string;
  district: string;
  province: string;
  assignedVillage: string;
  avatarUrl: string;
  password?: string;
  targetPatients: number;
  totalVisitQuota: number;
  completedVisits: number;
  pendingVisits: number;
}

export interface StaffMember {
  id: string;
  code: string;
  name: string;
  role: 'caregiver' | 'care_manager' | 'director';
  position: string;
  phone: string;
  hospital?: string;
  assignedArea?: string;
  assignedVillage?: string;
  avatarUrl: string;
  password?: string;
  targetPatients?: number;
}

export type TabType = 
  | 'visit_log'
  | 'performance_summary'
  | 'supplies'
  | 'cm_audit'
  | 'monthly_report_a4'
  | 'elderly_registry'
  | 'cg_data_backup';

export interface SupplyItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  allocated: number;
  description?: string;
  recommendedDiseases?: string[];
}

export interface SupplyDistributionRecord {
  id: string;
  patientId: string;
  patientName: string;
  supplyId: string;
  supplyName: string;
  quantity: number;
  unit: string;
  date: string;
  receiver: string;
  giverName: string;
  note?: string;
}

export interface BarthelQuestion {
  id: number;
  name: string;
  description: string;
  options: {
    score: number;
    text: string;
  }[];
}

// รายการปีงบประมาณ ครอบคลุมตั้งแต่ปี 2568 ถึง 2700
export const FISCAL_YEARS_LIST: string[] = Array.from(
  { length: 2700 - 2568 + 1 },
  (_, i) => (2568 + i).toString()
);
