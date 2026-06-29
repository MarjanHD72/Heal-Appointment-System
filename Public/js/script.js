const healthTips = [
  "💧 Drink at least 2 litres of water daily.",
  "🚶 Take a short walk after meals to improve digestion.",
  "😴 Aim for 7–8 hours of quality sleep.",
  "🥗 Eat more fruits and vegetables every day.",
  "🧘 Practice deep breathing to reduce stress.",
  "📵 Avoid screens 30 minutes before sleep.",
  "🏃 Stay active for at least 30 minutes a day.",
  "🧂 Reduce salt intake to maintain healthy blood pressure.",
];

const greenTheme = {
  confirmButtonColor: "#2e7d5b",
  cancelButtonColor: "#b0bec5",
  background: "#f4f9f7",
  color: "#1b4332",
};

let allAppointments = [];

async function showSuccess(message) {
  return await Swal.fire({
    ...greenTheme,
    icon: "success",
    title: "Done",
    text: message,
  });
}

function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Something went wrong",
    text: message,
    confirmButtonColor: "#2e7d5b",
    background: "#e6f4ea",
    color: "#1b4332",
    showClass: { popup: "animate__animated animate__shakeX" },
  });
}

async function showConfirm(message) {
  return await Swal.fire({
    ...greenTheme,
    title: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });
}

document.addEventListener("DOMContentLoaded", function () {
  getHealthTip();

  // Mobile nav toggle
  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector("nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      const isOpen = mainNav.classList.toggle("is-open");
      this.setAttribute("aria-expanded", isOpen);
      this.innerHTML = isOpen ? "&#10005;" : "&#9776;";
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.innerHTML = "&#9776;";
      });
    });
  }

  // Login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          await showSuccess("Login successful! 🌿");
          window.location.href = "dashboard.html";
        } else {
          showError(data.message || "Login failed");
        }
      } catch (err) {
        console.error(err);
        showError("Something went wrong");
      }
    });
  }

  // Register form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const firstName = document.getElementById("firstName").value;
      const lastName = document.getElementById("lastName").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const nhsNumber = document.getElementById("nhsNumber").value;
      if (
        !firstName ||
        !lastName ||
        !validateEmail(email) ||
        password.length < 6 ||
        password !== confirmPassword ||
        !nhsNumber
      ) {
        showError("Please fill all fields correctly.");
        return;
      }
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
            nhsNumber,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          await showSuccess("Registration successful! 🌿");
          window.location.href = "login.html";
        } else {
          showError(data.message || "Registration failed");
        }
      } catch (err) {
        console.error(err);
        showError("Something went wrong");
      }
    });
  }

  // Booking form
  const bookingForm = document.getElementById("bookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const appointmentType = document.getElementById("appointmentType").value;
      const date = document.getElementById("date").value;
      const time = document.getElementById("time").value;
      const reason = document.getElementById("reason").value;
      if (appointmentType && date && time && reason) {
        try {
          await fetch("/api/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: appointmentType,
              date: date + " at " + time,
              notes: reason,
            }),
          });
          await showSuccess("Appointment booked successfully 🌿");
          window.location.href = "dashboard.html";
        } catch (err) {
          console.error(err);
          showError("Something went wrong");
        }
      } else {
        showError("Please fill all fields.");
      }
    });
  }

  if (document.getElementById("appointmentsList")) loadAppointments();
  if (document.getElementById("doctorCards")) initializeDoctorsDirectory();

  // Logout
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      try {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
      } catch (err) {
        console.error(err);
      }
      await showSuccess("Logged out successfully. 🌿");
      window.location.href = "index.html";
    });
  }

  loadBookingSummary();
  checkLogin();

  // Chat Widget
  const chatToggle = document.getElementById("chat-toggle");
  const chatHeader = document.getElementById("chat-header");
  const sendBtn = document.getElementById("send-btn");
  const chatInput = document.getElementById("chat-input");

  if (chatToggle) {
    chatToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("chat-box").classList.toggle("hidden");
    });
  }

  if (chatHeader) {
    chatHeader.addEventListener("click", () => {
      document.getElementById("chat-box").classList.toggle("hidden");
    });
  }

  if (sendBtn) sendBtn.addEventListener("click", sendTextMessage);
  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendTextMessage();
    });
  }

  // Voice btn
  const voiceBtn = document.getElementById("voice-btn");
  if (voiceBtn) {
    voiceBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!isRecording) {
        await startConversation();
      } else {
        stopConversation();
      }
    });
  }
});

// ========== HELPER FUNCTIONS ==========

function setElementVisibility(elementId, isVisible) {
  const element = document.getElementById(elementId);
  if (element) {
    element.hidden = !isVisible;
    element.style.display = isVisible ? "" : "none";
  }
}

function updateNavigation(isLoggedIn) {
  setElementVisibility("navLogin", !isLoggedIn);
  setElementVisibility("navRegister", !isLoggedIn);
  setElementVisibility("navDashboard", isLoggedIn);
  setElementVisibility("navBooking", isLoggedIn);
  setElementVisibility("navLogout", isLoggedIn);
  setElementVisibility("createAccountBtn", !isLoggedIn);
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function getHealthTip() {
  const quoteEl = document.getElementById("quote");
  if (!quoteEl) return;
  const randomIndex = Math.floor(Math.random() * healthTips.length);
  quoteEl.innerHTML = `<div style="margin-top:6px;">${healthTips[randomIndex]}</div>`;
}

async function checkLogin() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (res.ok) {
      const user = await res.json();
      console.log("Logged in:", user);
      updateNavigation(true);
    } else {
      updateNavigation(false);
      if (
        window.location.pathname.includes("dashboard.html") ||
        window.location.pathname.includes("booking.html")
      ) {
        window.location.href = "login.html";
      }
    }
  } catch (err) {
    console.error(err);
    updateNavigation(false);
  }
}

function loadBookingSummary() {
  const bookingCard = document.getElementById("data");
  if (!bookingCard) return;
  const booking = JSON.parse(localStorage.getItem("booking"));
  if (booking) {
    bookingCard.innerHTML = `<p><strong>${booking.name}</strong></p><p>Doctor: ${booking.doctor}</p><p>Time: ${booking.time}</p>`;
  } else {
    bookingCard.innerHTML = "No booking yet";
  }
}

// Booking btn
const bookingBtn = document.getElementById("bookingBtn");
if (bookingBtn) {
  bookingBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        window.location.href = "booking.html";
      } else {
        window.location.href = "login.html";
      }
    } catch (err) {
      console.error(err);
    }
  });
}

// ========== APPOINTMENTS ==========

async function loadAppointments() {
  const appointmentsList = document.getElementById("appointmentsList");
  try {
    const res = await fetch("/api/appointments", { credentials: "include" });
    const appointments = await res.json();
    allAppointments = appointments;
    renderAppointments(
      appointments.filter((a) => {
        const datePart = a.date.split(" at ")[0];
        const appointmentDate = new Date(datePart);
        const today = new Date();
        let status = a.status || "Upcoming";
        if (status === "Upcoming" && appointmentDate < today)
          status = "Completed";
        return status === "Upcoming";
      }),
    );
  } catch (err) {
    console.error(err);
    appointmentsList.innerHTML = "<p>Error loading appointments</p>";
  }
}

function renderAppointments(appointments) {
  const appointmentsList = document.getElementById("appointmentsList");
  if (appointments.length === 0) {
    appointmentsList.innerHTML =
      '<p class="empty-state">No appointments booked yet.</p>';
    return;
  }
  let html = '<div class="appointment-grid">';
  appointments.forEach((appointment) => {
    const [day, month, year] = appointment.date.split(" at ")[0].split("/");
    const appointmentDate = new Date(`${year}-${month}-${day}`);
    const today = new Date();
    let displayStatus = appointment.status || "Upcoming";
    if (displayStatus === "Upcoming" && appointmentDate < today)
      displayStatus = "Completed";
    html += `
    <article class="appointment-card">
      <span class="appointment-meta">${appointment.date}</span>
      <span class="status-badge ${displayStatus.toLowerCase()}">${displayStatus}</span>
      <h3>${appointment.title}</h3>
      <p>${appointment.notes}</p>
      <button onclick="deleteAppointment('${appointment._id}')" class="btn-danger">Cancel your Appointment</button>
      <button onclick="EditAppointment('${appointment._id}')" class="btn-warning">Edit your Appointment</button>
    </article>`;
  });
  html += "</div>";
  appointmentsList.innerHTML = html;
}

function filterAppointments(status) {
  document
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");
  const filtered = allAppointments.filter((appointment) => {
    const datePart = appointment.date.split(" at ")[0];
    const appointmentDate = new Date(datePart);
    const today = new Date();
    let displayStatus = appointment.status || "Upcoming";
    if (displayStatus === "Upcoming" && appointmentDate < today)
      displayStatus = "Completed";
    return displayStatus === status;
  });
  renderAppointments(filtered);
}

async function deleteAppointment(id) {
  const result = await showConfirm("Do you want to Cancel this appointment?");
  if (!result.isConfirmed) return;
  try {
    await fetch(`/api/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "Cancelled" }),
    });
    await showSuccess("Appointment Cancelled successfully 🌿");
    loadAppointments();
  } catch (err) {
    console.error(err);
    showError("Something went wrong");
  }
}

async function EditAppointment(id) {
  const { value } = await Swal.fire({
    ...greenTheme,
    title: "Edit Appointment",
    html: `
  <div style="width:calc(100% - 3.5em);margin:0 auto;display:flex;flex-direction:column;gap:0.5em;">
    <select id="swal-title" style="width:100%;padding:0.75em 1em;font-size:1em;border:1px solid #d9d9d9;border-radius:0.3125em;color:#545454;background:#fff;box-shadow:inset 0 1px 1px rgba(0,0,0,.06);appearance:auto;">
      <option value="">Select Type</option>
      <option value="GP Consultation">GP Consultation</option>
      <option value="Nurse Visit">Nurse Visit</option>
      <option value="Specialist Referral">Specialist Referral</option>
    </select>
    <input id="swal-date" type="date" style="width:100%;padding:0.75em 1em;font-size:1em;border:1px solid #d9d9d9;border-radius:0.3125em;color:#545454;background:#fff;box-shadow:inset 0 1px 1px rgba(0,0,0,.06);box-sizing:border-box;">
    <select id="swal-time" style="width:100%;padding:0.75em 1em;font-size:1em;border:1px solid #d9d9d9;border-radius:0.3125em;color:#545454;background:#fff;box-shadow:inset 0 1px 1px rgba(0,0,0,.06);appearance:auto;">
      <option value="">Select Time</option>
      <option value="09:00">09:00</option>
      <option value="10:00">10:00</option>
      <option value="11:00">11:00</option>
      <option value="14:00">14:00</option>
      <option value="15:00">15:00</option>
      <option value="16:00">16:00</option>
    </select>
    <textarea id="swal-notes" placeholder="Reason" style="width:100%;padding:0.75em 1em;font-size:1em;border:1px solid #d9d9d9;border-radius:0.3125em;color:#545454;background:#fff;box-shadow:inset 0 1px 1px rgba(0,0,0,.06);resize:vertical;min-height:7em;font-family:inherit;box-sizing:border-box;"></textarea>
  </div>`,
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      const title = document.getElementById("swal-title").value;
      const date = document.getElementById("swal-date").value;
      const time = document.getElementById("swal-time").value;
      const notes = document.getElementById("swal-notes").value;
      if (!title || !date || !time || !notes) {
        Swal.showValidationMessage("Please fill all fields");
        return false;
      }
      return { title, date: date + " at " + time, notes };
    },
  });
  if (!value) return;
  try {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(value),
    });
    await showSuccess("Appointment updated successfully 🌿");
    loadAppointments();
  } catch (err) {
    console.error(err);
    showError("Something went wrong");
  }
}

async function updateStatus(id, status) {
  try {
    await fetch(`/api/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    await showSuccess("Appointment Updated successfully 🌿");
    loadAppointments();
  } catch (err) {
    console.error(err);
    showError("Something went wrong");
  }
}

// ========== CHAT WIDGET ==========

function addMessage(text, sender) {
  const messages = document.getElementById("chat-messages");
  if (!messages) return;
  const msg = document.createElement("div");
  msg.className = `chat-msg ${sender}`;
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

async function sendTextMessage() {
  const input = document.getElementById("chat-input");
  const voiceStatus = document.getElementById("voice-status");
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  if (voiceStatus) voiceStatus.textContent = "Thinking...";

  try {
    const res = await fetch("/api/voice-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userMessage: text }),
    });
    const data = await res.json();
    addMessage(data.message, "ai");
    if (voiceStatus) voiceStatus.textContent = "";
    if (data.action) setTimeout(() => location.reload(), 2000);
  } catch (err) {
    console.error(err);
    if (voiceStatus) voiceStatus.textContent = "Error!";
  }
}

// VOICE AGENT 

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let silenceTimer;
let stream;

async function startConversation() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  isRecording = true;
  const voiceBtn = document.getElementById("voice-btn");
  const voiceStatus = document.getElementById("voice-status");
  if (voiceBtn) voiceBtn.classList.add("recording");
  if (voiceStatus) voiceStatus.textContent = "Listening...";
  listenForSpeech();
}

function stopConversation() {
  isRecording = false;
  const voiceBtn = document.getElementById("voice-btn");
  const voiceStatus = document.getElementById("voice-status");
  if (voiceBtn) voiceBtn.classList.remove("recording");
  if (voiceStatus) voiceStatus.textContent = "";
  if (stream) stream.getTracks().forEach((t) => t.stop());
  window.speechSynthesis.cancel();
  clearTimeout(silenceTimer);
}

function listenForSpeech() {
  if (!isRecording) return;

  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream);

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.fftSize = 512;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let speechDetected = false;
  let silenceStart = null;

  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

  mediaRecorder.onstop = async () => {
    audioContext.close();
    if (speechDetected && audioChunks.length > 0) {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      await processAudio(audioBlob);
    } else {
      if (isRecording) listenForSpeech();
    }
  };

  mediaRecorder.start();

  function checkVolume() {
    if (!isRecording) return;
    analyser.getByteFrequencyData(dataArray);
    const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

    if (volume > 15) {
      if (!speechDetected) {
        window.speechSynthesis.cancel();
        speechDetected = true;
        const voiceStatus = document.getElementById("voice-status");
        if (voiceStatus) voiceStatus.textContent = "Listening...";
      }
      silenceStart = null;
    } else if (speechDetected) {
      if (!silenceStart) silenceStart = Date.now();
      if (Date.now() - silenceStart > 1500) {
        mediaRecorder.stop();
        return;
      }
    }
    requestAnimationFrame(checkVolume);
  }

  checkVolume();

  silenceTimer = setTimeout(() => {
    if (mediaRecorder.state === "recording") mediaRecorder.stop();
  }, 8000);
}

async function processAudio(audioBlob) {
  const voiceStatus = document.getElementById("voice-status");
  try {
    if (voiceStatus) voiceStatus.textContent = "Processing...";

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-large-v3");

    const sttResponse = await fetch("/api/stt", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const sttData = await sttResponse.json();
    const userText = sttData.text;

    if (!userText || userText.trim() === "") {
      if (isRecording) listenForSpeech();
      return;
    }

    if (voiceStatus) voiceStatus.textContent = `"${userText}"`;
    addMessage(userText, "user");

    const agentResponse = await fetch("/api/voice-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userMessage: userText }),
    });

    const agentData = await agentResponse.json();
    addMessage(agentData.message, "ai");

    await speak(agentData.message);

    if (agentData.action) setTimeout(() => location.reload(), 2000);
  } catch (err) {
    console.error(err);
    if (voiceStatus) voiceStatus.textContent = "Error occurred!";
  }
}

function speak(text) {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => {
      const voiceStatus = document.getElementById("voice-status");
      if (voiceStatus) voiceStatus.textContent = "Listening...";
      if (isRecording) listenForSpeech();
      resolve();
    };
    window.speechSynthesis.speak(utterance);
  });
}

// ========== DOCTORS DIRECTORY ==========

function initializeDoctorsDirectory() {
  const doctors = [
    {
      id: "dr-amelia-hart",
      name: "Dr. Amelia Hart",
      specialty: "Cardiology",
      tag: "Featured Doctor",
      experience: "12 years",
      availability: "Mon, Wed, Fri",
      languages: "English, Arabic",
      consultation: "In-person & video",
      summary:
        "Heart health specialist with a prevention-first approach for adults managing chest pain, blood pressure, and recovery planning.",
      bio: "Dr. Hart combines diagnostics, lifestyle guidance, and long-term follow-up to build practical treatment plans that feel clear and reassuring.",
      focus: [
        "Chest pain assessment and follow-up care",
        "Hypertension and cholesterol management",
        "Recovery planning after cardiac procedures",
      ],
      highlight:
        "Patients value her calm communication, structured care plans, and strong focus on prevention.",
    },
    {
      id: "dr-olivia-lane",
      name: "Dr. Olivia Lane",
      specialty: "Dermatology",
      tag: "Skin & Wellness",
      experience: "9 years",
      availability: "Tue, Thu, Sat",
      languages: "English, French",
      consultation: "In-person",
      summary:
        "Dermatologist supporting acne, eczema, mole checks, and long-term skin health with treatment plans tailored to lifestyle.",
      bio: "Dr. Lane balances medical treatment with practical skincare routines so patients leave with a plan they can actually follow.",
      focus: [
        "Acne treatment for teens and adults",
        "Eczema, psoriasis, and flare management",
        "Skin screening and preventative checks",
      ],
      highlight:
        "Known for approachable explanations and realistic routines that reduce repeat flare-ups.",
    },
    {
      id: "dr-daniel-reed",
      name: "Dr. Daniel Reed",
      specialty: "Neurology",
      tag: "Specialist Support",
      experience: "14 years",
      availability: "Mon to Thu",
      languages: "English, Spanish",
      consultation: "In-person & video",
      summary:
        "Neurology consultant for migraines, nerve pain, dizziness, and ongoing symptom reviews requiring careful monitoring.",
      bio: "Dr. Reed focuses on clear evaluations and gradual treatment adjustments to help patients understand what is happening and what comes next.",
      focus: [
        "Migraine investigation and treatment planning",
        "Nerve pain and numbness reviews",
        "Long-term neurological symptom monitoring",
      ],
      highlight:
        "Patients appreciate his detailed follow-ups and step-by-step explanations of complex symptoms.",
    },
    {
      id: "dr-sophia-nasir",
      name: "Dr. Sophia Nasir",
      specialty: "Pediatrics",
      tag: "Family Favourite",
      experience: "10 years",
      availability: "Mon, Tue, Thu, Fri",
      languages: "English, Urdu",
      consultation: "In-person & video",
      summary:
        "Pediatric doctor helping families with child wellness, fevers, feeding concerns, growth reviews, and routine follow-up care.",
      bio: "Dr. Nasir creates a warm experience for both children and parents, with simple guidance that reduces stress after the appointment.",
      focus: [
        "Routine child wellness checks",
        "Infant feeding and growth support",
        "Fever, allergy, and recurring illness reviews",
      ],
      highlight:
        "Families choose her for her gentle communication style and practical advice between visits.",
    },
    {
      id: "dr-ethan-clarke",
      name: "Dr. Ethan Clarke",
      specialty: "Psychology",
      tag: "Mind & Recovery",
      experience: "11 years",
      availability: "Wed to Sat",
      languages: "English",
      consultation: "Video-first",
      summary:
        "Clinical psychologist supporting anxiety, burnout, stress recovery, and emotional resilience through structured sessions.",
      bio: "Dr. Clarke blends evidence-based techniques with a collaborative pace so patients can build progress without feeling overwhelmed.",
      focus: [
        "Anxiety and stress-management support",
        "Burnout recovery and coping strategies",
        "Sleep, routine, and resilience planning",
      ],
      highlight:
        "Patients often mention his steady approach and the clarity of the tools they can use after sessions.",
    },
    {
      id: "dr-layla-bennett",
      name: "Dr. Layla Bennett",
      specialty: "General Practice",
      tag: "Everyday Care",
      experience: "8 years",
      availability: "Daily",
      languages: "English, Turkish",
      consultation: "In-person & video",
      summary:
        "General practitioner for everyday concerns, check-ups, referrals, and coordinated care when symptoms need a broader view.",
      bio: "Dr. Bennett helps patients move from first concern to next step quickly, whether that means treatment, tests, or specialist referral.",
      focus: [
        "General illness and symptom reviews",
        "Preventive health checks and screenings",
        "Referrals and coordinated follow-up care",
      ],
      highlight:
        "A strong fit for patients who want one trusted doctor to coordinate their care journey.",
    },
  ];

  const cardsContainer = document.getElementById("doctorCards");
  const searchInput = document.getElementById("doctorSearch");
  const specialtyFilter = document.getElementById("specialtyFilter");
  let activeDoctorId = doctors[0].id;

  function renderDoctorDetails(doctor) {
    document.getElementById("doctorDetailTag").textContent = doctor.tag;
    document.getElementById("doctorDetailName").textContent = doctor.name;
    document.getElementById("doctorDetailSpecialty").textContent =
      doctor.specialty;
    document.getElementById("doctorDetailBio").textContent = doctor.bio;
    document.getElementById("doctorDetailExperience").textContent =
      doctor.experience;
    document.getElementById("doctorDetailAvailability").textContent =
      doctor.availability;
    document.getElementById("doctorDetailLanguages").textContent =
      doctor.languages;
    document.getElementById("doctorDetailConsultation").textContent =
      doctor.consultation;
    document.getElementById("doctorDetailHighlight").textContent =
      doctor.highlight;
    document.getElementById("doctorDetailFocus").innerHTML = doctor.focus
      .map((item) => `<li>${item}</li>`)
      .join("");
  }

  function renderDoctorCards() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedSpecialty = specialtyFilter.value;
    const filteredDoctors = doctors.filter((doctor) => {
      const matchesSearch =
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.summary.toLowerCase().includes(query);
      const matchesSpecialty =
        selectedSpecialty === "all" || doctor.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });

    if (!filteredDoctors.some((doctor) => doctor.id === activeDoctorId)) {
      activeDoctorId = filteredDoctors.length ? filteredDoctors[0].id : null;
    }

    if (!filteredDoctors.length) {
      cardsContainer.innerHTML =
        '<p class="empty-state">No doctors match this search yet.</p>';
      return;
    }

    cardsContainer.innerHTML = filteredDoctors
      .map(
        (doctor) => `
      <article class="doctor-card ${doctor.id === activeDoctorId ? "is-active" : ""}">
        <div class="doctor-card-header">
          <div>
            <span class="doctor-card-tag">${doctor.tag}</span>
            <h4>${doctor.name}</h4>
            <p class="doctor-card-meta">${doctor.specialty} · ${doctor.experience}</p>
          </div>
        </div>
        <p class="doctor-card-copy">${doctor.summary}</p>
        <div class="doctor-card-footer">
          <span class="doctor-card-chip">${doctor.availability}</span>
          <span class="doctor-card-chip">${doctor.consultation}</span>
        </div>
        <button class="btn-secondary" type="button" data-doctor-id="${doctor.id}">View Details</button>
      </article>`,
      )
      .join("");

    const activeDoctor = filteredDoctors.find(
      (doctor) => doctor.id === activeDoctorId,
    );
    if (activeDoctor) renderDoctorDetails(activeDoctor);

    cardsContainer.querySelectorAll("[data-doctor-id]").forEach((button) => {
      button.addEventListener("click", function () {
        activeDoctorId = this.dataset.doctorId;
        const selectedDoctor = doctors.find(
          (doctor) => doctor.id === activeDoctorId,
        );
        if (selectedDoctor) {
          renderDoctorDetails(selectedDoctor);
          renderDoctorCards();
          if (window.innerWidth <= 900) {
            document
              .getElementById("doctorDetailCard")
              .scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });
  }

  searchInput.addEventListener("input", renderDoctorCards);
  specialtyFilter.addEventListener("change", renderDoctorCards);
  renderDoctorCards();
}
