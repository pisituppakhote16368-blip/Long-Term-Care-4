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
 * วิเคราะห์และแก้ไขข้อมูลหมู่บ้านของผู้ป่วยให้ถูกต้องตรงตาม 8 หมู่บ้านของตำบลธาตุทองเสมอ
 * หมู่ 1: บ้านธาตุทอง
 * หมู่ 2: บ้านหินโงม
 * หมู่ 3: บ้านโนนสร้างไพ
 * หมู่ 4: บ้านหนองหอย
 * หมู่ 5: บ้านคันชา
 * หมู่ 6: บ้านโคกหลวง
 * หมู่ 7: บ้านเดิด
 * หมู่ 8: บ้านเดื่อ
 */
export const resolvePatientVillage = (patient: {
  villageNo?: string;
  villageName?: string;
  address?: string;
}): VillageInfo => {
  const vNo = (patient.villageNo || '').trim();
  const vName = (patient.villageName || '').trim();
  const addr = (patient.address || '').trim();
  const combined = `${vNo} ${vName} ${addr}`.trim();

  let num = 0;

  // 1. ตรวจสอบจาก villageNo ก่อน ถ้ามีหมายเลขหมู่ 1-8 ที่ชัดเจน
  if (vNo) {
    const matchNo = vNo.match(/(?:ม\.|หมู่\s*ที่\s*|หมู่\s*|^)\s*([1-8])(?!\d)/);
    if (matchNo) {
      num = parseInt(matchNo[1], 10);
    }
  }

  // 2. ถ้ายังไม่พบหรือ vNo เป็นค่าเริ่มต้น ให้ตรวจชื่อหมู่บ้านเฉพาะเจาะจง
  if (!num) {
    if (combined.includes('หินโงม')) num = 2;
    else if (combined.includes('โนนสร้างไพ')) num = 3;
    else if (combined.includes('หนองหอย')) num = 4;
    else if (combined.includes('คันชา')) num = 5;
    else if (combined.includes('โคกหลวง')) num = 6;
    else if (combined.includes('เดิด')) num = 7;
    else if (combined.includes('เดื่อ')) num = 8;
  }

  // 3. ตรวจสอบหมายเลขหมู่จากที่อยู่ (address) เช่น "บ้านเลขที่ 88 หมู่ที่ 2"
  if (!num && addr) {
    const matchAddr = addr.match(/(?:หมู่\s*ที่\s*|หมู่\s*|ม\.)\s*([1-8])(?!\d)/);
    if (matchAddr) {
      num = parseInt(matchAddr[1], 10);
    }
  }

  // 4. ถ้ามีคำว่า ธาตุทอง และไม่มีชื่อหมู่บ้านอื่น
  if (!num && combined.includes('ธาตุทอง')) {
    num = 1;
  }

  // ค่าเริ่มต้นคือ หมู่ 1 บ้านธาตุทอง
  if (!num || num < 1 || num > 8) {
    num = 1;
  }

  return THAT_THONG_VILLAGES_LIST.find((v) => v.num === num) || THAT_THONG_VILLAGES_LIST[0];
};

/**
 * ดึงชื่อหมู่บ้านที่ถูกต้องตามหมายเลขหมู่ (ม.1 - ม.8) ของ ต.ธาตุทอง
 */
export const getVillageNameByNumber = (
  villageNo?: string,
  rawVillageName?: string,
  address?: string
): string => {
  const resolved = resolvePatientVillage({ villageNo, villageName: rawVillageName, address });
  return resolved.name;
};

/**
 * ปรับรูปแบบหมายเลขหมู่ให้เป็น 'ม.1' - 'ม.8'
 */
export const normalizeVillageNo = (villageNo?: string, address?: string): string => {
  const resolved = resolvePatientVillage({ villageNo, address });
  return resolved.no;
};

/**
 * แสดงชื่อหมู่บ้านพร้อมหมู่ เช่น 'ม.2 บ้านหินโงม'
 */
export const formatVillageLabel = (
  villageNo?: string,
  rawVillageName?: string,
  address?: string
): string => {
  const resolved = resolvePatientVillage({ villageNo, villageName: rawVillageName, address });
  return `${resolved.no} ${resolved.name}`;
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
  const resolved = resolvePatientVillage(patient);
  let rawAddress = (patient.address || '').trim();

  // ตัดข้อความตำบล อำเภอ จังหวัด หรือชื่อหมู่บ้านที่ซ้ำซ้อนออก
  rawAddress = rawAddress
    .replace(/ต\.ธาตุทอง.*/g, '')
    .replace(/ตำบลธาตุทอง.*/g, '')
    .replace(/อ\.สว่างแดนดิน.*/g, '')
    .replace(/อำเภอสว่างแดนดิน.*/g, '')
    .replace(/จ\.สกลนคร.*/g, '')
    .replace(/จังหวัดสกลนคร.*/g, '')
    .replace(/บ้านธาตุทอง/g, '')
    .replace(/บ้านหินโงม/g, '')
    .replace(/บ้านโนนสร้างไพ/g, '')
    .replace(/บ้านหนองหอย/g, '')
    .replace(/บ้านคันชา/g, '')
    .replace(/บ้านโคกหลวง/g, '')
    .replace(/บ้านเดิด/g, '')
    .replace(/บ้านเดื่อ/g, '')
    .replace(/(?:,\s*|\s+)?(?:หมู่\s*ที่\s*|หมู่\s*|ม\.)\s*[1-8]/gi, '')
    .trim();

  // กำหนดเลขที่บ้าน
  let housePart = '';
  if (rawAddress) {
    if (rawAddress.startsWith('บ้านเลขที่')) {
      housePart = rawAddress;
    } else {
      housePart = `บ้านเลขที่ ${rawAddress}`;
    }
    // ตัดคำว่า หมู่... ที่ติดท้ายบ้านเลขที่ออก
    housePart = housePart.replace(/(?:,\s*|\s+)หมู่(?:ที่)?\s*\d+.*$/i, '').trim();
  } else {
    housePart = 'บ้านเลขที่ -';
  }

  return `${housePart} หมู่ ${resolved.num} ${resolved.name} ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร`;
};
