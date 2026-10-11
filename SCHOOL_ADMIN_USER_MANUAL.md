# KRYPTON SCHOOL ERP — SCHOOL ADMIN & PRINCIPAL USER MANUAL
**Audience:** School Principals, Headteachers, Deputy Principals, School Accountants  
**Access Portal:** `/school/dashboard`  
**Roles:** `PRINCIPAL`, `SCHOOL_ADMIN`, `ACCOUNTANT`

---

## 1. Quick Start Onboarding (Under 1 Working Day)

Krypton School ERP enables complete setup in less than one working day through automated batch import wizards:

### Step 1: Academic Setup
1. Navigate to **Academic Calendar** (`/school/calendar`).
2. Define the current Academic Year (e.g., 2026) and active Terms (Term 1, Term 2, Term 3).
3. Set term start, mid-term break, and closing dates.

### Step 2: Classes & Streams Setup
1. Navigate to **Academics > Classes** (`/school/academics`).
2. Add classes corresponding to your curriculum (e.g., Grade 1 through Grade 9).
3. Assign streams (e.g. *Grade 7 Blue*, *Grade 7 Gold*).

### Step 3: Batch Data Import
1. Navigate to **Admissions > Data Import** (`/school/admissions`).
2. Download the standard Excel/CSV migration templates:
   - `students_template.xlsx`
   - `guardians_template.xlsx`
   - `staff_template.xlsx`
3. Execute **Dry-Run Import**. The validator flags missing birth certificates, duplicate admission numbers, or invalid phone numbers before writing to the database.
4. Click **Confirm & Commit Import**.

---

## 2. Fee Management & M-Pesa Autopilot

### 2.1 Configuring Fee Structures
1. Go to **Fees > Fee Structures** (`/school/fees`).
2. Create fee categories (Tuition, Boarding, Transport, Activity, Lunch).
3. Assign amounts per class and term.
4. Click **Generate Term Invoices**. Invoices are automatically calculated and published to parent accounts.

### 2.2 Payment Collection & Real-Time Receipting
- When a parent pays via Paybill or M-Pesa STK push, the transaction is reconciled within 3 seconds.
- Receipts are generated automatically with official school crest, serial number, and breakdown of paid vote heads.
- Any payment with an unrecognized admission number appears in **Unmatched Payments** (`/school/fees`). Click **Reconcile** to link it to the verified student.

---

## 3. Competency-Based Assessments (CBE / CBC)

1. Navigate to **Examinations & Assessments** (`/school/examinations`).
2. Select Class, Learning Area (Subject), and Assessment Type (Formative SBA or Summative).
3. Enter performance levels (**EE**, **ME**, **AE**, **BE**) along with teacher qualitative remarks.
4. Generate official **Learner Progress Reports** (`/school/report-cards`) with digital principal signatures and KICD rubric summaries.
