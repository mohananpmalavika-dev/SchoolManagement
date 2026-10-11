# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-qr-attendance-security.spec.ts >> QR Attendance - Scanning and Validation >> should reject expired QR token
- Location: tests\e2e\03-qr-attendance-security.spec.ts:98:7

# Error details

```
Error: Registration failed: 404 {"success":false,"message":"Cannot POST /api/auth/register","error":{"code":"NOT_FOUND","message":"Cannot POST /api/auth/register"},"timestamp":"2026-10-11T22:37:51.838Z","path":"/api/auth/register"}
```

# Test source

```ts
  1   | import { APIRequestContext } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * API Client helper for E2E tests
  5   |  * Provides typed methods for common API operations
  6   |  */
  7   | export class APIClient {
  8   |   constructor(
  9   |     private request: APIRequestContext,
  10  |     private baseURL: string
  11  |   ) {}
  12  | 
  13  |   /**
  14  |    * Authentication
  15  |    */
  16  |   async login(email: string, password: string) {
  17  |     const response = await this.request.post(`${this.baseURL}/api/auth/login`, {
  18  |       data: { email, password },
  19  |     });
  20  | 
  21  |     if (!response.ok()) {
  22  |       throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  23  |     }
  24  | 
  25  |     const data = await response.json();
  26  |     return {
  27  |       accessToken: data.access_token,
  28  |       refreshToken: data.refresh_token,
  29  |       user: data.user,
  30  |     };
  31  |   }
  32  | 
  33  |   async register(data: {
  34  |     email: string;
  35  |     password: string;
  36  |     firstName: string;
  37  |     lastName: string;
  38  |     role: string;
  39  |   }) {
  40  |     const response = await this.request.post(`${this.baseURL}/api/auth/register`, {
  41  |       data,
  42  |     });
  43  | 
  44  |     if (!response.ok()) {
> 45  |       throw new Error(`Registration failed: ${response.status()} ${await response.text()}`);
      |             ^ Error: Registration failed: 404 {"success":false,"message":"Cannot POST /api/auth/register","error":{"code":"NOT_FOUND","message":"Cannot POST /api/auth/register"},"timestamp":"2026-10-11T22:37:51.838Z","path":"/api/auth/register"}
  46  |     }
  47  | 
  48  |     return await response.json();
  49  |   }
  50  | 
  51  |   /**
  52  |    * School management
  53  |    */
  54  |   async createSchool(token: string, schoolData: any) {
  55  |     const response = await this.request.post(`${this.baseURL}/api/schools`, {
  56  |       headers: { Authorization: `Bearer ${token}` },
  57  |       data: schoolData,
  58  |     });
  59  | 
  60  |     if (!response.ok()) {
  61  |       throw new Error(`School creation failed: ${response.status()}`);
  62  |     }
  63  | 
  64  |     return await response.json();
  65  |   }
  66  | 
  67  |   /**
  68  |    * Student management
  69  |    */
  70  |   async createStudent(token: string, studentData: any) {
  71  |     const response = await this.request.post(`${this.baseURL}/api/students`, {
  72  |       headers: { Authorization: `Bearer ${token}` },
  73  |       data: studentData,
  74  |     });
  75  | 
  76  |     if (!response.ok()) {
  77  |       throw new Error(`Student creation failed: ${response.status()}`);
  78  |     }
  79  | 
  80  |     return await response.json();
  81  |   }
  82  | 
  83  |   async getStudent(token: string, studentId: string) {
  84  |     const response = await this.request.get(`${this.baseURL}/api/students/${studentId}`, {
  85  |       headers: { Authorization: `Bearer ${token}` },
  86  |     });
  87  | 
  88  |     if (!response.ok()) {
  89  |       return null;
  90  |     }
  91  | 
  92  |     return await response.json();
  93  |   }
  94  | 
  95  |   /**
  96  |    * Attendance
  97  |    */
  98  |   async markAttendance(token: string, attendanceData: any) {
  99  |     const response = await this.request.post(`${this.baseURL}/api/attendance`, {
  100 |       headers: { Authorization: `Bearer ${token}` },
  101 |       data: attendanceData,
  102 |     });
  103 | 
  104 |     if (!response.ok()) {
  105 |       throw new Error(`Attendance marking failed: ${response.status()}`);
  106 |     }
  107 | 
  108 |     return await response.json();
  109 |   }
  110 | 
  111 |   async generateQRToken(token: string, classId: string) {
  112 |     const response = await this.request.post(`${this.baseURL}/api/attendance/qr/generate`, {
  113 |       headers: { Authorization: `Bearer ${token}` },
  114 |       data: { classId },
  115 |     });
  116 | 
  117 |     if (!response.ok()) {
  118 |       throw new Error(`QR generation failed: ${response.status()}`);
  119 |     }
  120 | 
  121 |     return await response.json();
  122 |   }
  123 | 
  124 |   async scanQRCode(token: string, qrToken: string, studentId: string) {
  125 |     const response = await this.request.post(`${this.baseURL}/api/attendance/qr/scan`, {
  126 |       headers: { Authorization: `Bearer ${token}` },
  127 |       data: { token: qrToken, studentId },
  128 |     });
  129 | 
  130 |     return {
  131 |       ok: response.ok(),
  132 |       status: response.status(),
  133 |       data: response.ok() ? await response.json() : await response.text(),
  134 |     };
  135 |   }
  136 | 
  137 |   /**
  138 |    * Media/File uploads
  139 |    */
  140 |   async uploadFile(token: string, file: Buffer, filename: string, metadata: any = {}) {
  141 |     const formData = new FormData();
  142 |     const blob = new Blob([file], { type: 'image/jpeg' });
  143 |     formData.append('file', blob, filename);
  144 |     
  145 |     Object.entries(metadata).forEach(([key, value]) => {
```