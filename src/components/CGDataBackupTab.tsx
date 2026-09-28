import React, { useState, useRef } from 'react';
import { 
  Database, 
  Cloud, 
  Download, 
  Upload, 
  RefreshCw, 
  HardDrive, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Smartphone, 
  Save, 
  Key, 
  Sparkles,
  PhoneCall,
  Lock,
  UserCheck,
  UserPlus,
  Users,
  Camera,
  Image as ImageIcon,
  Edit,
  Eye,
  EyeOff,
  Building2,
  HeartPulse,
  X
} from 'lucide-react';
import { CaregiverUser, ElderlyPatient, VisitRecord, StaffMember } from '../types';
import { INITIAL_STAFF_MEMBERS, HOSPITAL_DIRECTOR } from '../data/mockData';

const THAT_THONG_VILLAGES = [
  'หมู่ 1 บ้านธาตุทอง',
  'หมู่ 2 บ้านหินโงม',
  'หมู่ 3 บ้านโนนสร้างไพ',
  'หมู่ 4 บ้านหนองหอย',
  'หมู่ 5 บ้านคันชา',
  'หมู่ 6 บ้านโคกหลวง',
  'หมู่ 7 บ้านเดิด',
  'หมู่ 8 บ้านเดื่อ',
];

interface CGDataBackupTabProps {
  currentUser: CaregiverUser;
  patients: ElderlyPatient[];
  visits: VisitRecord[];
  currentRole: 'caregiver' | 'care_manager' | 'director';
  staffList?: StaffMember[];
  onUpdateStaffList?: (staff: StaffMember[]) => void;
  onUpdatePatient?: (patient: ElderlyPatient) => void;
  onRestoreData: (restoredPatients: ElderlyPatient[], restoredVisits: VisitRecord[]) => void;
}

export const CGDataBackupTab: React.FC<CGDataBackupTabProps> = ({
  currentUser,
  patients,
  visits,
  currentRole,
  staffList = INITIAL_STAFF_MEMBERS,
  onUpdateStaffList,
  onUpdatePatient,
  onRestoreData,
}) => {
  // Active Sub-tab
  const [activeSection, setActiveSection] = useState<'cg' | 'cm' | 'director' | 'patients' | 'backup'>('cg');

  // Local Staff List State
  const [localStaff, setLocalStaff] = useState<StaffMember[]>(staffList);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTimestamp, setSyncTimestamp] = useState('วันนี้ 16:15 น.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const patientPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Modal State for Adding/Editing Staff
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffRoleToAdd, setStaffRoleToAdd] = useState<'caregiver' | 'care_manager'>('caregiver');

  // Form Fields for Add/Edit Staff
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('1234');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formVillages, setFormVillages] = useState<string[]>(['หมู่ 1 บ้านธาตุทอง']);
  const [showPassword, setShowPassword] = useState(false);

  // State for Editing Patient Photo
  const [editingPatientPhoto, setEditingPatientPhoto] = useState<ElderlyPatient | null>(null);
  const [tempPatientAvatarUrl, setTempPatientAvatarUrl] = useState('');

  // Director Form State
  const directorStaff = localStaff.find(s => s.role === 'director') || {
    id: 'dir-01',
    name: 'นายสยาม อ่อนสุระทุม',
    role: 'director',
    position: 'ผู้อำนวยการโรงพยาบาลส่งเสริมสุขภาพตำบลธาตุทอง',
    code: 'DIR-4705-01',
    phone: '042-721-123',
    password: '1234',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
  };

  const [directorName, setDirectorName] = useState(directorStaff.name);
  const [directorPos, setDirectorPos] = useState(directorStaff.position);
  const [directorPhone, setDirectorPhone] = useState(directorStaff.phone);
  const [directorPassword, setDirectorPassword] = useState(directorStaff.password || '1234');
  const [directorAvatar, setDirectorAvatar] = useState(directorStaff.avatarUrl);

  const [logs, setLogs] = useState([
    { id: 1, date: '25 ก.ย. 2569 16:15', type: 'สำรองคลาวด์ สปสช.', size: '1.4 MB', status: 'สำเร็จ' },
    { id: 2, date: '24 ก.ย. 2569 17:30', type: 'สำรองข้อมูลลงเครื่อง (JSON)', size: '1.2 MB', status: 'สำเร็จ' },
    { id: 3, date: '20 ก.ย. 2569 10:00', type: 'ส่งออกรายงาน A4 (PDF)', size: '3.8 MB', status: 'สำเร็จ' },
  ]);

  // Open Add Staff Modal
  const handleOpenAddStaff = (role: 'caregiver' | 'care_manager') => {
    setStaffRoleToAdd(role);
    setEditingStaff(null);
    setFormName('');
    setFormCode(role === 'caregiver' ? `CG-4705-0${localStaff.filter(s => s.role === 'caregiver').length + 1}` : `CM-4705-02`);
    setFormPosition(role === 'caregiver' ? 'ผู้ดูแลผู้สูงอายุ (Caregiver)' : 'พยาบาลวิชาชีพปฏิบัติการ / CM');
    setFormPhone('089-xxx-xxxx');
    setFormPassword('1234');
    setFormAvatarUrl('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80');
    setFormVillages(role === 'caregiver' ? ['หมู่ 1 บ้านธาตุทอง', 'หมู่ 2 บ้านหินโงม'] : [...THAT_THONG_VILLAGES]);
    setIsAddStaffOpen(true);
  };

  // Open Edit Staff Modal
  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setStaffRoleToAdd(staff.role as any);
    setFormName(staff.name);
    setFormCode(staff.code);
    setFormPosition(staff.position);
    setFormPhone(staff.phone);
    setFormPassword(staff.password || '1234');
    setFormAvatarUrl(staff.avatarUrl);
    
    // Parse existing assigned villages
    if (staff.assignedVillage) {
      const parsed = staff.assignedVillage.split(',').map(s => s.trim());
      setFormVillages(parsed.length > 0 ? parsed : ['หมู่ 1 บ้านธาตุทอง']);
    } else {
      setFormVillages(['หมู่ 1 บ้านธาตุทอง']);
    }
    setIsAddStaffOpen(true);
  };

  // Save Staff (Add or Edit)
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const villagesString = formVillages.length > 0 ? formVillages.join(', ') : 'หมู่ 1 บ้านธาตุทอง';
    let updatedList: StaffMember[];

    if (editingStaff) {
      // Edit existing
      updatedList = localStaff.map(s => {
        if (s.id === editingStaff.id) {
          return {
            ...s,
            name: formName.trim(),
            code: formCode.trim(),
            position: formPosition.trim(),
            phone: formPhone.trim(),
            password: formPassword.trim() || '1234',
            avatarUrl: formAvatarUrl.trim() || s.avatarUrl,
            assignedVillage: villagesString,
            assignedArea: villagesString,
          };
        }
        return s;
      });
      setToastMessage(`✓ ปรับปรุงข้อมูล ${formName.trim()} เรียบร้อยแล้ว`);
    } else {
      // Add new
      const newStaff: StaffMember = {
        id: `${staffRoleToAdd === 'caregiver' ? 'cg' : 'cm'}-${Date.now()}`,
        name: formName.trim(),
        role: staffRoleToAdd,
        position: formPosition.trim(),
        code: formCode.trim(),
        phone: formPhone.trim(),
        password: formPassword.trim() || '1234',
        avatarUrl: formAvatarUrl.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        assignedVillage: villagesString,
        assignedArea: villagesString,
      };
      updatedList = [...localStaff, newStaff];
      setToastMessage(`✓ เพิ่มข้อมูลเจ้าหน้าที่ ${formName.trim()} เรียบร้อยแล้ว`);
    }

    setLocalStaff(updatedList);
    if (onUpdateStaffList) {
      onUpdateStaffList(updatedList);
    }
    setIsAddStaffOpen(false);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save Director info
  const handleSaveDirector = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedList = localStaff.map(s => {
      if (s.role === 'director') {
        return {
          ...s,
          name: directorName.trim(),
          position: directorPos.trim(),
          phone: directorPhone.trim(),
          password: directorPassword.trim() || '1234',
          avatarUrl: directorAvatar.trim() || s.avatarUrl,
        };
      }
      return s;
    });

    setLocalStaff(updatedList);
    if (onUpdateStaffList) {
      onUpdateStaffList(updatedList);
    }
    setToastMessage(`✓ บันทึกข้อมูลผู้อำนวยการ (${directorName}) และรหัสผ่านเรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save Patient Photo
  const handleSavePatientPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatientPhoto) return;

    const newUrl = tempPatientAvatarUrl.trim() || editingPatientPhoto.avatarUrl;
    const updatedPatient: ElderlyPatient = {
      ...editingPatientPhoto,
      avatarUrl: newUrl,
    };

    if (onUpdatePatient) {
      onUpdatePatient(updatedPatient);
    }

    setEditingPatientPhoto(null);
    setToastMessage(`✓ อัปเดตรูปภาพของ ${editingPatientPhoto.name} เรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle local image file upload and convert to base64
  const handleFileUploadAsDataUrl = (e: React.ChangeEvent<HTMLInputElement>, targetType: 'staff' | 'director' | 'patient') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (targetType === 'staff') {
        setFormAvatarUrl(result);
      } else if (targetType === 'director') {
        setDirectorAvatar(result);
      } else if (targetType === 'patient') {
        setTempPatientAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Force Sync
  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      const timeStr = `วันนี้ ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;
      setSyncTimestamp(timeStr);
      setToastMessage('ซิงค์ข้อมูลกับเซิร์ฟเวอร์กลาง สปสช. สำเร็จแล้ว');
      setTimeout(() => setToastMessage(null), 3000);
    }, 1200);
  };

  // Real JSON Backup Download
  const handleDownloadBackup = () => {
    const backupPayload = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      staff: localStaff,
      caregiver: currentUser,
      patients: patients,
      visits: visits,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `LTC_FullBackup_รพสตธาตุทอง_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setLogs((prev) => [
      {
        id: Date.now(),
        date: `วันนี้ ${new Date().toLocaleTimeString('th-TH').slice(0, 5)} น.`,
        type: 'สำรองข้อมูลลงเครื่อง (JSON)',
        size: '1.6 MB',
        status: 'สำเร็จ',
      },
      ...prev,
    ]);

    setToastMessage('ดาวน์โหลดไฟล์สำรองข้อมูล JSON ลงในอุปกรณ์เรียบร้อยแล้ว');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real JSON Restore
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRole === 'caregiver') {
      setToastMessage('🔒 สิทธิ์ Caregiver (CG) ดูได้อย่างเดียว — การกู้คืนข้อมูลสำรองสงวนสิทธิ์สำหรับ Care Manager หรือ ผอ.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.patients && Array.isArray(json.patients)) {
          onRestoreData(json.patients, json.visits || []);
          if (json.staff && Array.isArray(json.staff)) {
            setLocalStaff(json.staff);
            if (onUpdateStaffList) onUpdateStaffList(json.staff);
          }
          setToastMessage(`✓ กู้คืนข้อมูลสำเร็จ (${json.patients.length} ผู้ป่วย, ${json.visits?.length || 0} การลงเยี่ยม)`);
        } else {
          setToastMessage('⚠️ ไฟล์ JSON ไม่ถูกต้องตามรูปแบบโครงสร้าง LTC');
        }
      } catch (err) {
        setToastMessage('❌ เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
      setTimeout(() => setToastMessage(null), 4000);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const cgList = localStaff.filter(s => s.role === 'caregiver');
  const cmList = localStaff.filter(s => s.role === 'care_manager');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-teal-600 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-700" />
              <span>ระบบจัดการข้อมูลบุคลากร CG, CM, ผอ. & รูปภาพผู้ป่วย</span>
            </h2>
            <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-medium">
              รพ.สต.ธาตุทอง
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            แยกเพิ่มข้อมูล CG, CM และ ผอ. พร้อมตั้งรหัสผ่านเข้าสู่ระบบ และเพิ่ม/เปลี่ยนรูปภาพบุคลากรและผู้ป่วย
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSection('cg')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSection === 'cg' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ผู้ดูแล (CG) ({cgList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('cm')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSection === 'cm' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ผู้จัดการ (CM) ({cmList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('director')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSection === 'director' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ผู้อำนวยการ รพ.สต.
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('patients')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSection === 'patients' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รูปผู้ป่วย ({patients.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('backup')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSection === 'backup' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สำรองข้อมูล JSON
          </button>
        </div>
      </div>

      {/* SECTION 1: CG MANAGEMENT */}
      {activeSection === 'cg' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>รายชื่อผู้ดูแลผู้สูงอายุ (Caregiver : CG) ในระบบ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                สามารถเพิ่มข้อมูล CG, กำหนดรหัสผ่านเข้าสู่ระบบ (PIN / Password) และเพิ่มรูปภาพโปรไฟล์ได้
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddStaff('caregiver')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มข้อมูล CG ใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cgList.map((cg) => (
              <div
                key={cg.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:border-emerald-500 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-100 shrink-0">
                      <img
                        src={cg.avatarUrl}
                        alt={cg.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm truncate font-['Prompt',sans-serif]">
                          {cg.name}
                        </span>
                      </div>
                      <span className="inline-block text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5">
                        Caregiver (CG)
                      </span>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        รหัส: {cg.code}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1">
                    <div className="text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">โทรศัพท์:</span>
                      <span className="font-medium text-slate-800">{cg.phone}</span>
                    </div>
                    <div className="text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">พื้นที่ดูแล:</span>
                      <span className="font-semibold text-teal-800">{cg.assignedVillage || 'ม.1 - ม.2'}</span>
                    </div>
                    <div className="text-slate-600 flex items-center justify-between bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-emerald-900 font-medium flex items-center gap-1">
                        <Key className="w-3 h-3 text-emerald-600" />
                        รหัสผ่านเข้าสู่ระบบ:
                      </span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {cg.password || '1234'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditStaff(cg)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3 text-emerald-700" />
                    <span>แก้ไขข้อมูล & รหัสผ่าน</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: CM MANAGEMENT */}
      {activeSection === 'cm' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-700" />
                <span>รายชื่อผู้จัดการการดูแลผู้สูงอายุ (Care Manager : CM)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                พยาบาลวิชาชีพผู้รับผิดชอบการประเมิน วางแผน Care Plan และตรวจสอบรายงานเบิกจ่าย
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddStaff('care_manager')}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มข้อมูล CM ใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cmList.map((cm) => (
              <div
                key={cm.id}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 hover:border-teal-500 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-teal-100 shrink-0">
                      <img
                        src={cm.avatarUrl}
                        alt={cm.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm sm:text-base font-['Prompt',sans-serif]">
                        {cm.name}
                      </div>
                      <span className="inline-block text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.2 rounded mt-0.5">
                        Care Manager (CM)
                      </span>
                      <div className="text-xs text-slate-600 mt-1">{cm.position}</div>
                      <div className="text-[11px] text-slate-400 font-mono">รหัส: {cm.code}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5">
                    <div className="text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">โทรศัพท์:</span>
                      <span className="font-medium text-slate-800">{cm.phone}</span>
                    </div>
                    <div className="text-slate-600 flex items-start justify-between gap-2">
                      <span className="text-slate-400 shrink-0">พื้นที่ดูแล:</span>
                      <span className="font-medium text-teal-800 text-right leading-tight text-[11px]">
                        {cm.assignedVillage || 'ทั้งตำบล (ม.1 - ม.8)'}
                      </span>
                    </div>
                    <div className="text-slate-600 flex items-center justify-between bg-teal-50/50 p-2 rounded-lg border border-teal-100">
                      <span className="text-teal-900 font-medium flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-teal-700" />
                        รหัสผ่านเข้าสู่ระบบ (PIN):
                      </span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-teal-200">
                        {cm.password || '1234'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditStaff(cm)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5 text-teal-700" />
                    <span>แก้ไขข้อมูล CM & รหัสผ่าน</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: DIRECTOR MANAGEMENT */}
      {activeSection === 'director' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <span>ข้อมูลผู้อำนวยการโรงพยาบาลส่งเสริมสุขภาพตำบลธาตุทอง</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ผู้รับรองและลงนามอนุมัติเบิกจ่ายในใบรายงานประจำเดือน A4 และกำกับระบบ LTC
              </p>
            </div>
            <span className="text-xs bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-full font-bold">
              ผู้อนุมัติสูงสุดประจำหน่วยบริการ
            </span>
          </div>

          <form onSubmit={handleSaveDirector} className="space-y-4 text-xs max-w-2xl">
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-300 shrink-0 shadow-sm">
                <img
                  src={directorAvatar}
                  alt={directorName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1.5 flex-1">
                <label className="block text-slate-700 font-bold">รูปถ่ายผู้อำนวยการ (URL หรือเลือกไฟล์ภาพ):</label>
                <input
                  type="text"
                  value={directorAvatar}
                  onChange={(e) => setDirectorAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
                <div>
                  <label className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                    <Camera className="w-3.5 h-3.5 text-amber-600" />
                    <span>อัปโหลดรูปภาพจากอุปกรณ์</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUploadAsDataUrl(e, 'director')}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อ - นามสกุล ผู้อำนวยการ:</label>
                <input
                  type="text"
                  required
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ที่ติดต่อได้:</label>
                <input
                  type="text"
                  value={directorPhone}
                  onChange={(e) => setDirectorPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ตำแหน่งทางการเต็ม:</label>
              <input
                type="text"
                required
                value={directorPos}
                onChange={(e) => setDirectorPos(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                ตัวอย่าง: ผู้อำนวยการโรงพยาบาลส่งเสริมสุขภาพตำบลธาตุทอง
              </span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
              <label className="block font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-700" />
                <span>รหัสผ่านเข้าสู่ระบบสำหรับผู้อำนวยการ (PIN / Password):</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={directorPassword}
                  onChange={(e) => setDirectorPassword(e.target.value)}
                  placeholder="เช่น 1234"
                  className="p-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-sm tracking-wider w-40 text-slate-900"
                />
                <span className="text-slate-500 text-[11px]">
                  * ผอ. สามารถใช้รหัสผ่านนี้เพื่อล็อกอินอนุมัติเอกสาร A4 ในหน้าเข้าสู่ระบบ
                </span>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไขข้อมูลผู้อำนวยการ</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 4: PATIENT PHOTOS MANAGEMENT */}
      {activeSection === 'patients' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-700" />
                <span>จัดการและเพิ่มรูปภาพประจำตัวผู้สูงอายุ / ผู้ป่วย LTC ({patients.length} คน)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                คลิกปุ่ม "เปลี่ยนรูปภาพ" เพื่ออัปโหลดรูปภาพใหม่จากมือถือ/คอมพิวเตอร์ หรือใส่ Image URL
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 hover:border-teal-400 shadow-2xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                    <img
                      src={patient.avatarUrl}
                      alt={patient.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                      กลุ่ม {patient.ltcGroup}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900 font-['Prompt',sans-serif] truncate">
                    {patient.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    อายุ {patient.age} ปี • {patient.villageNo}
                  </div>
                  <div className="text-[10px] text-teal-800 font-mono mt-0.5">
                    ADL: {patient.adlScore} / 20 ({patient.taiScore})
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPatientPhoto(patient);
                      setTempPatientAvatarUrl(patient.avatarUrl);
                    }}
                    className="w-full py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>เปลี่ยนรูปภาพ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: JSON BACKUP & SYNC */}
      {activeSection === 'backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backup Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 font-['Prompt',sans-serif] text-sm">
                    สำรองข้อมูลระบบทั้งหมด (Full JSON Backup)
                  </h4>
                  <p className="text-xs text-slate-500">
                    บันทึกข้อมูล CG, CM, ผอ., ผู้สูงอายุ, การลงเยี่ยม และรูปภาพเป็นไฟล์ JSON
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล JSON</span>
                </button>
              </div>
            </div>

            {/* Restore Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 font-['Prompt',sans-serif] text-sm">
                    กู้คืนข้อมูลจากไฟล์สำรอง (JSON Restore)
                  </h4>
                  <p className="text-xs text-slate-500">
                    เลือกไฟล์ JSON เพื่อนำเข้าข้อมูลกลับเข้าระบบ (สำหรับ CM / ผู้ดูแลระบบ)
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>เลือกไฟล์ JSON เพื่อกู้คืน</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync & Backup Log Table */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-800 font-['Prompt',sans-serif]">
                ประวัติการสำรองและซิงค์ข้อมูล
              </h4>
              <button
                type="button"
                onClick={handleForceSync}
                disabled={isSyncing}
                className="text-xs text-teal-700 font-bold flex items-center gap-1 hover:text-teal-800 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ สปสช. ตอนนี้'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">วันและเวลา</th>
                    <th className="py-2 px-3">ประเภทการสำรอง</th>
                    <th className="py-2 px-3">ขนาดไฟล์</th>
                    <th className="py-2 px-3 text-right">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 px-3 text-slate-600">{log.date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{log.type}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono">{log.size}</td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-bold">✓ {log.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Staff (CG / CM) */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-800 to-emerald-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm font-['Prompt',sans-serif]">
                  {editingStaff ? `แก้ไขข้อมูล: ${editingStaff.name}` : `เพิ่มข้อมูลบุคลากร (${staffRoleToAdd.toUpperCase()})`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-teal-100 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-5 space-y-3 text-xs">
              {/* Photo Preview & URL */}
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300 shrink-0">
                  <img
                    src={formAvatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block font-bold text-slate-700">รูปภาพโปรไฟล์ (URL หรืออัปโหลด):</label>
                  <input
                    type="text"
                    value={formAvatarUrl}
                    onChange={(e) => setFormAvatarUrl(e.target.value)}
                    placeholder="ใส่ URL รูปภาพ..."
                    className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <div>
                    <label className="inline-flex items-center gap-1 text-[10px] text-teal-700 font-bold hover:underline cursor-pointer">
                      <Camera className="w-3 h-3" />
                      <span>เลือกไฟล์ภาพจากอุปกรณ์</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUploadAsDataUrl(e, 'staff')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อ - นามสกุล:</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นางสาวสมหมาย ใจดี"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสประจำตัว:</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์:</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ตำแหน่ง / หน้าที่:</label>
                <input
                  type="text"
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800"
                />
              </div>

              {/* Assigned Villages Checkboxes for both CG and CM */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700">
                    หมู่บ้านที่รับผิดชอบ (ติ๊กเลือกหมู่บ้านที่ดูแล):
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setFormVillages([...THAT_THONG_VILLAGES])}
                      className="text-teal-700 hover:underline font-bold cursor-pointer"
                    >
                      เลือกทั้ง 8 หมู่บ้าน
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setFormVillages([])}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      ล้าง
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {THAT_THONG_VILLAGES.map((villageName) => {
                    const isChecked = formVillages.includes(villageName);
                    return (
                      <label
                        key={villageName}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setFormVillages((prev) =>
                              prev.includes(villageName)
                                ? prev.filter((v) => v !== villageName)
                                : [...prev, villageName]
                            );
                          }}
                          className="w-3.5 h-3.5 text-teal-700 rounded focus:ring-teal-500 cursor-pointer"
                        />
                        <span className="truncate select-none">{villageName}</span>
                      </label>
                    );
                  })}
                </div>

                {formVillages.length === 0 ? (
                  <span className="text-[10px] text-rose-600 mt-1 block">
                    * กรุณาติ๊กเลือกอย่างน้อย 1 หมู่บ้าน
                  </span>
                ) : (
                  <span className="text-[10px] text-teal-700 mt-1 block font-medium">
                    เลือกแล้ว {formVillages.length} หมู่บ้าน: {formVillages.map(v => v.split(' ')[0] + ' ' + v.split(' ')[1]).join(', ')}
                  </span>
                )}
              </div>

              {/* Password Setting Field */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <label className="block font-bold text-emerald-950 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-700" />
                    ช่องตั้งรหัสผ่านเข้าสู่ระบบ (PIN / Password):
                  </span>
                  <span className="text-[10px] text-emerald-700">แนะนำ: 4-8 หลัก</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="เช่น 1234"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full p-2 pr-9 border border-slate-300 rounded-lg bg-white text-slate-900 font-mono font-bold text-sm tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Patient Photo */}
      {editingPatientPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-teal-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-300" />
                <h3 className="font-bold text-sm font-['Prompt',sans-serif]">
                  เปลี่ยนรูปภาพ: {editingPatientPhoto.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPatientPhoto(null)}
                className="text-teal-100 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatientPhoto} className="p-5 space-y-3 text-xs">
              <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-teal-500 shadow-sm">
                <img
                  src={tempPatientAvatarUrl || editingPatientPhoto.avatarUrl}
                  alt={editingPatientPhoto.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL ของผู้ป่วย:</label>
                <input
                  type="text"
                  value={tempPatientAvatarUrl}
                  onChange={(e) => setTempPatientAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>

              <div className="text-center pt-1">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors">
                  <Camera className="w-3.5 h-3.5 text-teal-700" />
                  <span>เลือกรูปภาพจากเครื่อง (อัปโหลด)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUploadAsDataUrl(e, 'patient')}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPatientPhoto(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกรูปภาพ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
