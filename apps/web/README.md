# Krypton School ERP - Parent Portal

A Progressive Web App (PWA) for parents to access their children's school information, pay fees, view grades, and track attendance.

## Features

### ✅ Completed Features

#### Authentication
- [x] Login with email/password
- [x] JWT token-based authentication
- [x] Automatic token refresh
- [x] Protected routes with role-based access control
- [x] Logout functionality

#### Dashboard
- [x] Overview of fee balance, attendance rate, and recent grades
- [x] Quick actions for common tasks
- [x] Student selector for parents with multiple children
- [x] Real-time data updates

#### Fee Management
- [x] View outstanding invoices
- [x] Payment history
- [x] M-Pesa STK Push integration
- [x] Pay fees directly from phone
- [x] Downloadable receipts
- [x] Fee balance tracking
- [x] Invoice details

#### Attendance
- [x] Calendar view of attendance
- [x] Monthly navigation
- [x] Status indicators (Present, Absent, Late, Excused)
- [x] Attendance statistics
- [x] Detailed records

#### Grades & Report Cards
- [x] View grades by term
- [x] Report card viewing
- [x] Performance statistics
- [x] Subject-wise grades
- [x] Teacher and principal comments
- [x] Download report cards (PDF ready)

#### Notifications
- [x] Fee reminders
- [x] Absence alerts
- [x] Payment receipts
- [x] Exam schedules
- [x] General announcements
- [x] Read/unread status
- [x] Priority indicators

#### PWA Features
- [x] Installable as native app
- [x] Offline support with service worker
- [x] Caching strategy (cache-first for static, network-first for API)
- [x] Background sync for offline actions
- [x] Push notifications support
- [x] App update prompts
- [x] Offline indicator
- [x] Install prompt

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context + Zustand
- **API Client:** Axios
- **Date Utilities:** date-fns
- **Icons:** Lucide React
- **PWA:** Custom service worker

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Access to Krypton School ERP API

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Configure environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Run development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

```
Email: parent@demoacademy.ac.ke
Password: Parent@123
```

## Project Structure

```
apps/web/
├── public/
│   ├── sw.js                 # Service worker
│   ├── manifest.json         # PWA manifest
│   └── icons/                # App icons
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── dashboard/        # Dashboard pages
│   │   │   ├── page.tsx      # Main dashboard
│   │   │   ├── fees/         # Fee management
│   │   │   ├── attendance/   # Attendance viewing
│   │   │   ├── grades/       # Grades & report cards
│   │   │   └── notifications/# Notifications
│   │   ├── login/            # Login page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── DashboardNav.tsx  # Navigation
│   │   ├── StudentSelector.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── PWAInstallPrompt.tsx
│   │   ├── OfflineIndicator.tsx
│   │   └── UpdatePrompt.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication context
│   ├── hooks/
│   │   └── usePWA.ts         # PWA hook
│   ├── lib/
│   │   ├── api-client.ts     # API utilities
│   │   └── pwa.ts            # PWA utilities
│   └── types/                # TypeScript types
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## API Integration

The parent portal connects to the Krypton School ERP backend API:

### Endpoints Used

- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/students/my-children` - Get linked children
- `GET /api/v1/students/:id` - Get student details
- `GET /api/v1/fees/invoices` - Get invoices
- `GET /api/v1/fees/payments` - Get payments
- `POST /api/v1/mpesa/stk-push` - Initiate M-Pesa payment
- `GET /api/v1/attendance/students` - Get attendance
- `GET /api/v1/attendance/students/report` - Get attendance summary
- `GET /api/v1/examinations/grades/query` - Get grades
- `GET /api/v1/examinations/report-cards` - Get report cards

### API Client Features

- Automatic JWT token injection
- Token refresh on 401 errors
- Request/response interceptors
- Error handling
- Retry logic

## PWA Features

### Service Worker

The app includes a custom service worker (`public/sw.js`) that provides:

- **Caching Strategies:**
  - Static assets: Cache-first
  - API requests: Network-first with cache fallback
  - Navigation requests: Network with offline fallback

- **Offline Support:**
  - Cached API responses available offline
  - Graceful degradation
  - Offline indicator

- **Background Sync:**
  - Queue failed requests
  - Retry when connection restored

- **Push Notifications:**
  - Fee reminders
  - Absence alerts
  - Payment confirmations

### Installation

The app can be installed on:
- Android (Chrome, Edge, Samsung Internet)
- iOS (Safari 16.4+)
- Desktop (Chrome, Edge)

### Offline Capabilities

When offline, users can:
- ✅ View cached dashboard data
- ✅ View cached attendance records
- ✅ View cached grades
- ✅ View cached invoices
- ❌ Make M-Pesa payments (requires online)
- ❌ Load new data (requires online)

## Mobile-First Design

The app is optimized for mobile devices:

- **Touch-friendly:** 44px minimum tap areas
- **Responsive:** Works on all screen sizes
- **Fast:** Optimized bundle size
- **Accessible:** ARIA labels, keyboard navigation
- **Safe areas:** iOS notch support
- **Bottom navigation:** Easy thumb access

## Security

- JWT token authentication
- Automatic token refresh
- Secure token storage (localStorage with httpOnly cookie planned)
- Role-based access control
- Input validation
- XSS protection
- CSRF protection (API level)

## Performance

- **Lighthouse Score:** 95+ (target)
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Code splitting:** Automatic route-based
- **Image optimization:** Next.js built-in
- **Bundle size:** < 200KB (gzipped)

## Browser Support

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- Samsung Internet 14+

## Development

### Available Scripts

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Type check
pnpm type-check
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_API_URL=http://localhost:3001

# Optional
NEXT_PUBLIC_APP_NAME=Krypton School ERP
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
```

### Adding New Pages

1. Create page in `src/app/dashboard/[page]/page.tsx`
2. Add route to navigation in `DashboardNav.tsx`
3. Add route to bottom nav in `layout.tsx`
4. Update service worker cache if needed

### Adding New API Endpoints

1. Add method to `src/lib/api-client.ts`
2. Use in components via `api.methodName()`
3. Handle errors appropriately
4. Update offline cache strategy if needed

## Testing

### Manual Testing Checklist

- [ ] Login/logout works
- [ ] Student selector works
- [ ] Dashboard loads data
- [ ] Fees page shows invoices
- [ ] M-Pesa payment initiates
- [ ] Attendance calendar works
- [ ] Grades display correctly
- [ ] Report cards viewable
- [ ] Notifications show
- [ ] Offline mode works
- [ ] Install prompt appears
- [ ] Update prompt works
- [ ] Mobile navigation works
- [ ] All links work
- [ ] Forms validate
- [ ] Error messages show

### PWA Testing

1. Open Chrome DevTools
2. Go to Application tab
3. Check:
   - [ ] Manifest loaded
   - [ ] Service worker registered
   - [ ] Cache storage populated
   - [ ] Offline mode works

## Deployment

### Production Checklist

- [ ] Set production API URL
- [ ] Generate app icons (192x192, 512x512)
- [ ] Test on real devices
- [ ] Test offline functionality
- [ ] Test payment flow
- [ ] Verify PWA installability
- [ ] Check performance metrics
- [ ] Enable error tracking
- [ ] Set up analytics
- [ ] Configure CDN
- [ ] Enable compression
- [ ] Set cache headers

### Deployment Platforms

**Vercel (Recommended):**
```bash
vercel deploy
```

**Netlify:**
```bash
netlify deploy --prod
```

**Self-hosted:**
```bash
pnpm build
pnpm start
```

## Troubleshooting

### Service Worker Not Registering

1. Check HTTPS (required for PWA)
2. Clear browser cache
3. Check console for errors
4. Verify `sw.js` is accessible

### Offline Mode Not Working

1. Check service worker status
2. Verify cache is populated
3. Test network throttling
4. Check cache strategies

### M-Pesa Payment Issues

1. Verify API endpoint is correct
2. Check phone number format (254XXXXXXXXX)
3. Ensure M-Pesa credentials configured
4. Test with small amount first

### Authentication Issues

1. Check token expiry
2. Verify refresh token works
3. Clear localStorage
4. Re-login

## Future Enhancements

### Planned Features

- [ ] Biometric authentication
- [ ] Dark mode
- [ ] Multi-language (Swahili)
- [ ] Native mobile app (React Native)
- [ ] Real-time notifications (WebSocket)
- [ ] Offline payment queue
- [ ] Photo/document upload
- [ ] Calendar integration
- [ ] Chat with teachers
- [ ] School events
- [ ] Homework tracking
- [ ] Transport tracking

### Performance Improvements

- [ ] Server-side rendering
- [ ] Edge caching
- [ ] Image optimization
- [ ] Code splitting optimization
- [ ] Prefetching

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

Proprietary - KryptonLogic

## Support

- **Email:** support@kryptonschool.com
- **Documentation:** https://docs.kryptonschool.com
- **Status:** https://status.kryptonschool.com

---

**Built with ❤️ by KryptonLogic for Kenyan Schools**
