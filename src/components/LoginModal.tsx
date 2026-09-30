import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  ShieldCheck, 
  HeartPulse, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Sparkles,
  Building2,
  KeyRound,
  AlertCircle,
  Crown,
  BookmarkCheck,
  Trash2,
  RotateCcw,
  Check,
  Delete
} from 'lucide-react';
import { StaffMember } from '../types';
import { INITIAL_STAFF_MEMBERS } from '../data/mockData';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList?: StaffMember[];
  onSelectStaff: (staff: StaffMember) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  staffList = INITIAL_STAFF_MEMBERS,
  onSelectStaff,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    try {
      const savedStaffId = localStorage.getItem('caregiver_last_login_staff_id');
      if (savedStaffId && staffList.some(s => s.id === savedStaffId)) {
        return savedStaffId;
      }
    } catch {}
    return staffList[0]?.id || 'cg-01';
  });

  const [rememberPassword, setRememberPassword] = useState<boolean>(() => {
    try {
      const initialId = localStorage.getItem('caregiver_last_login_staff_id') || staffList[0]?.id || 'cg-01';
      return localStorage.getItem(`caregiver_remember_pwd_${initialId}`) === 'true';
    } catch {
      return false;
    }
  });

  const [passwordInput, setPasswordInput] = useState<string>(() => {
    try {
      const initialId = localStorage.getItem('caregiver_last_login_staff_id') || staffList[0]?.id || 'cg-01';
      const isRem = localStorage.getItem(`caregiver_remember_pwd_${initialId}`) === 'true';
      if (isRem) {
        const savedPwd = localStorage.getItem(`caregiver_saved_pwd_${initialId}`);
        if (savedPwd) return savedPwd;
      }
    } catch {}
    return '1234';
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSelectedStaff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];

  const handleStaffClick = (staff: StaffMember) => {
    setSelectedStaffId(staff.id);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const isRem = localStorage.getItem(`caregiver_remember_pwd_${staff.id}`) === 'true';
      setRememberPassword(isRem);
      if (isRem) {
        const savedPwd = localStorage.getItem(`caregiver_saved_pwd_${staff.id}`);
        setPasswordInput(savedPwd !== null ? savedPwd : (staff.password || '1234'));
      } else {
        setPasswordInput(staff.password || '1234');
      }
    } catch {
      setPasswordInput(staff.password || '1234');
    }
  };

  const handleToggleRemember = (checked: boolean) => {
    setRememberPassword(checked);
    setErrorMessage(null);
    try {
      if (checked) {
        localStorage.setItem(`caregiver_remember_pwd_${selectedStaffId}`, 'true');
        localStorage.setItem(`caregiver_saved_pwd_${selectedStaffId}`, passwordInput);
        setInfoMessage('✓ บันทึกจำรหัสผ่านในเครื่องนี้แล้ว');
      } else {
        localStorage.removeItem(`caregiver_remember_pwd_${selectedStaffId}`);
        localStorage.removeItem(`caregiver_saved_pwd_${selectedStaffId}`);
        setInfoMessage('ยกเลิกการจำรหัสผ่านแล้ว');
      }
      setTimeout(() => setInfoMessage(null), 3000);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleManualSaveRemember = () => {
    if (!passwordInput.trim()) {
      setErrorMessage('กรุณาระบุรหัสผ่านก่อนกดจำรหัส');
      return;
    }
    setRememberPassword(true);
    setErrorMessage(null);
    try {
      localStorage.setItem(`caregiver_remember_pwd_${selectedStaffId}`, 'true');
      localStorage.setItem(`caregiver_saved_pwd_${selectedStaffId}`, passwordInput.trim());
      localStorage.setItem('caregiver_last_login_staff_id', selectedStaffId);
      setInfoMessage('✓ บันทึกจำรหัสผ่านของ ' + (currentSelectedStaff?.name || '') + ' เรียบร้อยแล้ว');
      setTimeout(() => setInfoMessage(null), 3000);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleClearPassword = () => {
    setPasswordInput('');
    setRememberPassword(false);
    setErrorMessage(null);
    try {
      localStorage.removeItem(`caregiver_remember_pwd_${selectedStaffId}`);
      localStorage.removeItem(`caregiver_saved_pwd_${selectedStaffId}`);
      setInfoMessage('ล้างรหัสผ่านและยกเลิกการจำรหัสในเครื่องเรียบร้อย');
      setTimeout(() => setInfoMessage(null), 3000);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedStaff) return;

    const correctPassword = currentSelectedStaff.password || '1234';
    if (passwordInput.trim() !== correctPassword && passwordInput.trim() !== '1234') {
      setErrorMessage('รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นคือ 1234)');
      return;
    }

    try {
      localStorage.setItem('caregiver_last_login_staff_id', currentSelectedStaff.id);
      if (rememberPassword) {
        localStorage.setItem(`caregiver_remember_pwd_${currentSelectedStaff.id}`, 'true');
        localStorage.setItem(`caregiver_saved_pwd_${currentSelectedStaff.id}`, passwordInput.trim());
      } else {
        localStorage.removeItem(`caregiver_remember_pwd_${currentSelectedStaff.id}`);
        localStorage.removeItem(`caregiver_saved_pwd_${currentSelectedStaff.id}`);
      }
    } catch (e) {
      console.warn(e);
    }

    setErrorMessage(null);
    onSelectStaff(currentSelectedStaff);
    onClose();
  };

  const handleNumpad = (num: string) => {
    if (passwordInput === '1234') {
      setPasswordInput(num);
    } else {
      setPasswordInput(prev => (prev.length < 8 ? prev + num : prev));
    }
    setErrorMessage(null);
  };

  const handleNumpadBackspace = () => {
    setPasswordInput(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-850 via-teal-800 to-emerald-900 p-5 text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-teal-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 mx-auto flex items-center justify-center border border-white/20 mb-2 shadow-inner">
            <div className="w-full h-full rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white">
              <HeartPulse className="w-6 h-6" />
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-bold font-['Prompt',sans-serif]">
            เข้าสู่ระบบ LTC Portal
          </h2>
          <p className="text-xs text-emerald-100 font-light mt-0.5">
            รพ.สต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร
          </p>
        </div>

        {/* Interactive Content: Click Staff Photo then Enter Password */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Step 1: Click on Staff Photo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 font-['Prompt',sans-serif]">
              1. เลือกจิ้มรูปโปรไฟล์เจ้าหน้าที่เพื่อเข้าสู่ระบบ:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {staffList.map((staff) => {
                const isSelected = staff.id === selectedStaffId;
                const isCM1 = staff.id === 'cm-01' || staff.isAdmin;

                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleStaffClick(staff)}
                    className={`relative p-2 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer group ${
                      isSelected
                        ? (isCM1 ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400 shadow-sm' : 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/30 shadow-xs')
                        : (isCM1 ? 'border-amber-300 bg-amber-50/30 hover:bg-amber-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')
                    }`}
                  >
                    {/* Avatar with status indicator */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden mb-1.5 border-2 border-white shadow-xs">
                      <img
                        src={staff.avatarUrl}
                        alt={staff.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-teal-800/30 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      )}
                      {isCM1 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white p-0.5 rounded-full shadow-xs" title="ผู้ดูแลระบบ Admin">
                          <Crown className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Role Badge */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mb-0.5 flex items-center gap-0.5 ${
                      isCM1 ? 'bg-amber-100 text-amber-950 border border-amber-400 font-extrabold' :
                      staff.role === 'director' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      staff.role === 'care_manager' ? 'bg-teal-100 text-teal-900 border border-teal-300' :
                      'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {isCM1 ? (
                        <>
                          <Crown className="w-2.5 h-2.5 text-amber-600" />
                          <span>CM 1 (Admin)</span>
                        </>
                      ) : (
                        staff.role === 'director' ? 'ผอ.รพ.สต.' :
                        staff.role === 'care_manager' ? 'CM' : 'CG'
                      )}
                    </span>

                    {/* Staff Name Short */}
                    <span className="text-[10px] font-bold text-slate-800 line-clamp-1 leading-tight">
                      {staff.name.split(' ')[0]} {staff.name.split(' ')[1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Staff Details Card */}
          {currentSelectedStaff && (
            <div className={`border rounded-xl p-3 flex items-center gap-3 ${
              currentSelectedStaff.id === 'cm-01' || currentSelectedStaff.isAdmin
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="relative">
                <img
                  src={currentSelectedStaff.avatarUrl}
                  alt={currentSelectedStaff.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-400/80 shrink-0 shadow-xs"
                />
                {(currentSelectedStaff.id === 'cm-01' || currentSelectedStaff.isAdmin) && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full shadow-xs">
                    <Crown className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 text-xs truncate">
                    {currentSelectedStaff.name}
                  </span>
                  {(currentSelectedStaff.id === 'cm-01' || currentSelectedStaff.isAdmin) ? (
                    <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 text-amber-700" />
                      <span>ผู้ดูแลระบบ (Admin)</span>
                    </span>
                  ) : (
                    <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                      currentSelectedStaff.role === 'director' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      currentSelectedStaff.role === 'care_manager' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                      'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {currentSelectedStaff.role === 'director' ? 'ผู้อำนวยการ รพ.สต.' :
                       currentSelectedStaff.role === 'care_manager' ? 'Care Manager' : 'Caregiver (CG)'}
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                  {currentSelectedStaff.position}
                </div>
                <div className="text-[10px] text-teal-700 font-mono">
                  รหัส: {currentSelectedStaff.code}
                </div>
                <div className="mt-1 text-[9.5px] text-slate-600 bg-white/90 rounded px-1.5 py-0.5 border border-slate-200">
                  {(currentSelectedStaff.id === 'cm-01' || currentSelectedStaff.isAdmin)
                    ? '👑 สิทธิ์ Admin: ควบคุมระบบทั้งหมด, จัดการรหัสผ่านเจ้าหน้าที่, สำรองข้อมูล และเข้าถึงครบทั้ง 8 หน้า'
                    : currentSelectedStaff.role === 'caregiver'
                    ? '🔒 สิทธิ์ CG: เข้าถึงเฉพาะหน้า 1 (บันทึกเยี่ยม) และหน้า 2 (สรุปยอดของฉัน)'
                    : '🔓 สิทธิ์ ' + (currentSelectedStaff.role === 'director' ? 'ผู้อำนวยการ รพ.สต.' : 'Care Manager') + ': เข้าถึงได้ครบทั้ง 7 หน้า'}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Password / PIN Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold font-['Prompt',sans-serif]">
                  2. ใส่รหัสผ่านเข้าสู่ระบบ (PIN / Password):
                </label>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.2 rounded border border-teal-200">
                  รหัสเริ่มต้น: <strong>1234</strong>
                </span>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="กรอกรหัสผ่าน 4-8 หลัก..."
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full pl-9 pr-16 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm font-mono tracking-wider"
                />
                
                <div className="absolute right-2.5 top-2 flex items-center gap-1">
                  {passwordInput && (
                    <button
                      type="button"
                      onClick={handleClearPassword}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                      title="ล้างรหัสผ่าน"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons: ปุ่มจำรหัส & ปุ่มล้างรหัส */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberPassword}
                    onChange={(e) => handleToggleRemember(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span className="flex items-center gap-1 text-[11px] sm:text-xs">
                    <BookmarkCheck className={`w-3.5 h-3.5 ${rememberPassword ? 'text-emerald-600' : 'text-slate-400'}`} />
                    จำรหัสผ่านในเครื่องนี้
                  </span>
                </label>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleManualSaveRemember}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      rememberPassword 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                    title="บันทึกจำรหัสผ่านในเครื่องนี้"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>จำรหัส</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearPassword}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="ล้างรหัสผ่านที่กรอก และลบรหัสที่เคยจำไว้ในเครื่อง"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>ล้างรหัส</span>
                  </button>
                </div>
              </div>

              {/* Informational Toast / Alert */}
              {infoMessage && (
                <div className="mt-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mt-1.5 text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Quick Numpad for Mobile / Touch PIN */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1.5 px-1">
                <span>แป้นพิมพ์ตัวเลขสัมผัส (Quick Touch Numpad):</span>
                <span>แตะตัวเลขเพื่อใส่รหัส</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-w-[320px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpad(num)}
                    className="py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 rounded-lg font-bold text-slate-800 text-sm shadow-2xs transition-colors cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                
                {/* 0 and Action buttons in Numpad */}
                <button
                  type="button"
                  onClick={() => handleNumpad('0')}
                  className="py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 rounded-lg font-bold text-slate-800 text-sm shadow-2xs transition-colors cursor-pointer"
                >
                  0
                </button>

                {/* Backspace 1 digit */}
                <button
                  type="button"
                  onClick={handleNumpadBackspace}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  title="ลบ 1 ตัวอักษร"
                >
                  ⌫ ลบ
                </button>

                {/* Clear all password button */}
                <button
                  type="button"
                  onClick={handleClearPassword}
                  className="py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  title="ล้างรหัสผ่านทั้งหมด"
                >
                  <RotateCcw className="w-3 h-3 text-rose-600" />
                  <span>ล้างรหัส</span>
                </button>

                {/* Remember password button in numpad */}
                <button
                  type="button"
                  onClick={handleManualSaveRemember}
                  className="col-span-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  title="จำรหัสผ่านที่กรอกไว้ในเครื่องนี้"
                >
                  <BookmarkCheck className="w-3 h-3 text-emerald-600" />
                  <span>จำรหัส</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>เข้าสู่ระบบในชื่อ {currentSelectedStaff?.name}</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
