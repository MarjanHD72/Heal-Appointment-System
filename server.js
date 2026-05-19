const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
<<<<<<< Updated upstream
=======
const PORT = process.env.PORT || 3000;
const Appointment = require("./models/Appointment");
//connect to mongoDb
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log(err));
// end of connect to mongoDb

// middleware
>>>>>>> Stashed changes
app.use(express.json());
app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false,
  }),
);
const PORT = process.env.PORT || 3000;

// Serve static files from the Public directory
app.use(express.static(path.join(__dirname, "Public")));

// Database
const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);
});
// Register API
app.post("/api/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, password],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "User already exists" });
      }

      res.json({ message: "User registered successfully" });
    },
  );
});
// Login API
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, user) => {
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.user = user;

      res.json({ message: "Logged in successfully", user });
    },
  );
});

// check user login
app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  res.json(req.session.user);
});
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});
// Start the server
app.listen(PORT, () => {
  console.log(
    `NHS Booking System server is running on http://localhost:${PORT}`,
  );
});
// Edit Appointment API

app.put("/api/appointments/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const appointmentId = req.params.id;
  const { title, date, notes } = req.body;

  try {
    const updated = await Appointment.findOneAndUpdate(
      { _id: appointmentId, userId: req.session.user.id },
      { title, date, notes },
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment Updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error Updating appointment" });
  }
});
