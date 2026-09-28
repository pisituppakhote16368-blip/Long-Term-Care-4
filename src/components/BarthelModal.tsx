import React, { useState } from 'react';
import { X, Award, CheckCircle, Info } from 'lucide-react';
import { BARTHEL_ADL_QUESTIONS } from '../data/mockData';

interface BarthelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScore?: number;
  onApplyScore: (score: number) => void;
}

export const BarthelModal: React.FC<BarthelModalProps> = ({
  isOpen,
  onClose,
  initialScore = 12,
  onApplyScore,
}) => {
  // 10 items initial score map: default to reasonable answers
  const [answers, setAnswers] = useState<Record<number, number>>({
    1: 2, // Feeding
    2: 1, // Grooming
    3: 2, // Transfer
    4: 1, // Toilet
    5: 2, // Mobility
    6: 1, // Dressing
    7: 1, // Stairs
    8: 1, // Bathing
    9: 2, // Bowels
    10: 2, // Bladder
  });

  if (!isOpen) return null;

  const totalScore = Object.values(answers).reduce((acc, curr) => acc + curr, 0);

  const getGroupClassification = (score: number) => {
    if (score >= 12) {
      return {
        group: 'กลุ่มที่ 1 : ติดสังคม (Independent)',
        range: '12 - 20 คะแนน',
        desc: 'ช่วยเหลือตนเองได้ดี ไม่มีปัญหาด้านจิตใจหรือการรับรู้ เข้าร่วมกิจกรรมทางสังคมได้',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    } else if (score >= 9) {
      return {
        group: 'กลุ่มที่ 2 : ติดบ้าน ระดับปานกลาง (Semi-Dependent)',
        range: '9 - 11 คะแนน',
        desc: 'ช่วยเหลือตนเองได้บ้าง แต่ต้องการผู้ดูแลช่วยเหลือในกิจวัตรประจำวันบางอย่าง',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      };
    } else if (score >= 5) {
      return {
        group: 'กลุ่มที่ 3 : ติดบ้าน ระดับมาก (Moderately Dependent)',
        range: '5 - 8 คะแนน',
        desc: 'ช่วยเหลือตนเองได้น้อย ต้องการการดูแลอย่างใกล้ชิดในการใช้ชีวิตประจำวัน',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    } else {
      return {
        group: 'กลุ่มที่ 4 : ติดเตียง (Severely Dependent / Bedridden)',
        range: '0 - 4 คะแนน',
        desc: 'ไม่สามารถช่วยเหลือตนเองได้ ต้องได้รับการดูแลทางการพยาบาลและสุขอนามัยรอบด้าน',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    }
  };

  const groupInfo = getGroupClassification(totalScore);

  const handleSelectOption = (questionId: number, score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  const handleApply = () => {
    onApplyScore(totalScore);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Prompt',sans-serif]">
                แบบประเมินความสามารถในการดำเนินชีวิตประจำวัน (Barthel ADL Index 10 ข้อ)
              </h2>
              <p className="text-xs text-teal-100 font-light">
                มาตรฐานกรมการแพทย์ กระทรวงสาธารณสุข สำหรับระบบการดูแลระยะยาว (LTC)
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

        {/* Live Score Sticky Tally */}
        <div className="bg-teal-50/80 border-b border-teal-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 font-medium">คะแนนประเมินรวม:</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-teal-800 font-['Prompt',sans-serif]">
                {totalScore}
              </span>
              <span className="text-xs text-slate-500">/ 20 คะแนน</span>
            </div>
          </div>

          <div className={`text-xs px-3 py-1 rounded-full font-semibold border ${groupInfo.badgeColor}`}>
            {groupInfo.group} ({groupInfo.range})
          </div>
        </div>

        {/* Questions list */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
          {BARTHEL_ADL_QUESTIONS.map((q) => {
            const currentSelectedScore = answers[q.id] ?? 0;
            return (
              <div key={q.id} className="pt-4 first:pt-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 font-['Prompt',sans-serif]">
                      {q.name}
                    </h3>
                    <p className="text-xs text-slate-500">{q.description}</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md flex-shrink-0">
                    {currentSelectedScore} คะแนน
                  </span>
                </div>

                <div className="space-y-1.5 mt-2">
                  {q.options.map((opt) => {
                    const isSelected = currentSelectedScore === opt.score;
                    return (
                      <label
                        key={opt.score}
                        onClick={() => handleSelectOption(q.id, opt.score)}
                        className={`flex items-center space-x-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-500 text-teal-900 font-medium shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(q.id, opt.score)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="flex-1">{opt.text}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center text-xs text-slate-500 gap-1.5">
            <Info className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span className="hidden sm:inline">{groupInfo.desc}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4 text-amber-300" />
              <span>บันทึกคะแนน ADL ({totalScore} คะแนน)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
