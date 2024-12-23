const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const adminRoutes = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");
const guardRoutes = require("./routes/guard");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Example routes
app.use("/admin", adminRoutes);
app.use("/teacher", teacherRoutes);
app.use("/guard", guardRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});