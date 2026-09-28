import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Printer, 
  Filter, 
  User, 
  Activity, 
  HeartPulse, 
  Layers, 
  CheckCircle2, 
  Boxes,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import { ElderlyPatient, LTCGroup } from '../types';

interface SuppliesTabProps {
  patients: ElderlyPatient[];
  currentRole: 'caregiver' | 'care_manager' | 'director';
  currentUserName: string;
}

export const SuppliesTab: React.FC<SuppliesTabProps> = ({
  patients,
  currentRole,
  currentUserName,
}) => {
  // การค้นหาและตัวกรอง
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ดึงรายชื่อหมู่บ้าน
  const villageList = useMemo(() => {
    const set = new Set<string>();
    patients.forEach(p => { 
      if (p.villageName) set.add(p.villageName);
      else if (p.villageNo) set.add(p.villageNo);
    });
    return Array.from(set).sort();
  }, [patients]);

  // กรองผู้ป่วยตามเงื่อนไข (เฉพาะผู้ป่วยที่มีสถานะ active)
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if ((p.status || 'active') !== 'active') return false;

      // ปีงบประมาณ
      if (selectedFiscalYear !== 'all' && (p.fiscalYear || '2569') !== selectedFiscalYear) {
        return false;
      }

      // ค้นหา: ชื่อ, เลขบัตร, หมู่บ้าน, โรค
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm ||
        p.name.toLowerCase().includes(q) ||
        p.citizenId.includes(q) ||
        (p.villageName && p.villageName.toLowerCase().includes(q)) ||
        (p.villageNo && p.villageNo.toLowerCase().includes(q)) ||
        (p.chronicDiseases && p.chronicDiseases.some(d => d.toLowerCase().includes(q)));

      // หมู่บ้าน
      const matchVillage = selectedVillageFilter === 'all' || 
        p.villageName === selectedVillageFilter || 
        p.villageNo === selectedVillageFilter;

      // กลุ่ม LTC
      const matchGroup = selectedGroupFilter === 'all' || p.ltcGroup === Number(selectedGroupFilter);

      return matchSearch && matchVillage && matchGroup;
    });
  }, [patients, searchTerm, selectedVillageFilter, selectedGroupFilter, selectedFiscalYear]);

  // Helper สำหรับแปลงกลุ่ม LTC
  const getGroupName = (group: LTCGroup) => {
    switch (group) {
      case 1: return 'กลุ่ม 1 : ติดสังคม';
      case 2: return 'กลุ่ม 2 : ติดบ้านปานกลาง';
      case 3: return 'กลุ่ม 3 : ติดบ้านมาก';
      case 4: return 'กลุ่ม 4 : ติดเตียง';
      default: return `กลุ่ม ${group}`;
    }
  };

  const getGroupBadgeClass = (group: LTCGroup) => {
    switch (group) {
      case 1: return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 2: return 'bg-sky-50 text-sky-800 border-sky-300';
      case 3: return 'bg-amber-50 text-amber-800 border-amber-300';
      case 4: return 'bg-rose-50 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // ส่งออกเป็นไฟล์ Excel (.xls HTML table format - เปิดใน Microsoft Excel, Google Sheets, LibreOffice ได้สมบูรณ์พร้อมภาษาไทยและสไตล์)
  const handleExportExcel = () => {
    const todayStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const rowsHtml = filteredPatients.map((p, idx) => {
      const diseasesStr = (p.chronicDiseases && p.chronicDiseases.length > 0)
        ? p.chronicDiseases.join(', ')
        : 'ไม่มีโรคประจำตัว';
      const groupStr = `กลุ่ม ${p.ltcGroup} (${getGroupName(p.ltcGroup).split(' : ')[1] || ''})`;

      return `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${p.name}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #0f766e;">${p.adlScore ?? '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${diseasesStr}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${groupStr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${p.villageNo || ''} ${p.villageName || ''}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${p.caregiverName || '-'}</td>
        </tr>
      `;
    }).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>รายชื่อผู้ป่วย LTC</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Sarabun', 'Angsana New', Tahoma, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #0f766e; color: #ffffff; font-weight: bold; border: 1px solid #0d5f58; padding: 10px; font-size: 14px; }
          td { font-size: 13px; mso-number-format:"\\@"; }
          .title { font-size: 18px; font-weight: bold; text-align: center; color: #115e59; padding: 10px; }
          .subtitle { font-size: 13px; text-align: center; color: #475569; padding-bottom: 12px; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="7" class="title">รายชื่อผู้ป่วย ผู้สูงอายุภาวะพึ่งพิง (LTC) - รพ.สต.ธาตุทอง</td>
          </tr>
          <tr>
            <td colspan="7" class="subtitle">ข้อมูล ณ วันที่ ${todayStr} • จำนวนผู้ป่วยทั้งหมด ${filteredPatients.length} ราย</td>
          </tr>
          <thead>
            <tr>
              <th style="width: 60px;">ลำดับ</th>
              <th style="width: 220px;">ชื่อผู้ป่วย</th>
              <th style="width: 80px;">ADL</th>
              <th style="width: 280px;">โรคประจำตัว</th>
              <th style="width: 180px;">กลุ่ม</th>
              <th style="width: 160px;">หมู่บ้าน / ที่อยู่</th>
              <th style="width: 180px;">ผู้ดูแล (Caregiver)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `รายชื่อผู้ป่วย_ADL_โรคประจำตัว_กลุ่ม_${dateStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('✓ ส่งออกไฟล์ Excel (.xls) เรียบร้อยแล้ว สามารถเปิดใช้งานได้ทันที');
  };

  // ส่งออกเป็นไฟล์ CSV สำรอง
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM สำหรับภาษาไทย
    csvContent += 'ลำดับ,ชื่อผู้ป่วย,ADL,โรคประจำตัว,กลุ่ม,หมู่บ้าน,ผู้ดูแลรับผิดชอบ\n';

    filteredPatients.forEach((p, idx) => {
      const diseases = (p.chronicDiseases && p.chronicDiseases.length > 0)
        ? `"${p.chronicDiseases.join('; ')}"`
        : '"-"';
      const groupStr = `"กลุ่ม ${p.ltcGroup} (${getGroupName(p.ltcGroup).split(' : ')[1] || ''})"`;
      const village = `"${p.villageNo || ''} ${p.villageName || ''}"`.trim();
      const cg = `"${p.caregiverName || '-'}"`;

      csvContent += `${idx + 1},"${p.name}",${p.adlScore ?? 0},${diseases},${groupStr},${village},${cg}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `รายชื่อผู้ป่วย_ADL_กลุ่ม_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('✓ ส่งออกไฟล์ CSV สำเร็จ');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-teal-500 animate-in slide-in-from-bottom no-print">
          <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-xs sm:text-sm font-medium font-['Prompt',sans-serif]">{toastMessage}</span>
        </div>
      )}

      {/* Header and Controls Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200 shadow-2xs shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-800 font-['Prompt',sans-serif]">
                  ตารางรายชื่อผู้ป่วย (ชื่อผู้ป่วย • ADL • โรคประจำตัว • กลุ่ม)
                </h2>
                <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-300">
                  หน้า 7
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ตารางสรุปข้อมูลผู้ป่วย LTC รพ.สต.ธาตุทอง แสดงชื่อผู้ป่วย คะแนน ADL โรคประจำตัว และกลุ่มภาวะพึ่งพิง พร้อมส่งออกเป็นไฟล์ Excel
              </p>
            </div>
          </div>

          {/* Action Buttons: Export Excel, CSV & Print */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              title="พิมพ์ตาราง"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>พิมพ์</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              title="ส่งออกไฟล์ CSV"
            >
              <Download className="w-4 h-4 text-teal-700" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow"
              title="ส่งออกเป็นไฟล์ Excel (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>ส่งออกเป็น Excel</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ป่วย, เลขบัตร, โรคประจำตัว..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800"
            />
          </div>

          {/* Group Filter */}
          <div>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ทุกกลุ่มภาวะพึ่งพิง (กลุ่ม 1 - 4)</option>
              <option value="1">กลุ่ม 1 : ติดสังคม</option>
              <option value="2">กลุ่ม 2 : ติดบ้านปานกลาง</option>
              <option value="3">กลุ่ม 3 : ติดบ้านมาก</option>
              <option value="4">กลุ่ม 4 : ติดเตียง</option>
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={selectedVillageFilter}
              onChange={(e) => setSelectedVillageFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ทุกหมู่บ้าน (ม.1 - ม.8)</option>
              {villageList.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Fiscal Year Filter */}
          <div>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="w-full px-3 py-2 border border-teal-300 bg-teal-50/50 rounded-xl text-teal-900 font-semibold focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ปีงบประมาณ: ทั้งหมด</option>
              <option value="2569">ปีงบประมาณ 2569 (ปัจจุบัน)</option>
              <option value="2568">ปีงบประมาณ 2568</option>
              <option value="2567">ปีงบประมาณ 2567</option>
            </select>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">
              พบข้อมูล: <span className="font-bold text-teal-800 text-sm">{filteredPatients.length}</span> ราย
            </span>
            <span className="text-slate-300">•</span>
            <span>
              กลุ่ม 1: <strong className="text-emerald-700">{filteredPatients.filter(p => p.ltcGroup === 1).length}</strong> ราย
            </span>
            <span>
              กลุ่ม 2: <strong className="text-sky-700">{filteredPatients.filter(p => p.ltcGroup === 2).length}</strong> ราย
            </span>
            <span>
              กลุ่ม 3: <strong className="text-amber-700">{filteredPatients.filter(p => p.ltcGroup === 3).length}</strong> ราย
            </span>
            <span>
              กลุ่ม 4: <strong className="text-rose-700">{filteredPatients.filter(p => p.ltcGroup === 4).length}</strong> ราย
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            * คลิกปุ่ม "ส่งออกเป็น Excel" เพื่อดาวน์โหลดตารางข้อมูลทั้งหมดทันที
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE SINGLE UNIFIED TABLE (ตารางเดียว: ชื่อผู้ป่วย, ADL, โรคประจำตัว, กลุ่ม) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Table Header Strip */}
        <div className="p-4 bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm sm:text-base font-['Prompt',sans-serif]">
              ตารางข้อมูลผู้ป่วย LTC (ชื่อผู้ป่วย • ADL • โรคประจำตัว • กลุ่ม)
            </h3>
          </div>
          <span className="text-xs bg-teal-700/80 text-teal-100 px-3 py-1 rounded-full font-medium border border-teal-500/50">
            แสดงทั้งหมด {filteredPatients.length} ราย
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 font-['Prompt',sans-serif]">
              <tr>
                <th className="py-3.5 px-4 text-center w-14 shrink-0 border-r border-slate-200/80">
                  ลำดับ
                </th>
                <th className="py-3.5 px-4 min-w-[220px] border-r border-slate-200/80">
                  ชื่อผู้ป่วย
                </th>
                <th className="py-3.5 px-4 text-center w-28 border-r border-slate-200/80">
                  ADL
                </th>
                <th className="py-3.5 px-4 min-w-[260px] border-r border-slate-200/80">
                  โรคประจำตัว
                </th>
                <th className="py-3.5 px-4 min-w-[190px] border-r border-slate-200/80">
                  กลุ่ม
                </th>
                <th className="py-3.5 px-4 min-w-[170px] border-r border-slate-200/80">
                  หมู่บ้าน / ที่อยู่
                </th>
                <th className="py-3.5 px-4 min-w-[180px]">
                  ผู้ดูแลรับผิดชอบ (CG)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500 font-['Prompt',sans-serif]">
                        ไม่พบข้อมูลผู้ป่วยตามเงื่อนไขที่ระบุ
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedVillageFilter('all');
                          setSelectedGroupFilter('all');
                          setSelectedFiscalYear('all');
                        }}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, idx) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-teal-50/40 transition-colors"
                  >
                    {/* ลำดับ */}
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs border-r border-slate-100">
                      {idx + 1}
                    </td>

                    {/* ชื่อผู้ป่วย */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={patient.avatarUrl}
                          alt={patient.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm font-['Prompt',sans-serif]">
                            {patient.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-sans mt-0.5">
                            <span>อายุ {patient.age} ปี</span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">{patient.citizenId}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ADL */}
                    <td className="py-3 px-4 text-center border-r border-slate-100">
                      <div className="inline-flex flex-col items-center justify-center">
                        <span className="font-bold font-mono text-base text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl shadow-2xs">
                          {patient.adlScore ?? '-'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">คะแนน</span>
                      </div>
                    </td>

                    {/* โรคประจำตัว */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      {patient.chronicDiseases && patient.chronicDiseases.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {patient.chronicDiseases.map((disease, dIdx) => (
                            <span
                              key={dIdx}
                              className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors"
                            >
                              {disease}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">- ไม่มีโรคประจำตัว -</span>
                      )}
                    </td>

                    {/* กลุ่ม */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${getGroupBadgeClass(patient.ltcGroup)}`}>
                          {getGroupName(patient.ltcGroup)}
                        </span>
                      </div>
                    </td>

                    {/* หมู่บ้าน / ที่อยู่ */}
                    <td className="py-3 px-4 text-slate-700 text-xs border-r border-slate-100">
                      <div className="font-medium text-slate-900">
                        {patient.villageNo || ''} {patient.villageName || ''}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={patient.address}>
                        {patient.address}
                      </div>
                    </td>

                    {/* ผู้ดูแลรับผิดชอบ */}
                    <td className="py-3 px-4 text-slate-700 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {patient.caregiverName ? patient.caregiverName.slice(0, 1) : 'C'}
                        </div>
                        <span className="font-medium text-slate-800">
                          {patient.caregiverName || '-'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer with Summary */}
            {filteredPatients.length > 0 && (
              <tfoot className="bg-slate-50 text-slate-700 font-bold text-xs border-t border-slate-200 font-['Prompt',sans-serif]">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-slate-800">
                    รวมทั้งสิ้น {filteredPatients.length} ราย
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-teal-800 font-bold text-xs">
                    เฉลี่ย {(filteredPatients.reduce((sum, p) => sum + (p.adlScore || 0), 0) / filteredPatients.length).toFixed(1)}
                  </td>
                  <td colSpan={4} className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                      <span>ส่งออก Excel ({filteredPatients.length} รายการ)</span>
                    </button>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
