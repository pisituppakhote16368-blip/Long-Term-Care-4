import React, { useState } from 'react';
import { X, UserPlus, Save, AlertTriangle, Calendar, UserCog, Camera } from 'lucide-react';
import { ElderlyPatient, LTCGroup, FISCAL_YEARS_LIST, StaffMember } from '../types';
import { INITIAL_STAFF_MEMBERS } from '../data/mockData';
import { compressImageFile, handleImageFallback, DEFAULT_PATIENT_AVATAR } from '../utils/imageUtils';
import { THAT_THONG_VILLAGES_LIST, getVillageNameByNumber } from '../utils/addressUtils';

interface AddElderlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (patient: ElderlyPatient) => void;
  caregiverName: string;
  caregiverId: string;
  staffList?: StaffMember[];
}

export const AddElderlyModal: React.FC<AddElderlyModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  caregiverName,
  caregiverId,
  staffList = INITIAL_STAFF_MEMBERS,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    citizenId: '',
    age: 75,
    gender: 'หญิง' as 'ชาย' | 'หญิง',
    fiscalYear: '2569',
    address: 'บ้านเลขที่ ',
    villageNo: 'ม.1',
    villageName: 'บ้านธาตุทอง',
    ltcGroup: 2 as LTCGroup,
    taiScore: 'B2',
    adlScore: 11,
    phone: '',
    caregiverId: caregiverId,
    emergencyName: '',
    emergencyRelation: 'บุตร',
    emergencyPhone: '',
    chronicDiseases: ['ความดันโลหิตสูง (HT)'],
  });

  const [diseaseInput, setDiseaseInput] = useState('');
  const [customAvatar, setCustomAvatar] = useState<string>('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const assignedCg = staffList.find(s => s.id === formData.caregiverId) || {
      id: caregiverId,
      name: caregiverName,
    };

    const newPatient: ElderlyPatient = {
      id: `eld-${Date.now()}`,
      citizenId: formData.citizenId || `3-4705-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(10 + Math.random() * 90)}-1`,
      name: formData.name,
      age: Number(formData.age),
      gender: formData.gender,
      address: formData.address,
      villageNo: formData.villageNo,
      villageName: getVillageNameByNumber(formData.villageNo, formData.villageName, formData.address),
      ltcGroup: formData.ltcGroup,
      taiScore: formData.taiScore,
      adlScore: Number(formData.adlScore),
      chronicDiseases: formData.chronicDiseases,
      caregiverId: assignedCg.id,
      caregiverName: assignedCg.name,
      phone: formData.phone || '08X-XXX-XXXX',
      emergencyContact: {
        name: formData.emergencyName || 'ญาติผู้ดูแล',
        relation: formData.emergencyRelation || 'บุตร',
        phone: formData.emergencyPhone || '08X-XXX-XXXX',
      },
      avatarUrl: customAvatar.trim() || (formData.gender === 'หญิง'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'),
      lastVisitDate: 'ยังไม่มีประวัติเยี่ยม',
      monthlyQuota: formData.ltcGroup === 1 ? 2 : formData.ltcGroup === 2 ? 4 : formData.ltcGroup === 3 ? 4 : 7,
      visitsThisMonth: 0,
      targetVisitsPerMonth: formData.ltcGroup === 1 ? 2 : formData.ltcGroup === 2 ? 4 : formData.ltcGroup === 3 ? 4 : 7,
      fiscalYear: formData.fiscalYear || '2569',
      status: 'active',
    };

    onAdd(newPatient);
    onClose();
  };

  const addDisease = () => {
    if (diseaseInput.trim() && !formData.chronicDiseases.includes(diseaseInput.trim())) {
      setFormData({
        ...formData,
        chronicDiseases: [...formData.chronicDiseases, diseaseInput.trim()],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Prompt',sans-serif]">
                เพิ่มข้อมูลผู้สูงอายุ / ผู้มีภาวะพึ่งพิงรายใหม่
              </h2>
              <p className="text-xs text-teal-100 font-light">
                ลงทะเบียนเข้าสู่ระบบการดูแลระยะยาว (LTC) รพ.สต.ธาตุทอง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Photo Upload Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 border-2 border-teal-500 shrink-0 relative flex items-center justify-center">
              <img
                src={customAvatar || (formData.gender === 'หญิง'
                  ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80')}
                alt="รูปผู้สูงอายุ"
                referrerPolicy="no-referrer"
                onError={(e) => handleImageFallback(e, DEFAULT_PATIENT_AVATAR)}
                className="w-full h-full object-cover"
              />
              {isCompressingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="font-bold text-slate-800 text-xs mb-0.5">
                รูปถ่ายผู้สูงอายุ / ผู้มีภาวะพึ่งพิง
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                สามารถถ่ายภาพจากกล้องมือถือ หรือเลือกไฟล์รูปภาพจากอุปกรณ์ (บีบอัดอัตโนมัติ)
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                <Camera className="w-3.5 h-3.5 text-teal-700" />
                <span>ถ่ายภาพ / เลือกรูปจากมือถือ</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsCompressingAvatar(true);
                      try {
                        const dataUrl = await compressImageFile(file, 800, 800, 0.85);
                        setCustomAvatar(dataUrl);
                      } catch (err) {
                        console.error(err);
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
                  className="ml-2 text-[11px] text-rose-600 hover:text-rose-800 underline"
                >
                  ใช้รูปเริ่มต้น
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ชื่อ - นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น นายบุญมา สุขประเสริฐ"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ปีงบประมาณ LTC <span className="text-teal-600 font-normal">(ถึง 2700)</span>
              </label>
              <select
                value={formData.fiscalYear}
                onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                className="w-full px-3 py-2 border border-teal-300 bg-teal-50/30 font-bold text-teal-800 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {FISCAL_YEARS_LIST.map((year) => (
                  <option key={year} value={year}>
                    ปีงบ {year} {year === '2569' ? '(ปัจจุบัน)' : year === '2700' ? '(ปี 2700)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">เพศ</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'ชาย' | 'หญิง' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="หญิง">หญิง</option>
                <option value="ชาย">ชาย</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                อายุ (ปี) <span className="text-teal-600 font-normal">(ตั้งแต่ 1 ปีขึ้นไป)</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08X-XXX-XXXX"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">ที่อยู่ตามบัตร / ที่พักปัจจุบัน</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="บ้านเลขที่ 25"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">หมู่ที่ / หมู่บ้าน</label>
              <select
                value={formData.villageNo}
                onChange={(e) => {
                  const selNo = e.target.value;
                  const vName = getVillageNameByNumber(selNo);
                  setFormData({ ...formData, villageNo: selNo, villageName: vName });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
              >
                {THAT_THONG_VILLAGES_LIST.map((v) => (
                  <option key={v.no} value={v.no}>
                    {v.no} {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Caregiver assignment selection */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5 font-['Prompt',sans-serif]">
              <UserCog className="w-4 h-4 text-teal-700" />
              <span>ผู้รับผิดชอบดูแล (Caregiver / CG) ประจำตัวผู้สูงอายุท่านนี้:</span>
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
            <p className="text-[10px] text-slate-500 mt-1">
              * สามารถเปลี่ยนผู้รับผิดชอบดูแลได้ตลอดเวลาที่หน้าทะเบียนผู้สูงอายุ
            </p>
          </div>

          {/* LTC Group classification */}
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
            <h4 className="font-bold text-teal-900 mb-2">กลุ่มภาวะพึ่งพิง (LTC) และคะแนนประเมิน</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">กลุ่ม LTC</label>
                <select
                  value={formData.ltcGroup}
                  onChange={(e) => {
                    const group = Number(e.target.value) as LTCGroup;
                    const taiMap = { 1: 'B1', 2: 'B2', 3: 'B3', 4: 'C1' };
                    const adlMap = { 1: 10, 2: 8, 3: 4, 4: 2 };
                    setFormData({
                      ...formData,
                      ltcGroup: group,
                      taiScore: taiMap[group],
                      adlScore: adlMap[group],
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-teal-800"
                >
                  <option value={1}>• กลุ่มที่ 1 (กลุ่มติดบ้าน): เคลื่อนไหวได้บ้าง มีปัญหาการกินหรือการขับถ่าย แต่ไม่มีภาวะสับสนทางสมอง ADL 5-11</option>
                  <option value={2}>• กลุ่มที่ 2 (กลุ่มติดบ้านที่มีภาวะสับสน): เคลื่อนไหวได้บ้าง มีภาวะสับสน (เช่น สมองเสื่อมหรือจิตเวช) และอาจมีปัญหาการกินหรือการขับถ่าย ADL 5-11</option>
                  <option value={3}>• กลุ่มที่ 3 (กลุ่มติดเตียง): เคลื่อนไหวเองไม่ได้ ไม่มีปัญหาการกิน/การขับถ่ายที่รุนแรง หรือมีอาการเจ็บป่วยร่วม ADL 0-4</option>
                  <option value={4}>• กลุ่มที่ 4 (กลุ่มติดเตียงระยะสุดท้าย): เคลื่อนไหวเองไม่ได้ มีอาการเจ็บป่วยรุนแรง หรืออยู่ในระยะประคับประคองท้ายของชีวิต ADL 0-4</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">เกณฑ์ TAI</label>
                <input
                  type="text"
                  value={formData.taiScore}
                  onChange={(e) => setFormData({ ...formData, taiScore: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-teal-700"
                />
              </div>
            </div>
          </div>

          {/* Chronic diseases */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">โรคประจำตัว / ภาวะสุขภาพ</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={diseaseInput}
                onChange={(e) => setDiseaseInput(e.target.value)}
                placeholder="ระบุโรคประจำตัว แล้วกดเพิ่ม"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDisease();
                  }
                }}
              />
              <button
                type="button"
                onClick={addDisease}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-slate-700"
              >
                + เพิ่ม
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formData.chronicDiseases.map((d) => (
                <span
                  key={d}
                  className="bg-teal-100 text-teal-800 text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => removeDisease(d)}
                    className="text-teal-600 hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg cursor-pointer font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>บันทึกข้อมูลผู้สูงอายุ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
