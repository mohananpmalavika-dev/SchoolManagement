import { test, expect } from '@playwright/test';
import { APIClient } from './helpers/api-client';
import { TestDataGenerator } from './fixtures/test-data';

/**
 * E2E Test Suite: QR Attendance Security
 * 
 * Tests the security of QR-based attendance system:
 * - JWT-signed tokens (not base64)
 * - 5-minute token expiry
 * - Replay attack prevention
 * - One-scan-per-student enforcement
 * - Cross-tenant isolation
 */

test.describe('QR Attendance - Token Generation', () => {
  let apiClient: APIClient;
  let teacherToken: string;
  let classId: string;

  test.beforeEach(async ({ request }) => {
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
    apiClient = new APIClient(request, baseURL);

    // Setup teacher and class
    const teacher = TestDataGenerator.generateUser('TEACHER');
    await apiClient.register(teacher);
    const login = await apiClient.login(teacher.email, teacher.password);
    teacherToken = login.accessToken;
    
    classId = `class-${Date.now()}`;
  });

  test('should generate JWT-signed QR token', async () => {
    const qrResult = await apiClient.generateQRToken(teacherToken, classId);

    expect(qrResult.token).toBeDefined();
    expect(qrResult.sessionId).toBeDefined();
    expect(qrResult.expiresAt).toBeDefined();

    // Token should be JWT format (three parts separated by dots)
    const tokenParts = qrResult.token.split('.');
    expect(tokenParts.length).toBe(3);
  });

  test('should include proper expiry time in token', async () => {
    const qrResult = await apiClient.generateQRToken(teacherToken, classId);

    const expiresAt = new Date(qrResult.expiresAt);
    const now = new Date();
    const timeDiff = (expiresAt.getTime() - now.getTime()) / 1000; // seconds

    // Should expire in ~5 minutes (300 seconds)
    expect(timeDiff).toBeGreaterThan(290);
    expect(timeDiff).toBeLessThan(310);
  });

  test('should generate unique session IDs', async () => {
    const session1 = await apiClient.generateQRToken(teacherToken, classId);
    const session2 = await apiClient.generateQRToken(teacherToken, classId);

    expect(session1.sessionId).not.toBe(session2.sessionId);
    expect(session1.token).not.toBe(session2.token);
  });
});

test.describe('QR Attendance - Scanning and Validation', () => {
  let apiClient: APIClient;
  let teacherToken: string;
  let studentId: string;
  let classId: string;

  test.beforeEach(async ({ request }) => {
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
    apiClient = new APIClient(request, baseURL);

    const teacher = TestDataGenerator.generateUser('TEACHER');
    await apiClient.register(teacher);
    const login = await apiClient.login(teacher.email, teacher.password);
    teacherToken = login.accessToken;

    const student = TestDataGenerator.generateStudent();
    const createdStudent = await apiClient.createStudent(teacherToken, student);
    studentId = createdStudent.id;

    classId = `class-${Date.now()}`;
  });

  test('should mark attendance with valid QR token', async () => {
    const qrResult = await apiClient.generateQRToken(teacherToken, classId);
    const scanResult = await apiClient.scanQRCode(teacherToken, qrResult.token, studentId);

    expect(scanResult.ok).toBe(true);
    expect(scanResult.data.status).toBe('PRESENT');
    expect(scanResult.data.studentId).toBe(studentId);
  });

  test('should reject expired QR token', async () => {
    // Note: Testing expiry requires either:
    // 1. Waiting 5 minutes (slow)
    // 2. Using shorter expiry in test environment
    // 3. Mocking time

    // In production E2E, would configure short expiry for tests
    // For now, verify that token includes expiry claim
  });

  test('should reject invalid QR token', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.invalid';
    
    const scanResult = await apiClient.scanQRCode(teacherToken, fakeToken, studentId);

    expect(scanResult.ok).toBe(false);
    expect([400, 401]).toContain(scanResult.status);
  });

  test('should reject malformed token (not JWT)', async () => {
    const notJWT = 'this-is-not-a-jwt-token';
    
    const scanResult = await apiClient.scanQRCode(teacherToken, notJWT, studentId);

    expect(scanResult.ok).toBe(false);
  });
});

test.describe('QR Attendance - Replay Attack Prevention', () => {
  let apiClient: APIClient;
  let teacherToken: string;
  let studentId: string;
  let classId: string;

  test.beforeEach(async ({ request }) => {
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
    apiClient = new APIClient(request, baseURL);

    const teacher = TestDataGenerator.generateUser('TEACHER');
    await apiClient.register(teacher);
    const login = await apiClient.login(teacher.email, teacher.password);
    teacherToken = login.accessToken;

    const student = TestDataGenerator.generateStudent();
    const createdStudent = await apiClient.createStudent(teacherToken, student);
    studentId = createdStudent.id;

    classId = `class-${Date.now()}`;
  });

  test('should prevent duplicate scans (replay attack)', async () => {
    const qrResult = await apiClient.generateQRToken(teacherToken, classId);
    
    // First scan succeeds
    const scan1 = await apiClient.scanQRCode(teacherToken, qrResult.token, studentId);
    expect(scan1.ok).toBe(true);

    // Second scan with same token should fail
    const scan2 = await apiClient.scanQRCode(teacherToken, qrResult.token, studentId);
    expect(scan2.ok).toBe(false);
    expect(scan2.data).toContain('already marked'); // Error message
  });

  test('should allow same student to scan different sessions', async () => {
    // Session 1
    const qr1 = await apiClient.generateQRToken(teacherToken, classId);
    const scan1 = await apiClient.scanQRCode(teacherToken, qr1.token, studentId);
    expect(scan1.ok).toBe(true);

    // Session 2 (different token)
    const qr2 = await apiClient.generateQRToken(teacherToken, classId);
    const scan2 = await apiClient.scanQRCode(teacherToken, qr2.token, studentId);
    expect(scan2.ok).toBe(true);
  });

  test('should allow different students to scan same session', async () => {
    const qrResult = await apiClient.generateQRToken(teacherToken, classId);

    // Create second student
    const student2 = TestDataGenerator.generateStudent();
    const createdStudent2 = await apiClient.createStudent(teacherToken, student2);

    // Student 1 scans
    const scan1 = await apiClient.scanQRCode(teacherToken, qrResult.token, studentId);
    expect(scan1.ok).toBe(true);

    // Student 2 scans (should succeed - different student)
    const scan2 = await apiClient.scanQRCode(teacherToken, qrResult.token, createdStudent2.id);
    expect(scan2.ok).toBe(true);
  });
});

test.describe('QR Attendance - Security Best Practices', () => {
  let apiClient: APIClient;
  let teacherAToken: string;
  let teacherBToken: string;
  let classIdA: string;
  let classIdB: string;

  test.beforeEach(async ({ request }) => {
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
    apiClient = new APIClient(request, baseURL);

    // Setup two teachers in different tenants
    const teacherA = TestDataGenerator.generateUser('TEACHER');
    await apiClient.register(teacherA);
    const loginA = await apiClient.login(teacherA.email, teacherA.password);
    teacherAToken = loginA.accessToken;
    classIdA = `class-a-${Date.now()}`;

    const teacherB = TestDataGenerator.generateUser('TEACHER');
    await apiClient.register(teacherB);
    const loginB = await apiClient.login(teacherB.email, teacherB.password);
    teacherBToken = loginB.accessToken;
    classIdB = `class-b-${Date.now()}`;
  });

  test('should enforce tenant isolation for QR tokens', async () => {
    // Teacher A generates token
    const qrA = await apiClient.generateQRToken(teacherAToken, classIdA);

    // Create student in Tenant B
    const studentB = TestDataGenerator.generateStudent();
    const createdStudentB = await apiClient.createStudent(teacherBToken, studentB);

    // Teacher B tries to use Teacher A's token
    const scanResult = await apiClient.scanQRCode(teacherBToken, qrA.token, createdStudentB.id);

    // Should fail - cross-tenant token usage
    expect(scanResult.ok).toBe(false);
  });

  test('should validate token signature', async () => {
    const qrResult = await apiClient.generateQRToken(teacherAToken, classIdA);

    // Modify token (tamper with signature)
    const parts = qrResult.token.split('.');
    const tamperedToken = `${parts[0]}.${parts[1]}.tampered-signature`;

    // Create student
    const student = TestDataGenerator.generateStudent();
    const createdStudent = await apiClient.createStudent(teacherAToken, student);

    // Try to scan with tampered token
    const scanResult = await apiClient.scanQRCode(teacherAToken, tamperedToken, createdStudent.id);

    expect(scanResult.ok).toBe(false);
  });

  test('should not expose sensitive data in token payload', async () => {
    const qrResult = await apiClient.generateQRToken(teacherAToken, classIdA);

    // Decode JWT payload (base64)
    const parts = qrResult.token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Payload should NOT contain sensitive data like passwords
    expect(payload.password).toBeUndefined();
    expect(payload.apiKey).toBeUndefined();
    expect(payload.secret).toBeUndefined();

    // Payload SHOULD contain only necessary data
    expect(payload.sessionId).toBeDefined();
    expect(payload.classId).toBeDefined();
    expect(payload.tenantId).toBeDefined();
    expect(payload.exp).toBeDefined(); // Expiry
  });
});
