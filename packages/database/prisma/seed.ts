import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Plans
  console.log('Creating subscription plans...');
  const starterPlan = await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small schools getting started',
      price: 1500000, // KES 15,000 in cents
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 200,
      maxStaff: 20,
      maxStorageMB: 5000,
      smsCredits: 500,
      features: JSON.stringify([
        'Student Management',
        'Fee Management',
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
      description: 'For growing schools with advanced needs',
      price: 4000000, // KES 40,000 in cents
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 500,
      maxStaff: 50,
      maxStorageMB: 10000,
      smsCredits: 1500,
      features: JSON.stringify([
        'All Starter Features',
        'Examination Management',
        'Report Cards',
        'SMS Notifications',
        'Advanced Analytics',
        'Transport Management',
        'Library Management',
      ]),
      isActive: true,
      sortOrder: 2,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { slug: 'enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large schools and school groups',
      price: 8000000, // KES 80,000 in cents
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
        'HR Management',
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
      name: 'Demo School',
      subdomain: 'demo',
      status: 'TRIAL',
      contactEmail: 'admin@demo.kryptonschool.com',
      contactPhone: '+254700000000',
      address: 'Nairobi, Kenya',
      timezone: 'Africa/Nairobi',
      locale: 'en',
      currency: 'KES',
    },
  });

  // Create Subscription for Demo Tenant
  const subscription = await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      planId: professionalPlan.id,
      status: 'TRIAL',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      autoRenew: true,
    },
  });

  console.log('✅ Demo tenant created');

  // Create School
  console.log('Creating demo school...');
  const school = await prisma.school.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Demo Academy',
      shortName: 'DA',
      motto: 'Excellence in Education',
      vision: 'To be the leading educational institution in Kenya',
      mission: 'Providing quality education for all',
      email: 'info@demoacademy.ac.ke',
      phone: '+254700000000',
      address: '123 Education Road',
      city: 'Nairobi',
      county: 'Nairobi',
      postalCode: '00100',
      country: 'Kenya',
      schoolType: 'PRIVATE',
      educationLevel: ['PRIMARY', 'JUNIOR_SECONDARY'],
      academicCalendar: 'THREE_TERM',
      startMonth: 1,
      isActive: true,
    },
  });

  console.log('✅ School created');

  // Create Super Admin User
  console.log('Creating super admin user...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  
  const superAdmin = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'admin@kryptonschool.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+254700000001',
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  // Create School Admin User
  const schoolAdmin = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'principal@demoacademy.ac.ke',
      passwordHash,
      firstName: 'John',
      lastName: 'Kamau',
      phone: '+254700000002',
      role: 'PRINCIPAL',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Users created');

  // Create Academic Year and Terms
  console.log('Creating academic year and terms...');
  const academicYear = await prisma.academicYear.create({
    data: {
      tenantId: demoTenant.id,
      name: '2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isCurrent: true,
    },
  });

  const term1 = await prisma.term.create({
    data: {
      tenantId: demoTenant.id,
      academicYearId: academicYear.id,
      name: 'Term 1',
      termNumber: 1,
      startDate: new Date('2024-01-08'),
      endDate: new Date('2024-04-05'),
      isCurrent: true,
    },
  });

  const term2 = await prisma.term.create({
    data: {
      tenantId: demoTenant.id,
      academicYearId: academicYear.id,
      name: 'Term 2',
      termNumber: 2,
      startDate: new Date('2024-05-06'),
      endDate: new Date('2024-08-02'),
      isCurrent: false,
    },
  });

  const term3 = await prisma.term.create({
    data: {
      tenantId: demoTenant.id,
      academicYearId: academicYear.id,
      name: 'Term 3',
      termNumber: 3,
      startDate: new Date('2024-09-02'),
      endDate: new Date('2024-11-22'),
      isCurrent: false,
    },
  });

  console.log('✅ Academic year and terms created');

  // Create Classes
  console.log('Creating classes...');
  const grade1 = await prisma.class.create({
    data: {
      tenantId: demoTenant.id,
      schoolId: school.id,
      name: 'Grade 1',
      level: 'Grade 1',
      educationLevel: 'PRIMARY',
      sortOrder: 1,
    },
  });

  const grade2 = await prisma.class.create({
    data: {
      tenantId: demoTenant.id,
      schoolId: school.id,
      name: 'Grade 2',
      level: 'Grade 2',
      educationLevel: 'PRIMARY',
      sortOrder: 2,
    },
  });

  // Create Streams
  const grade1StreamA = await prisma.stream.create({
    data: {
      tenantId: demoTenant.id,
      schoolId: school.id,
      classId: grade1.id,
      name: 'Stream A',
      capacity: 40,
    },
  });

  console.log('✅ Classes and streams created');

  // Create Subjects
  console.log('Creating subjects...');
  const subjects = [
    { name: 'Mathematics', code: 'MATH', educationLevel: 'PRIMARY', isCore: true },
    { name: 'English', code: 'ENG', educationLevel: 'PRIMARY', isCore: true },
    { name: 'Kiswahili', code: 'KIS', educationLevel: 'PRIMARY', isCore: true },
    { name: 'Science', code: 'SCI', educationLevel: 'PRIMARY', isCore: true },
    { name: 'Social Studies', code: 'SST', educationLevel: 'PRIMARY', isCore: true },
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
      admissionNumber: 'STD001',
      firstName: 'Jane',
      lastName: 'Wanjiku',
      dateOfBirth: new Date('2015-05-15'),
      gender: 'FEMALE',
      currentClassId: grade1.id,
      currentStreamId: grade1StreamA.id,
      status: 'ACTIVE',
      admissionDate: new Date('2024-01-08'),
      email: 'jane.wanjiku@example.com',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      tenantId: demoTenant.id,
      admissionNumber: 'STD002',
      firstName: 'James',
      lastName: 'Ochieng',
      dateOfBirth: new Date('2015-08-20'),
      gender: 'MALE',
      currentClassId: grade1.id,
      currentStreamId: grade1StreamA.id,
      status: 'ACTIVE',
      admissionDate: new Date('2024-01-08'),
      email: 'james.ochieng@example.com',
    },
  });

  console.log('✅ Demo students created');

  // Create Guardian
  console.log('Creating guardians...');
  const guardian1 = await prisma.guardian.create({
    data: {
      tenantId: demoTenant.id,
      firstName: 'Mary',
      lastName: 'Wanjiku',
      phone: '+254700123456',
      email: 'mary.wanjiku@example.com',
      occupation: 'Teacher',
      address: 'Nairobi',
    },
  });

  // Link Guardian to Student
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

  // Create Fee Structure
  console.log('Creating fee structure...');
  const feeStructure = await prisma.feeStructure.create({
    data: {
      tenantId: demoTenant.id,
      termId: term1.id,
      classId: grade1.id,
      name: 'Grade 1 Term 1 Fees',
      description: 'Fee structure for Grade 1 students in Term 1 2024',
      isActive: true,
    },
  });

  // Create Fee Items
  await prisma.feeItem.createMany({
    data: [
      {
        feeStructureId: feeStructure.id,
        name: 'Tuition Fee',
        amount: 1500000, // KES 15,000
        feeCategory: 'TUITION',
        isOptional: false,
        sortOrder: 1,
      },
      {
        feeStructureId: feeStructure.id,
        name: 'Activity Fee',
        amount: 200000, // KES 2,000
        feeCategory: 'ACTIVITY',
        isOptional: false,
        sortOrder: 2,
      },
      {
        feeStructureId: feeStructure.id,
        name: 'Transport Fee',
        amount: 300000, // KES 3,000
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
      invoiceNumber: 'INV-2024-001',
      studentId: student1.id,
      termId: term1.id,
      totalAmount: 1700000, // KES 17,000
      paidAmount: 0,
      balanceAmount: 1700000,
      status: 'PENDING',
      dueDate: new Date('2024-02-15'),
    },
  });

  // Create Invoice Items
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
  console.log('Super Admin:');
  console.log('  Email: admin@kryptonschool.com');
  console.log('  Password: Admin@123');
  console.log('\nSchool Admin:');
  console.log('  Email: principal@demoacademy.ac.ke');
  console.log('  Password: Admin@123');
  console.log('\nDemo School Subdomain: demo.kryptonschool.local');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
