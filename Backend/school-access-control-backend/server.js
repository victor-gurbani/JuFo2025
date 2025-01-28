const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose(); // SQLite library
const checkPermission = require("./middleware/checkPermission");

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Initialize SQLite database
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");

    // Create tables if they do not exist
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS cards (
          uid TEXT PRIMARY KEY,
          lastAssigned TEXT,
          isValid INTEGER
        )`,
        (err) => {
          if (err) {
            console.error("Error creating cards table:", err.message);
          }
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          startDate TEXT,
          endDate TEXT,
          isRecurring INTEGER,
          recurrencePattern TEXT,
          isValid INTEGER,
          assignedStudent TEXT,
          assignedBy TEXT,
          associatedCard TEXT,
          FOREIGN KEY (assignedStudent) REFERENCES students(id),
          FOREIGN KEY (assignedBy) REFERENCES teachers(id),
          FOREIGN KEY (associatedCard) REFERENCES cards(uid)
        )`,
        (err) => {
          if (err) {
            console.error("Error creating permissions table:", err.message);
          }
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          name TEXT,
          photoUrl TEXT,
          classGroup TEXT,
          tutor TEXT,
          FOREIGN KEY (tutor) REFERENCES teachers(id)
        )`,
        (err) => {
          if (err) {
            console.error("Error creating students table:", err.message);
          }
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS teachers (
          id TEXT PRIMARY KEY,
          name TEXT,
          permissionLevel TEXT
        )`,
        (err) => {
          if (err) {
            console.error("Error creating teachers table:", err.message);
          }
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS accessLogs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          direction TEXT,
          student TEXT,
          card TEXT,
          wasApproved INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student) REFERENCES students(id),
          FOREIGN KEY (card) REFERENCES cards(uid)
        )`,
        (err) => {
          if (err) {
            console.error("Error creating accessLogs table:", err.message);
          }
        }
      );

      // Check if admin user exists, if not, create it
      db.get(`SELECT * FROM teachers WHERE id = ?`, ['admin'], (err, row) => {
        if (err) {
          console.error("Error checking for admin user:", err.message);
        } else if (!row) {
          db.run(`INSERT INTO teachers (id, name, permissionLevel) VALUES (?, ?, ?)`, ['admin', 'Administrator', 'admin'], (insertErr) => {
            if (insertErr) {
              console.error("Error creating admin user:", insertErr.message);
            } else {
              console.log("Admin user created successfully.");
            }
          });
        } else {
          console.log("Admin user already exists.");
        }
      });
    });
  }
});

// Pass database instance to routes
const adminRoutes = require("./routes/admin")(db);
const teacherRoutes = require("./routes/teacher")(db);
const guardRoutes = require("./routes/guard")(db);
const cardRoutes = require("./routes/cards")(db);

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
