const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Setup SQLite database
const dbPath = path.resolve(__dirname, "../payments.db");
console.log("Database path:", dbPath);
const db = new sqlite3.Database(dbPath);

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channelId TEXT,
      amount REAL,
      timestamp TEXT,
      runningTotal REAL
    )
  `);
});

// API endpoint to add a payment
app.post("/api/payments", (req, res) => {
  const { channelId, amount } = req.body;

  // Get current running total
  db.get(
    "SELECT SUM(amount) as total FROM payments WHERE channelId = ?",
    [channelId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const prevTotal = row.total || 0;
      const newTotal = prevTotal + amount;
      const timestamp = new Date().toISOString();

      // Insert new payment
      db.run(
        "INSERT INTO payments (channelId, amount, timestamp, runningTotal) VALUES (?, ?, ?, ?)",
        [channelId, amount, timestamp, newTotal],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            id: this.lastID,
            amount,
            timestamp,
            runningTotal: newTotal,
          });
        }
      );
    }
  );
});

// Get all payments for a channel
app.get("/api/payments/:channelId", (req, res) => {
  const { channelId } = req.params;
  db.all(
    "SELECT * FROM payments WHERE channelId = ? ORDER BY id",
    [channelId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Reset payments for a channel
app.delete("/api/payments/:channelId", (req, res) => {
  const { channelId } = req.params;
  db.run("DELETE FROM payments WHERE channelId = ?", [channelId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "All payments deleted" });
  });
});

// Get total amount for a channel
app.get("/api/payments/:channelId/total", (req, res) => {
  const { channelId } = req.params;
  db.get(
    "SELECT SUM(amount) as total FROM payments WHERE channelId = ?",
    [channelId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ total: row.total || 0 });
    }
  );
});

const PORT = process.env.PORT || 5001;
app
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
  .on("error", (error) => {
    console.error("Server failed to start:", error);
  });

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Keep the process running despite the error
});
