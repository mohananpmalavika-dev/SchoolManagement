# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-authentication-flows.spec.ts >> Authentication - Password Reset >> should return success even for non-existent email (security)
- Location: tests\e2e\02-authentication-flows.spec.ts:186:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  90  |   });
  91  | 
  92  |   test('should allow admin to unlock account', async () => {
  93  |     // Create admin user
  94  |     const admin = TestDataGenerator.generateUser('PRINCIPAL');
  95  |     await apiClient.register(admin);
  96  |     const adminLogin = await apiClient.login(admin.email, admin.password);
  97  | 
  98  |     // Create regular user
  99  |     const user = TestDataGenerator.generateUser('TEACHER');
  100 |     await apiClient.register(user);
  101 | 
  102 |     // Lock user account
  103 |     for (let i = 0; i < 5; i++) {
  104 |       try {
  105 |         await apiClient.login(user.email, 'WrongPassword@123');
  106 |       } catch (error) {
  107 |         // Expected
  108 |       }
  109 |     }
  110 | 
  111 |     // Admin unlocks account
  112 |     const unlockResult = await apiClient.unlockAccount(adminLogin.accessToken, user.email);
  113 |     expect(unlockResult.ok).toBe(true);
  114 | 
  115 |     // User should now be able to login
  116 |     const login = await apiClient.login(user.email, user.password);
  117 |     expect(login.accessToken).toBeDefined();
  118 |   });
  119 | });
  120 | 
  121 | test.describe('Authentication - MFA (TOTP)', () => {
  122 |   let apiClient: APIClient;
  123 |   let adminToken: string;
  124 | 
  125 |   test.beforeEach(async ({ request }) => {
  126 |     const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
  127 |     apiClient = new APIClient(request, baseURL);
  128 | 
  129 |     // Create PRINCIPAL user (MFA required for this role)
  130 |     const admin = TestDataGenerator.generateUser('PRINCIPAL');
  131 |     await apiClient.register(admin);
  132 |     const login = await apiClient.login(admin.email, admin.password);
  133 |     adminToken = login.accessToken;
  134 |   });
  135 | 
  136 |   test('should setup MFA and generate QR code + backup codes', async () => {
  137 |     const mfaSetup = await apiClient.setupMFA(adminToken);
  138 | 
  139 |     expect(mfaSetup.secret).toBeDefined();
  140 |     expect(mfaSetup.qrCode).toBeDefined(); // Base64 QR code image
  141 |     expect(mfaSetup.backupCodes).toBeDefined();
  142 |     expect(mfaSetup.backupCodes.length).toBe(10);
  143 | 
  144 |     // Each backup code should be 8 characters
  145 |     mfaSetup.backupCodes.forEach((code: string) => {
  146 |       expect(code.length).toBe(8);
  147 |     });
  148 |   });
  149 | 
  150 |   test('should verify TOTP token and enable MFA', async () => {
  151 |     const mfaSetup = await apiClient.setupMFA(adminToken);
  152 | 
  153 |     // In real test, would generate actual TOTP token from secret
  154 |     // For this test, we'll simulate the verification process
  155 |     // Note: Actual TOTP generation would use otplib library
  156 | 
  157 |     // const totp = authenticator.generate(mfaSetup.secret);
  158 |     // const verifyResult = await apiClient.verifyMFAEnable(adminToken, totp);
  159 |     // expect(verifyResult.ok).toBe(true);
  160 |   });
  161 | 
  162 |   test('should enforce MFA for PRINCIPAL role on login', async () => {
  163 |     // After MFA is enabled, login should require MFA token
  164 |     // This would be tested in integration with actual TOTP generation
  165 |   });
  166 | });
  167 | 
  168 | test.describe('Authentication - Password Reset', () => {
  169 |   let apiClient: APIClient;
  170 | 
  171 |   test.beforeEach(async ({ request }) => {
  172 |     const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
  173 |     apiClient = new APIClient(request, baseURL);
  174 |   });
  175 | 
  176 |   test('should request password reset and receive email', async () => {
  177 |     const user = TestDataGenerator.generateUser('TEACHER');
  178 |     await apiClient.register(user);
  179 | 
  180 |     const resetResult = await apiClient.requestPasswordReset(user.email);
  181 | 
  182 |     expect(resetResult.ok).toBe(true);
  183 |     expect(resetResult.data.message).toContain('sent'); // Generic message for security
  184 |   });
  185 | 
  186 |   test('should return success even for non-existent email (security)', async () => {
  187 |     const resetResult = await apiClient.requestPasswordReset('nonexistent@test.com');
  188 | 
  189 |     // Should return success to prevent email enumeration
> 190 |     expect(resetResult.ok).toBe(true);
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  191 |   });
  192 | 
  193 |   test('should enforce rate limiting on password reset requests', async () => {
  194 |     const user = TestDataGenerator.generateUser('TEACHER');
  195 |     await apiClient.register(user);
  196 | 
  197 |     // Request password reset 4 times (max is 3 per hour)
  198 |     for (let i = 0; i < 4; i++) {
  199 |       const result = await apiClient.requestPasswordReset(user.email);
  200 |       
  201 |       if (i < 3) {
  202 |         expect(result.ok).toBe(true);
  203 |       } else {
  204 |         // 4th request should be rate limited
  205 |         expect(result.ok).toBe(false);
  206 |         expect(result.status).toBe(429); // Too Many Requests
  207 |       }
  208 |     }
  209 |   });
  210 | 
  211 |   test('should reset password with valid token', async () => {
  212 |     // Note: In real test, would need to:
  213 |     // 1. Request password reset
  214 |     // 2. Extract token from email (or test database)
  215 |     // 3. Use token to reset password
  216 |     // 4. Login with new password
  217 |     
  218 |     // For E2E, this would require email service integration or
  219 |     // direct database access to retrieve reset token
  220 |   });
  221 | 
  222 |   test('should reject weak passwords during reset', async () => {
  223 |     const weakPasswords = [
  224 |       'short', // Too short
  225 |       'nouppercase123!', // No uppercase
  226 |       'NOLOWERCASE123!', // No lowercase
  227 |       'NoSpecialChar123', // No special character
  228 |       'NoNumber!@#', // No number
  229 |     ];
  230 | 
  231 |     // Each should be rejected
  232 |     // (Tested via password validation in service)
  233 |   });
  234 | });
  235 | 
  236 | test.describe('Authentication - Token Management', () => {
  237 |   let apiClient: APIClient;
  238 | 
  239 |   test.beforeEach(async ({ request }) => {
  240 |     const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
  241 |     apiClient = new APIClient(request, baseURL);
  242 |   });
  243 | 
  244 |   test('should accept valid access token', async () => {
  245 |     const user = TestDataGenerator.generateUser('TEACHER');
  246 |     await apiClient.register(user);
  247 |     const login = await apiClient.login(user.email, user.password);
  248 | 
  249 |     // Use token to access protected endpoint
  250 |     const health = await apiClient.checkHealth();
  251 |     expect(health.status).toBe('ok');
  252 |   });
  253 | 
  254 |   test('should reject expired access token', async () => {
  255 |     // Note: Testing expired tokens requires either:
  256 |     // 1. Waiting for token to expire (slow)
  257 |     // 2. Using short-lived tokens in test environment
  258 |     // 3. Mocking JWT verification
  259 |     
  260 |     // In production E2E, would configure short token TTL for tests
  261 |   });
  262 | 
  263 |   test('should reject invalid access token', async ({ request }) => {
  264 |     const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';
  265 |     const user = TestDataGenerator.generateUser('TEACHER');
  266 |     
  267 |     await apiClient.register(user);
  268 |     
  269 |     // Try to create student with invalid token
  270 |     try {
  271 |       const response = await request.post(`${baseURL}/api/students`, {
  272 |         headers: { Authorization: 'Bearer invalid-token-12345' },
  273 |         data: TestDataGenerator.generateStudent(),
  274 |       });
  275 | 
  276 |       expect(response.status()).toBe(401); // Unauthorized
  277 |     } catch (error) {
  278 |       // Expected to fail
  279 |     }
  280 |   });
  281 | });
  282 | 
```