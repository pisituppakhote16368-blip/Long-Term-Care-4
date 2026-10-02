export interface VillageInfo {
  no: string;      // 'ม.1', 'ม.2', ...
  num: number;     // 1, 2, ...
  name: string;    // 'บ้านธาตุทอง', 'บ้านหินโงม', ...
  fullName: string;// 'หมู่ 1 บ้านธาตุทอง', ...
}

export const THAT_THONG_VILLAGES_LIST: VillageInfo[] = [
  { no: 'ม.1', num: 1, name: 'บ้านธาตุทอง', fullName: 'หมู่ 1 บ้านธาตุทอง' },
  { no: 'ม.2', num: 2, name: 'บ้านหินโงม', fullName: 'หมู่ 2 บ้านหินโงม' },
  { no: 'ม.3', num: 3, name: 'บ้านโนนสร้างไพ', fullName: 'หมู่ 3 บ้านโนนสร้างไพ' },
  { no: 'ม.4', num: 4, name: 'บ้านหนองหอย', fullName: 'หมู่ 4 บ้านหนองหอย' },
  { no: 'ม.5', num: 5, name: 'บ้านคันชา', fullName: 'หมู่ 5 บ้านคันชา' },
  { no: 'ม.6', num: 6, name: 'บ้านโคกหลวง', fullName: 'หมู่ 6 บ้านโคกหลวง' },
  { no: 'ม.7', num: 7, name: 'บ้านเดิด', fullName: 'หมู่ 7 บ้านเดิด' },
  { no: 'ม.8', num: 8, name: 'บ้านเดื่อ', fullName: 'หมู่ 8 บ้านเดื่อ' },
];

/**
 * ดึงชื่อหมู่บ้านที่ถูกต้องตามหมายเลขหมู่ (ม.1 - ม.8) ของ ต.ธาตุทอง
 * หมู่ 1: บ้านธาตุทอง
 * หมู่ 2: บ้านหินโงม
 * หมู่ 3: บ้านโนนสร้างไพ
 * หมู่ 4: บ้านหนองหอย
 * หมู่ 5: บ้านคันชา
 * หมู่ 6: บ้านโคกหลวง
 * หมู่ 7: บ้านเดิด
 * หมู่ 8: บ้านเดื่อ
 */
export const getVillageNameByNumber = (villageNo?: string, rawVillageName?: string): string => {
  const combined = `${villageNo || ''} ${rawVillageName || ''}`.trim();
  
  // ตรวจหาหมายเลขหมู่ 1 - 8
  const match = combined.match(/(?:ม\.|หมู่\s*|หมู่ที่\s*|\b)([1-8])\b/);
  if (match) {
    const num = parseInt(match[1], 10);
    const found = THAT_THONG_VILLAGES_LIST.find((v) => v.num === num);
    if (found) return found.name;
  }

  // ตรวจหาคำสำคัญชื่อหมู่บ้าน
  if (combined.includes('หินโงม')) return 'บ้านหินโงม';
  if (combined.includes('โนนสร้างไพ')) return 'บ้านโนนสร้างไพ';
  if (combined.includes('หนองหอย')) return 'บ้านหนองหอย';
  if (combined.includes('คันชา')) return 'บ้านคันชา';
  if (combined.includes('โคกหลวง')) return 'บ้านโคกหลวง';
  if (combined.includes('เดิด')) return 'บ้านเดิด';
  if (combined.includes('เดื่อ')) return 'บ้านเดื่อ';
  if (combined.includes('ธาตุทอง')) return 'บ้านธาตุทอง';

  return rawVillageName || 'บ้านธาตุทอง';
};

/**
 * ปรับรูปแบบหมายเลขหมู่ให้เป็น 'ม.1' - 'ม.8'
 */
export const normalizeVillageNo = (villageNo?: string): string => {
  if (!villageNo) return 'ม.1';
  const match = villageNo.match(/([1-8])/);
  if (match) {
    return `ม.${match[1]}`;
  }
  return villageNo;
};

/**
 * แสดงชื่อหมู่บ้านพร้อมหมู่ เช่น 'ม.2 บ้านหินโงม'
 */
export const formatVillageLabel = (villageNo?: string, rawVillageName?: string): string => {
  const normNo = normalizeVillageNo(villageNo);
  const name = getVillageNameByNumber(villageNo, rawVillageName);
  return `${normNo} ${name}`;
};

/**
 * สร้างที่อยู่เต็มทางการสำหรับแสดงผลและพิมพ์ใบรายงาน A4
 * เช่น "บ้านเลขที่ 45 หมู่ 1 บ้านธาตุทอง ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร"
 */
export const formatFullPatientAddress = (patient: {
  address?: string;
  villageNo?: string;
  villageName?: string;
}): string => {
  const villageName = getVillageNameByNumber(patient.villageNo, patient.villageName);
  const villageNoStr = normalizeVillageNo(patient.villageNo);
  const villageNum = villageNoStr.replace('ม.', '').trim();
  
  let rawAddress = (patient.address || '').trim();
  
  // ตัดข้อความตำบล อำเภอ จังหวัด หรือหมู่ที่ซ้ำซ้อนออก
  rawAddress = rawAddress
    .replace(/ต\.ธาตุทอง.*/g, '')
    .replace(/ตำบลธาตุทอง.*/g, '')
    .replace(/อ\.สว่างแดนดิน.*/g, '')
    .replace(/จ\.สกลนคร.*/g, '')
    .replace(/บ้านธาตุทอง/g, '')
    .trim();

  // กำหนดเลขที่บ้าน
  let housePart = '';
  if (rawAddress) {
    if (rawAddress.startsWith('บ้านเลขที่')) {
      housePart = rawAddress;
    } else {
      housePart = `บ้านเลขที่ ${rawAddress}`;
    }
    // ตัดคำว่า หมู่... ที่ติดท้ายบ้านเลขที่ออก เพื่อให้เรียงตามมาตรฐาน
    housePart = housePart.replace(/(?:,\s*|\s+)หมู่(?:ที่)?\s*\d+.*$/i, '').trim();
  } else {
    housePart = 'บ้านเลขที่ -';
  }

  const villagePart = villageNum ? `หมู่ ${villageNum} ${villageName}` : villageName;
  return `${housePart} ${villagePart} ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร`;
};
