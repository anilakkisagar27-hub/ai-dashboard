const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { userStore } = require('../storage/fileStore');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ─── REGISTER ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'doctor', department = 'ICU' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Check duplicate
    const existing = userStore.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save to users.json
    const newUser = userStore.create({
      id: `usr_${uuidv4()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      department,
      isActive: true,
      lastLogin: null,
    });

    const token = signToken(newUser.id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to ICU AI System.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user in users.json
    const user = userStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last login in file
    userStore.updateLastLogin(user.id);

    const token = signToken(user.id);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
exports.getMe = (req, res) => {
  try {
    const user = userStore.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const { password, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ALL USERS (admin) ────────────────────────────────────────────────────
exports.getAllUsers = (req, res) => {
  try {
    const users = userStore.getAll().map(({ password, ...u }) => u);
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
