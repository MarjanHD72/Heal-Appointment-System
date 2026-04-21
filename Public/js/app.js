let doctorsData = [];
let selectedDoctor = null;
let selectedDate = null;
let selectedTime = null;

/* Load doctors from API */
async function loadDoctors() {
  const res = await fetch("https://randomuser.me/api/?results=6");
  const data = await res.json();

  doctorsData = data.results.map((doc) => ({
    name: doc.name.first,
    image: doc.picture.medium,
    city: doc.location.city,
    slots: generateSlots(),
  }));

  renderDoctors();
}

/* Generate random slots */
function generateSlots() {
  const allTimes = ["09:00", "10:00", "11:00", "14:00", "15:00"];
  return allTimes.filter(() => Math.random() > 0.4);
}

/* Render doctors */
function renderDoctors() {
  const container = document.getElementById("doctors");
  container.innerHTML = "";

  doctorsData.forEach((doc, index) => {
    container.innerHTML += `
      <div class="card">
        <img src="${doc.image}" style="border-radius:50%">
        <h3>Dr. ${doc.name}</h3>
        <p>${doc.city}</p>
        <button class="btn" onclick="selectDoctor(${index})">
          Select
        </button>
      </div>
    `;
  });
}

/* Select doctor */
function selectDoctor(index) {
  selectedDoctor = doctorsData[index];
  loadSlots();
}

/* Load slots */
function loadSlots() {
  const slotsDiv = document.getElementById("slots");
  slotsDiv.innerHTML = "";

  if (!selectedDoctor) return;

  selectedDoctor.slots.forEach((time) => {
    let el = document.createElement("div");
    el.className = "slot";
    el.innerText = time;

    el.onclick = () => {
      document
        .querySelectorAll("#slots .slot")
        .forEach((s) => s.classList.remove("selected"));

      el.classList.add("selected");
      selectedTime = time;
    };

    slotsDiv.appendChild(el);
  });
}

/* Save booking */
function saveBooking() {
  const name = document.getElementById("name").value;

  if (!name || !selectedDoctor || !selectedTime) {
    alert("Please complete all fields");
    return;
  }

  let booking = {
    name,
    doctor: selectedDoctor.name,
    time: selectedTime,
  };

  localStorage.setItem("booking", JSON.stringify(booking));

  alert("Booking saved!");
}

/* Run on load */
window.onload = loadDoctors;


