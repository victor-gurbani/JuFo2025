const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose(); // SQLite library

// Initialize SQLite database
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    
    // Example: Creating a shared table for demonstration (optional)
    db.run(
      `CREATE TABLE IF NOT EXISTS example (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
        }
      }
    );
  }
});

// Pass database instance to routes
const adminRoutes = require("./routes/admin")(db);
const teacherRoutes = require("./routes/teacher")(db);
const guardRoutes = require("./routes/guard")(db);
const cardRoutes = require("./routes/cards")(db);

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Example routes
app.use("/admin", adminRoutes);
app.use("/teacher", teacherRoutes);
app.use("/guard", guardRoutes);
app.use("/cards", cardRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Gracefully close the database connection when the server shuts down
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Database connection closed.");
    }
    process.exit(0);
  });
});
