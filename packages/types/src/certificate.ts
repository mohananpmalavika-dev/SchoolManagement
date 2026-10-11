export type CertificateType =
  | 'TRANSFER_CERTIFICATE'
  | 'BONAFIDE_CERTIFICATE'
  | 'CHARACTER_CERTIFICATE'
  | 'ID_CARD';

export type CertificateStatus = 'DRAFT' | 'ISSUED' | 'VERIFIED' | 'REVOKED';

export type BonafidePurpose =
  | 'PASSPORT_VISA'
  | 'SCHOLARSHIP'
  | 'BUS_CONCESSION'
  | 'BANK_ACCOUNT'
  | 'COMPETITION_OLYMPIAD'
  | 'HIGHER_EDUCATION'
  | 'GENERAL';

export type IDCardOrientation = 'PORTRAIT' | 'LANDSCAPE';

export interface StudentCertificateProfile {
  id: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  fullNameMl: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // YYYY-MM-DD
  dateOfBirthWords: string;
  fatherName: string;
  motherName: string;
  guardianName?: string;
  nationality: string;
  religion: string;
  casteCategory: string; // General / OBC / SC / ST / OEC
  dateOfAdmission: string;
  classAdmitted: string;
  currentClass: string;
  section: string;
  stream: string;
  academicYear: string;
  bloodGroup: string;
  emergencyContact: string;
  guardianPhone: string;
  address: string;
  addressMl?: string;
  photoUrl: string;
  aadharNumber?: string;
  house?: string;
  busRoute?: string;
}

export interface TransferCertificateData {
  tcNumber: string;
  bookNumber: string;
  issueDate: string;
  admissionNumber: string;
  studentName: string;
  studentNameMl: string;
  fatherName: string;
  motherName: string;
  nationality: string;
  religionAndCaste: string;
  dateOfBirth: string;
  dateOfBirthWords: string;
  dateOfFirstAdmission: string;
  classFirstAdmitted: string;
  classLastStudied: string;
  classLastStudiedWords: string;
  schoolBoardExamStatus: string;
  qualifiedForPromotion: boolean;
  promotedToClass: string;
  duesPaidUpto: string;
  feeConcessionDetails: string;
  totalWorkingDays: number;
  attendedWorkingDays: number;
  extracurricularActivities: string;
  generalConduct: 'Exemplary' | 'Good' | 'Satisfactory';
  dateOfApplication: string;
  dateOfIssue: string;
  reasonForLeaving: string;
  remarks: string;
  verificationHash: string;
  verificationUrl: string;
}

export interface BonafideCertificateData {
  certNumber: string;
  issueDate: string;
  admissionNumber: string;
  studentName: string;
  studentNameMl: string;
  fatherName: string;
  motherName: string;
  currentClass: string;
  section: string;
  academicYear: string;
  dateOfBirth: string;
  purpose: BonafidePurpose;
  purposeDescription: string;
  conduct: string;
  validUntil: string;
  verificationHash: string;
  verificationUrl: string;
}

export interface CharacterCertificateData {
  certNumber: string;
  issueDate: string;
  admissionNumber: string;
  studentName: string;
  studentNameMl: string;
  fatherName: string;
  motherName: string;
  periodFrom: string;
  periodTo: string;
  lastClass: string;
  academicYear: string;
  conductLevel: 'Exemplary' | 'Outstanding' | 'Very Good' | 'Good';
  moralCharacter: string;
  sportsAndActivities: string;
  remarks: string;
  verificationHash: string;
  verificationUrl: string;
}

export interface DigitalIDCardData {
  cardId: string;
  studentId: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  fullNameMl: string;
  currentClass: string;
  section: string;
  stream: string;
  academicYear: string;
  bloodGroup: string;
  dateOfBirth: string;
  emergencyContact: string;
  address: string;
  photoUrl: string;
  house?: string;
  busRoute?: string;
  orientation: IDCardOrientation;
  barcode: string;
  qrPayload: string;
  issueDate: string;
  validUntil: string;
  verificationHash: string;
}

export interface SchoolCertificateSettings {
  schoolName: string;
  schoolNameMl: string;
  affiliationBoard: string;
  affiliationNumber: string;
  schoolCode: string;
  address: string;
  addressMl: string;
  districtState: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  crestEmblemSvg?: string;
  principalName: string;
  principalTitle: string;
  principalDegree: string;
  digitalSignatureUrl: string;
  digitalSignatureHash: string;
  officialSealSvg?: string;
  verificationDomain: string;
}

export interface GeneratedCertificateRecord {
  id: string;
  certificateType: CertificateType;
  referenceNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  issueDate: string;
  issuedBy: string;
  status: CertificateStatus;
  verificationHash: string;
  payload: any;
}
