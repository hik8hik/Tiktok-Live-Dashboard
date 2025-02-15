const { WebcastPushConnection } = require("tiktok-live-connector");
const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const path = require("path");

// ======== DATABASE SETUP ======== //
const db = new sqlite3.Database("tiktok_data.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1); // Exit if database connection fails
  }
  console.log("Connected to database");
});

// Create tables with error handling
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        unique_id TEXT NOT NULL,
        comment TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("Error creating comments table:", err.message);
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS user_likes (
        user_id TEXT PRIMARY KEY,
        unique_id TEXT NOT NULL,
        total_likes INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("Error creating user_likes table:", err.message);
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS gifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        unique_id TEXT NOT NULL,
        gift_id TEXT NOT NULL,
        gift_name TEXT NOT NULL,
        count INTEGER NOT NULL,
        diamonds INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("Error creating gifts table:", err.message);
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS followers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        unique_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("Error creating followers table:", err.message);
    }
  );

  db.run(
    `CREATE VIEW IF NOT EXISTS user_interactions AS
        SELECT 
            ul.unique_id,
            COALESCE(ul.total_likes, 0) + COUNT(c.id) AS total_interactions
        FROM user_likes ul
        LEFT JOIN comments c ON ul.user_id = c.user_id
        GROUP BY ul.user_id
        ORDER BY total_interactions DESC
        LIMIT 3`,
    (err) => {
      if (err)
        console.error("Error creating user_interactions view:", err.message);
    }
  );
});

// ======== TIKTOK LIVE CONNECTION ======== //
let tiktokLiveConnection = null;

// ======== EXPRESS SERVER ======== //
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API Endpoints
app.get("/api/comments", (req, res) => {
  db.all(
    `SELECT unique_id, comment, timestamp FROM comments ORDER BY timestamp DESC LIMIT 50`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching comments:", err.message);
        return res.status(500).json([]);
      }
      res.json(rows);
    }
  );
});

app.get("/api/likes", (req, res) => {
  db.all(
    `SELECT unique_id, total_likes FROM user_likes ORDER BY total_likes DESC LIMIT 10`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching likes:", err.message);
        return res.status(500).json([]);
      }
      res.json(rows);
    }
  );
});

app.get("/api/gifts", (req, res) => {
  db.all(
    `SELECT unique_id, gift_name, SUM(count) AS total_count FROM gifts GROUP BY unique_id, gift_name ORDER BY MAX(timestamp) DESC LIMIT 10`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching gifts:", err.message);
        return res.status(500).json([]);
      }
      res.json(rows);
    }
  );
});

app.get("/api/followers", (req, res) => {
  db.all(
    `SELECT unique_id, timestamp FROM followers ORDER BY timestamp DESC LIMIT 10`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching followers:", err.message);
        return res.status(500).json([]);
      }
      res.json(rows);
    }
  );
});

app.get("/api/interactions", (req, res) => {
  db.all(
    `SELECT unique_id, total_interactions FROM user_interactions`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching interactions:", err.message);
        return res.status(500).json([]);
      }
      res.json(rows);
    }
  );
});

app.get("/api/top-likers", (req, res) => {
  db.all(
    `SELECT unique_id, total_likes FROM user_likes ORDER BY total_likes DESC LIMIT 3`,
    (err, rows) => {
      if (err) return res.status(500).json([]);
      res.json(rows);
    }
  );
});

app.post("/verify-username", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send("Username is required");
  }

  try {
    // Test connection
    const testConnection = new WebcastPushConnection(username, {
      sessionId: "fca2c403e311ee4e89c59472c159acd2",
    });

    const state = await testConnection.connect();
    await testConnection.disconnect();

    // Initialize main connection
    tiktokLiveConnection = new WebcastPushConnection(username, {
      sessionId: "fca2c403e311ee4e89c59472c159acd2",
    });

    // Event handlers with error logging
    tiktokLiveConnection.on("chat", (data) => {
      db.run(
        `INSERT INTO comments (user_id, unique_id, comment) VALUES (?, ?, ?)`,
        [data.userId, data.uniqueId, data.comment],
        (err) => {
          if (err) console.error("Error inserting comment:", err.message);
        }
      );
    });

    tiktokLiveConnection.on("like", (data) => {
      console.log(
        `${data.uniqueId} ${data.userId} sent ${data.likeCount} likes, total likes: ${data.totalLikeCount}`
      );
      db.run(
        `INSERT INTO user_likes (user_id, unique_id, total_likes) VALUES (?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET total_likes = total_likes + excluded.total_likes`,
        [data.userId, data.uniqueId, data.likeCount],
        (err) => {
          if (err) console.error("Error updating likes:", err.message);
        }
      );
    });

    tiktokLiveConnection.on("gift", (data) => {
      db.run(
        `INSERT INTO gifts (user_id, unique_id, gift_id, gift_name, count, diamonds) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.userId,
          data.uniqueId,
          data.giftId,
          data.giftName,
          data.repeatCount,
          data.diamondCount,
        ],
        (err) => {
          if (err) console.error("Error inserting gift:", err.message);
        }
      );
    });

    tiktokLiveConnection.on("follow", (data) => {
      db.run(
        `INSERT INTO followers (user_id, unique_id) VALUES (?, ?)`,
        [data.userId, data.uniqueId],
        (err) => {
          if (err) console.error("Error inserting follower:", err.message);
        }
      );
    });

    await tiktokLiveConnection.connect();
    res.sendStatus(200);
  } catch (err) {
    console.error("Error verifying username:", err.message);
    res.status(400).send("Connection failed");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Dashboard: http://localhost:${PORT}`);
});
