
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const crypto = require('crypto');

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const db = mysql.createPool({
  host: process.env.MYSQLHOST || '127.0.0.1',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'Test123!',
  database: process.env.MYSQLDATABASE || 'finalDB',
  port: Number(process.env.MYSQLPORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function makeId() {
  return crypto.randomUUID();
}

async function getUserByUsername(userName) {
  const [rows] = await db.query(
    'SELECT userID, userName, first_name, last_name, email FROM users WHERE userName = ?',
    [userName]
  );

  if (rows.length === 0) return null;
  return rows[0];
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const authRoutes = require('./routes/authRoutes')(db, hashPassword);
const convoyRoutes = require('./routes/convoyRoutes')(db);
const friendRoutes = require('./routes/friendRoutes')(db, makeId, getUserByUsername);
const messageRoutes = require('./routes/messageRoutes')(db);
const groupChatsRoutes = require('./routes/groupChatsRoutes')(db);
const gpsRoutes = require('./routes/gpsRoutes')(db);

app.use('/api', authRoutes);
app.use('/api', convoyRoutes);
app.use('/api', friendRoutes);
app.use('/api', messageRoutes);
app.use('/api', groupChatsRoutes);
app.use('/api', gpsRoutes);

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, HOST, function () {
  console.log(`Convoy app running on ${HOST}:${PORT}`);
});
