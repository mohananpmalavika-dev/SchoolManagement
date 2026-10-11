import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding subscription plans...');

  // Starter Plan - KES 15,000/year
  const starter = await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small schools just getting started',
      price: 1500000, // KES 15,000 (in cents)
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

  // Professional Plan - KES 40,000/year
  const professional = await prisma.plan.upsert({
    where: { slug: 'professional' },
    update: {},
    create: {
      name: 'Professional',
      slug: 'professional',
      description: 'For medium-sized schools with advanced needs',
      price: 4000000, // KES 40,000 (in cents)
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 500,
      maxStaff: 75,
      maxStorageMB: 15000, // 15GB
      smsCredits: 1500,
      features: [
        'student_management',
        'fee_management',
        'mpesa_integration',
        'attendance',
        'examinations',
        'cbc_assessment',
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

  // Enterprise Plan - KES 80,000/year
  const enterprise = await prisma.plan.upsert({
    where: { slug: 'enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large schools and school groups',
      price: 8000000, // KES 80,000 (in cents)
      billingCycle: 'ANNUAL',
      trialDays: 14,
      maxStudents: 2000,
      maxStaff: 200,
      maxStorageMB: 50000, // 50GB
      smsCredits: 5000,
      features: [
        'student_management',
        'fee_management',
        'mpesa_integration',
        'attendance',
        'examinations',
        'cbc_assessment',
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
  console.log(`   - ${starter.name}: KES ${starter.price / 100}/year`);
  console.log(`   - ${professional.name}: KES ${professional.price / 100}/year`);
  console.log(`   - ${enterprise.name}: KES ${enterprise.price / 100}/year`);
}

seedPlans()
  .catch((e) => {
    console.error('❌ Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
