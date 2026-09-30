import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  UserCheck, 
  AlertTriangle, 
  Send, 
  PlusCircle, 
  FileText, 
  Eye, 
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  ShieldAlert,
  Lock,
  Trash2,
  Minus,
  MinusCircle,
  X,
  RotateCcw,
  Activity,
  Heart
} from 'lucide-react';
import { ElderlyPatient, VisitRecord, CaregiverUser } from '../types';

interface CMAuditTabProps {
  patients: ElderlyPatient[];
  visits: VisitRecord[];
  currentUser: CaregiverUser;
  currentRole: 'caregiver' | 'care_manager' | 'director' | 'admin';
  onNavigateToVisitLog: (patientId: string) => void;
  onViewReport: () => void;
  onDeleteVisit?: (visitId: string, elderlyId: string) => void;
  onUpdatePatientVisits?: (patientId: string, newCount: number) => void;
}

export const CMAuditTab: React.FC<CMAuditTabProps> = ({
  patients,
  visits,
  currentUser,
  currentRole,
  onNavigateToVisitLog,
  onViewReport,
  onDeleteVisit,
  onUpdatePatientVisits,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('กันยายน 2569');
  const [isAudited, setIsAudited] = useState(false);
  const [cmNotes, setCmNotes] = useState(
    'การลงพื้นที่บันทึกสัญญาณชีพและการดูแลแผลกดทับทำได้ดี ขอให้เร่งเยี่ยมผู้ป่วยติดเตียงกลุ่ม 4 (นายประเสริฐ) ให้ครบ 7 ครั้งตามเกณฑ์ก่อนสิ้นเดือน'
  );
  const [lineAlertSent, setLineAlertSent] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [selectedPatientForDelete, setSelectedPatientForDelete] = useState<ElderlyPatient | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);

  // Filter CG assigned patients, fallback to all patients if none match
  const cgPatients = patients.filter((p) => p.caregiverId === currentUser.id);
  const displayedPatients = cgPatients.length > 0 ? cgPatients : patients;

  const totalTargetVisits = displayedPatients.reduce((sum, p) => sum + p.targetVisitsPerMonth, 0);
  const totalCompletedVisits = displayedPatients.reduce((sum, p) => sum + p.visitsThisMonth, 0);
  const pendingElderlyCount = displayedPatients.filter((p) => p.visitsThisMonth < p.targetVisitsPerMonth).length;

  const showToast = (message: string) => {
    setDeleteToast(message);
    setTimeout(() => {
      setDeleteToast((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  const handleQuickDecrement = (patient: ElderlyPatient, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentRole === 'caregiver' || patient.visitsThisMonth <= 0) return;
    const newCount = Math.max(0, patient.visitsThisMonth - 1);
    if (onUpdatePatientVisits) {
      onUpdatePatientVisits(patient.id, newCount);
    }
    showToast(`✓ ลบจำนวนการเยี่ยมของ ${patient.name} เรียบร้อย (คงเหลือ ${newCount} ครั้ง)`);
    if (selectedPatientForDelete && selectedPatientForDelete.id === patient.id) {
      if (newCount === 0) {
        setSelectedPatientForDelete(null);
      } else {
        setSelectedPatientForDelete({ ...selectedPatientForDelete, visitsThisMonth: newCount });
      }
    }
  };

  const handleDeleteSpecificVisit = (visitId: string, patient: ElderlyPatient) => {
    if (currentRole === 'caregiver') return;
    if (onDeleteVisit) {
      onDeleteVisit(visitId, patient.id);
    }
    const newCount = Math.max(0, patient.visitsThisMonth - 1);
    showToast(`✓ ลบประวัติการเยี่ยมของ ${patient.name} สำเร็จ (คงเหลือ ${newCount} ครั้ง)`);
    if (selectedPatientForDelete && selectedPatientForDelete.id === patient.id) {
      if (newCount === 0) {
        setSelectedPatientForDelete(null);
      } else {
        setSelectedPatientForDelete({ ...selectedPatientForDelete, visitsThisMonth: newCount });
      }
    }
  };

  const handleResetVisits = (patient: ElderlyPatient) => {
    if (currentRole === 'caregiver') return;
    if (onUpdatePatientVisits) {
      onUpdatePatientVisits(patient.id, 0);
    }
    setConfirmResetId(null);
    setSelectedPatientForDelete(null);
    showToast(`✓ ล้างจำนวนการเยี่ยมของ ${patient.name} เป็น 0 ครั้งเรียบร้อย`);
  };

  const handleSendLine = () => {
    if (currentRole === 'caregiver') return;
    setLineAlertSent(true);
    setTimeout(() => setLineAlertSent(false), 3500);
  };

  const handleToggleAudit = () => {
    if (currentRole === 'caregiver') return;
    setIsAudited(!isAudited);
  };

  // Get active visits for modal if a patient is selected
  const activePatientVisits = selectedPatientForDelete
    ? visits.filter((v) => v.elderlyId === selectedPatientForDelete.id)
    : [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Read-Only Banner for Caregiver role */}
      {currentRole === 'caregiver' && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-amber-900 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-sm text-amber-950 font-['Prompt',sans-serif] flex items-center gap-2">
              <span>โหมดดูข้อมูลอย่างเดียว (Read-Only)</span>
              <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">สิทธิ์ CG</span>
            </h4>
            <p className="mt-1 text-amber-800 leading-relaxed">
              สิทธิ์ของคุณคือ <strong>Caregiver (CG)</strong> สามารถเข้าดูสถิติการลงเยี่ยมและคำแนะนำจากพยาบาล Care Manager (CM) ได้ แต่ไม่สามารถแก้ไขสถานะตรวจรับ หรือแก้ไขข้อสั่งการในหน้านี้ได้
            </p>
          </div>
        </div>
      )}

      {/* LINE Notification Toast */}
      {lineAlertSent && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-600 animate-in slide-in-from-bottom">
          <Send className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">
            ส่งข้อความสั่งการและแจ้งเตือนผ่าน LINE ไปยัง {currentUser.name} เรียบร้อยแล้ว
          </span>
        </div>
      )}

      {/* Top Banner: Monthly Audit Status & Action */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-400/90 text-amber-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                Care Manager Audit
              </span>
              <span className="text-xs text-teal-200">รพ.สต.ธาตุทอง</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Prompt',sans-serif]">
              รอบงานประจำเดือน {selectedMonth}
            </h2>
            <p className="text-xs sm:text-sm text-teal-100 font-light mt-1">
              ตรวจสอบผลการลงเยี่ยมผู้สูงอายุของผู้ดูแล: <strong className="font-semibold text-white">{currentUser.name}</strong> ({currentUser.code})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white/10 text-white border border-white/20 text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 51 }, (_, i) => 2569 + i).map((year, idx) => (
                <React.Fragment key={year}>
                  <option value={`กันยายน ${year}`} className="text-slate-900">
                    กันยายน {year} {idx === 0 ? '(ปัจจุบัน)' : idx === 50 ? '(ครบ 50 ปี)' : ''}
                  </option>
                  <option value={`สิงหาคม ${year}`} className="text-slate-900">
                    สิงหาคม {year}
                  </option>
                  <option value={`กรกฎาคม ${year}`} className="text-slate-900">
                    กรกฎาคม {year}
                  </option>
                </React.Fragment>
              ))}
            </select>

            {currentRole === 'caregiver' ? (
              <div
                title="สิทธิ์ CG ดูได้อย่างเดียว (สงวนสิทธิ์การตรวจรับสำหรับ Care Manager)"
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm bg-white/20 text-white/90 flex items-center gap-2 border border-white/30 cursor-not-allowed"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>{isAudited ? 'ตรวจรับรอบงานแล้ว' : 'ยังไม่ตรวจรับ (เฉพาะ CM)'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleToggleAudit}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all flex items-center gap-2 ${
                  isAudited
                    ? 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300'
                    : 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAudited ? 'ตรวจรับรอบงานแล้ว' : 'ยังไม่ตรวจรับ (กดเพื่ออนุมัติ)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">ผู้สูงอายุที่ดูแล</span>
            <div className="text-2xl font-black text-slate-800 font-['Prompt',sans-serif]">
              {cgPatients.length} <span className="text-xs font-normal text-slate-500">ราย</span>
            </div>
            <span className="text-[11px] text-teal-600 font-medium">ม.1 - ม.2 บ.ธาตุทอง</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">รวมเป้าหมายทั้งหมด</span>
            <div className="text-2xl font-black text-slate-800 font-['Prompt',sans-serif]">
              {totalTargetVisits} <span className="text-xs font-normal text-slate-500">ครั้ง/เดือน</span>
            </div>
            <span className="text-[11px] text-blue-600 font-medium">เกณฑ์สิทธิบัตร LTC</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">เยี่ยมสำเร็จแล้ว</span>
            <div className="text-2xl font-black text-emerald-700 font-['Prompt',sans-serif]">
              {totalCompletedVisits} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              คิดเป็น {Math.round((totalCompletedVisits / totalTargetVisits) * 100)}% ของเป้าหมาย
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">ค้างเยี่ยม</span>
            <div className="text-2xl font-black text-amber-600 font-['Prompt',sans-serif]">
              {pendingElderlyCount} <span className="text-xs font-normal text-slate-500">ราย</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium">
              คงเหลืออีก {totalTargetVisits - totalCompletedVisits} ครั้ง
            </span>
          </div>
        </div>
      </div>

      {/* Main Quota Inspection Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 font-['Prompt',sans-serif]">
                ตารางตรวจสอบโควตาการลงเยี่ยมรายบุคคล (Individual Visit Quota Audit)
              </h3>
              {currentRole !== 'caregiver' && (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-200">
                  มีปุ่มลบยอดเยี่ยม
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ตรวจสอบความถี่การลงเยี่ยมให้เป็นไปตามกลุ่มระดับภาวะพึ่งพิง (LTC Group 1-4) และจัดการ/ปรับลดจำนวนครั้งการเยี่ยม
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onViewReport}
              className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-teal-200 cursor-pointer transition-colors shadow-2xs"
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>เปิดดูใบรายงาน A4 ประจำเดือน</span>
            </button>
          </div>
        </div>

        {/* Informative CM Tip Banner */}
        {currentRole !== 'caregiver' && (
          <div className="bg-rose-50/60 border-b border-rose-100 px-4 py-2 flex items-center justify-between text-[11px] text-rose-900">
            <div className="flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>
                <strong>คำแนะนำ CM/Admin:</strong> สามารถกดปุ่ม <span className="bg-white text-rose-700 font-bold px-1.5 py-0.5 rounded border border-rose-200">ลบจำนวนเยี่ยม</span> (สีแดง) หรือปุ่ม <span className="bg-white text-rose-700 font-bold px-1 py-0.5 rounded border border-rose-200">[-]</span> เพื่อลดยอดครั้งการเยี่ยม หรือลบประวัติการลงเยี่ยมที่ผิดพลาดได้ทันที
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 font-['Prompt',sans-serif]">
              <tr>
                <th className="px-4 py-3">ผู้สูงอายุ / ผู้มีภาวะพึ่งพิง</th>
                <th className="px-4 py-3">กลุ่ม LTC / TAI</th>
                <th className="px-4 py-3 text-center">เกณฑ์เป้าหมาย</th>
                <th className="px-4 py-3 text-center">เยี่ยมแล้ว</th>
                <th className="px-4 py-3">ความก้าวหน้า</th>
                <th className="px-4 py-3 text-center">สถานะการตรวจรับ</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedPatients.map((patient) => {
                const isComplete = patient.visitsThisMonth >= patient.targetVisitsPerMonth;
                const remaining = patient.targetVisitsPerMonth - patient.visitsThisMonth;
                const progressPercent = Math.min(100, Math.round((patient.visitsThisMonth / patient.targetVisitsPerMonth) * 100));

                return (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={patient.avatarUrl}
                          alt={patient.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-sm font-['Prompt',sans-serif]">
                            {patient.name}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            อายุ {patient.age} ปี • {patient.villageNo} {patient.villageName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className={`inline-block text-[11px] px-2 py-0.5 rounded font-bold ${
                          patient.ltcGroup === 1 ? 'bg-emerald-100 text-emerald-800' :
                          patient.ltcGroup === 2 ? 'bg-sky-100 text-sky-800' :
                          patient.ltcGroup === 3 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          กลุ่ม {patient.ltcGroup} ({patient.taiScore})
                        </span>
                        <div className="text-[10px] text-slate-500">ADL: {patient.adlScore}/20</div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {patient.targetVisitsPerMonth} ครั้ง
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                        <span className="font-bold text-teal-800 text-sm">
                          {patient.visitsThisMonth} ครั้ง
                        </span>
                        {currentRole !== 'caregiver' && patient.visitsThisMonth > 0 && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickDecrement(patient, e)}
                            title={`กดลดจำนวนการเยี่ยมของ ${patient.name} (-1 ครั้ง)`}
                            className="w-5 h-5 rounded-md bg-rose-100 hover:bg-rose-200 active:bg-rose-300 text-rose-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          >
                            <Minus className="w-3 h-3 text-rose-700 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>{progressPercent}%</span>
                          <span>{patient.visitsThisMonth}/{patient.targetVisitsPerMonth}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isComplete ? 'bg-emerald-500' : 'bg-teal-600'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          เยี่ยมครบตามเกณฑ์แล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3 text-amber-600" />
                          ต้องเยี่ยมอีก {remaining} ครั้ง
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* ปุ่มกดลบจำนวนการเยี่ยม */}
                        <button
                          type="button"
                          disabled={currentRole === 'caregiver' || patient.visitsThisMonth === 0}
                          onClick={() => {
                            setConfirmResetId(null);
                            setSelectedPatientForDelete(patient);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                            patient.visitsThisMonth === 0 || currentRole === 'caregiver'
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              : 'bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 hover:text-rose-800 border border-rose-300 cursor-pointer hover:shadow-xs'
                          }`}
                          title={
                            currentRole === 'caregiver'
                              ? 'เฉพาะสิทธิ์ CM/Admin จึงจะลบได้'
                              : patient.visitsThisMonth === 0
                              ? 'ไม่มีจำนวนการเยี่ยมให้ลบ (0 ครั้ง)'
                              : `กดเพื่อเปิดเมนูลบจำนวนการเยี่ยมของ ${patient.name}`
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>ลบจำนวนเยี่ยม</span>
                        </button>

                        {/* ปุ่มบันทึกเยี่ยม */}
                        <button
                          type="button"
                          onClick={() => onNavigateToVisitLog(patient.id)}
                          className="flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer shadow-2xs transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                          <span>+ บันทึกเยี่ยม</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Trend Progress Chart & CM Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm font-['Prompt',sans-serif] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>สถิติการลงเยี่ยมรายสัปดาห์ (กันยายน 2569)</span>
              </h3>
              <span className="text-xs text-slate-400">เป้าหมาย 4 สัปดาห์</span>
            </div>

            {/* Simple SVG Bar Chart */}
            <div className="space-y-3 pt-2">
              {[
                { label: 'สัปดาห์ 1 (1-7 ก.ย.)', done: 3, target: 4, percent: 75 },
                { label: 'สัปดาห์ 2 (8-14 ก.ย.)', done: 2, target: 4, percent: 50 },
                { label: 'สัปดาห์ 3 (15-21 ก.ย.)', done: 3, target: 4, percent: 75 },
                { label: 'สัปดาห์ 4 (22-30 ก.ย.)', done: 2, target: 5, percent: 40 },
              ].map((week, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{week.label}</span>
                    <span className="text-teal-700 font-bold">
                      {week.done} / {week.target} ครั้ง ({week.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${week.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>อัตราความสม่ำเสมอในการลงเยี่ยม: <strong>88.5%</strong></span>
            <span className="text-emerald-700 font-semibold">อยู่ในเกณฑ์ดีมาก</span>
          </div>
        </div>

        {/* Care Manager Directive Notes & LINE Alert */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm font-['Prompt',sans-serif]">
                ข้อสั่งการและคำแนะนำจาก Care Manager (CM)
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-2">
              คำแนะนำนี้จะปรากฏในหน้าสรุปงานของ Caregiver และสามารถแจ้งเตือนไปยังแอปพลิเคชัน LINE ได้
            </p>

            <textarea
              rows={4}
              value={cmNotes}
              readOnly={currentRole === 'caregiver'}
              onChange={(e) => setCmNotes(e.target.value)}
              className={`w-full p-3 border rounded-xl text-xs leading-relaxed ${
                currentRole === 'caregiver'
                  ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                  : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-teal-500'
              }`}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              ผู้ตรวจ: <strong>นางสาวสิริวิมล สารสวัสดิ์ (CM)</strong>
            </span>

            {currentRole === 'caregiver' ? (
              <div
                title="สิทธิ์ CG ดูได้อย่างเดียว (เฉพาะ CM ที่สั่งการแจ้งเตือนได้)"
                className="bg-slate-100 text-slate-500 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>เฉพาะ CM ในการส่งแจ้งเตือน</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendLine}
                className="bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งข้อความแจ้งเตือนผ่าน LINE ไปยัง CG</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{deleteToast}</span>
        </div>
      )}

      {/* Delete Visit Count Modal */}
      {selectedPatientForDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/25">
                  <Trash2 className="w-5 h-5 text-rose-100" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-['Prompt',sans-serif]">
                    จัดการและลบจำนวนการเยี่ยม
                  </h3>
                  <p className="text-xs text-rose-200">
                    เฉพาะสิทธิ์ Care Manager (CM) และ ผู้ดูแลระบบ (Admin)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientForDelete(null);
                  setConfirmResetId(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Patient Info Card */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center space-x-3.5">
                <img
                  src={selectedPatientForDelete.avatarUrl}
                  alt={selectedPatientForDelete.name}
                  className="w-13 h-13 rounded-2xl object-cover ring-2 ring-rose-200 shadow-xs"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-base font-['Prompt',sans-serif]">
                      {selectedPatientForDelete.name}
                    </h4>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                      selectedPatientForDelete.ltcGroup === 1 ? 'bg-emerald-100 text-emerald-800' :
                      selectedPatientForDelete.ltcGroup === 2 ? 'bg-sky-100 text-sky-800' :
                      selectedPatientForDelete.ltcGroup === 3 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      กลุ่ม {selectedPatientForDelete.ltcGroup} (ADL {selectedPatientForDelete.adlScore}/20)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    อายุ {selectedPatientForDelete.age} ปี • {selectedPatientForDelete.villageNo} {selectedPatientForDelete.villageName}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="text-slate-600">
                      เกณฑ์เป้าหมาย: <strong className="text-slate-800">{selectedPatientForDelete.targetVisitsPerMonth} ครั้ง</strong>
                    </span>
                    <span className="text-rose-700 font-bold bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200">
                      เยี่ยมแล้วปัจจุบัน: {selectedPatientForDelete.visitsThisMonth} ครั้ง
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Option 1: Quick Decrement 1 Visit */}
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 font-['Prompt',sans-serif]">
                    <MinusCircle className="w-4 h-4 text-rose-600" />
                    <span>วิธีที่ 1: ลบจำนวนการเยี่ยม 1 ครั้ง (-1)</span>
                  </span>
                  <span className="text-[11px] text-rose-700 font-semibold">
                    จะคงเหลือ {Math.max(0, selectedPatientForDelete.visitsThisMonth - 1)} ครั้ง
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  ปรับลดยอดครั้งการเยี่ยมลง 1 ครั้งทันที พร้อมตัดบันทึกประวัติการเยี่ยมล่าสุดออกจากระบบ
                </p>
                <button
                  type="button"
                  disabled={selectedPatientForDelete.visitsThisMonth <= 0}
                  onClick={(e) => handleQuickDecrement(selectedPatientForDelete, e)}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ยืนยันลบ 1 ครั้ง (จาก {selectedPatientForDelete.visitsThisMonth} เหลือ {Math.max(0, selectedPatientForDelete.visitsThisMonth - 1)} ครั้ง)</span>
                </button>
              </div>

              {/* Option 2: Visit Records list (if any) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 font-['Prompt',sans-serif]">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>วิธีที่ 2: เลือกลบจากประวัติใบงานที่บันทึกไว้ ({activePatientVisits.length} รายการ)</span>
                  </span>
                </div>

                {activePatientVisits.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {activePatientVisits.map((v, idx) => (
                      <div
                        key={v.id}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span>ครั้งที่ {activePatientVisits.length - idx}</span>
                            <span className="text-slate-500 font-normal">
                              วันที่ {v.visitDate} {v.visitTime ? `เวลา ${v.visitTime} น.` : ''}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            สัญญาณชีพ: BP {v.bpSystolic}/{v.bpDiastolic} mmHg • ชีพจร {v.pulse} ครั้ง/นาที • ผู้ดูแล: {v.caregiverName}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSpecificVisit(v.id, selectedPatientForDelete)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>ลบใบงานนี้</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
                    <p className="font-medium">
                      ℹ️ ยังไม่พบบันทึกใบงานการเยี่ยมแบบละเอียดในฐานข้อมูล (ยอด <strong>{selectedPatientForDelete.visitsThisMonth} ครั้ง</strong> เป็นตัวเลขนับสะสมเริ่มต้นของระบบ)
                    </p>
                    <p className="mt-1 text-[11px] text-amber-800">
                      ท่านสามารถใช้ <strong>วิธีที่ 1 (ลบ 1 ครั้ง)</strong> หรือ <strong>วิธีที่ 3 (รีเซ็ตเป็น 0)</strong> เพื่อปรับลดตัวเลขได้ทันที
                    </p>
                  </div>
                )}
              </div>

              {/* Option 3: Reset to 0 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 font-['Prompt',sans-serif] mb-1">
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>วิธีที่ 3: ล้างจำนวนการเยี่ยมทั้งหมด (รีเซ็ตเป็น 0 ครั้ง)</span>
                </span>
                <p className="text-xs text-slate-500 mb-3">
                  ใช้ในกรณีเริ่มรอบเดือนใหม่ หรือต้องการล้างข้อมูลการเยี่ยมทั้งหมดของผู้สูงอายุท่านนี้
                </p>

                {confirmResetId === selectedPatientForDelete.id ? (
                  <div className="bg-rose-100 border border-rose-300 p-3 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-700" />
                      <span>ยืนยันล้างจำนวนการเยี่ยมของ {selectedPatientForDelete.name} ทั้งหมดเป็น 0 ครั้ง?</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetVisits(selectedPatientForDelete)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs"
                      >
                        ยืนยันล้างเป็น 0
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetId(null)}
                        className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer transition-all"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={selectedPatientForDelete.visitsThisMonth <= 0}
                    onClick={() => setConfirmResetId(selectedPatientForDelete.id)}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>ล้างจำนวนการเยี่ยมทั้งหมด (รีเซ็ตเป็น 0)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100/80 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientForDelete(null);
                  setConfirmResetId(null);
                }}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
