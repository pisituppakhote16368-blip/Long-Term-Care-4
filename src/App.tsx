import React, { useState } from 'react';
import { Header } from './components/Header';
import { VisitLogTab } from './components/VisitLogTab';
import { MyVisitSummaryTab } from './components/MyVisitSummaryTab';
import { SuppliesTab } from './components/SuppliesTab';
import { CMAuditTab } from './components/CMAuditTab';
import { MonthlyReportA4Tab } from './components/MonthlyReportA4Tab';
import { ElderlyRegistryTab } from './components/ElderlyRegistryTab';
import { CGDataBackupTab } from './components/CGDataBackupTab';
import { BarthelModal } from './components/BarthelModal';
import { TaiModal } from './components/TaiModal';
import { AddElderlyModal } from './components/AddElderlyModal';
import { LoginModal } from './components/LoginModal';

import { 
  CURRENT_CAREGIVER, 
  INITIAL_ELDERLY_PATIENTS, 
  INITIAL_VISITS,
  INITIAL_STAFF_MEMBERS 
} from './data/mockData';
import { ElderlyPatient, VisitRecord, CaregiverUser, StaffMember } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('visit-log');
  const [currentRole, setCurrentRole] = useState<'caregiver' | 'care_manager' | 'director'>('caregiver');
  const [isOnline] = useState<boolean>(true);

  // Staff State & Current Authenticated Staff
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF_MEMBERS);
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(INITIAL_STAFF_MEMBERS[0]);

  // Core Persistent State
  const [currentUser, setCurrentUser] = useState<CaregiverUser>(CURRENT_CAREGIVER);
  const [patients, setPatients] = useState<ElderlyPatient[]>(INITIAL_ELDERLY_PATIENTS);
  const [visits, setVisits] = useState<VisitRecord[]>(INITIAL_VISITS);

  // Pre-selected Patient for Visit Log
  const [targetPatientIdForVisit, setTargetPatientIdForVisit] = useState<string>(
    INITIAL_ELDERLY_PATIENTS[0]?.id || ''
  );

  // Modals state
  const [isBarthelOpen, setIsBarthelOpen] = useState(false);
  const [barthelInitialScore, setBarthelInitialScore] = useState(12);
  const [onApplyBarthelCallback, setOnApplyBarthelCallback] = useState<((score: number) => void) | null>(null);

  const [isTaiOpen, setIsTaiOpen] = useState(false);
  const [onSelectTaiCallback, setOnSelectTaiCallback] = useState<((tai: string) => void) | null>(null);

  const [isAddElderlyOpen, setIsAddElderlyOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Handlers
  const handleSaveVisit = (newVisit: VisitRecord) => {
    setVisits((prev) => [newVisit, ...prev]);

    // Update patient's visit count and lastVisitDate
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === newVisit.elderlyId) {
          return {
            ...p,
            visitsThisMonth: p.visitsThisMonth + 1,
            lastVisitDate: newVisit.visitDate,
            adlScore: newVisit.adlScore,
          };
        }
        return p;
      })
    );

    // Update caregiver statistics
    setCurrentUser((prev) => ({
      ...prev,
      completedVisits: prev.completedVisits + 1,
      pendingVisits: Math.max(0, prev.pendingVisits - 1),
    }));
  };

  const handleUpdatePatient = (updatedPatient: ElderlyPatient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
  };

  const handleAddPatient = (newPatient: ElderlyPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setTargetPatientIdForVisit(newPatient.id);
  };

  const handleNavigateToVisitLog = (patientId: string) => {
    setTargetPatientIdForVisit(patientId);
    setActiveTab('visit-log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToMonthlyReport = () => {
    setActiveTab('monthly-report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBarthel = (currentScore: number, onApply: (score: number) => void) => {
    setBarthelInitialScore(currentScore);
    setOnApplyBarthelCallback(() => onApply);
    setIsBarthelOpen(true);
  };

  const handleOpenTai = (onSelect: (tai: string) => void) => {
    setOnSelectTaiCallback(() => onSelect);
    setIsTaiOpen(true);
  };

  const handleRestoreData = (restoredPatients: ElderlyPatient[], restoredVisits: VisitRecord[]) => {
    setPatients(restoredPatients);
    setVisits(restoredVisits);
  };

  // Staff Selection on Login
  const handleSelectStaff = (selectedStaff: StaffMember) => {
    setCurrentStaff(selectedStaff);
    setCurrentRole(selectedStaff.role);

    if (selectedStaff.role === 'caregiver') {
      setCurrentUser((prev) => ({
        ...prev,
        name: selectedStaff.name,
        code: selectedStaff.code,
        phone: selectedStaff.phone,
        avatarUrl: selectedStaff.avatarUrl,
        assignedVillage: selectedStaff.assignedVillage || prev.assignedVillage,
      }));
      setActiveTab('visit-log');
    } else if (selectedStaff.role === 'care_manager') {
      setActiveTab('cm-audit');
    } else if (selectedStaff.role === 'director') {
      setActiveTab('monthly-report');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-teal-200 selection:text-teal-900 font-['Sarabun',sans-serif]">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        currentRole={currentRole}
        currentStaff={currentStaff}
        onSwitchRole={(role) => {
          setCurrentRole(role);
          if (role === 'care_manager') {
            const cm = staffList.find(s => s.role === 'care_manager');
            if (cm) setCurrentStaff(cm);
          } else {
            const cg = staffList.find(s => s.role === 'caregiver');
            if (cg) setCurrentStaff(cg);
            // ถ้าเป็นสิทธิ์ CG และอยู่ในหน้า 3-7 ให้สลับกลับมาหน้า 1
            if (activeTab !== 'visit-log' && activeTab !== 'my-summary') {
              setActiveTab('visit-log');
            }
          }
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Visit Log */}
        {activeTab === 'visit-log' && (
          <VisitLogTab
            patients={patients}
            currentUser={currentUser}
            onSaveVisit={handleSaveVisit}
            onOpenBarthelModal={handleOpenBarthel}
            onOpenTaiModal={handleOpenTai}
            onOpenAddElderly={() => setIsAddElderlyOpen(true)}
            initialSelectedPatientId={targetPatientIdForVisit}
          />
        )}

        {/* Tab 2: My Performance Summary */}
        {activeTab === 'my-summary' && (
          <MyVisitSummaryTab
            currentUser={currentUser}
            patients={patients}
            onNavigateToVisitLog={handleNavigateToVisitLog}
            onNavigateToMonthlyReport={currentRole !== 'caregiver' ? handleNavigateToMonthlyReport : undefined}
          />
        )}

        {/* Tab 3: CM Audit (เฉพาะ CM และ ผอ.) */}
        {activeTab === 'cm-audit' && currentRole !== 'caregiver' && (
          <CMAuditTab
            patients={patients}
            visits={visits}
            currentUser={currentUser}
            currentRole={currentRole as any}
            onNavigateToVisitLog={handleNavigateToVisitLog}
            onViewReport={handleNavigateToMonthlyReport}
          />
        )}

        {/* Tab 4: Monthly Report A4 (เฉพาะ CM และ ผอ.) */}
        {activeTab === 'monthly-report' && currentRole !== 'caregiver' && (
          <MonthlyReportA4Tab
            patients={patients}
            visits={visits}
            currentUser={currentUser}
            currentRole={currentRole as any}
            staffList={staffList}
          />
        )}

        {/* Tab 5: Elderly Registry (เฉพาะ CM และ ผอ.) */}
        {activeTab === 'elderly-registry' && currentRole !== 'caregiver' && (
          <ElderlyRegistryTab
            patients={patients}
            currentRole={currentRole as any}
            staffList={staffList}
            onOpenAddElderly={() => setIsAddElderlyOpen(true)}
            onNavigateToVisitLog={handleNavigateToVisitLog}
            onUpdatePatient={handleUpdatePatient}
          />
        )}

        {/* Tab 6: Staff Management, Photos & Backup (เฉพาะ CM และ ผอ.) */}
        {activeTab === 'cg-data-backup' && currentRole !== 'caregiver' && (
          <CGDataBackupTab
            currentUser={currentUser}
            patients={patients}
            visits={visits}
            currentRole={currentRole}
            staffList={staffList}
            onUpdateStaffList={setStaffList}
            onUpdatePatient={handleUpdatePatient}
            onRestoreData={handleRestoreData}
          />
        )}

        {/* Tab 7: Supplies & Necessities (เฉพาะ CM และ ผอ.) */}
        {activeTab === 'supplies' && currentRole !== 'caregiver' && (
          <SuppliesTab
            patients={patients}
            currentRole={currentRole as any}
            currentUserName={currentStaff?.name || currentUser.name}
          />
        )}
      </main>

      {/* Interactive Modals */}
      <BarthelModal
        isOpen={isBarthelOpen}
        onClose={() => setIsBarthelOpen(false)}
        initialScore={barthelInitialScore}
        onApplyScore={(score) => {
          if (onApplyBarthelCallback) {
            onApplyBarthelCallback(score);
          }
        }}
      />

      <TaiModal
        isOpen={isTaiOpen}
        onClose={() => setIsTaiOpen(false)}
        onSelectTai={(taiCode) => {
          if (onSelectTaiCallback) {
            onSelectTaiCallback(taiCode);
          }
        }}
      />

      <AddElderlyModal
        isOpen={isAddElderlyOpen}
        onClose={() => setIsAddElderlyOpen(false)}
        onAdd={handleAddPatient}
        caregiverName={currentUser.name}
        caregiverId={currentUser.id}
        staffList={staffList}
      />

      {/* Login Modal with Staff Photo Click & PIN */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        staffList={staffList}
        onSelectStaff={handleSelectStaff}
      />

      {/* Global Footer (Hidden in print) */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ระบบส่งงานผู้ดูแลผู้สูงอายุ (Caregiver: CG) • โรงพยาบาลส่งเสริมสุขภาพตำบลธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร
          </span>
          <span className="text-slate-400">
            ระบบสนับสนุนการดูแลระยะยาว LTC สปสช. กรมอนามัย กระทรวงสาธารณสุข
          </span>
        </div>
      </footer>
    </div>
  );
}
