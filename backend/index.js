const express = require('express');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin Setup (Placeholder)
// Un-comment and add your serviceAccountKey.json to the backend root
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Basic Route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
