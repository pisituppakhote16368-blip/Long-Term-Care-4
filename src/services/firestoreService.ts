import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import { db, ensureAuth } from '../firebase';
import { ElderlyPatient, VisitRecord, StaffMember } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string): never {
  console.error(`Firestore error during ${operationType} on ${path}:`, error);
  throw error;
}

const PATIENTS_COLLECTION = 'patients';
const VISITS_COLLECTION = 'visits';
const STAFF_COLLECTION = 'staff';

// Initialize and ensure auth
ensureAuth();

/**
 * Seed initial records into Firestore if the database is currently empty
 */
export async function seedInitialDataIfEmpty(
  initialPatients: ElderlyPatient[],
  initialVisits: VisitRecord[],
  initialStaff: StaffMember[]
): Promise<void> {
  try {
    const patientsSnapshot = await getDocs(collection(db, PATIENTS_COLLECTION));
    if (patientsSnapshot.empty) {
      console.log('Seeding initial patients to Firestore...');
      for (const p of initialPatients) {
        await setDoc(doc(db, PATIENTS_COLLECTION, p.id), p);
      }
    }

    const visitsSnapshot = await getDocs(collection(db, VISITS_COLLECTION));
    if (visitsSnapshot.empty) {
      console.log('Seeding initial visits to Firestore...');
      for (const v of initialVisits) {
        await setDoc(doc(db, VISITS_COLLECTION, v.id), v);
      }
    }

    const staffSnapshot = await getDocs(collection(db, STAFF_COLLECTION));
    if (staffSnapshot.empty) {
      console.log('Seeding initial staff to Firestore...');
      for (const s of initialStaff) {
        await setDoc(doc(db, STAFF_COLLECTION, s.id), s);
      }
    }
  } catch (error) {
    console.error('Initial data check/seed notice:', error);
  }
}

/**
 * Subscribe to real-time changes in patients collection
 */
export function subscribePatients(
  callback: (patients: ElderlyPatient[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = PATIENTS_COLLECTION;
  const colRef = collection(db, path);
  
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ElderlyPatient[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ElderlyPatient);
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Save or update a patient in Firestore
 */
export async function savePatientToFirestore(patient: ElderlyPatient): Promise<void> {
  const path = `${PATIENTS_COLLECTION}/${patient.id}`;
  try {
    await setDoc(doc(db, PATIENTS_COLLECTION, patient.id), patient, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a patient from Firestore
 */
export async function deletePatientFromFirestore(patientId: string): Promise<void> {
  const path = `${PATIENTS_COLLECTION}/${patientId}`;
  try {
    await deleteDoc(doc(db, PATIENTS_COLLECTION, patientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to real-time changes in visits collection
 */
export function subscribeVisits(
  callback: (visits: VisitRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = VISITS_COLLECTION;
  const colRef = collection(db, path);
  
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: VisitRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as VisitRecord);
      });
      // Sort in-memory by visitDate desc, submittedAt desc
      list.sort((a, b) => {
        const dateA = a.visitDate + (a.visitTime || '');
        const dateB = b.visitDate + (b.visitTime || '');
        return dateB.localeCompare(dateA);
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Save a visit record to Firestore
 */
export async function saveVisitToFirestore(visit: VisitRecord): Promise<void> {
  const path = `${VISITS_COLLECTION}/${visit.id}`;
  try {
    await setDoc(doc(db, VISITS_COLLECTION, visit.id), visit, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a visit record from Firestore
 */
export async function deleteVisitFromFirestore(visitId: string): Promise<void> {
  const path = `${VISITS_COLLECTION}/${visitId}`;
  try {
    await deleteDoc(doc(db, VISITS_COLLECTION, visitId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to staff list changes in Firestore
 */
export function subscribeStaff(
  callback: (staff: StaffMember[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = STAFF_COLLECTION;
  const colRef = collection(db, path);
  
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: StaffMember[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as StaffMember);
      });
      if (list.length > 0) {
        callback(list);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Save a staff member to Firestore
 */
export async function saveStaffToFirestore(staffMember: StaffMember): Promise<void> {
  const path = `${STAFF_COLLECTION}/${staffMember.id}`;
  try {
    await setDoc(doc(db, STAFF_COLLECTION, staffMember.id), staffMember, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Batch update staff list in Firestore
 */
export async function saveAllStaffToFirestore(staffList: StaffMember[]): Promise<void> {
  try {
    for (const member of staffList) {
      await setDoc(doc(db, STAFF_COLLECTION, member.id), member, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, STAFF_COLLECTION);
  }
}
