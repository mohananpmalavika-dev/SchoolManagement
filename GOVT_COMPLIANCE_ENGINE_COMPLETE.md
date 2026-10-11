# 🏛️ ഗവൺമെന്റ് അക്രഡിറ്റേഷനും കംപ്ലയൻസും (Govt & Board Compliance Engine)

> **Official Accreditation, 1-Click Portal Data Export & Tamper-Proof Security Audit Trail**
>
> സിലബസ് ബോർഡുകൾക്കും (CBSE, State Board, UDISE+, NEMIS, MOE) വിദ്യാഭ്യാസ വകുപ്പുകൾക്കും സമർപ്പിക്കേണ്ട വാർഷിക റിപ്പോർട്ടുകൾ കൃത്യമായ ഫോർമാറ്റിൽ 1-ക്ലിക്കിൽ എക്സ്പോർട്ട് ചെയ്യാനും, സ്കൂൾ മാർക്കുകളിലും ഫീസ് വിവരങ്ങളിലും വരുന്ന തിരുത്തലുകൾ തിരുത്താനാവാത്ത ക്രിപ്റ്റോഗ്രാഫിക് ഹാഷ് ചെയിൻ (SHA-256) വഴി ട്രാക്ക് ചെയ്യാനുമുള്ള സമഗ്ര സംവിധാനം.

---

## 📌 പ്രധാന സവിശേഷതകൾ (Key Capabilities)

### 1. ⚡ 1-Click Government Portal Data Export
* **CBSE OASIS & LOC (List of Candidates) Export**:
  * പത്താം ക്ലാസ്സ് / പന്ത്രണ്ടാം ക്ലാസ്സ് ബോർഡ് പരീക്ഷാർത്ഥികളുടെ വിവരങ്ങൾ (Student Name, Mother Name, Father Name, 5 Subject Codes [041, 086, 085, 184, 087], Aadhaar, CWSN Status, Attendance %, Fee Status).
  * CBSE Pariksha Sangam പോർട്ടൽ നേരിട്ട് സ്വീകരിക്കുന്ന **Excel (.xlsx)** & **CSV** മാതൃക.
* **സംസ്ഥാന വിദ്യാഭ്യാസ വകുപ്പ് വാർഷിക റിട്ടേൺ (State Board / Sampoorna Return)**:
  * സമ്പൂർണ്ണ / DPI പോർട്ടൽ മാനദണ്ഡപ്രകാരമുള്ള വിദ്യാർത്ഥി രജിസ്റ്റർ.
  * ഇംഗ്ലീഷ്, മലയാളം പേരുകൾ, മാതൃഭാഷ, റിലിജിയൻ, കാറ്റഗറി, വാർഷിക ഹാജർ ശതമാനം.
* **UDISE+ SDMIS Student Profile & Data Capture (DCF)**:
  * കേന്ദ്ര വിദ്യാഭ്യാസ മന്ത്രാലയത്തിന്റെ UDISE+ പോർട്ടലിലേക്കുള്ള പെർമനന്റ് എഡ്യൂക്കേഷൻ നമ്പർ (PEN), BPL, CWSN സൗകര്യങ്ങൾ, ബാങ്ക് അക്കൗണ്ട് & IFSC കോഡുകൾ.
* **NEMIS / MOE Student Master & UPI Enrollment**:
  * മിനിസ്ട്രി ഓഫ് എഡ്യൂക്കേഷന്റെ യൂണീക്ക് പേഴ്സണൽ ഐഡന്റിഫയർ (UPI), ബർത്ത് സർട്ടിഫിക്കറ്റ് നമ്പർ, സബ്-കൗണ്ടി മാപ്പിംഗ്.
* **Faculty Mandatory Public Disclosure & Teacher Profile**:
  * CBSE ബൈലോസ് സെക്ഷൻ-B പ്രകാരമുള്ള അധ്യാപക യോഗ്യതകൾ, OASIS ഐഡികൾ, സർവീസ് വിവരങ്ങൾ എന്നിവയുടെ ഓട്ടോമേറ്റഡ് റിപ്പോർട്ട്.
* **Pre-Export Data Quality Audit**:
  * എക്സ്പോർട്ടിന് തൊട്ടുമുമ്പ് കാണാതായ ആധാർ നമ്പറുകൾ, തെറ്റായ ജനനത്തീയതികൾ, അൺ-അസൈൻഡ് വിഷയങ്ങൾ എന്നിവ കണ്ടെത്തി **Compliance Readiness Score (0-100%)** പ്രദർശിപ്പിക്കുന്നു.

---

### 2. 🛡️ Tamper-Proof Cryptographic Audit Trail (സെക്യൂരിറ്റി ഓഡിറ്റ് ലോഗ്)
ഏതെങ്കിലും മാർക്കുകളോ, ഫീ പേയ്മെന്റ് സ്റ്റാറ്റസോ, ഔദ്യോഗിക രേഖകളോ തിരുത്തപ്പെട്ടാൽ ആര്, എപ്പോൾ, എന്തുകൊണ്ട് മാറ്റി എന്ന് മാറ്റമില്ലാതെ സൂക്ഷിക്കുന്ന ബ്ലോക്ക്ചെയിൻ ശൈലിയിലുള്ള ഓഡിറ്റ് ലോഗ്.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Block #0       │       │  Block #1       │       │  Block #2       │
│  (Genesis)      │──────▶│  (Grade Override)│──────▶│  (Fee Status Chg)│
│                 │       │                 │       │                 │
│ PrevHash: 000..0│       │ PrevHash: e8f..2│       │ PrevHash: 4a1..b│
│ CurrHash: e8f..2│       │ CurrHash: 4a1..b│       │ CurrHash: 99c..d│
└─────────────────┘       └─────────────────┘       └─────────────────┘
         ▲                         ▲                         ▲
         └─────────────────────────┴─────────────────────────┘
          1-Click Automated Cryptographic Integrity Verification
```

#### 🔒 ക്രിപ്റ്റോഗ്രാഫിക് ഹാഷ് ചെയിനിംഗ് ഫോർമുല:
$$\text{CurrentHash} = \text{SHA256}(\text{Sequence} \parallel \text{Timestamp} \parallel \text{TenantId} \parallel \text{UserId} \parallel \text{EntityType} \parallel \text{EntityId} \parallel \text{Action} \parallel \text{ChangesJson} \parallel \text{Reason} \parallel \text{PreviousHash})$$

* **Non-Repudiation (ആര്, എപ്പോൾ, എവിടെനിന്ന്)**:
  * യൂസർ ഐഡി, പൂർണ്ണ നാമം, ഔദ്യോഗിക റോൾ (Principal, Chief Bursar, Examiner), ഇമെയിൽ, IP അഡ്രസ്സ്, ഡിവൈസ് ഫിംഗർപ്രിന്റ്, ISO ടൈംസ്റ്റാമ്പ്.
* **Mandatory Justification (കാരണം നിർബന്ധം)**:
  * മാർക്കുകൾ തിരുത്തുമ്പോഴോ ഫീസ് ഒഴിവാക്കുമ്പോഴോ കാരണം (Reason) നൽകൽ കർശനമായി നിർബന്ധമാണ്.
  * റഫറൻസ് നമ്പർ (Approval Order / Ticket ID) രേഖപ്പെടുത്തുന്നു.
* **Before vs After Visual Diff**:
  * മാറ്റത്തിന് മുൻപുള്ള പഴയ മൂല്യവും (Old Value - Red Line-through) പുതിയ മൂല്യവും (New Value - Green Bold) കളർ-കോഡഡ് രീതിയിൽ ഇൻസ്പെക്ട് ചെയ്യാം.
* **1-Click Cryptographic Chain Verification**:
  * ഒറ്റ ക്ലിക്കിൽ ജെനസിസ് ബ്ലോക്ക് മുതൽ ഏറ്റവും പുതിയ ബ്ലോക്ക് വരെയുള്ള എല്ലാ ഹാഷുകളും റീ-കംപ്യൂട്ട് ചെയ്ത് ഒരു ബിറ്റ് ഡാറ്റ പോലും മാറ്റിയിട്ടില്ലെന്ന് ഉറപ്പുവരുത്തുന്നു.
* **Tamper Detection Simulation Test**:
  * ഓഡിറ്റർമാർക്കും ഇൻസ്പെക്ടർമാർക്കും സിസ്റ്റത്തിന്റെ സുരക്ഷ നേരിട്ട് ബോധ്യപ്പെടാൻ ഡാറ്റാബേസിൽ കൃത്രിമം സിമുലേറ്റ് ചെയ്യാനുള്ള ടെസ്റ്റ് ടൂൾ. ഏതെങ്കിലും റെക്കോർഡ് ബാക്കെൻഡിൽ തിരുത്തിയാൽ തൽക്ഷണം *"Hash Tampering Detected at Block #X!"* എന്ന അലേർട്ട് നൽകുന്നു.

---

## 📂 സാങ്കേതിക ഘടന (Technical Architecture)

```
c:\SchoolManagement\
├── packages\types\src\
│   └── compliance-engine.ts        # കംപ്ലയൻസ്, എക്സ്പോർട്ട്, ഓഡിറ്റ് ചെയിൻ ടൈപ്പ് ഡെഫിനിഷൻസ്
├── apps\web\src\
│   ├── lib\
│   │   └── compliance-engine-client.ts # SHA-256 ഹാഷ് ചെയിനിംഗ്, എക്സ്പോർട്ട് എഞ്ചിൻ, വാലിഡേഷൻ
│   ├── components\compliance\
│   │   ├── GovtComplianceDashboard.tsx    # മെയിൻ ഡാഷ്‌ബോർഡ് ഹബ്ബ് & KPI മെട്രിക്സ്
│   │   ├── OneClickExportSection.tsx      # 1-ക്ലിക്ക് ഗവൺമെന്റ് പോർട്ടൽ എക്സ്പോർട്ട് കാർഡുകൾ
│   │   ├── TamperProofAuditTrail.tsx       # ക്രിപ്റ്റോഗ്രാഫിക് ഓഡിറ്റ് ബ്ലോക്ക് എക്സ്പ്ലോറർ
│   │   ├── AuditDiffModal.tsx              # Before vs After വിഷ്വൽ ഡിഫ് ഇൻസ്പെക്ടർ
│   │   ├── RecordOverrideModal.tsx         # നിയന്ത്രിത മാറ്റങ്ങൾ ലോഗ് ചെയ്യാനുള്ള ഫോം
│   │   └── ValidationIssuesModal.tsx       # പ്രീ-എക്സ്പോർട്ട് ഡാറ്റാ ഓഡിറ്റ് ഡ്രോയർ
│   └── app\dashboard\compliance\
│       └── page.tsx                        # ഡാഷ്‌ബോർഡ് റൂട്ട് (/dashboard/compliance)
└── apps\api\src\modules\government\
    ├── controllers\compliance.controller.ts # REST API എൻഡ്‌പോയിന്റുകൾ
    └── dto\compliance.dto.ts               # Swagger & Class-validator DTOs
```

---

## 🚀 ഉപയോഗക്രമം (User Guide)

1. **ഡാഷ്‌ബോർഡ് തുറക്കുക**:
   * സ്കൂൾ മാനേജ്‌മെന്റ് സിസ്റ്റത്തിൽ ലോഗിൻ ചെയ്ത് നാവിഗേഷൻ ബാറിലെ **"Govt Compliance"** ക്ലിക്ക് ചെയ്യുക (`/dashboard/compliance`).
2. **1-ക്ലിക്ക് പോർട്ടൽ എക്സ്പോർട്ട്**:
   * ആവശ്യമായ ബോർഡ് തിരഞ്ഞെടുക്കുക (CBSE OASIS, State Board സമ്പൂർണ്ണ, UDISE+ SDMIS, NEMIS).
   * **"Inspect"** ക്ലിക്ക് ചെയ്ത് പോർട്ടൽ ഡാറ്റാ വാലിഡേഷൻ പരിശോധിക്കുക.
   * **"Excel (.xlsx)"** അല്ലെങ്കിൽ **"CSV"** ബട്ടൺ ക്ലിക്ക് ചെയ്യുക. ഫയൽ സർക്കാർ പോർട്ടലിന്റെ അതേ കോളങ്ങളിൽ ഡൗൺലോഡ് ആകും.
3. **സെക്യൂരിറ്റി ഓഡിറ്റ് ലോഗ് പരിശോധിക്കുക**:
   * **"Tamper-Proof Audit Trail"** ടാബ് തിരഞ്ഞെടുക്കുക.
   * മാർക്ക് അല്ലെങ്കിൽ ഫീസ് മാറ്റങ്ങളുടെ ഹിസ്റ്ററി കാണാം.
   * **"Inspect Full Diff"** ക്ലിക്ക് ചെയ്ത് പഴയതും പുതിയതുമായ മാറ്റങ്ങളും കാരണവും കാണുക.
   * **"Verify Chain Integrity"** ക്ലിക്ക് ചെയ്ത് ഹാഷ് ചെയിനിന്റെ 100% സുരക്ഷിതത്വം ഉറപ്പുവരുത്തുക.
4. **പുതിയ റെക്കോർഡ് തിരുത്തൽ ലോഗ് ചെയ്യുക**:
   * **"Log Record Override"** ക്ലിക്ക് ചെയ്യുക.
   * മാർക്ക്, ഫീസ്, അല്ലെങ്കിൽ വിദ്യാർത്ഥി രേഖ തിരഞ്ഞെടുക്കുക.
   * മാറ്റം വരുത്തേണ്ട ഫീൽഡും പുതിയ മൂല്യവും നൽകുക.
   * **മാറ്റത്തിനുള്ള കാരണം (Mandatory Reason)**, അംഗീകാര നമ്പർ എന്നിവ നൽകി **"Seal & Append to Ledger"** ക്ലിക്ക് ചെയ്യുക. തൽക്ഷണം ഒരു പുതിയ SHA-256 ബ്ലോക്ക് ചെയിനിൽ കൂട്ടിച്ചേർക്കപ്പെടും.
