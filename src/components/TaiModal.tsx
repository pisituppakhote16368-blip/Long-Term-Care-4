import React from 'react';
import { X, HelpCircle, BookOpen, AlertCircle } from 'lucide-react';
import { TAI_CRITERIA_INFO } from '../data/mockData';

interface TaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTai?: (taiCode: string) => void;
}

export const TaiModal: React.FC<TaiModalProps> = ({ isOpen, onClose, onSelectTai }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Prompt',sans-serif]">
                คู่มือเกณฑ์การจำแนกกลุ่มภาวะพึ่งพิง (TAI Assessment)
              </h2>
              <p className="text-xs text-emerald-100 font-light">
                เกณฑ์การจำแนกตามมาตรฐานกองการพยาบาลและสำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>คำชี้แจงสำหรับ Caregiver:</strong> การประเมินกลุ่ม TAI ร่วมกับคะแนน Barthel ADL
              ใช้กำหนดแผนการดูแลรายบุคคล (Care Plan) และความถี่ในการลงเยี่ยมบ้านของผู้ดูแลตามสิทธิประโยชน์กองทุน LTC
            </div>
          </div>

          <div className="space-y-3">
            {TAI_CRITERIA_INFO.map((item) => (
              <div
                key={item.code}
                className="border border-slate-200 rounded-xl p-4 hover:border-teal-400 transition-all bg-white hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-md font-['Prompt',sans-serif]">
                      ระดับ {item.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 font-['Prompt',sans-serif]">
                      {item.name}
                    </h4>
                  </div>
                  {onSelectTai && (
                    <button
                      onClick={() => {
                        onSelectTai(item.code);
                        onClose();
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                    >
                      เลือกเกณฑ์นี้
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-2 leading-relaxed">{item.description}</p>
                <div className="text-xs font-semibold text-teal-800 bg-teal-50/60 border border-teal-100 rounded-md px-2.5 py-1 inline-block">
                  เกณฑ์ความถี่การเยี่ยม: <span className="font-normal text-slate-700">{item.visitQuota}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
