const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const adminRoutes = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");
const guardRoutes = require("./routes/guard");
const cardRoutes = require("./routes/cards");

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