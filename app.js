const { WebcastPushConnection } = require('tiktok-live-connector');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');

// ======== DATABASE SETUP ======== //
const db = new sqlite3.Database('tiktok_data.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to database');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        unique_id TEXT,
        comment TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_likes (
        user_id TEXT PRIMARY KEY,
        unique_id TEXT,
        total_likes INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// ======== TIKTOK LIVE CONNECTION ======== //
let tiktokLiveConnection = null;

// ======== EXPRESS SERVER ======== //
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints
app.get('/api/comments', (req, res) => {
    db.all(
        `SELECT unique_id, comment, timestamp 
        FROM comments 
        ORDER BY timestamp DESC 
        LIMIT 50`,
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

app.get('/api/likes', (req, res) => {
    db.all(
        `SELECT unique_id, total_likes 
        FROM user_likes 
        ORDER BY total_likes DESC 
        LIMIT 10`,
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

app.post('/verify-username', async (req, res) => {
    const { username } = req.body;
    
    try {
        // Test connection
        const testConnection = new WebcastPushConnection(username, {
            sessionId: 'fca2c403e311ee4e89c59472c159acd2'
        });
        
        const state = await testConnection.connect();
        await testConnection.disconnect();
        
        // Initialize main connection
        tiktokLiveConnection = new WebcastPushConnection(username, {
            sessionId: 'fca2c403e311ee4e89c59472c159acd2'
        });

        // Set up event handlers
        tiktokLiveConnection.on('chat', data => {
            db.run(
                `INSERT INTO comments (user_id, unique_id, comment) 
                VALUES (?, ?, ?)`,
                [data.userId, data.uniqueId, data.comment]
            );
        });

        tiktokLiveConnection.on('like', data => {
            db.run(
                `INSERT INTO user_likes (user_id, unique_id, total_likes) 
                VALUES (?, ?, ?)
                ON CONFLICT(user_id) 
                DO UPDATE SET 
                    total_likes = total_likes + excluded.total_likes,
                    last_updated = CURRENT_TIMESTAMP`,
                [data.userId, data.uniqueId, data.likeCount]
            );
        });

        await tiktokLiveConnection.connect();
        res.sendStatus(200);
    } catch (err) {
        res.status(400).send('Connection failed');
    }
});

app.listen(PORT, () => {
    console.log(`Dashboard: http://localhost:${PORT}`);
});
