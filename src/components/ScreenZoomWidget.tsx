import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X, Smartphone, Check } from 'lucide-react';

interface ScreenZoomWidgetProps {
  className?: string;
  isFloating?: boolean;
}

export const ScreenZoomWidget: React.FC<ScreenZoomWidgetProps> = ({ 
  isFloating = true 
}) => {
  const [zoomPercent, setZoomPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('caregiver_screen_zoom');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 70 && val <= 200) {
          return val;
        }
      }
    } catch {
      // ignore
    }
    return 100;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Apply zoom to document root
  useEffect(() => {
    try {
      const ratio = zoomPercent / 100;
      // standard modern CSS zoom
      (document.documentElement.style as any).zoom = ratio.toString();
      localStorage.setItem('caregiver_screen_zoom', zoomPercent.toString());
    } catch (e) {
      console.warn('Could not apply zoom', e);
    }
  }, [zoomPercent]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleZoomIn = () => {
    setZoomPercent((prev) => {
      const next = Math.min(200, prev + 10);
      triggerToast(`ขยายหน้าจอ: ${next}%`);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomPercent((prev) => {
      const next = Math.max(70, prev - 10);
      triggerToast(`ย่อหน้าจอ: ${next}%`);
      return next;
    });
  };

  const handleReset = () => {
    setZoomPercent(100);
    triggerToast('คืนค่าขนาดหน้าจอปกติ: 100%');
  };

  const handleSetPreset = (val: number) => {
    setZoomPercent(val);
    triggerToast(`ปรับขนาดหน้าจอ: ${val}%`);
  };

  // If used inside Header or inline
  if (!isFloating) {
    return (
      <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-600/40 rounded-lg px-2 py-0.5 text-xs text-white">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoomPercent <= 70}
          className="p-1 hover:bg-emerald-800 rounded disabled:opacity-40 cursor-pointer transition-colors"
          title="ย่อหน้าจอ (Zoom Out)"
        >
          <ZoomOut className="w-3.5 h-3.5 text-emerald-200" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-1.5 py-0.5 font-medium text-[11px] text-emerald-100 hover:text-white cursor-pointer"
          title="คลิกเพื่อรีเซ็ตขนาดปกติ 100%"
        >
          {zoomPercent}%
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoomPercent >= 200}
          className="p-1 hover:bg-emerald-800 rounded disabled:opacity-40 cursor-pointer transition-colors"
          title="ขยายหน้าจอ (Zoom In)"
        >
          <ZoomIn className="w-3.5 h-3.5 text-emerald-200" />
        </button>
      </div>
    );
  }

  // Floating button for mobile & all devices (hidden in print)
  return (
    <>
      {/* Toast Feedback */}
      {showToast && (
        <div className="fixed bottom-20 right-4 sm:right-6 bg-slate-900/90 text-white text-xs px-3.5 py-2 rounded-xl shadow-2xl z-50 animate-in fade-in flex items-center gap-2 border border-slate-700 pointer-events-none">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Floating Widget */}
      <aside 
        aria-label="เครื่องมือย่อขยายหน้าจอ"
        className="fixed bottom-5 right-4 sm:right-6 z-40 no-print flex flex-col items-end pointer-events-auto"
      >
        {/* Expanded Popup Menu */}
        {isOpen && (
          <div className="mb-2 w-72 bg-white/95 backdrop-blur-md text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">ย่อ / ขยายหน้าจอมือถือ</h4>
                  <p className="text-[10px] text-slate-500">ซูมเข้า-ออก หรือใช้นิ้วถ่างหน้าจอ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Zoom & Step Buttons */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomPercent <= 70}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold active:scale-95 disabled:opacity-40 transition-all shadow-sm"
                title="ย่อหน้าจอเล็กลง (-10%)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-lg font-black text-emerald-800 tracking-tight">
                  {zoomPercent}%
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  {zoomPercent === 100 ? 'ขนาดปกติ' : zoomPercent > 100 ? 'ขยายใหญ่ขึ้น' : 'ย่อเล็กลง'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomPercent >= 200}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold active:scale-95 disabled:opacity-40 transition-all shadow-sm"
                title="ขยายหน้าจอใหญ่ขึ้น (+10%)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-3">
              <span className="block text-[11px] font-medium text-slate-500 mb-1.5">
                ระดับการย่อ/ขยายด่วน:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[80, 100, 120, 140].map((preset) => {
                  const isSelected = zoomPercent === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSetPreset(preset)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {preset}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset to 100% button */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนค่าปกติ (100%)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-1.5 px-3 rounded-lg text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm"
              >
                เสร็จสิ้น
              </button>
            </div>

            {/* Mobile gesture tip */}
            <div className="mt-3 p-2 bg-emerald-50/70 border border-emerald-200/50 rounded-lg text-[10px] text-emerald-800 flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong>เคล็ดลับมือถือ:</strong> สามารถใช้นิ้ว 2 นิ้วถ่างออกเพื่อซูมเข้า หรือบีบเข้าเพื่อซูมออก (Pinch to zoom) บนหน้าจอมือถือได้โดยตรง
              </span>
            </div>
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full shadow-xl transition-all duration-200 active:scale-95 cursor-pointer border ${
            zoomPercent !== 100
              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-400 ring-2 ring-amber-300/40'
              : 'bg-slate-900/90 hover:bg-slate-900 text-white border-slate-700/80 backdrop-blur-sm'
          }`}
          title="แตะเพื่อย่อหรือขยายหน้าจอ"
        >
          <div className="flex items-center gap-1">
            <ZoomIn className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold font-mono">
              {zoomPercent}%
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] font-medium opacity-90 pl-1 border-l border-white/20">
            ย่อ/ขยาย
          </span>
        </button>
      </aside>
    </>
  );
};
