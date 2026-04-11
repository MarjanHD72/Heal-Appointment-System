const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the Public directory
app.use(express.static(path.join(__dirname, 'Public')));

// Start the server
app.listen(PORT, () => {
    console.log(`NHS Booking System server is running on http://localhost:${PORT}`);
});