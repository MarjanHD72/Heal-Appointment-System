const express = require("express");
const session = require("express-session");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("./models/User");
const app = express();
const PORT = process.env.PORT || 3000;
//connect to mongoDb
mongoose
  .connect(
    "mongodb+srv://marjanhaghighat027_db_user:HealAppointment@cluster0.yajswxy.mongodb.net/",
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log(err));
// end of connect to mongoDb

// middleware
app.use(express.json());
app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
    },
  }),
);
// end of middleware

//  Auth Middleware

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// API routes
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    //  save in session
    req.session.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
    };

    res.json({ message: "Login successful", user: req.session.user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  res.json(req.session.user);
});
app.get("/api/check-auth", (req, res) => {
  if (req.session.user) {
    res.json({
      loggedIn: true,
      user: req.session.user,
    });
  } else {
    res.json({
      loggedIn: false,
    });
  }
});

app.post("/api/register", async (req, res) => {
  const { firstName, lastName, email, password, nhsNumber } = req.body;
  console.log("DATA RECEIVED:", req.body);

  try {
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      nhsNumber,
    });

    console.log("USER SAVED:", user);
    await sendWebhook(email);

    res.json({ message: "User registered", user });
  } catch (err) {
    console.log(err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }

    res.status(500).json({ message: "Error creating user" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});
// end of API routes

// Route pages
// Public pages
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "Public/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "Public/register.html"));
});

// Protected pages
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "Public/dashboard.html"));
});

app.get("/booking", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "Public/booking.html"));
});

// Static Files
app.use(express.static(path.join(__dirname, "Public")));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Webhook (n8n)
async function sendWebhook(email) {
  try {
    await axios.post("https://marjanhd.app.n8n.cloud/webhook/test-user", {
      name: email,
      email,
    });
    console.log("Webhook sent to n8n");
  } catch (error) {
    console.log("Error sending to n8n:", error.message);
  }
}
