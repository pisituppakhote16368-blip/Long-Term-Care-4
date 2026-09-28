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
  AlertCircle
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
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || 'cg-01');
  const [passwordInput, setPasswordInput] = useState<string>('1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSelectedStaff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];

  const handleStaffClick = (staff: StaffMember) => {
    setSelectedStaffId(staff.id);
    setPasswordInput(staff.password || '1234');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedStaff) return;

    const correctPassword = currentSelectedStaff.password || '1234';
    if (passwordInput.trim() !== correctPassword && passwordInput.trim() !== '1234') {
      setErrorMessage('รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นคือ 1234)');
      return;
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
  };

  const handleNumpadClear = () => {
    setPasswordInput('');
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
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleStaffClick(staff)}
                    className={`relative p-2 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
                    </div>

                    {/* Role Badge */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mb-0.5 ${
                      staff.role === 'director' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      staff.role === 'care_manager' ? 'bg-teal-100 text-teal-900 border border-teal-300' :
                      'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {staff.role === 'director' ? 'ผอ.รพ.สต.' :
                       staff.role === 'care_manager' ? 'CM' : 'CG'}
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <img
                src={currentSelectedStaff.avatarUrl}
                alt={currentSelectedStaff.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-teal-500/40 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 text-xs truncate">
                    {currentSelectedStaff.name}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                    currentSelectedStaff.role === 'director' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    currentSelectedStaff.role === 'care_manager' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                    'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {currentSelectedStaff.role === 'director' ? 'ผู้อำนวยการ รพ.สต.' :
                     currentSelectedStaff.role === 'care_manager' ? 'Care Manager' : 'Caregiver (CG)'}
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                  {currentSelectedStaff.position}
                </div>
                <div className="text-[10px] text-teal-700 font-mono">
                  รหัส: {currentSelectedStaff.code}
                </div>
                <div className="mt-1 text-[9.5px] text-slate-500 bg-white/80 rounded px-1.5 py-0.5 border border-slate-200">
                  {currentSelectedStaff.role === 'caregiver'
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
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMessage && (
                <div className="mt-1.5 text-rose-600 text-[11px] font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Quick Numpad for Mobile / Touch PIN */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-medium mb-1.5 text-center">
                แป้นพิมพ์ตัวเลขสัมผัส (Quick Touch Numpad):
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpad(num)}
                    className="py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 rounded-lg font-bold text-slate-800 text-sm shadow-2xs transition-colors cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleNumpadClear}
                  className="col-span-2 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  ล้างค่า (Clear)
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
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
