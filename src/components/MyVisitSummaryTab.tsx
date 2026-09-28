import React from 'react';
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
  Award
} from 'lucide-react';
import { ElderlyPatient, CaregiverUser } from '../types';
import { CURRENT_CARE_MANAGER } from '../data/mockData';

interface MyVisitSummaryTabProps {
  currentUser: CaregiverUser;
  patients: ElderlyPatient[];
  onNavigateToVisitLog: (patientId: string) => void;
  onNavigateToMonthlyReport?: () => void;
}

export const MyVisitSummaryTab: React.FC<MyVisitSummaryTabProps> = ({
  currentUser,
  patients,
  onNavigateToVisitLog,
  onNavigateToMonthlyReport,
}) => {
  const cgPatients = patients.filter((p) => p.caregiverId === currentUser.id);
  const totalTargetVisits = cgPatients.reduce((sum, p) => sum + p.targetVisitsPerMonth, 0);
  const totalCompletedVisits = cgPatients.reduce((sum, p) => sum + p.visitsThisMonth, 0);
  const remainingVisits = Math.max(0, totalTargetVisits - totalCompletedVisits);
  const percentage = totalTargetVisits > 0 ? Math.round((totalCompletedVisits / totalTargetVisits) * 100) : 0;

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

      {/* Patients Quota & Quick Action Table */}
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
                          src={patient.avatarUrl}
                          alt={patient.name}
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
