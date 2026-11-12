import {
  EducationalBoard,
  ExportFormat,
  ExportTemplateType,
  BoardExportTemplate,
  ComplianceValidationIssue,
  TamperProofAuditRecord,
  AuditChainVerificationResult,
  GovtComplianceStats,
  AuditAction,
  AuditEntityType,
  AuditFieldDiff,
} from '@krypton/types';

// Simple SHA-256 string hashing using Web Crypto when available or pure JS fallback
export async function sha256(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Pure JavaScript synchronous SHA-256 implementation
  return synchronousSha256(message);
}

// Pure JS SHA-256 implementation for deterministic hash chaining
function synchronousSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0,
    j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let composite = candidate * candidate; composite < 312; composite += candidate) {
        isComposite[composite] = true;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) !== 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : ((w[i - 16] + s0 + w[i - 7] + s1) | 0);

      const s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1h + ch + k[i] + w[i]) | 0;
      const s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0h + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (8 * b)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

// Compute hash of an audit block
export function computeAuditRecordHash(
  sequence: number,
  timestamp: string,
  tenantId: string,
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  changes: AuditFieldDiff[],
  reason: string,
  previousHash: string,
): string {
  const payload = [
    sequence,
    timestamp,
    tenantId,
    userId,
    entityType,
    entityId,
    action,
    JSON.stringify(changes),
    reason.trim(),
    previousHash,
  ].join('|');

  return synchronousSha256(payload);
}

// Initial Genesis Block
const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export const INITIAL_AUDIT_BLOCKS: TamperProofAuditRecord[] = (() => {
  const records: TamperProofAuditRecord[] = [];

  // Genesis Block #0
  const b0_time = '2026-10-01T08:00:00.000Z';
  const b0_changes: AuditFieldDiff[] = [
    { field: 'engine', fieldLabel: 'Compliance Ledger', oldValue: null, newValue: 'GENESIS_INITIALIZED', changeType: 'ADDED' },
  ];
  const b0_hash = computeAuditRecordHash(
    0,
    b0_time,
    'tenant-krypton-01',
    'system-core',
    'STUDENT_RECORD',
    'GENESIS-LEDGER',
    'STUDENT_RECORD_MODIFIED',
    b0_changes,
    'Genesis Block of Tamper-Proof Audit Chain for Academic Year 2026-27',
    GENESIS_PREV_HASH,
  );

  records.push({
    id: 'AUD-2026-0001',
    sequence: 0,
    timestamp: b0_time,
    tenantId: 'tenant-krypton-01',
    entityType: 'STUDENT_RECORD',
    entityId: 'GENESIS-LEDGER',
    entityName: 'Core Security Audit Ledger Initialization',
    action: 'STUDENT_RECORD_MODIFIED',
    performedBy: {
      userId: 'usr-sys-01',
      fullName: 'System Security Daemon',
      role: 'SYSTEM_AUDITOR',
      email: 'security@kryptonschool.edu.in',
      ipAddress: '127.0.0.1',
      userAgent: 'Krypton-SecurityKernel/2.0',
    },
    reason: 'Genesis Block of Tamper-Proof Audit Chain for Academic Year 2026-27',
    approvalRef: 'SEC-GENESIS-2026',
    changes: b0_changes,
    previousHash: GENESIS_PREV_HASH,
    currentHash: b0_hash,
    signature: 'SIG_SHA256_' + b0_hash.substring(0, 16).toUpperCase(),
  });

  // Block #1: Grade Override
  const b1_time = '2026-10-08T10:14:22.000Z';
  const b1_changes: AuditFieldDiff[] = [
    { field: 'marks', fieldLabel: 'Mathematics Term 1 Score', oldValue: '74.0', newValue: '88.5', changeType: 'MODIFIED' },
    { field: 'letterGrade', fieldLabel: 'Letter Grade', oldValue: 'B1', newValue: 'A2', changeType: 'MODIFIED' },
  ];
  const b1_hash = computeAuditRecordHash(
    1,
    b1_time,
    'tenant-krypton-01',
    'usr-principal-01',
    'GRADE',
    'GRD-MATH-10A-101',
    'GRADE_OVERRIDE',
    b1_changes,
    'Re-evaluation request re-checked by Examination Committee & approved by Principal (Order #EX-2026-REV-41)',
    records[0].currentHash,
  );

  records.push({
    id: 'AUD-2026-0002',
    sequence: 1,
    timestamp: b1_time,
    tenantId: 'tenant-krypton-01',
    entityType: 'GRADE',
    entityId: 'GRD-MATH-10A-101',
    entityName: 'Class 10A Mathematics Term-1 Exam - Aarav Patel (Adm #KPS-2024-101)',
    action: 'GRADE_OVERRIDE',
    performedBy: {
      userId: 'usr-principal-01',
      fullName: 'Dr. K. R. Nambiar',
      role: 'PRINCIPAL',
      email: 'principal@kryptonschool.edu.in',
      ipAddress: '192.168.1.10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    },
    reason: 'Re-evaluation request re-checked by Examination Committee & approved by Principal (Order #EX-2026-REV-41)',
    approvalRef: 'EX-2026-REV-41',
    changes: b1_changes,
    previousHash: records[0].currentHash,
    currentHash: b1_hash,
    signature: 'SIG_SHA256_' + b1_hash.substring(0, 16).toUpperCase(),
  });

  // Block #2: Fee Status Modification
  const b2_time = '2026-10-09T14:32:05.000Z';
  const b2_changes: AuditFieldDiff[] = [
    { field: 'status', fieldLabel: 'Payment Status', oldValue: 'PAID', newValue: 'OVERDUE', changeType: 'MODIFIED' },
    { field: 'paymentReference', fieldLabel: 'Instrument Reference', oldValue: 'CHQ-890412', newValue: 'BOUNCED: Insufficient Funds', changeType: 'MODIFIED' },
  ];
  const b2_hash = computeAuditRecordHash(
    2,
    b2_time,
    'tenant-krypton-01',
    'usr-acct-01',
    'FEE_PAYMENT',
    'INV-2026-891',
    'FEE_STATUS_MODIFIED',
    b2_changes,
    'Bank cheque dishonored with memo "Funds Insufficient". Invoice restored to Overdue with late fee waiver applied per bursar direction.',
    records[1].currentHash,
  );

  records.push({
    id: 'AUD-2026-0003',
    sequence: 2,
    timestamp: b2_time,
    tenantId: 'tenant-krypton-01',
    entityType: 'FEE_PAYMENT',
    entityId: 'INV-2026-891',
    entityName: 'Tuition Fee Invoice #INV-2026-891 - Ananya Sharma (Adm #KPS-2024-102)',
    action: 'FEE_STATUS_MODIFIED',
    performedBy: {
      userId: 'usr-acct-01',
      fullName: 'Thomas Varghese',
      role: 'CHIEF_ACCOUNTANT',
      email: 'accounts@kryptonschool.edu.in',
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/127.0',
    },
    reason: 'Bank cheque dishonored with memo "Funds Insufficient". Invoice restored to Overdue with late fee waiver applied per bursar direction.',
    approvalRef: 'FIN-BOUNCE-99',
    changes: b2_changes,
    previousHash: records[1].currentHash,
    currentHash: b2_hash,
    signature: 'SIG_SHA256_' + b2_hash.substring(0, 16).toUpperCase(),
  });

  // Block #3: Student Date of Birth / Record Altered
  const b3_time = '2026-10-10T09:18:44.000Z';
  const b3_changes: AuditFieldDiff[] = [
    { field: 'dateOfBirth', fieldLabel: 'Date of Birth', oldValue: '2010-04-14', newValue: '2010-04-12', changeType: 'MODIFIED' },
    { field: 'birthCertNumber', fieldLabel: 'Birth Certificate No', oldValue: 'PENDING_VERIF', newValue: 'MUNI/EKM/2010/8991', changeType: 'MODIFIED' },
  ];
  const b3_hash = computeAuditRecordHash(
    3,
    b3_time,
    'tenant-krypton-01',
    'usr-admin-01',
    'STUDENT_RECORD',
    'STU-101',
    'DOB_ALTERED',
    b3_changes,
    'Correction made upon submission of original Corporation Birth Certificate & Taluk Court affidavit #TC-552/2026.',
    records[2].currentHash,
  );

  records.push({
    id: 'AUD-2026-0004',
    sequence: 3,
    timestamp: b3_time,
    tenantId: 'tenant-krypton-01',
    entityType: 'STUDENT_RECORD',
    entityId: 'STU-101',
    entityName: 'Student Profile - Aarav Patel (Aadhaar: XXXX-XXXX-4512)',
    action: 'DOB_ALTERED',
    performedBy: {
      userId: 'usr-admin-01',
      fullName: 'Sreedevi Menon',
      role: 'REGISTRAR_ADMIN',
      email: 'registrar@kryptonschool.edu.in',
      ipAddress: '192.168.1.18',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128.0',
    },
    reason: 'Correction made upon submission of original Corporation Birth Certificate & Taluk Court affidavit #TC-552/2026.',
    approvalRef: 'REG-AFF-552',
    changes: b3_changes,
    previousHash: records[2].currentHash,
    currentHash: b3_hash,
    signature: 'SIG_SHA256_' + b3_hash.substring(0, 16).toUpperCase(),
  });

  // Block #4: Science Practical Marks Correction
  const b4_time = '2026-10-11T11:05:12.000Z';
  const b4_changes: AuditFieldDiff[] = [
    { field: 'practicalMarks', fieldLabel: 'Science Physics Lab Marks', oldValue: '22 / 30', newValue: '28 / 30', changeType: 'MODIFIED' },
  ];
  const b4_hash = computeAuditRecordHash(
    4,
    b4_time,
    'tenant-krypton-01',
    'usr-teacher-05',
    'GRADE',
    'GRD-SCI-10A-102',
    'MARKS_REVALUATION',
    b4_changes,
    'Clerical transcription error corrected after cross-checking lab record sheet signed by external examiner.',
    records[3].currentHash,
  );

  records.push({
    id: 'AUD-2026-0005',
    sequence: 4,
    timestamp: b4_time,
    tenantId: 'tenant-krypton-01',
    entityType: 'GRADE',
    entityId: 'GRD-SCI-10A-102',
    entityName: 'Class 10A Science Practical - Ananya Sharma (Adm #KPS-2024-102)',
    action: 'MARKS_REVALUATION',
    performedBy: {
      userId: 'usr-teacher-05',
      fullName: 'Radhakrishnan Nair',
      role: 'SENIOR_SCIENCE_FACULTY',
      email: 'radhakrishnan.sci@kryptonschool.edu.in',
      ipAddress: '192.168.1.33',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0',
    },
    reason: 'Clerical transcription error corrected after cross-checking lab record sheet signed by external examiner.',
    approvalRef: 'LAB-REVAL-88',
    changes: b4_changes,
    previousHash: records[3].currentHash,
    currentHash: b4_hash,
    signature: 'SIG_SHA256_' + b4_hash.substring(0, 16).toUpperCase(),
  });

  // Block #5: Payment Voided
  const b5_time = '2026-10-11T15:20:01.000Z';
  const b5_changes: AuditFieldDiff[] = [
    { field: 'status', fieldLabel: 'Receipt Status', oldValue: 'ISSUED', newValue: 'VOIDED', changeType: 'MODIFIED' },
    { field: 'amount', fieldLabel: 'Receipt Value', oldValue: '₹ 18,500', newValue: '₹ 0 (Voided)', changeType: 'MODIFIED' },
  ];
  const b5_hash = computeAuditRecordHash(
    5,
    b5_time,
    'tenant-krypton-01',
    'usr-acct-01',
    'FEE_PAYMENT',
    'REC-2026-7714',
    'PAYMENT_VOIDED',
    b5_changes,
    'Duplicate cash receipt punched accidentally by junior cashier for parent with dual payment. Original receipt #REC-7712 stands.',
    records[4].currentHash,
  );

  records.push({
    id: 'AUD-2026-0006',
    sequence: 5,
    timestamp: b5_time,
    tenantId: 'tenant-krypton-01',
    entityType: 'FEE_PAYMENT',
    entityId: 'REC-2026-7714',
    entityName: 'Fee Payment Receipt #REC-7714 - Mohammed Zayan (Adm #KPS-2024-103)',
    action: 'PAYMENT_VOIDED',
    performedBy: {
      userId: 'usr-acct-01',
      fullName: 'Thomas Varghese',
      role: 'CHIEF_ACCOUNTANT',
      email: 'accounts@kryptonschool.edu.in',
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/127.0',
    },
    reason: 'Duplicate cash receipt punched accidentally by junior cashier for parent with dual payment. Original receipt #REC-7712 stands.',
    approvalRef: 'AUD-VOID-12',
    changes: b5_changes,
    previousHash: records[4].currentHash,
    currentHash: b5_hash,
    signature: 'SIG_SHA256_' + b5_hash.substring(0, 16).toUpperCase(),
  });

  return records;
})();

// Export Templates Definitions
export const BOARD_EXPORT_TEMPLATES: BoardExportTemplate[] = [
  {
    id: 'CBSE_OASIS_LOC',
    board: 'CBSE',
    title: 'CBSE OASIS & LOC Candidate Enrollment Register',
    titleMl: 'സിബിഎസ്ഇ OASIS & LOC വിദ്യാർത്ഥി എൻറോൾമെന്റ് ഫോർമാറ്റ്',
    description: 'Pre-formatted CBSE Board List of Candidates (LOC) with 5 subject codes, CWSN status, Aadhaar, Mother/Father names, and DOB.',
    descriptionMl: 'CBSE പോർട്ടലിന്റെ കൃത്യമായ മാതൃകയിലുള്ള വിഷയ കോഡുകളും വിശദാംശങ്ങളും അടങ്ങിയ LOC രജിസ്റ്റർ.',
    portalName: 'CBSE Pariksha Sangam / OASIS Portal',
    fileExtension: 'xlsx',
    recordCount: 248,
    lastExportedAt: '2026-10-10 16:30',
    complianceScore: 99.2,
    validationIssuesCount: {
      errors: 0,
      warnings: 2,
    },
    requiredFields: ['Candidate Name', 'Mother Name', 'Father Name', 'DOB', 'Aadhaar', 'Category', 'Sub1', 'Sub2', 'Sub3', 'Sub4', 'Sub5'],
  },
  {
    id: 'STATE_BOARD_ANNUAL_RETURN',
    board: 'STATE_BOARD',
    title: 'State Board / Kerala Education Dept. Annual Return',
    titleMl: 'സംസ്ഥാന വിദ്യാഭ്യാസ വകുപ്പ് വാർഷിക റിട്ടേൺ (സമ്പൂർണ്ണ / DPI മാതൃക)',
    description: 'Official Sampoorna / State Board student master format with bilingual names (English + Malayalam), Taluk, Caste & Attendance percentage.',
    descriptionMl: 'കേരള സംസ്ഥാന വിദ്യാഭ്യാസ വകുപ്പിന്റെ സമ്പൂർണ്ണ പോർട്ടൽ മാനദണ്ഡപ്രകാരമുള്ള പൂർണ്ണ ഡാറ്റാ ഫോർമാറ്റ്.',
    portalName: 'Sampoorna / State Directorate of Education',
    fileExtension: 'csv',
    recordCount: 840,
    lastExportedAt: '2026-10-09 11:15',
    complianceScore: 100.0,
    validationIssuesCount: {
      errors: 0,
      warnings: 0,
    },
    requiredFields: ['Adm No', 'Student Name (Eng)', 'Student Name (Mal)', 'DOB', 'Medium', 'Religion', 'Caste', 'Attendance %'],
  },
  {
    id: 'UDISE_PLUS_SDMIS',
    board: 'UDISE_PLUS',
    title: 'UDISE+ SDMIS Student Profile & Data Capture (DCF)',
    titleMl: 'UDISE+ SDMIS സ്റ്റുഡന്റ് ഡാറ്റാ ക്യാപ്ചർ ഫോർമാറ്റ്',
    description: 'Ministry of Education Government of India UDISE+ standard format with PEN (Permanent Education Number), BPL/EWS, Bank IFSC, and CWSN facilities.',
    descriptionMl: 'കേന്ദ്ര വിദ്യാഭ്യാസ മന്ത്രാലയത്തിന്റെ UDISE+ പോർട്ടലിലേക്ക് അപ്‌ലോഡ് ചെയ്യേണ്ട ഔദ്യോഗിക ഫോർമാറ്റ്.',
    portalName: 'UDISE+ Portal (udiseplus.gov.in)',
    fileExtension: 'xlsx',
    recordCount: 840,
    lastExportedAt: '2026-10-08 17:40',
    complianceScore: 98.6,
    validationIssuesCount: {
      errors: 1,
      warnings: 3,
    },
    requiredFields: ['PEN', 'Aadhaar', 'Student Name', 'Social Category', 'Minority', 'BPL', 'CWSN', 'Height', 'Weight', 'Bank IFSC'],
  },
  {
    id: 'ICSE_COUNCIL_RETURN',
    board: 'ICSE',
    title: 'CISCE (ICSE / ISC) Candidate Entry Return',
    titleMl: 'CISCE (ICSE / ISC) പരീക്ഷാ എൻട്രി റിട്ടേൺ',
    description: 'CISCE Council standard candidate registration format with UID numbers, internal assessment grades, and SUPW completion status.',
    descriptionMl: 'CISCE കൗൺസിൽ മാനദണ്ഡപ്രകാരമുള്ള വിദ്യാർത്ഥി രജിസ്ട്രേഷൻ റിപ്പോർട്ട്.',
    portalName: 'CISCE CAREERS Portal',
    fileExtension: 'xlsx',
    recordCount: 185,
    lastExportedAt: '2026-10-08 11:10',
    complianceScore: 99.4,
    validationIssuesCount: {
      errors: 0,
      warnings: 1,
    },
    requiredFields: ['UID', 'Adm No', 'Candidate Name', 'DOB', 'Subject Group', 'SUPW Grade', 'Attendance %'],
  },
  {
    id: 'APAAR_PEN_REGISTRY',
    board: 'APAAR',
    title: 'APAAR ID & UDISE+ PEN Master Registry',
    titleMl: 'APAAR ഐഡി & UDISE+ PEN മാസ്റ്റർ രജിസ്ട്രി',
    description: 'Automated Permanent Academic Account Registry (APAAR / One Nation One Student ID) verification sheet with Aadhaar consent & PEN mapping.',
    descriptionMl: 'ദേശീയ APAAR ഐഡി, UDISE+ PEN മാപ്പിംഗ് എന്നിവ ഉൾക്കൊള്ളുന്ന ഔദ്യോഗിക രജിസ്ട്രി.',
    portalName: 'APAAR / Academic Bank of Credits Portal',
    fileExtension: 'csv',
    recordCount: 840,
    lastExportedAt: '2026-10-07 09:20',
    complianceScore: 98.4,
    validationIssuesCount: {
      errors: 1,
      warnings: 2,
    },
    requiredFields: ['APAAR ID', 'UDISE+ PEN', 'Adm No', 'Full Name', 'Gender', 'DOB', 'Aadhaar Last 4', 'Class', 'Parent Phone'],
  },
  {
    id: 'TEACHER_MANDATORY_DISCLOSURE',
    board: 'CBSE',
    title: 'Faculty Mandatory Public Disclosure & Teacher Profile',
    titleMl: 'അധ്യാപക ഫാക്കൽറ്റി മാൻഡേറ്ററി പബ്ലിക് ഡിസ്‌ക്ലോഷർ',
    description: 'CBSE Section-B mandatory staff disclosure: OASIS ID, Teacher registration, qualifications, subject specialization, and teaching experience.',
    descriptionMl: 'സ്കൂൾ അക്രഡിറ്റേഷന് ആവശ്യമായ അധ്യാപക യോഗ്യതകളും രജിസ്ട്രേഷൻ വിവരങ്ങളും അടങ്ങിയ റിപ്പോർട്ട്.',
    portalName: 'CBSE Affiliation / School Website Public Disclosure',
    fileExtension: 'xlsx',
    recordCount: 52,
    lastExportedAt: '2026-10-05 14:00',
    complianceScore: 100.0,
    validationIssuesCount: {
      errors: 0,
      warnings: 0,
    },
    requiredFields: ['Staff ID', 'Teacher Name', 'Designation', 'OASIS ID', 'Qualifications', 'Experience Years', 'Subjects Taught'],
  },
  {
    id: 'EXAM_BOARD_REGISTER',
    board: 'CBSE',
    title: 'Official Term Assessment & Mark Moderation Register',
    titleMl: 'ടേം പരീക്ഷാ മാർക്ക് മോഡറേഷൻ ബോർഡ് രജിസ്റ്റർ',
    description: 'Tamper-verified board mark register with internal assessments, theory, practical marks, and cryptographically verified seal.',
    descriptionMl: 'ഇന്റേണൽ, തിയറി, പ്രാക്ടിക്കൽ മാർക്കുകൾ അടങ്ങിയ ബോർഡ് അംഗീകൃത മാർക്ക് രജിസ്റ്റർ.',
    portalName: 'Board Examination Confidential Portal',
    fileExtension: 'xlsx',
    recordCount: 248,
    lastExportedAt: '2026-10-11 12:00',
    complianceScore: 100.0,
    validationIssuesCount: {
      errors: 0,
      warnings: 0,
    },
    requiredFields: ['Roll No', 'Adm No', 'Student Name', 'Theory Marks', 'Practical Marks', 'Internal Assessment', 'Total', 'Board Grade'],
  },
];

// Sample Student Data for Board Exports
export interface StudentBoardRecord {
  admNo: string;
  rollNo: string;
  name: string;
  nameMl: string;
  gender: 'M' | 'F';
  dob: string;
  fatherName: string;
  motherName: string;
  aadhaar: string;
  penUdise: string;
  apaarId: string;
  category: 'GEN' | 'OBC' | 'SC' | 'ST';
  religion: string;
  class: string;
  section: string;
  subjects: string;
  attendancePct: number;
  feeCleared: boolean;
  bpl: boolean;
  cwsn: boolean;
  bankAccount: string;
  bankIfsc: string;
}

export const SAMPLE_BOARD_STUDENTS: StudentBoardRecord[] = [
  {
    admNo: 'KPS-2024-101',
    rollNo: '1001',
    name: 'Aarav Patel',
    nameMl: 'ആരവ് പട്ടേൽ',
    gender: 'M',
    dob: '12/04/2010',
    fatherName: 'Vikram Patel',
    motherName: 'Meera Patel',
    aadhaar: '4512-8821-9034',
    penUdise: 'PEN2026101901',
    apaarId: '982100441101',
    category: 'GEN',
    religion: 'Hindu',
    class: 'Class 10',
    section: 'A',
    subjects: '041-MATH, 086-SCI, 085-HIN, 184-ENG, 087-SOC',
    attendancePct: 96.5,
    feeCleared: true,
    bpl: false,
    cwsn: false,
    bankAccount: '91823746192',
    bankIfsc: 'SBIN0004510',
  },
  {
    admNo: 'KPS-2024-102',
    rollNo: '1002',
    name: 'Ananya Sharma',
    nameMl: 'അനന്യ ശർമ്മ',
    gender: 'F',
    dob: '23/08/2010',
    fatherName: 'Ramesh Sharma',
    motherName: 'Sunita Sharma',
    aadhaar: '7712-4412-1088',
    penUdise: 'PEN2026101902',
    apaarId: '982100441102',
    category: 'GEN',
    religion: 'Hindu',
    class: 'Class 10',
    section: 'A',
    subjects: '041-MATH, 086-SCI, 085-HIN, 184-ENG, 087-SOC',
    attendancePct: 94.2,
    feeCleared: false, // Flagged for test
    bpl: false,
    cwsn: false,
    bankAccount: '10293847561',
    bankIfsc: 'SBIN0004510',
  },
  {
    admNo: 'KPS-2024-103',
    rollNo: '1003',
    name: 'Mohammed Zayan',
    nameMl: 'മുഹമ്മദ് സയാൻ',
    gender: 'M',
    dob: '05/11/2009',
    fatherName: 'Abdul Salam',
    motherName: 'Fathima Beevi',
    aadhaar: '3310-9941-7622',
    penUdise: 'PEN2026101903',
    apaarId: '982100441103',
    category: 'OBC',
    religion: 'Muslim',
    class: 'Class 10',
    section: 'A',
    subjects: '041-MATH, 086-SCI, 085-HIN, 184-ENG, 087-SOC',
    attendancePct: 98.1,
    feeCleared: true,
    bpl: false,
    cwsn: false,
    bankAccount: '55667788991',
    bankIfsc: 'HDFC0001244',
  },
  {
    admNo: 'KPS-2024-104',
    rollNo: '1004',
    name: 'Diya Mary Joseph',
    nameMl: 'ദിയ മേരി ജോസഫ്',
    gender: 'F',
    dob: '17/02/2010',
    fatherName: 'Joseph Mathew',
    motherName: 'Mary Joseph',
    aadhaar: '8821-6543-2190',
    penUdise: 'PEN2026101904',
    apaarId: '982100441104',
    category: 'GEN',
    religion: 'Christian',
    class: 'Class 10',
    section: 'B',
    subjects: '041-MATH, 086-SCI, 085-HIN, 184-ENG, 087-SOC',
    attendancePct: 95.8,
    feeCleared: true,
    bpl: false,
    cwsn: false,
    bankAccount: '77665544332',
    bankIfsc: 'FDRL0001050',
  },
  {
    admNo: 'KPS-2024-105',
    rollNo: '1005',
    name: 'Siddharth Nair',
    nameMl: 'സിദ്ധാർത്ഥ് നായർ',
    gender: 'M',
    dob: '30/09/2010',
    fatherName: 'Gopinathan Nair',
    motherName: 'Radhika Nair',
    aadhaar: '1290-7761-4455',
    penUdise: 'PEN2026101905',
    apaarId: '982100441105',
    category: 'GEN',
    religion: 'Hindu',
    class: 'Class 10',
    section: 'B',
    subjects: '041-MATH, 086-SCI, 085-HIN, 184-ENG, 087-SOC',
    attendancePct: 92.4,
    feeCleared: true,
    bpl: false,
    cwsn: false,
    bankAccount: '88991122334',
    bankIfsc: 'SBIN0004510',
  },
  {
    admNo: 'KPS-2024-106',
    rollNo: '1006',
    name: 'Devika Krishnan',
    nameMl: 'ദേവിക കൃഷ്ണൻ',
    gender: 'F',
    dob: '14/06/2010',
    fatherName: 'Krishnakumar S.',
    motherName: 'Lakshmi Krishnan',
    aadhaar: '6655-4433-2211',
    penUdise: 'PEN2026101906',
    apaarId: '982100441106',
    category: 'OBC',
    religion: 'Hindu',
    class: 'Class 10',
    section: 'B',
    subjects: '041-MATH, 086-SCI, 085-HIN, 184-ENG, 087-SOC',
    attendancePct: 97.0,
    feeCleared: true,
    bpl: true,
    cwsn: false,
    bankAccount: '99887766551',
    bankIfsc: 'CNRB0002010',
  },
];

// Sample Teacher Public Disclosure Records
export const SAMPLE_BOARD_TEACHERS = [
  {
    staffId: 'STF-01',
    name: 'Dr. K. R. Nambiar',
    nameMl: 'ഡോ. കെ. ആർ. നമ്പ്യാർ',
    oasisId: 'OASIS-TCH-001',
    designation: 'Principal & Senior Academic Director',
    qualification: 'M.Sc. Physics, M.Ed., Ph.D.',
    experienceYears: 24,
    subjects: 'Physics, Academic Administration',
    appointmentDate: '01/06/2015',
    trainedByBoard: 'Yes (CBSE Leadership Cohort)',
  },
  {
    staffId: 'STF-02',
    name: 'Radhakrishnan Nair',
    nameMl: 'രാധാകൃഷ്ണൻ നായർ',
    oasisId: 'OASIS-TCH-002',
    designation: 'PGT Senior Science',
    qualification: 'M.Sc. Chemistry, B.Ed.',
    experienceYears: 16,
    subjects: 'Chemistry, General Science',
    appointmentDate: '01/06/2018',
    trainedByBoard: 'Yes (NEP 2020 Pedagogical Training)',
  },
  {
    staffId: 'STF-03',
    name: 'Anjali Kurup',
    nameMl: 'അഞ്ജലി കുറുപ്പ്',
    oasisId: 'OASIS-TCH-003',
    designation: 'TGT Mathematics',
    qualification: 'M.Sc. Mathematics, B.Ed.',
    experienceYears: 11,
    subjects: 'Standard Mathematics, Applied Math',
    appointmentDate: '10/06/2020',
    trainedByBoard: 'Yes (Experiential Learning Workshop)',
  },
  {
    staffId: 'STF-04',
    name: 'Geetha Varma',
    nameMl: 'ഗീത വർമ്മ',
    oasisId: 'OASIS-TCH-004',
    designation: 'TGT Social Sciences',
    qualification: 'M.A. History, B.Ed.',
    experienceYears: 14,
    subjects: 'History, Civics, Geography',
    appointmentDate: '01/06/2019',
    trainedByBoard: 'Yes (CBSE Inclusive Education)',
  },
  {
    staffId: 'STF-05',
    name: 'Mathew Philip',
    nameMl: 'മാത്യു ഫിലിപ്പ്',
    oasisId: 'OASIS-TCH-005',
    designation: 'TGT English Literature',
    qualification: 'M.A. English, B.Ed., CELTA',
    experienceYears: 9,
    subjects: 'English Language & Literature',
    appointmentDate: '15/07/2021',
    trainedByBoard: 'Yes (Competency-Based Assessment)',
  },
];

// Validation Issues Mock Data
export const SAMPLE_VALIDATION_ISSUES: Record<ExportTemplateType, ComplianceValidationIssue[]> = {
  CBSE_OASIS_LOC: [
    {
      id: 'val-cbse-01',
      studentId: 'KPS-2024-102',
      studentName: 'Ananya Sharma',
      field: 'Annual Fee Status',
      issue: 'Fee status marked as OVERDUE for Term-2, may require board exam fee waiver clearance note.',
      severity: 'WARNING',
      suggestedFix: 'Confirm clearance certificate or principal waiver before final LOC submission.',
    },
    {
      id: 'val-cbse-02',
      studentId: 'KPS-2024-105',
      studentName: 'Siddharth Nair',
      field: 'Attendance Percentage',
      issue: 'Attendance is 92.4% (Board mandate is min 75%, eligible but nearing condonation margin).',
      severity: 'WARNING',
      suggestedFix: 'Upload medical condonation certificate if overall attendance falls below 85%.',
    },
  ],
  STATE_BOARD_ANNUAL_RETURN: [],
  UDISE_PLUS_SDMIS: [
    {
      id: 'val-udise-01',
      studentId: 'KPS-2024-106',
      studentName: 'Devika Krishnan',
      field: 'BPL Ration Card Number',
      issue: 'BPL beneficiary marked as True but Ration Card / Unique Food Security Number missing.',
      severity: 'ERROR',
      suggestedFix: 'Enter valid BPL ration card number or change BPL indicator to False.',
    },
    {
      id: 'val-udise-02',
      studentId: 'KPS-2024-103',
      studentName: 'Mohammed Zayan',
      field: 'Student Height / Weight',
      issue: 'Annual medical screening measurements not updated for Academic Year 2026-27.',
      severity: 'WARNING',
      suggestedFix: 'Update height (cm) and weight (kg) from school clinic health record.',
    },
    {
      id: 'val-udise-03',
      studentId: 'KPS-2024-101',
      studentName: 'Aarav Patel',
      field: 'Bank Account IFSC',
      issue: 'Bank account number entered without confirming Active status.',
      severity: 'WARNING',
      suggestedFix: 'Re-verify bank passbook front copy for government DBT scholarship credit.',
    },
  ],
  APAAR_PEN_REGISTRY: [
    {
      id: 'val-apaar-01',
      studentId: 'KPS-2024-105',
      studentName: 'Siddharth Nair',
      field: 'APAAR ID Consent',
      issue: 'Signed parental Aadhaar consent form pending upload for APAAR / ABC ID generation.',
      severity: 'ERROR',
      suggestedFix: 'Collect parent-signed APAAR consent slip and trigger UDISE+ PEN validation.',
    },
    {
      id: 'val-apaar-02',
      studentId: 'KPS-2024-104',
      studentName: 'Diya Mary Joseph',
      field: 'Emergency Guardian Contact',
      issue: 'Primary phone lacks Indian country code format (+91).',
      severity: 'WARNING',
      suggestedFix: 'Format telephone number with +91 dial code prefix.',
    },
    {
      id: 'val-apaar-03',
      studentId: 'KPS-2024-106',
      studentName: 'Devika Krishnan',
      field: 'Special Needs Assessment',
      issue: 'CWSN indicator marked without annual medical screening date.',
      severity: 'WARNING',
      suggestedFix: 'Complete teacher annual observation checklist before UDISE+ sync.',
    },
  ],
  ICSE_COUNCIL_RETURN: [],
  TEACHER_MANDATORY_DISCLOSURE: [],
  EXAM_BOARD_REGISTER: [],
};

// Generate Portal-Exact CSV string
export function generatePortalCsv(templateId: ExportTemplateType): string {
  if (templateId === 'TEACHER_MANDATORY_DISCLOSURE') {
    const headers = [
      'Sl No',
      'Staff ID',
      'Teacher Name',
      'Teacher Name (Malayalam)',
      'OASIS Registration ID',
      'Designation',
      'Highest Qualification',
      'Experience (Years)',
      'Subjects Taught',
      'Date of Appointment',
      'CBSE / Board Training Certified',
    ];
    const rows = SAMPLE_BOARD_TEACHERS.map((t, idx) => [
      idx + 1,
      `"${t.staffId}"`,
      `"${t.name}"`,
      `"${t.nameMl}"`,
      `"${t.oasisId}"`,
      `"${t.designation}"`,
      `"${t.qualification}"`,
      t.experienceYears,
      `"${t.subjects}"`,
      `"${t.appointmentDate}"`,
      `"${t.trainedByBoard}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  if (templateId === 'STATE_BOARD_ANNUAL_RETURN') {
    const headers = [
      'Sl_No',
      'Admission_No',
      'Roll_No',
      'Student_Name_English',
      'Student_Name_Malayalam',
      'Gender',
      'DOB',
      'Father_Name',
      'Mother_Name',
      'Medium_Of_Instruction',
      'Religion',
      'Caste_Category',
      'Current_Class',
      'Section',
      'Annual_Attendance_Pct',
      'Board_Eligibility_Status',
    ];
    const rows = SAMPLE_BOARD_STUDENTS.map((s, idx) => [
      idx + 1,
      `"${s.admNo}"`,
      `"${s.rollNo}"`,
      `"${s.name}"`,
      `"${s.nameMl}"`,
      s.gender,
      s.dob,
      `"${s.fatherName}"`,
      `"${s.motherName}"`,
      '"English"',
      `"${s.religion}"`,
      s.category,
      `"${s.class}"`,
      s.section,
      s.attendancePct + '%',
      '"ELIGIBLE"',
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  if (templateId === 'UDISE_PLUS_SDMIS') {
    const headers = [
      'UDISE_PEN',
      'Student_Aadhaar',
      'Candidate_Name',
      'Candidate_Name_Malayalam',
      'Gender',
      'DOB_DDMMYYYY',
      'Mother_Name',
      'Father_Name',
      'Social_Category_Code',
      'Minority_Group',
      'BPL_Beneficiary',
      'CWSN_Status',
      'Class',
      'Section',
      'Bank_Account_Number',
      'Bank_IFSC_Code',
      'Annual_Attendance_Days',
      'Facilities_Received',
    ];
    const rows = SAMPLE_BOARD_STUDENTS.map((s) => [
      `"${s.penUdise}"`,
      `"${s.aadhaar}"`,
      `"${s.name}"`,
      `"${s.nameMl}"`,
      s.gender,
      s.dob,
      `"${s.motherName}"`,
      `"${s.fatherName}"`,
      s.category,
      s.religion === 'Muslim' || s.religion === 'Christian' ? 'YES' : 'NO',
      s.bpl ? 'YES' : 'NO',
      s.cwsn ? 'YES' : 'NO',
      `"${s.class}"`,
      s.section,
      `"${s.bankAccount}"`,
      `"${s.bankIfsc}"`,
      Math.round((s.attendancePct / 100) * 220),
      '"Free Textbooks, Free Uniform, Midday Meal"',
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  if (templateId === 'APAAR_PEN_REGISTRY') {
    const headers = [
      'APAAR_ID',
      'UDISE_PEN',
      'Admission_Number',
      'Student_Full_Name',
      'Gender',
      'Date_Of_Birth',
      'Class_Grade',
      'Section',
      'Aadhaar_Masked',
      'Father_Name',
      'Mother_Name',
      'CWSN_Status',
      'Fee_Status',
      'State_District_Code',
    ];
    const rows = SAMPLE_BOARD_STUDENTS.map((s) => [
      `"${s.apaarId}"`,
      `"${s.penUdise}"`,
      `"${s.admNo}"`,
      `"${s.name}"`,
      s.gender,
      s.dob,
      `"${s.class}"`,
      s.section,
      `"XXXX-XXXX-${s.aadhaar.slice(-4)}"`,
      `"${s.fatherName}"`,
      `"${s.motherName}"`,
      s.cwsn ? 'YES' : 'NONE',
      s.feeCleared ? 'CLEARED' : 'PENDING',
      '"IN-KL-07"',
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  // Default CBSE OASIS / LOC Candidate Enrollment Register
  const headers = [
    'Board_Reg_No',
    'Candidate_Roll_No',
    'Admission_No',
    'Candidate_Name',
    'Mother_Name',
    'Father_Name',
    'Gender',
    'Category',
    'CWSN_Status',
    'DOB_DDMMYYYY',
    'Aadhaar_Number',
    'Sub1_Lang1_184',
    'Sub2_Lang2_085',
    'Sub3_Math_041',
    'Sub4_Sci_086',
    'Sub5_Soc_087',
    'Annual_Attendance_Pct',
    'Fee_Cleared_Status',
  ];
  const rows = SAMPLE_BOARD_STUDENTS.map((s) => [
    `"CBSE/REG/2026/${s.rollNo}"`,
    s.rollNo,
    `"${s.admNo}"`,
    `"${s.name}"`,
    `"${s.motherName}"`,
    `"${s.fatherName}"`,
    s.gender,
    s.category,
    s.cwsn ? 'YES' : 'NONE',
    s.dob,
    `"${s.aadhaar}"`,
    '"184 - English Lang & Lit"',
    '"085 - Hindi Course B"',
    '"041 - Mathematics Standard"',
    '"086 - Science Theory & Practical"',
    '"087 - Social Science"',
    s.attendancePct + '%',
    s.feeCleared ? 'YES' : 'NO',
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// Generate Excel-compatible XML Spreadsheet (native .xlsx-readable XML)
export function generatePortalExcelXml(templateId: ExportTemplateType, templateTitle: string): string {
  const csvContent = generatePortalCsv(templateId);
  const lines = csvContent.split('\r\n').filter(Boolean);
  if (lines.length === 0) return '';

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let insideQuotes = false;
    let current = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headerCells = parseCsvLine(lines[0]);
  const dataRows = lines.slice(1).map(parseCsvLine);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${templateTitle}</Title>
  <Author>Krypton School ERP - Govt Compliance Engine</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:FontName="Calibri" ss:Size="11"/>
   <Interior ss:Color="#4338CA" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E1B4B"/>
   </Borders>
  </Style>
  <Style ss:ID="Data">
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataAlt">
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Board_Export_Data">
  <Table>
`;

  // Write header row
  xml += '   <Row ss:Height="26">\n';
  for (const h of headerCells) {
    xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`;
  }
  xml += '   </Row>\n';

  // Write data rows
  dataRows.forEach((row, rIdx) => {
    const styleId = rIdx % 2 === 0 ? 'Data' : 'DataAlt';
    xml += '   <Row ss:Height="20">\n';
    for (const val of row) {
      const isNum = !isNaN(Number(val)) && val.trim() !== '';
      const type = isNum ? 'Number' : 'String';
      xml += `    <Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXml(val)}</Data></Cell>\n`;
    }
    xml += '   </Row>\n';
  });

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Download Trigger Helper
export function triggerBrowserDownload(content: string, filename: string, mimeType: string) {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Client Class for Govt Compliance & Tamper-Proof Audit
export class GovtComplianceEngineClient {
  private auditChain: TamperProofAuditRecord[] = [...INITIAL_AUDIT_BLOCKS];

  // Retrieve current stats
  getStats(): GovtComplianceStats {
    const pendingErrors = Object.values(SAMPLE_VALIDATION_ISSUES).reduce(
      (acc, issues) => acc + issues.filter((i) => i.severity === 'ERROR').length,
      0,
    );
    const pendingWarnings = Object.values(SAMPLE_VALIDATION_ISSUES).reduce(
      (acc, issues) => acc + issues.filter((i) => i.severity === 'WARNING').length,
      0,
    );

    return {
      totalStudentsEnrolled: 840,
      boardRegisteredCount: 248,
      complianceRate: 98.6,
      totalAuditRecords: this.auditChain.length,
      auditChainIntegrity: this.verifyChainIntegrity().isValid ? 'SECURE' : 'COMPROMISED',
      lastIntegrityCheck: new Date().toISOString(),
      pendingValidationErrors: pendingErrors,
      pendingValidationWarnings: pendingWarnings,
    };
  }

  // Get templates
  getTemplates(): BoardExportTemplate[] {
    return BOARD_EXPORT_TEMPLATES;
  }

  // Get validation issues for a template
  getValidationIssues(templateId: ExportTemplateType): ComplianceValidationIssue[] {
    return SAMPLE_VALIDATION_ISSUES[templateId] || [];
  }

  // 1-Click Export Execution
  exportPortalData(templateId: ExportTemplateType, format: 'xlsx' | 'csv'): { filename: string; recordCount: number } {
    const template = BOARD_EXPORT_TEMPLATES.find((t) => t.id === templateId);
    const title = template?.title || templateId;
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csv = generatePortalCsv(templateId);
      const filename = `${templateId}_Export_${dateStr}.csv`;
      triggerBrowserDownload('\uFEFF' + csv, filename, 'text/csv;charset=utf-8;');
      return { filename, recordCount: template?.recordCount || 248 };
    } else {
      const xml = generatePortalExcelXml(templateId, title);
      const filename = `${templateId}_Export_${dateStr}.xlsx`;
      triggerBrowserDownload(xml, filename, 'application/vnd.ms-excel;charset=utf-8;');
      return { filename, recordCount: template?.recordCount || 248 };
    }
  }

  // Get Audit Trail Chain
  getAuditRecords(): TamperProofAuditRecord[] {
    return [...this.auditChain].sort((a, b) => b.sequence - a.sequence);
  }

  // Cryptographic Chain Integrity Verification
  verifyChainIntegrity(): AuditChainVerificationResult {
    const records = [...this.auditChain].sort((a, b) => a.sequence - b.sequence);
    let expectedPrevHash = GENESIS_PREV_HASH;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      // Check previous hash pointer
      if (record.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalBlocksVerified: i,
          genesisHash: records[0].currentHash,
          latestHash: records[records.length - 1].currentHash,
          brokenBlockSequence: record.sequence,
          brokenBlockId: record.id,
          tamperDetails: `Broken Hash Link at Block #${record.sequence} (${record.id}): Stored previousHash ${record.previousHash.substring(0, 10)}... does not match predecessor hash ${expectedPrevHash.substring(0, 10)}...!`,
          verifiedAt: new Date().toISOString(),
        };
      }

      // Check current hash recalculation
      const calculatedCurrentHash = computeAuditRecordHash(
        record.sequence,
        record.timestamp,
        record.tenantId,
        record.performedBy.userId,
        record.entityType,
        record.entityId,
        record.action,
        record.changes,
        record.reason,
        record.previousHash,
      );

      if (calculatedCurrentHash !== record.currentHash) {
        return {
          isValid: false,
          totalBlocksVerified: i,
          genesisHash: records[0].currentHash,
          latestHash: records[records.length - 1].currentHash,
          brokenBlockSequence: record.sequence,
          brokenBlockId: record.id,
          tamperDetails: `Hash Tampering Detected at Block #${record.sequence} (${record.id}): Content has been manipulated! Expected hash ${calculatedCurrentHash.substring(0, 12)}... but found ${record.currentHash.substring(0, 12)}...!`,
          verifiedAt: new Date().toISOString(),
        };
      }

      expectedPrevHash = record.currentHash;
    }

    return {
      isValid: true,
      totalBlocksVerified: records.length,
      genesisHash: records[0].currentHash,
      latestHash: records[records.length - 1].currentHash,
      verifiedAt: new Date().toISOString(),
    };
  }

  // Append a controlled override to the blockchain audit log
  appendAuditRecord(params: {
    entityType: AuditEntityType;
    entityId: string;
    entityName: string;
    action: AuditAction;
    performedBy: {
      userId: string;
      fullName: string;
      role: string;
      email: string;
      ipAddress: string;
      userAgent: string;
    };
    reason: string;
    approvalRef?: string;
    changes: AuditFieldDiff[];
  }): TamperProofAuditRecord {
    const lastRecord = this.auditChain[this.auditChain.length - 1];
    const newSequence = lastRecord ? lastRecord.sequence + 1 : 0;
    const prevHash = lastRecord ? lastRecord.currentHash : GENESIS_PREV_HASH;
    const timestamp = new Date().toISOString();
    const id = `AUD-2026-${String(newSequence + 1).padStart(4, '0')}`;

    const currentHash = computeAuditRecordHash(
      newSequence,
      timestamp,
      'tenant-krypton-01',
      params.performedBy.userId,
      params.entityType,
      params.entityId,
      params.action,
      params.changes,
      params.reason,
      prevHash,
    );

    const newRecord: TamperProofAuditRecord = {
      id,
      sequence: newSequence,
      timestamp,
      tenantId: 'tenant-krypton-01',
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      action: params.action,
      performedBy: params.performedBy,
      reason: params.reason,
      approvalRef: params.approvalRef,
      changes: params.changes,
      previousHash: prevHash,
      currentHash,
      signature: 'SIG_SHA256_' + currentHash.substring(0, 16).toUpperCase(),
    };

    this.auditChain.push(newRecord);
    return newRecord;
  }

  // Simulate unauthorized tampering for demonstration purposes
  simulateTampering(blockSequence: number = 1): { tamperedBlockId: string; originalHash: string } {
    const targetBlock = this.auditChain.find((b) => b.sequence === blockSequence);
    if (!targetBlock) throw new Error('Target block not found');

    const originalHash = targetBlock.currentHash;

    // Unauthorized modification of data without cryptographic signature
    if (targetBlock.changes.length > 0) {
      targetBlock.changes[0].newValue = '99.9 (Tampered Directly in DB)';
    }
    targetBlock.reason = 'Unauthorized alteration injected for demonstration test!';
    targetBlock.isTampered = true;

    return {
      tamperedBlockId: targetBlock.id,
      originalHash,
    };
  }

  // Restore chain to pristine state
  restoreChain() {
    this.auditChain = [...INITIAL_AUDIT_BLOCKS];
  }
}

export const complianceClient = new GovtComplianceEngineClient();
