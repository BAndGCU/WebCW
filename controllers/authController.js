// controllers/authController.js
import { UserModel } from "../models/userModel.js";

/**
 * GET /auth/login
 * Display login form
 */
export const loginPage = (req, res) => {
  // If already logged in, redirect to home
  if (req.user) return res.redirect('/');
  res.render('login', { title: 'Login' });
};

/**
 * POST /auth/login
 * Authenticate user and create session
 */
export const postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('login', {
        title: 'Login',
        error: 'Email and password are required.',
      });
    }

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).render('login', {
        title: 'Login',
        error: 'Invalid email or password.',
      });
    }

    // Verify password
    const validPassword = await UserModel.verifyPassword(user, password);
    if (!validPassword) {
      return res.status(401).render('login', {
        title: 'Login',
        error: 'Invalid email or password.',
      });
    }

    // Password valid: create session
    req.session.userId = user._id;
    req.session.save((err) => {
      if (err) return next(err);
      // Redirect based on role
      if (user.role === 'organiser') {
        res.redirect('/organiser');
      } else {
        res.redirect('/');
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/register
 * Display registration form
 */
export const registerPage = (req, res) => {
  // If already logged in, redirect to home
  if (req.user) return res.redirect('/');
  res.render('register', { title: 'Register' });
};

/**
 * POST /auth/register
 * Create new user account and log in
 */
export const postRegister = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    // Validation
    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).render('register', {
        title: 'Register',
        error: 'All fields are required.',
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).render('register', {
        title: 'Register',
        error: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).render('register', {
        title: 'Register',
        error: 'Password must be at least 6 characters.',
      });
    }

    // Check if email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).render('register', {
        title: 'Register',
        error: 'Email is already in use.',
      });
    }

    // Create user (role defaults to 'student')
    const newUser = await UserModel.createWithPassword(
      name,
      email,
      password,
      'student'
    );

    // Create session immediately after registration
    req.session.userId = newUser._id;
    req.session.save((err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/logout
 * Destroy session and redirect
 */
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send('Failed to logout');
    res.redirect('/');
  });
};
