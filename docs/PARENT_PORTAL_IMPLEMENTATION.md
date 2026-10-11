# Parent Portal PWA - Implementation Guide

**Module:** Parent Portal Progressive Web App  
**Version:** 1.0.0  
**Status:** Foundation Complete  
**Framework:** Next.js 14 (App Router)

---

## Overview

The Krypton Parent Portal is a mobile-first Progressive Web App that allows parents to:

- View their children's attendance records
- Check fee balances and payment history
- Pay fees via M-Pesa STK Push
- View examination grades and report cards
- Receive school announcements
- Contact teachers (future)
- View timetables (future)

---

## Architecture

### Technology Stack

**Frontend:**
- Next.js 14 (App Router) - React framework
- TypeScript - Type safety
- Tailwind CSS - Utility-first styling
- Zustand - State management
- Axios - HTTP client
- NextAuth - Authentication
- date-fns - Date utilities
- Lucide React - Icons

**PWA Features:**
- Service Worker (offline support)
- Web App Manifest
- Push notifications ready
- Install prompt
- Offline-first data caching

### Project Structure

```
apps/web/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── icon-192.png           # App icons
│   ├── icon-512.png
│   └── sw.js                  # Service worker
├── src/
│   ├── app/                   # Next.js 14 App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── children/
│   │   │   ├── attendance/
│   │   │   ├── fees/
│   │   │   ├── grades/
│   │   │   ├── reports/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── attendance/        # Attendance components
│   │   ├── fees/              # Fee components
│   │   └── grades/            # Grade components
│   ├── lib/
│   │   ├── api-client.ts      # API integration
│   │   ├── auth.ts            # Authentication
│   │   └── utils.ts           # Utilities
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChildren.ts
│   │   └── useAttendance.ts
│   └── types/
│       └── index.ts           # TypeScript types
├── tailwind.config.js
├── next.config.js
└── package.json
```

---

## Key Features Implementation

### 1. Authentication

**Login Page** (`app/(auth)/login/page.tsx`):
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.login(email, password);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Parent Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded mb-4"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded mb-4"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 2. Dashboard

**Dashboard Page** (`app/(dashboard)/dashboard/page.tsx`):
```tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const data = await api.getMyChildren();
      setChildren(data);
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">My Children</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children.map((child) => (
          <ChildCard key={child.id} child={child} />
        ))}
      </div>
    </div>
  );
}
```

### 3. Attendance View

**Attendance Page** (`app/(dashboard)/attendance/[studentId]/page.tsx`):
```tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { format, subDays } from 'date-fns';

export default function AttendancePage({ params }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    
    try {
      const data = await api.getStudentAttendanceReport(
        params.studentId,
        startDate,
        endDate
      );
      setReport(data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Attendance Report</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Days" value={report.summary.totalDays} />
        <StatCard label="Present" value={report.summary.present} color="green" />
        <StatCard label="Absent" value={report.summary.absent} color="red" />
        <StatCard label="Rate" value={`${report.summary.attendanceRate}%`} />
      </div>

      <div className="space-y-2">
        {report.records.map((record) => (
          <AttendanceRecord key={record.id} record={record} />
        ))}
      </div>
    </div>
  );
}
```

### 4. Fee Payment

**Fee Payment Page** (`app/(dashboard)/fees/[invoiceId]/pay/page.tsx`):
```tsx
'use client';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@krypton/utils';

export default function PayFeePage({ params }) {
  const [phoneNumber, setPhoneNumber] = useState('254');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.initiateSTKPush({
        invoiceId: params.invoiceId,
        phoneNumber,
        amount: parseInt(amount) * 100, // Convert to cents
      });

      alert(response.customerMessage);
      // Poll for payment status or redirect
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Pay School Fees</h1>
      
      <form onSubmit={handlePayment} className="max-w-md">
        <div className="mb-4">
          <label className="block mb-2">M-Pesa Phone Number</label>
          <input
            type="tel"
            placeholder="254712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            pattern="254[0-9]{9}"
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Amount (KES)</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {loading ? 'Processing...' : 'Pay with M-Pesa'}
        </button>
      </form>
    </div>
  );
}
```

### 5. Grades View

**Grades Page** (`app/(dashboard)/grades/[studentId]/page.tsx`):
```tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export default function GradesPage({ params }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const data = await api.getStudentGrades(params.studentId);
      setGrades(data);
    } catch (error) {
      console.error('Failed to load grades:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Examination Results</h1>
      
      <div className="space-y-4">
        {grades.map((grade) => (
          <div key={grade.id} className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{grade.subject.name}</h3>
                <p className="text-sm text-gray-600">{grade.examination.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{grade.letterGrade}</p>
                <p className="text-sm">{grade.percentage}%</p>
                <p className="text-xs text-gray-600">
                  {grade.score}/{grade.totalMarks}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Progressive Web App Features

### Service Worker (`public/sw.js`)

```javascript
const CACHE_NAME = 'krypton-parent-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### Register Service Worker (`app/layout.tsx`)

```tsx
'use client';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Mobile Optimization

### Responsive Design

- Mobile-first approach (320px+)
- Touch-friendly targets (44px minimum)
- Swipe gestures
- Bottom navigation for mobile
- Card-based layout
- Pull-to-refresh

### Performance

- Code splitting (Next.js automatic)
- Image optimization (Next Image)
- Lazy loading components
- API response caching
- Optimistic UI updates

---

## Security

- JWT token management
- Automatic token refresh
- Secure token storage
- HTTPS required in production
- CSP headers
- XSS protection

---

## Deployment

### Environment Variables

```.env
NEXT_PUBLIC_API_URL=https://api.kryptonschool.com
NEXT_PUBLIC_APP_NAME=Krypton School ERP
NEXTAUTH_URL=https://parent.kryptonschool.com
NEXTAUTH_SECRET=your_secret_here
```

### Build & Deploy

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Start production server
pnpm start

# Or deploy to Vercel
vercel deploy
```

---

## Future Enhancements

- [ ] Push notifications for announcements
- [ ] Offline data caching
- [ ] Dark mode
- [ ] Multi-language (English, Swahili)
- [ ] Biometric authentication
- [ ] In-app messaging with teachers
- [ ] Calendar view for events
- [ ] Download report cards as PDF
- [ ] Share attendance/grades
- [ ] Multiple children management
- [ ] Payment history export

---

**Status:** Foundation Complete ✅  
**Ready For:** Full UI implementation with real data integration
