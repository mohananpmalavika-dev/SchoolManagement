import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class CertificatesService {
  private schoolSettings: SchoolCertificateSettings = {
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

  private students: StudentCertificateProfile[] = [
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
  ];

  private issuedRecords: GeneratedCertificateRecord[] = [];

  getSchoolSettings(): SchoolCertificateSettings {
    return this.schoolSettings;
  }

  updateSchoolSettings(partial: Partial<SchoolCertificateSettings>): SchoolCertificateSettings {
    this.schoolSettings = { ...this.schoolSettings, ...partial };
    return this.schoolSettings;
  }

  getStudents(): StudentCertificateProfile[] {
    return this.students;
  }

  getStudent(id: string): StudentCertificateProfile {
    const s = this.students.find((stu) => stu.id === id || stu.admissionNumber === id);
    if (!s) {
      throw new NotFoundException(`Student ${id} not found`);
    }
    return s;
  }

  generateTransferCertificate(
    studentId: string,
    overrides?: Partial<TransferCertificateData>
  ): TransferCertificateData {
    const student = this.getStudent(studentId);
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
    purpose: BonafidePurpose = 'PASSPORT_VISA'
  ): BonafideCertificateData {
    const student = this.getStudent(studentId);
    const serial = Math.floor(100 + Math.random() * 900);
    const certNo = `BON/2026/${serial}`;
    const hash = `BON-${student.admissionNumber}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
      purposeDescription: 'Official submission to authorized governmental & educational bodies',
      conduct: 'Good moral character and disciplined conduct',
      validUntil: '2027-03-31',
      verificationHash: hash,
      verificationUrl: `${this.schoolSettings.verificationDomain}/bonafide/${hash}`,
    };
  }

  generateCharacterCertificate(studentId: string): CharacterCertificateData {
    const student = this.getStudent(studentId);
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
      conductLevel: 'Exemplary',
      moralCharacter: 'Bears an unblemished moral character and high ethical standards.',
      sportsAndActivities: 'Active in athletics and student leadership councils.',
      remarks: 'Exemplary conduct throughout school tenure.',
      verificationHash: hash,
      verificationUrl: `${this.schoolSettings.verificationDomain}/character/${hash}`,
    };
  }

  generateIDCard(studentId: string, orientation: IDCardOrientation = 'PORTRAIT'): DigitalIDCardData {
    const student = this.getStudent(studentId);
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

  verifyCertificate(code: string) {
    const clean = code.trim().toUpperCase();
    const student = this.students.find((s) => s.admissionNumber.toUpperCase() === clean);
    if (student) {
      return {
        valid: true,
        student,
        verifiedAt: new Date().toISOString(),
        institution: this.schoolSettings.schoolName,
      };
    }
    return { valid: false };
  }
}
