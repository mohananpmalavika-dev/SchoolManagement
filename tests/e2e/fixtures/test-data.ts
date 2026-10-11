import { randomBytes } from 'crypto';

/**
 * Test data generators for E2E tests
 * Generates unique, realistic test data
 */

export class TestDataGenerator {
  /**
   * Generate unique email for testing
   */
  static generateEmail(prefix: string = 'test'): string {
    const random = randomBytes(4).toString('hex');
    return `${prefix}-${random}@test-krypton.com`;
  }

  /**
   * Generate strong password
   */
  static generatePassword(): string {
    const random = randomBytes(8).toString('hex');
    return `Test@${random}123`; // Meets password requirements
  }

  /**
   * Generate unique school name
   */
  static generateSchoolName(): string {
    const adjectives = ['Bright', 'Future', 'Excellence', 'Pioneer', 'Victory', 'Summit'];
    const nouns = ['Academy', 'School', 'Institute', 'College', 'High'];
    const random = randomBytes(2).toString('hex');
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj} ${noun} ${random}`;
  }

  /**
   * Generate user data
   */
  static generateUser(role: 'PRINCIPAL' | 'TEACHER' | 'GUARDIAN' = 'TEACHER') {
    return {
      email: this.generateEmail(role.toLowerCase()),
      password: this.generatePassword(),
      firstName: `Test${role}`,
      lastName: randomBytes(4).toString('hex'),
      role,
    };
  }

  /**
   * Generate school data
   */
  static generateSchool() {
    const name = this.generateSchoolName();
    
    return {
      name,
      email: `admin@${name.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: '+254712345678',
      address: '123 Test Street, Nairobi',
      county: 'Nairobi',
      country: 'Kenya',
      motto: 'Excellence in Education',
      website: `https://${name.toLowerCase().replace(/\s+/g, '')}.ac.ke`,
    };
  }

  /**
   * Generate student data
   */
  static generateStudent(classId?: string) {
    const firstName = ['John', 'Mary', 'Peter', 'Jane', 'David', 'Sarah'][Math.floor(Math.random() * 6)];
    const lastName = ['Kamau', 'Wanjiku', 'Otieno', 'Muthoni', 'Kipchoge', 'Akinyi'][Math.floor(Math.random() * 6)];
    const random = randomBytes(4).toString('hex');
    
    return {
      firstName,
      lastName,
      admissionNumber: `ADM${Date.now()}${random.substring(0, 4).toUpperCase()}`,
      dateOfBirth: '2010-01-15',
      gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
      classId,
      nationalId: `${30000000 + Math.floor(Math.random() * 9999999)}`,
    };
  }

  /**
   * Generate attendance data
   */
  static generateAttendance(studentId: string, classId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT') {
    return {
      studentId,
      classId,
      date: new Date().toISOString().split('T')[0],
      period: 'MORNING',
      status,
      markedBy: 'system-test',
    };
  }

  /**
   * Generate test file buffer
   */
  static generateTestFile(sizeKB: number = 10): Buffer {
    // Generate a simple test image (1x1 pixel PNG)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
    ]);
    
    // Pad to desired size
    const padding = Buffer.alloc(sizeKB * 1024 - pngHeader.length, 0);
    
    return Buffer.concat([pngHeader, padding]);
  }
}

/**
 * Test tenants for cross-tenant isolation testing
 */
export const TEST_TENANTS = {
  TENANT_A: {
    id: 'tenant-a-test',
    name: 'Test School A',
    email: 'admin@schoola.test',
  },
  TENANT_B: {
    id: 'tenant-b-test',
    name: 'Test School B',
    email: 'admin@schoolb.test',
  },
};

/**
 * Test users for each tenant
 */
export const TEST_USERS = {
  TENANT_A_ADMIN: {
    email: 'admin-a@test.com',
    password: 'TestAdmin@123',
    role: 'PRINCIPAL',
  },
  TENANT_A_TEACHER: {
    email: 'teacher-a@test.com',
    password: 'TestTeacher@123',
    role: 'TEACHER',
  },
  TENANT_B_ADMIN: {
    email: 'admin-b@test.com',
    password: 'TestAdmin@456',
    role: 'PRINCIPAL',
  },
  TENANT_B_TEACHER: {
    email: 'teacher-b@test.com',
    password: 'TestTeacher@456',
    role: 'TEACHER',
  },
};
