# KRYPTON SCHOOL ERP — KENYA CURRICULUM (CBE / CBC) VALIDATION REPORT
**Standard:** Basic Education Curriculum Framework (BECF)  
**Regulatory Bodies:** Ministry of Education (MoE), KICD, KNEC  
**Coverage:** Pre-Primary, Primary, Junior School, Senior School

---

## 1. Kenyan Competency-Based Education (CBE) Architecture

Krypton School ERP provides native, end-to-end support for Kenya's CBE/CBC framework, eliminating reliance on legacy British or 8-4-4 grading assumptions while maintaining backward compatibility for transitional classes.

### 1.1 Assessment Rubrics & Score Mapping
In accordance with KNEC Guidelines, formative assessments, teacher observations, and student portfolios evaluate competency against standard 4-point rubrics:

| Performance Level | Descriptor | Score Range | Numerical Scale | Grade Code |
|---|---|---|---|---|
| **Exceeding Expectations** | Learner consistently demonstrates exceptional mastery and innovation | 80% – 100% | 4 | **EE** |
| **Meeting Expectations** | Learner meets all specified competency criteria independently | 65% – 79% | 3 | **ME** |
| **Approaching Expectations** | Learner meets competency criteria with occasional guidance | 50% – 64% | 2 | **AE** |
| **Below Expectations** | Learner requires persistent guidance and remedial intervention | 0% – 49% | 1 | **BE** |

---

## 2. Learning Areas by Educational Tier

### 2.1 Early Years Education (PP1, PP2)
- Language Activities (English & Kiswahili)
- Mathematical Activities
- Environmental Activities
- Psychomotor and Creative Activities
- Religious Education Activities (CRE / IRE / HRE)

### 2.2 Middle School / Junior School (Grades 7, 8, 9)
- English & Kiswahili / Kenya Sign Language
- Mathematics
- Integrated Science & Health Education
- Social Studies & Life Skills Education
- Pre-Technical and Pre-Career Studies
- Agriculture and Nutrition
- Religious Education (CRE / IRE / HRE)
- Creative Arts and Sports

---

## 3. Official Government Integrations & Export Workflows

### 3.1 NEMIS / KEMIS Adapter (`apps/api/src/modules/government/services/nemis.service.ts`)
- **UPI Verification:** Validates student Unique Personal Identifier (UPI) checksum format.
- **Batch Export:** Generates official Ministry of Education census and biodata export templates in both CSV and JSON formats.
- **Data Quality Audit:** Flags missing birth certificate numbers, guardian national IDs, and incomplete birth records before submission.

### 3.2 KNEC Assessment Portal Adapter (`apps/api/src/modules/government/services/knec.service.ts`)
- **School-Based Assessment (SBA):** Exports SBA scores for Grade 4, 5, and 6 learners in standardized KNEC upload templates.
- **KJSEA (Kenya Junior School Education Assessment):** Prepares candidate nominal roll registration exports for Grade 9 candidates.
- **Integrity Rule:** System never fakes or simulates live server handshakes to government portals; external synchronization states are strictly classified as `EXPORT_READY`, `SYNC_PENDING`, or `VERIFIED`.
