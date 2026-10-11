import {
  StudentCertificateProfile,
  TransferCertificateData,
  BonafideCertificateData,
  CharacterCertificateData,
  DigitalIDCardData,
  SchoolCertificateSettings,
  GeneratedCertificateRecord,
  BonafidePurpose,
  IDCardOrientation,
} from '@krypton/types';

export const DEFAULT_SCHOOL_SETTINGS: SchoolCertificateSettings = {
  schoolName: 'Krypton International Public School',
  schoolNameMl: 'ക്രിപ്റ്റൺ ഇന്റർനാഷണൽ പബ്ലിക് സ്കൂൾ',
  affiliationBoard: 'Affiliated to CBSE, New Delhi (Affiliation No: 930124 | School Code: 75432)',
  affiliationNumber: 'CBSE/AFF/930124',
  schoolCode: '75432',
  address: 'Green Valley Campus, Hill Palace Road, Tripunithura, Kochi, Kerala - 682301',
  addressMl: 'ഗ്രീൻ വാലി ക്യാമ്പസ്, ഹിൽ പാലസ് റോഡ്, തൃപ്പൂണിത്തുറ, കൊച്ചി, കേരളം - 682301',
  districtState: 'Ernakulam, Kerala, India',
  pincode: '682301',
  phone: '+91 484 2780123 / +91 98470 12345',
  email: 'principal@kryptonschool.edu.in',
  website: 'https://kryptonschool.edu.in',
  logoUrl: '/icons/school-crest.svg',
  principalName: 'Dr. K. R. Nambiar',
  principalTitle: 'Principal & Senior Academic Director',
  principalDegree: 'M.Sc., M.Ed., Ph.D.',
  digitalSignatureUrl: '/signatures/principal-signature.png',
  digitalSignatureHash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  verificationDomain: 'https://verify.kryptonschool.edu.in',
};

export const MOCK_CERTIFICATE_STUDENTS: StudentCertificateProfile[] = [
  {
    id: 'stu-001',
    admissionNumber: 'KPS-2024-101',
    rollNumber: '10-A-01',
    fullName: 'Aarav Patel',
    fullNameMl: 'ആരവ് പട്ടേൽ',
    gender: 'Male',
    dateOfBirth: '2010-04-12',
    dateOfBirthWords: 'Twelfth April Two Thousand Ten',
    fatherName: 'Vikram Patel',
    motherName: 'Meera Patel',
    nationality: 'Indian',
    religion: 'Hindu',
    casteCategory: 'General',
    dateOfAdmission: '2020-06-01',
    classAdmitted: 'Class 5',
    currentClass: 'Class 10',
    section: 'A',
    stream: 'Science & Mathematics',
    academicYear: '2026 - 2027',
    bloodGroup: 'O+ve',
    emergencyContact: '+91 98470 11111',
    guardianPhone: '+91 98470 11112',
    address: 'Flat 4B, Silver Heights, Civil Station Road, Kakkanad, Kochi',
    addressMl: 'ഫ്ലാറ്റ് 4B, സിൽവർ ഹൈറ്റ്സ്, കാക്കനാട്, കൊച്ചി',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    aadharNumber: 'XXXX-XXXX-4512',
    house: 'Sapphire (Blue)',
    busRoute: 'Route 12 - Kakkanad Express',
  },
  {
    id: 'stu-002',
    admissionNumber: 'KPS-2024-102',
    rollNumber: '10-A-02',
    fullName: 'Ananya Sharma',
    fullNameMl: 'അനന്യ ശർമ്മ',
    gender: 'Female',
    dateOfBirth: '2010-08-23',
    dateOfBirthWords: 'Twenty Third August Two Thousand Ten',
    fatherName: 'Ramesh Sharma',
    motherName: 'Sunita Sharma',
    nationality: 'Indian',
    religion: 'Hindu',
    casteCategory: 'General',
    dateOfAdmission: '2018-06-05',
    classAdmitted: 'Class 3',
    currentClass: 'Class 10',
    section: 'A',
    stream: 'Science & Mathematics',
    academicYear: '2026 - 2027',
    bloodGroup: 'B+ve',
    emergencyContact: '+91 98470 22222',
    guardianPhone: '+91 98470 22223',
    address: 'Villa 14, Palm Meadows, Infopark Expressway, Kochi',
    addressMl: 'വില്ല 14, പാം മെഡോസ്, ഇൻഫോപാർക്ക്, കൊച്ചി',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    aadharNumber: 'XXXX-XXXX-6781',
    house: 'Emerald (Green)',
    busRoute: 'Route 04 - Infopark Express',
  },
  {
    id: 'stu-003',
    admissionNumber: 'KPS-2024-103',
    rollNumber: '10-B-14',
    fullName: 'Malavika Nair',
    fullNameMl: 'മാളവിക നായർ',
    gender: 'Female',
    dateOfBirth: '2010-02-18',
    dateOfBirthWords: 'Eighteenth February Two Thousand Ten',
    fatherName: 'Gopinathan Nair',
    motherName: 'Radha G. Nair',
    nationality: 'Indian',
    religion: 'Hindu',
    casteCategory: 'General',
    dateOfAdmission: '2019-05-28',
    classAdmitted: 'Class 4',
    currentClass: 'Class 10',
    section: 'B',
    stream: 'Commerce & Economics',
    academicYear: '2026 - 2027',
    bloodGroup: 'A+ve',
    emergencyContact: '+91 98470 33333',
    guardianPhone: '+91 98470 33334',
    address: 'Nandanam, Near Hill Palace, Tripunithura, Kochi',
    addressMl: 'നന്ദനം, ഹിൽ പാലസ് സമീപം, തൃപ്പൂണിത്തുറ, കൊച്ചി',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    aadharNumber: 'XXXX-XXXX-8923',
    house: 'Ruby (Red)',
    busRoute: 'Route 01 - Tripunithura Circular',
  },
  {
    id: 'stu-004',
    admissionNumber: 'KPS-2024-104',
    rollNumber: '10-B-15',
    fullName: 'Devadath Krishnan',
    fullNameMl: 'ദേവദത്ത് കൃഷ്ണൻ',
    gender: 'Male',
    dateOfBirth: '2010-11-05',
    dateOfBirthWords: 'Fifth November Two Thousand Ten',
    fatherName: 'Unnikrishnan M.',
    motherName: 'Deepa Unnikrishnan',
    nationality: 'Indian',
    religion: 'Hindu',
    casteCategory: 'OBC',
    dateOfAdmission: '2021-06-10',
    classAdmitted: 'Class 6',
    currentClass: 'Class 10',
    section: 'B',
    stream: 'Commerce & Economics',
    academicYear: '2026 - 2027',
    bloodGroup: 'AB+ve',
    emergencyContact: '+91 98470 44444',
    guardianPhone: '+91 98470 44445',
    address: 'Shree Nilayam, 12th Cross, Panampilly Nagar, Kochi',
    addressMl: 'ശ്രീ നിലയം, പനമ്പിള്ളി നഗർ, കൊച്ചി',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    aadharNumber: 'XXXX-XXXX-3419',
    house: 'Topaz (Yellow)',
    busRoute: 'Route 08 - Panampilly Line',
  },
  {
    id: 'stu-005',
    admissionNumber: 'KPS-2024-105',
    rollNumber: '09-A-08',
    fullName: 'Rohan Matthew',
    fullNameMl: 'രോഹൻ മാത്യു',
    gender: 'Male',
    dateOfBirth: '2011-06-30',
    dateOfBirthWords: 'Thirtieth June Two Thousand Eleven',
    fatherName: 'Matthew Varghese',
    motherName: 'Susan Matthew',
    nationality: 'Indian',
    religion: 'Christian',
    casteCategory: 'General',
    dateOfAdmission: '2022-06-01',
    classAdmitted: 'Class 7',
    currentClass: 'Class 9',
    section: 'A',
    stream: 'General Secondary',
    academicYear: '2026 - 2027',
    bloodGroup: 'O-ve',
    emergencyContact: '+91 98470 55555',
    guardianPhone: '+91 98470 55556',
    address: 'Bethany Haven, Stadium Link Road, Kaloor, Kochi',
    addressMl: 'ബഥനി ഹാവൻ, കലൂർ, കൊച്ചി',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    aadharNumber: 'XXXX-XXXX-9812',
    house: 'Emerald (Green)',
    busRoute: 'Route 05 - Kaloor Link',
  },
  {
    id: 'stu-006',
    admissionNumber: 'KPS-2024-106',
    rollNumber: '09-B-12',
    fullName: 'Fatima Zahra',
    fullNameMl: 'ഫാത്തിമ സഹ്റ',
    gender: 'Female',
    dateOfBirth: '2011-03-14',
    dateOfBirthWords: 'Fourteenth March Two Thousand Eleven',
    fatherName: 'Abdul Kareem',
    motherName: 'Amina Kareem',
    nationality: 'Indian',
    religion: 'Islam',
    casteCategory: 'OBC',
    dateOfAdmission: '2020-06-15',
    classAdmitted: 'Class 5',
    currentClass: 'Class 9',
    section: 'B',
    stream: 'General Secondary',
    academicYear: '2026 - 2027',
    bloodGroup: 'B+ve',
    emergencyContact: '+91 98470 66666',
    guardianPhone: '+91 98470 66667',
    address: 'Al-Madina House, Marine Drive Waterfront, Kochi',
    addressMl: 'അൽ മദീന ഹൗസ്, മറൈൻ ഡ്രൈവ്, കൊച്ചി',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    aadharNumber: 'XXXX-XXXX-7654',
    house: 'Sapphire (Blue)',
    busRoute: 'Route 02 - Marine Drive Line',
  },
];

// In-memory record store
let issuedRecords: GeneratedCertificateRecord[] = [
  {
    id: 'rec-tc-101',
    certificateType: 'TRANSFER_CERTIFICATE',
    referenceNumber: 'TC/2026/048',
    studentId: 'stu-003',
    studentName: 'Malavika Nair',
    admissionNumber: 'KPS-2024-103',
    className: 'Class 10 (Section B)',
    issueDate: '2026-04-10',
    issuedBy: 'Dr. K. R. Nambiar (Principal)',
    status: 'ISSUED',
    verificationHash: 'TC-KPS-2024-103-8F3D1A',
    payload: {},
  },
  {
    id: 'rec-bf-102',
    certificateType: 'BONAFIDE_CERTIFICATE',
    referenceNumber: 'BON/2026/112',
    studentId: 'stu-001',
    studentName: 'Aarav Patel',
    admissionNumber: 'KPS-2024-101',
    className: 'Class 10 (Section A)',
    issueDate: '2026-04-08',
    issuedBy: 'Dr. K. R. Nambiar (Principal)',
    status: 'ISSUED',
    verificationHash: 'BON-KPS-2024-101-72C9E4',
    payload: {},
  },
  {
    id: 'rec-ch-103',
    certificateType: 'CHARACTER_CERTIFICATE',
    referenceNumber: 'CHR/2026/089',
    studentId: 'stu-002',
    studentName: 'Ananya Sharma',
    admissionNumber: 'KPS-2024-102',
    className: 'Class 10 (Section A)',
    issueDate: '2026-04-05',
    issuedBy: 'Dr. K. R. Nambiar (Principal)',
    status: 'ISSUED',
    verificationHash: 'CHR-KPS-2024-102-55B2F9',
    payload: {},
  },
];

class CertificateClientService {
  private schoolSettings: SchoolCertificateSettings = { ...DEFAULT_SCHOOL_SETTINGS };
  private students: StudentCertificateProfile[] = [...MOCK_CERTIFICATE_STUDENTS];

  getSchoolSettings(): SchoolCertificateSettings {
    return { ...this.schoolSettings };
  }

  updateSchoolSettings(partial: Partial<SchoolCertificateSettings>): SchoolCertificateSettings {
    this.schoolSettings = { ...this.schoolSettings, ...partial };
    return { ...this.schoolSettings };
  }

  getStudents(): StudentCertificateProfile[] {
    return [...this.students];
  }

  getStudentById(id: string): StudentCertificateProfile | undefined {
    return this.students.find((s) => s.id === id || s.admissionNumber === id);
  }

  generateTransferCertificate(
    studentId: string,
    overrides?: Partial<TransferCertificateData>
  ): TransferCertificateData {
    const student = this.getStudentById(studentId) || this.students[0];
    const serial = Math.floor(100 + Math.random() * 900);
    const tcNo = overrides?.tcNumber || `TC/2026/${serial}`;
    const hash = `TC-${student.admissionNumber}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const data: TransferCertificateData = {
      tcNumber: tcNo,
      bookNumber: overrides?.bookNumber || 'BK-2026-04',
      issueDate: overrides?.issueDate || new Date().toISOString().split('T')[0],
      admissionNumber: student.admissionNumber,
      studentName: student.fullName,
      studentNameMl: student.fullNameMl,
      fatherName: student.fatherName,
      motherName: student.motherName,
      nationality: student.nationality,
      religionAndCaste: `${student.religion} (${student.casteCategory})`,
      dateOfBirth: student.dateOfBirth,
      dateOfBirthWords: student.dateOfBirthWords,
      dateOfFirstAdmission: student.dateOfAdmission,
      classFirstAdmitted: student.classAdmitted,
      classLastStudied: student.currentClass,
      classLastStudiedWords: 'Tenth Standard',
      schoolBoardExamStatus: overrides?.schoolBoardExamStatus || 'AISSE (Class X Board) - Passed with Distinction',
      qualifiedForPromotion: overrides?.qualifiedForPromotion ?? true,
      promotedToClass: overrides?.promotedToClass || 'Eligible for Class XI (Higher Secondary)',
      duesPaidUpto: overrides?.duesPaidUpto || 'March 2026 (All School Dues Cleared)',
      feeConcessionDetails: overrides?.feeConcessionDetails || 'None (General Merit)',
      totalWorkingDays: overrides?.totalWorkingDays || 214,
      attendedWorkingDays: overrides?.attendedWorkingDays || 206,
      extracurricularActivities: overrides?.extracurricularActivities || 'Active Member of School Science Club & Table Tennis Team',
      generalConduct: overrides?.generalConduct || 'Exemplary',
      dateOfApplication: overrides?.dateOfApplication || new Date().toISOString().split('T')[0],
      dateOfIssue: overrides?.dateOfIssue || new Date().toISOString().split('T')[0],
      reasonForLeaving: overrides?.reasonForLeaving || 'Course Completed / Higher Secondary Admission',
      remarks: overrides?.remarks || 'Self-disciplined and sincere student. We wish all the best in future endeavors.',
      verificationHash: hash,
      verificationUrl: `${this.schoolSettings.verificationDomain}/tc/${hash}`,
      ...overrides,
    };

    return data;
  }

  generateBonafideCertificate(
    studentId: string,
    options?: {
      purpose?: BonafidePurpose;
      purposeDescription?: string;
      validUntil?: string;
    }
  ): BonafideCertificateData {
    const student = this.getStudentById(studentId) || this.students[0];
    const serial = Math.floor(100 + Math.random() * 900);
    const certNo = `BON/2026/${serial}`;
    const hash = `BON-${student.admissionNumber}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const purposeMap: Record<BonafidePurpose, string> = {
      PASSPORT_VISA: 'submission to Passport Seva Kendra / Visa Consulate Authorities',
      SCHOLARSHIP: 'applying for National Merit / State Educational Scholarship',
      BUS_CONCESSION: 'availing Student Public Transport Concession Card',
      BANK_ACCOUNT: 'opening a Student Savings Bank Account under RBI guidelines',
      COMPETITION_OLYMPIAD: 'participating in National Level Science Olympiad & Sports Meet',
      HIGHER_EDUCATION: 'submission for Higher Secondary / Coaching Academy Entrance Verification',
      GENERAL: 'official identification and verification records',
    };

    const purpose = options?.purpose || 'PASSPORT_VISA';

    return {
      certNumber: certNo,
      issueDate: new Date().toISOString().split('T')[0],
      admissionNumber: student.admissionNumber,
      studentName: student.fullName,
      studentNameMl: student.fullNameMl,
      fatherName: student.fatherName,
      motherName: student.motherName,
      currentClass: student.currentClass,
      section: student.section,
      academicYear: student.academicYear,
      dateOfBirth: student.dateOfBirth,
      purpose,
      purposeDescription: options?.purposeDescription || purposeMap[purpose],
      conduct: 'Good moral character and disciplined conduct',
      validUntil: options?.validUntil || '2027-03-31',
      verificationHash: hash,
      verificationUrl: `${this.schoolSettings.verificationDomain}/bonafide/${hash}`,
    };
  }

  generateCharacterCertificate(
    studentId: string,
    options?: {
      conductLevel?: 'Exemplary' | 'Outstanding' | 'Very Good' | 'Good';
      sportsAndActivities?: string;
      remarks?: string;
    }
  ): CharacterCertificateData {
    const student = this.getStudentById(studentId) || this.students[0];
    const serial = Math.floor(100 + Math.random() * 900);
    const certNo = `CHR/2026/${serial}`;
    const hash = `CHR-${student.admissionNumber}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      certNumber: certNo,
      issueDate: new Date().toISOString().split('T')[0],
      admissionNumber: student.admissionNumber,
      studentName: student.fullName,
      studentNameMl: student.fullNameMl,
      fatherName: student.fatherName,
      motherName: student.motherName,
      periodFrom: student.dateOfAdmission.substring(0, 4),
      periodTo: '2026',
      lastClass: `${student.currentClass} (${student.section})`,
      academicYear: student.academicYear,
      conductLevel: options?.conductLevel || 'Exemplary',
      moralCharacter:
        'To the best of our knowledge and belief, he/she bears an unblemished moral character, respectful attitude towards teachers and peers, and high ethical conduct.',
      sportsAndActivities:
        options?.sportsAndActivities ||
        'Active participant in Inter-School Debates, Annual Sports Meet, and School Eco-Club Initiatives.',
      remarks: options?.remarks || 'He/She has demonstrated exceptional leadership qualities and teamwork.',
      verificationHash: hash,
      verificationUrl: `${this.schoolSettings.verificationDomain}/character/${hash}`,
    };
  }

  generateIDCard(studentId: string, orientation: IDCardOrientation = 'PORTRAIT'): DigitalIDCardData {
    const student = this.getStudentById(studentId) || this.students[0];
    const hash = `IDC-${student.admissionNumber}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const qrPayload = JSON.stringify({
      v: '1.0',
      type: 'KRYPTON_ID_CARD',
      admNo: student.admissionNumber,
      name: student.fullName,
      class: student.currentClass,
      sec: student.section,
      blood: student.bloodGroup,
      emg: student.emergencyContact,
      exp: '2027-05-31',
      hash,
    });

    return {
      cardId: `ID-${student.admissionNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      fullName: student.fullName,
      fullNameMl: student.fullNameMl,
      currentClass: student.currentClass,
      section: student.section,
      stream: student.stream,
      academicYear: student.academicYear,
      bloodGroup: student.bloodGroup,
      dateOfBirth: student.dateOfBirth,
      emergencyContact: student.emergencyContact,
      address: student.address,
      photoUrl: student.photoUrl,
      house: student.house,
      busRoute: student.busRoute,
      orientation,
      barcode: `*${student.admissionNumber}*`,
      qrPayload,
      issueDate: '2026-06-01',
      validUntil: '2027-05-31',
      verificationHash: hash,
    };
  }

  saveIssuedRecord(record: GeneratedCertificateRecord): void {
    issuedRecords = [record, ...issuedRecords.filter((r) => r.id !== record.id)];
  }

  getIssuedRecords(): GeneratedCertificateRecord[] {
    return [...issuedRecords];
  }

  verifyCertificate(codeOrHash: string): {
    valid: boolean;
    record?: GeneratedCertificateRecord;
    student?: StudentCertificateProfile;
  } {
    const clean = codeOrHash.trim().toUpperCase();
    const found = issuedRecords.find(
      (r) =>
        r.verificationHash.toUpperCase() === clean ||
        r.referenceNumber.toUpperCase() === clean ||
        r.admissionNumber.toUpperCase() === clean
    );

    if (found) {
      const student = this.getStudentById(found.studentId);
      return { valid: true, record: found, student };
    }

    // Also match any of the mock students directly by admission number for preview verification
    const student = this.students.find((s) => s.admissionNumber.toUpperCase() === clean);
    if (student) {
      return {
        valid: true,
        student,
        record: {
          id: `sim-${student.id}`,
          certificateType: 'BONAFIDE_CERTIFICATE',
          referenceNumber: `VERIFIED/${student.admissionNumber}`,
          studentId: student.id,
          studentName: student.fullName,
          admissionNumber: student.admissionNumber,
          className: student.currentClass,
          issueDate: new Date().toISOString().split('T')[0],
          issuedBy: this.schoolSettings.principalName,
          status: 'VERIFIED',
          verificationHash: clean,
          payload: {},
        },
      };
    }

    return { valid: false };
  }
}

export const certificateApi = new CertificateClientService();
