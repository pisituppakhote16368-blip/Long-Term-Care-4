import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Printer, 
  CheckCircle2, 
  Boxes,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  Settings,
  RotateCcw,
  Check,
  X,
  Package,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { ElderlyPatient, LTCGroup } from '../types';

interface SuppliesTabProps {
  patients: ElderlyPatient[];
  currentRole: 'caregiver' | 'care_manager' | 'director';
  currentUserName: string;
}

export interface SupplyHeaderColumn {
  id: string;
  name: string;        // e.g. 'แพมเพิส', 'นม', 'ไข่'
  unit: string;        // e.g. 'ห่อ', 'กล่อง', 'แผง', 'ชิ้น', 'ฟอง'
  defaultQty: number;  // e.g. 1
  colorTheme?: 'sky' | 'amber' | 'emerald' | 'rose' | 'purple' | 'teal' | 'indigo';
}

export interface PatientSupplyItemData {
  received: boolean;
  quantity: number;
  unit: string;
  date?: string;
  note?: string;
}

// คอลัมน์เริ่มต้นตามคำขอของผู้ใช้: แพมเพิส, นม, ไข่
const DEFAULT_SUPPLY_COLUMNS: SupplyHeaderColumn[] = [
  { id: 'supp_diaper', name: 'แพมเพิส', unit: 'ห่อ', defaultQty: 1, colorTheme: 'sky' },
  { id: 'supp_milk', name: 'นม', unit: 'กล่อง', defaultQty: 1, colorTheme: 'amber' },
  { id: 'supp_egg', name: 'ไข่', unit: 'แผง', defaultQty: 1, colorTheme: 'emerald' },
];

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
  const [receivedFilter, setReceivedFilter] = useState<'all' | 'received_any' | 'received_all' | 'not_received'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // จัดการหัวตารางรายการที่จ่ายของ (แพมเพิส, นม, ไข่ ฯลฯ และสามารถแก้ไขหัวตารางได้)
  // =========================================================================
  const [supplyColumns, setSupplyColumns] = useState<SupplyHeaderColumn[]>(() => {
    try {
      const saved = localStorage.getItem('ltc_supplies_columns_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SUPPLY_COLUMNS;
  });

  // บันทึกหัวตารางเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    try {
      localStorage.setItem('ltc_supplies_columns_v3', JSON.stringify(supplyColumns));
    } catch {
      // ignore
    }
  }, [supplyColumns]);

  // Modal สำหรับจัดการแก้ไขหัวตาราง
  const [isHeaderEditModalOpen, setIsHeaderEditModalOpen] = useState(false);
  const [tempColumns, setTempColumns] = useState<SupplyHeaderColumn[]>([]);
  const [newColName, setNewColName] = useState('');
  const [newColUnit, setNewColUnit] = useState('ชิ้น');

  // ข้อมูลการจ่ายของใช้ให้ผู้ป่วยแต่ละราย (keyed by patientId -> columnId -> data)
  const [distributionData, setDistributionData] = useState<Record<string, Record<string, PatientSupplyItemData>>>(() => {
    try {
      const saved = localStorage.getItem('ltc_supplies_distribution_data_v3');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }

    // สร้างข้อมูลเริ่มต้นที่สมจริง: ผู้ป่วยกลุ่มติดเตียง (กลุ่ม 4) และติดบ้านมาก (กลุ่ม 3) ได้รับการจัดสรรของใช้จำเป็น
    const initialMap: Record<string, Record<string, PatientSupplyItemData>> = {};
    patients.forEach((p, idx) => {
      initialMap[p.id] = {};
      DEFAULT_SUPPLY_COLUMNS.forEach((col) => {
        // กลุ่ม 4 หรือกลุ่ม 3 สลับกันให้มีข้อมูลเบื้องต้น
        const isEligible = p.ltcGroup === 4 || (p.ltcGroup === 3 && idx % 2 === 0);
        initialMap[p.id][col.id] = {
          received: isEligible,
          quantity: isEligible ? (col.id === 'supp_diaper' ? 2 : 1) : 0,
          unit: col.unit,
          date: isEligible ? '2026-09-20' : undefined,
          note: isEligible ? 'จัดสรรรอบเดือน ก.ย. 2569' : ''
        };
      });
    });
    return initialMap;
  });

  // บันทึกข้อมูลการจ่ายของ
  useEffect(() => {
    try {
      localStorage.setItem('ltc_supplies_distribution_data_v3', JSON.stringify(distributionData));
    } catch {
      // ignore
    }
  }, [distributionData]);

  // เปิด Modal แก้ไขหัวตาราง
  const handleOpenHeaderModal = () => {
    setTempColumns(JSON.parse(JSON.stringify(supplyColumns)));
    setNewColName('');
    setNewColUnit('ชิ้น');
    setIsHeaderEditModalOpen(true);
  };

  // บันทึกการแก้ไขหัวตาราง
  const handleSaveHeaders = () => {
    if (tempColumns.length === 0) {
      showToast('⚠️ ต้องมีอย่างน้อย 1 รายการของใช้');
      return;
    }
    setSupplyColumns(tempColumns);
    setIsHeaderEditModalOpen(false);
    showToast('✓ บันทึกหัวตารางรายการของใช้เรียบร้อยแล้ว');
  };

  // รีเซ็ตหัวตารางเป็นค่าเริ่มต้น (แพมเพิส, นม, ไข่)
  const handleResetToDefaultHeaders = () => {
    setTempColumns(JSON.parse(JSON.stringify(DEFAULT_SUPPLY_COLUMNS)));
    showToast('รีเซ็ตรายการเป็น: แพมเพิส, นม, ไข่ แล้ว (กดบันทึกเพื่อยืนยัน)');
  };

  // เพิ่มคอลัมน์ใหม่ใน Modal
  const handleAddNewColumn = () => {
    if (!newColName.trim()) {
      showToast('กรุณากรอกชื่อรายการของใช้');
      return;
    }
    const colors: ('sky' | 'amber' | 'emerald' | 'rose' | 'purple' | 'teal' | 'indigo')[] = [
      'purple', 'teal', 'rose', 'sky', 'amber', 'emerald', 'indigo'
    ];
    const pickedColor = colors[tempColumns.length % colors.length];
    const newCol: SupplyHeaderColumn = {
      id: `supp_${Date.now()}`,
      name: newColName.trim(),
      unit: newColUnit.trim() || 'ชิ้น',
      defaultQty: 1,
      colorTheme: pickedColor
    };
    setTempColumns([...tempColumns, newCol]);
    setNewColName('');
    setNewColUnit('ชิ้น');
  };

  // ลบคอลัมน์ใน Modal
  const handleDeleteColumn = (colId: string) => {
    if (tempColumns.length <= 1) {
      showToast('ต้องมีอย่างน้อย 1 รายการ');
      return;
    }
    setTempColumns(tempColumns.filter(c => c.id !== colId));
  };

  // Quick Inline Rename Header
  const [inlineEditingColId, setInlineEditingColId] = useState<string | null>(null);
  const [inlineColName, setInlineColName] = useState('');
  const [inlineColUnit, setInlineColUnit] = useState('');

  const startInlineEdit = (col: SupplyHeaderColumn) => {
    setInlineEditingColId(col.id);
    setInlineColName(col.name);
    setInlineColUnit(col.unit);
  };

  const saveInlineEdit = () => {
    if (!inlineColName.trim()) return;
    setSupplyColumns(prev => prev.map(c => {
      if (c.id === inlineEditingColId) {
        return {
          ...c,
          name: inlineColName.trim(),
          unit: inlineColUnit.trim() || c.unit
        };
      }
      return c;
    }));
    setInlineEditingColId(null);
    showToast('✓ บันทึกชื่อหัวตารางแล้ว');
  };

  // ฟังก์ชันสลับสถานะการจ่ายของให้ผู้ป่วย (Toggle Received / Quantity)
  const handleToggleSupplyItem = (patientId: string, colId: string, defaultUnit: string) => {
    setDistributionData(prev => {
      const patientRec = prev[patientId] || {};
      const currentItem = patientRec[colId] || { received: false, quantity: 0, unit: defaultUnit };
      const nextReceived = !currentItem.received;
      const nextQty = nextReceived ? (currentItem.quantity > 0 ? currentItem.quantity : 1) : 0;

      return {
        ...prev,
        [patientId]: {
          ...patientRec,
          [colId]: {
            ...currentItem,
            received: nextReceived,
            quantity: nextQty,
            unit: defaultUnit,
            date: nextReceived ? new Date().toISOString().split('T')[0] : undefined
          }
        }
      };
    });
  };

  // ปรับจำนวนของที่จ่าย (+ หรือ -)
  const handleChangeQuantity = (patientId: string, colId: string, defaultUnit: string, delta: number) => {
    setDistributionData(prev => {
      const patientRec = prev[patientId] || {};
      const currentItem = patientRec[colId] || { received: false, quantity: 0, unit: defaultUnit };
      const newQty = Math.max(0, (currentItem.quantity || 0) + delta);
      const isReceived = newQty > 0;

      return {
        ...prev,
        [patientId]: {
          ...patientRec,
          [colId]: {
            ...currentItem,
            quantity: newQty,
            received: isReceived,
            unit: defaultUnit,
            date: isReceived ? (currentItem.date || new Date().toISOString().split('T')[0]) : undefined
          }
        }
      };
    });
  };

  // แจกของครบทุกรายการให้ผู้ป่วยรายนี้ทันที
  const handleMarkAllReceivedForPatient = (patientId: string) => {
    setDistributionData(prev => {
      const patientRec = prev[patientId] || {};
      const updatedRec: Record<string, PatientSupplyItemData> = { ...patientRec };
      supplyColumns.forEach(col => {
        updatedRec[col.id] = {
          received: true,
          quantity: updatedRec[col.id]?.quantity > 0 ? updatedRec[col.id].quantity : col.defaultQty || 1,
          unit: col.unit,
          date: new Date().toISOString().split('T')[0],
          note: updatedRec[col.id]?.note || ''
        };
      });
      return {
        ...prev,
        [patientId]: updatedRec
      };
    });
    showToast('✓ ทำเครื่องหมายได้รับของใช้ครบทุกรายการแล้ว');
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

      // ค้นหา: ชื่อ, เลขบัตร, หมู่บ้าน, ที่อยู่, โรค
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm ||
        p.name.toLowerCase().includes(q) ||
        p.citizenId.includes(q) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.villageName && p.villageName.toLowerCase().includes(q)) ||
        (p.villageNo && p.villageNo.toLowerCase().includes(q)) ||
        (p.chronicDiseases && p.chronicDiseases.some(d => d.toLowerCase().includes(q)));

      // หมู่บ้าน
      const matchVillage = selectedVillageFilter === 'all' || 
        p.villageName === selectedVillageFilter || 
        p.villageNo === selectedVillageFilter;

      // กลุ่ม LTC
      const matchGroup = selectedGroupFilter === 'all' || p.ltcGroup === Number(selectedGroupFilter);

      // กรองสถานะการได้รับของ
      let matchReceived = true;
      if (receivedFilter !== 'all') {
        const pRec = distributionData[p.id] || {};
        const receivedCount = supplyColumns.filter(c => pRec[c.id]?.received && pRec[c.id]?.quantity > 0).length;
        if (receivedFilter === 'received_all') {
          matchReceived = receivedCount === supplyColumns.length && supplyColumns.length > 0;
        } else if (receivedFilter === 'received_any') {
          matchReceived = receivedCount > 0;
        } else if (receivedFilter === 'not_received') {
          matchReceived = receivedCount === 0;
        }
      }

      return matchSearch && matchVillage && matchGroup && matchReceived;
    });
  }, [patients, searchTerm, selectedVillageFilter, selectedGroupFilter, selectedFiscalYear, receivedFilter, distributionData, supplyColumns]);

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

  // Helper สไตล์สีของหัวคอลัมน์ของใช้
  const getColumnHeaderTheme = (theme?: string) => {
    switch (theme) {
      case 'sky':
        return {
          bg: 'bg-sky-50 text-sky-900 border-sky-200',
          badge: 'bg-sky-100 text-sky-800 border-sky-300',
          activeCell: 'bg-sky-50/70 border-sky-200 text-sky-900',
          btn: 'bg-sky-600 hover:bg-sky-700 text-white'
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          activeCell: 'bg-amber-50/70 border-amber-200 text-amber-900',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          activeCell: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 text-purple-900 border-purple-200',
          badge: 'bg-purple-100 text-purple-800 border-purple-300',
          activeCell: 'bg-purple-50/70 border-purple-200 text-purple-900',
          btn: 'bg-purple-600 hover:bg-purple-700 text-white'
        };
      case 'rose':
        return {
          bg: 'bg-rose-50 text-rose-900 border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          activeCell: 'bg-rose-50/70 border-rose-200 text-rose-900',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white'
        };
      default:
        return {
          bg: 'bg-teal-50 text-teal-900 border-teal-200',
          badge: 'bg-teal-100 text-teal-800 border-teal-300',
          activeCell: 'bg-teal-50/70 border-teal-200 text-teal-900',
          btn: 'bg-teal-600 hover:bg-teal-700 text-white'
        };
    }
  };

  // คำนวณยอดรวมการแจกจ่ายของแต่ละรายการ
  const supplyTotals = useMemo(() => {
    const totals: Record<string, { totalQty: number; patientCount: number }> = {};
    supplyColumns.forEach(col => {
      totals[col.id] = { totalQty: 0, patientCount: 0 };
    });

    filteredPatients.forEach(p => {
      const pRec = distributionData[p.id];
      if (pRec) {
        supplyColumns.forEach(col => {
          const item = pRec[col.id];
          if (item && item.received && item.quantity > 0) {
            totals[col.id].totalQty += item.quantity;
            totals[col.id].patientCount += 1;
          }
        });
      }
    });

    return totals;
  }, [supplyColumns, filteredPatients, distributionData]);

  // ส่งออกเป็นไฟล์ Excel (.xls HTML table format) มีที่อยู่ตรงชื่อผู้ป่วย และมีคอลัมน์ของใช้ครบถ้วน
  const handleExportExcel = () => {
    const todayStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Headers สำหรับของใช้
    const supplyHeadersHtml = supplyColumns.map(col => 
      `<th style="background-color: #0f766e; color: #ffffff; border: 1px solid #0d5f58; padding: 8px; text-align: center;">${col.name} (${col.unit})</th>`
    ).join('');

    const rowsHtml = filteredPatients.map((p, idx) => {
      const diseasesStr = (p.chronicDiseases && p.chronicDiseases.length > 0)
        ? p.chronicDiseases.join(', ')
        : 'ไม่มีโรคประจำตัว';
      const groupStr = `กลุ่ม ${p.ltcGroup} (${getGroupName(p.ltcGroup).split(' : ')[1] || ''})`;
      const fullAddressStr = [p.villageNo, p.villageName, p.address].filter(Boolean).join(' ');

      // เซลล์ของใช้
      const pRec = distributionData[p.id] || {};
      const supplyCellsHtml = supplyColumns.map(col => {
        const item = pRec[col.id];
        if (item && item.received && item.quantity > 0) {
          return `<td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #047857; background-color: #f0fdf4;">✓ จ่ายแล้ว ${item.quantity} ${col.unit}</td>`;
        }
        return `<td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; color: #94a3b8;">-</td>`;
      }).join('');

      return `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">
            <div style="font-weight: bold; font-size: 14px;">${p.name}</div>
            <div style="font-size: 11px; color: #475569;">อายุ ${p.age} ปี • เลขบัตร: ${p.citizenId}</div>
            <div style="font-size: 11px; color: #0f766e; margin-top: 4px;">📍 ที่อยู่: ${fullAddressStr || '-'}</div>
          </td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #0f766e;">${p.adlScore ?? '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${diseasesStr}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${groupStr}</td>
          ${supplyCellsHtml}
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${p.caregiverName || '-'}</td>
        </tr>
      `;
    }).join('');

    // แถวสรุป Excel
    const summarySupplyCells = supplyColumns.map(col => {
      const tot = supplyTotals[col.id] || { totalQty: 0, patientCount: 0 };
      return `<td style="text-align: center; border: 1px solid #0d5f58; padding: 8px; font-weight: bold; background-color: #ccfbf1; color: #0f766e;">รวม ${tot.totalQty} ${col.unit} (${tot.patientCount} ราย)</td>`;
    }).join('');

    const totalColSpan = 5 + supplyColumns.length + 1;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>รายการของใช้จำเป็น LTC</x:Name>
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
          th { background-color: #0f766e; color: #ffffff; font-weight: bold; border: 1px solid #0d5f58; padding: 10px; font-size: 13px; }
          td { font-size: 12px; mso-number-format:"\\@"; }
          .title { font-size: 18px; font-weight: bold; text-align: center; color: #115e59; padding: 10px; }
          .subtitle { font-size: 13px; text-align: center; color: #475569; padding-bottom: 12px; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="${totalColSpan}" class="title">รายงานการแจกจ่ายของใช้จำเป็นแก่ผู้สูงอายุภาวะพึ่งพิง (LTC) - รพ.สต.ธาตุทอง</td>
          </tr>
          <tr>
            <td colspan="${totalColSpan}" class="subtitle">ข้อมูล ณ วันที่ ${todayStr} • จำนวนผู้ป่วย ${filteredPatients.length} ราย • รายการของใช้: ${supplyColumns.map(c => c.name).join(', ')}</td>
          </tr>
          <thead>
            <tr>
              <th style="width: 50px;">ลำดับ</th>
              <th style="width: 280px;">ชื่อผู้ป่วย และ ที่อยู่</th>
              <th style="width: 70px;">ADL</th>
              <th style="width: 220px;">โรคประจำตัว</th>
              <th style="width: 160px;">กลุ่ม</th>
              ${supplyHeadersHtml}
              <th style="width: 160px;">ผู้ดูแล (Caregiver)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td colspan="5" style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">ยอดรวมการจ่ายของใช้ทั้งหมด:</td>
              ${summarySupplyCells}
              <td style="border: 1px solid #cbd5e1; padding: 8px;">ผู้ป่วยรวม ${filteredPatients.length} ราย</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `รายการจ่ายของใช้จำเป็น_แพมเพิส_นม_ไข่_${dateStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('✓ ส่งออกไฟล์ Excel (.xls) พร้อมรายการของใช้และที่อยู่เรียบร้อยแล้ว');
  };

  // ส่งออกเป็นไฟล์ CSV
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    const supplyHeaderCsv = supplyColumns.map(c => `"${c.name} (${c.unit})"`).join(',');
    csvContent += `ลำดับ,ชื่อผู้ป่วย,ที่อยู่และหมู่บ้าน,ADL,โรคประจำตัว,กลุ่ม,${supplyHeaderCsv},ผู้ดูแลรับผิดชอบ\n`;

    filteredPatients.forEach((p, idx) => {
      const diseases = (p.chronicDiseases && p.chronicDiseases.length > 0)
        ? `"${p.chronicDiseases.join('; ')}"`
        : '"-"';
      const groupStr = `"กลุ่ม ${p.ltcGroup} (${getGroupName(p.ltcGroup).split(' : ')[1] || ''})"`;
      const fullAddress = `"${[p.villageNo, p.villageName, p.address].filter(Boolean).join(' ')}"`;
      const cg = `"${p.caregiverName || '-'}"`;

      const pRec = distributionData[p.id] || {};
      const supplyVals = supplyColumns.map(col => {
        const item = pRec[col.id];
        if (item && item.received && item.quantity > 0) {
          return `"${item.quantity} ${col.unit}"`;
        }
        return '"-"';
      }).join(',');

      csvContent += `${idx + 1},"${p.name}",${fullAddress},${p.adlScore ?? 0},${diseases},${groupStr},${supplyVals},${cg}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `รายการจ่ายของใช้จำเป็น_${dateStr}.csv`);
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 font-['Prompt',sans-serif]">
                  รายการของใช้ที่จำเป็น (แพมเพิส • นม • ไข่ ฯลฯ)
                </h2>
                <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-300">
                  หน้า 7
                </span>
                <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  แก้ไขหัวตารางได้
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                จัดการและบันทึกการแจกจ่ายของใช้จำเป็นแก่ผู้ป่วย LTC โดยแสดงที่อยู่คู่กับชื่อผู้ป่วย และปรับแต่งหัวตารางของใช้ได้อย่างอิสระ
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit Headers, Export Excel, CSV & Print */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenHeaderModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all cursor-pointer border border-amber-300 shadow-2xs hover:shadow"
              title="แก้ไขหัวตาราง หรือเพิ่มรายการของใช้"
            >
              <Settings className="w-4 h-4 text-amber-700" />
              <span>แก้ไขหัวตารางของใช้ ({supplyColumns.length})</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 shadow-2xs"
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

        {/* Quick Summary Cards of Supplies Distributed */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4">
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5">
            <div className="text-[11px] font-medium text-slate-500">ผู้ป่วยทั้งหมด</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {filteredPatients.length} <span className="text-xs font-normal text-slate-400">ราย</span>
            </div>
          </div>

          {supplyColumns.map(col => {
            const tot = supplyTotals[col.id] || { totalQty: 0, patientCount: 0 };
            const theme = getColumnHeaderTheme(col.colorTheme);
            return (
              <div 
                key={col.id} 
                className={`${theme.bg} border rounded-xl p-2.5 relative group transition-all`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="truncate" title={col.name}>{col.name}</span>
                  <span className="text-[10px] opacity-75 font-normal">({col.unit})</span>
                </div>
                <div className="text-base font-bold mt-0.5 flex items-baseline gap-1">
                  <span>{tot.totalQty}</span>
                  <span className="text-[11px] font-normal opacity-80">{col.unit}</span>
                </div>
                <div className="text-[10px] opacity-75 mt-0.5">
                  จ่ายแล้ว {tot.patientCount} ราย
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs pt-4 border-t border-slate-100 mt-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ป่วย, ที่อยู่, โรคประจำตัว..."
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

          {/* Status of Received Supplies Filter */}
          <div>
            <select
              value={receivedFilter}
              onChange={(e) => setReceivedFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">สถานะการจ่าย: ทั้งหมด</option>
              <option value="received_all">ได้รับของใช้ครบทุกรายการ</option>
              <option value="received_any">ได้รับของใช้แล้วบางรายการ</option>
              <option value="not_received">ยังไม่ได้รับของใช้</option>
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
      </div>

      {/* ========================================================================= */}
      {/* THE MAIN TABLE: ชื่อผู้ป่วย+ที่อยู่ • ADL • โรคประจำตัว • กลุ่ม • รายการจ่ายของ (แพมเพิส, นม, ไข่...) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Table Header Banner */}
        <div className="p-4 bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base font-['Prompt',sans-serif]">
                ตารางบันทึกการแจกจ่ายของใช้จำเป็นแก่ผู้ป่วย LTC
              </h3>
              <p className="text-[11px] text-teal-200 font-normal">
                ที่อยู่ผู้ป่วยแสดงตรงคอลัมน์ชื่อ • คลิกที่กล่องของใช้เพื่อเพิ่ม/ลดจำนวน หรือเปิด-ปิดการจ่าย
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenHeaderModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไขหัวตาราง ({supplyColumns.length} รายการ)</span>
            </button>
            <span className="text-xs bg-teal-700/80 text-teal-100 px-3 py-1 rounded-full font-medium border border-teal-500/50">
              พบ {filteredPatients.length} ราย
            </span>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 font-['Prompt',sans-serif]">
              {/* Row 1: Group Headers */}
              <tr className="border-b border-slate-200 text-center">
                <th colSpan={5} className="py-2 px-3 bg-slate-100 text-slate-600 text-left border-r border-slate-200">
                  ข้อมูลพื้นฐานผู้ป่วย และการประเมิน
                </th>
                <th 
                  colSpan={supplyColumns.length} 
                  className="py-2 px-3 bg-amber-50/80 text-amber-900 border-r border-slate-200"
                >
                  <div className="flex items-center justify-between px-2">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Package className="w-3.5 h-3.5 text-amber-700" />
                      รายการที่จ่ายของ (ของใช้ที่จำเป็น)
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenHeaderModal}
                      className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                    >
                      + เพิ่ม/แก้ไขหัวตาราง
                    </button>
                  </div>
                </th>
                <th colSpan={2} className="py-2 px-3 bg-slate-100 text-slate-600">
                  ผู้ดูแลและการจัดการ
                </th>
              </tr>

              {/* Row 2: Detailed Column Headers */}
              <tr>
                <th className="py-3 px-3 text-center w-12 shrink-0 border-r border-slate-200">
                  ลำดับ
                </th>
                <th className="py-3 px-4 min-w-[260px] border-r border-slate-200">
                  ชื่อผู้ป่วย / ที่อยู่
                </th>
                <th className="py-3 px-2 text-center w-20 border-r border-slate-200">
                  ADL
                </th>
                <th className="py-3 px-3 min-w-[180px] border-r border-slate-200">
                  โรคประจำตัว
                </th>
                <th className="py-3 px-3 min-w-[150px] border-r border-slate-200">
                  กลุ่ม
                </th>

                {/* DYNAMIC SUPPLY COLUMNS (แพมเพิส, นม, ไข่ ฯลฯ และสามารถแก้ไขหัวตารางได้) */}
                {supplyColumns.map((col) => {
                  const theme = getColumnHeaderTheme(col.colorTheme);
                  const isInlineEditing = inlineEditingColId === col.id;

                  return (
                    <th 
                      key={col.id} 
                      className={`py-2 px-2.5 min-w-[125px] text-center border-r border-slate-200 ${theme.bg}`}
                    >
                      {isInlineEditing ? (
                        <div className="flex flex-col gap-1 p-1 bg-white rounded-lg shadow-sm border border-slate-300">
                          <input
                            type="text"
                            value={inlineColName}
                            onChange={(e) => setInlineColName(e.target.value)}
                            placeholder="ชื่อรายการ"
                            className="px-1.5 py-0.5 text-xs border rounded text-slate-800 font-bold"
                            autoFocus
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={inlineColUnit}
                              onChange={(e) => setInlineColUnit(e.target.value)}
                              placeholder="หน่วย"
                              className="px-1.5 py-0.5 text-[11px] border rounded text-slate-700 w-16"
                            />
                            <button
                              type="button"
                              onClick={saveInlineEdit}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              title="บันทึก"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEditingColId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              title="ยกเลิก"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center gap-1 font-bold text-xs sm:text-sm">
                            <span>{col.name}</span>
                            <button
                              type="button"
                              onClick={() => startInlineEdit(col)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-500 hover:text-slate-800"
                              title="แก้ไขชื่อหัวตารางนี้"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.2 rounded-full border mt-0.5 ${theme.badge}`}>
                            หน่วย: {col.unit}
                          </span>
                        </div>
                      )}
                    </th>
                  );
                })}

                <th className="py-3 px-3 min-w-[140px] border-r border-slate-200">
                  ผู้ดูแลรับผิดชอบ (CG)
                </th>
                <th className="py-3 px-2 text-center w-24">
                  จัดสรรด่วน
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6 + supplyColumns.length} className="py-16 text-center text-slate-400">
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
                          setReceivedFilter('all');
                        }}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, idx) => {
                  const patientSupplies = distributionData[patient.id] || {};

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-teal-50/30 transition-colors"
                    >
                      {/* ลำดับ */}
                      <td className="py-3 px-2 text-center text-slate-400 font-mono text-xs border-r border-slate-100">
                        {idx + 1}
                      </td>

                      {/* ชื่อผู้ป่วย และ ที่อยู่ (เอา ที่อยู่ ไปใส่ตรงชื่อผู้ป่วย ตามที่ผู้ใช้ต้องการ) */}
                      <td className="py-3 px-4 border-r border-slate-100">
                        <div className="flex items-start gap-3">
                          <img
                            src={patient.avatarUrl}
                            alt={patient.name}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm font-['Prompt',sans-serif]">
                              {patient.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-sans mt-0.5">
                              <span>อายุ {patient.age} ปี</span>
                              <span>•</span>
                              <span className="font-mono text-slate-400">{patient.citizenId}</span>
                            </div>

                            {/* ที่อยู่แสดงตรงชื่อผู้ป่วยตามที่ผู้ใช้สั่ง */}
                            <div className="mt-1.5 bg-slate-50 border border-slate-200/90 rounded-lg p-1.5 flex items-start gap-1.5 text-[11px] text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="font-semibold text-teal-950">
                                  {patient.villageNo || ''} {patient.villageName || ''}
                                </span>
                                {patient.address && (
                                  <span className="text-slate-500 ml-1">
                                    • {patient.address}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ADL */}
                      <td className="py-3 px-2 text-center border-r border-slate-100">
                        <div className="inline-flex flex-col items-center justify-center">
                          <span className="font-bold font-mono text-sm sm:text-base text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                            {patient.adlScore ?? '-'}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">คะแนน</span>
                        </div>
                      </td>

                      {/* โรคประจำตัว */}
                      <td className="py-3 px-3 border-r border-slate-100">
                        {patient.chronicDiseases && patient.chronicDiseases.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {patient.chronicDiseases.map((disease, dIdx) => (
                              <span
                                key={dIdx}
                                className="inline-block bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200/80"
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
                      <td className="py-3 px-3 border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs block text-center ${getGroupBadgeClass(patient.ltcGroup)}`}>
                          {getGroupName(patient.ltcGroup)}
                        </span>
                      </td>

                      {/* DYNAMIC SUPPLY CELLS (แพมเพิส, นม, ไข่ ฯลฯ) */}
                      {supplyColumns.map((col) => {
                        const itemData = patientSupplies[col.id] || {
                          received: false,
                          quantity: 0,
                          unit: col.unit
                        };
                        const theme = getColumnHeaderTheme(col.colorTheme);

                        return (
                          <td 
                            key={col.id} 
                            className="py-2.5 px-2 text-center border-r border-slate-100"
                          >
                            <div className="flex flex-col items-center justify-center gap-1">
                              {/* Toggle Received Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleSupplyItem(patient.id, col.id, col.unit)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer w-full max-w-[105px] ${
                                  itemData.received && itemData.quantity > 0
                                    ? `${theme.activeCell} shadow-2xs font-semibold`
                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                                }`}
                                title={`คลิกเพื่อเปิด/ปิดการจ่าย ${col.name}`}
                              >
                                {itemData.received && itemData.quantity > 0 ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>{itemData.quantity} {col.unit}</span>
                                  </>
                                ) : (
                                  <span className="text-[11px]">- ยังไม่จ่าย -</span>
                                )}
                              </button>

                              {/* Stepper (+ / -) เมื่อจ่ายแล้ว */}
                              {itemData.received && (
                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1 py-0.5 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => handleChangeQuantity(patient.id, col.id, col.unit, -1)}
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-rose-600 font-bold"
                                    title="ลด 1"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono text-[11px] font-bold text-slate-800 px-1">
                                    {itemData.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleChangeQuantity(patient.id, col.id, col.unit, 1)}
                                    className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-600 font-bold"
                                    title="เพิ่ม 1"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* ผู้ดูแลรับผิดชอบ */}
                      <td className="py-3 px-3 text-slate-700 text-xs border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {patient.caregiverName ? patient.caregiverName.slice(0, 1) : 'C'}
                          </div>
                          <span className="font-medium text-slate-800 truncate" title={patient.caregiverName}>
                            {patient.caregiverName || '-'}
                          </span>
                        </div>
                      </td>

                      {/* จัดสรรด่วน / จ่ายครบ */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleMarkAllReceivedForPatient(patient.id)}
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                          title="ทำเครื่องหมายจ่ายของใช้ครบทุกรายการให้ผู้ป่วยรายนี้"
                        >
                          จ่ายครบ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer with Summary */}
            {filteredPatients.length > 0 && (
              <tfoot className="bg-slate-50 text-slate-800 font-bold text-xs border-t-2 border-slate-300 font-['Prompt',sans-serif]">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 text-slate-900">
                    รวมทั้งสิ้น {filteredPatients.length} ราย (ที่อยู่แสดงตรงชื่อผู้ป่วย)
                  </td>
                  <td className="py-3.5 px-2 text-center font-mono text-teal-800 font-bold text-xs">
                    {(filteredPatients.reduce((sum, p) => sum + (p.adlScore || 0), 0) / filteredPatients.length).toFixed(1)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-3 text-slate-500 text-right">
                    ยอดรวมจ่ายของใช้:
                  </td>

                  {/* ยอดรวมของแต่ละคอลัมน์ของใช้ */}
                  {supplyColumns.map((col) => {
                    const tot = supplyTotals[col.id] || { totalQty: 0, patientCount: 0 };
                    const theme = getColumnHeaderTheme(col.colorTheme);

                    return (
                      <td key={col.id} className={`py-3.5 px-2 text-center border-r border-slate-200 ${theme.bg}`}>
                        <div className="font-bold text-xs">
                          {tot.totalQty} <span className="font-normal text-[10px]">{col.unit}</span>
                        </div>
                        <div className="text-[9px] font-normal opacity-80">
                          ({tot.patientCount} ราย)
                        </div>
                      </td>
                    );
                  })}

                  <td colSpan={2} className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                      <span>ส่งออก Excel</span>
                    </button>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: จัดการและแก้ไขรายการหัวตาราง (แพมเพิส, นม, ไข่ ฯลฯ) */}
      {/* ========================================================================= */}
      {isHeaderEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Settings className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Prompt',sans-serif]">
                    แก้ไขรายการหัวตารางของใช้ที่จำเป็น
                  </h3>
                  <p className="text-xs text-slate-500">
                    กำหนดรายการของใช้ที่แจกจ่าย (เช่น แพมเพิส, นม, ไข่) หรือเพิ่ม/ลบรายการใหม่ได้ตามต้องการ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHeaderEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of current supply columns */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              <label className="text-xs font-bold text-slate-700">
                รายการหัวตารางปัจจุบัน ({tempColumns.length} รายการ):
              </label>

              {tempColumns.map((col, index) => (
                <div 
                  key={col.id} 
                  className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </span>

                  {/* ชื่อรายการ */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempColumns(tempColumns.map((c, i) => i === index ? { ...c, name: val } : c));
                      }}
                      placeholder="ชื่อรายการ (เช่น แพมเพิส)"
                      className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* หน่วยนับ */}
                  <div className="w-24">
                    <input
                      type="text"
                      value={col.unit}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempColumns(tempColumns.map((c, i) => i === index ? { ...c, unit: val } : c));
                      }}
                      placeholder="หน่วย (เช่น ห่อ)"
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-1 focus:ring-amber-500 text-center"
                    />
                  </div>

                  {/* ปุ่มลบ */}
                  <button
                    type="button"
                    onClick={() => handleDeleteColumn(col.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="ลบคอลัมน์นี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* เพิ่มรายการใหม่ */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-700" />
                เพิ่มรายการของใช้ใหม่ในหัวตาราง:
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="เช่น แผ่นรองซับ, ข้าวสาร, ยา..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewColumn();
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500"
                />

                <input
                  type="text"
                  placeholder="หน่วยนับ (เช่น ชิ้น)"
                  value={newColUnit}
                  onChange={(e) => setNewColUnit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewColumn();
                  }}
                  className="w-24 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500 text-center"
                />

                <button
                  type="button"
                  onClick={handleAddNewColumn}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  + เพิ่ม
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleResetToDefaultHeaders}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="รีเซ็ตเป็น 3 รายการมาตรฐาน: แพมเพิส, นม, ไข่"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตเป็น แพมเพิส, นม, ไข่</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHeaderEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveHeaders}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-teal-200" />
                  <span>บันทึกหัวตาราง</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
