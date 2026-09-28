import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MapPin, 
  Camera, 
  Upload, 
  Clock, 
  Calendar, 
  User, 
  FileCheck, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  HelpCircle, 
  Plus, 
  ExternalLink,
  Sparkles,
  Layers,
  Activity,
  Maximize2
} from 'lucide-react';
import { ElderlyPatient, VisitRecord, CaregiverUser } from '../types';

interface VisitLogTabProps {
  patients: ElderlyPatient[];
  currentUser: CaregiverUser;
  onSaveVisit: (visit: VisitRecord) => void;
  onOpenBarthelModal: (currentScore: number, onApply: (score: number) => void) => void;
  onOpenTaiModal: (onSelect: (tai: string) => void) => void;
  onOpenAddElderly: () => void;
  initialSelectedPatientId?: string;
}

export const VisitLogTab: React.FC<VisitLogTabProps> = ({
  patients,
  currentUser,
  onSaveVisit,
  onOpenBarthelModal,
  onOpenTaiModal,
  onOpenAddElderly,
  initialSelectedPatientId,
}) => {
  // Selected Patient
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialSelectedPatientId || (patients[0]?.id ?? '')
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Visit Form State
  const now = new Date();
  const [visitDate, setVisitDate] = useState<string>(
    now.toISOString().split('T')[0]
  );
  const [visitTime, setVisitTime] = useState<string>(
    now.toTimeString().slice(0, 5)
  );

  // Vital Signs
  const [weight, setWeight] = useState<number>(55.0);
  const [height, setHeight] = useState<number>(160);
  const [bpSystolic, setBpSystolic] = useState<number>(128);
  const [bpDiastolic, setBpDiastolic] = useState<number>(78);
  const [pulse, setPulse] = useState<number>(76);
  const [spo2, setSpo2] = useState<number>(98);
  const [temp, setTemp] = useState<number>(36.6);
  const [adlScore, setAdlScore] = useState<number>(selectedPatient?.adlScore || 12);
  const [taiCategory, setTaiCategory] = useState<string>(
    selectedPatient?.taiScore || 'B2 (ต้องการความช่วยเหลือในการเคลื่อนไหว)'
  );

  // Chronic & Findings
  const [chronicSelected, setChronicSelected] = useState<string[]>(
    selectedPatient?.chronicDiseases || ['ความดันโลหิตสูง (HT)']
  );
  const [physicalFindings, setPhysicalFindings] = useState<string[]>([
    'สุขภาพทั่วไปแข็งแรงดี เดินเหินคล่องตัว',
  ]);
  const [examNotes, setExamNotes] = useState<string>(
    'ผู้สูงอายุตื่นตัวดี พูดคุยโต้ตอบรู้เรื่อง รับประทานอาหารได้ปกติ ตรวจวัดความดันโลหิตอยู่ในเกณฑ์ปกติ ได้ตรวจสอบการรับประทานยาสม่ำเสมอ'
  );
  const [carePlan, setCarePlan] = useState<string>(
    'แนะนำสุขอนามัย การจัดสภาพแวดล้อมเพื่อป้องกันการหกล้ม ส่งเสริมการดื่มน้ำสะอาด และนัดหมายตรวจเยี่ยมครั้งต่อไป'
  );

  // Photos
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
  ]);
  const [isPhotoZoomOpen, setIsPhotoZoomOpen] = useState<string | null>(null);

  // GPS Coordinates (Default to ธาตุทอง อ.สว่างแดนดิน)
  const [coordinates, setCoordinates] = useState({
    lat: 17.51245,
    lng: 103.45689,
    accuracy: 6.2,
    address: '45 ม.1 บ.ธาตุทอง ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร',
  });
  const [isLocating, setIsLocating] = useState(false);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(true);

  // Toast / Feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Update when selected patient changes
  useEffect(() => {
    if (selectedPatient) {
      setAdlScore(selectedPatient.adlScore);
      setChronicSelected(selectedPatient.chronicDiseases);
      setTaiCategory(`${selectedPatient.taiScore}`);
    }
  }, [selectedPatientId]);

  // BMI Calculation
  const bmi = height > 0 ? Number((weight / Math.pow(height / 100, 2)).toFixed(2)) : 0;
  const getBmiStatus = (val: number) => {
    if (val < 18.5) return { text: 'น้ำหนักน้อย / ผอม', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (val <= 22.9) return { text: 'ปกติ (สมส่วน)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (val <= 24.9) return { text: 'ท้วม / โรคอ้วนระดับ 1', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { text: 'อ้วน / โรคอ้วนระดับ 2', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  };

  // Draw initial signature or restore previous signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f766e';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check if previously drawn signature exists
    const stored = (currentUser?.id && localStorage.getItem(`cg_signature_${currentUser.id}`))
      || localStorage.getItem('last_caregiver_signature')
      || localStorage.getItem('caregiver_signature');

    if (stored && stored.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = stored;
      return;
    }

    // Draw pretty default signature curve
    ctx.beginPath();
    ctx.moveTo(30, 45);
    ctx.bezierCurveTo(70, 10, 110, 60, 150, 30);
    ctx.bezierCurveTo(180, 10, 210, 55, 250, 40);
    ctx.stroke();

    try {
      const dataUrl = canvas.toDataURL();
      localStorage.setItem('caregiver_signature', dataUrl);
    } catch {
      // ignore
    }
  }, [currentUser?.id]);

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    try {
      const dataUrl = canvasRef.current?.toDataURL();
      if (dataUrl) {
        localStorage.setItem('caregiver_signature', dataUrl);
        localStorage.setItem('last_caregiver_signature', dataUrl);
        if (currentUser?.id) {
          localStorage.setItem(`cg_signature_${currentUser.id}`, dataUrl);
        }
      }
    } catch {
      // ignore
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Set real-time timestamp
  const handleSetCurrentDateTime = () => {
    const cur = new Date();
    setVisitDate(cur.toISOString().split('T')[0]);
    setVisitTime(cur.toTimeString().slice(0, 5));
    setFeedbackMessage('อัปเดตวันและเวลาออกเยี่ยมเป็นเวลาปัจจุบันเรียบร้อยแล้ว');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // GPS update
  const handleUpdateGps = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoordinates({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            accuracy: Math.round(pos.coords.accuracy),
            address: `${selectedPatient?.address || 'บ้านธาตุทอง'} ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร`,
          });
          setIsLocating(false);
          setFeedbackMessage('บันทึกพิกัดดาวเทียม GPS แบบเรียลไทม์สำเร็จ');
          setTimeout(() => setFeedbackMessage(null), 3000);
        },
        () => {
          // Fallback simulation in That Thong area
          const jitterLat = 17.51245 + (Math.random() - 0.5) * 0.005;
          const jitterLng = 103.45689 + (Math.random() - 0.5) * 0.005;
          setCoordinates({
            lat: Number(jitterLat.toFixed(5)),
            lng: Number(jitterLng.toFixed(5)),
            accuracy: 4.8,
            address: `${selectedPatient?.address || 'บ้านธาตุทอง'} ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร`,
          });
          setIsLocating(false);
          setFeedbackMessage('จำลองพิกัดเสมือนจริง รพ.สต.ธาตุทอง เรียบร้อย');
          setTimeout(() => setFeedbackMessage(null), 3000);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Add Photo by file input or simulated hotlink
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newUrls: string[] = [];
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        newUrls.push(url);
      });
      setPhotos((prev) => [...prev, ...newUrls]);
      setFeedbackMessage(`เพิ่มรูปภาพหลักฐานการเยี่ยม ${files.length} ภาพเรียบร้อย`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const handleAddSampleHotlinkPhoto = () => {
    const samplePool = [
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
    ];
    const picked = samplePool[Math.floor(Math.random() * samplePool.length)];
    setPhotos((prev) => [...prev, picked]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle chronic disease
  const toggleChronic = (name: string) => {
    if (chronicSelected.includes(name)) {
      setChronicSelected(chronicSelected.filter((item) => item !== name));
    } else {
      setChronicSelected([...chronicSelected, name]);
    }
  };

  // Toggle physical finding
  const toggleFinding = (name: string) => {
    if (physicalFindings.includes(name)) {
      setPhysicalFindings(physicalFindings.filter((item) => item !== name));
    } else {
      setPhysicalFindings([...physicalFindings, name]);
    }
  };

  // Submit visit
  const handleSubmitVisit = (status: 'draft' | 'submitted') => {
    if (!selectedPatient) return;

    const signatureData = canvasRef.current?.toDataURL() || '';

    const newVisit: VisitRecord = {
      id: `vis-${Date.now()}`,
      elderlyId: selectedPatient.id,
      elderlyName: selectedPatient.name,
      elderlyAge: selectedPatient.age,
      elderlyGroup: selectedPatient.ltcGroup,
      caregiverId: currentUser.id,
      caregiverName: currentUser.name,
      visitDate: visitDate,
      visitTime: visitTime,
      weight,
      height,
      bmi,
      bpSystolic,
      bpDiastolic,
      pulse,
      spo2,
      temp,
      adlScore,
      taiCategory,
      chronicSelected,
      physicalFindings,
      examNotes,
      carePlan,
      photos,
      coordinates,
      caregiverSignature: signatureData,
      status,
      submittedAt: `${visitDate} ${visitTime}:00`,
      cmReviewStatus: 'pending',
    };

    onSaveVisit(newVisit);
    setFeedbackMessage(
      status === 'submitted'
        ? 'บันทึกและส่งรายงานการออกเยี่ยมเข้าสู่ระบบ LTC สำเร็จเรียบร้อย!'
        : 'บันทึกแบบร่าง (Draft) สำหรับแก้ไขเพิ่มเติมเรียบร้อยแล้ว'
    );
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-600 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-amber-300 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{feedbackMessage}</span>
        </div>
      )}

      {/* Sticky Quick-Access Toolbar in CG View when scrolling */}
      <div className="sticky top-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-md border border-teal-200/90 flex flex-wrap items-center justify-between gap-3 no-print transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            CG
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-800">
                {selectedPatient?.name} ({selectedPatient?.age} ปี)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selectedPatient?.ltcGroup === 1 ? 'bg-emerald-100 text-emerald-800' :
                selectedPatient?.ltcGroup === 2 ? 'bg-sky-100 text-sky-800' :
                selectedPatient?.ltcGroup === 3 ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                กลุ่ม {selectedPatient?.ltcGroup} • ADL: {adlScore}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate max-w-[260px] sm:max-w-none">
              วันเยี่ยม: {visitDate} {visitTime} น. • {selectedPatient?.villageName ? `บ.${selectedPatient.villageName}` : 'ต.ธาตุทอง'} • รหัส CG: {currentUser.code}
            </div>
          </div>
        </div>

        {/* Quick Section Shortcuts */}
        <div className="hidden lg:flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => document.getElementById('visit-section-1')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            1. ข้อมูล
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('visit-section-2')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            2. สัญญาณชีพ
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('visit-section-3')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            3. ADL/TAI
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('visit-section-4')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            4. รูปภาพ/GPS
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('visit-section-5')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            5. ลายเซ็น
          </button>
        </div>

        {/* Quick Save Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmitVisit('draft')}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            title="บันทึกแบบร่าง (Draft)"
          >
            บันทึกแบบร่าง
          </button>

          <button
            type="button"
            onClick={() => handleSubmitVisit('submitted')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
            title="บันทึกและส่งรายงานการออกเยี่ยม"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
            <span>บันทึกส่งงาน</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Patient Details & Visit Timestamp */}
      <div id="visit-section-1" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 scroll-mt-20">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="font-bold text-slate-800 text-base font-['Prompt',sans-serif]">
              ข้อมูลผู้ป่วย / ผู้สูงอายุ & วันที่เวลาออกเยี่ยม
            </h3>
          </div>

          <button
            type="button"
            onClick={handleSetCurrentDateTime}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
            <span>ระบุวันเวลาปัจจุบันอัตโนมัติ</span>
          </button>
        </div>

        {/* การเลือกผู้สูงอายุ / ผู้มีภาวะพึ่งพิง */}
        <div className="mb-4 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Prompt',sans-serif]">
                เลือกผู้สูงอายุ / ผู้มีภาวะพึ่งพิงที่ต้องการบันทึกการออกเยี่ยม:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full sm:max-w-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age} ปี) - กลุ่ม {p.ltcGroup} ({p.ltcGroup === 1 ? 'ติดสังคม' : p.ltcGroup === 2 ? 'ติดบ้านปานกลาง' : p.ltcGroup === 3 ? 'ติดบ้านมาก' : 'ติดเตียง'}) | {p.villageNo} {p.villageName}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={onOpenAddElderly}
                  className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span className="hidden sm:inline">+ เพิ่มผู้สูงอายุใหม่</span>
                </button>
              </div>
            </div>

            {selectedPatient && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                  selectedPatient.ltcGroup === 1 ? 'bg-emerald-100 text-emerald-800' :
                  selectedPatient.ltcGroup === 2 ? 'bg-sky-100 text-sky-800' :
                  selectedPatient.ltcGroup === 3 ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  กลุ่ม {selectedPatient.ltcGroup} (ADL: {selectedPatient.adlScore})
                </span>
                <span className="text-xs bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-200 font-semibold">
                  เป้าหมาย {selectedPatient.visitsThisMonth}/{selectedPatient.targetVisitsPerMonth} ครั้ง
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">วันที่ออกเยี่ยม</label>
            <div className="relative">
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">เวลาที่เข้าเยี่ยม</label>
            <div className="relative">
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">เลขบัตรประชาชน</label>
            <input
              type="text"
              readOnly
              value={selectedPatient?.citizenId || ''}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">ผู้ดูแลผู้รับผิดชอบ (CG)</label>
            <input
              type="text"
              readOnly
              value={currentUser.name}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-xs">
          <div className="sm:col-span-2">
            <label className="block text-slate-600 font-semibold mb-1">ที่อยู่ / พิกัดสถานที่พำนัก</label>
            <input
              type="text"
              readOnly
              value={`${selectedPatient?.address || ''} หมู่บ้าน${selectedPatient?.villageName || ''} ตำบลธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">เบอร์ติดต่อฉุกเฉิน / ญาติผู้ดูแล</label>
            <input
              type="text"
              readOnly
              value={`${selectedPatient?.emergencyContact.name} (${selectedPatient?.emergencyContact.relation}) โทร ${selectedPatient?.emergencyContact.phone}`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Vital Signs, Physical & ADL / TAI */}
      <div id="visit-section-2" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 scroll-mt-20">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h3 className="font-bold text-slate-800 text-base font-['Prompt',sans-serif]">
              สัญญาณชีพและกายภาพ (Vital Signs & Alerts)
            </h3>
          </div>
          <span className="text-xs text-slate-400">หน่วยวัดมาตรฐานทางการแพทย์</span>
        </div>

        {/* Vital Signs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs mb-4">
          {/* Weight */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-slate-500 font-medium mb-1">น้ำหนัก (กก.)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full text-base font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Height */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-slate-500 font-medium mb-1">ส่วนสูง (ซม.)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              className="w-full text-base font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* BMI (Calculated) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="block text-slate-500 font-medium mb-1">ดัชนีมวลกาย (BMI)</span>
              <span className="text-base font-black text-teal-800 font-['Prompt',sans-serif] block">
                {bmi} <span className="text-xs font-normal text-slate-500">kg/m²</span>
              </span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold inline-block ${getBmiStatus(bmi).color}`}>
              {getBmiStatus(bmi).text}
            </span>
          </div>

          {/* Blood Pressure */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 sm:col-span-1">
            <label className="block text-slate-500 font-medium mb-1">ความดันโลหิต (mmHg)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="บน"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(parseInt(e.target.value) || 0)}
                className={`w-1/2 text-sm font-bold bg-white border rounded-lg px-2 py-1.5 ${
                  bpSystolic >= 140 ? 'border-rose-400 text-rose-700 bg-rose-50' : 'border-slate-300 text-slate-800'
                }`}
              />
              <span className="text-slate-400 font-bold">/</span>
              <input
                type="number"
                placeholder="ล่าง"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(parseInt(e.target.value) || 0)}
                className={`w-1/2 text-sm font-bold bg-white border rounded-lg px-2 py-1.5 ${
                  bpDiastolic >= 90 ? 'border-rose-400 text-rose-700 bg-rose-50' : 'border-slate-300 text-slate-800'
                }`}
              />
            </div>
            <span className={`text-[10px] block mt-1 font-medium ${
              bpSystolic >= 140 || bpDiastolic >= 90 ? 'text-rose-600 font-bold' : 'text-emerald-600'
            }`}>
              {bpSystolic >= 140 || bpDiastolic >= 90 ? '⚠️ ความดันสูง' : '✓ ปกติ'}
            </span>
          </div>

          {/* Pulse */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-slate-500 font-medium mb-1">ชีพจร (bpm)</label>
            <input
              type="number"
              value={pulse}
              onChange={(e) => setPulse(parseInt(e.target.value) || 0)}
              className="w-full text-base font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-[10px] text-slate-500 block mt-1">ครั้งต่อนาที</span>
          </div>

          {/* SpO2 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-slate-500 font-medium mb-1">ออกซิเจน SpO2 (%)</label>
            <input
              type="number"
              value={spo2}
              onChange={(e) => setSpo2(parseInt(e.target.value) || 0)}
              className={`w-full text-base font-bold bg-white border rounded-lg px-2.5 py-1.5 ${
                spo2 < 95 ? 'border-rose-400 text-rose-700 bg-rose-50' : 'border-slate-300 text-slate-800'
              }`}
            />
            <span className={`text-[10px] block mt-1 font-medium ${spo2 < 95 ? 'text-rose-600 font-bold' : 'text-emerald-600'}`}>
              {spo2 < 95 ? '⚠️ ออกซิเจนต่ำ' : '✓ ปกติดี'}
            </span>
          </div>
        </div>

        {/* Temperature and Assessment Sub-grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
          {/* Temperature */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-slate-600 font-semibold mb-1">อุณหภูมิกาย (°C)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value) || 0)}
                className={`w-28 text-base font-bold bg-white border rounded-lg px-3 py-1.5 ${
                  temp >= 37.5 ? 'border-rose-400 text-rose-700 bg-rose-50' : 'border-slate-300 text-slate-800'
                }`}
              />
              <span className={`text-xs font-semibold ${temp >= 37.5 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {temp >= 37.5 ? '⚠️ มีไข้' : '✓ ไม่มีไข้'}
              </span>
            </div>
          </div>

          {/* ADL Assessment */}
          <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-teal-900 font-['Prompt',sans-serif]">
                คะแนน Barthel ADL
              </label>
              <button
                type="button"
                onClick={() => onOpenBarthelModal(adlScore, (newScore) => setAdlScore(newScore))}
                className="text-[11px] bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1 rounded-md font-semibold cursor-pointer shadow-2xs transition-colors flex items-center gap-1"
              >
                <Award className="w-3 h-3 text-amber-300" />
                <span>เปิดแบบประเมิน 10 ข้อ</span>
              </button>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-teal-800 font-['Prompt',sans-serif]">
                {adlScore}
              </span>
              <span className="text-xs text-slate-600">/ 20 คะแนน</span>
              <span className="text-xs font-semibold text-teal-700 ml-auto">
                ({adlScore >= 12 ? 'กลุ่ม 1 ติดสังคม' : adlScore >= 9 ? 'กลุ่ม 2 ติดบ้าน' : adlScore >= 5 ? 'กลุ่ม 3 ติดบ้านมาก' : 'กลุ่ม 4 ติดเตียง'})
              </span>
            </div>
          </div>

          {/* TAI Category */}
          <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-teal-900 font-['Prompt',sans-serif]">
                เกณฑ์การจำแนก TAI
              </label>
              <button
                type="button"
                onClick={() => onOpenTaiModal((tai) => setTaiCategory(tai))}
                className="text-[11px] text-teal-700 hover:text-teal-900 underline flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <HelpCircle className="w-3 h-3" />
                <span>คู่มือเกณฑ์ TAI</span>
              </button>
            </div>
            <select
              value={taiCategory}
              onChange={(e) => setTaiCategory(e.target.value)}
              className="w-full bg-white border border-teal-300 text-teal-950 font-semibold rounded-lg p-2 text-xs"
            >
              <option value="B1">B1 (ช่วยเหลือตนเองได้ มีปัญหาการเคลื่อนไหวเล็กน้อย)</option>
              <option value="B2">B2 (ต้องการความช่วยเหลือในการเคลื่อนไหวและกิจวัตรประจำวัน)</option>
              <option value="B3">B3 (พึ่งพาผู้อื่นมาก กิจวัตรส่วนใหญ่ไม่สามารถทำเองได้)</option>
              <option value="C1">C1 (พึ่งพาผู้อื่นมาก มีปัญหาการเคลื่อนย้ายตัว นอนติดเตียง)</option>
              <option value="C2">C2 (พึ่งพาสมบูรณ์ ติดเตียง ต้องได้รับการดูแลตลอด 24 ชม.)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: Examination, Chronic Illnesses & Care Plan */}
      <div id="visit-section-3" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 scroll-mt-20">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h3 className="font-bold text-slate-800 text-base font-['Prompt',sans-serif]">
            บันทึกผลการตรวจ & ความเจ็บป่วย & แผนการดูแล
          </h3>
        </div>

        {/* Chronic tags selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            โรคประจำตัวที่พบ (คลิกเพื่อเลือกหรือยกเลิก):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              'ความดันโลหิตสูง (HT)',
              'เบาหวาน (DM)',
              'ไขมันในเลือดสูง (DLP)',
              'หลอดเลือดสมอง (Stroke)',
              'ข้อเข่าเสื่อม (OA Knee)',
              'ไตเรื้อรัง (CKD)',
              'อัลไซเมอร์ / สมองเสื่อม',
              'ผู้ป่วยติดเตียง (Bedridden)',
              'แผลกดทับ ระดับ 1',
              'แผลกดทับ ก้นกบ',
              'ใส่สาย NG Tube',
              'ใส่สาย Foley catheter',
            ].map((disease) => {
              const isSelected = chronicSelected.includes(disease);
              return (
                <button
                  key={disease}
                  type="button"
                  onClick={() => toggleChronic(disease)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}
                  {disease}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rapid Physical findings pills */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            อาการ / สภาพร่างกายที่ตรวจพบวันนี้:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              'สุขภาพทั่วไปแข็งแรงดี เดินเหินคล่องตัว',
              'ไม่มีอาการเวียนศีรษะ',
              'ข้อเข่าติดขัดเล็กน้อย เดินโดยใช้ไม้เท้าช่วย',
              'ผิวหนังแห้งคัน',
              'รอยแดงบริเวณก้นกบ (Stage 1)',
              'บวมที่ข้อเท้าทั้งสองข้าง',
              'กลั้นปัสสาวะไม่ได้',
              'นอนไม่หลับ / หลับยาก',
              'แผลกดทับสะอาด ไม่มีหนอง',
              'สายให้อาหารสะอาด ตำแหน่งถูกต้อง',
            ].map((finding) => {
              const isSelected = physicalFindings.includes(finding);
              return (
                <button
                  key={finding}
                  type="button"
                  onClick={() => toggleFinding(finding)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}
                  {finding}
                </button>
              );
            })}
          </div>
        </div>

        {/* Text areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 font-['Prompt',sans-serif]">
              รายละเอียดผลการตรวจ & สภาพความเป็นอยู่
            </label>
            <textarea
              rows={4}
              value={examNotes}
              onChange={(e) => setExamNotes(e.target.value)}
              placeholder="ระบุสภาพร่างกาย สภาพจิตใจ การรับประทานอาหาร การนอนหลับ ยาที่ได้รับ..."
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 font-['Prompt',sans-serif]">
              แผนการดูแล & กิจกรรมการพยาบาลที่ให้การช่วยเหลือ (Care Plan)
            </label>
            <textarea
              rows={4}
              value={carePlan}
              onChange={(e) => setCarePlan(e.target.value)}
              placeholder="ระบุกิจกรรมที่ให้ เช่น เช็ดตัว กายภาพบำบัด พลิกตัว สอนการออกกำลังกาย..."
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Photos & GPS Location */}
      <div id="visit-section-4" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 scroll-mt-20">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
            4
          </div>
          <h3 className="font-bold text-slate-800 text-base font-['Prompt',sans-serif]">
            รูปภาพการเยี่ยมผู้ป่วย & แผนที่ปักหมุด GPS
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo Gallery & Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                รูปถ่ายหลักฐานการลงพื้นที่ ({photos.length} ภาพ)
              </label>
              <button
                type="button"
                onClick={handleAddSampleHotlinkPhoto}
                className="text-[11px] text-teal-700 hover:text-teal-900 font-medium underline cursor-pointer"
              >
                + เพิ่มตัวอย่างภาพผู้สูงอายุ
              </button>
            </div>

            {/* Photo Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-4/3 bg-slate-100 shadow-2xs"
                >
                  <img
                    src={url}
                    alt={`Visit photo ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPhotoZoomOpen(url)}
                      className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white cursor-pointer"
                      title="ขยายดูภาพ"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                      title="ลบภาพนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    ภาพ {idx + 1}
                  </span>
                </div>
              ))}

              {/* Upload Drop Target / Trigger */}
              <label className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-xl aspect-4/3 flex flex-col items-center justify-center text-teal-700 bg-teal-50/50 hover:bg-teal-50 cursor-pointer transition-colors p-2 text-center">
                <Camera className="w-6 h-6 mb-1 text-teal-600" />
                <span className="text-xs font-bold font-['Prompt',sans-serif]">ถ่ายภาพ / อัปโหลด</span>
                <span className="text-[10px] text-slate-400 mt-0.5">รองรับ JPG, PNG</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              * ภาพถ่ายจะถูกประทับวันเวลาและพิกัดลงในรายงานประจำเดือนอัตโนมัติ
            </p>
          </div>

          {/* GPS Coordinates & Map Simulation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs font-['Prompt',sans-serif]">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>ตำแหน่งพิกัดดาวเทียม (GPS Coordinates)</span>
                </div>
                <button
                  type="button"
                  onClick={handleUpdateGps}
                  disabled={isLocating}
                  className="text-xs bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'กำลังค้นหา...' : 'อัปเดตพิกัด'}</span>
                </button>
              </div>

              {/* Coordinates Pill */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">ละติจูด (Latitude):</span>
                  <span className="font-mono font-bold text-slate-800">{coordinates.lat} N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ลองจิจูด (Longitude):</span>
                  <span className="font-mono font-bold text-slate-800">{coordinates.lng} E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ความแม่นยำ (Accuracy):</span>
                  <span className="text-emerald-700 font-semibold">±{coordinates.accuracy} เมตร</span>
                </div>
                <div className="pt-1 border-t border-slate-100 text-[11px] text-slate-600 truncate">
                  📍 {coordinates.address}
                </div>
              </div>

              {/* Styled Map Graphic Simulation */}
              <div className="relative h-36 rounded-xl overflow-hidden border border-slate-300 bg-emerald-900/10 flex items-center justify-center">
                {/* SVG Map Grid Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#0f766e_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                
                {/* Simulated Roads & Terrain */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-1 bg-amber-400/40 rotate-12 absolute"></div>
                  <div className="w-full h-1.5 bg-slate-400/50 -rotate-25 absolute"></div>
                  <div className="w-24 h-24 rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center animate-pulse"></div>
                </div>

                {/* Pulsing Pin Marker */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg ring-4 ring-rose-200 animate-bounce">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-full mt-1 font-semibold backdrop-blur-xs">
                    พิกัดบ้านผู้สูงอายุ ({coordinates.lat}, {coordinates.lng})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Caregiver Signature & Final Actions */}
      <div id="visit-section-5" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 scroll-mt-20">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
            5
          </div>
          <h3 className="font-bold text-slate-800 text-base font-['Prompt',sans-serif]">
            การลงลายมือชื่อผู้ดูแล (Caregiver Signature) & บันทึกส่งงาน
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Signature Pad */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <label className="font-bold text-slate-700">
                ลงลายมือชื่อดิจิทัล (เซ็นชื่อในกรอบด้านล่าง)
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
              >
                ล้างลายเซ็น
              </button>
            </div>

            <div className="border-2 border-dashed border-teal-300 rounded-xl p-1 bg-teal-50/20 relative">
              <canvas
                ref={canvasRef}
                width={360}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-28 bg-white rounded-lg cursor-crosshair touch-none"
              />
              <div className="text-[10px] text-slate-400 text-right mt-1 px-1">
                ลงนามโดย: <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.code})
              </div>
            </div>
          </div>

          {/* Action Buttons & Guidance */}
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 leading-relaxed">
              <p className="font-bold mb-1">คำยืนยันการส่งรายงาน:</p>
              ข้าพเจ้าขอรับรองว่าได้ลงพื้นที่ตรวจเยี่ยมผู้สูงอายุ/ผู้มีภาวะพึ่งพิงตามวัน เวลา และสถานที่ดังกล่าวจริง
              และข้อมูลสัญญาณชีพทั้งหมดได้รับการตรวจวัดถูกต้องตามมาตรฐาน
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSubmitVisit('draft')}
                className="flex-1 px-4 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors text-center"
              >
                บันทึกแบบร่าง (Draft)
              </button>

              <button
                type="button"
                onClick={() => handleSubmitVisit('submitted')}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>บันทึกและส่งรายงานการออกเยี่ยม</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {isPhotoZoomOpen && (
        <div
          onClick={() => setIsPhotoZoomOpen(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img
              src={isPhotoZoomOpen}
              alt="Zoomed visit"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain"
            />
            <button
              onClick={() => setIsPhotoZoomOpen(null)}
              className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
