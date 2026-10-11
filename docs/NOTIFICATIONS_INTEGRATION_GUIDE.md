# Parent Engagement Notifications Integration Guide 🔔

## Overview

This guide explains how to integrate the Parent Engagement Features with the existing Communications module to send automatic notifications to parents.

## Architecture

```
ActivityFeedService
BehaviorService        ──▶  ParentEngagementNotificationsService  ──▶  CommunicationsService  ──▶  SMS/Email
BookingsService                                                                                        Providers
```

## Integration Steps

### Step 1: Enable the Notifications Module

Add the module to your `app.module.ts`:

```typescript
import { ParentEngagementNotificationsModule } from './modules/parent-engagement-notifications/parent-engagement-notifications.module';

@Module({
  imports: [
    // ... other modules
    ParentEngagementNotificationsModule,
  ],
})
export class AppModule {}
```

### Step 2: Inject into Services

Inject the notifications service into your feature services:

#### In `activity-feed.service.ts`:

```typescript
import { ParentEngagementNotificationsService } from '../parent-engagement-notifications/parent-engagement-notifications.service';

@Injectable()
export class ActivityFeedService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private notificationsService: ParentEngagementNotificationsService, // Add this
  ) {}

  async create(dto: CreateActivityDto, userId: string) {
    const activity = await this.prisma.activityFeed.create({ /* ... */ });
    
    // Send notification
    if (activity.isVisibleToParents) {
      await this.notificationsService.sendActivityNotification(activity.id);
    }
    
    return activity;
  }
}
```

#### In `behavior.service.ts`:

```typescript
import { ParentEngagementNotificationsService } from '../parent-engagement-notifications/parent-engagement-notifications.service';

@Injectable()
export class BehaviorService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private notificationsService: ParentEngagementNotificationsService, // Add this
  ) {}

  async create(dto: CreateBehaviorDto, userId: string) {
    const record = await this.prisma.behaviorRecord.create({ /* ... */ });
    
    // Send alert for negative behaviors or if parent notification requested
    if (dto.parentNotified || record.behaviorType === 'NEGATIVE') {
      await this.notificationsService.sendBehaviorAlert(record.id);
    }
    
    return record;
  }
}
```

#### In `bookings.service.ts`:

```typescript
import { ParentEngagementNotificationsService } from '../parent-engagement-notifications/parent-engagement-notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private notificationsService: ParentEngagementNotificationsService, // Add this
  ) {}

  async confirmBooking(id: string, teacherId: string) {
    const booking = await this.prisma.parentTeacherBooking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
    
    // Send confirmation to parent
    await this.notificationsService.sendBookingConfirmation(booking.id);
    
    return booking;
  }
}
```

### Step 3: Connect to Communications Module

In `parent-engagement-notifications.service.ts`, uncomment and implement the actual communication calls:

```typescript
import { CommunicationsService } from '../communications/communications.service';

@Injectable()
export class ParentEngagementNotificationsService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private communicationsService: CommunicationsService, // Add this
  ) {}

  async sendActivityNotification(activityId: string) {
    // ... prepare message and recipients ...

    // Replace placeholder with actual call
    await this.communicationsService.sendMessage({
      channel: 'SMS',
      recipients,
      message,
      messageType: 'ACTIVITY_UPDATE',
      priority: 'NORMAL',
    });
  }

  // Similarly for other methods...
}
```

### Step 4: Set Up Scheduled Jobs (Optional)

For daily digests and homework reminders, set up scheduled jobs using NestJS Schedule or Bull Queue:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationSchedulerService {
  constructor(
    private notificationsService: ParentEngagementNotificationsService,
  ) {}

  // Send daily digest at 6 PM
  @Cron('0 18 * * *')
  async sendDailyDigest() {
    await this.notificationsService.sendDailyActivityDigest();
  }

  // Send homework reminders every day at 7 PM for next day's homework
  @Cron('0 19 * * *')
  async sendHomeworkReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const assignments = await this.prisma.assignment.findMany({
      where: {
        dueDate: {
          lte: tomorrow,
          gte: new Date(),
        },
      },
      include: {
        class: {
          include: {
            currentStudents: true,
          },
        },
      },
    });

    for (const assignment of assignments) {
      for (const student of assignment.class.currentStudents) {
        await this.notificationsService.sendHomeworkReminder(
          assignment.id,
          student.id,
        );
      }
    }
  }
}
```

## Notification Types

### 1. Activity Notifications

**Trigger:** When teacher creates a new activity  
**Recipients:** All guardians with `receiveUpdates: true`  
**Priority:** NORMAL  
**Channel:** SMS (can add Email/Push)

**Example Message:**
```
John Doe: Participated in Math today. Check the parent portal for more details.
```

### 2. Behavior Alerts

**Trigger:** When teacher records a behavior incident  
**Recipients:** Primary guardian  
**Priority:** HIGH (negative), NORMAL (positive)  
**Channel:** SMS + Email for negative behaviors

**Example Messages:**
```
⭐ Great News! John Doe: Outstanding Homework Submission. Submitted all homework on time this week with excellent quality.

⚠️ Attention Required John Doe: Late to Class. Please check the parent portal for details.
```

### 3. Homework Reminders

**Trigger:** Scheduled job (daily at 7 PM for next day's homework)  
**Recipients:** Primary guardian  
**Priority:** NORMAL  
**Channel:** SMS

**Example Message:**
```
📚 Reminder: John Doe has homework in Mathematics: "Algebra Chapter 5 Exercises" due on 10/15/2026. Check the parent portal for details.
```

### 4. Booking Confirmations

**Trigger:** When teacher confirms a booking  
**Recipients:** Parent who made the booking  
**Priority:** NORMAL  
**Channel:** SMS + Email

**Example Message:**
```
✅ Meeting Confirmed: Parent-teacher meeting for John Doe on 10/15/2026 at 09:00-09:30 at Room 203.
```

### 5. Daily Activity Digest

**Trigger:** Scheduled job (daily at 6 PM)  
**Recipients:** All parents with activities for their children  
**Priority:** NORMAL  
**Channel:** SMS or Email

**Example Message:**
```
📱 Daily Update for John Doe: 3 activities today.
• Participated in Math today
• Completed Science experiment
• Received star for good behavior

View all in the parent portal.
```

## Configuration

### Environment Variables

Add to your `.env`:

```env
# Notification Settings
NOTIFICATIONS_ENABLED=true
DAILY_DIGEST_TIME=18:00
HOMEWORK_REMINDER_TIME=19:00

# SMS Settings (via Communications module)
SMS_API_KEY=your_api_key
SMS_USERNAME=your_username

# Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@school.com
SMTP_PASSWORD=your_password
```

### Feature Flags

You can add feature flags to enable/disable specific notifications:

```typescript
// In your config service
export const notificationConfig = {
  activityNotifications: true,
  behaviorAlerts: true,
  homeworkReminders: true,
  bookingConfirmations: true,
  dailyDigest: false, // Disabled by default until schools opt-in
};
```

## Testing Notifications

### 1. Test Activity Notification

```bash
# Create an activity
POST /api/v1/activity-feed
{
  "studentId": "uuid",
  "activityType": "PARTICIPATION",
  "title": "Test activity",
  "isVisibleToParents": true
}

# Check guardian's phone for SMS
```

### 2. Test Behavior Alert

```bash
# Create a behavior record
POST /api/v1/behavior
{
  "studentId": "uuid",
  "behaviorType": "NEGATIVE",
  "category": "LATE_ARRIVAL",
  "title": "Test behavior",
  "incidentDate": "2026-10-11",
  "parentNotified": true
}

# Check for HIGH priority SMS
```

### 3. Test Booking Confirmation

```bash
# Create and confirm a booking
POST /api/v1/parent-portal/bookings
{ ... }

# Then as teacher:
POST /api/v1/bookings/:id/confirm

# Check parent's phone for confirmation
```

## Monitoring

### Track Notification Metrics

Monitor these metrics:

1. **Delivery Rate** - % of notifications successfully delivered
2. **Failure Rate** - % of failed notifications
3. **Response Time** - Time to send notification after event
4. **Parent Engagement** - % of parents opening portal after notification
5. **Cost** - SMS/Email costs per month

### Logging

The notification service logs all activities:

```typescript
this.logger.log(`Activity notification sent for activity ${activityId}`);
this.logger.error(`Failed to send behavior alert: ${error.message}`);
```

Check logs for issues:

```bash
grep "notification" logs/app.log
```

## Cost Optimization

### SMS Cost Reduction Strategies

1. **Batch Daily Digest** - Instead of sending individual SMS for each activity, send one daily digest
2. **Parent Preferences** - Let parents choose which notifications they want
3. **Email First** - Use email for non-urgent notifications, SMS for urgent only
4. **In-App Notifications** - Use push notifications for mobile app users

### Example: Parent Notification Preferences

Add to `Guardian` model:

```prisma
model Guardian {
  // ... existing fields ...
  
  notificationPreferences Json? // { "activities": "email", "behavior": "sms", "homework": "both" }
}
```

## Troubleshooting

### Issue: Notifications not sending

**Check:**
1. Is `NOTIFICATIONS_ENABLED=true` in `.env`?
2. Are SMS/Email credentials configured correctly?
3. Do guardians have phone numbers/emails in database?
4. Check logs for error messages

### Issue: Duplicate notifications

**Solution:** Add deduplication logic:

```typescript
// Check if notification was sent in last 1 hour
const recentNotification = await this.prisma.communicationLog.findFirst({
  where: {
    recipient: guardian.phone,
    createdAt: {
      gte: new Date(Date.now() - 3600000), // 1 hour ago
    },
  },
});

if (recentNotification) {
  return; // Skip sending
}
```

### Issue: High SMS costs

**Solution:**
1. Enable daily digest instead of real-time
2. Use email for non-urgent notifications
3. Implement parent preferences
4. Add SMS rate limiting

## Best Practices

1. **Respect Quiet Hours** - Don't send SMS between 9 PM - 7 AM
2. **Batch Notifications** - Group multiple updates in one message
3. **Provide Opt-Out** - Let parents disable notifications
4. **Track Consent** - Ensure GDPR compliance
5. **Monitor Costs** - Set up alerts for high SMS usage
6. **Test Thoroughly** - Test with real phone numbers before production
7. **Handle Failures Gracefully** - Don't block main operations if notification fails

## Integration Checklist

- [ ] Add `ParentEngagementNotificationsModule` to `app.module.ts`
- [ ] Inject notification service into feature services
- [ ] Uncomment Communications module calls
- [ ] Set up scheduled jobs for daily digest and homework reminders
- [ ] Configure SMS/Email credentials
- [ ] Test all notification types
- [ ] Set up monitoring and logging
- [ ] Implement cost optimization strategies
- [ ] Add parent notification preferences
- [ ] Document notification types for parents
- [ ] Train staff on notification system

## Next Steps

1. Complete Communications module integration
2. Set up scheduled jobs with NestJS Schedule
3. Implement parent notification preferences
4. Add push notifications for mobile app
5. Create admin dashboard for notification analytics
6. Set up cost tracking and alerts

---

**Questions?** Check the main documentation or contact the development team.
