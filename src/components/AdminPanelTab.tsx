import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  Settings, 
  KeyRound, 
  Crown, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Lock, 
  Sparkles,
  HeartPulse,
  Calendar,
  Layers,
  FileSpreadsheet,
  Server
} from 'lucide-react';
import { StaffMember, ElderlyPatient, VisitRecord, SystemConfig } from '../types';
import { DEFAULT_SYSTEM_CONFIG } from '../data/mockData';
import { 
  saveStaffToFirestore, 
  deleteStaffFromFirestore, 
  saveSystemConfigToFirestore,
  savePatientToFirestore,
  saveVisitToFirestore
} from '../services/firestoreService';

interface AdminPanelTabProps {
  currentStaff: StaffMember;
  staffList: StaffMember[];
  onUpdateStaffList: (newStaffList: StaffMember[]) => void;
  patients: ElderlyPatient[];
  visits: VisitRecord[];
  onRestoreData?: (patients: ElderlyPatient[], visits: VisitRecord[]) => void;
}

export const AdminPanelTab: React.FC<AdminPanelTabProps> = ({
  currentStaff,
  staffList,
  onUpdateStaffList,
  patients,
  visits,
  onRestoreData,
}) => {
  const [activeAdminSection, setActiveAdminSection] = useState<'staff' | 'database' | 'config' | 'audit'>('staff');
  
  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // System Configuration State
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Staff Edit / Modal State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({
    name: '',
    code: '',
    role: 'caregiver',
    position: 'ผู้ดูแลผู้สูงอายุ (Caregiver : CG)',
    phone: '',
    assignedVillage: '',
    password: '1234',
    isAdmin: false,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  });

  // Password Reveal Toggle
  const [showStaffPasswords, setShowStaffPasswords] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Staff PIN Toggle
  const toggleShowPassword = (staffId: string) => {
    setShowStaffPasswords((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  // Toggle Admin status for a staff member
  const handleToggleAdmin = async (targetStaff: StaffMember) => {
    // If attempting to revoke CM 1, warn or prevent locking out
    if (targetStaff.id === 'cm-01' && targetStaff.isAdmin) {
      alert('นางสาวสิริวิมล สารสวัสดิ์ (CM คนที่ 1) คือผู้ดูแลระบบหลัก (Primary Admin) ของระบบ ไม่สามารถปิดสิทธิ์ได้');
      return;
    }

    const updated = {
      ...targetStaff,
      isAdmin: !targetStaff.isAdmin,
    };

    const updatedList = staffList.map((s) => (s.id === targetStaff.id ? updated : s));
    onUpdateStaffList(updatedList);
    try {
      await saveStaffToFirestore(updated);
      showToast(`อัปเดตสิทธิ์ Admin ของ ${updated.name} เป็น ${updated.isAdmin ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} เรียบร้อย`);
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการบันทึกสิทธิ์');
    }
  };

  // Save edited staff member
  const handleSaveEditedStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    const updatedList = staffList.map((s) => (s.id === editingStaff.id ? editingStaff : s));
    onUpdateStaffList(updatedList);
    try {
      await saveStaffToFirestore(editingStaff);
      setEditingStaff(null);
      showToast(`บันทึกข้อมูลเจ้าหน้าที่ ${editingStaff.name} เรียบร้อยแล้ว`);
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลเจ้าหน้าที่');
    }
  };

  // Add new staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.code) {
      alert('กรุณากรอกชื่อและรหัสเจ้าหน้าที่');
      return;
    }

    const createdStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      code: newStaff.code.trim(),
      name: newStaff.name.trim(),
      role: newStaff.role as any || 'caregiver',
      position: newStaff.position || 'ผู้ดูแลผู้สูงอายุ (Caregiver : CG)',
      phone: newStaff.phone || '',
      hospital: 'รพ.สต.ธาตุทอง',
      assignedVillage: newStaff.assignedVillage || '',
      assignedArea: newStaff.assignedVillage || '',
      avatarUrl: newStaff.avatarUrl || 'https://images.unsplash.com/photo-1594824813580-c08197bb755c?w=150&auto=format&fit=crop&q=80',
      password: newStaff.password || '1234',
      isAdmin: !!newStaff.isAdmin,
    };

    const updatedList = [...staffList, createdStaff];
    onUpdateStaffList(updatedList);
    try {
      await saveStaffToFirestore(createdStaff);
      setIsAddStaffOpen(false);
      setNewStaff({
        name: '',
        code: '',
        role: 'caregiver',
        position: 'ผู้ดูแลผู้สูงอายุ (Caregiver : CG)',
        phone: '',
        assignedVillage: '',
        password: '1234',
        isAdmin: false,
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      });
      showToast(`เพิ่มเจ้าหน้าที่ ${createdStaff.name} เข้าสู่ระบบเรียบร้อย`);
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการเพิ่มเจ้าหน้าที่');
    }
  };

  // Delete staff member
  const handleDeleteStaff = async (staffId: string, name: string) => {
    if (staffId === 'cm-01') {
      alert('ไม่สามารถลบผู้ดูแลระบบหลัก (CM คนที่ 1) ได้');
      return;
    }

    if (!confirm(`คุณต้องการลบข้อมูลเจ้าหน้าที่ "${name}" ออกจากระบบใช่หรือไม่?`)) {
      return;
    }

    const updatedList = staffList.filter((s) => s.id !== staffId);
    onUpdateStaffList(updatedList);
    try {
      await deleteStaffFromFirestore(staffId);
      showToast(`ลบข้อมูลเจ้าหน้าที่ ${name} ออกจากระบบเรียบร้อย`);
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการลบเจ้าหน้าที่');
    }
  };

  // Save System Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await saveSystemConfigToFirestore(systemConfig);
      showToast('บันทึกการตั้งค่าระบบ LTC ลง Cloud Firestore สำเร็จแล้ว');
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Download Full Database Backup JSON
  const handleDownloadBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      systemConfig,
      staffCount: staffList.length,
      patientCount: patients.length,
      visitCount: visits.length,
      staff: staffList,
      patients,
      visits,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ltc-cloud-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลดไฟล์สำรองข้อมูลคลาวด์ JSON เรียบร้อยแล้ว');
  };

  // Import Database Backup
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.patients && Array.isArray(json.patients)) {
          if (onRestoreData) {
            onRestoreData(json.patients, json.visits || []);
          }
          if (json.staff && Array.isArray(json.staff)) {
            onUpdateStaffList(json.staff);
            for (const s of json.staff) {
              await saveStaffToFirestore(s);
            }
          }
          showToast(`กู้คืนข้อมูลสำเร็จ: ผู้สูงอายุ ${json.patients.length} ราย, ประวัติเยี่ยม ${json.visits?.length || 0} รายการ`);
        } else {
          alert('โครงสร้างไฟล์สำรองข้อมูลไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Hero Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-purple-600/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold border border-amber-400/30">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>ระบบแผงควบคุมผู้ดูแลระบบ (Admin Console)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Prompt',sans-serif] flex items-center gap-2.5">
              <span>ศูนย์บริหารจัดการระบบ LTC รพ.สต.ธาตุทอง</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ผู้ดูแลระบบหลัก (Primary Admin): <strong className="text-amber-300">นางสาวสิริวิมล สารสวัสดิ์ (CM คนที่ 1)</strong> มีสิทธิ์เข้าถึง ควบคุมความปลอดภัย จัดการรหัสผ่าน และกำหนดสิทธิ์เจ้าหน้าที่ทั้งหมดในระบบ
            </p>
          </div>

          {/* Admin Identity Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-3.5 shrink-0 shadow-inner">
            <div className="relative">
              <img
                src={staffList.find(s => s.id === 'cm-01')?.avatarUrl || currentStaff.avatarUrl}
                alt="Admin Profile"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-xs">
                <Crown className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Primary Administrator</span>
              </div>
              <div className="font-bold text-sm text-white font-['Prompt',sans-serif]">
                นางสาวสิริวิมล สารสวัสดิ์
              </div>
              <div className="text-[11px] text-slate-300">
                รหัส: CM-4701-01 • สิทธิ์ Admin สูงสุด
              </div>
            </div>
          </div>
        </div>

        {/* Quick System Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-purple-800/40">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 block">ผู้สูงอายุในทะเบียน</span>
            <span className="text-xl font-black text-white">{patients.length} ราย</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 block">รายงานการออกเยี่ยม</span>
            <span className="text-xl font-black text-emerald-400">{visits.length} ครั้ง</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 block">เจ้าหน้าที่ในระบบ</span>
            <span className="text-xl font-black text-teal-300">{staffList.length} คน</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 block">สถานะฐานข้อมูลคลาวด์</span>
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Firestore ซิงค์เรียลไทม์
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveAdminSection('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeAdminSection === 'staff'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการเจ้าหน้าที่และกำหนดสิทธิ์ Admin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSection('config')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeAdminSection === 'config'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ตั้งค่าระบบ & โควตา LTC</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSection('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeAdminSection === 'database'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>สำรองข้อมูล & ระบบคลาวด์</span>
        </button>
      </div>

      {/* SECTION 1: Staff & Admin Role Management */}
      {activeAdminSection === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-700" />
                <span>รายชื่อเจ้าหน้าที่ การตั้งรหัสผ่าน และสิทธิ์ผู้ดูแลระบบ (Admin)</span>
              </h2>
              <p className="text-xs text-slate-500">
                คุณสามารถเปิด/ปิดสิทธิ์ Admin ให้เจ้าหน้าที่คนอื่น หรือรีเซ็ตรหัสผ่าน PIN ได้จากตารางนี้
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddStaffOpen(true)}
              className="bg-purple-800 hover:bg-purple-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มเจ้าหน้าที่ใหม่</span>
            </button>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">รูปภาพ / เจ้าหน้าที่</th>
                    <th className="py-3 px-3">รหัสประจำตัว</th>
                    <th className="py-3 px-3">บทบาท / ตำแหน่ง</th>
                    <th className="py-3 px-3">พื้นที่รับผิดชอบ</th>
                    <th className="py-3 px-3">รหัสผ่าน (PIN)</th>
                    <th className="py-3 px-3 text-center">สิทธิ์ Admin</th>
                    <th className="py-3 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((staff) => {
                    const isCM1 = staff.id === 'cm-01';
                    const isPasswordRevealed = !!showStaffPasswords[staff.id];

                    return (
                      <tr 
                        key={staff.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCM1 ? 'bg-purple-50/40' : ''
                        }`}
                      >
                        {/* Profile Photo & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={staff.avatarUrl}
                                alt={staff.name}
                                referrerPolicy="no-referrer"
                                className={`w-10 h-10 rounded-full object-cover border-2 ${
                                  staff.isAdmin ? 'border-amber-400' : 'border-slate-200'
                                }`}
                              />
                              {staff.isAdmin && (
                                <span className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full" title="ผู้ดูแลระบบ (Admin)">
                                  <Crown className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{staff.name}</span>
                                {isCM1 && (
                                  <span className="bg-purple-100 text-purple-800 text-[9.5px] px-1.5 py-0.2 rounded font-bold border border-purple-300">
                                    Admin หลัก (CM 1)
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">โทร: {staff.phone || '-'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                          {staff.code}
                        </td>

                        {/* Role & Position */}
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 ${
                            staff.role === 'caregiver' ? 'bg-emerald-100 text-emerald-800' :
                            staff.role === 'care_manager' ? 'bg-teal-100 text-teal-800' :
                            staff.role === 'director' ? 'bg-amber-100 text-amber-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {staff.role === 'caregiver' ? 'Caregiver (CG)' :
                             staff.role === 'care_manager' ? 'Care Manager (CM)' :
                             staff.role === 'director' ? 'ผู้อำนวยการ รพ.สต.' : 'Admin'}
                          </span>
                          <div className="text-[10.5px] text-slate-500 truncate max-w-[200px]">
                            {staff.position}
                          </div>
                        </td>

                        {/* Assigned Area */}
                        <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[180px] truncate" title={staff.assignedVillage || staff.assignedArea}>
                          {staff.assignedVillage || staff.assignedArea || 'ทั้งตำบล'}
                        </td>

                        {/* Password / PIN */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg w-fit">
                            <KeyRound className="w-3 h-3 text-slate-500" />
                            <span className="font-mono font-bold text-slate-800">
                              {isPasswordRevealed ? staff.password || '1234' : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(staff.id)}
                              className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                              title={isPasswordRevealed ? 'ซ่อนรหัส' : 'ดูรหัส'}
                            >
                              {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Admin Badge & Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(staff)}
                            disabled={isCM1}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                              staff.isAdmin
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            } ${isCM1 ? 'cursor-not-allowed opacity-90' : ''}`}
                            title={isCM1 ? 'ผู้ดูแลระบบหลัก (ไม่สามารถปิดได้)' : 'คลิกเพื่อเปลี่ยนสิทธิ์ Admin'}
                          >
                            <Crown className={`w-3.5 h-3.5 ${staff.isAdmin ? 'text-amber-600' : 'text-slate-400'}`} />
                            <span>{staff.isAdmin ? 'Admin' : 'ไม่ใช่ Admin'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingStaff(staff)}
                              className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลเจ้าหน้าที่"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {!isCM1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="ลบเจ้าหน้าที่"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: System Configuration */}
      {activeAdminSection === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-700" />
              <span>การตั้งค่าข้อมูลหน่วยงาน และเกณฑ์การออกเยี่ยม (LTC Standards)</span>
            </h2>
            <p className="text-xs text-slate-500">
              กำหนดข้อมูลหน่วยบริการสาธารณสุขและเป้าหมายความถี่การออกเยี่ยมของผู้ดูแลผู้สูงอายุ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อหน่วยงาน / รพ.สต.</label>
              <input
                type="text"
                value={systemConfig.hospitalName}
                onChange={(e) => setSystemConfig({ ...systemConfig, hospitalName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ตำบล</label>
              <input
                type="text"
                value={systemConfig.subdistrict}
                onChange={(e) => setSystemConfig({ ...systemConfig, subdistrict: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">อำเภอ</label>
              <input
                type="text"
                value={systemConfig.district}
                onChange={(e) => setSystemConfig({ ...systemConfig, district: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">จังหวัด</label>
              <input
                type="text"
                value={systemConfig.province}
                onChange={(e) => setSystemConfig({ ...systemConfig, province: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>
          </div>

          {/* Quotas */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              เกณฑ์เป้าหมายการออกเยี่ยมต่อเดือนตามกลุ่ม LTC (ครั้ง/เดือน)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">กลุ่มที่ 1 (ติดสังคม/ติดบ้านเล็กน้อย)</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={systemConfig.quotaGroup1}
                  onChange={(e) => setSystemConfig({ ...systemConfig, quotaGroup1: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-emerald-900 font-bold"
                />
                <span className="text-[10px] text-emerald-700 block mt-1">เกณฑ์มาตรฐาน: 1 ครั้ง/เดือน</span>
              </div>

              <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
                <span className="font-bold text-sky-900 block mb-1">กลุ่มที่ 2 (เริ่มติดบ้าน)</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={systemConfig.quotaGroup2}
                  onChange={(e) => setSystemConfig({ ...systemConfig, quotaGroup2: parseInt(e.target.value) || 2 })}
                  className="w-full px-3 py-1.5 bg-white border border-sky-300 rounded-lg text-sky-900 font-bold"
                />
                <span className="text-[10px] text-sky-700 block mt-1">เกณฑ์มาตรฐาน: 2 ครั้ง/เดือน</span>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">กลุ่มที่ 3 (ติดเตียงปานกลาง)</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={systemConfig.quotaGroup3}
                  onChange={(e) => setSystemConfig({ ...systemConfig, quotaGroup3: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-amber-900 font-bold"
                />
                <span className="text-[10px] text-amber-700 block mt-1">เกณฑ์มาตรฐาน: 4 ครั้ง/เดือน</span>
              </div>

              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                <span className="font-bold text-rose-900 block mb-1">กลุ่มที่ 4 (ติดเตียงรุนแรง/Palliative)</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={systemConfig.quotaGroup4}
                  onChange={(e) => setSystemConfig({ ...systemConfig, quotaGroup4: parseInt(e.target.value) || 8 })}
                  className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-rose-900 font-bold"
                />
                <span className="text-[10px] text-rose-700 block mt-1">เกณฑ์มาตรฐาน: 8 ครั้ง/เดือน</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="bg-purple-800 hover:bg-purple-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingConfig ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าลง Cloud Firestore'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 3: Database & Cloud Backup */}
      {activeAdminSection === 'database' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 font-['Prompt',sans-serif] flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-purple-700" />
              <span>สถานะ Cloud Firestore และการสำรอง/กู้คืนข้อมูล</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              ระบบเชื่อมต่อกับ Cloud Firestore แบบเรียลไทม์ คุณสามารถดาวน์โหลดไฟล์สำรองข้อมูลทั้งระบบเก็บไว้เป็น JSON ได้ตลอดเวลา
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm font-['Prompt',sans-serif]">
                    ดาวน์โหลดไฟล์สำรองข้อมูลระบบ (Full JSON Backup)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    บันทึกข้อมูลผู้สูงอายุ {patients.length} ราย, การออกเยี่ยม {visits.length} รายการ, เจ้าหน้าที่ {staffList.length} คน พร้อมภาพถ่ายทั้งหมดลงไฟล์คอมพิวเตอร์
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="mt-4 bg-purple-800 hover:bg-purple-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล</span>
                </button>
              </div>

              {/* Import Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm font-['Prompt',sans-serif]">
                    กู้คืนข้อมูลจากไฟล์สำรอง (Restore from JSON)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    เลือกไฟล์สำรอง (.json) ที่เคยบันทึกไว้ เพื่อกู้คืนข้อมูลผู้ป่วยและประวัติการออกเยี่ยมกลับคืนสู่ Cloud Firestore
                  </p>
                </div>
                <label className="mt-4 bg-white border border-teal-600 text-teal-700 hover:bg-teal-50 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>เลือกไฟล์ JSON เพื่อกู้คืน</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Cloud Config Details */}
            <div className="mt-6 pt-6 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-2 font-['Prompt',sans-serif]">
                รายละเอียดการเชื่อมต่อ Firebase Cloud Database:
              </span>
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] space-y-1">
                <div>Project ID: <span className="text-white">essential-reserve-f4r4b</span></div>
                <div>Database ID: <span className="text-white">ai-studio-caregivercgltcpo-a69877cb-5b55-45ba-a540-2ae668f4b1c5</span></div>
                <div>Sync Mode: <span className="text-emerald-300">Real-time Snapshot Listener (Active)</span></div>
                <div>Primary Admin: <span className="text-amber-300">CM-4701-01 (นางสาวสิริวิมล สารสวัสดิ์)</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-purple-900 text-white p-4 font-bold text-sm flex items-center justify-between font-['Prompt',sans-serif]">
              <span>แก้ไขข้อมูลเจ้าหน้าที่: {editingStaff.name}</span>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-purple-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedStaff} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อ-สกุล</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสเจ้าหน้าที่</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.code}
                    onChange={(e) => setEditingStaff({ ...editingStaff, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">บทบาท</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="caregiver">Caregiver (CG)</option>
                    <option value="care_manager">Care Manager (CM)</option>
                    <option value="director">ผู้อำนวยการ รพ.สต.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  value={editingStaff.position}
                  onChange={(e) => setEditingStaff({ ...editingStaff, position: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editingStaff.phone}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสผ่าน (PIN เข้าสู่ระบบ)</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.password || '1234'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">พื้นที่ / หมู่บ้านที่รับผิดชอบ</label>
                <input
                  type="text"
                  value={editingStaff.assignedVillage || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, assignedVillage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  placeholder="เช่น หมู่ 1 บ้านธาตุทอง"
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl font-bold cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-purple-900 text-white p-4 font-bold text-sm flex items-center justify-between font-['Prompt',sans-serif]">
              <span>เพิ่มเจ้าหน้าที่ใหม่เข้าสู่ระบบ</span>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-purple-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อ-สกุล</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นางสาวสมหมาย ใจดี"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสเจ้าหน้าที่</label>
                  <input
                    type="text"
                    required
                    placeholder="CG-4701-11"
                    value={newStaff.code}
                    onChange={(e) => setNewStaff({ ...newStaff, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">บทบาท</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => {
                      const role = e.target.value as any;
                      setNewStaff({
                        ...newStaff,
                        role,
                        position: role === 'caregiver' ? 'ผู้ดูแลผู้สูงอายุ (Caregiver : CG)' :
                                  role === 'care_manager' ? 'พยาบาลวิชาชีพ (Care Manager)' : 'ผู้อำนวยการ รพ.สต.'
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="caregiver">Caregiver (CG)</option>
                    <option value="care_manager">Care Manager (CM)</option>
                    <option value="director">ผู้อำนวยการ รพ.สต.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  value={newStaff.position}
                  onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    placeholder="08X-XXX-XXXX"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัส PIN (เริ่มต้น: 1234)</label>
                  <input
                    type="text"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">พื้นที่ / หมู่บ้านที่รับผิดชอบ</label>
                <input
                  type="text"
                  placeholder="เช่น หมู่ 1 บ้านธาตุทอง"
                  value={newStaff.assignedVillage}
                  onChange={(e) => setNewStaff({ ...newStaff, assignedVillage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newStaffAdmin"
                  checked={newStaff.isAdmin || false}
                  onChange={(e) => setNewStaff({ ...newStaff, isAdmin: e.target.checked })}
                  className="w-4 h-4 text-purple-700 rounded border-slate-300"
                />
                <label htmlFor="newStaffAdmin" className="text-xs font-semibold text-slate-700">
                  แต่งตั้งให้มีสิทธิ์เป็นผู้ดูแลระบบ (Admin)
                </label>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl font-bold cursor-pointer"
                >
                  เพิ่มเจ้าหน้าที่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
