import { APIRequestContext } from '@playwright/test';

/**
 * API Client helper for E2E tests
 * Provides typed methods for common API operations
 */
export class APIClient {
  constructor(
    private request: APIRequestContext,
    private baseURL: string
  ) {}

  /**
   * Authentication
   */
  async login(email: string, password: string) {
    const response = await this.request.post(`${this.baseURL}/api/auth/login`, {
      data: { email, password },
    });

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    };
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/auth/register`, {
      data,
    });

    if (!response.ok()) {
      throw new Error(`Registration failed: ${response.status()} ${await response.text()}`);
    }

    return await response.json();
  }

  /**
   * School management
   */
  async createSchool(token: string, schoolData: any) {
    const response = await this.request.post(`${this.baseURL}/api/schools`, {
      headers: { Authorization: `Bearer ${token}` },
      data: schoolData,
    });

    if (!response.ok()) {
      throw new Error(`School creation failed: ${response.status()}`);
    }

    return await response.json();
  }

  /**
   * Student management
   */
  async createStudent(token: string, studentData: any) {
    const response = await this.request.post(`${this.baseURL}/api/students`, {
      headers: { Authorization: `Bearer ${token}` },
      data: studentData,
    });

    if (!response.ok()) {
      throw new Error(`Student creation failed: ${response.status()}`);
    }

    return await response.json();
  }

  async getStudent(token: string, studentId: string) {
    const response = await this.request.get(`${this.baseURL}/api/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      return null;
    }

    return await response.json();
  }

  /**
   * Attendance
   */
  async markAttendance(token: string, attendanceData: any) {
    const response = await this.request.post(`${this.baseURL}/api/attendance`, {
      headers: { Authorization: `Bearer ${token}` },
      data: attendanceData,
    });

    if (!response.ok()) {
      throw new Error(`Attendance marking failed: ${response.status()}`);
    }

    return await response.json();
  }

  async generateQRToken(token: string, classId: string) {
    const response = await this.request.post(`${this.baseURL}/api/attendance/qr/generate`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { classId },
    });

    if (!response.ok()) {
      throw new Error(`QR generation failed: ${response.status()}`);
    }

    return await response.json();
  }

  async scanQRCode(token: string, qrToken: string, studentId: string) {
    const response = await this.request.post(`${this.baseURL}/api/attendance/qr/scan`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { token: qrToken, studentId },
    });

    return {
      ok: response.ok(),
      status: response.status(),
      data: response.ok() ? await response.json() : await response.text(),
    };
  }

  /**
   * Media/File uploads
   */
  async uploadFile(token: string, file: Buffer, filename: string, metadata: any = {}) {
    const formData = new FormData();
    const blob = new Blob([file], { type: 'image/jpeg' });
    formData.append('file', blob, filename);
    
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const response = await this.request.post(`${this.baseURL}/api/media/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: filename,
          mimeType: 'image/jpeg',
          buffer: file,
        },
        ...metadata,
      },
    });

    return {
      ok: response.ok(),
      status: response.status(),
      data: response.ok() ? await response.json() : await response.text(),
    };
  }

  async getPresignedUrl(token: string, mediaId: string) {
    const response = await this.request.get(
      `${this.baseURL}/api/media/${mediaId}/presigned-url`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return {
      ok: response.ok(),
      status: response.status(),
      data: response.ok() ? await response.json() : await response.text(),
    };
  }

  /**
   * MFA operations
   */
  async setupMFA(token: string) {
    const response = await this.request.post(`${this.baseURL}/api/auth/mfa/setup`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok()) {
      throw new Error(`MFA setup failed: ${response.status()}`);
    }

    return await response.json();
  }

  async verifyMFAEnable(token: string, mfaToken: string) {
    const response = await this.request.post(`${this.baseURL}/api/auth/mfa/verify-enable`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { token: mfaToken },
    });

    return {
      ok: response.ok(),
      status: response.status(),
      data: response.ok() ? await response.json() : await response.text(),
    };
  }

  /**
   * Password reset
   */
  async requestPasswordReset(email: string) {
    const response = await this.request.post(`${this.baseURL}/api/auth/password-reset/request`, {
      data: { email },
    });

    return {
      ok: response.ok(),
      status: response.status(),
      data: response.ok() ? await response.json() : await response.text(),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.request.post(`${this.baseURL}/api/auth/password-reset/reset`, {
      data: { token, newPassword },
    });

    return {
      ok: response.ok(),
      status: response.status(),
      data: response.ok() ? await response.json() : await response.text(),
    };
  }

  /**
   * Account lockout
   */
  async unlockAccount(adminToken: string, email: string) {
    const response = await this.request.post(`${this.baseURL}/api/auth/admin/unlock-account`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { email },
    });

    return {
      ok: response.ok(),
      status: response.status(),
      data: response.ok() ? await response.json() : await response.text(),
    };
  }

  /**
   * Health checks
   */
  async checkHealth() {
    const response = await this.request.get(`${this.baseURL}/health`);
    return await response.json();
  }
}
