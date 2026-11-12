import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Indian School ERP database...');

  // Create Plans (INR in paise)
  console.log('Creating subscription plans...');
  await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small schools getting started',
      price: 1500000, // INR 15,000 in paise
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 200,
      maxStaff: 20,
      maxStorageMB: 5000,
      smsCredits: 500,
      features: JSON.stringify([
        'Student Management',
        'Fee Management (UPI & Razorpay)',
        'Basic Reporting',
        'Parent Portal',
        'Attendance Tracking',
      ]),
      isActive: true,
      sortOrder: 1,
    },
  });

  const professionalPlan = await prisma.plan.upsert({
    where: { slug: 'professional' },
    update: {},
    create: {
      name: 'Professional',
      slug: 'professional',
      description: 'For growing CBSE, ICSE & State Board schools',
      price: 4000000, // INR 40,000 in paise
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 500,
      maxStaff: 50,
      maxStorageMB: 10000,
      smsCredits: 1500,
      features: JSON.stringify([
        'All Starter Features',
        'Examination Management',
        'CBSE/ICSE/State Report Cards',
        'WhatsApp & SMS Notifications',
        'UDISE+ & APAAR Compliance',
        'Advanced Analytics',
        'Transport Management',
        'Library Management',
      ]),
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large schools and multi-campus trusts',
      price: 8000000, // INR 80,000 in paise
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 999999,
      maxStaff: 999999,
      maxStorageMB: 50000,
      smsCredits: 5000,
      features: JSON.stringify([
        'All Professional Features',
        'Multi-Campus Support',
        'Custom Branding',
        'API Access',
        'Dedicated Support',
        'Custom Integrations',
        'HR & Payroll Management',
        'Inventory Management',
      ]),
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log('✅ Plans created');

  // Create Demo Tenant
  console.log('Creating demo tenant...');
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Krypton International Public School',
      subdomain: 'demo',
      status: 'TRIAL',
      contactEmail: 'admin@kryptonschool.edu.in',
      contactPhone: '+919847000000',
      address: 'Hill Palace Road, Tripunithura, Kochi, Kerala - 682301',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      currency: 'INR',
    },
  });

  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      planId: professionalPlan.id,
      status: 'TRIAL',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      autoRenew: true,
    },
  });

  console.log('✅ Demo tenant created');

  // Create School (Kerala / Kochi CBSE Default)
  console.log('Creating demo school...');
  const school = await prisma.school.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Krypton International Public School',
      shortName: 'KIPS',
      motto: 'Excellence in Holistic Education',
      vision: 'Empowering learners across India for academic and personal excellence',
      mission: 'Providing NEP 2020 aligned CBSE education in an inclusive environment',
      registrationNumber: 'CBSE/AFF/930124',
      boardAffiliation: 'CBSE',
      udiseCode: '32080501204',
      affiliationNumber: '930124',
      email: 'info@kryptonschool.edu.in',
      phone: '+914842780123',
      address: 'Green Valley Campus, Hill Palace Road, Tripunithura',
      city: 'Kochi',
      district: 'Ernakulam',
      state: 'Kerala',
      pincode: '682301',
      country: 'India',
      schoolType: 'PRIVATE',
      educationLevel: ['PRE_PRIMARY', 'PRIMARY', 'MIDDLE', 'SECONDARY', 'SENIOR_SECONDARY'],
      academicCalendar: 'TWO_TERM',
      startMonth: 4,
      isActive: true,
    },
  });

  console.log('✅ School created');

  // Create Demo Users
  console.log('Creating demo users...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'admin@kryptonschool.edu.in',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+919847000001',
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'principal@kryptonschool.edu.in',
      passwordHash,
      firstName: 'Dr. K. R.',
      lastName: 'Nambiar',
      phone: '+919847000002',
      role: 'PRINCIPAL',
      isActive: true,
      emailVerified: true,
    },
  });

  const studentPasswordHash = await bcrypt.hash('Student@123', 10);
  await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'student@kryptonschool.edu.in',
      passwordHash: studentPasswordHash,
      firstName: 'Ananya',
      lastName: 'Nair',
      phone: '+919847000003',
      role: 'STUDENT',
      isActive: true,
      emailVerified: true,
    },
  });

  const teacherPasswordHash = await bcrypt.hash('Teacher@123', 10);
  await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'teacher@kryptonschool.edu.in',
      passwordHash: teacherPasswordHash,
      firstName: 'Meera',
      lastName: 'Menon',
      phone: '+919847000004',
      role: 'TEACHER',
      isActive: true,
      emailVerified: true,
    },
  });

  const parentPasswordHash = await bcrypt.hash('Parent@123', 10);
  await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'parent@kryptonschool.edu.in',
      passwordHash: parentPasswordHash,
      firstName: 'Rajesh',
      lastName: 'Nair',
      phone: '+919847000005',
      role: 'PARENT',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Users created');

  // Create Indian Academic Year (April 2026 – March 2027) and Two Terms
  console.log('Creating academic year and terms...');
  const academicYear = await prisma.academicYear.create({
    data: {
      tenantId: demoTenant.id,
      name: '2026-27',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true,
    },
  });

  const term1 = await prisma.term.create({
    data: {
      tenantId: demoTenant.id,
      academicYearId: academicYear.id,
      name: 'Term 1 (Apr - Sep)',
      termNumber: 1,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-09-30'),
      isCurrent: true,
    },
  });

  await prisma.term.create({
    data: {
      tenantId: demoTenant.id,
      academicYearId: academicYear.id,
      name: 'Term 2 (Oct - Mar)',
      termNumber: 2,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: false,
    },
  });

  console.log('✅ Academic year and terms created');

  // Create Indian Classes
  console.log('Creating classes...');
  const class1 = await prisma.class.create({
    data: {
      tenantId: demoTenant.id,
      schoolId: school.id,
      name: 'Class 1',
      level: 'Class 1',
      educationLevel: 'PRIMARY',
      sortOrder: 1,
    },
  });

  await prisma.class.create({
    data: {
      tenantId: demoTenant.id,
      schoolId: school.id,
      name: 'Class 2',
      level: 'Class 2',
      educationLevel: 'PRIMARY',
      sortOrder: 2,
    },
  });

  const class1SectionA = await prisma.stream.create({
    data: {
      tenantId: demoTenant.id,
      schoolId: school.id,
      classId: class1.id,
      name: 'Section A',
      capacity: 40,
    },
  });

  console.log('✅ Classes and sections created');

  // Create Indian CBSE / State Board Subjects
  console.log('Creating subjects...');
  const subjects = [
    { name: 'Mathematics', code: 'MATH', educationLevel: 'PRIMARY' as const, isCore: true },
    { name: 'English', code: 'ENG', educationLevel: 'PRIMARY' as const, isCore: true },
    { name: 'Hindi', code: 'HIN', educationLevel: 'PRIMARY' as const, isCore: true },
    { name: 'Malayalam', code: 'MAL', educationLevel: 'PRIMARY' as const, isCore: true },
    { name: 'Environmental Studies (EVS)', code: 'EVS', educationLevel: 'PRIMARY' as const, isCore: true },
  ];

  for (const subject of subjects) {
    await prisma.subject.create({
      data: {
        tenantId: demoTenant.id,
        ...subject,
      },
    });
  }

  console.log('✅ Subjects created');

  // Create Demo Students
  console.log('Creating demo students...');
  const student1 = await prisma.student.create({
    data: {
      tenantId: demoTenant.id,
      admissionNumber: 'KPS2026001',
      firstName: 'Ananya',
      lastName: 'Nair',
      dateOfBirth: new Date('2019-05-15'),
      gender: 'FEMALE',
      aadhaarLast4: '4512',
      state: 'Kerala',
      district: 'Ernakulam',
      pincode: '682301',
      currentClassId: class1.id,
      currentStreamId: class1SectionA.id,
      status: 'ACTIVE',
      admissionDate: new Date('2026-04-06'),
      email: 'ananya.nair@kryptonschool.edu.in',
    },
  });

  await prisma.student.create({
    data: {
      tenantId: demoTenant.id,
      admissionNumber: 'KPS2026002',
      firstName: 'Aarav',
      lastName: 'Patel',
      dateOfBirth: new Date('2019-08-20'),
      gender: 'MALE',
      aadhaarLast4: '6781',
      state: 'Kerala',
      district: 'Ernakulam',
      pincode: '682030',
      currentClassId: class1.id,
      currentStreamId: class1SectionA.id,
      status: 'ACTIVE',
      admissionDate: new Date('2026-04-06'),
      email: 'aarav.patel@kryptonschool.edu.in',
    },
  });

  console.log('✅ Demo students created');

  // Create Guardian
  console.log('Creating guardians...');
  const guardian1 = await prisma.guardian.create({
    data: {
      tenantId: demoTenant.id,
      firstName: 'Deepa',
      lastName: 'Nair',
      phone: '+919847122334',
      email: 'deepa.nair@example.in',
      occupation: 'Software Engineer',
      address: 'Kakkanad, Kochi, Kerala',
    },
  });

  await prisma.guardianStudentLink.create({
    data: {
      guardianId: guardian1.id,
      studentId: student1.id,
      relationship: 'MOTHER',
      isPrimary: true,
      canPickup: true,
      receiveUpdates: true,
    },
  });

  console.log('✅ Guardians created and linked');

  // Create Fee Structure (INR in paise)
  console.log('Creating fee structure...');
  const feeStructure = await prisma.feeStructure.create({
    data: {
      tenantId: demoTenant.id,
      termId: term1.id,
      classId: class1.id,
      name: 'Class 1 Term 1 Fees (INR)',
      description: 'Fee structure for Class 1 students in Term 1 2026-27',
      isActive: true,
    },
  });

  await prisma.feeItem.createMany({
    data: [
      {
        feeStructureId: feeStructure.id,
        name: 'Tuition Fee',
        amount: 1500000, // INR 15,000
        feeCategory: 'TUITION',
        isOptional: false,
        sortOrder: 1,
      },
      {
        feeStructureId: feeStructure.id,
        name: 'Co-Curricular & Activity Fee',
        amount: 200000, // INR 2,000
        feeCategory: 'ACTIVITY',
        isOptional: false,
        sortOrder: 2,
      },
      {
        feeStructureId: feeStructure.id,
        name: 'School Bus Transport Fee',
        amount: 300000, // INR 3,000
        feeCategory: 'TRANSPORT',
        isOptional: true,
        sortOrder: 3,
      },
    ],
  });

  console.log('✅ Fee structure created');

  // Create Invoice for Student
  console.log('Creating invoices...');
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: demoTenant.id,
      invoiceNumber: 'INV-2026-001',
      studentId: student1.id,
      termId: term1.id,
      totalAmount: 1700000, // INR 17,000
      paidAmount: 0,
      balanceAmount: 1700000,
      status: 'PENDING',
      dueDate: new Date('2026-05-15'),
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice.id,
        description: 'Tuition Fee - Term 1',
        amount: 1500000,
        feeCategory: 'TUITION',
      },
      {
        invoiceId: invoice.id,
        description: 'Activity Fee - Term 1',
        amount: 200000,
        feeCategory: 'ACTIVITY',
      },
    ],
  });

  console.log('✅ Invoices created');
  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('Super Admin: admin@kryptonschool.edu.in / Admin@123');
  console.log('Principal:   principal@kryptonschool.edu.in / Admin@123');
  console.log('Demo School Subdomain: demo.kryptonschool.local');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
