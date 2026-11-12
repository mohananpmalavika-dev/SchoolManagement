import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const url = new URL(process.env.DATABASE_URL || 'postgresql://invalid');
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('Demo fixtures are restricted to a local development database');
  }

  const hash = await bcrypt.hash('KryptonDemo@2026', 12);
  const year = new Date().getFullYear();

  const plan = await db.plan.upsert({
    where: { slug: 'professional' },
    update: {},
    create: {
      name: 'Professional',
      slug: 'professional',
      price: 4000000, // INR 40,000 in paise
      maxStudents: 500,
      maxStaff: 75,
      features: ['fees', 'attendance', 'examinations', 'library', 'transport', 'udise_compliance'],
    },
  });

  const tenant = await db.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Krypton International Public School',
      subdomain: 'demo',
      contactEmail: 'office@kryptonschool.edu.in',
      contactPhone: '+919847000100',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      currency: 'INR',
      status: 'ACTIVE',
    },
  });

  const second = await db.tenant.upsert({
    where: { subdomain: 'isolation' },
    update: {},
    create: {
      name: 'Isolation Test School',
      subdomain: 'isolation',
      contactEmail: 'office@isolation.test',
      contactPhone: '+919847000200',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      currency: 'INR',
      status: 'ACTIVE',
    },
  });

  const accounts = [
    ['admin@kryptonschool.edu.in', 'Amina', 'Kareem', 'SUPER_ADMIN'],
    ['principal@kryptonschool.edu.in', 'Dr. K. R.', 'Nambiar', 'PRINCIPAL'],
    ['teacher@kryptonschool.edu.in', 'Meera', 'Menon', 'TEACHER'],
    ['parent@kryptonschool.edu.in', 'Rajesh', 'Nair', 'PARENT'],
    ['outsider@isolation.test', 'Test', 'Isolation', 'PRINCIPAL'],
  ] as const;

  const users: Record<string, any> = {};
  for (const [email, firstName, lastName, role] of accounts) {
    users[role + (email.startsWith('outsider') ? '_OTHER' : '')] = await db.user.upsert({
      where: {
        tenantId_email: {
          tenantId: email.startsWith('outsider') ? second.id : tenant.id,
          email,
        },
      },
      update: { passwordHash: hash, isActive: true },
      create: {
        tenantId: email.startsWith('outsider') ? second.id : tenant.id,
        email,
        firstName,
        lastName,
        role,
        passwordHash: hash,
        emailVerified: true,
      },
    });
  }

  let school = await db.school.findFirst({ where: { tenantId: tenant.id } });
  school ||= await db.school.create({
    data: {
      tenantId: tenant.id,
      name: tenant.name,
      email: tenant.contactEmail,
      phone: tenant.contactPhone,
      address: 'Hill Palace Road, Tripunithura',
      city: 'Kochi',
      district: 'Ernakulam',
      state: 'Kerala',
      pincode: '682301',
      country: 'India',
      boardAffiliation: 'CBSE',
      schoolType: 'PRIVATE',
      educationLevel: ['PRIMARY', 'MIDDLE', 'SECONDARY'],
      academicCalendar: 'TWO_TERM',
      startMonth: 4,
    },
  });

  const academicLabel = `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
  let academicYear = await db.academicYear.findFirst({ where: { tenantId: tenant.id, name: academicLabel } });
  academicYear ||= await db.academicYear.create({
    data: {
      tenantId: tenant.id,
      name: academicLabel,
      startDate: new Date(`${year}-04-01`),
      endDate: new Date(`${year + 1}-03-31`),
      isCurrent: true,
    },
  });

  let term = await db.term.findFirst({ where: { tenantId: tenant.id, academicYearId: academicYear.id, termNumber: 1 } });
  term ||= await db.term.create({
    data: {
      tenantId: tenant.id,
      academicYearId: academicYear.id,
      name: `Term 1 (${academicLabel})`,
      termNumber: 1,
      startDate: new Date(`${year}-04-01`),
      endDate: new Date(`${year}-09-30`),
      isCurrent: true,
    },
  });

  let cls = await db.class.findFirst({ where: { tenantId: tenant.id, name: 'Class 5' } });
  cls ||= await db.class.create({
    data: {
      tenantId: tenant.id,
      schoolId: school.id,
      name: 'Class 5',
      level: 'Class 5',
      educationLevel: 'PRIMARY',
    },
  });

  await db.class.findFirst({ where: { tenantId: tenant.id, name: 'Class 6' } }) ||
    (await db.class.create({
      data: {
        tenantId: tenant.id,
        schoolId: school.id,
        name: 'Class 6',
        level: 'Class 6',
        educationLevel: 'MIDDLE',
      },
    }));

  let teacher = await db.staff.findFirst({ where: { tenantId: tenant.id, userId: users.TEACHER.id } });
  teacher ||= await db.staff.create({
    data: {
      tenantId: tenant.id,
      userId: users.TEACHER.id,
      staffNumber: 'T001',
      firstName: 'Meera',
      lastName: 'Menon',
      email: users.TEACHER.email,
      phone: '+919847000101',
      gender: 'FEMALE',
      department: 'TEACHING',
      position: 'Class Teacher',
      employmentType: 'PERMANENT',
      hireDate: new Date(`${year}-04-01`),
      isTeacher: true,
    },
  });

  const names = [
    ['Aarav', 'Patel'],
    ['Ananya', 'Nair'],
    ['Malavika', 'Menon'],
    ['Devadath', 'Krishnan'],
    ['Rohan', 'Matthew'],
    ['Fatima', 'Zahra'],
    ['Ishaan', 'Verma'],
    ['Diya', 'Joseph'],
    ['Kabir', 'Sharma'],
    ['Meenakshi', 'Pillai'],
    ['Aditya', 'Rao'],
    ['Neha', 'Kulkarni'],
  ];

  const students = [];
  for (let i = 0; i < names.length; i++) {
    students.push(
      await db.student.upsert({
        where: { tenantId_admissionNumber: { tenantId: tenant.id, admissionNumber: 'KPS' + String(i + 1).padStart(4, '0') } },
        update: {},
        create: {
          tenantId: tenant.id,
          admissionNumber: 'KPS' + String(i + 1).padStart(4, '0'),
          firstName: names[i][0],
          lastName: names[i][1],
          dateOfBirth: new Date(`${year - 11}-05-12`),
          gender: i % 2 ? 'FEMALE' : 'MALE',
          state: 'Kerala',
          district: 'Ernakulam',
          pincode: '682301',
          admissionDate: new Date(`${year}-04-06`),
          currentClassId: cls.id,
        },
      }),
    );
  }

  let guardian = await db.guardian.findFirst({ where: { tenantId: tenant.id, userId: users.PARENT.id } });
  guardian ||= await db.guardian.create({
    data: {
      tenantId: tenant.id,
      userId: users.PARENT.id,
      firstName: 'Rajesh',
      lastName: 'Nair',
      phone: '+919847000103',
      email: users.PARENT.email,
    },
  });

  for (const student of students.slice(0, 2)) {
    await db.guardianStudentLink.upsert({
      where: { guardianId_studentId: { guardianId: guardian.id, studentId: student.id } },
      update: {},
      create: { guardianId: guardian.id, studentId: student.id, relationship: 'FATHER', isPrimary: true },
    });
  }

  const subjects = [];
  for (const [name, code] of [
    ['Mathematics', 'MAT'],
    ['English', 'ENG'],
    ['Science', 'SCI'],
    ['Hindi', 'HIN'],
    ['Malayalam', 'MAL'],
  ]) {
    let subject = await db.subject.findFirst({ where: { tenantId: tenant.id, code } });
    subject ||= await db.subject.create({
      data: { tenantId: tenant.id, name, code, educationLevel: 'PRIMARY', isCore: true },
    });
    subjects.push(subject);
  }

  for (let day = 1; day <= 5; day++) {
    for (let i = 0; i < 3; i++) {
      const start = ['08:30', '09:15', '10:00'][i];
      const end = ['09:15', '10:00', '10:45'][i];
      if (!(await db.timetableEntry.findFirst({ where: { tenantId: tenant.id, teacherId: teacher.id, dayOfWeek: day, period: String(i + 1) } }))) {
        await db.timetableEntry.create({
          data: {
            tenantId: tenant.id,
            classId: cls.id,
            teacherId: teacher.id,
            subjectId: subjects[i].id,
            dayOfWeek: day,
            period: String(i + 1),
            startTime: start,
            endTime: end,
            room: 'Room 5A',
          },
        });
      }
    }
  }

  let exam = await db.examination.findFirst({ where: { tenantId: tenant.id, name: 'Periodic Assessment 1' } });
  exam ||= await db.examination.create({
    data: {
      tenantId: tenant.id,
      classId: cls.id,
      termId: term.id,
      name: 'Periodic Assessment 1',
      isPublished: true,
      startDate: new Date(`${year}-07-10`),
      endDate: new Date(`${year}-07-15`),
      subjects: { create: subjects.slice(0, 3).map((s) => ({ subjectId: s.id, totalMarks: 100 })) },
    },
  });

  (await db.examination.findFirst({ where: { tenantId: tenant.id, name: 'Half-Yearly Examination' } })) ||
    (await db.examination.create({
      data: {
        tenantId: tenant.id,
        classId: cls.id,
        termId: term.id,
        name: 'Half-Yearly Examination',
        isPublished: false,
        startDate: new Date(`${year}-09-15`),
        endDate: new Date(`${year}-09-25`),
        subjects: { create: subjects.slice(0, 3).map((s) => ({ subjectId: s.id, totalMarks: 100 })) },
      },
    }));

  for (let index = 0; index < students.length; index++) {
    const student = students[index];
    for (let i = 0; i < 3; i++) {
      const score = 72 + ((index * 3 + i * 5) % 25);
      await db.grade.upsert({
        where: { examinationId_studentId_subjectId: { examinationId: exam.id, studentId: student.id, subjectId: subjects[i].id } },
        update: {},
        create: {
          tenantId: tenant.id,
          examinationId: exam.id,
          studentId: student.id,
          subjectId: subjects[i].id,
          score,
          marks: score,
          totalMarks: 100,
          percentage: score,
          letterGrade: score >= 91 ? 'A1' : score >= 81 ? 'A2' : 'B1',
          grade: score >= 91 ? 'A1' : score >= 81 ? 'A2' : 'B1',
        },
      });
    }
    const invoiceNumber = 'DEMO-' + student.admissionNumber;
    await db.invoice.upsert({
      where: { tenantId_invoiceNumber: { tenantId: tenant.id, invoiceNumber } },
      update: {},
      create: {
        tenantId: tenant.id,
        invoiceNumber,
        studentId: student.id,
        termId: term.id,
        totalAmount: 2450000, // INR 24,500
        paidAmount: 0,
        balanceAmount: 2450000,
        dueDate: new Date(`${year}-11-01`),
        invoiceItems: { create: { description: 'Term 1 Tuition Fee (CBSE)', amount: 2450000, feeCategory: 'TUITION' } },
      },
    });
    for (let ago = 0; ago < 7; ago++) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - ago);
      date.setUTCHours(0, 0, 0, 0);
      if ([0, 6].includes(date.getUTCDay())) continue;
      await db.attendanceRecord.upsert({
        where: { tenantId_studentId_date_period: { tenantId: tenant.id, studentId: student.id, date, period: 1 } },
        update: {},
        create: {
          tenantId: tenant.id,
          studentId: student.id,
          classId: cls.id,
          date,
          period: 1,
          status: (index + ago) % 11 === 0 ? 'ABSENT' : 'PRESENT',
        },
      });
    }
  }

  if (!(await db.schoolEvent.findFirst({ where: { tenantId: tenant.id, title: 'Parent-Teacher Open House' } }))) {
    const date = new Date(Date.now() + 7 * 86400000);
    await db.schoolEvent.create({
      data: {
        tenantId: tenant.id,
        title: 'Parent-Teacher Open House',
        description: 'Term 1 CBSE academic progress review with class teachers.',
        eventType: 'MEETING',
        category: 'ACADEMIC',
        location: 'School Auditorium, Kochi',
        startDate: date,
        endDate: date,
      },
    });
  }

  await db.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      planId: plan.id,
      status: 'ACTIVE',
      startDate: new Date(`${year}-04-01`),
      endDate: new Date(`${year + 1}-03-31`),
    },
  });

  if (!(await db.book.findFirst({ where: { tenantId: tenant.id, isbn: 'DEMO001' } }))) {
    await db.book.create({
      data: {
        tenantId: tenant.id,
        isbn: 'DEMO001',
        title: 'Wings of Fire: An Autobiography',
        author: 'A. P. J. Abdul Kalam',
        category: 'Biography',
        quantity: 5,
        available: 5,
      },
    });
  }

  console.log('Local Indian demo ready. Use the documented demo accounts with password KryptonDemo@2026.');
}

main().finally(() => db.$disconnect());
