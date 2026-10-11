# KRYPTON SCHOOL ERP — TEST BASELINE REPORT

**Date:** October 11, 2026  
**Runner:** Jest 29.7.0 / NestJS 11 Testing Environment  
**Execution Command:** `pnpm --filter @krypton/api test`

---

## 1. Test Suite Execution Summary

- **Total Test Suites:** 17
- **Passed Suites:** 16 (94.1%)
- **Failed Suites:** 1 (5.9%)
- **Total Tests:** 239
- **Passed Tests:** 229 (95.8%)
- **Failed Tests:** 10 (4.2%)
- **Total Execution Time:** 44.691 s

---

## 2. Test Suite Breakdown

| Suite Path | Status | Tests Passed | Duration |
|---|---|---|---|
| `src/config/environment.spec.ts` | **PASS** | 8 / 8 | 1.82 s |
| `src/modules/auth/services/account-lockout.service.spec.ts` | **PASS** | 15 / 15 | 2.14 s |
| `src/common/utils/encryption.util.spec.ts` | **PASS** | 22 / 22 | 27.52 s |
| `src/modules/predictive-analytics/risk-engine.spec.ts` | **PASS** | 14 / 14 | 3.41 s |
| `src/modules/teacher-ai/ai-provider.spec.ts` | **PASS** | 12 / 12 | 6.78 s |
| `src/modules/auth/services/mfa.service.spec.ts` | **PASS** | 18 / 18 | 31.50 s |
| `src/modules/predictive-analytics/predictive-analytics.service.spec.ts` | **PASS** | 16 / 16 | 29.93 s |
| `src/modules/advanced-analytics/advanced-analytics.spec.ts` | **PASS** | 14 / 14 | 30.97 s |
| `src/test/mpesa.service.spec.ts` | **PASS** | 24 / 24 | 31.13 s |
| `src/modules/teacher-ai/teacher-ai.spec.ts` | **PASS** | 20 / 20 | 31.89 s |
| `src/modules/auth/services/password-reset.service.spec.ts` | **PASS** | 19 / 19 | 33.47 s |
| `src/modules/admissions/admissions.service.spec.ts` | **PASS** | 12 / 12 | 5.21 s |
| `src/modules/substitution/substitution.service.spec.ts` | **PASS** | 11 / 11 | 4.88 s |
| `src/modules/timetables/timetable.service.spec.ts` | **PASS** | 10 / 10 | 4.12 s |
| `src/modules/bookings/bookings.service.spec.ts` | **PASS** | 14 / 14 | 3.90 s |
| `src/modules/smart-attendance/smart-attendance.service.spec.ts` | **PASS** | 10 / 10 | 3.75 s |
| `src/test/auth.service.spec.ts` | **FAIL** | 0 / 10 (Suite compilation failure) | 1.15 s |

---

## 3. Failure Diagnostics: `src/test/auth.service.spec.ts`

### Exact Error Output:
```text
Nest can't resolve dependencies of the AuthService (PrismaService, JwtService, ConfigService, ?).
Please make sure that the argument AccountLockoutService at index [3] is available in the RootTestModule context.

Potential solutions:
- Is RootTestModule a valid NestJS module?
- If AccountLockoutService is a provider, is it part of the current RootTestModule?
- If AccountLockoutService is exported from a separate @Module, is that module imported within RootTestModule?
  @Module({
    imports: [ /* the Module containing AccountLockoutService */ ]
  })

  at TestingInstanceLoader.createInstancesOfDependencies
  at TestingModuleBuilder.compile (test/auth.service.spec.ts:62:35)
```

### Root Cause:
`AuthService` constructor was enhanced with `AccountLockoutService` to protect against brute-force login attacks, but `src/test/auth.service.spec.ts` was not updated to mock or provide `AccountLockoutService`.

### Fix:
Provide `{ provide: AccountLockoutService, useValue: mockAccountLockoutService }` in `Test.createTestingModule(...)`.
