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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

function isAuthenticated(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/login");
}

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Try Again" });
    if (user.password !== password)
      return res.status(400).json({ message: "Incorrect password" });
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
  if (!req.session.user)
    return res.status(401).json({ message: "Not logged in" });
  res.json(req.session.user);
});

// Validates a UK NHS number using the official Modulus 11 check-digit algorithm.
function isValidNHSNumber(nhsNumber) {
  if (typeof nhsNumber !== "string" || !/^\d{10}$/.test(nhsNumber))
    return false;
  const digits = nhsNumber.split("").map(Number);
  const sum = digits
    .slice(0, 9)
    .reduce((total, digit, index) => total + digit * (10 - index), 0);
  const remainder = sum % 11;
  let checkDigit = 11 - remainder;
  if (checkDigit === 11) checkDigit = 0;
  if (checkDigit === 10) return false;
  return checkDigit === digits[9];
}

app.post("/api/register", async (req, res) => {
  const { firstName, lastName, email, password, nhsNumber } = req.body;
  console.log("DATA RECEIVED:", req.body);
  if (!isValidNHSNumber(nhsNumber))
    return res.status(400).json({ message: "Invalid NHS number" });
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
    if (err.code === 11000)
      return res.status(400).json({ message: "User already exists" });
    res.status(500).json({ message: "Error creating user" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" }));
});

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "Public/login.html")),
);
app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "Public/register.html")),
);
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(__dirname, "Public/dashboard.html"));
});
app.get("/booking", isAuthenticated, (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(__dirname, "Public/booking.html"));
});
// All nav links point at the .html files directly, so those must be
// guarded too — otherwise express.static below serves them unauthenticated.
app.get("/dashboard.html", isAuthenticated, (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(__dirname, "Public/dashboard.html"));
});
app.get("/booking.html", isAuthenticated, (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(__dirname, "Public/booking.html"));
});
app.use(express.static(path.join(__dirname, "Public")));

function isValidField(value) {
  return (
    typeof value === "string" && value.trim() !== "" && value.trim() !== "..."
  );
}

app.post("/api/appointments", async (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: "Not logged in" });
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
  if (!req.session.user)
    return res.status(401).json({ message: "Not logged in" });
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

app.delete("/api/appointments/:id", async (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: "Not logged in" });
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.session.user.id,
    });
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });
    await Appointment.deleteOne({ _id: req.params.id });
    res.json({ message: "Appointment cancelled" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error deleting appointment" });
  }
});

app.put("/api/appointments/:id", async (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: "Not logged in" });
  const { title, date, notes } = req.body;
  try {
    const updated = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      { title, date, notes },
    );
    if (!updated)
      return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment Updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error Updating appointment" });
  }
});

app.patch("/api/appointments/:id/status", async (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: "Not logged in" });
  const { status } = req.body;
  const validStatuses = ["Upcoming", "Completed", "Cancelled"];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: "Invalid status" });
  try {
    const updated = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      { status },
    );
    if (!updated)
      return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment status updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error getting status of appointment" });
  }
});

app.post("/api/voice-agent", async (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: "Not logged in" });

  const { userMessage } = req.body;
  const userId = req.session.user.id;

  if (!req.session.chatHistory) req.session.chatHistory = [];
  if (req.session.chatHistory.length > 20) {
    req.session.chatHistory = req.session.chatHistory.slice(-20);
  }

  try {
    const appointments = await Appointment.find({ userId }).sort({ date: -1 });
    const appointmentList = appointments
      .map((a) => `- Title: ${a.title} | Date: ${a.date} | Status: ${a.status}`)
      .join("\n");

    const systemPrompt = `You are a medical appointment assistant. Today is ${new Date().toISOString().split("T")[0]}.

User's current appointments:
${appointmentList || "No appointments yet."}

Available time slots: 09:00, 10:00, 11:00, 14:00, 15:00, 16:00 (clinic closed Sundays)
Available appointment types: GP Consultation, Nurse Visit, Specialist Referral

STRICT RULES:
1. When user wants to book: collect type, date, and time (one question at a time if missing)
2. Convert natural language: "3pm" = "15:00", "5th of July 2026" = "2026-07-05", "dentist/doctor/GP" = "GP Consultation", "nurse" = "Nurse Visit", "specialist" = "Specialist Referral"
3. Once you have ALL info (type + date + time): output ONLY this JSON on its own line:
{"action":"book","title":"GP Consultation","date":"2026-07-05 at 15:00","notes":"reason"}
4. To cancel: {"action":"cancel","title":"EXACT_TITLE","date":"PARTIAL_DATE"}
5. To edit: {"action":"edit","title":"EXACT_TITLE","date":"PARTIAL_DATE","newTitle":"...","newDate":"2026-07-05 at 15:00","newNotes":"..."}
6. NEVER show JSON to user - after action say ONLY "Done! Your appointment has been booked/cancelled/updated."
7. NEVER ask for format like YYYY-MM-DD - convert it yourself
8. Ask maximum ONE question at a time.
9. always ask for the Reason for Appointment.let the user explain.
10. NEVER show IDs or raw data to use.
11.Only accept confirmation words like "yes", "confirm", "ok", "yeah" - ignore other languages or unrelated responses.
12.When user says goodbye/bye/thanks/see you: respond with {"action":"stop","message":"Goodbye! Have a great day!"}
13.Never accept New appointment of past day.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...req.session.chatHistory,
      { role: "user", content: userMessage },
    ];

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      { model: "llama-3.3-70b-versatile", messages, temperature: 0.3 },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log("AI Response:", aiResponse);

    req.session.chatHistory.push({ role: "user", content: userMessage });
    req.session.chatHistory.push({ role: "assistant", content: aiResponse });

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const action = JSON.parse(jsonMatch[0]);

        if (action.action === "book") {
          if (!isValidField(action.title) || !isValidField(action.date)) {
            return res.json({
              message:
                "I need the appointment type, date, and time. Could you provide the missing details?",
            });
          }

          // Check if slot is already booked
          const existingAppointment = await Appointment.findOne({
            date: action.date,
            status: "Upcoming",
          });

          if (existingAppointment) {
            // Find next available slot
            const [datePart, timePart] = action.date.split(" at ");
            const SLOTS = [
              "09:00",
              "10:00",
              "11:00",
              "14:00",
              "15:00",
              "16:00",
            ];
            let suggestion = null;

            for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
              const [year, month, day] = datePart.split("-").map(Number);
              const candidate = new Date(year, month - 1, day + dayOffset);
              if (candidate.getDay() === 0) continue;

              const candidateDateStr = candidate.toISOString().split("T")[0];
              const startSlots =
                dayOffset === 0
                  ? SLOTS.slice(SLOTS.indexOf(timePart) + 1)
                  : SLOTS;

              for (const slot of startSlots) {
                const slotDate = `${candidateDateStr} at ${slot}`;
                const taken = await Appointment.findOne({
                  date: slotDate,
                  status: "Upcoming",
                });
                if (!taken) {
                  suggestion = slotDate;
                  break;
                }
              }
              if (suggestion) break;
            }
            if (suggestion) {
              req.session.pendingBooking = {
                title: action.title,
                notes: action.notes || "",
                suggestedDate: suggestion,
              };
            }
            return res.json({
              message: suggestion
                ? `That slot is already booked. The nearest available slot is ${suggestion}. Would you like me to book that instead?`
                : "That slot is already booked and no other slots are available soon.",
            });
          }
          const appointmentDate = new Date(action.date.split(" at ")[0]);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (appointmentDate < today) {
            return res.json({
              message:
                "I can't book appointments in the past. Please choose a future date.",
            });
          }
          const newAppt = new Appointment({
            title: action.title,
            date: action.date,
            notes: action.notes || "",
            userId,
          });
          await newAppt.save();
          return res.json({
            message: "Done! Your appointment has been booked.",
            action: "booked",
          });
        }

        if (action.action === "cancel") {
          const query = { userId, status: "Upcoming" };
          if (action.title)
            query.title = { $regex: action.title, $options: "i" };
          if (action.date) query.date = { $regex: action.date, $options: "i" };
          const appt = await Appointment.findOneAndDelete(query);
          if (appt)
            return res.json({
              message: "Done! Your appointment has been cancelled.",
              action: "cancelled",
            });
          else
            return res.json({
              message: "I couldn't find that appointment. Please try again.",
            });
        }

        if (action.action === "edit") {
          const query = { userId, status: "Upcoming" };
          if (action.title)
            query.title = { $regex: action.title, $options: "i" };
          if (action.date) query.date = { $regex: action.date, $options: "i" };
          const appt = await Appointment.findOneAndUpdate(query, {
            title: action.newTitle || action.title,
            date: action.newDate || action.date,
            notes: action.newNotes || "",
          });
          if (appt)
            return res.json({
              message: "Done! Your appointment has been updated.",
              action: "edited",
            });
          else
            return res.json({
              message: "I couldn't find that appointment. Please try again.",
            });
        }
        if (action.action === "stop") {
          return res.json({
            message: action.message || "Goodbye! Have a great day!",
            action: "stop",
          });
        }
      }
    } catch (e) {
      console.log("JSON parse error:", e.message);
    }

    res.json({ message: aiResponse.trim() });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Voice agent error" });
  }
});

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

app.get("/api/chat-history", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: "Not logged in" });
  res.json({ history: req.session.chatHistory || [] });
});

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
