# Language Update: Malayalam → Swahili

## Critical Update Required

The WhatsApp integration was initially implemented with **Malayalam (ml)** support, but the system is for **Kenyan schools** and should support **Swahili (sw)** instead.

## Global Find & Replace

Perform these replacements across all WhatsApp module files:

### 1. Type Definitions
```typescript
// REPLACE:
language?: 'en' | 'ml'
// WITH:
language?: 'en' | 'sw'
```

### 2. Language Parameter
```typescript
// REPLACE:
language: 'en' | 'ml'
// WITH:
language: 'en' | 'sw'
```

### 3. Enum Values
```typescript
// REPLACE:
enum: ['en', 'ml']
// WITH:
enum: ['en', 'sw']
```

### 4. Comments
```
// REPLACE: English or Malayalam
// WITH: English or Swahili

// REPLACE: English/Malayalam
// WITH: English/Swahili

// REPLACE: (English/Malayalam)
// WITH: (English/Swahili)
```

### 5. Message Content Labels
```typescript
// REPLACE: // Malayalam message
// WITH: // Swahili message

// REPLACE: if (language === 'ml') {
// WITH: if (language === 'sw') {
```

## Swahili Message Templates

### Fee Reminder - Swahili
```
🏫 *Kikumbusho cha Ada ya Shule*

Mzazi mpendwa,

Mwanafunzi: *{studentName}*
Darasa: *{className}*
Muhula: *{termName}*

Kiasi Kilichobaki: *{amount}*
Tarehe ya Mwisho: *{dueDate}*
Nambari ya Ankara: {invoiceNumber}

Tafadhali hakikisha malipo yanafanywa kabla ya tarehe ya mwisho.

Asante
```

### Fee Reminder Overdue - Swahili
```
🏫 *Notisi ya Ada ya Shule*

Mzazi mpendwa,

Mwanafunzi: *{studentName}*
Darasa: *{className}*
Muhula: *{termName}*

⚠️ Malipo ya ada ya mtoto wako yamechelewa.

Kiasi Kilichobaki: *{amount}*
Tarehe ya Mwisho: *{dueDate}*
Nambari ya Ankara: {invoiceNumber}

Tafadhali fanya malipo haraka iwezekanavyo ili kuepuka usumbufu wowote.

Asante
```

### Attendance Alert (Absent) - Swahili
```
🏫 *Arifa ya Mahudhurio*

Mzazi mpendwa,

Mwanafunzi: *{studentName}*
Darasa: *{className}*
Tarehe: *{date}*

⚠️ Mtoto wako hakuhudhuria shuleni leo.

Ikiwa hii ni jambo la ajabu, tafadhali wasiliana na shule.

Asante
```

### Attendance Alert (Late) - Swahili
```
🏫 *Arifa ya Kuchelewa*

Mzazi mpendwa,

Mwanafunzi: *{studentName}*
Darasa: *{className}*
Tarehe: *{date}*

ℹ️ Mtoto wako alifika shuleni kwa kuchelewa leo.

Asante
```

### Daily Attendance Summary - Swahili
```
🏫 *Muhtasari wa Mahudhurio ya Kila Siku*

Mwanafunzi: *{studentName}*
Darasa: *{className}*
Tarehe: *{date}*

Hali: {emoji} *{status}*

Asante
```

### Payment Confirmation - Swahili
```
✅ *Uthibitisho wa Malipo*

Mzazi mpendwa,

Mwanafunzi: *{studentName}*

Malipo yako yamepokelewa kwa mafanikio.

Kiasi Kilicholipwa: *{amount}*
Tarehe: {paymentDate}
Nambari ya Risiti: {receiptNumber}
Kiasi Kilichobaki: *{balance}*

Asante!
```

### Report Card - Swahili
```
📊 *Kadi ya Ripoti Iko Tayari*

Mzazi mpendwa,

Mwanafunzi: *{studentName}*
Darasa: *{className}*
Muhula: *{termName}*

📈 Muhtasari wa Utendaji:
Jumla ya Alama: {obtainedMarks}/{totalMarks}
Asilimia: {percentage}%
Daraja: *{grade}*
Nafasi: *{position}*

Tafadhali angalia kadi ya ripoti kamili iliyoambatishwa kama PDF.

Hongera! 🎉
```

### Report Card with Subject Breakdown - Swahili
```
📊 *Muhtasari wa Kadi ya Ripoti*

Mwanafunzi: *{studentName}*
Darasa: *{className}*
Muhula: *{termName}*

📚 Utendaji wa Masomo:
{subjectBreakdown}

Daraja la Jumla: *{grade}*
Nafasi: *{position}*

Umefanya vizuri! 🎓
```

## Status Translations (Swahili)

```typescript
const statusText = {
  PRESENT: 'Yupo',
  ABSENT: 'Hayupo',
  LATE: 'Amechelewa',
  EXCUSED: 'Ruhusa',
};
```

## Files That Need Updates

All files in:
- `apps/api/src/modules/communications/whatsapp/`
  - `whatsapp.service.ts`
  - `dto/send-message.dto.ts`
  - `notifications/fee-reminder.service.ts`
  - `notifications/fee-reminder.controller.ts`
  - `notifications/attendance-alert.service.ts`
  - `notifications/attendance-alert.controller.ts`
  - `notifications/report-card.service.ts`
  - `notifications/report-card.controller.ts`
  - `notifications/dto/*.ts`
  - `scheduler/*.ts`
  - `settings/*.ts`

Documentation files:
- `WHATSAPP_INTEGRATION.md`
- `docs/WHATSAPP_QUICK_START.md`
- `apps/api/src/modules/communications/whatsapp/README.md`

## Search & Replace Script

Use your IDE's find-and-replace feature (Ctrl+Shift+H in VSCode):

1. **Find:** `'ml'` | **Replace:** `'sw'`
2. **Find:** `"ml"` | **Replace:** `"sw"`  
3. **Find:** `Malayalam` | **Replace:** `Swahili`
4. **Find:** `malayalam` | **Replace:** `swahili`

Then manually update the Swahili message content in each service file.

## Testing After Update

1. Update `.env`:
   ```env
   WHATSAPP_DEFAULT_LANGUAGE="sw"
   ```

2. Test endpoints with `language: "sw"`:
   ```bash
   curl -X POST http://localhost:3001/api/v1/whatsapp/fee-reminders/send \
     -H "Content-Type: application/json" \
     -d '{"language": "sw", "overdueOnly": true}'
   ```

3. Verify Swahili messages are sent correctly

## Priority Files to Update First

1. ✅ `whatsapp.service.ts` (base service)
2. `notifications/fee-reminder.service.ts`
3. `notifications/attendance-alert.service.ts`
4. `notifications/report-card.service.ts`
5. `settings/whatsapp-settings.service.ts`

Then update DTOs, controllers, and documentation.

---

**This is a critical fix for the Kenyan market! 🇰🇪**
