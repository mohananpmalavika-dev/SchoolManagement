import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding subscription plans (INR)...');

  // Starter Plan - INR 15,000/year
  const starter = await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small Indian schools just getting started',
      price: 1500000, // INR 15,000 (in paise)
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 200,
      maxStaff: 30,
      maxStorageMB: 5000, // 5GB
      smsCredits: 500,
      features: [
        'student_management',
        'fee_management',
        'attendance',
        'basic_reporting',
      ],
      sortOrder: 1,
      isActive: true,
    },
  });

  // Professional Plan - INR 40,000/year
  const professional = await prisma.plan.upsert({
    where: { slug: 'professional' },
    update: {},
    create: {
      name: 'Professional',
      slug: 'professional',
      description: 'For growing CBSE, ICSE & State Board schools',
      price: 4000000, // INR 40,000 (in paise)
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 500,
      maxStaff: 75,
      maxStorageMB: 15000, // 15GB
      smsCredits: 1500,
      features: [
        'student_management',
        'fee_management',
        'razorpay_upi_payments',
        'attendance',
        'examinations',
        'cbse_icse_state_grading',
        'udise_apaar_compliance',
        'communications',
        'timetable',
        'advanced_reporting',
        'parent_portal',
        'teacher_portal',
      ],
      sortOrder: 2,
      isActive: true,
    },
  });

  // Enterprise Plan - INR 80,000/year
  const enterprise = await prisma.plan.upsert({
    where: { slug: 'enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large institutions and multi-campus school trusts',
      price: 8000000, // INR 80,000 (in paise)
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 2000,
      maxStaff: 200,
      maxStorageMB: 50000, // 50GB
      smsCredits: 5000,
      features: [
        'student_management',
        'fee_management',
        'razorpay_upi_payments',
        'attendance',
        'examinations',
        'cbse_icse_state_grading',
        'udise_apaar_compliance',
        'communications',
        'timetable',
        'library',
        'transport',
        'inventory',
        'hr_management',
        'advanced_reporting',
        'analytics',
        'parent_portal',
        'teacher_portal',
        'multi_campus',
        'api_access',
        'custom_branding',
        'priority_support',
      ],
      sortOrder: 3,
      isActive: true,
    },
  });

  console.log('✅ Plans seeded successfully:');
  console.log(`   - ${starter.name}: INR ${starter.price / 100}/year`);
  console.log(`   - ${professional.name}: INR ${professional.price / 100}/year`);
  console.log(`   - ${enterprise.name}: INR ${enterprise.price / 100}/year`);
}

seedPlans()
  .catch((e) => {
    console.error('❌ Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
