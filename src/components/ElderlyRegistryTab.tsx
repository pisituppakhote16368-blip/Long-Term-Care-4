import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  FileSpreadsheet, 
  Calendar, 
  MapPin, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  HeartPulse, 
  ChevronRight,
  PieChart as PieIcon,
  Activity,
  UserCheck,
  UserMinus,
  HeartCrack,
  RotateCcw,
  Lock,
  X,
  Clock,
  UserCog,
  Check
} from 'lucide-react';
import { ElderlyPatient, LTCGroup, FISCAL_YEARS_LIST, StaffMember } from '../types';
import { INITIAL_STAFF_MEMBERS } from '../data/mockData';

interface ElderlyRegistryTabProps {
  patients: ElderlyPatient[];
  currentRole: 'caregiver' | 'care_manager' | 'director';
  staffList?: StaffMember[];
  onOpenAddElderly: () => void;
  onNavigateToVisitLog: (patientId: string) => void;
  onUpdatePatient?: (updatedPatient: ElderlyPatient) => void;
}

export const ElderlyRegistryTab: React.FC<ElderlyRegistryTabProps> = ({
  patients,
  currentRole,
  staffList = INITIAL_STAFF_MEMBERS,
  onOpenAddElderly,
  onNavigateToVisitLog,
  onUpdatePatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCaregiverFilter, setSelectedCaregiverFilter] = useState<string>('all');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2569');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'discharged' | 'deceased'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Assign Caregiver Modal State
  const [assignTargetPatient, setAssignTargetPatient] = useState<ElderlyPatient | null>(null);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string>('');

  // Discharge Modal State
  const [dischargeTargetPatient, setDischargeTargetPatient] = useState<ElderlyPatient | null>(null);
  const [dischargeDate, setDischargeDate] = useState('2026-09-25');
  const [dischargeReason, setDischargeReason] = useState('ย้ายภูมิลำเนาออกนอกเขตพื้นที่ รพ.สต.ธาตุทอง');
  const [dischargeNote, setDischargeNote] = useState('');

  // Deceased Modal State
  const [deceasedTargetPatient, setDeceasedTargetPatient] = useState<ElderlyPatient | null>(null);
  const [deceasedDate, setDeceasedDate] = useState('2026-09-25');
  const [deceasedReason, setDeceasedReason] = useState('เสียชีวิตอย่างสงบด้วยโรคชราภาพที่บ้าน');
  const [deceasedNote, setDeceasedNote] = useState('');

  // Filtered patients by fiscal year, status, search, village, group, caregiver
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Fiscal year
      const patientYear = p.fiscalYear || '2569';
      const matchYear = selectedFiscalYear === 'all' || patientYear === selectedFiscalYear;

      // Status
      const patientStatus = p.status || 'active';
      const matchStatus = selectedStatusFilter === 'all' || patientStatus === selectedStatusFilter;

      // Search
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.citizenId.includes(searchTerm) ||
        p.address.includes(searchTerm) ||
        (p.chronicDiseases && p.chronicDiseases.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        p.caregiverName.toLowerCase().includes(searchTerm.toLowerCase());

      // Village
      const matchVillage = selectedVillage === 'all' || p.villageNo === selectedVillage;

      // Group
      const matchGroup = selectedGroup === 'all' || p.ltcGroup.toString() === selectedGroup;

      // Caregiver filter
      const matchCaregiver = selectedCaregiverFilter === 'all' || p.caregiverId === selectedCaregiverFilter || p.caregiverName === selectedCaregiverFilter;

      return matchYear && matchStatus && matchSearch && matchVillage && matchGroup && matchCaregiver;
    });
  }, [patients, selectedFiscalYear, selectedStatusFilter, searchTerm, selectedVillage, selectedGroup, selectedCaregiverFilter]);

  // Statistics for current fiscal year
  const fiscalYearPatients = useMemo(() => {
    return patients.filter(p => selectedFiscalYear === 'all' || (p.fiscalYear || '2569') === selectedFiscalYear);
  }, [patients, selectedFiscalYear]);

  const totalInYear = fiscalYearPatients.length;
  const activeCount = fiscalYearPatients.filter(p => (p.status || 'active') === 'active').length;
  const dischargedCount = fiscalYearPatients.filter(p => p.status === 'discharged').length;
  const deceasedCount = fiscalYearPatients.filter(p => p.status === 'deceased').length;

  const group1Count = fiscalYearPatients.filter(p => (p.status || 'active') === 'active' && p.ltcGroup === 1).length;
  const group2Count = fiscalYearPatients.filter(p => (p.status || 'active') === 'active' && p.ltcGroup === 2).length;
  const group3Count = fiscalYearPatients.filter(p => (p.status || 'active') === 'active' && p.ltcGroup === 3).length;
  const group4Count = fiscalYearPatients.filter(p => (p.status || 'active') === 'active' && p.ltcGroup === 4).length;

  // Handle Discharge Submit
  const handleConfirmDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeTargetPatient) return;

    const fullReason = dischargeNote.trim() 
      ? `${dischargeReason} (${dischargeNote.trim()})`
      : dischargeReason;

    const updated: ElderlyPatient = {
      ...dischargeTargetPatient,
      status: 'discharged',
      statusDate: dischargeDate,
      statusReason: fullReason,
    };

    if (onUpdatePatient) {
      onUpdatePatient(updated);
    }
    setDischargeTargetPatient(null);
    setToastMessage(`✓ บันทึกจำหน่าย ${dischargeTargetPatient.name} เรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Deceased Submit
  const handleConfirmDeceased = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deceasedTargetPatient) return;

    const fullReason = deceasedNote.trim() 
      ? `${deceasedReason} (${deceasedNote.trim()})`
      : deceasedReason;

    const updated: ElderlyPatient = {
      ...deceasedTargetPatient,
      status: 'deceased',
      statusDate: deceasedDate,
      statusReason: fullReason,
    };

    if (onUpdatePatient) {
      onUpdatePatient(updated);
    }
    setDeceasedTargetPatient(null);
    setToastMessage(`✓ บันทึกการเสียชีวิต ${deceasedTargetPatient.name} เรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Restore Patient Status to Active
  const handleRestoreStatus = (patient: ElderlyPatient) => {
    const updated: ElderlyPatient = {
      ...patient,
      status: 'active',
      statusDate: undefined,
      statusReason: undefined,
    };
    if (onUpdatePatient) {
      onUpdatePatient(updated);
    }
    setToastMessage(`✓ คืนสถานะ ${patient.name} เป็น "กำลังดูแล (Active)" เรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // List of Caregivers available for assignment
  const cgStaffList = useMemo(() => {
    return staffList.filter(s => s.role === 'caregiver');
  }, [staffList]);

  // Handle Assign Caregiver Submit
  const handleConfirmAssignCaregiver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetPatient || !selectedCaregiverId) return;

    const assignedStaff = staffList.find(s => s.id === selectedCaregiverId);
    if (!assignedStaff) return;

    const updated: ElderlyPatient = {
      ...assignTargetPatient,
      caregiverId: assignedStaff.id,
      caregiverName: assignedStaff.name,
    };

    if (onUpdatePatient) {
      onUpdatePatient(updated);
    }
    setAssignTargetPatient(null);
    setToastMessage(`✓ มอบหมายผู้รับผิดชอบให้ "${assignedStaff.name}" ดูแล ${assignTargetPatient.name} เรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export Excel CSV
  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
      "ปีงบประมาณ,สถานะ,รหัส,ชื่อ-นามสกุล,เลขบัตรประชาชน,อายุ,เพศ,ที่อยู่,หมู่,กลุ่มLTC,ADL,TAI,ผู้ดูแล,วันที่สถานะ,เหตุผล\n" +
      patients.map(p => `"${p.fiscalYear || '2569'}","${p.status || 'active'}","${p.id}","${p.name}","${p.citizenId}","${p.age}","${p.gender}","${p.address}","${p.villageNo}","กลุ่ม ${p.ltcGroup}","${p.adlScore}","${p.taiScore}","${p.caregiverName}","${p.statusDate || ''}","${p.statusReason || ''}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ทะเบียนผู้สูงอายุ_LTC_ปีงบ_${selectedFiscalYear}_รพสตธาตุทอง.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('ส่งออกไฟล์ทะเบียนผู้สูงอายุ LTC Excel (CSV) เรียบร้อยแล้ว');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleImportJhcis = () => {
    if (currentRole === 'caregiver') {
      setToastMessage('🔒 สิทธิ์ Caregiver (CG) ดูได้อย่างเดียว — การนำเข้าข้อมูลจาก JHCIS/สปสช. ต้องดำเนินการโดย Care Manager');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setToastMessage('กำลังเชื่อมต่อ API ฐานข้อมูล JHCIS / สปสช. ... ข้อมูลอัปเดตตรงกันเรียบร้อย');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddClick = () => {
    if (currentRole === 'caregiver') {
      setToastMessage('🔒 สิทธิ์ Caregiver (CG) ดูได้อย่างเดียว — การลงทะเบียนเพิ่มผู้สูงอายุรายใหม่ต้องดำเนินการโดย Care Manager');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    onOpenAddElderly();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-teal-600 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Read-Only Banner for Caregiver */}
      {currentRole === 'caregiver' && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-amber-900 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold font-['Prompt',sans-serif] text-sm text-amber-950 flex items-center gap-1.5">
              <span>โหมดดูข้อมูลอย่างเดียว (Read-Only) สำหรับผู้ดูแล (CG)</span>
            </h4>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              สิทธิ์ Caregiver สามารถค้นหา ดูรายชื่อ ตรวจสอบสถานะการจำหน่าย/เสียชีวิต และกดบันทึกผลการออกเยี่ยมได้ตามปกติ
            </p>
          </div>
        </div>
      )}

      {/* Fiscal Year Window & Top Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
              <Users className="w-6 h-6 text-teal-700" />
              <span>ทะเบียนผู้สูงอายุและผู้มีภาวะพึ่งพิง (LTC Registry)</span>
            </h2>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              รพ.สต.ธาตุทอง
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ระบบจัดการฐานข้อมูลผู้มีภาวะพึ่งพิงรายปีงบประมาณ พร้อมระบบบันทึกจำหน่าย และบันทึกเสียชีวิต
          </p>
        </div>

        {/* Fiscal Year Selector Buttons (หน้าต่างรายปีงบ รองรับถึงปีงบ 2700) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Year Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>ปีงบ:</span>
            </span>
            {(['all', '2568', '2569', '2570'] as const).map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedFiscalYear(year)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedFiscalYear === year
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {year === 'all' ? 'ทุกปีงบ' : `ปีงบ ${year}`}
              </button>
            ))}
          </div>

          {/* Full Fiscal Year Selector (ปี 2568 ถึง 2700) */}
          <div className="flex items-center gap-1.5 bg-white border border-teal-300 rounded-xl px-2.5 py-1 text-xs shadow-2xs hover:border-teal-500 transition-colors">
            <span className="text-[11px] font-bold text-teal-900 whitespace-nowrap">
              เลือกปีงบ (ถึง 2700):
            </span>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="font-bold text-teal-800 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">ทุกปีงบประมาณ</option>
              {FISCAL_YEARS_LIST.map((year) => (
                <option key={year} value={year}>
                  ปีงบ {year} {year === '2569' ? '(ปัจจุบัน)' : year === '2700' ? '(ปี 2700)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">ส่งออก</span> Excel
          </button>

          <button
            type="button"
            onClick={handleAddClick}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors ${
              currentRole === 'caregiver'
                ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                : 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
            }`}
          >
            {currentRole === 'caregiver' ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Plus className="w-4 h-4" />}
            <span>+ ลงทะเบียนผู้สูงอายุ</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary for Selected Fiscal Year */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total in Year */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200 text-center col-span-2 sm:col-span-2">
          <span className="text-[11px] text-slate-500 font-medium block">ผู้สูงอายุ LTC ปีงบ {selectedFiscalYear === 'all' ? 'ทั้งหมด' : selectedFiscalYear}</span>
          <div className="text-2xl font-black text-slate-800 font-['Prompt',sans-serif] mt-0.5">
            {totalInYear} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ครอบคลุม 8 หมู่บ้าน ตำบลธาตุทอง</div>
        </div>

        {/* Active Count */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-emerald-200 bg-emerald-50/20 text-center col-span-2 sm:col-span-2">
          <span className="text-[11px] text-emerald-800 font-medium block">กำลังดูแลอยู่ (Active)</span>
          <div className="text-2xl font-black text-emerald-700 font-['Prompt',sans-serif] mt-0.5">
            {activeCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-semibold">อยู่ในแผนดูแลต่อเนื่อง</div>
        </div>

        {/* Discharged Count */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-amber-200 bg-amber-50/20 text-center col-span-2 sm:col-span-2">
          <span className="text-[11px] text-amber-800 font-medium block">จำหน่ายแล้ว (Discharged)</span>
          <div className="text-2xl font-black text-amber-700 font-['Prompt',sans-serif] mt-0.5">
            {dischargedCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">ย้ายที่อยู่ / ฟื้นตัวพ้นเกณฑ์</div>
        </div>

        {/* Deceased Count */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-rose-200 bg-rose-50/20 text-center col-span-2 sm:col-span-2">
          <span className="text-[11px] text-rose-800 font-medium block">เสียชีวิต (Deceased)</span>
          <div className="text-2xl font-black text-rose-700 font-['Prompt',sans-serif] mt-0.5">
            {deceasedCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5">จำหน่ายด้วยเหตุเสียชีวิต</div>
        </div>
      </div>

      {/* LTC Group Breakdown & Active Status Tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700 mr-1">สถานะผู้ป่วย:</span>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedStatusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({totalInYear})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('active')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedStatusFilter === 'active'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              กำลังดูแล ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('discharged')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedStatusFilter === 'discharged'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              จำหน่ายแล้ว ({dischargedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('deceased')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedStatusFilter === 'deceased'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              เสียชีวิต ({deceasedCount})
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            ปีงบประมาณปัจจุบัน: <span className="font-bold text-teal-800">{selectedFiscalYear === 'all' ? 'ทั้งหมด' : `พ.ศ. ${selectedFiscalYear}`}</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          {/* Search text input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เลขบัตร, หมู่บ้าน, โรค..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800"
            />
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ทุกหมู่บ้าน (ม.1 - ม.8)</option>
              <option value="ม.1">ม.1 บ้านธาตุทอง</option>
              <option value="ม.2">ม.2 บ้านหินโงม</option>
              <option value="ม.3">ม.3 บ้านโนนสร้างไพ</option>
              <option value="ม.4">ม.4 บ้านหนองหอย</option>
              <option value="ม.5">ม.5 บ้านคันชา</option>
              <option value="ม.6">ม.6 บ้านโคกหลวง</option>
              <option value="ม.7">ม.7 บ้านเดิด</option>
              <option value="ม.8">ม.8 บ้านเดื่อ</option>
            </select>
          </div>

          {/* Group Filter */}
          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ทุกกลุ่มภาวะพึ่งพิง (กลุ่ม 1-4)</option>
              <option value="1">กลุ่ม 1 : ติดสังคม ({group1Count})</option>
              <option value="2">กลุ่ม 2 : ติดบ้านปานกลาง ({group2Count})</option>
              <option value="3">กลุ่ม 3 : ติดบ้านมาก ({group3Count})</option>
              <option value="4">กลุ่ม 4 : ติดเตียง ({group4Count})</option>
            </select>
          </div>

          {/* Caregiver Filter */}
          <div>
            <select
              value={selectedCaregiverFilter}
              onChange={(e) => setSelectedCaregiverFilter(e.target.value)}
              className="w-full px-3 py-2 border border-teal-300 bg-teal-50/40 rounded-xl text-teal-900 font-semibold focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ผู้ดูแลรับผิดชอบ: ทั้งหมด</option>
              {cgStaffList.map((cg) => {
                const countForCg = fiscalYearPatients.filter(p => p.caregiverId === cg.id || p.caregiverName === cg.name).length;
                return (
                  <option key={cg.id} value={cg.id}>
                    {cg.name} ({countForCg} คน)
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Main Elderly Registry Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            แสดงรายชื่อผู้สูงอายุ ({filteredPatients.length} รายการ)
          </span>
          <span className="text-[11px] text-slate-400">
            ปีงบประมาณ {selectedFiscalYear === 'all' ? 'ทั้งหมด' : selectedFiscalYear} • รพ.สต.ธาตุทอง
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 font-['Prompt',sans-serif]">
              <tr>
                <th className="px-4 py-3">ผู้สูงอายุ</th>
                <th className="px-4 py-3">ปีงบ / สถานะ</th>
                <th className="px-4 py-3">ข้อมูลพื้นฐาน / ที่อยู่</th>
                <th className="px-4 py-3">กลุ่ม LTC / ADL</th>
                <th className="px-4 py-3">โรคประจำตัว</th>
                <th className="px-4 py-3">Caregiver ผู้ดูแล</th>
                <th className="px-4 py-3 text-right">การจัดการ & สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <Calendar className="w-8 h-8 text-teal-600/60 mx-auto" />
                      <div className="font-bold text-slate-700 text-sm">
                        {selectedFiscalYear === 'all' 
                          ? 'ไม่พบข้อมูลผู้สูงอายุตามเงื่อนไขที่เลือก' 
                          : `ยังไม่มีข้อมูลผู้สูงอายุในระบบ LTC ปีงบ ${selectedFiscalYear}`}
                      </div>
                      <p className="text-xs text-slate-400">
                        {selectedFiscalYear !== 'all' 
                          ? `ท่านสามารถลงทะเบียนผู้สูงอายุเข้าสู่ปีงบประมาณ ${selectedFiscalYear} ได้ทันที (ระบบรองรับข้อมูลถึงปีงบ 2700)`
                          : 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองหมู่บ้าน/กลุ่ม LTC'}
                      </p>
                      {currentRole !== 'caregiver' && selectedFiscalYear !== 'all' && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleAddClick}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ ลงทะเบียนผู้สูงอายุเข้าปีงบ {selectedFiscalYear}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const status = patient.status || 'active';
                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Patient Avatar & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={patient.avatarUrl}
                            alt={patient.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm font-['Prompt',sans-serif] flex items-center gap-1.5">
                              <span>{patient.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {patient.citizenId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fiscal Year & Status Badge */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                            ปีงบ {patient.fiscalYear || '2569'}
                          </span>
                          {onUpdatePatient && currentRole !== 'caregiver' && (
                            <select
                              value={patient.fiscalYear || '2569'}
                              onChange={(e) => {
                                const newYear = e.target.value;
                                onUpdatePatient({ ...patient, fiscalYear: newYear });
                                setToastMessage(`ปรับเปลี่ยนปีงบของ ${patient.name} เป็นปีงบ ${newYear} เรียบร้อยแล้ว`);
                                setTimeout(() => setToastMessage(null), 3500);
                              }}
                              className="text-[9.5px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 hover:border-teal-400 focus:outline-none cursor-pointer"
                              title="คลิกเพื่อย้าย/ปรับปีงบประมาณ (รองรับถึงปี 2700)"
                            >
                              {FISCAL_YEARS_LIST.map((y) => (
                                <option key={y} value={y}>
                                  ย้ายเป็นปีงบ {y}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        {status === 'active' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            กำลังดูแล
                          </span>
                        )}
                        {status === 'discharged' && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                              <UserMinus className="w-3 h-3 text-amber-600" />
                              จำหน่ายแล้ว
                            </span>
                            {patient.statusDate && (
                              <div className="text-[9.5px] text-slate-500 mt-0.5 truncate max-w-[140px]" title={patient.statusReason}>
                                {patient.statusDate}: {patient.statusReason}
                              </div>
                            )}
                          </div>
                        )}
                        {status === 'deceased' && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full">
                              <HeartCrack className="w-3 h-3 text-rose-600" />
                              เสียชีวิต
                            </span>
                            {patient.statusDate && (
                              <div className="text-[9.5px] text-slate-500 mt-0.5 truncate max-w-[140px]" title={patient.statusReason}>
                                {patient.statusDate}: {patient.statusReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Demographics */}
                      <td className="px-4 py-3.5 text-slate-600">
                        <div>{patient.gender} • อายุ <strong>{patient.age}</strong> ปี</div>
                        <div className="text-[11px] text-slate-500">{patient.address} {patient.villageName}</div>
                      </td>

                      {/* LTC Group / ADL */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[11px] px-2 py-0.5 rounded font-bold ${
                          patient.ltcGroup === 1 ? 'bg-emerald-100 text-emerald-800' :
                          patient.ltcGroup === 2 ? 'bg-sky-100 text-sky-800' :
                          patient.ltcGroup === 3 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          กลุ่ม {patient.ltcGroup} ({patient.taiScore})
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono font-semibold">
                          ADL: <strong className="text-teal-800">{patient.adlScore}</strong> / 20
                        </div>
                      </td>

                      {/* Chronic Diseases */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {patient.chronicDiseases.slice(0, 2).map((d, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">
                              {d}
                            </span>
                          ))}
                          {patient.chronicDiseases.length > 2 && (
                            <span className="text-[10px] text-slate-400">
                              +{patient.chronicDiseases.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Caregiver ผู้รับผิดชอบ */}
                      <td className="px-4 py-3.5 text-slate-700">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{patient.caregiverName}</span>
                          {currentRole !== 'caregiver' && onUpdatePatient && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignTargetPatient(patient);
                                setSelectedCaregiverId(patient.caregiverId || cgStaffList[0]?.id || '');
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
                              title="คลิกเพื่อเลือก/เปลี่ยนผู้รับผิดชอบดูแลผู้สูงอายุคนนี้"
                            >
                              <UserCog className="w-3 h-3 text-teal-600" />
                              <span>เลือกผู้รับผิดชอบ</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">โทร: {patient.phone}</div>
                      </td>

                      {/* Action Buttons: Visit, Assign Caregiver, Discharge, Deceased, Restore */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {status === 'active' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onNavigateToVisitLog(patient.id)}
                                className="bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                              >
                                + บันทึกเยี่ยม
                              </button>

                              {/* ปุ่มเลือกผู้รับผิดชอบ (CG Assignment) */}
                              {currentRole !== 'caregiver' && onUpdatePatient && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssignTargetPatient(patient);
                                    setSelectedCaregiverId(patient.caregiverId || cgStaffList[0]?.id || '');
                                  }}
                                  className="bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                                  title="เลือกว่าจะให้ใครเป็นผู้รับผิดชอบดูแลผู้สูงอายุคนนี้"
                                >
                                  <UserCog className="w-3.5 h-3.5 text-teal-700" />
                                  <span>เลือกผู้รับผิดชอบ</span>
                                </button>
                              )}

                              {/* ปุ่มกดจำหน่าย */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDischargeTargetPatient(patient);
                                  setDischargeReason('ย้ายภูมิลำเนาออกนอกเขตพื้นที่ รพ.สต.ธาตุทอง');
                                  setDischargeNote('');
                                }}
                                className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                                title="กดจำหน่ายผู้สูงอายุ (ย้ายที่อยู่/ฟื้นตัวพ้นเกณฑ์)"
                              >
                                <UserMinus className="w-3.5 h-3.5 text-amber-700" />
                                <span>จำหน่าย</span>
                              </button>

                              {/* ปุ่มกดตาย / เสียชีวิต */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDeceasedTargetPatient(patient);
                                  setDeceasedReason('เสียชีวิตอย่างสงบด้วยโรคชราภาพที่บ้าน');
                                  setDeceasedNote('');
                                }}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                                title="กดบันทึกผู้สูงอายุเสียชีวิต"
                              >
                                <HeartCrack className="w-3.5 h-3.5 text-rose-700" />
                                <span>กดตาย</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRestoreStatus(patient)}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                              title="คืนสถานะกลับมาดูแลต่อ"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                              <span>คืนสถานะดูแล</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discharge Modal (หน้าต่างบันทึกจำหน่าย) */}
      {dischargeTargetPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-sm font-['Prompt',sans-serif]">
                  บันทึกจำหน่ายผู้สูงอายุ (LTC Discharge)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDischargeTargetPatient(null)}
                className="text-amber-100 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDischarge} className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="font-bold text-slate-900 text-sm">{dischargeTargetPatient.name}</div>
                <div className="text-slate-600 mt-0.5">
                  อายุ {dischargeTargetPatient.age} ปี • กลุ่ม {dischargeTargetPatient.ltcGroup} (ADL {dischargeTargetPatient.adlScore})
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{dischargeTargetPatient.citizenId}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">วันที่จำหน่าย:</label>
                <input
                  type="date"
                  required
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">สาเหตุการจำหน่าย:</label>
                <select
                  value={dischargeReason}
                  onChange={(e) => setDischargeReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium"
                >
                  <option value="ย้ายภูมิลำเนาออกนอกเขตพื้นที่ รพ.สต.ธาตุทอง">1. ย้ายภูมิลำเนาออกนอกเขตพื้นที่</option>
                  <option value="ฟื้นฟูสภาพดีขึ้นจนพ้นเกณฑ์ภาวะพึ่งพิง (ADL > 11)">2. สุขภาพฟื้นตัวดีขึ้นจนพ้นเกณฑ์ LTC</option>
                  <option value="ครอบครัว/ญาติรับไปดูแลต่อในสถานพยาบาลอื่น">3. ครอบครัวรับไปดูแลในสถานพยาบาลอื่น</option>
                  <option value="ส่งต่อไปรักษาต่อระดับตติยภูมิระยะยาว">4. ส่งต่อไปรับการรักษาต่อระดับตติยภูมิ</option>
                  <option value="อื่นๆ (ระบุในหมายเหตุ)">5. อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">รายละเอียด / หมายเหตุเพิ่มเติม:</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ย้ายไปอยู่กับบุตรที่ กทม. หรือส่งมอบต่อให้ รพ.สต. ปลายทาง..."
                  value={dischargeNote}
                  onChange={(e) => setDischargeNote(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDischargeTargetPatient(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <UserMinus className="w-4 h-4" />
                  <span>ยืนยันการจำหน่าย</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deceased Modal (หน้าต่างบันทึกผู้เสียชีวิต / กดตาย) */}
      {deceasedTargetPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-700 to-rose-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartCrack className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-sm font-['Prompt',sans-serif]">
                  บันทึกข้อมูลผู้สูงอายุเสียชีวิต (Deceased)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeceasedTargetPatient(null)}
                className="text-rose-100 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeceased} className="p-5 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <div className="font-bold text-slate-900 text-sm">{deceasedTargetPatient.name}</div>
                <div className="text-slate-600 mt-0.5">
                  อายุ {deceasedTargetPatient.age} ปี • กลุ่ม {deceasedTargetPatient.ltcGroup} (ADL {deceasedTargetPatient.adlScore})
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{deceasedTargetPatient.citizenId}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">วันที่เสียชีวิต:</label>
                <input
                  type="date"
                  required
                  value={deceasedDate}
                  onChange={(e) => setDeceasedDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">สาเหตุการเสียชีวิต:</label>
                <select
                  value={deceasedReason}
                  onChange={(e) => setDeceasedReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 text-slate-800 font-medium"
                >
                  <option value="เสียชีวิตอย่างสงบด้วยโรคชราภาพที่บ้าน">1. เสียชีวิตอย่างสงบด้วยโรคชราภาพ</option>
                  <option value="โรคประจำตัวเดิมกำเริบ (เช่น หลอดเลือดสมอง / หัวใจล้มเหลว)">2. โรคประจำตัวเดิมกำเริบ</option>
                  <option value="ภาวะแทรกซ้อนจากการติดเชื้อ (เช่น ปอดอักเสบ / ติดเชื้อทางเดินปัสสาวะ)">3. ภาวะแทรกซ้อนจากการติดเชื้อ</option>
                  <option value="ภาวะกลืนสำลัก / ทางเดินหายใจอุดกั้น">4. ภาวะกลืนสำลัก</option>
                  <option value="อื่นๆ (ระบุในหมายเหตุ)">5. อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">รายละเอียดเพิ่มเติม / สถานที่เสียชีวิต:</label>
                <textarea
                  rows={2}
                  placeholder="เช่น เสียชีวิตที่บ้านเลขที่... ญาติประกอบพิธีกรรมทางศาสนา..."
                  value={deceasedNote}
                  onChange={(e) => setDeceasedNote(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeceasedTargetPatient(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <HeartCrack className="w-4 h-4" />
                  <span>ยืนยันบันทึกเสียชีวิต</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: เลือกผู้รับผิดชอบดูแลผู้สูงอายุ (Assign Caregiver Modal) */}
      {assignTargetPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <UserCog className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Prompt',sans-serif]">
                    กำหนดผู้รับผิดชอบดูแลผู้สูงอายุ
                  </h3>
                  <p className="text-xs text-slate-500">
                    เลือกว่าจะให้ Caregiver (CG) คนใดเป็นผู้รับผิดชอบดูแลเคสนี้
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignTargetPatient(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignCaregiver} className="space-y-4 text-xs">
              {/* Patient Card Summary */}
              <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3.5 flex items-center gap-3">
                <img
                  src={assignTargetPatient.avatarUrl}
                  alt={assignTargetPatient.name}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-teal-300 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate font-['Prompt',sans-serif]">
                    {assignTargetPatient.name}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    อายุ {assignTargetPatient.age} ปี • {assignTargetPatient.address} {assignTargetPatient.villageName}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded font-bold">
                      กลุ่ม {assignTargetPatient.ltcGroup} (ADL {assignTargetPatient.adlScore})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ผู้ดูแลเดิม: <strong className="text-slate-700">{assignTargetPatient.caregiverName}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Caregiver Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-2 font-['Prompt',sans-serif]">
                  เลือก Caregiver (CG) ผู้รับผิดชอบคนใหม่:
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cgStaffList.map((cg) => {
                    const isSelected = selectedCaregiverId === cg.id;
                    const isCurrent = assignTargetPatient.caregiverId === cg.id;

                    return (
                      <label
                        key={cg.id}
                        onClick={() => setSelectedCaregiverId(cg.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={cg.avatarUrl}
                            alt={cg.name}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{cg.name}</span>
                              <span className="text-[10px] font-mono text-teal-700 bg-teal-100/60 px-1.5 py-0.2 rounded">
                                {cg.code}
                              </span>
                              {isCurrent && (
                                <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                  ผู้ดูแลปัจจุบัน
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {cg.assignedArea || cg.assignedVillage || 'รพ.สต.ธาตุทอง'} • โทร: {cg.phone}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          <input
                            type="radio"
                            name="caregiverSelect"
                            value={cg.id}
                            checked={isSelected}
                            onChange={() => setSelectedCaregiverId(cg.id)}
                            className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800 leading-relaxed">
                💡 เมื่อบันทึกการมอบหมายแล้ว ผู้สูงอายุท่านนี้จะถูกนับเป็นเคสรับผิดชอบของ CG ที่เลือก และจะแสดงในหน้ารายงานประจำเดือนและแผนการดูแลของ CG ท่านนั้นทันที
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignTargetPatient(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!selectedCaregiverId}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>บันทึกมอบหมายผู้รับผิดชอบ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
