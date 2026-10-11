import {
  AdmissionApplication,
  AdmissionStage,
  CreateAdmissionInput,
  AdmissionFunnelStats,
  AdmissionInterview,
  AdmissionPayment,
  AdmissionEnrollment,
} from '@krypton/types';

const STORAGE_KEY = 'krypton_admissions_applications_v1';

export const INITIAL_ADMISSIONS: AdmissionApplication[] = [
  {
    id: 'adm-001',
    applicationNumber: 'APP-2026-0801',
    academicYear: '2026-2027',
    stage: 'INQUIRY_RECEIVED',
    priority: 'HIGH',
    leadSource: 'WEBSITE_PORTAL',
    student: {
      firstName: 'Ananya',
      lastName: 'Nair',
      fullName: 'Ananya Nair',
      fullNameMl: 'അനന്യ നായർ',
      gender: 'Female',
      dateOfBirth: '2021-05-14',
      applyingForGrade: 'Kindergarten',
      bloodGroup: 'B+ve',
      nationality: 'Indian',
      religion: 'Hindu',
      casteCategory: 'General',
      medicalNotes: 'No allergies reported',
    },
    parent: {
      fatherName: 'Rajesh Nair',
      motherName: 'Deepa Nair',
      email: 'rajesh.nair@gmail.com',
      phone: '+91 98471 22334',
      whatsappPhone: '+91 98471 22334',
      occupation: 'Software Architect at InfoPark',
      address: 'Villa 12, Skyline Greenwoods, Kakkanad',
      city: 'Kochi',
      pincode: '682030',
    },
    documents: {
      birthCertificateUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      birthCertificateFileName: 'Ananya_Birth_Certificate.pdf',
      studentPhotoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300&auto=format&fit=crop&q=80',
      studentPhotoFileName: 'Ananya_Passport_Photo.jpg',
    },
    transportRequired: true,
    hostelRequired: false,
    siblingEnrolled: false,
    notes: [
      {
        id: 'note-1',
        author: 'Admissions Desk',
        text: 'Parent requested Kakkanad morning bus route details.',
        createdAt: '2026-10-10T09:30:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'time-1',
        stage: 'INQUIRY_RECEIVED',
        title: 'Online Application Submitted',
        titleMl: 'ഓൺലൈൻ അപേക്ഷ സമർപ്പിച്ചു',
        description: 'Application submitted via school web portal with verified documents.',
        timestamp: '2026-10-10T09:15:00.000Z',
        actor: 'Parent (Portal)',
      },
    ],
    tags: ['Early Bird', 'Bus Route 4', 'KG Program'],
    createdAt: '2026-10-10T09:15:00.000Z',
    updatedAt: '2026-10-10T09:30:00.000Z',
  },
  {
    id: 'adm-002',
    applicationNumber: 'APP-2026-0802',
    academicYear: '2026-2027',
    stage: 'INQUIRY_RECEIVED',
    priority: 'NORMAL',
    leadSource: 'WALK_IN',
    student: {
      firstName: 'Rahul',
      lastName: 'Varma',
      fullName: 'Rahul Varma',
      fullNameMl: 'രാഹുൽ വർമ്മ',
      gender: 'Male',
      dateOfBirth: '2016-08-20',
      applyingForGrade: 'Grade 5',
      bloodGroup: 'O+ve',
      previousSchool: 'St. Joseph Higher Secondary School',
      nationality: 'Indian',
      religion: 'Hindu',
      casteCategory: 'General',
    },
    parent: {
      fatherName: 'Gopakumar Varma',
      motherName: 'Lekshmi Varma',
      email: 'gopakumar.varma@outlook.com',
      phone: '+91 94470 55667',
      whatsappPhone: '+91 94470 55667',
      occupation: 'Civil Engineer (PWD)',
      address: 'Haritha Nagar, Near Royal Palace, Tripunithura',
      city: 'Kochi',
      pincode: '682301',
    },
    documents: {
      birthCertificateUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      birthCertificateFileName: 'Birth_Certificate_Rahul.pdf',
      studentPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80',
      studentPhotoFileName: 'Rahul_Photo.png',
      previousMarksheetUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
      previousMarksheetFileName: 'Grade4_Marksheet.pdf',
    },
    transportRequired: false,
    hostelRequired: false,
    siblingEnrolled: true,
    siblingDetails: 'Adithya Varma (Grade 8, Roll 22)',
    notes: [
      {
        id: 'note-2',
        author: 'Reception Desk',
        text: 'Walk-in inquiry. Sibling discount applicable.',
        createdAt: '2026-10-10T11:00:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'time-2',
        stage: 'INQUIRY_RECEIVED',
        title: 'Walk-in Inquiry Recorded',
        titleMl: 'നേരിട്ടുള്ള അപേക്ഷ രേഖപ്പെടുത്തി',
        description: 'Admissions desk entered form after parent consultation.',
        timestamp: '2026-10-10T11:00:00.000Z',
        actor: 'Front Desk Admin',
      },
    ],
    tags: ['Sibling Concession', 'Local Resident'],
    createdAt: '2026-10-10T11:00:00.000Z',
    updatedAt: '2026-10-10T11:00:00.000Z',
  },
  {
    id: 'adm-003',
    applicationNumber: 'APP-2026-0803',
    academicYear: '2026-2027',
    stage: 'INTERVIEW_SCHEDULED',
    priority: 'HIGH',
    leadSource: 'WHATSAPP',
    student: {
      firstName: 'Diya',
      lastName: 'Joseph',
      fullName: 'Diya Joseph',
      fullNameMl: 'ദിയ ജോസഫ്',
      gender: 'Female',
      dateOfBirth: '2020-02-18',
      applyingForGrade: 'Grade 1',
      bloodGroup: 'A+ve',
      previousSchool: 'Little Flower Montessori',
      nationality: 'Indian',
      religion: 'Christian',
      casteCategory: 'General',
    },
    parent: {
      fatherName: 'Joseph Mathew',
      motherName: 'Ann Mary',
      email: 'mathew.joseph@gmail.com',
      phone: '+91 97450 88990',
      whatsappPhone: '+91 97450 88990',
      occupation: 'Bank Manager (SBI)',
      address: 'Flat 7A, Olive Courtyard, Kadavanthra',
      city: 'Kochi',
      pincode: '682020',
    },
    documents: {
      birthCertificateUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      birthCertificateFileName: 'Diya_Birth_Cert.pdf',
      studentPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      studentPhotoFileName: 'Diya_Passport.jpg',
    },
    interview: {
      scheduledDate: '2026-10-14',
      scheduledTime: '10:30',
      interviewerName: 'Mrs. Susan Thomas (Vice Principal)',
      venueOrLink: 'Principal Office / Conference Room 2',
      isVirtual: false,
      notes: 'Parent interaction and student foundational reading assessment.',
      result: 'PENDING',
    },
    transportRequired: true,
    hostelRequired: false,
    siblingEnrolled: false,
    notes: [
      {
        id: 'note-3',
        author: 'Mrs. Susan Thomas',
        text: 'Interview slot confirmed. WhatsApp invite dispatched to parent.',
        createdAt: '2026-10-11T08:00:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'time-3a',
        stage: 'INQUIRY_RECEIVED',
        title: 'Application Received',
        titleMl: 'അപേക്ഷ ലഭിച്ചു',
        description: 'Received via WhatsApp School Campaign link.',
        timestamp: '2026-10-09T14:20:00.000Z',
        actor: 'WhatsApp Gateway',
      },
      {
        id: 'time-3b',
        stage: 'INTERVIEW_SCHEDULED',
        title: 'Interview & Assessment Scheduled',
        titleMl: 'അഭിമുഖം നിശ്ചയിച്ചു',
        description: 'Slot: Oct 14, 2026 at 10:30 AM with Vice Principal.',
        timestamp: '2026-10-11T08:00:00.000Z',
        actor: 'Academic Coordinator',
      },
    ],
    tags: ['Interview Fixed', 'Bus Route 2'],
    createdAt: '2026-10-09T14:20:00.000Z',
    updatedAt: '2026-10-11T08:00:00.000Z',
  },
  {
    id: 'adm-004',
    applicationNumber: 'APP-2026-0804',
    academicYear: '2026-2027',
    stage: 'ACCEPTED',
    priority: 'HIGH',
    leadSource: 'WEBSITE_PORTAL',
    student: {
      firstName: 'Muhammed',
      lastName: 'Faiz',
      fullName: 'Muhammed Faiz',
      fullNameMl: 'മുഹമ്മദ് ഫായിസ്',
      gender: 'Male',
      dateOfBirth: '2013-11-05',
      applyingForGrade: 'Grade 8',
      bloodGroup: 'AB+ve',
      previousSchool: 'Cochin Model High School',
      nationality: 'Indian',
      religion: 'Islam',
      casteCategory: 'OBC',
    },
    parent: {
      fatherName: 'Abdul Kareem',
      motherName: 'Fathima Beevi',
      email: 'kareem.marine@gmail.com',
      phone: '+91 98950 11223',
      whatsappPhone: '+91 98950 11223',
      occupation: 'Merchant Navy Chief Officer',
      address: 'House 44, Pearl residency, Edappally Toll',
      city: 'Kochi',
      pincode: '682024',
    },
    documents: {
      birthCertificateUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      birthCertificateFileName: 'Faiz_Birth_Cert.pdf',
      studentPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      studentPhotoFileName: 'Faiz_Photo.jpg',
      previousMarksheetUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
      previousMarksheetFileName: 'Grade7_Term_Report.pdf',
    },
    interview: {
      scheduledDate: '2026-10-08',
      scheduledTime: '11:00',
      interviewerName: 'Dr. K. R. Nambiar (Principal)',
      venueOrLink: 'Principal Chambers',
      isVirtual: false,
      score: 94,
      result: 'RECOMMENDED',
      notes: 'Exceptional aptitude in Mathematics and Science. Recommended for Class 8 Merit Batch.',
    },
    transportRequired: true,
    hostelRequired: false,
    siblingEnrolled: false,
    notes: [
      {
        id: 'note-4',
        author: 'Principal Office',
        text: 'Offer letter generated. Waiting for Term 1 admission fee payment.',
        createdAt: '2026-10-09T16:00:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'time-4a',
        stage: 'INQUIRY_RECEIVED',
        title: 'Application Received',
        titleMl: 'അപേക്ഷ ലഭിച്ചു',
        description: 'Submitted online via Portal.',
        timestamp: '2026-10-05T10:00:00.000Z',
        actor: 'Parent',
      },
      {
        id: 'time-4b',
        stage: 'INTERVIEW_SCHEDULED',
        title: 'Interview Conducted',
        titleMl: 'അഭിമുഖം നടത്തി',
        description: 'Score: 94/100 by Dr. K. R. Nambiar.',
        timestamp: '2026-10-08T11:45:00.000Z',
        actor: 'Interview Panel',
      },
      {
        id: 'time-4c',
        stage: 'ACCEPTED',
        title: 'Seat Offered & Accepted',
        titleMl: 'സീറ്റ് അനുവദിച്ചു (അംഗീകരിച്ചു)',
        description: 'Admission seat approved for Academic Year 2026-27. Offer letter dispatched via WhatsApp.',
        timestamp: '2026-10-09T16:00:00.000Z',
        actor: 'Principal Office',
      },
    ],
    tags: ['Merit Student', 'Math Whiz', 'Offer Sent'],
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-09T16:00:00.000Z',
  },
  {
    id: 'adm-005',
    applicationNumber: 'APP-2026-0805',
    academicYear: '2026-2027',
    stage: 'FEE_PAID',
    priority: 'HIGH',
    leadSource: 'SOCIAL_MEDIA',
    student: {
      firstName: 'Sreya',
      lastName: 'Menon',
      fullName: 'Sreya Menon',
      fullNameMl: 'ശ്രേയ മേനോൻ',
      gender: 'Female',
      dateOfBirth: '2010-09-12',
      applyingForGrade: 'Grade 11 - Science',
      bloodGroup: 'B+ve',
      previousSchool: 'Bhavans Vidya Mandir, Elamakkara',
      nationality: 'Indian',
      religion: 'Hindu',
      casteCategory: 'General',
    },
    parent: {
      fatherName: 'Unnikrishnan Menon',
      motherName: 'Radhika Menon',
      email: 'unni.menon@tcs.com',
      phone: '+91 94460 33445',
      whatsappPhone: '+91 94460 33445',
      occupation: 'General Manager, Tech Services',
      address: 'Tower C, 1402, Heera Park, Thevara',
      city: 'Kochi',
      pincode: '682013',
    },
    documents: {
      birthCertificateUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      birthCertificateFileName: 'Sreya_Birth_Certificate.pdf',
      studentPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      studentPhotoFileName: 'Sreya_Portrait.jpg',
      previousMarksheetUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
      previousMarksheetFileName: 'Class10_Board_Results.pdf',
    },
    interview: {
      scheduledDate: '2026-10-06',
      scheduledTime: '14:00',
      interviewerName: 'Prof. Vinod Warrier (HOD Science)',
      venueOrLink: 'Science Block Labs',
      isVirtual: false,
      score: 96,
      result: 'RECOMMENDED',
      notes: 'Cleared entrance screening for Physics/Chemistry/Maths/Computer stream.',
    },
    payment: {
      amount: 25000,
      currency: 'INR',
      receiptNumber: 'RCP-2026-4091',
      paidAt: '2026-10-10T15:20:00.000Z',
      paymentMethod: 'UPI',
      feeType: 'Admission & Term 1 Tuition Fee',
      transactionId: 'UPI-774019283746',
    },
    transportRequired: true,
    hostelRequired: false,
    siblingEnrolled: false,
    notes: [
      {
        id: 'note-5',
        author: 'Accounts Department',
        text: 'Fee payment ₹25,000 confirmed via UPI. Ready for final admission number generation.',
        createdAt: '2026-10-10T15:30:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'time-5a',
        stage: 'INQUIRY_RECEIVED',
        title: 'Application Received',
        titleMl: 'അപേക്ഷ ലഭിച്ചു',
        description: 'Submitted online via Facebook/Instagram campaign link.',
        timestamp: '2026-10-02T11:00:00.000Z',
        actor: 'Parent',
      },
      {
        id: 'time-5b',
        stage: 'INTERVIEW_SCHEDULED',
        title: 'Entrance & Interview Completed',
        titleMl: 'അഭിമുഖം പൂർത്തിയായി',
        description: 'Score 96% in Science screening.',
        timestamp: '2026-10-06T15:00:00.000Z',
        actor: 'HOD Science',
      },
      {
        id: 'time-5c',
        stage: 'ACCEPTED',
        title: 'Seat Confirmed',
        titleMl: 'സീറ്റ് ഉറപ്പിച്ചു',
        description: 'Class 11 Science (PCMC Stream) allocated.',
        timestamp: '2026-10-07T10:00:00.000Z',
        actor: 'Admissions Head',
      },
      {
        id: 'time-5d',
        stage: 'FEE_PAID',
        title: 'Admission Fee Paid',
        titleMl: 'ഫീസ് വിജയകരമായി അടച്ചു',
        description: '₹25,000 received via UPI (Receipt: RCP-2026-4091).',
        timestamp: '2026-10-10T15:20:00.000Z',
        actor: 'Accounts Desk',
      },
    ],
    tags: ['Class 11 Science', 'Fee Paid', 'Ready to Admit'],
    createdAt: '2026-10-02T11:00:00.000Z',
    updatedAt: '2026-10-10T15:30:00.000Z',
  },
  {
    id: 'adm-006',
    applicationNumber: 'APP-2026-0806',
    academicYear: '2026-2027',
    stage: 'ADMITTED',
    priority: 'HIGH',
    leadSource: 'PARENT_REFERRAL',
    student: {
      firstName: 'Devika',
      lastName: 'Krishna',
      fullName: 'Devika Krishna',
      fullNameMl: 'ദേവിക കൃഷ്ണ',
      gender: 'Female',
      dateOfBirth: '2020-03-25',
      applyingForGrade: 'Grade 1',
      bloodGroup: 'O+ve',
      previousSchool: 'EuroKids Preschool',
      nationality: 'Indian',
      religion: 'Hindu',
      casteCategory: 'General',
    },
    parent: {
      fatherName: 'Krishnakumar S.',
      motherName: 'Aswathy Krishna',
      email: 'krishna.kumar@gmail.com',
      phone: '+91 94471 99887',
      whatsappPhone: '+91 94471 99887',
      occupation: 'Architect & Interior Designer',
      address: 'Krishnakripa, Near Temple Road, Thrippunithura',
      city: 'Kochi',
      pincode: '682301',
    },
    documents: {
      birthCertificateUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      birthCertificateFileName: 'Devika_Birth_Certificate.pdf',
      studentPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      studentPhotoFileName: 'Devika_Passport.jpg',
    },
    interview: {
      scheduledDate: '2026-10-01',
      scheduledTime: '10:00',
      interviewerName: 'Primary Coordinator',
      venueOrLink: 'Classroom 1A',
      isVirtual: false,
      score: 98,
      result: 'RECOMMENDED',
    },
    payment: {
      amount: 22000,
      currency: 'INR',
      receiptNumber: 'RCP-2026-3980',
      paidAt: '2026-10-04T12:00:00.000Z',
      paymentMethod: 'NET_BANKING',
      feeType: 'Admission Fee & Annual Activity Fee',
      transactionId: 'TXN-NET-9938210',
    },
    enrollment: {
      officialAdmissionNumber: 'KPS-2026-1044',
      rollNumber: '1-B-24',
      assignedClass: 'Grade 1',
      assignedSection: 'B',
      admittedAt: '2026-10-05T09:00:00.000Z',
      welcomeKitDispatched: true,
    },
    transportRequired: true,
    hostelRequired: false,
    siblingEnrolled: false,
    notes: [
      {
        id: 'note-6',
        author: 'Registrar Office',
        text: 'Formally enrolled. Student ID badge KPS-2026-1044 issued and welcome kit dispatched.',
        createdAt: '2026-10-05T09:30:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'time-6a',
        stage: 'INQUIRY_RECEIVED',
        title: 'Application Received',
        titleMl: 'അപേക്ഷ ലഭിച്ചു',
        description: 'Referred by PTA member.',
        timestamp: '2026-09-28T10:00:00.000Z',
        actor: 'Portal',
      },
      {
        id: 'time-6b',
        stage: 'INTERVIEW_SCHEDULED',
        title: 'Interview Passed',
        titleMl: 'അഭിമുഖം വിജയിച്ചു',
        description: 'Grade 1 readiness verified.',
        timestamp: '2026-10-01T10:30:00.000Z',
        actor: 'Coordinator',
      },
      {
        id: 'time-6c',
        stage: 'ACCEPTED',
        title: 'Admission Approved',
        titleMl: 'അംഗീകരിച്ചു',
        description: 'Seat reserved.',
        timestamp: '2026-10-02T14:00:00.000Z',
        actor: 'Principal Office',
      },
      {
        id: 'time-6d',
        stage: 'FEE_PAID',
        title: 'Admission Fee Cleared',
        titleMl: 'ഫീസ് അടച്ചു',
        description: '₹22,000 paid via NetBanking.',
        timestamp: '2026-10-04T12:00:00.000Z',
        actor: 'Accounts',
      },
      {
        id: 'time-6e',
        stage: 'ADMITTED',
        title: 'Enrolled as Official Student',
        titleMl: 'ഔദ്യോഗികമായി ചേർത്തു (Admitted)',
        description: 'Official Admission No: KPS-2026-1044 in Grade 1 Section B.',
        timestamp: '2026-10-05T09:00:00.000Z',
        actor: 'Registrar',
      },
    ],
    tags: ['Admitted', 'Bus Route 3', 'ID Card Issued'],
    createdAt: '2026-09-28T10:00:00.000Z',
    updatedAt: '2026-10-05T09:30:00.000Z',
  },
];

class AdmissionsClient {
  private getStorage(): AdmissionApplication[] {
    if (typeof window === 'undefined') return INITIAL_ADMISSIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ADMISSIONS));
      return INITIAL_ADMISSIONS;
    } catch {
      return INITIAL_ADMISSIONS;
    }
  }

  private saveStorage(apps: AdmissionApplication[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.error('Failed to save admissions to localStorage', e);
    }
  }

  getApplications(filters?: {
    stage?: AdmissionStage;
    search?: string;
    grade?: string;
    priority?: string;
    source?: string;
  }): AdmissionApplication[] {
    let items = this.getStorage();
    if (!filters) return items;

    if (filters.stage) {
      items = items.filter((a) => a.stage === filters.stage);
    }
    if (filters.grade && filters.grade !== 'ALL') {
      items = items.filter((a) => a.student.applyingForGrade === filters.grade);
    }
    if (filters.priority && filters.priority !== 'ALL') {
      items = items.filter((a) => a.priority === filters.priority);
    }
    if (filters.source && filters.source !== 'ALL') {
      items = items.filter((a) => a.leadSource === filters.source);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (a) =>
          a.applicationNumber.toLowerCase().includes(q) ||
          a.student.fullName.toLowerCase().includes(q) ||
          (a.student.fullNameMl && a.student.fullNameMl.includes(q)) ||
          a.parent.fatherName.toLowerCase().includes(q) ||
          a.parent.phone.includes(q) ||
          a.parent.whatsappPhone.includes(q)
      );
    }
    return items;
  }

  getApplicationById(id: string): AdmissionApplication | undefined {
    const list = this.getStorage();
    return list.find((a) => a.id === id || a.applicationNumber === id);
  }

  createApplication(input: CreateAdmissionInput): AdmissionApplication {
    const list = this.getStorage();
    const count = list.length + 1;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appNumber = `APP-2026-${count.toString().padStart(3, '0')}${randomSuffix.toString().slice(-1)}`;
    const now = new Date().toISOString();

    const newApp: AdmissionApplication = {
      id: `adm-${Date.now()}`,
      applicationNumber: appNumber,
      academicYear: '2026-2027',
      stage: 'INQUIRY_RECEIVED',
      priority: input.priority || 'MEDIUM',
      leadSource: input.leadSource || 'WEBSITE_PORTAL',
      student: input.student,
      parent: input.parent,
      documents: input.documents,
      transportRequired: input.transportRequired ?? false,
      hostelRequired: input.hostelRequired ?? false,
      siblingEnrolled: input.siblingEnrolled ?? false,
      siblingDetails: input.siblingDetails,
      notes: input.notes
        ? [
            {
              id: `note-${Date.now()}`,
              author: 'Applicant / Parent',
              text: input.notes,
              createdAt: now,
            },
          ]
        : [],
      timeline: [
        {
          id: `time-${Date.now()}`,
          stage: 'INQUIRY_RECEIVED',
          title: 'Online Application Submitted',
          titleMl: 'ഓൺലൈൻ അപേക്ഷ വിജയകരമായി സമർപ്പിച്ചു',
          description: `Application registered for ${input.student.applyingForGrade} under ${input.academicYear || '2026-2027'} batch.`,
          timestamp: now,
          actor: 'Parent (Online Portal)',
        },
      ],
      tags: ['New Inquiry', input.student.applyingForGrade],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newApp, ...list];
    this.saveStorage(updated);
    return newApp;
  }

  updateStage(
    id: string,
    newStage: AdmissionStage,
    actor = 'School Administrator',
    stageNote?: string
  ): AdmissionApplication | null {
    const list = this.getStorage();
    const index = list.findIndex((a) => a.id === id || a.applicationNumber === id);
    if (index === -1) return null;

    const current = list[index];
    if (current.stage === newStage) return current;

    const now = new Date().toISOString();
    const stageTitles: Record<AdmissionStage, { en: string; ml: string }> = {
      INQUIRY_RECEIVED: { en: 'Inquiry Received', ml: 'പുതിയ അപേക്ഷ ലഭിച്ചു' },
      INTERVIEW_SCHEDULED: { en: 'Interview Scheduled', ml: 'അഭിമുഖം നിശ്ചയിച്ചു' },
      ACCEPTED: { en: 'Application Accepted', ml: 'സീറ്റ് അനുവദിച്ചു (അംഗീകരിച്ചു)' },
      FEE_PAID: { en: 'Admission Fee Cleared', ml: 'ഫീസ് വിജയകരമായി അടച്ചു' },
      ADMITTED: { en: 'Officially Admitted', ml: 'ഔദ്യോഗികമായി ചേർത്തു (Admitted)' },
    };

    const newTimelineItem = {
      id: `time-${Date.now()}`,
      stage: newStage,
      title: stageTitles[newStage]?.en || newStage,
      titleMl: stageTitles[newStage]?.ml,
      description: stageNote || `Moved to ${stageTitles[newStage]?.en || newStage} in admissions pipeline.`,
      timestamp: now,
      actor,
    };

    const updatedApp: AdmissionApplication = {
      ...current,
      stage: newStage,
      updatedAt: now,
      timeline: [newTimelineItem, ...current.timeline],
    };

    list[index] = updatedApp;
    this.saveStorage(list);
    return updatedApp;
  }

  scheduleInterview(
    id: string,
    interview: AdmissionInterview,
    actor = 'Admissions Coordinator'
  ): AdmissionApplication | null {
    const list = this.getStorage();
    const index = list.findIndex((a) => a.id === id || a.applicationNumber === id);
    if (index === -1) return null;

    const current = list[index];
    const now = new Date().toISOString();

    const timelineItem = {
      id: `time-${Date.now()}`,
      stage: 'INTERVIEW_SCHEDULED' as AdmissionStage,
      title: 'Interview & Assessment Scheduled',
      titleMl: 'അഭിമുഖം നിശ്ചയിച്ചു',
      description: `Interview booked on ${interview.scheduledDate} at ${interview.scheduledTime} with ${interview.interviewerName} (${interview.venueOrLink}).`,
      timestamp: now,
      actor,
    };

    const updatedApp: AdmissionApplication = {
      ...current,
      stage: 'INTERVIEW_SCHEDULED',
      interview,
      updatedAt: now,
      timeline: [timelineItem, ...current.timeline],
    };

    list[index] = updatedApp;
    this.saveStorage(list);
    return updatedApp;
  }

  recordFeePayment(
    id: string,
    payment: AdmissionPayment,
    actor = 'Accounts Office'
  ): AdmissionApplication | null {
    const list = this.getStorage();
    const index = list.findIndex((a) => a.id === id || a.applicationNumber === id);
    if (index === -1) return null;

    const current = list[index];
    const now = new Date().toISOString();

    const timelineItem = {
      id: `time-${Date.now()}`,
      stage: 'FEE_PAID' as AdmissionStage,
      title: 'Admission Fee Payment Recorded',
      titleMl: 'ഫീസ് വിജയകരമായി അടച്ചു',
      description: `₹${payment.amount.toLocaleString('en-IN')} paid via ${payment.paymentMethod}. Receipt: ${payment.receiptNumber}.`,
      timestamp: now,
      actor,
    };

    const updatedApp: AdmissionApplication = {
      ...current,
      stage: 'FEE_PAID',
      payment,
      updatedAt: now,
      timeline: [timelineItem, ...current.timeline],
    };

    list[index] = updatedApp;
    this.saveStorage(list);
    return updatedApp;
  }

  completeAdmission(
    id: string,
    enrollment: AdmissionEnrollment,
    actor = 'Registrar Office'
  ): AdmissionApplication | null {
    const list = this.getStorage();
    const index = list.findIndex((a) => a.id === id || a.applicationNumber === id);
    if (index === -1) return null;

    const current = list[index];
    const now = new Date().toISOString();

    const timelineItem = {
      id: `time-${Date.now()}`,
      stage: 'ADMITTED' as AdmissionStage,
      title: 'Formal Admission Completed',
      titleMl: 'ഔദ്യോഗികമായി സ്കൂളിൽ ചേർത്തു (Admitted)',
      description: `Assigned Official Admission No: ${enrollment.officialAdmissionNumber} (Class ${enrollment.assignedClass} - Sec ${enrollment.assignedSection}).`,
      timestamp: now,
      actor,
    };

    const updatedApp: AdmissionApplication = {
      ...current,
      stage: 'ADMITTED',
      enrollment,
      updatedAt: now,
      timeline: [timelineItem, ...current.timeline],
    };

    list[index] = updatedApp;
    this.saveStorage(list);
    return updatedApp;
  }

  addNote(id: string, text: string, author: string): AdmissionApplication | null {
    const list = this.getStorage();
    const index = list.findIndex((a) => a.id === id || a.applicationNumber === id);
    if (index === -1) return null;

    const current = list[index];
    const now = new Date().toISOString();

    const newNote = {
      id: `note-${Date.now()}`,
      author,
      text,
      createdAt: now,
    };

    const updatedApp: AdmissionApplication = {
      ...current,
      notes: [newNote, ...current.notes],
      updatedAt: now,
    };

    list[index] = updatedApp;
    this.saveStorage(list);
    return updatedApp;
  }

  getFunnelStats(): AdmissionFunnelStats {
    const list = this.getStorage();
    const inquiryCount = list.length;
    const interviewCount = list.filter(
      (a) => a.stage === 'INTERVIEW_SCHEDULED' || a.stage === 'ACCEPTED' || a.stage === 'FEE_PAID' || a.stage === 'ADMITTED'
    ).length;
    const acceptedCount = list.filter(
      (a) => a.stage === 'ACCEPTED' || a.stage === 'FEE_PAID' || a.stage === 'ADMITTED'
    ).length;
    const feePaidCount = list.filter(
      (a) => a.stage === 'FEE_PAID' || a.stage === 'ADMITTED'
    ).length;
    const admittedCount = list.filter((a) => a.stage === 'ADMITTED').length;

    const totalFee = list.reduce((sum, a) => sum + (a.payment?.amount || 0), 0);

    const byGrade: Record<string, number> = {};
    const bySource: Record<any, number> = {
      WEBSITE_PORTAL: 0,
      WALK_IN: 0,
      WHATSAPP: 0,
      SOCIAL_MEDIA: 0,
      PARENT_REFERRAL: 0,
      EDUCATION_EXPO: 0,
    };

    list.forEach((a) => {
      byGrade[a.student.applyingForGrade] = (byGrade[a.student.applyingForGrade] || 0) + 1;
      if (bySource[a.leadSource] !== undefined) {
        bySource[a.leadSource]++;
      }
    });

    const conversionRate = inquiryCount > 0 ? Math.round((admittedCount / inquiryCount) * 100) : 0;

    return {
      totalInquiries: inquiryCount,
      interviewScheduledCount: interviewCount,
      acceptedCount,
      feePaidCount,
      admittedCount,
      conversionRate,
      totalFeeCollected: totalFee,
      byGrade,
      bySource,
    };
  }

  generateWhatsAppUrl(app: AdmissionApplication, messageType: 'INTERVIEW' | 'ACCEPTED' | 'FEE_RECEIPT' | 'ADMISSION_CONFIRMED'): string {
    const phone = app.parent.whatsappPhone.replace(/[^0-9]/g, '');
    let msg = '';

    if (messageType === 'INTERVIEW' && app.interview) {
      msg = `*Krypton Public School - Admission Interview Alert* 🏫\n\n` +
        `പ്രിയ രക്ഷിതാവേ (Dear ${app.parent.fatherName || app.parent.motherName}),\n` +
        `${app.student.fullName}-ന്റെ അഡ്മിഷൻ ഇന്റർവ്യൂ തീയതി നിശ്ചയിച്ചു:\n\n` +
        `📅 *തീയതി (Date):* ${app.interview.scheduledDate}\n` +
        `⏰ *സമയം (Time):* ${app.interview.scheduledTime}\n` +
        `📍 *വേദി (Venue):* ${app.interview.venueOrLink}\n` +
        `👤 *അഭിമുഖം നടത്തുന്നയാൾ:* ${app.interview.interviewerName}\n` +
        `🔖 *Application No:* ${app.applicationNumber}\n\n` +
        `കുട്ടിയുടെ ജനന സർട്ടിഫിക്കറ്റിന്റെ അസ്സൽ പകർപ്പ് കൂടെ കരുതുക. സ്വാഗതം!`;
    } else if (messageType === 'ACCEPTED') {
      msg = `*Krypton Public School - Admission Offer Letter* 🎓\n\n` +
        `പ്രിയ ${app.parent.fatherName || app.parent.motherName},\n` +
        `അഭിനന്ദനങ്ങൾ! ${app.student.fullName}-ന് ${app.student.applyingForGrade}-ലേക്ക് അഡ്മിഷൻ അനുവദിച്ചിരിക്കുന്നു.\n\n` +
        `🔖 *Application No:* ${app.applicationNumber}\n` +
        `സീറ്റ് സ്ഥിരീകരിക്കാൻ അഡ്മിഷൻ ഫീസ് അടയ്ക്കാൻ താല്പര്യപ്പെടുന്നു.\n` +
        `പോർട്ടൽ വഴി ഫീസ് അടയ്ക്കാം: https://kryptonschool.edu.in/admissions/track?id=${app.applicationNumber}`;
    } else if (messageType === 'FEE_RECEIPT' && app.payment) {
      msg = `*Krypton Public School - Fee Receipt* 💳\n\n` +
        `പ്രിയ രക്ഷിതാവേ,\n` +
        `${app.student.fullName}-ന്റെ അഡ്മിഷൻ ഫീസ് ₹${app.payment.amount.toLocaleString('en-IN')} വിജയകരമായി ലഭിച്ചു.\n\n` +
        `🧾 *Receipt No:* ${app.payment.receiptNumber}\n` +
        `💳 *Transaction ID:* ${app.payment.transactionId}\n` +
        `ഔദ്യോഗിക അഡ്മിഷൻ നമ്പർ ഉടൻ നൽകുന്നതാണ്. നന്ദി!`;
    } else {
      msg = `*Krypton Public School - Official Admission Confirmed!* 🎉\n\n` +
        `പ്രിയ രക്ഷിതാവേ,\n` +
        `${app.student.fullName} ഇപ്പോൾ ഔദ്യോഗികമായി ക്രിപ്റ്റൺ സ്കൂളിൽ ചേർക്കപ്പെട്ടു!\n\n` +
        `🎓 *Student Admission No:* ${app.enrollment?.officialAdmissionNumber || 'KPS-2026-XXXX'}\n` +
        `🏫 *Class & Section:* ${app.enrollment?.assignedClass} - Section ${app.enrollment?.assignedSection}\n` +
        `🔖 *Roll No:* ${app.enrollment?.rollNumber || '01'}\n\n` +
        `പുതിയ അധ്യയന വർഷത്തിലേക്ക് ഊഷ്മളമായ സ്വാഗതം! 🌟`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }
}

export const admissionsClient = new AdmissionsClient();
