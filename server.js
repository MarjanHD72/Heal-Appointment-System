require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("./models/User");
const app = express();
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
// Appointment API

app.post("/api/appointments", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const { title, date, notes } = req.body;

  try {
    const newAppointment = new Appointment({
      title,
      date,
      notes,
      userId: req.session.user.id,
    });

    await newAppointment.save();

    res.json({ message: "Appointment created" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating appointment" });
  }
});

app.get("/api/appointments", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  try {
    const appointments = await Appointment.find({
      userId: req.session.user.id,
    }).sort({ date: -1 });

    res.json(appointments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching appointments" });
  }
});
// Cancel Appointment API
app.delete("/api/appointments/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const appointmentId = req.params.id;

  try {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: req.session.user.id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await Appointment.deleteOne({ _id: appointmentId });

    res.json({ message: "Appointment cancelled" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error deleting appointment" });
  }
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
// Appointment Status
app.patch("/api/appointments/:id/status", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  const { status } = req.body;
  const appointmentId = req.params.id;
  const validStatuses = ["Upcoming", "Completed", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  try {
    const updated = await Appointment.findOneAndUpdate(
      { _id: appointmentId, userId: req.session.user.id },
      { status },
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment status updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error getting status of appointment" });
  }
});
// Voice Agent API
app.post("/api/voice-agent", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const { userMessage } = req.body;
  const userId = req.session.user.id;

  try {
    // Get user's appointments for context
    const appointments = await Appointment.find({ userId }).sort({ date: -1 });

    const systemPrompt = `You are a helpful medical appointment assistant. 
The user's appointments are: ${JSON.stringify(appointments)}
You can help them: book new appointments, cancel existing ones, or edit them.
When user wants to book: extract title, date, notes and respond with JSON: {"action": "book", "title": "...", "date": "...", "notes": "..."}
When user wants to cancel: respond with JSON: {"action": "cancel", "id": "..."}
When user wants to edit: respond with JSON: {"action": "edit", "id": "...", "title": "...", "date": "...", "notes": "..."}
Otherwise just respond normally in the same language as the user.`;

    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt: `${systemPrompt}\n\nUser: ${userMessage}`,
      stream: false,
    });

    const aiResponse = response.data.response;

    // Try to parse as action
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const action = JSON.parse(jsonMatch[0]);

        if (action.action === "book") {
          const newAppt = new Appointment({
            title: action.title,
            date: action.date,
            notes: action.notes,
            userId,
          });
          await newAppt.save();
          return res.json({
            message: "Appointment booked successfully!",
            action: "booked",
          });
        }

        if (action.action === "cancel") {
          await Appointment.deleteOne({ _id: action.id, userId });
          return res.json({
            message: "Appointment cancelled!",
            action: "cancelled",
          });
        }

        if (action.action === "edit") {
          await Appointment.findOneAndUpdate(
            { _id: action.id, userId },
            { title: action.title, date: action.date, notes: action.notes },
          );
          return res.json({
            message: "Appointment updated!",
            action: "edited",
          });
        }
      }
    } catch (e) {}

    res.json({ message: aiResponse });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Voice agent error" });
  }
});
// STT endpoint
app.post("/api/stt", (req, res) => {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const contentType = req.headers["content-type"];

      const response = await axios.post(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        buffer,
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": contentType,
          },
        },
      );
      res.json(response.data);
    } catch (err) {
      console.log("STT error:", err.message);
      res.status(500).json({ message: "STT error" });
    }
  });
});
