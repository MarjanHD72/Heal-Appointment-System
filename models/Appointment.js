const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  title: String,
  date: String,
  notes: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Upcoming", "Completed", "Cancelled"],
    default: "Upcoming",
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
