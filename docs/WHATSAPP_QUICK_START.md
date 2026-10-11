# WhatsApp Integration - Quick Start Guide ⚡

Get WhatsApp notifications running in **5 minutes**!

## Step 1: Install Redis (2 minutes)

### Windows
```bash
# Using Chocolatey
choco install redis-64
redis-server
```

### macOS
```bash
# Using Homebrew
brew install redis
brew services start redis
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### Docker (Easiest!)
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

---

## Step 2: Get Twilio Credentials (2 minutes)

1. Sign up at [Twilio.com](https://www.twilio.com/try-twilio)
2. Go to [WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
3. Copy:
   - Account SID
   - Auth Token
   - Sandbox WhatsApp Number

4. Join the sandbox:
   - Send the join code (shown in console) to the sandbox number via WhatsApp
   - Example: Send "join happy-dog" to +1 415 523 8886

---

## Step 3: Configure Environment (1 minute)

Add to your `.env` file:

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token-here"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Enable Scheduler
WHATSAPP_SCHEDULER_ENABLED="true"
```

---

## Step 4: Start the Server

```bash
# Install dependencies (if not already done)
pnpm install

# Start the API
pnpm --filter @krypton/api dev
```

---

## Step 5: Test It! (30 seconds)

### Test 1: Check Service Status
```bash
curl http://localhost:3001/api/v1/whatsapp/status
```

**Expected response:**
```json
{
  "available": true,
  "message": "WhatsApp service is configured and ready"
}
```

### Test 2: Send Test Message
```bash
curl -X POST http://localhost:3001/api/v1/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+254712345678",
    "message": "Test message from School Management System! 🎉"
  }'
```

### Test 3: Create Default Templates
```bash
curl -X POST http://localhost:3001/api/v1/whatsapp/settings/templates/create-defaults
```

---

## 🎉 You're Done!

WhatsApp integration is now active! The system will automatically:

- ✅ Send overdue fee reminders daily at 9 AM
- ✅ Send upcoming fee reminders daily at 10 AM
- ✅ Send absence alerts on weekdays at 11 AM
- ✅ Send daily attendance summary on weekdays at 4 PM

---

## Common Test Scenarios

### Send Fee Reminder to a Class
```bash
curl -X POST http://localhost:3001/api/v1/whatsapp/fee-reminders/send \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "your-class-uuid",
    "language": "en"
  }'
```

### Send Absence Alert
```bash
curl -X POST http://localhost:3001/api/v1/whatsapp/attendance-alerts/send-absent \
  -H "Content-Type: application/json" \
  -d '{
    "language": "sw"
  }'
```

### Check Queue Status
```bash
curl http://localhost:3001/api/v1/whatsapp/scheduler/stats
```

---

## 🔧 Troubleshooting

### Issue: "WhatsApp service not configured"
**Solution:** Double-check your `.env` file has correct Twilio credentials.

### Issue: "Failed to connect to Redis"
**Solution:** Make sure Redis is running: `redis-cli ping`

### Issue: "Message not delivered"
**Solution:** 
1. Verify recipient joined Twilio sandbox
2. Check phone number format: +254712345678 (include country code)
3. View Twilio console for error details

---

## 📚 Next Steps

- Read full documentation: `WHATSAPP_INTEGRATION.md`
- Customize message templates via admin panel
- Set up production WhatsApp Business API
- Monitor queue and statistics

---

## 🚀 Production Checklist

Before going live:

- [ ] Apply for Twilio WhatsApp Business API
- [ ] Get message templates approved
- [ ] Set up production Redis server
- [ ] Update environment variables with production credentials
- [ ] Test with real guardian phone numbers
- [ ] Monitor logs and queue statistics
- [ ] Set up alerts for failed messages

---

**Questions?** Check the main documentation or contact support!

**Happy messaging! 🔥**

