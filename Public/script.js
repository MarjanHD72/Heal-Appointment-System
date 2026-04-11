// script.js - JavaScript for Heal Appointment System

document.addEventListener('DOMContentLoaded', function() {
    // Form validation and submission handling

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (validateEmail(email) && password.length >= 6) {
                // Simulate login - in real app, this would be an API call
                alert('Login successful! Redirecting to dashboard...');
                window.location.href = 'dashboard.html';
            } else {
                alert('Please enter valid email and password (min 6 characters).');
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const nhsNumber = document.getElementById('nhsNumber').value;

            if (firstName && lastName && validateEmail(email) && password.length >= 6 && password === confirmPassword && nhsNumber) {
                // Simulate registration
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                alert('Please fill all fields correctly. Password must be at least 6 characters and match confirmation.');
            }
        });
    }

    // Booking form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const appointmentType = document.getElementById('appointmentType').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const reason = document.getElementById('reason').value;

            if (appointmentType && date && time && reason) {
                // Simulate booking
                const appointment = {
                    type: appointmentType,
                    date: date,
                    time: time,
                    reason: reason,
                    id: Date.now()
                };

                // Store in localStorage (simulate database)
                let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
                appointments.push(appointment);
                localStorage.setItem('appointments', JSON.stringify(appointments));

                alert('Appointment booked successfully!');
                window.location.href = 'dashboard.html';
            } else {
                alert('Please fill all fields.');
            }
        });
    }

    // Dashboard - load appointments
    if (document.getElementById('appointmentsList')) {
        loadAppointments();
    }

    // Logout
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Simulate logout
            alert('Logged out successfully.');
            window.location.href = 'index.html';
        });
    }
});

// Utility functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function loadAppointments() {
    const appointmentsList = document.getElementById('appointmentsList');
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');

    if (appointments.length === 0) {
        appointmentsList.innerHTML = '<p class="empty-state">No appointments booked yet. Your upcoming visits will appear here after you make a booking.</p>';
        return;
    }

    let html = '<div class="appointment-grid">';
    appointments.forEach(appointment => {
        const appointmentLabels = {
            gp: 'GP Consultation',
            nurse: 'Nurse Visit',
            specialist: 'Specialist Referral'
        };

        html += `
            <article class="appointment-card">
                <span class="appointment-meta">${appointment.date} at ${appointment.time}</span>
                <h3>${appointmentLabels[appointment.type] || appointment.type}</h3>
                <p>${appointment.reason}</p>
            </article>
        `;
    });
    html += '</div>';
    appointmentsList.innerHTML = html;
}
