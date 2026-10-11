# Frontend Integration Examples 💻

## React Components for Parent Engagement Features

This guide provides example React/Next.js components to integrate with the Parent Engagement API.

---

## Setup

### Install Dependencies

```bash
npm install axios react-query date-fns lucide-react
npm install -D @types/node
```

### API Client Setup

```typescript
// lib/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  timeout: 30000,
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const parentPortalApi = {
  getMyChildren: () => apiClient.get('/parent-portal/my-children'),
  getStudentDashboard: (studentId: string) => 
    apiClient.get(`/parent-portal/student/${studentId}/dashboard`),
  getActivities: (studentId: string, params?: any) =>
    apiClient.get(`/parent-portal/student/${studentId}/activities`, { params }),
  getMedia: (studentId: string, params?: any) =>
    apiClient.get(`/parent-portal/student/${studentId}/media`, { params }),
  getHomework: (studentId: string, params?: any) =>
    apiClient.get(`/parent-portal/student/${studentId}/homework`, { params }),
  getBehavior: (studentId: string, params?: any) =>
    apiClient.get(`/parent-portal/student/${studentId}/behavior`, { params }),
  getBookings: () => apiClient.get('/parent-portal/bookings'),
  getNotifications: (limit: number = 10) =>
    apiClient.get('/parent-portal/notifications', { params: { limit } }),
};
```

---

## Component Examples

### 1. Student Dashboard

```typescript
// components/StudentDashboard.tsx
import React from 'react';
import { useQuery } from 'react-query';
import { parentPortalApi } from '@/lib/api-client';
import { ActivityFeed } from './ActivityFeed';
import { HomeworkSummary } from './HomeworkSummary';
import { BehaviorChart } from './BehaviorChart';
import { UpcomingBookings } from './UpcomingBookings';

interface StudentDashboardProps {
  studentId: string;
}

export function StudentDashboard({ studentId }: StudentDashboardProps) {
  const { data: dashboard, isLoading } = useQuery(
    ['student-dashboard', studentId],
    () => parentPortalApi.getStudentDashboard(studentId),
    { refetchInterval: 60000 } // Refresh every minute
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const { student, summaries, recentActivities, upcomingHomework, recentBehavior, upcomingBookings } = dashboard.data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Student Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <img
            src={student.photo || '/default-avatar.png'}
            alt={`${student.firstName} ${student.lastName}`}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-600">
              {student.currentClass?.name} {student.currentStream?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Activities Today"
          value={summaries.activities.today}
          icon="📱"
          color="blue"
        />
        <SummaryCard
          title="Behavior Points"
          value={summaries.behavior.totals.points}
          icon="⭐"
          color="yellow"
        />
        <SummaryCard
          title="Homework Completion"
          value={`${summaries.homework.submissionRate.toFixed(1)}%`}
          icon="📚"
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          <ActivityFeed activities={recentActivities} compact />
          <button className="mt-4 text-blue-600 hover:underline">
            View All Activities →
          </button>
        </div>

        {/* Upcoming Homework */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Homework</h2>
          <HomeworkList homework={upcomingHomework} />
        </div>

        {/* Behavior Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Behavior Trends</h2>
          <BehaviorChart data={summaries.behavior} />
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Teacher Meetings</h2>
          <UpcomingBookings bookings={upcomingBookings} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="animate-pulse">Loading...</div>;
}
```

### 2. Activity Feed Component

```typescript
// components/ActivityFeed.tsx
import React from 'react';
import { useInfiniteQuery } from 'react-query';
import { parentPortalApi } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  studentId: string;
  compact?: boolean;
  activities?: any[]; // For compact mode with pre-loaded activities
}

export function ActivityFeed({ studentId, compact, activities: preloadedActivities }: ActivityFeedProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery(
    ['activities', studentId],
    ({ pageParam = 1 }) =>
      parentPortalApi.getActivities(studentId, { page: pageParam, limit: 20 }),
    {
      enabled: !compact, // Only fetch if not compact mode
      getNextPageParam: (lastPage) => {
        const { page, totalPages } = lastPage.data.pagination;
        return page < totalPages ? page + 1 : undefined;
      },
    }
  );

  const activities = compact ? preloadedActivities : data?.pages.flatMap(p => p.data.data) || [];

  if (isLoading && !compact) {
    return <div>Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}

      {!compact && hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded"
        >
          Load More
        </button>
      )}
    </div>
  );
}

function ActivityCard({ activity }) {
  const activityIcons = {
    ATTENDANCE: '✓',
    PARTICIPATION: '🙋',
    ACHIEVEMENT: '🏆',
    ASSIGNMENT: '📝',
    BEHAVIOR: '⭐',
    EVENT: '🎉',
    ANNOUNCEMENT: '📢',
    MEAL: '🍽️',
    TRANSPORT: '🚌',
    OTHER: '📌',
  };

  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
        {activityIcons[activity.activityType]}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{activity.title}</h3>
        {activity.description && (
          <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
          </span>
          {activity.mediaItems?.length > 0 && (
            <span className="text-xs text-blue-600">
              📸 {activity.mediaItems.length} {activity.mediaItems.length === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 3. Media Gallery Component

```typescript
// components/MediaGallery.tsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { parentPortalApi } from '@/lib/api-client';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface MediaGalleryProps {
  studentId: string;
}

export function MediaGallery({ studentId }: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');

  const { data, isLoading } = useQuery(
    ['media', studentId, filter],
    () => parentPortalApi.getMedia(studentId, {
      fileType: filter !== 'ALL' ? filter : undefined,
    })
  );

  if (isLoading) {
    return <GallerySkeleton />;
  }

  const mediaItems = data?.data.data || [];
  const photos = mediaItems.filter(m => m.fileType === 'PHOTO');

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {['ALL', 'PHOTO', 'VIDEO'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 ${
              filter === type
                ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaItems.map((media, index) => (
          <MediaItem
            key={media.id}
            media={media}
            onClick={() => media.fileType === 'PHOTO' && handleImageClick(index)}
          />
        ))}
      </div>

      {/* Lightbox for Photos */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={currentIndex}
        slides={photos.map(p => ({ src: p.fileUrl, alt: p.caption }))}
      />
    </div>
  );
}

function MediaItem({ media, onClick }) {
  const isVideo = media.fileType === 'VIDEO';

  return (
    <div
      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
      onClick={onClick}
    >
      {isVideo ? (
        <>
          <video
            src={media.fileUrl}
            className="w-full h-full object-cover"
            poster={media.thumbnailUrl}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <span className="text-white text-4xl">▶</span>
          </div>
        </>
      ) : (
        <img
          src={media.thumbnailUrl || media.fileUrl}
          alt={media.caption}
          className="w-full h-full object-cover"
        />
      )}
      {media.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
          {media.caption}
        </div>
      )}
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
```

### 4. Homework Tracker Component

```typescript
// components/HomeworkTracker.tsx
import React from 'react';
import { useQuery } from 'react-query';
import { parentPortalApi } from '@/lib/api-client';
import { format, isPast } from 'date-fns';

interface HomeworkTrackerProps {
  studentId: string;
}

export function HomeworkTracker({ studentId }: HomeworkTrackerProps) {
  const { data, isLoading } = useQuery(
    ['homework', studentId],
    () => parentPortalApi.getHomework(studentId)
  );

  const { data: summary } = useQuery(
    ['homework-summary', studentId],
    () => parentPortalApi.getHomework(studentId, { summary: true })
  );

  if (isLoading) {
    return <div>Loading homework...</div>;
  }

  const homework = data?.data.data || [];
  const stats = summary?.data || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total || 0} color="gray" />
        <StatCard label="Submitted" value={stats.submitted || 0} color="green" />
        <StatCard label="Pending" value={stats.pending || 0} color="yellow" />
        <StatCard label="Overdue" value={stats.overdue || 0} color="red" />
      </div>

      {/* Homework List */}
      <div className="space-y-3">
        {homework.map((hw) => (
          <HomeworkCard key={hw.id} homework={hw} />
        ))}
      </div>
    </div>
  );
}

function HomeworkCard({ homework }) {
  const statusColors = {
    NOT_SUBMITTED: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    SUBMITTED: 'bg-blue-50 border-blue-200 text-blue-800',
    GRADED: 'bg-green-50 border-green-200 text-green-800',
    LATE: 'bg-red-50 border-red-200 text-red-800',
  };

  const isOverdue = homework.status === 'LATE' || 
    (homework.status === 'NOT_SUBMITTED' && isPast(new Date(homework.dueDate)));

  return (
    <div className={`border-2 rounded-lg p-4 ${statusColors[homework.status]}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{homework.title}</h3>
          <p className="text-sm opacity-80 mt-1">{homework.subject.name}</p>
          {homework.description && (
            <p className="text-sm mt-2">{homework.description}</p>
          )}
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white bg-opacity-50">
          {homework.status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-4 text-sm">
        <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
          📅 Due: {format(new Date(homework.dueDate), 'MMM dd, yyyy')}
        </span>
        <span>🎯 {homework.maxMarks} marks</span>
        {homework.submission?.score !== undefined && (
          <span className="font-semibold">
            ✓ Score: {homework.submission.score}/{homework.maxMarks}
          </span>
        )}
      </div>

      {homework.submission?.feedback && (
        <div className="mt-3 p-3 bg-white bg-opacity-50 rounded">
          <p className="text-sm font-medium">Teacher Feedback:</p>
          <p className="text-sm mt-1">{homework.submission.feedback}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4 text-center`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
```

### 5. Booking Calendar Component

```typescript
// components/BookingCalendar.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { parentPortalApi } from '@/lib/api-client';
import { format, addDays, startOfWeek } from 'date-fns';

interface BookingCalendarProps {
  studentId: string;
  teacherId: string;
}

export function BookingCalendar({ studentId, teacherId }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: slotsData } = useQuery(
    ['available-slots', teacherId, format(selectedDate, 'yyyy-MM-dd')],
    () => parentPortalApi.getAvailableSlots(teacherId, format(selectedDate, 'yyyy-MM-dd'))
  );

  const bookingMutation = useMutation(
    (bookingData: any) => parentPortalApi.createBooking(bookingData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['available-slots']);
        queryClient.invalidateQueries(['bookings']);
        setSelectedSlot(null);
      },
    }
  );

  const slots = slotsData?.data || [];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i));

  const handleBookSlot = () => {
    if (!selectedSlot) return;

    bookingMutation.mutate({
      studentId,
      teacherId,
      bookingDate: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      purpose: 'Discuss student progress',
      meetingType: 'IN_PERSON',
    });
  };

  return (
    <div className="space-y-6">
      {/* Week Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <button
            key={day.toString()}
            onClick={() => setSelectedDate(day)}
            className={`p-3 rounded-lg text-center ${
              format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div className="text-xs font-medium">{format(day, 'EEE')}</div>
            <div className="text-lg font-bold">{format(day, 'd')}</div>
          </button>
        ))}
      </div>

      {/* Available Slots */}
      <div>
        <h3 className="font-semibold mb-3">
          Available Slots for {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        {slots.length === 0 ? (
          <p className="text-gray-600">No available slots for this date</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {slots.map((slot, index) => (
              <button
                key={index}
                onClick={() => setSelectedSlot(slot)}
                className={`p-3 rounded-lg border-2 transition ${
                  selectedSlot === slot
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold">{slot.startTime}</div>
                <div className="text-sm text-gray-600">{slot.duration} min</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Book Button */}
      {selectedSlot && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="font-semibold">Selected Slot</p>
            <p className="text-sm text-gray-600">
              {format(selectedDate, 'MMM d, yyyy')} at {selectedSlot.startTime}
            </p>
          </div>
          <button
            onClick={handleBookSlot}
            disabled={bookingMutation.isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {bookingMutation.isLoading ? 'Booking...' : 'Book Meeting'}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Custom Hooks

```typescript
// hooks/useStudentData.ts
import { useQuery } from 'react-query';
import { parentPortalApi } from '@/lib/api-client';

export function useStudentData(studentId: string) {
  return useQuery(
    ['student-dashboard', studentId],
    () => parentPortalApi.getStudentDashboard(studentId),
    {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true,
    }
  );
}

export function useActivities(studentId: string, filters?: any) {
  return useQuery(
    ['activities', studentId, filters],
    () => parentPortalApi.getActivities(studentId, filters),
    {
      keepPreviousData: true,
    }
  );
}

export function useNotifications() {
  return useQuery(
    ['notifications'],
    () => parentPortalApi.getNotifications(),
    {
      refetchInterval: 30000, // 30 seconds
    }
  );
}
```

---

## Next Steps

1. Copy these components into your React/Next.js project
2. Install dependencies
3. Configure API client with your backend URL
4. Customize styling to match your design system
5. Add error boundaries and loading states
6. Implement real-time updates with WebSocket (optional)

---

**Happy Coding!** 🚀
