import React, { useState, useEffect } from 'react';
import { 
  X, 
  Pencil, 
  Save, 
  AlertTriangle, 
  Calendar, 
  UserCog, 
  Camera, 
  Check, 
  User, 
  MapPin, 
  Phone, 
  HeartHandshake,
  Activity,
  Layers
} from 'lucide-react';
import { ElderlyPatient, LTCGroup, FISCAL_YEARS_LIST, StaffMember } from '../types';
import { INITIAL_STAFF_MEMBERS } from '../data/mockData';
import { compressImageFile, handleImageFallback, DEFAULT_PATIENT_AVATAR } from '../utils/imageUtils';
import { THAT_THONG_VILLAGES_LIST, resolvePatientVillage, formatVillageLabel } from '../utils/addressUtils';

interface EditElderlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: ElderlyPatient | null;
  onUpdate: (updatedPatient: ElderlyPatient) => void;
  staffList?: StaffMember[];
}

const COMMON_DISEASES = [
  'ความดันโลหิตสูง (HT)',
  'เบาหวาน (DM)',
  'ไขมันในเลือดสูง (DLP)',
  'หลอดเลือดสมอง (Stroke)',
  'ไตเรื้อรัง (CKD)',
  'ข้อเข่าเสื่อม (OA Knee)',
  'พาร์กินสัน (Parkinson)',
  'อัลไซเมอร์ / สมองเสื่อม (Dementia)',
  'ผู้ป่วยติดเตียง (Bedridden)',
  'แผลกดทับ',
  'กลืนลำบาก ใส่สาย NG Tube',
  'ใส่สายสวนปัสสาวะ (Foley catheter)'
];

export const EditElderlyModal: React.FC<EditElderlyModalProps> = ({
  isOpen,
  onClose,
  patient,
  onUpdate,
  staffList = INITIAL_STAFF_MEMBERS,
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    citizenId: string;
    age: number;
    gender: 'ชาย' | 'หญิง';
    fiscalYear: string;
    address: string;
    villageNo: string;
    villageName: string;
    ltcGroup: LTCGroup;
    taiScore: string;
    adlScore: number;
    phone: string;
    caregiverId: string;
    emergencyName: string;
    emergencyRelation: string;
    emergencyPhone: string;
    chronicDiseases: string[];
    monthlyQuota: number;
    status: 'active' | 'discharged' | 'deceased';
    statusDate: string;
    statusReason: string;
  }>({
    name: '',
    citizenId: '',
    age: 75,
    gender: 'หญิง',
    fiscalYear: '2569',
    address: '',
    villageNo: 'ม.1',
    villageName: 'บ้านธาตุทอง',
    ltcGroup: 2,
    taiScore: 'B2',
    adlScore: 10,
    phone: '',
    caregiverId: '',
    emergencyName: '',
    emergencyRelation: 'บุตร',
    emergencyPhone: '',
    chronicDiseases: [],
    monthlyQuota: 4,
    status: 'active',
    statusDate: '',
    statusReason: '',
  });

  const [diseaseInput, setDiseaseInput] = useState('');
  const [customAvatar, setCustomAvatar] = useState<string>('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync form data when patient prop changes or modal opens
  useEffect(() => {
    if (patient) {
      const resolved = resolvePatientVillage(patient);
      setFormData({
        name: patient.name || '',
        citizenId: patient.citizenId || '',
        age: patient.age || 70,
        gender: patient.gender || 'หญิง',
        fiscalYear: patient.fiscalYear || '2569',
        address: patient.address || '',
        villageNo: resolved.no,
        villageName: resolved.name,
        ltcGroup: patient.ltcGroup || 1,
        taiScore: patient.taiScore || 'B1',
        adlScore: typeof patient.adlScore === 'number' ? patient.adlScore : 10,
        phone: patient.phone || '',
        caregiverId: patient.caregiverId || (staffList.find(s => s.role === 'caregiver')?.id || ''),
        emergencyName: patient.emergencyContact?.name || '',
        emergencyRelation: patient.emergencyContact?.relation || 'บุตร',
        emergencyPhone: patient.emergencyContact?.phone || '',
        chronicDiseases: patient.chronicDiseases ? [...patient.chronicDiseases] : [],
        monthlyQuota: patient.monthlyQuota || (patient.ltcGroup === 1 ? 2 : patient.ltcGroup === 2 ? 4 : patient.ltcGroup === 3 ? 4 : 7),
        status: patient.status || 'active',
        statusDate: patient.statusDate || '',
        statusReason: patient.statusReason || '',
      });
      setCustomAvatar(patient.avatarUrl || '');
      setDiseaseInput('');
      setErrorMsg(null);
    }
  }, [patient, isOpen, staffList]);

  if (!isOpen || !patient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุลของผู้สูงอายุ');
      return;
    }

    const resolved = resolvePatientVillage({
      villageNo: formData.villageNo,
      villageName: formData.villageName,
      address: formData.address,
    });

    const assignedCg = staffList.find(s => s.id === formData.caregiverId) || {
      id: formData.caregiverId,
      name: patient.caregiverName,
    };

    const quota = Number(formData.monthlyQuota) || (formData.ltcGroup === 1 ? 2 : formData.ltcGroup === 2 ? 4 : formData.ltcGroup === 3 ? 4 : 7);

    const updatedPatient: ElderlyPatient = {
      ...patient,
      name: formData.name.trim(),
      citizenId: formData.citizenId.trim() || patient.citizenId,
      age: Math.max(1, Number(formData.age) || 1),
      gender: formData.gender,
      fiscalYear: formData.fiscalYear || '2569',
      address: formData.address.trim(),
      villageNo: resolved.no,
      villageName: resolved.name,
      ltcGroup: formData.ltcGroup,
      taiScore: formData.taiScore.trim() || 'B1',
      adlScore: Math.min(20, Math.max(0, Number(formData.adlScore) || 0)),
      chronicDiseases: formData.chronicDiseases,
      caregiverId: assignedCg.id,
      caregiverName: assignedCg.name,
      phone: formData.phone.trim(),
      emergencyContact: {
        name: formData.emergencyName.trim(),
        relation: formData.emergencyRelation.trim(),
        phone: formData.emergencyPhone.trim(),
      },
      avatarUrl: customAvatar.trim() || patient.avatarUrl,
      monthlyQuota: quota,
      targetVisitsPerMonth: quota,
      status: formData.status,
      statusDate: formData.status !== 'active' ? (formData.statusDate || patient.statusDate || '2026-09-25') : undefined,
      statusReason: formData.status !== 'active' ? (formData.statusReason || patient.statusReason || '') : undefined,
    };

    onUpdate(updatedPatient);
    onClose();
  };

  const addDisease = (diseaseToAdd?: string) => {
    const d = (diseaseToAdd || diseaseInput).trim();
    if (d && !formData.chronicDiseases.includes(d)) {
      setFormData({
        ...formData,
        chronicDiseases: [...formData.chronicDiseases, d],
      });
      setDiseaseInput('');
    }
  };

  const removeDisease = (disease: string) => {
    setFormData({
      ...formData,
      chronicDiseases: formData.chronicDiseases.filter((d) => d !== disease),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-teal-700 to-emerald-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Pencil className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Prompt',sans-serif]">
                แก้ไขข้อมูลผู้สูงอายุ
              </h3>
              <p className="text-xs text-teal-100">
                รหัสเคส: <span className="font-mono font-semibold">{patient.id}</span> • ปรับปรุงข้อมูลประวัติ ที่อยู่ ผู้ดูแล และคะแนนประเมิน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Photo & Quick Info Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={customAvatar || (formData.gender === 'หญิง'
                  ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80')}
                alt={formData.name || 'ผู้สูงอายุ'}
                onError={(e) => handleImageFallback(e, DEFAULT_PATIENT_AVATAR)}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-teal-500 shadow-sm"
              />
              {isCompressingAvatar && (
                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-[10px] text-white font-bold">
                  บีบอัดรูป...
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                  <Camera className="w-3.5 h-3.5 text-teal-600" />
                  <span>ถ่ายภาพใหม่ / เลือกรูป</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsCompressingAvatar(true);
                        try {
                          const base64 = await compressImageFile(file, 400, 400, 0.85);
                          setCustomAvatar(base64);
                        } catch (err) {
                          console.error('Image compression error:', err);
                        } finally {
                          setIsCompressingAvatar(false);
                        }
                      }
                    }}
                  />
                </label>
                {customAvatar && (
                  <button
                    type="button"
                    onClick={() => setCustomAvatar('')}
                    className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                  >
                    รีเซ็ตเป็นรูปเริ่มต้น
                  </button>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                * ภาพถ่ายผู้สูงอายุจะแสดงในทะเบียนผู้สูงอายุ บันทึกการออกเยี่ยม และใบรายงาน A4
              </div>
            </div>
          </div>

          {/* Section: Personal Info */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm font-['Prompt',sans-serif] flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-teal-600" />
              <span>ข้อมูลทั่วไปของผู้สูงอายุ</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น นายสมบูรณ์ สุขสว่าง"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เลขประจำตัวประชาชน (13 หลัก)
                </label>
                <input
                  type="text"
                  value={formData.citizenId}
                  onChange={(e) => setFormData({ ...formData, citizenId: e.target.value })}
                  placeholder="3-4705-XXXXX-XX-X"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">เพศ</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'ชาย' | 'หญิง' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="หญิง">หญิง</option>
                  <option value="ชาย">ชาย</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  อายุ (ปี) <span className="text-teal-600 font-normal">(ตั้งแต่ 1 ปี)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ปีงบประมาณ</label>
                <select
                  value={formData.fiscalYear}
                  onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                >
                  {FISCAL_YEARS_LIST.map((yr) => (
                    <option key={yr} value={yr}>ปี {yr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Address & Village */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm font-['Prompt',sans-serif] flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>ที่อยู่และหมู่บ้าน (ตำบลธาตุทอง อ.สว่างแดนดิน จ.สกลนคร)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">ที่อยู่ตามบัตร / ที่พักปัจจุบัน</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="เช่น บ้านเลขที่ 45 หมู่ที่ 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">หมู่ที่ / หมู่บ้าน</label>
                <select
                  value={formData.villageNo}
                  onChange={(e) => {
                    const selNo = e.target.value;
                    const resolved = resolvePatientVillage({ villageNo: selNo });
                    setFormData({ ...formData, villageNo: resolved.no, villageName: resolved.name });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-bold text-teal-900 bg-teal-50/50"
                >
                  {THAT_THONG_VILLAGES_LIST.map((v) => (
                    <option key={v.no} value={v.no}>
                      {v.no} {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-teal-800 bg-teal-50 p-2 rounded-lg border border-teal-200">
              📍 ที่อยู่แสดงผลทางการ: <strong>{formData.address || 'บ้านเลขที่ -'} {formData.villageNo} {formData.villageName} ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร</strong>
            </div>
          </div>

          {/* Section: Caregiver Assignment */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5 font-['Prompt',sans-serif]">
              <UserCog className="w-4 h-4 text-teal-700" />
              <span>ผู้รับผิดชอบดูแล (Caregiver / CG) ประจำตัว:</span>
            </label>
            <select
              value={formData.caregiverId}
              onChange={(e) => setFormData({ ...formData, caregiverId: e.target.value })}
              className="w-full px-3 py-2 border border-teal-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {staffList.filter(s => s.role === 'caregiver').map((cg) => (
                <option key={cg.id} value={cg.id}>
                  {cg.name} ({cg.code}) - {cg.assignedArea || cg.assignedVillage || 'รพ.สต.ธาตุทอง'}
                </option>
              ))}
            </select>
          </div>

          {/* Section: LTC Group & Assessments */}
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 space-y-3">
            <h4 className="font-bold text-teal-900 font-['Prompt',sans-serif] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>กลุ่มภาวะพึ่งพิง (LTC) และคะแนนประเมิน</span>
            </h4>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">กลุ่ม LTC</label>
              <select
                value={formData.ltcGroup}
                onChange={(e) => {
                  const group = Number(e.target.value) as LTCGroup;
                  const taiMap = { 1: 'B1', 2: 'B2', 3: 'B3', 4: 'C1' };
                  const adlMap = { 1: 10, 2: 8, 3: 4, 4: 2 };
                  const quotaMap = { 1: 2, 2: 4, 3: 4, 4: 7 };
                  setFormData({
                    ...formData,
                    ltcGroup: group,
                    taiScore: taiMap[group],
                    adlScore: adlMap[group],
                    monthlyQuota: quotaMap[group],
                  });
                }}
                className="w-full px-3 py-2 border border-teal-300 rounded-lg bg-white font-semibold text-teal-900"
              >
                <option value={1}>• กลุ่มที่ 1 (กลุ่มติดบ้าน): เคลื่อนไหวได้บ้าง มีปัญหาการกินหรือการขับถ่าย แต่ไม่มีภาวะสับสนทางสมอง ADL 5-11</option>
                <option value={2}>• กลุ่มที่ 2 (กลุ่มติดบ้านที่มีภาวะสับสน): เคลื่อนไหวได้บ้าง มีภาวะสับสน (เช่น สมองเสื่อมหรือจิตเวช) และอาจมีปัญหาการกินหรือการขับถ่าย ADL 5-11</option>
                <option value={3}>• กลุ่มที่ 3 (กลุ่มติดเตียง): เคลื่อนไหวเองไม่ได้ ไม่มีปัญหาการกิน/การขับถ่ายที่รุนแรง หรือมีอาการเจ็บป่วยร่วม ADL 0-4</option>
                <option value={4}>• กลุ่มที่ 4 (กลุ่มติดเตียงระยะสุดท้าย): เคลื่อนไหวเองไม่ได้ มีอาการเจ็บป่วยรุนแรง หรืออยู่ในระยะประคับประคองท้ายของชีวิต ADL 0-4</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">เกณฑ์ TAI</label>
                <input
                  type="text"
                  value={formData.taiScore}
                  onChange={(e) => setFormData({ ...formData, taiScore: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-center"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">คะแนน ADL (0-20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.adlScore}
                  onChange={(e) => setFormData({ ...formData, adlScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-teal-700 text-center"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">เป้าหมายเยี่ยม/เดือน</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.monthlyQuota}
                  onChange={(e) => setFormData({ ...formData, monthlyQuota: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 text-center"
                />
              </div>
            </div>
          </div>

          {/* Section: Chronic Diseases */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-slate-700 font-semibold mb-1">โรคประจำตัว / ภาวะสุขภาพ</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={diseaseInput}
                onChange={(e) => setDiseaseInput(e.target.value)}
                placeholder="พิมพ์ชื่อโรคประจำตัว แล้วกดเพิ่ม"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDisease();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addDisease()}
                className="px-3 py-2 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 font-bold rounded-lg cursor-pointer"
              >
                + เพิ่ม
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] text-slate-400 self-center">คลิกเลือกเร็ว:</span>
              {COMMON_DISEASES.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => addDisease(d)}
                  className="text-[10px] bg-slate-100 hover:bg-teal-100 text-slate-600 hover:text-teal-800 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                >
                  + {d}
                </button>
              ))}
            </div>

            {/* Tag List */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.chronicDiseases.map((d) => (
                <span
                  key={d}
                  className="bg-teal-100 text-teal-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => removeDisease(d)}
                    className="text-teal-700 hover:text-red-600 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section: Contacts */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm font-['Prompt',sans-serif] flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Phone className="w-4 h-4 text-sky-600" />
              <span>เบอร์โทรศัพท์และผู้ติดต่อฉุกเฉิน</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์ผู้สูงอายุ</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อผู้ติดต่อฉุกเฉิน / ญาติผู้ดูแล</label>
                <input
                  type="text"
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  placeholder="เช่น นางวรรณา สุขเกษม"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ความสัมพันธ์</label>
                <input
                  type="text"
                  value={formData.emergencyRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
                  placeholder="เช่น บุตรสาว, สามี, ภรรยา"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรผู้ติดต่อฉุกเฉิน</label>
                <input
                  type="text"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Status */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800 mb-1 font-['Prompt',sans-serif]">
              สถานะการดูแลในระบบ:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'active' })}
                className={`py-2 px-3 rounded-lg font-bold text-xs border cursor-pointer transition-colors ${
                  formData.status === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                กำลังดูแล (Active)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'discharged' })}
                className={`py-2 px-3 rounded-lg font-bold text-xs border cursor-pointer transition-colors ${
                  formData.status === 'discharged'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                จำหน่าย (Discharged)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'deceased' })}
                className={`py-2 px-3 rounded-lg font-bold text-xs border cursor-pointer transition-colors ${
                  formData.status === 'deceased'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                เสียชีวิต (Deceased)
              </button>
            </div>

            {formData.status !== 'active' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1 font-semibold">วันที่สถานะ</label>
                  <input
                    type="date"
                    value={formData.statusDate || '2026-09-25'}
                    onChange={(e) => setFormData({ ...formData, statusDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1 font-semibold">เหตุผล / บันทึกเพิ่มเติม</label>
                  <input
                    type="text"
                    value={formData.statusReason}
                    onChange={(e) => setFormData({ ...formData, statusReason: e.target.value })}
                    placeholder="เช่น ย้ายที่อยู่ หรือ เสียชีวิตด้วยโรคชรา"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer font-bold text-xs sm:text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800 text-white rounded-xl cursor-pointer font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>บันทึกการแก้ไขข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
