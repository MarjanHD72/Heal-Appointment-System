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

document.addEventListener("DOMContentLoaded", function () {
  // Health Tips

  getHealthTip();
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
          alert("Login successful!");
          window.location.href = "dashboard.html";
        } else {
          alert(data.message || "Login failed");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      }
    });
  }

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
        alert("Please fill all fields correctly.");
        return;
      }

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
          alert("Registration successful!");
          window.location.href = "login.html";
        } else {
          alert(data.message || "Registration failed");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      }
    });
  }

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
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              title: appointmentType,
              date: date + " at " + time,
              notes: reason,
            }),
          });

          alert("Appointment booked successfully!");
          window.location.href = "dashboard.html";
        } catch (err) {
          console.error(err);
          alert("Error booking appointment");
        }
      } else {
        alert("Please fill all fields.");
      }
    });
  }

  if (document.getElementById("appointmentsList")) {
    loadAppointments();
  }

  if (document.getElementById("doctorCards")) {
    initializeDoctorsDirectory();
  }

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error(err);
      }

      alert("Logged out successfully.");
      window.location.href = "index.html";
    });
  }

  loadBookingSummary();
  checkLogin();
});

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

async function loadAppointments() {
  const appointmentsList = document.getElementById("appointmentsList");

  try {
    const res = await fetch("/api/appointments", {
      credentials: "include",
    });

    const appointments = await res.json();

    if (appointments.length === 0) {
      appointmentsList.innerHTML =
        '<p class="empty-state">No appointments booked yet.</p>';
      return;
    }

    let html = '<div class="appointment-grid">';

    appointments.forEach((appointment) => {
      html += `
        <article class="appointment-card">
          <span class="appointment-meta">${appointment.date}</span>
          <h3>${appointment.title}</h3>
          <p>${appointment.notes}</p>
        </article>
      `;
    });

    html += "</div>";
    appointmentsList.innerHTML = html;
  } catch (err) {
    console.error(err);
    appointmentsList.innerHTML = "<p>Error loading appointments</p>";
  }
}

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
        '<p class="empty-state">No doctors match this search yet. Try another specialty or a shorter keyword.</p>';
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
            <button class="btn-secondary" type="button" data-doctor-id="${doctor.id}">
              View Details
            </button>
          </article>
        `,
      )
      .join("");

    const activeDoctor = filteredDoctors.find(
      (doctor) => doctor.id === activeDoctorId,
    );
    if (activeDoctor) {
      renderDoctorDetails(activeDoctor);
    }

    cardsContainer.querySelectorAll("[data-doctor-id]").forEach((button) => {
      button.addEventListener("click", function () {
        activeDoctorId = this.dataset.doctorId;
        const selectedDoctor = doctors.find(
          (doctor) => doctor.id === activeDoctorId,
        );

        if (selectedDoctor) {
          renderDoctorDetails(selectedDoctor);
          renderDoctorCards();
        }
      });
    });
  }

  searchInput.addEventListener("input", renderDoctorCards);
  specialtyFilter.addEventListener("change", renderDoctorCards);
  renderDoctorCards();
}

function loadBookingSummary() {
  const bookingCard = document.getElementById("data");
  if (!bookingCard) {
    return;
  }

  const booking = JSON.parse(localStorage.getItem("booking"));

  if (booking) {
    bookingCard.innerHTML = `
      <p><strong>${booking.name}</strong></p>
      <p>Doctor: ${booking.doctor}</p>
      <p>Time: ${booking.time}</p>
    `;
  } else {
    bookingCard.innerHTML = "No booking yet";
  }
}

async function checkLogin() {
  try {
    const res = await fetch("/api/me", {
      credentials: "include",
    });

    if (res.ok) {
      const user = await res.json();
      console.log("Logged in:", user);
      updateNavigation(true);
    } else {
      console.log("Not logged in");
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

// book an appointment btn event
const bookingBtn = document.getElementById("bookingBtn");
if (bookingBtn) {
  bookingBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    console.log("clicked");
    try {
      const res = await fetch("/api/me", {
        credentials: "include",
      });

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
// health Tips Function
function getHealthTip() {
  const quoteEl = document.getElementById("quote");

  if (!quoteEl) return;

  const randomIndex = Math.floor(Math.random() * healthTips.length);
  const tip = healthTips[randomIndex];

  quoteEl.innerHTML = `<div style="font-weight:600;"></div>
     <div style="margin-top:6px;">${tip}</div>`;
}
