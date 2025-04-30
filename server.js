const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your_secret_key_here'; // Use a secure env variable in production

// MongoDB Atlas connection
const atlasUri = 'mongodb+srv://suraiyyesminnov1130:OuLujhwIaxSsqthp@cluster0.hzjkyll.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(atlasUri)
  .then(() => console.log('MongoDB Atlas connected successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Email Transporter for OTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'suraiyyesminnov1130@gmail.com',        // ✅ replace with your email
    pass: 'qvez hntdwigsqenb'            // ✅ use Gmail App Password
  }
});

// Mongoose Schemas
const Contact = mongoose.model('Contact', new mongoose.Schema({
  firstName: String, lastName: String, email: String, message: String
}));

const Fruit = mongoose.model('Fruit', new mongoose.Schema({
  name: String, description: String, image: String
}));

const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  favoriteFruits: [String],
  otp: String,
  otpExpiry: Date
}));

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// === OTP AUTH ROUTES ===

// Send OTP to Email
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  let user = await User.findOne({ email });
  if (!user) user = new User({ email });

  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpiry = otpExpiry;
  await user.save();

  await transporter.sendMail({
    from: 'Healthy Fruits <your_email@gmail.com>',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`
  });

  res.json({ message: 'OTP sent successfully' });
});

// Verify OTP and Generate JWT
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ error: 'OTP expired or invalid' });
  }

  const isMatch = await bcrypt.compare(otp, user.otp);
  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect OTP' });
  }

  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token, message: 'OTP verified and user logged in' });
});

// Example Protected Route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected content accessed', user: req.user });
});

// === Contact Routes ===
app.post('/api/contact', async (req, res) => {
  const contact = new Contact(req.body);
  await contact.save();
  res.json({ message: 'Contact saved successfully' });
});

app.get('/api/contact', async (req, res) => {
  const contacts = await Contact.find();
  res.json(contacts);
});

// === Fruit Routes ===
app.get('/api/fruits', async (req, res) => {
  const fruits = await Fruit.find();
  res.json(fruits);
});

app.post('/api/fruits', async (req, res) => {
  const fruit = new Fruit(req.body);
  await fruit.save();
  res.json(fruit);
});

app.put('/api/fruits/:id', async (req, res) => {
  const { id } = req.params;
  const updatedFruit = await Fruit.findByIdAndUpdate(id, req.body, { new: true });
  res.json(updatedFruit);
});

app.delete('/api/fruits/:id', async (req, res) => {
  await Fruit.findByIdAndDelete(req.params.id);
  res.json({ message: 'Fruit deleted successfully' });
});

// === Search User Favorite Fruits ===
app.get('/search-user-fruits', async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const users = await User.find({ favoriteFruits: { $regex: query, $options: 'i' } });

    const matchedFruits = [...new Set(users.flatMap(user =>
      user.favoriteFruits.filter(fruit =>
        fruit.toLowerCase().includes(query.toLowerCase())
      )
    ))];

    res.json(matchedFruits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
