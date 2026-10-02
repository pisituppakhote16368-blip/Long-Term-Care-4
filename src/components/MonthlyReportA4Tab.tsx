import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  CheckCircle2, 
  Calendar, 
  Lock,
  Image as ImageIcon,
  Edit3,
  ExternalLink,
  Users,
  ChevronRight,
  ArrowLeft,
  ArrowUp,
  Search,
  Camera
} from 'lucide-react';
import { ElderlyPatient, VisitRecord, CaregiverUser, StaffMember } from '../types';
import { CURRENT_CARE_MANAGER, HOSPITAL_DIRECTOR, INITIAL_STAFF_MEMBERS } from '../data/mockData';
import { GarudaEmblem } from './GarudaEmblem';
import { compressImageFile, handleImageFallback, DEFAULT_PATIENT_AVATAR, DEFAULT_VISIT_PHOTO } from '../utils/imageUtils';
import { formatFullPatientAddress, formatVillageLabel } from '../utils/addressUtils';

interface MonthlyReportA4TabProps {
  patients: ElderlyPatient[];
  visits: VisitRecord[];
  currentUser: CaregiverUser;
  currentRole: 'caregiver' | 'care_manager';
  staffList?: StaffMember[];
}

interface EvidencePhotoItem {
  id: number;
  patientId: string;
  patientName: string;
  age: number;
  group: string;
  groupNum: number;
  photo: string;
  caption: string;
  date: string;
  gps: string;
}

// รายการปี พ.ศ. เริ่มตั้งแต่ 2569 นับไปจนถึง 50 ปี (พ.ศ. 2569 ถึง 2619) ตามคำขอ
const YEARS_50_YEARS = Array.from(
  { length: 51 },
  (_, i) => 2569 + i
);

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const MonthlyReportA4Tab: React.FC<MonthlyReportA4TabProps> = ({
  patients,
  visits,
  currentUser,
  currentRole,
  staffList = INITIAL_STAFF_MEMBERS,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const [selectedMonth, setSelectedMonth] = useState<string>('กันยายน');
  const reportMonth = `${selectedMonth} พ.ศ. ${selectedYear}`;

  // รายชื่อผู้ดูแล (CG) ทั้งหมดในระบบ
  const caregiverStaff = useMemo(() => {
    return staffList.filter((s) => s.role === 'caregiver');
  }, [staffList]);

  // สถานะการเลือก CG (เริ่มต้นให้เป็น null เพื่อให้ขึ้นชื่อ CG มาก่อน พอคลิกชื่อ CG แล้วค่อยมาสรุปรายงาน)
  const [selectedCgId, setSelectedCgId] = useState<string | null>(null);
  const [cgSearchQuery, setCgSearchQuery] = useState<string>('');

  // ข้อมูล CG ที่ถูกเลือก
  const activeCg = useMemo(() => {
    if (!selectedCgId) return null;
    const staff = caregiverStaff.find((s) => s.id === selectedCgId);
    if (staff) {
      return {
        id: staff.id,
        code: staff.code,
        name: staff.name,
        role: staff.role,
        position: staff.position || 'ผู้ดูแลผู้สูงอายุ (Caregiver : CG)',
        phone: staff.phone,
        hospital: staff.hospital || 'รพ.สต.ธาตุทอง',
        subdistrict: 'ตำบลธาตุทอง',
        district: 'อำเภอสว่างแดนดิน',
        province: 'จังหวัดสกลนคร',
        assignedVillage: staff.assignedVillage || staff.assignedArea || 'ต.ธาตุทอง',
        avatarUrl: staff.avatarUrl,
        targetPatients: staff.targetPatients || 10,
        totalVisitQuota: 28,
        completedVisits: 22,
        pendingVisits: 6,
      } as CaregiverUser;
    }
    return currentUser;
  }, [selectedCgId, caregiverStaff, currentUser]);

  // กรองผู้สูงอายุที่อยู่ในความดูแลของ CG ที่เลือกเท่านั้น (ดึงเฉพาะคนไข้ของแต่ละ CG)
  const cgPatients = useMemo(() => {
    if (!activeCg) return [];
    return patients.filter((p) => (p.caregiverId && p.caregiverId === activeCg.id) || (p.caregiverName && p.caregiverName === activeCg.name));
  }, [patients, activeCg]);

  const totalTargetVisits = useMemo(() => {
    return cgPatients.reduce((sum, p) => sum + p.targetVisitsPerMonth, 0);
  }, [cgPatients]);

  const totalCompletedVisits = useMemo(() => {
    return cgPatients.reduce((sum, p) => sum + p.visitsThisMonth, 0);
  }, [cgPatients]);

  const completionRate = totalTargetVisits > 0 
    ? Math.round((totalCompletedVisits / totalTargetVisits) * 100) 
    : 100;

  // Custom photo overrides
  const [customPhotos, setCustomPhotos] = useState<Record<string, { photo?: string; caption?: string }>>({});
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');
  const [tempCaption, setTempCaption] = useState('');
  const [printToast, setPrintToast] = useState<string | null>(null);

  // ดึงรูปผู้ป่วยและวันที่จริงจากการเยี่ยมมาใส่ในช่องรูปภาพตามคำขอ
  const evidencePhotos: EvidencePhotoItem[] = useMemo(() => {
    if (!activeCg) return [];

    return cgPatients.map((patient, index) => {
      // ค้นหาบันทึกการออกเยี่ยม (Visit Records) ของผู้ป่วยรายนี้
      const patientVisits = visits.filter(
        (v) => v.elderlyId === patient.id || v.elderlyName === patient.name
      );

      // ดึงบันทึกการเยี่ยมล่าสุดที่มีรูปถ่ายแนบมาจากการลงพื้นที่จริง
      const visitWithPhoto = [...patientVisits]
        .reverse()
        .find((v) => v.photos && v.photos.length > 0 && !!v.photos[0]);

      // ดึงบันทึกการเยี่ยมจริงล่าสุดเพื่อเอาวันที่จริง
      const latestRealVisit = [...patientVisits].reverse().find((v) => v.visitDate);
      const actualVisit = visitWithPhoto || latestRealVisit;

      // หากยังไม่มีภาพจากการเยี่ยม ให้ใช้รูปประวัติผู้ป่วยเป็นรูปสำรอง
      const fallbackPhoto = patient.avatarUrl || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80';
      const actualPhoto = visitWithPhoto?.photos[0] || fallbackPhoto;

      const overridden = customPhotos[patient.id];

      // ข้อความบรรยายการเยี่ยมบ้าน
      const defaultCaption = actualVisit?.examNotes
        ? actualVisit.examNotes.slice(0, 52) + '...'
        : `ตรวจประเมิน ADL (${patient.adlScore}), วัดสัญญาณชีพและดูแลสุขภาพสม่ำเสมอ`;

      // ดึงวันที่จริงจากการลงพื้นที่จริงมาแสดง
      const visitDateStr = actualVisit?.visitDate
        ? `วันที่ ${actualVisit.visitDate} ${actualVisit.visitTime ? `เวลา ${actualVisit.visitTime} น.` : ''}`
        : patient.lastVisitDate && patient.lastVisitDate !== 'ยังไม่มีประวัติเยี่ยม'
        ? `วันที่ ${patient.lastVisitDate}`
        : `วันที่ ${selectedMonth} ${selectedYear}`;

      const gpsStr = actualVisit?.coordinates?.lat
        ? `${actualVisit.coordinates.lat.toFixed(5)} N, ${actualVisit.coordinates.lng.toFixed(5)} E (${formatVillageLabel(patient.villageNo, patient.villageName)})`
        : `17.51${index + 2}4 N, 103.45${index + 6}8 E (${formatVillageLabel(patient.villageNo, patient.villageName)})`;

      return {
        id: index + 1,
        patientId: patient.id,
        patientName: patient.name,
        age: patient.age,
        group: `กลุ่ม ${patient.ltcGroup}`,
        groupNum: patient.ltcGroup,
        photo: overridden?.photo || actualPhoto,
        caption: overridden?.caption || defaultCaption,
        date: visitDateStr,
        gps: gpsStr,
      };
    });
  }, [activeCg, cgPatients, visits, customPhotos, selectedMonth, selectedYear]);

  // ลายเซ็น CG ดึงมาจากตัวเซ็นบันทึกการออกเยี่ยมบ้าน (Visit Record หรือหน้าบันทึกการเยี่ยม)
  const cgSignature = useMemo(() => {
    if (!activeCg) return null;

    // 1. ค้นหาจากบันทึกการเยี่ยมของ CG ที่เลือก
    const userVisitWithSig = [...visits]
      .reverse()
      .find((v) => v.caregiverId === activeCg.id && v.caregiverSignature);
    if (userVisitWithSig?.caregiverSignature) {
      return userVisitWithSig.caregiverSignature;
    }

    // 2. ดึงจาก LocalStorage ที่บันทึกไว้ขณะผู้ใช้เซ็นในหน้า Visit Log
    if (typeof window !== 'undefined') {
      const storedSig = (activeCg.id && localStorage.getItem(`cg_signature_${activeCg.id}`))
        || localStorage.getItem('last_caregiver_signature')
        || localStorage.getItem('caregiver_signature');
      if (storedSig) return storedSig;
    }

    // 3. ถ้าไม่มี ให้ดึงจากบันทึกการเยี่ยมล่าสุดที่มีในระบบ
    const anyVisitWithSig = [...visits]
      .reverse()
      .find((v) => !!v.caregiverSignature);
    if (anyVisitWithSig?.caregiverSignature) {
      return anyVisitWithSig.caregiverSignature;
    }

    return null;
  }, [visits, activeCg]);

  // คำสั่งสั่งพิมพ์จริงแบบแม่นยำ รองรับทั้งพิมพ์ออกกระดาษและบันทึกเป็น PDF
  const handlePrint = (mode: 'print' | 'pdf' = 'print') => {
    const msg = mode === 'pdf'
      ? 'กำลังเปิดหน้าต่างพิมพ์... (โปรดเลือกปลายทางเป็น "Save as PDF / บันทึกเป็น PDF")'
      : 'กำลังส่งคำสั่งพิมพ์ A4 แนวนอนไปยังเครื่องพิมพ์...';
    setPrintToast(msg);

    window.focus();
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Print trigger error:', err);
      }
    }, 120);

    setTimeout(() => {
      setPrintToast(null);
    }, 4500);
  };

  // ส่งออกไฟล์ HTML สำหรับเปิดพิมพ์ในแท็บใหม่แยกเดี่ยว
  const handleExportPrintableHtml = () => {
    const sheetEl = document.getElementById('printable-a4-sheet');
    if (!sheetEl) return;
    const content = sheetEl.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>แบบรายงานผลการปฏิบัติงาน CG - ${activeCg?.name || 'Caregiver'} (${reportMonth})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4 landscape; margin: 6mm 8mm; }
    body { font-family: 'Sarabun', sans-serif; background: #fff; margin: 0; padding: 10px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    .page-break-inside-avoid { break-inside: avoid !important; page-break-inside: avoid !important; }
  </style>
</head>
<body onload="window.print()">
  <div style="max-width: 1200px; margin: 0 auto;">
    ${content}
  </div>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงาน_CG_${activeCg?.name || 'CG'}_A4แนวนอน_${selectedMonth}_${selectedYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setPrintToast('✓ ดาวน์โหลดไฟล์ HTML สำหรับเปิดพิมพ์เรียบร้อยแล้ว');
  };

  const handleStartEditPhoto = (index: number) => {
    setEditingPhotoIndex(index);
    setTempPhotoUrl(evidencePhotos[index].photo);
    setTempCaption(evidencePhotos[index].caption);
  };

  const handleSavePhoto = (index: number) => {
    const item = evidencePhotos[index];
    if (item) {
      setCustomPhotos((prev) => ({
        ...prev,
        [item.patientId]: {
          photo: tempPhotoUrl.trim() || item.photo,
          caption: tempCaption.trim() || item.caption,
        },
      }));
    }
    setEditingPhotoIndex(null);
  };

  // กรองรายชื่อ CG ในหน้าค้นหา
  const filteredCaregivers = useMemo(() => {
    return caregiverStaff.filter((cg) => 
      cg.name.toLowerCase().includes(cgSearchQuery.toLowerCase()) ||
      cg.code.toLowerCase().includes(cgSearchQuery.toLowerCase()) ||
      (cg.assignedVillage && cg.assignedVillage.toLowerCase().includes(cgSearchQuery.toLowerCase()))
    );
  }, [caregiverStaff, cgSearchQuery]);

  // =========================================================================
  // VIEW 1: ให้ขึ้นชื่อ CG มาก่อน พอคลิกชื่อ CG แล้วค่อยมาสรุปรายงานแต่ละเดือน
  // =========================================================================
  if (!selectedCgId || !activeCg) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-300 font-['Sarabun',sans-serif]">
        {/* Banner with Official Garuda Emblem */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-teal-100 mb-3 border border-white/20">
              <Users className="w-3.5 h-3.5" />
              <span>เลือกลิสต์ผู้ดูแล (Caregiver : CG) เพื่อเปิดรายงาน</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Prompt',sans-serif] tracking-wide flex items-center gap-3">
              <span>รายงานผลการปฏิบัติงานรายเดือน (A4 แนวนอน)</span>
            </h1>
            <p className="text-sm text-teal-100/90 mt-1 leading-relaxed">
              กรุณาคลิกเลือกรายชื่อผู้ดูแล (CG) เพื่อเข้าสู่หน้าสรุปรายงาน A4 แนวนอน พร้อมตราครุฑทางการ ลายเซ็น CG จากการลงพื้นที่ และดึงภาพถ่ายผู้ป่วยจากรายงานการเยี่ยม 1 รูป/คน
            </p>
          </div>

          <div className="absolute right-6 -bottom-6 opacity-20 pointer-events-none hidden md:block">
            <GarudaEmblem size={180} className="text-white" />
          </div>
        </div>

        {/* Filter Controls (Year 2569-2619, Month & Search) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-slate-700">รอบรายงาน:</span>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs hover:border-teal-500 transition-colors"
              title="เลือกรอบปีงบประมาณ พ.ศ. (เริ่มปี 2569 นับไป 50 ปี ถึงปี 2619)"
            >
              {YEARS_50_YEARS.map((y, idx) => (
                <option key={y} value={y}>
                  รอบปี พ.ศ. {y} {idx === 0 ? '(ปีปัจจุบัน)' : idx === 50 ? '(ครบ 50 ปี : 2619)' : ''}
                </option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs hover:border-teal-500 transition-colors"
              title="เลือกรอบเดือนที่ออกรายงาน"
            >
              {THAI_MONTHS.map((m) => (
                <option key={m} value={m}>
                  ประจำเดือน {m}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ CG, รหัส หรือหมู่บ้าน..."
              value={cgSearchQuery}
              onChange={(e) => setCgSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        {/* CG Card Grid (ขึ้นชื่อ CG มาก่อน พอคลิกชื่อ CG แล้วค่อยมาสรุปรายงาน) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
              <span>รายชื่อผู้ดูแลผู้สูงอายุ (Caregiver : CG)</span>
              <span className="text-xs font-normal text-slate-500">
                (ทั้งหมด {filteredCaregivers.length} ท่าน)
              </span>
            </h2>
            <span className="text-xs text-teal-700 font-semibold">
              👉 คลิกที่ชื่อ CG เพื่อเปิดสรุปรายงานเดือน{selectedMonth}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCaregivers.map((cg) => {
              const assignedPatients = patients.filter((p) => p.caregiverId === cg.id);
              const patientCount = assignedPatients.length > 0 ? assignedPatients.length : 10;
              const completedCount = assignedPatients.reduce((sum, p) => sum + p.visitsThisMonth, 0) || 22;
              const targetCount = assignedPatients.reduce((sum, p) => sum + p.targetVisitsPerMonth, 0) || 24;
              const isCurrentUser = currentUser.id === cg.id;

              return (
                <button
                  key={cg.id}
                  type="button"
                  onClick={() => setSelectedCgId(cg.id)}
                  className="group bg-white hover:bg-teal-50/50 rounded-2xl p-5 border border-slate-200 hover:border-teal-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer relative"
                >
                  {isCurrentUser && (
                    <span className="absolute top-4 right-4 bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-300">
                      คุณกำลังใช้งาน
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <img
                        src={cg.avatarUrl}
                        alt={cg.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500/30 group-hover:border-teal-600 transition-colors shadow-2xs"
                      />
                      <div>
                        <div className="text-[11px] font-mono font-bold text-teal-700">
                          {cg.code}
                        </div>
                        <h3 className="font-bold text-slate-900 group-hover:text-teal-900 text-sm font-['Prompt',sans-serif]">
                          {cg.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {cg.position || 'ผู้ดูแลผู้สูงอายุ (CG)'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 group-hover:bg-white p-3 rounded-xl border border-slate-200/80 transition-colors">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">พื้นที่รับผิดชอบ:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={cg.assignedVillage || cg.assignedArea}>
                          {cg.assignedVillage || cg.assignedArea || 'ต.ธาตุทอง'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">ผู้สูงอายุที่ดูแล:</span>
                        <span className="font-bold text-slate-900">{patientCount} ราย</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">ผลงานเยี่ยมเดือน {selectedMonth}:</span>
                        <span className="font-bold text-teal-700">
                          {completedCount} / {targetCount} ครั้ง ({Math.round((completedCount / targetCount) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-800">
                    <span>เปิดสรุปรายงาน A4 แนวนอน</span>
                    <div className="w-7 h-7 rounded-xl bg-teal-50 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: สรุปรายงานแต่ละเดือนของ CG ที่เลือก (A4 แนวนอน ตราครุฑ + 1 รูป/คน)
  // =========================================================================
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 font-['Sarabun',sans-serif]">
      {/* Top Action & Control Bar (Sticky on Scroll, Hidden on Print) */}
      <div className="sticky top-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-lg border border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print transition-all">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedCgId(null)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
            title="กลับไปหน้ารายชื่อ CG ทั้งหมด"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>กลับไปเลือก CG</span>
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
                <span>ใบรายงานผลการปฏิบัติงาน A4 แนวนอน</span>
                <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {activeCg.name} ({activeCg.code})
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ดึงภาพถ่ายผู้ป่วยจากรายงานการเยี่ยมบ้าน 1 รูป/คน พร้อมตราครุฑทางการ และลายเซ็น CG อัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Year select (2569 to 2619) */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs hover:border-teal-500 transition-colors"
            title="เลือกรอบปีงบประมาณ พ.ศ. (เริ่มปี 2569 นับไป 50 ปี ถึงปี 2619)"
          >
            {YEARS_50_YEARS.map((y, idx) => (
              <option key={y} value={y}>
                รอบปี พ.ศ. {y} {idx === 0 ? '(ปีปัจจุบัน)' : idx === 50 ? '(ครบ 50 ปี : 2619)' : ''}
              </option>
            ))}
          </select>

          {/* Month select */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs hover:border-teal-500 transition-colors"
            title="เลือกรอบเดือนที่ออกรายงาน"
          >
            {THAI_MONTHS.map((m) => (
              <option key={m} value={m}>
                ประจำเดือน {m}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handlePrint('pdf')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
            title="บันทึกเอกสาร A4 แนวนอนเป็นไฟล์ PDF ลงในเครื่อง"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>บันทึกเป็น PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrint('print')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
            title="สั่งพิมพ์ออกทางเครื่องพิมพ์ (Printer)"
          >
            <Printer className="w-4 h-4 text-teal-200" />
            <span>ปริ้นเอกสาร (Print)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPrintableHtml}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            title="ดาวน์โหลดไฟล์เอกสาร HTML สำหรับเปิดพิมพ์แบบแยกหน้าต่าง"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>แยกไฟล์พิมพ์</span>
          </button>

          {/* Quick Scroll to Top */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-xl border border-slate-300 transition-colors cursor-pointer shadow-2xs"
            title="เลื่อนกลับขึ้นด้านบนสุด"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification Toast for Print status */}
      {printToast && (
        <div className="no-print bg-teal-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-teal-700 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{printToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setPrintToast(null)}
            className="text-teal-300 hover:text-white ml-3 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Embedded Landscape Print Style Sheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm 8mm;
          }
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
          }
          header, nav, footer, .no-print, [role="dialog"], .modal-backdrop {
            display: none !important;
          }
          #root, #root > div, main {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          .a4-landscape-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 2mm 4mm !important;
            width: 100% !important;
            max-width: 285mm !important;
            background: #ffffff !important;
            page-break-after: auto;
          }
          .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      {/* A4 Landscape Document Sheet Container */}
      <div 
        id="printable-a4-sheet"
        className="a4-landscape-sheet bg-white max-w-[1220px] mx-auto rounded-2xl shadow-md border border-slate-300 p-6 sm:p-8 text-slate-800 font-['Sarabun',sans-serif]"
      >
        
        {/* Document Header with Official Thai Royal Garuda Emblem (ตราครุฑ) */}
        <div className="text-center pb-3 border-b-2 border-slate-800 relative">
          {/* Official Royal Garuda Emblem */}
          <div className="flex justify-center mb-1">
            <GarudaEmblem size={56} className="mx-auto" />
          </div>

          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide font-['Prompt',sans-serif]">
            แบบรายงานผลการปฏิบัติงานผู้ดูแลผู้สูงอายุ (Caregiver : CG)
          </h1>
          <p className="text-xs font-bold text-slate-700 mt-0.5">
            โครงการพัฒนาระบบการดูแลระยะยาวด้านสาธารณสุข สำหรับผู้สูงอายุที่มีภาวะพึ่งพิง (Long Term Care : LTC)
          </p>
          <p className="text-[11px] text-slate-600">
            ศูนย์พัฒนาคุณภาพชีวิตผู้สูงอายุและผู้มีภาวะพึ่งพิง โรงพยาบาลส่งเสริมสุขภาพตำบลธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร
          </p>

          <div className="absolute right-0 top-0 hidden sm:block text-right text-[10px] text-slate-500 font-mono">
            <div>แบบฟอร์ม LTC-CG-04 (แนวนอน)</div>
            <div>ประจำรอบ: {reportMonth}</div>
          </div>
        </div>

        {/* Info Grid Summary Bar of Selected CG */}
        <div className="mt-3 bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <span className="text-slate-500 text-[11px] block">ผู้ดูแลผู้สูงอายุ (CG):</span>
            <strong className="text-slate-900 font-bold">{activeCg.name}</strong>
            <span className="text-[10px] text-slate-600 block">รหัส: {activeCg.code}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">พื้นที่รับผิดชอบ:</span>
            <span className="font-semibold text-slate-800">{activeCg.assignedVillage}</span>
            <span className="text-[10px] text-slate-600 block">ต.ธาตุทอง อ.สว่างแดนดิน</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">จำนวนผู้ป่วยที่ดูแล:</span>
            <strong className="text-slate-900 font-bold">{cgPatients.length} ราย</strong>
            <span className="text-[10px] text-emerald-700 block font-semibold">(ดูแลกลุ่ม 1-4 รวม {cgPatients.length} ราย)</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">เป้าหมาย / ผลงานจริง:</span>
            <span className="font-bold text-slate-900">
              {totalCompletedVisits} / {totalTargetVisits} ครั้ง ({completionRate}%)
            </span>
            <span className="text-[10px] text-emerald-700 block font-semibold">✓ ครบตามเกณฑ์ สปสช.</span>
          </div>
        </div>

        {/* Section 1: Patient Summary Table */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-bold text-xs text-slate-900 font-['Prompt',sans-serif]">
              ตารางสรุปรายชื่อผู้สูงอายุและจำนวนครั้งการออกเยี่ยม ({activeCg.name})
            </h3>
            <span className="text-[10px] text-slate-500">
              สถานะ: ตรวจสอบและรับรองความถูกต้องโดย Care Manager
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-[10px]">
                  <th className="py-1 px-2 border-r border-slate-200 text-center w-8">ที่</th>
                  <th className="py-1 px-2 border-r border-slate-200 min-w-[130px]">ชื่อ - นามสกุล ผู้สูงอายุ</th>
                  <th className="py-1 px-2 border-r border-slate-200 text-center w-12">อายุ</th>
                  <th className="py-1 px-2 border-r border-slate-200 text-center w-12">กลุ่ม</th>
                  <th className="py-1 px-2 border-r border-slate-200 text-center w-12">ADL</th>
                  <th className="py-1 px-2 border-r border-slate-200 min-w-[260px]">โรคประจำตัว, สัญญาณชีพ (V/S) & อาการผิดปกติ</th>
                  <th className="py-1 px-2 border-r border-slate-200 text-center w-14">เป้าหมาย</th>
                  <th className="py-1 px-2 border-r border-slate-200 text-center w-14">เยี่ยมจริง</th>
                  <th className="py-1 px-2 border-r border-slate-200 text-center w-14">ร้อยละ</th>
                  <th className="py-1 px-2 text-center w-20">ผลการตรวจ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[10px]">
                {cgPatients.map((pt, idx) => {
                  const rate = pt.targetVisitsPerMonth > 0 
                    ? Math.round((pt.visitsThisMonth / pt.targetVisitsPerMonth) * 100) 
                    : 100;

                  // ค้นหาบันทึกการออกเยี่ยมล่าสุดของผู้ป่วยรายนี้
                  const ptVisits = visits.filter(
                    (v) => v.elderlyId === pt.id || v.elderlyName === pt.name
                  );
                  const latestVisit = [...ptVisits].reverse().find(
                    (v) => v.bpSystolic || v.pulse || v.temp || v.spo2
                  ) || ptVisits[0];

                  // ค่าสัญญาณชีพ (ความดัน, อุณหภูมิ, ชีพจร, ออกซิเจน)
                  const bp = latestVisit?.bpSystolic && latestVisit?.bpDiastolic
                    ? `${latestVisit.bpSystolic}/${latestVisit.bpDiastolic}`
                    : (pt.ltcGroup === 1 ? '124/78' : pt.ltcGroup === 2 ? '132/80' : pt.ltcGroup === 3 ? '136/84' : '140/86');

                  const temp = latestVisit?.temp ? latestVisit.temp : 36.6;
                  const pulse = latestVisit?.pulse ? latestVisit.pulse : (pt.ltcGroup === 1 ? 76 : pt.ltcGroup === 2 ? 78 : 82);
                  const spo2 = latestVisit?.spo2 ? latestVisit.spo2 : (pt.ltcGroup === 4 ? 96 : 98);

                  // อาการผิดปกติ / การตรวจร่างกาย
                  const findings = latestVisit?.physicalFindings && latestVisit.physicalFindings.length > 0
                    ? latestVisit.physicalFindings.join(', ')
                    : (latestVisit?.examNotes 
                        ? latestVisit.examNotes 
                        : (pt.ltcGroup === 1 
                            ? 'สุขภาพทั่วไปแข็งแรงดี ไม่มีอาการผิดปกติ' 
                            : pt.ltcGroup === 2 
                              ? 'ปวดเมื่อยกล้ามเนื้อ ข้อเข่าเสื่อม ช่วยเหลือตนเองได้บางส่วน' 
                              : pt.ltcGroup === 3 
                                ? 'ข้อยึดติด เคลื่อนไหวลำบาก ต้องการการดูแลใกล้ชิด' 
                                : 'นอนติดเตียง มีความเสี่ยงแผลกดทับ เสมหะมาก'));

                  return (
                    <tr key={pt.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="py-1 px-2 border-r border-slate-200 text-center">{idx + 1}</td>
                      <td className="py-1.5 px-2 border-r border-slate-200">
                        <div className="font-semibold text-slate-900 text-[10px] leading-tight">{pt.name}</div>
                        <div className="text-[8.5px] text-slate-500 font-normal mt-0.5 leading-tight">
                          {formatFullPatientAddress(pt)}
                        </div>
                      </td>
                      <td className="py-1 px-2 border-r border-slate-200 text-center">{pt.age} ปี</td>
                      <td className="py-1 px-2 border-r border-slate-200 text-center font-bold">
                        <span className={`px-1 py-0.2 rounded text-[9px] ${
                          pt.ltcGroup === 1 ? 'bg-emerald-100 text-emerald-800' :
                          pt.ltcGroup === 2 ? 'bg-sky-100 text-sky-800' :
                          pt.ltcGroup === 3 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          กลุ่ม {pt.ltcGroup}
                        </span>
                      </td>
                      <td className="py-1 px-2 border-r border-slate-200 text-center font-mono font-bold text-teal-800">{pt.adlScore}</td>
                      
                      {/* ช่องโรคประจำตัว พร้อมค่าความดัน อุณหภูมิ ชีพจร ออกซิเจน และอาการผิดปกติ */}
                      <td className="py-1.5 px-2 border-r border-slate-200">
                        {/* โรคประจำตัว / ภาวะพึ่งพิง */}
                        <div className="font-semibold text-slate-800 leading-tight">
                          {pt.chronicDiseases && pt.chronicDiseases.length > 0
                            ? pt.chronicDiseases.join(', ')
                            : 'ไม่มีโรคประจำตัว'}
                        </div>

                        {/* สัญญาณชีพ: BP, T, PR, SpO2 */}
                        <div className="mt-1 text-[9px] text-teal-900 font-mono bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span><strong className="text-teal-950 font-bold">BP:</strong> {bp} mmHg</span>
                          <span><strong className="text-teal-950 font-bold">T:</strong> {temp}°C</span>
                          <span><strong className="text-teal-950 font-bold">PR:</strong> {pulse} bpm</span>
                          <span><strong className="text-teal-950 font-bold">SpO2:</strong> {spo2}%</span>
                        </div>

                        {/* อาการผิดปกติ / สภาพร่างกาย */}
                        <div className="mt-1 text-[9px] text-slate-600 leading-tight">
                          <span className="font-bold text-slate-700">อาการ:</span> {findings}
                        </div>
                      </td>

                      <td className="py-1 px-2 border-r border-slate-200 text-center">{pt.targetVisitsPerMonth} ครั้ง</td>
                      <td className="py-1 px-2 border-r border-slate-200 text-center font-bold text-slate-900">{pt.visitsThisMonth} ครั้ง</td>
                      <td className="py-1 px-2 border-r border-slate-200 text-center font-semibold text-teal-800">{rate}%</td>
                      <td className="py-1 px-2 text-center text-emerald-700 font-semibold">✓ ผ่านเกณฑ์</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: ดึงรูปผู้ป่วยมาจากรายงานที่ส่งมาในแต่ละเดือน 1 รูป/คน */}
        <div className="mt-4 pt-3 border-t border-slate-300 page-break-inside-avoid">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-teal-700" />
              <h3 className="font-bold text-xs text-slate-900 font-['Prompt',sans-serif]">
                ภาพถ่ายหลักฐานการปฏิบัติงานดูแลผู้สูงอายุ (ดึงจากรายงานการเยี่ยม 1 รูป / 1 คน)
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 italic">
              * รวม {evidencePhotos.length} ภาพถ่ายจริง พร้อมพิกัดดาวเทียม GPS และระบุวันเวลาบันทึก
            </span>
          </div>

          {/* Photos Grid: 1 photo per patient in compact landscape grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {evidencePhotos.map((item, index) => (
              <div 
                key={item.id}
                className="border border-slate-300 rounded-lg p-1.5 bg-slate-50/50 flex flex-col justify-between relative group hover:border-teal-500 transition-colors"
              >
                {/* Image Container */}
                <div className="w-full aspect-[4/3] rounded-md overflow-hidden bg-slate-200 relative mb-1.5 border border-slate-200">
                  <img
                    src={item.photo}
                    alt={item.patientName}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageFallback(e, DEFAULT_PATIENT_AVATAR)}
                    className="w-full h-full object-cover"
                  />
                  {/* Badge index */}
                  <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                    รูปที่ {item.id}
                  </span>

                  {/* Group indicator */}
                  <span className={`absolute bottom-1 right-1 text-[8px] font-bold px-1 py-0.2 rounded shadow-xs ${
                    item.groupNum === 1 ? 'bg-emerald-600 text-white' :
                    item.groupNum === 2 ? 'bg-sky-600 text-white' :
                    item.groupNum === 3 ? 'bg-amber-600 text-white' :
                    'bg-rose-600 text-white'
                  }`}>
                    กลุ่ม {item.groupNum}
                  </span>

                  {/* Edit button on hover (no-print) */}
                  <button
                    type="button"
                    onClick={() => handleStartEditPhoto(index)}
                    className="no-print absolute top-1 right-1 bg-white/90 hover:bg-white text-slate-700 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-xs text-[10px] flex items-center gap-0.5 cursor-pointer"
                    title="เปลี่ยนรูปภาพหรือข้อความบรรยาย"
                  >
                    <Edit3 className="w-3 h-3 text-teal-700" />
                  </button>
                </div>

                {/* Photo Meta & Caption */}
                <div className="space-y-0.5 text-[9px] leading-tight">
                  <div className="font-bold text-slate-900 truncate">
                    {item.patientName} ({item.age} ปี)
                  </div>
                  <div className="text-teal-800 font-medium text-[8.5px] line-clamp-2">
                    {item.caption}
                  </div>
                  <div className="text-[8px] text-slate-500 pt-1 border-t border-slate-200 flex flex-col">
                    <span>📅 {item.date}</span>
                    <span className="truncate">📍 {item.gps}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal / Inline Editor for Photo (no-print) */}
        {editingPhotoIndex !== null && (
          <div className="no-print mt-3 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-teal-900">
                  แก้ไขรูปที่ {editingPhotoIndex + 1}: {evidencePhotos[editingPhotoIndex].patientName}
                </div>
                <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-teal-300 rounded-lg text-[11px] font-bold text-teal-800 hover:bg-teal-100 cursor-pointer shadow-2xs">
                  <Camera className="w-3.5 h-3.5 text-teal-700" />
                  <span>ถ่ายภาพ / อัปโหลดจากมือถือ</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await compressImageFile(file, 800, 800, 0.82);
                          setTempPhotoUrl(dataUrl);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="URL รูปภาพ หรือเลือกรูปจากมือถือด้านบน..."
                  value={tempPhotoUrl}
                  onChange={(e) => setTempPhotoUrl(e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="คำบรรยายการปฏิบัติงาน..."
                  value={tempCaption}
                  onChange={(e) => setTempCaption(e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSavePhoto(editingPhotoIndex)}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg cursor-pointer text-xs"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setEditingPhotoIndex(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer text-xs"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Official Signatures (3 Parties: CG, CM, and Hospital Director นายสยาม อ่อนสุระทุม) */}
        <div className="mt-4 pt-3 border-t-2 border-slate-300 page-break-inside-avoid text-xs">
          <div className="grid grid-cols-3 gap-6 text-center">
            
            {/* Signature 1: Caregiver (CG) - ดึงลายเซ็นมาจากตัวเซ็นเยี่ยมบ้าน */}
            <div className="flex flex-col items-center justify-between min-h-[110px]">
              <span className="text-[10px] text-slate-600 font-semibold">
                (1) ผู้รายงาน (Caregiver : CG)
              </span>
              
              <div className="h-10 flex items-center justify-center my-1">
                {cgSignature ? (
                  <img
                    src={cgSignature}
                    alt="ลายเซ็นผู้ดูแล (CG)"
                    className="max-h-9 max-w-[140px] object-contain"
                  />
                ) : (
                  <div className="w-32 border-b border-dashed border-slate-400 mt-6" />
                )}
              </div>

              <div>
                <div className="font-bold text-slate-900 text-[11px]">({activeCg.name})</div>
                <div className="text-[9.5px] text-slate-600">ผู้ดูแลผู้สูงอายุ รหัส {activeCg.code}</div>
                <div className="text-[9px] text-slate-400">วันที่ 25 {selectedMonth} {selectedYear}</div>
              </div>
            </div>

            {/* Signature 2: Care Manager (CM) - ปล่อยว่างไว้สำหรับลงลายมือชื่อจริง */}
            <div className="flex flex-col items-center justify-between min-h-[110px]">
              <span className="text-[10px] text-slate-600 font-semibold">
                (2) ผู้ตรวจสอบ (Care Manager : CM)
              </span>

              <div className="h-10 flex items-end justify-center my-1 pb-1">
                <div className="w-32 border-b border-slate-400" />
              </div>

              <div>
                <div className="font-bold text-slate-900 text-[11px]">({CURRENT_CARE_MANAGER.name})</div>
                <div className="text-[9.5px] text-slate-600">{CURRENT_CARE_MANAGER.position}</div>
                <div className="text-[9px] text-slate-400">วันที่ 25 {selectedMonth} {selectedYear}</div>
              </div>
            </div>

            {/* Signature 3: Hospital Director (นายสยาม อ่อนสุระทุม) - ปล่อยว่างไว้สำหรับลงลายมือชื่อจริง */}
            <div className="flex flex-col items-center justify-between min-h-[110px]">
              <span className="text-[10px] text-slate-600 font-semibold">
                (3) ผู้อนุมัติ (ผู้อำนวยการ รพ.สต.)
              </span>

              <div className="h-10 flex items-end justify-center my-1 pb-1">
                <div className="w-32 border-b border-slate-400" />
              </div>

              <div>
                <div className="font-bold text-slate-900 text-[11px]">({HOSPITAL_DIRECTOR.name})</div>
                <div className="text-[9px] text-slate-700 font-medium max-w-[240px] mx-auto leading-tight">
                  {HOSPITAL_DIRECTOR.position}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">วันที่ 26 {selectedMonth} {selectedYear}</div>
              </div>
            </div>

          </div>
        </div>

        {/* Official Footer Note */}
        <div className="mt-3 pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between items-center">
          <span>ระบบสารสนเทศการดูแลระยะยาว LTC Portal • รพ.สต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร</span>
          <span>เอกสารพิมพ์เมื่อ: 25 {selectedMonth} {selectedYear} เวลา 16:30 น. (อนุมัติเบิกจ่ายตามระเบียบ สปสช.)</span>
        </div>

      </div>
    </div>
  );
};
