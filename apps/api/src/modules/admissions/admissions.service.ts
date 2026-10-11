import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AdmissionApplication,
  AdmissionStage,
  CreateAdmissionInput,
  AdmissionFunnelStats,
  AdmissionInterview,
  AdmissionPayment,
  AdmissionEnrollment,
} from '@krypton/types';

@Injectable()
export class AdmissionsService {
  private applications: AdmissionApplication[] = [
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
      },
      parent: {
        fatherName: 'Rajesh Nair',
        motherName: 'Deepa Nair',
        email: 'rajesh.nair@gmail.com',
        phone: '+91 98471 22334',
        whatsappPhone: '+91 98471 22334',
        address: 'Villa 12, Skyline Greenwoods, Kakkanad',
        city: 'Kochi',
        pincode: '682030',
      },
      documents: {
        birthCertificateUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
        studentPhotoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300',
      },
      transportRequired: true,
      hostelRequired: false,
      siblingEnrolled: false,
      notes: [],
      timeline: [
        {
          id: 'time-1',
          stage: 'INQUIRY_RECEIVED',
          title: 'Online Application Received',
          description: 'Parent applied via web portal.',
          timestamp: new Date().toISOString(),
          actor: 'Web Portal',
        },
      ],
      tags: ['Kindergarten', 'Bus Route 4'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
        nationality: 'Indian',
      },
      parent: {
        fatherName: 'Joseph Mathew',
        motherName: 'Ann Mary',
        email: 'mathew.joseph@gmail.com',
        phone: '+91 97450 88990',
        whatsappPhone: '+91 97450 88990',
        address: 'Olive Courtyard, Kadavanthra',
        city: 'Kochi',
        pincode: '682020',
      },
      documents: {
        birthCertificateUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
        studentPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
      },
      interview: {
        scheduledDate: '2026-10-14',
        scheduledTime: '10:30',
        interviewerName: 'Mrs. Susan Thomas (Vice Principal)',
        venueOrLink: 'Conference Room 2',
        isVirtual: false,
      },
      transportRequired: true,
      hostelRequired: false,
      siblingEnrolled: false,
      notes: [],
      timeline: [],
      tags: ['Interview Scheduled'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
        nationality: 'Indian',
      },
      parent: {
        fatherName: 'Unnikrishnan Menon',
        motherName: 'Radhika Menon',
        email: 'unni.menon@tcs.com',
        phone: '+91 94460 33445',
        whatsappPhone: '+91 94460 33445',
        address: 'Tower C, Heera Park, Thevara',
        city: 'Kochi',
        pincode: '682013',
      },
      documents: {
        birthCertificateUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
        studentPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      },
      payment: {
        amount: 25000,
        currency: 'INR',
        receiptNumber: 'RCP-2026-4091',
        paidAt: new Date().toISOString(),
        paymentMethod: 'UPI',
        feeType: 'Admission Fee',
        transactionId: 'TXN-UPI-99281',
      },
      transportRequired: true,
      hostelRequired: false,
      siblingEnrolled: false,
      notes: [],
      timeline: [],
      tags: ['Class 11', 'Fee Cleared'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  findAll(filters?: { search?: string; stage?: AdmissionStage; grade?: string }) {
    let list = this.applications;
    if (!filters) return list;

    if (filters.stage) {
      list = list.filter((a) => a.stage === filters.stage);
    }
    if (filters.grade && filters.grade !== 'ALL') {
      list = list.filter((a) => a.student.applyingForGrade === filters.grade);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.applicationNumber.toLowerCase().includes(q) ||
          a.student.fullName.toLowerCase().includes(q) ||
          a.parent.phone.includes(q)
      );
    }
    return list;
  }

  findById(id: string) {
    const app = this.applications.find(
      (a) => a.id === id || a.applicationNumber === id
    );
    if (!app) {
      throw new NotFoundException(`Admission application ${id} not found`);
    }
    return app;
  }

  create(input: CreateAdmissionInput): AdmissionApplication {
    const count = this.applications.length + 1;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appNumber = `APP-2026-${count.toString().padStart(3, '0')}${randomSuffix.toString().slice(-1)}`;
    const now = new Date().toISOString();

    const app: AdmissionApplication = {
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
              author: 'Applicant',
              text: input.notes,
              createdAt: now,
            },
          ]
        : [],
      timeline: [
        {
          id: `time-${Date.now()}`,
          stage: 'INQUIRY_RECEIVED',
          title: 'Online Application Received',
          description: `Applied for ${input.student.applyingForGrade}.`,
          timestamp: now,
          actor: 'Online Portal',
        },
      ],
      tags: ['New Inquiry', input.student.applyingForGrade],
      createdAt: now,
      updatedAt: now,
    };

    this.applications.unshift(app);
    return app;
  }

  updateStage(id: string, stage: AdmissionStage, actor = 'Admin', note?: string) {
    const app = this.findById(id);
    const now = new Date().toISOString();

    app.stage = stage;
    app.updatedAt = now;
    app.timeline.unshift({
      id: `time-${Date.now()}`,
      stage,
      title: `Moved to ${stage.replace('_', ' ')}`,
      description: note || `Application advanced in CRM pipeline.`,
      timestamp: now,
      actor,
    });

    return app;
  }

  scheduleInterview(id: string, interview: AdmissionInterview, actor = 'Coordinator') {
    const app = this.findById(id);
    const now = new Date().toISOString();

    app.stage = 'INTERVIEW_SCHEDULED';
    app.interview = interview;
    app.updatedAt = now;
    app.timeline.unshift({
      id: `time-${Date.now()}`,
      stage: 'INTERVIEW_SCHEDULED',
      title: 'Interview Scheduled',
      description: `${interview.scheduledDate} at ${interview.scheduledTime} with ${interview.interviewerName}`,
      timestamp: now,
      actor,
    });

    return app;
  }

  recordPayment(id: string, payment: AdmissionPayment, actor = 'Accounts') {
    const app = this.findById(id);
    const now = new Date().toISOString();

    app.stage = 'FEE_PAID';
    app.payment = payment;
    app.updatedAt = now;
    app.timeline.unshift({
      id: `time-${Date.now()}`,
      stage: 'FEE_PAID',
      title: 'Fee Paid',
      description: `₹${payment.amount} paid via ${payment.paymentMethod}. Receipt: ${payment.receiptNumber}`,
      timestamp: now,
      actor,
    });

    return app;
  }

  completeAdmission(id: string, enrollment: AdmissionEnrollment, actor = 'Registrar') {
    const app = this.findById(id);
    const now = new Date().toISOString();

    app.stage = 'ADMITTED';
    app.enrollment = enrollment;
    app.updatedAt = now;
    app.timeline.unshift({
      id: `time-${Date.now()}`,
      stage: 'ADMITTED',
      title: 'Official Admission Complete',
      description: `Official Admission No: ${enrollment.officialAdmissionNumber} (Class ${enrollment.assignedClass})`,
      timestamp: now,
      actor,
    });

    return app;
  }

  getFunnelStats(): AdmissionFunnelStats {
    const total = this.applications.length;
    const interview = this.applications.filter(
      (a) => a.stage !== 'INQUIRY_RECEIVED'
    ).length;
    const accepted = this.applications.filter(
      (a) => a.stage === 'ACCEPTED' || a.stage === 'FEE_PAID' || a.stage === 'ADMITTED'
    ).length;
    const feePaid = this.applications.filter(
      (a) => a.stage === 'FEE_PAID' || a.stage === 'ADMITTED'
    ).length;
    const admitted = this.applications.filter((a) => a.stage === 'ADMITTED').length;

    const totalFee = this.applications.reduce(
      (sum, a) => sum + (a.payment?.amount || 0),
      0
    );

    return {
      totalInquiries: total,
      interviewScheduledCount: interview,
      acceptedCount: accepted,
      feePaidCount: feePaid,
      admittedCount: admitted,
      conversionRate: total > 0 ? Math.round((admitted / total) * 100) : 0,
      totalFeeCollected: totalFee,
      byGrade: {},
      bySource: {
        WEBSITE_PORTAL: 0,
        WALK_IN: 0,
        WHATSAPP: 0,
        SOCIAL_MEDIA: 0,
        PARENT_REFERRAL: 0,
        EDUCATION_EXPO: 0,
      },
    };
  }
}
