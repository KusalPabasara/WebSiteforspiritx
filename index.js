const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS

// MongoDB Connection to spirit11 Database
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/spirit11';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'spirit11', // Explicitly set the database name
})
.then(() => console.log('Connected to MongoDB - Database: spirit11'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Define Mongoose Schemas and Models
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  budget: { type: Number, default: 9000000 },
  team: { type: [String], default: [] },
});

const User = mongoose.model('User', userSchema);

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  university: { type: String, required: true },
  category: { type: String, required: true },
  stats: {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
  },
  value: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
});

const Player = mongoose.model('Player', playerSchema);

// Routes

// Signup Route
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      username,
      password: hashedPassword,
    });

    // Save the user to the database
    await user.save();

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Error creating user', details: err.message });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ error: 'Error logging in', details: err.message });
  }
});

// Add a Player to the Database
app.post('/api/players', async (req, res) => {
  const { name, university, category, stats, value, points } = req.body;

  try {
    const player = new Player({ name, university, category, stats, value, points });
    await player.save();
    res.status(201).json({ message: 'Player added successfully', player });
  } catch (err) {
    res.status(500).json({ error: 'Error adding player', details: err.message });
  }
});

// Get All Players
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find();
    res.status(200).json(players);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching players', details: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
