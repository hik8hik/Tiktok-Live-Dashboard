# TikTok Live Dashboard

A real-time analytics dashboard for TikTok live streams, featuring comment tracking, gift monitoring, follower alerts, and interactive visualizations.

![Dashboard Preview](https://placehold.co/800x400/png)
_Add actual screenshot later_

## Features

- 🎤 **Real-time Comments**
  Track and display live comments with timestamps
- ❤️ **Like Tracking**
  Monitor likes and identify top likers
- 🎁 **Gift Monitoring**
  Track gifts with diamond values and repeat counts
- 🆕 **Follower Alerts**
  Display recent followers with timestamps
- 📊 **Interactive Charts**
  - Top Likers bar chart
  - User Interactions donut chart
  - Copy-friendly top likers format
- 🔐 **Secure Connection**
  Session ID protected authentication
- 📁 **Persistent Storage**
  SQLite database for data persistence
- 📱 **Responsive Design**
  Works on desktop and mobile devices

## Prerequisites

- Node.js v16+
- TikTok account
- Modern web browser

## Installation

1. **Clone Repository**

   ```bash
   git clone https://github.com/hik8hik/tiktok-live-dashboard.git
   cd tiktok-live-dashboard
   ```

Install Dependencies

```bash
npm install
```

or

```bash
yarn
```

Configuration

Get your TikTok Session ID:

Log in to TikTok in your browser

Open Developer Tools → Application → Cookies

Copy sessionid value from [https://www.tiktok.com](https://www.tiktok.com) optional, you can do it anonymously without copying it.
Replace in app.js:

```javascript
sessionId: "YOUR_SESSION_ID_HERE";
```

Usage
Start Application

```bash
node app.js
```

node app.js
Access Dashboard
Open in browser: [http://localhost:3000](http://localhost:3000)

Connect to Live Stream

Enter TikTok username of LIVE stream

Click "Connect"

Dashboard Features

Real-time comment feed

Interactive charts

Copy buttons for top likers

Auto-refresh every 3 seconds
Database Structure

```sql
comments (id, user_id, unique_id, comment, timestamp)
user_likes (user_id, unique_id, total_likes, last_updated)
gifts (id, user_id, unique_id, gift_id, gift_name, count, diamonds, timestamp)
followers (id, user_id, unique_id, timestamp)
```

|     | API Endpoints     | Descriptioncol        |
| --- | ----------------- | --------------------- |
|     | Endpoint          | Description           |
| 1   | /api/comments     | Last 50 comments      |
| 2   | /api/likes        | Top 10 likers         |
| 3   | /api/gifts        | Recent gifts          |
| 4   | /api/followers    | Recent followers      |
| 5   | /api/interactions | Top interactive users |
|     |                   |                       |

Troubleshooting
Common Issues:
Troubleshooting
Common Issues:

SQLITE_ERROR: Delete tiktok_data.db and restart

Connection failures:

Ensure stream is LIVE

Verify session ID validity

Check TikTok API status

Chart display issues:

Hard refresh browser (Ctrl+F5)

Clear browser cache

Rate Limits:

Avoid excessive API calls

Max 3 concurrent connections

5s delay between username attempts

FAQ
Q: Can I monitor offline streams?
A: No, only currently live streams can be monitored

Q: How to track multiple users?
A: Currently supports single stream monitoring. Restart with new username.

Q: Where is data stored?
A: Locally in tiktok_data.db SQLite file

Q: Is this against TikTok's TOS?
A: Use at your own risk. Not officially sanctioned by TikTok.

Contributing
Fork repository

Create feature branch

Submit PR with detailed description

```bash
git checkout -b feature/new-feature
```

License
MIT License - See LICENSE

Disclaimer
This project is not affiliated with or endorsed by TikTok. Use responsibly and respect community guidelines.
