import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  User, 
  PlusCircle, 
  PhoneCall, 
  AlertCircle, 
  FileText, 
  HeartHandshake, 
  ArrowRight,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarCheck2,
  Table as TableIcon,
  Users,
  Sparkles,
  Info,
  Check,
  MapPin,
  ExternalLink,
  Layers,
  ChevronDown
} from 'lucide-react';
import { ElderlyPatient, CaregiverUser, LTCGroup } from '../types';
import { CURRENT_CARE_MANAGER } from '../data/mockData';
import { handleImageFallback, DEFAULT_PATIENT_AVATAR } from '../utils/imageUtils';

interface MyVisitSummaryTabProps {
  currentUser: CaregiverUser;
  patients: ElderlyPatient[];
  onNavigateToVisitLog: (patientId: string) => void;
  onNavigateToMonthlyReport?: () => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

interface GroupScheduleInfo {
  group: LTCGroup;
  groupName: string;
  taiText: string;
  adlText: string;
  targetVisitsText: string;
  dayOfWeekText: string;
  dates: number[];
  colorBadge: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  colorChip: string;
  patients: ElderlyPatient[];
}

export const MyVisitSummaryTab: React.FC<MyVisitSummaryTabProps> = ({
  currentUser,
  patients,
  onNavigateToVisitLog,
  onNavigateToMonthlyReport,
}) => {
  const cgPatients = patients.filter((p) => p.caregiverId === currentUser.id);
  const displayedPatients = cgPatients.length > 0 ? cgPatients : patients;

  const totalTargetVisits = displayedPatients.reduce((sum, p) => sum + p.targetVisitsPerMonth, 0);
  const totalCompletedVisits = displayedPatients.reduce((sum, p) => sum + p.visitsThisMonth, 0);
  const remainingVisits = Math.max(0, totalTargetVisits - totalCompletedVisits);
  const percentage = totalTargetVisits > 0 ? Math.round((totalCompletedVisits / totalTargetVisits) * 100) : 0;

  // Real-time or default date state
  const realNow = new Date();
  const currentCEYear = realNow.getFullYear(); // e.g. 2026
  const currentMonthIdx = realNow.getMonth(); // 0-11
  const todayDateNum = realNow.getDate(); // 1-31

  // Year CE for 2569 BE is 2026
  const [selectedYearCE, setSelectedYearCE] = useState<number>(currentCEYear || 2026);
  // Default to September (index 8) or current month
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(currentMonthIdx >= 0 ? currentMonthIdx : 8);
  const [scheduleViewMode, setScheduleViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | 'all'>('all');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);

  // Compute Group Schedules for selected month & year
  const groupSchedules: GroupScheduleInfo[] = useMemo(() => {
    const totalDays = new Date(selectedYearCE, selectedMonthIdx + 1, 0).getDate();
    
    const mondays: number[] = [];
    const tuesdays: number[] = [];
    const wednesdays: number[] = [];
    const thursdays: number[] = [];
    const fridays: number[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(selectedYearCE, selectedMonthIdx, day);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 1) mondays.push(day);
      else if (dayOfWeek === 2) tuesdays.push(day);
      else if (dayOfWeek === 3) wednesdays.push(day);
      else if (dayOfWeek === 4) thursdays.push(day);
      else if (dayOfWeek === 5) fridays.push(day);
    }

    // Group 1: 2 visits/month -> 1st and 3rd Monday (or 1st & 2nd if only 2)
    const g1Dates = mondays.length >= 3 ? [mondays[0], mondays[2]] : mondays.slice(0, 2);

    // Group 2: 4 visits/month -> all Tuesdays
    const g2Dates = [...tuesdays];

    // Group 3: 4 visits/month -> all Wednesdays
    const g3Dates = [...wednesdays];

    // Group 4: 7-8 visits/month -> all Thursdays and Fridays
    const g4Dates = [...thursdays, ...fridays].sort((a, b) => a - b);

    return [
      {
        group: 1,
        groupName: 'กลุ่ม 1 (เคลื่อนไหวได้บ้าง มีภาวะสับสน)',
        taiText: 'TAI กลุ่ม B3, I3',
        adlText: 'ADL 12 - 20 คะแนน',
        targetVisitsText: '2 ครั้ง / เดือน',
        dayOfWeekText: 'วันจันทร์ (สัปดาห์ที่ 1 และ 3)',
        dates: g1Dates,
        colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        colorBorder: 'border-emerald-200',
        colorBg: 'bg-emerald-50/70',
        colorText: 'text-emerald-700',
        colorChip: 'bg-emerald-600 text-white',
        patients: displayedPatients.filter((p) => p.ltcGroup === 1),
      },
      {
        group: 2,
        groupName: 'กลุ่ม 2 (เคลื่อนไหวได้ ช่วยเหลือตัวเองได้ปานกลาง)',
        taiText: 'TAI กลุ่ม B2, I2',
        adlText: 'ADL 12 - 20 คะแนน',
        targetVisitsText: '4 ครั้ง / เดือน',
        dayOfWeekText: 'ทุกวันอังคาร (สัปดาห์ละ 1 ครั้ง)',
        dates: g2Dates,
        colorBadge: 'bg-sky-100 text-sky-800 border-sky-300',
        colorBorder: 'border-sky-200',
        colorBg: 'bg-sky-50/70',
        colorText: 'text-sky-700',
        colorChip: 'bg-sky-600 text-white',
        patients: displayedPatients.filter((p) => p.ltcGroup === 2),
      },
      {
        group: 3,
        groupName: 'กลุ่ม 3 (ติดบ้าน ช่วยเหลือตัวเองได้น้อย)',
        taiText: 'TAI กลุ่ม C2, C3, C4',
        adlText: 'ADL 5 - 11 คะแนน',
        targetVisitsText: '4 ครั้ง / เดือน',
        dayOfWeekText: 'ทุกวันพุธ (สัปดาห์ละ 1 ครั้ง)',
        dates: g3Dates,
        colorBadge: 'bg-amber-100 text-amber-900 border-amber-300',
        colorBorder: 'border-amber-200',
        colorBg: 'bg-amber-50/70',
        colorText: 'text-amber-700',
        colorChip: 'bg-amber-600 text-white',
        patients: displayedPatients.filter((p) => p.ltcGroup === 3),
      },
      {
        group: 4,
        groupName: 'กลุ่ม 4 (ติดเตียง ภาวะพึ่งพิงสมบูรณ์)',
        taiText: 'TAI กลุ่ม D1, D2, D3',
        adlText: 'ADL 0 - 4 คะแนน',
        targetVisitsText: '7 ครั้ง / เดือน',
        dayOfWeekText: 'ทุกวันพฤหัสบดี และ วันศุกร์ (สัปดาห์ละ 2 ครั้ง)',
        dates: g4Dates,
        colorBadge: 'bg-rose-100 text-rose-800 border-rose-300',
        colorBorder: 'border-rose-200',
        colorBg: 'bg-rose-50/70',
        colorText: 'text-rose-700',
        colorChip: 'bg-rose-600 text-white',
        patients: displayedPatients.filter((p) => p.ltcGroup === 4),
      },
    ];
  }, [selectedYearCE, selectedMonthIdx, displayedPatients]);

  // Calendar parameters
  const totalDaysInMonth = new Date(selectedYearCE, selectedMonthIdx + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYearCE, selectedMonthIdx, 1).getDay(); // 0 = Sun

  // Map each day of the month to its scheduled groups
  const dayScheduleMap = useMemo(() => {
    const map: Record<number, GroupScheduleInfo[]> = {};
    for (let day = 1; day <= totalDaysInMonth; day++) {
      map[day] = [];
    }
    groupSchedules.forEach((gs) => {
      gs.dates.forEach((d) => {
        if (map[d]) {
          map[d].push(gs);
        }
      });
    });
    return map;
  }, [groupSchedules, totalDaysInMonth]);

  // Check if viewing current real month
  const isViewingCurrentMonth = selectedYearCE === currentCEYear && selectedMonthIdx === currentMonthIdx;

  // Filtered schedules for Table view
  const filteredGroupSchedules = useMemo(() => {
    if (selectedGroupFilter === 'all') return groupSchedules;
    return groupSchedules.filter((g) => g.group === selectedGroupFilter);
  }, [groupSchedules, selectedGroupFilter]);

  // Handle month navigation
  const handlePrevMonth = () => {
    if (selectedMonthIdx === 0) {
      setSelectedMonthIdx(11);
      setSelectedYearCE((prev) => prev - 1);
    } else {
      setSelectedMonthIdx((prev) => prev - 1);
    }
    setSelectedCalendarDay(null);
  };

  const handleNextMonth = () => {
    if (selectedMonthIdx === 11) {
      setSelectedMonthIdx(0);
      setSelectedYearCE((prev) => prev + 1);
    } else {
      setSelectedMonthIdx((prev) => prev + 1);
    }
    setSelectedCalendarDay(null);
  };

  const handleResetToCurrentMonth = () => {
    setSelectedYearCE(currentCEYear);
    setSelectedMonthIdx(currentMonthIdx);
    setSelectedCalendarDay(todayDateNum);
  };

  // Find today's scheduled groups
  const todayGroups = isViewingCurrentMonth ? dayScheduleMap[todayDateNum] || [] : [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-300 shadow-md flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                  Caregiver Dashboard
                </span>
                <span className="text-xs text-emerald-200">รหัส {currentUser.code}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Prompt',sans-serif] mt-0.5">
                ยินดีต้อนรับ, {currentUser.name}
              </h2>
              <p className="text-xs text-emerald-100 font-light mt-0.5">
                พื้นที่รับผิดชอบ: {currentUser.assignedVillage} • รพ.สต.ธาตุทอง
              </p>
            </div>
          </div>

          {onNavigateToMonthlyReport && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onNavigateToMonthlyReport}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>ดูใบรายงานประจำเดือน A4</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Essential Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">ผู้สูงอายุในความดูแล</span>
            <div className="text-2xl font-black text-slate-800 font-['Prompt',sans-serif]">
              {cgPatients.length} <span className="text-xs font-normal text-slate-500">ราย</span>
            </div>
            <span className="text-[11px] text-teal-600 font-medium">กลุ่ม 1 ถึง 4</span>
          </div>
        </div>

        {/* Card 2 */}
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
              คิดเป็น {percentage}% ของเป้าหมาย
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">เป้าหมายคงเหลือ</span>
            <div className="text-2xl font-black text-amber-600 font-['Prompt',sans-serif]">
              {remainingVisits} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium">
              เป้าหมายรวม {totalTargetVisits} ครั้ง/เดือน
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">สถานะรอบงาน</span>
            <div className="text-lg font-bold text-blue-700 font-['Prompt',sans-serif]">
              ปกติ (ตามเกณฑ์)
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              สัปดาห์ที่ 4 (24-30 ก.ย.)
            </span>
          </div>
        </div>
      </div>

      {/* LTC Monthly Visit Schedule & Calendar for CG */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
        {/* Schedule Header & Month Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-teal-900 via-emerald-900 to-teal-950 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-amber-400 text-amber-950 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  LTC Care Plan Schedule
                </span>
                <span className="text-xs text-teal-200">
                  ตารางแผนปฏิทินรายเดือนสำหรับ Caregiver
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-['Prompt',sans-serif] flex items-center gap-2 text-white">
                <CalendarDays className="w-5 h-5 text-amber-300" />
                <span>ตารางการออกเยี่ยมประจำเดือน {THAI_MONTHS[selectedMonthIdx]} {selectedYearCE + 543}</span>
              </h3>
              <p className="text-xs text-teal-100 mt-1 font-light">
                ระบุวันที่ต้องออกเยี่ยมตามระดับกลุ่ม LTC (กลุ่ม 1-4) ตามปฏิทินจริง เพื่อกระจายงานอย่างเหมาะสมและป้องกันการส่งข้อมูลก่อนเวลา
              </p>
            </div>

            {/* Month Navigator & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Prev / Month Dropdown / Next */}
              <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/20 backdrop-blur-xs">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={selectedMonthIdx}
                  onChange={(e) => {
                    setSelectedMonthIdx(Number(e.target.value));
                    setSelectedCalendarDay(null);
                  }}
                  className="bg-transparent text-white text-xs font-bold px-2 py-1 focus:outline-none cursor-pointer border-none"
                >
                  {THAI_MONTHS.map((monthName, idx) => (
                    <option key={idx} value={idx} className="text-slate-900 font-medium">
                      {monthName} {selectedYearCE + 543}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Reset to current month button */}
              {!isViewingCurrentMonth && (
                <button
                  type="button"
                  onClick={handleResetToCurrentMonth}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  กลับสู่เดือนนี้
                </button>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/15">
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scheduleViewMode === 'table'
                      ? 'bg-white text-teal-950 shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>ตารางรายกลุ่ม</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scheduleViewMode === 'calendar'
                      ? 'bg-white text-teal-950 shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>ปฏิทินรายเดือน</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Group Filter Bar & Status Overview */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>แสดงกลุ่ม:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedGroupFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                selectedGroupFilter === 'all'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ทุกกลุ่ม (1 - 4)
            </button>

            {groupSchedules.map((gs) => (
              <button
                key={gs.group}
                type="button"
                onClick={() => setSelectedGroupFilter(gs.group)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs border ${
                  selectedGroupFilter === gs.group
                    ? `${gs.colorChip} shadow-xs border-transparent`
                    : `${gs.colorBg} ${gs.colorText} ${gs.colorBorder} hover:opacity-90`
                }`}
              >
                กลุ่ม {gs.group} ({gs.targetVisitsText})
              </button>
            ))}
          </div>

          {/* Legend indicator */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>ก.1 (จันทร์)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>ก.2 (อังคาร)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>ก.3 (พุธ)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>ก.4 (พฤ.-ศ.)</span>
            </div>
          </div>
        </div>

        {/* Today's Queue Alert (if viewing current month) */}
        {isViewingCurrentMonth && (
          <div className={`p-4 border-b ${
            todayGroups.length > 0 
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  todayGroups.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm font-['Prompt',sans-serif] flex items-center gap-2">
                    <span>คิวการออกเยี่ยมวันนี้: วันที่ {todayDateNum} {THAI_MONTHS[selectedMonthIdx]} {selectedYearCE + 543}</span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      วันนี้
                    </span>
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {todayGroups.length > 0 ? (
                      <>
                        ตามตารางวันนี้เป็นคิวเยี่ยมของ: <strong>{todayGroups.map((g) => g.groupName).join(' และ ')}</strong> (มีผู้ป่วยในความดูแลของคุณ {todayGroups.reduce((acc, g) => acc + g.patients.length, 0)} ราย)
                      </>
                    ) : (
                      'วันนี้ไม่มีกำหนดการเยี่ยมตามรอบปกติประจำสัปดาห์ (วันหยุดพัก/ติดตามผลรายสัปดาห์)'
                    )}
                  </p>
                </div>
              </div>

              {todayGroups.length > 0 && todayGroups[0].patients.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigateToVisitLog(todayGroups[0].patients[0].id)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4 text-amber-300" />
                  <span>บันทึกเยี่ยมคิววันนี้</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* View Mode 1: Table Breakdown by Group */}
        {scheduleViewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 font-['Prompt',sans-serif]">
                <tr>
                  <th className="px-4 py-3.5">กลุ่มระดับภาวะพึ่งพิง (LTC Group)</th>
                  <th className="px-4 py-3.5 text-center">ความถี่เป้าหมาย</th>
                  <th className="px-4 py-3.5">วันประจำสัปดาห์</th>
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>วันที่ต้องออกเยี่ยมตามปฏิทินเดือนนี้ ({THAI_MONTHS[selectedMonthIdx]})</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5">ผู้สูงอายุในความดูแล</th>
                  <th className="px-4 py-3.5 text-center">ความก้าวหน้า</th>
                  <th className="px-4 py-3.5 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroupSchedules.map((gs) => {
                  const groupTotalTarget = gs.patients.reduce((sum, p) => sum + p.targetVisitsPerMonth, 0);
                  const groupCompleted = gs.patients.reduce((sum, p) => sum + p.visitsThisMonth, 0);
                  const groupPercent = groupTotalTarget > 0 ? Math.min(100, Math.round((groupCompleted / groupTotalTarget) * 100)) : 0;

                  return (
                    <tr key={gs.group} className="hover:bg-slate-50/80 transition-colors">
                      {/* Group Info */}
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1">
                          <span className={`inline-block text-[11px] px-2.5 py-1 rounded-lg font-bold border ${gs.colorBadge}`}>
                            กลุ่ม {gs.group}
                          </span>
                          <div className="font-bold text-slate-800 text-xs font-['Prompt',sans-serif] mt-1">
                            {gs.groupName.replace(/^กลุ่ม \d /, '')}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {gs.taiText} • {gs.adlText}
                          </div>
                        </div>
                      </td>

                      {/* Target Frequency */}
                      <td className="px-4 py-4 text-center align-top whitespace-nowrap">
                        <span className="font-black text-slate-800 text-sm font-['Prompt',sans-serif]">
                          {gs.targetVisitsText}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">ตามเกณฑ์ สปสช.</div>
                      </td>

                      {/* Day of Week */}
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-slate-800 text-xs">
                          {gs.dayOfWeekText}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          รอบเวลาออกเยี่ยมปกติ
                        </div>
                      </td>

                      {/* Calendar Dates in This Month */}
                      <td className="px-4 py-4 align-top min-w-[220px]">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1.5">
                            {gs.dates.map((dateNum) => {
                              const isTodayDate = isViewingCurrentMonth && dateNum === todayDateNum;
                              return (
                                <span
                                  key={dateNum}
                                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                    isTodayDate
                                      ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500 ring-offset-1 font-black animate-pulse'
                                      : `${gs.colorBg} ${gs.colorText} border ${gs.colorBorder}`
                                  }`}
                                  title={`วันที่ ${dateNum} ${THAI_MONTHS[selectedMonthIdx]} ${isTodayDate ? '(วันนี้มีคิวเยี่ยม)' : ''}`}
                                >
                                  {isTodayDate ? `★ ${dateNum} (วันนี้)` : `วันที่ ${dateNum}`}
                                </span>
                              );
                            })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            รวมทั้งหมด <strong className="text-slate-700">{gs.dates.length} วัน</strong> ในเดือนนี้
                          </div>
                        </div>
                      </td>

                      {/* Patients in this group */}
                      <td className="px-4 py-4 align-top min-w-[190px]">
                        {gs.patients.length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                              <Users className="w-3.5 h-3.5 text-teal-600" />
                              <span>{gs.patients.length} รายในความดูแล:</span>
                            </div>
                            <div className="space-y-1">
                              {gs.patients.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => onNavigateToVisitLog(p.id)}
                                  className="w-full text-left text-xs text-slate-700 hover:text-teal-700 hover:bg-teal-50/80 p-1 rounded-md transition-colors flex items-center justify-between cursor-pointer"
                                  title={`คลิกเพื่อเปิดแบบบันทึกเยี่ยมของ ${p.name}`}
                                >
                                  <span className="truncate max-w-[130px] font-medium">{p.name}</span>
                                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                    {p.visitsThisMonth}/{p.targetVisitsPerMonth} ครั้ง
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">ไม่มีผู้ป่วยกลุ่มนี้ในความดูแล</span>
                        )}
                      </td>

                      {/* Progress in Group */}
                      <td className="px-4 py-4 align-top text-center whitespace-nowrap min-w-[120px]">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-800">
                            {groupCompleted} / {groupTotalTarget} ครั้ง
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                groupPercent >= 100 ? 'bg-emerald-500' : 'bg-teal-600'
                              }`}
                              style={{ width: `${groupPercent}%` }}
                            ></div>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {groupPercent}% สำเร็จ
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                        {gs.patients.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToVisitLog(gs.patients[0].id)}
                            className="inline-flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                            <span>บันทึกเยี่ยม</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 2: Full Monthly Calendar Grid */}
        {scheduleViewMode === 'calendar' && (
          <div className="p-4 sm:p-5">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-600 font-['Prompt',sans-serif]">
              {THAI_DAYS_SHORT.map((dayName, idx) => (
                <div
                  key={idx}
                  className={`py-2 rounded-xl border ${
                    idx === 0 || idx === 6
                      ? 'bg-rose-50/60 text-rose-800 border-rose-100'
                      : 'bg-slate-100/80 text-slate-700 border-slate-200'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Previous Month Blank Cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[90px] rounded-2xl bg-slate-50/40 border border-dashed border-slate-200/60 p-2 opacity-30"
                ></div>
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const scheduledForDay = dayScheduleMap[dayNum] || [];
                const isTodayDate = isViewingCurrentMonth && dayNum === todayDateNum;
                const isSelected = selectedCalendarDay === dayNum;
                const dateObj = new Date(selectedYearCE, selectedMonthIdx, dayNum);
                const dayOfWeek = dateObj.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // Filter by group if active
                const visibleGroups = selectedGroupFilter === 'all'
                  ? scheduledForDay
                  : scheduledForDay.filter((g) => g.group === selectedGroupFilter);

                return (
                  <div
                    key={dayNum}
                    onClick={() => setSelectedCalendarDay(isSelected ? null : dayNum)}
                    className={`min-h-[95px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isTodayDate
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400 shadow-xs'
                        : isSelected
                        ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-400 shadow-xs'
                        : visibleGroups.length > 0
                        ? 'bg-white hover:bg-slate-50/90 border-slate-200 shadow-2xs'
                        : isWeekend
                        ? 'bg-slate-50/50 border-slate-200/70 text-slate-400'
                        : 'bg-white hover:bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    {/* Top: Date Number & Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-lg px-1.5 py-0.5 ${
                          isTodayDate
                            ? 'bg-amber-500 text-white font-black'
                            : isWeekend
                            ? 'text-rose-600 font-semibold'
                            : 'text-slate-700'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {isTodayDate && (
                        <span className="text-[9px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0.5 rounded-full uppercase">
                          วันนี้
                        </span>
                      )}
                    </div>

                    {/* Middle: Scheduled Groups */}
                    <div className="my-1.5 space-y-1">
                      {visibleGroups.length > 0 ? (
                        visibleGroups.map((g) => (
                          <div
                            key={g.group}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center justify-between ${g.colorBadge}`}
                          >
                            <span>กลุ่ม {g.group}</span>
                            <span className="text-[9px] opacity-80">
                              ({g.patients.length} ราย)
                            </span>
                          </div>
                        ))
                      ) : isWeekend ? (
                        <span className="text-[9px] text-slate-400 block text-center">วันหยุด/พัก</span>
                      ) : (
                        <span className="text-[9px] text-slate-300 block text-center">-</span>
                      )}
                    </div>

                    {/* Bottom: Quick Indicator */}
                    <div className="text-[9px] text-slate-400 text-right">
                      {visibleGroups.length > 0 && (
                        <span className="text-teal-700 font-medium hover:underline">
                          ดูรายชื่อ ›
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Day Details Box */}
            {selectedCalendarDay && (
              <div className="mt-4 p-4 rounded-2xl bg-teal-50/80 border border-teal-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-200/80">
                  <div className="flex items-center gap-2">
                    <CalendarCheck2 className="w-5 h-5 text-teal-700" />
                    <div>
                      <h4 className="font-bold text-sm text-teal-950 font-['Prompt',sans-serif]">
                        รายละเอียดกำหนดการออกเยี่ยม: วันที่ {selectedCalendarDay} {THAI_MONTHS[selectedMonthIdx]} {selectedYearCE + 543}
                      </h4>
                      <p className="text-xs text-teal-800 mt-0.5">
                        {dayScheduleMap[selectedCalendarDay]?.length > 0
                          ? `มีกำหนดเยี่ยมกลุ่ม: ${dayScheduleMap[selectedCalendarDay].map((g) => g.groupName).join(' และ ')}`
                          : 'ไม่มีกำหนดการเยี่ยมตามรอบปกติสำหรับวันนี้'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCalendarDay(null)}
                    className="text-xs font-bold text-teal-800 hover:text-teal-950 px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    ปิดแถบนี้
                  </button>
                </div>

                {/* List of Patients Scheduled for this day */}
                {dayScheduleMap[selectedCalendarDay]?.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {dayScheduleMap[selectedCalendarDay].flatMap((g) => g.patients).map((patient) => (
                      <div
                        key={patient.id}
                        className="bg-white p-3 rounded-xl border border-teal-200 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={patient.avatarUrl || DEFAULT_PATIENT_AVATAR}
                            alt={patient.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-800 truncate">
                              {patient.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              กลุ่ม {patient.ltcGroup} • {patient.villageName}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigateToVisitLog(patient.id)}
                          className="bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                        >
                          + เยี่ยม
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500 italic">
                    ไม่มีผู้สูงอายุที่ต้องลงเยี่ยมในวันนี้ สามารถใช้เวลานี้ตรวจเช็คบันทึกและรูปภาพของวันที่ผ่านมาได้
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Schedule Explanation & Standard Rules Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>เกณฑ์การกระจายวันลงเยี่ยม LTC:</strong> กลุ่ม 1 (2 ครั้ง/ด. เยี่ยมวันจันทร์สัปดาห์ 1, 3) • กลุ่ม 2 (4 ครั้ง/ด. ทุกวันอังคาร) • กลุ่ม 3 (4 ครั้ง/ด. ทุกวันพุธ) • กลุ่ม 4 (7 ครั้ง/ด. ทุกวันพฤหัสบดี และ ศุกร์) เพื่อให้การดูแลต่อเนื่องและบันทึกข้อมูลตามเวลาจริง
            </p>
          </div>
          <span className="text-[11px] text-teal-800 font-semibold shrink-0">
            ✓ สอดคล้องตามระเบียบกองทุน LTC สปสช.
          </span>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-['Prompt',sans-serif]">
              รายชื่อผู้สูงอายุที่ต้องลงเยี่ยมในรอบเดือนนี้ (กันยายน 2569)
            </h3>
            <p className="text-xs text-slate-500">
              คลิกปุ่ม "บันทึกเยี่ยม" เพื่อเปิดฟอร์มกรอกสัญญาณชีพและถ่ายภาพลงพื้นที่
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 font-['Prompt',sans-serif]">
              <tr>
                <th className="px-4 py-3">ผู้สูงอายุ</th>
                <th className="px-4 py-3">กลุ่ม LTC</th>
                <th className="px-4 py-3 text-center">เป้าหมายเดือนนี้</th>
                <th className="px-4 py-3 text-center">เยี่ยมแล้ว</th>
                <th className="px-4 py-3 text-center">คงเหลือ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cgPatients.map((patient) => {
                const remaining = Math.max(0, patient.targetVisitsPerMonth - patient.visitsThisMonth);
                const isComplete = remaining === 0;

                return (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={patient.avatarUrl || DEFAULT_PATIENT_AVATAR}
                          alt={patient.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageFallback(e, DEFAULT_PATIENT_AVATAR)}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-sm font-['Prompt',sans-serif]">
                            {patient.name}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            อายุ {patient.age} ปี • {patient.address} {patient.villageName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-[11px] px-2 py-0.5 rounded font-bold ${
                        patient.ltcGroup === 1 ? 'bg-emerald-100 text-emerald-800' :
                        patient.ltcGroup === 2 ? 'bg-sky-100 text-sky-800' :
                        patient.ltcGroup === 3 ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        กลุ่ม {patient.ltcGroup} ({patient.taiScore})
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {patient.targetVisitsPerMonth} ครั้ง
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-teal-700 text-sm">
                      {patient.visitsThisMonth} ครั้ง
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-amber-600 text-sm">
                      {remaining} ครั้ง
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          เยี่ยมครบแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3 text-amber-600" />
                          ยังต้องเยี่ยมเพิ่ม
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigateToVisitLog(patient.id)}
                        className="bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                        <span>กดบันทึกเยี่ยมรายนี้</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Information: CM Advice & Payroll Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CM Contact & Advice */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm font-['Prompt',sans-serif] flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-teal-600" />
                <span>คำแนะนำจากพยาบาล Care Manager (CM)</span>
              </h3>
              <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md">
                อัปเดตล่าสุดวันนี้
              </span>
            </div>

            <div className="flex items-start space-x-3 bg-teal-50/60 p-3.5 rounded-xl border border-teal-100 mb-3">
              <img
                src={CURRENT_CARE_MANAGER.avatarUrl}
                alt={CURRENT_CARE_MANAGER.name}
                className="w-11 h-11 rounded-xl object-cover ring-1 ring-teal-300 flex-shrink-0"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-800 font-['Prompt',sans-serif]">
                  {CURRENT_CARE_MANAGER.name}
                </div>
                <div className="text-slate-500 text-[11px]">{CURRENT_CARE_MANAGER.position}</div>
                <p className="text-slate-700 mt-1.5 leading-relaxed">
                  "ยอดเยี่ยมมากค่ะ คุณมะลิวัลย์ เหลือเพียงการตรวจติดตามแผลก้นกบของนายประเสริฐ และตรวจน้ำตาลปลายนิ้วของนางทองดี หากมีข้อติดขัดหรือผู้ป่วยมีไข้ ให้โทรประสาน รพ.สต. ได้ทันทีนะคะ"
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">ติดต่อฉุกเฉิน / ปรึกษาอาการ:</span>
            <a
              href={`tel:${CURRENT_CARE_MANAGER.phone}`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>โทรหา CM: {CURRENT_CARE_MANAGER.phone}</span>
            </a>
          </div>
        </div>

        {/* Schedule & Payroll notice */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm font-['Prompt',sans-serif]">
                กำหนดการส่งเอกสารและเบิกจ่ายค่าตอบแทน LTC
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-800">ปิดยอดบันทึกการลงเยี่ยม:</strong> ภายในวันที่ 30 ของทุกเดือน
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-800">Care Manager ตรวจสอบผลงาน:</strong> วันที่ 1 - 3 ของเดือนถัดไป
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-800">ผอ.รพ.สต. อนุมัติ & ส่งกองทุน LTC อบต./เทศบาล:</strong> วันที่ 5 ของเดือน
                </div>
              </div>
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>กรุณาตรวจสอบว่าได้ลงลายมือชื่อดิจิทัลครบทุกใบเยี่ยมก่อนกดส่งรายงานประจำเดือน</span>
            </div>
          </div>

          {onNavigateToMonthlyReport && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={onNavigateToMonthlyReport}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>ตรวจสอบใบรายงานประจำเดือน A4 ของคุณ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
