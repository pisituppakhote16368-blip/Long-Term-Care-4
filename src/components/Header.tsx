import React from 'react';
import { 
  HeartPulse, 
  UserCheck, 
  Calendar, 
  FileText, 
  Users, 
  Database, 
  BarChart3, 
  CheckCircle2, 
  ShieldCheck, 
  LogOut, 
  Sparkles,
  ChevronDown,
  Lock,
  Boxes,
  Pin
} from 'lucide-react';
import { CaregiverUser, StaffMember } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: CaregiverUser;
  currentRole: 'caregiver' | 'care_manager' | 'director';
  currentStaff?: StaffMember;
  onSwitchRole: (role: 'caregiver' | 'care_manager') => void;
  onOpenLoginModal: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  currentRole,
  currentStaff,
  onSwitchRole,
  onOpenLoginModal,
  isOnline
}) => {
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  // ในมุมมอง CG ให้แถบเครื่องมือ/หัวเว็บเลื่อนตามเนื้อหาหน้าจอ ไม่ตรึงทับหน้าจอ เพื่อให้แถบงานของ CG และใบรายงาน A4 เลื่อนและตรึงอย่างอิสระ
  const [isHeaderSticky, setIsHeaderSticky] = React.useState<boolean>(false);

  // อัปเดตเมื่อสลับบทบาท (ถ้าเป็น CG ให้เลื่อนตามหน้าจอเสมอ)
  React.useEffect(() => {
    if (currentRole === 'caregiver') {
      setIsHeaderSticky(false);
    }
  }, [currentRole]);

  // สิทธิ์การเข้าถึงเมนูแท็บ:
  // หากล็อกอินด้วยชื่อ CG (Caregiver) จะเห็นเฉพาะหน้า 1 (บันทึกการออกเยี่ยม) และหน้า 2 (สรุปยอดงานเยี่ยมของฉัน) เท่านั้น
  const allTabs = [
    { id: 'visit-log', label: '1. บันทึกการออกเยี่ยม', icon: HeartPulse, allowedRoles: ['caregiver', 'care_manager', 'director'] },
    { id: 'my-summary', label: '2. สรุปยอดงานเยี่ยมของฉัน', icon: BarChart3, allowedRoles: ['caregiver', 'care_manager', 'director'] },
    { id: 'cm-audit', label: '3. ตรวจสอบงาน CM รายเดือน', icon: UserCheck, allowedRoles: ['care_manager', 'director'] },
    { id: 'monthly-report', label: '4. ใบรายงานประจำเดือน A4', icon: FileText, allowedRoles: ['care_manager', 'director'] },
    { id: 'elderly-registry', label: '5. ทะเบียนผู้สูงอายุ', icon: Users, allowedRoles: ['care_manager', 'director'] },
    { id: 'cg-data-backup', label: '6. ข้อมูลบุคลากร & สำรอง', icon: Database, allowedRoles: ['care_manager', 'director'] },
    { id: 'supplies', label: '7. รายการของใช้จำเป็น', icon: Boxes, allowedRoles: ['care_manager', 'director'] },
  ];

  // ถ้าล็อกอินด้วยชื่อ CG สามารถเห็นแค่หน้า 1 และหน้า 2 เท่านั้น
  const visibleTabs = currentRole === 'caregiver'
    ? allTabs.filter(t => t.id === 'visit-log' || t.id === 'my-summary')
    : allTabs;

  return (
    <header className={`bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white shadow-lg no-print transition-all ${
      isHeaderSticky ? 'sticky top-0 z-40' : 'relative z-40'
    }`}>
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 border-b border-emerald-700/50 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1 bg-emerald-700/60 px-2 py-0.5 rounded-full text-emerald-100 font-medium">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-300 animate-pulse' : 'bg-amber-400'}`}></span>
            {isOnline ? 'ออนไลน์ (ระบบ รพ.สต.ธาตุทอง)' : 'ออฟไลน์ (โหมดบันทึกลงเครื่อง)'}
          </span>
          <span className="hidden sm:inline text-emerald-200">
            ระบบสนับสนุนการปฏิบัติงานการดูแลระยะยาว (Long Term Care : LTC)
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-emerald-200 font-light">
            วันนี้: <strong className="font-semibold text-white">25 กันยายน 2569</strong>
          </span>

          {/* Toggle Header Pin / Scroll with page */}
          <button
            type="button"
            onClick={() => setIsHeaderSticky(!isHeaderSticky)}
            className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer border ${
              isHeaderSticky 
                ? 'bg-emerald-700/80 text-emerald-100 border-emerald-500/50 hover:bg-emerald-600' 
                : 'bg-emerald-900/80 text-amber-200 border-amber-400/50 hover:bg-emerald-950'
            }`}
            title={isHeaderSticky ? "แถบหัวเว็บตรึงอยู่ด้านบน (คลิกเพื่อให้เลื่อนตามหน้าจอ)" : "แถบหัวเว็บเลื่อนตามหน้าจอ (คลิกเพื่อตรึงไว้ด้านบน)"}
          >
            <Pin className={`w-3 h-3 ${isHeaderSticky ? 'text-emerald-300' : 'text-amber-300'}`} />
            <span>{isHeaderSticky ? 'ตรึงหัวเว็บ' : 'หัวเว็บเลื่อนตาม'}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded-md text-emerald-50 transition-colors cursor-pointer border border-emerald-500/40"
              title="สลับสิทธิ์การใช้งาน"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>สิทธิ์: {currentRole === 'caregiver' ? 'Caregiver (CG)' : 'Care Manager (CM)'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-slate-100 font-semibold text-slate-500 uppercase tracking-wider">
                  สลับมุมมองผู้ใช้งาน
                </div>
                <button
                  onClick={() => {
                    onSwitchRole('caregiver');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                    currentRole === 'caregiver' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>ผู้ดูแลผู้สูงอายุ (CG)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 pl-4">เห็นเฉพาะหน้า 1 และหน้า 2</span>
                  </div>
                  {currentRole === 'caregiver' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => {
                    onSwitchRole('care_manager');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                    currentRole === 'care_manager' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      <span>ผู้จัดการการดูแล (CM)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 pl-4">เข้าถึงได้ครบทั้ง 7 หน้า</span>
                  </div>
                  {currentRole === 'care_manager' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onOpenLoginModal();
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-600 hover:text-red-600 flex items-center gap-2 hover:bg-red-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>เข้าสู่ระบบด้วยบัญชีอื่น</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main branding & identity banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/20 shadow-inner flex-shrink-0">
            <div className="w-full h-full rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-7 h-7" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Prompt',sans-serif]">
                ระบบส่งงานผู้ดูแลผู้สูงอายุ (Caregiver: CG)
              </h1>
              <span className="bg-amber-400/90 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full tracking-wide uppercase shadow-sm">
                LTC Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 font-light mt-0.5">
              โรงพยาบาลส่งเสริมสุขภาพตำบลธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร
            </p>
          </div>
        </div>

        {/* User profile & summary */}
        <div 
          onClick={onOpenLoginModal}
          className="flex items-center gap-3 self-end md:self-auto bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-600/30 rounded-xl px-3.5 py-2 cursor-pointer transition-colors"
          title="คลิกเพื่อสลับผู้ใช้งาน / เข้าสู่ระบบ"
        >
          <img
            src={currentStaff?.avatarUrl || currentUser.avatarUrl}
            alt={currentStaff?.name || currentUser.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-400/60 shadow-sm"
          />
          <div className="text-right">
            <div className="text-xs text-emerald-200">
              {currentStaff 
                ? (currentStaff.role === 'director' ? 'ผู้อำนวยการ รพ.สต.' : currentStaff.role === 'care_manager' ? 'Care Manager (CM)' : 'ผู้ดูแลผู้สูงอายุ (CG)')
                : (currentRole === 'caregiver' ? 'ผู้ดูแลผู้สูงอายุ (CG)' : 'ผู้จัดการการดูแล (CM)')}
            </div>
            <div className="text-sm font-semibold text-white leading-tight">
              {currentStaff?.name || currentUser.name}
            </div>
            <div className="text-[11px] text-emerald-300/90 truncate max-w-[200px]">
              {currentStaff ? (currentStaff.code ? `รหัส: ${currentStaff.code}` : currentStaff.position) : `รหัส: ${currentUser.code}`}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar space-x-1 border-t border-emerald-700/60">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                isActive
                  ? 'border-amber-300 text-white bg-emerald-900/50 shadow-inner'
                  : 'border-transparent text-emerald-100 hover:text-white hover:bg-emerald-700/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-emerald-300'}`} />
              <span>{tab.label}</span>
              {tab.id === 'cm-audit' && (
                <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                  รอตรวจ 2
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
