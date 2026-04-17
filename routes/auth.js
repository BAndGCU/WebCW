// routes/auth.js
// Authentication routes: login, logout

import { Router } from 'express';
import {
  loginPage,
  postLogin,
  logout,
} from '../controllers/authController.js';

const router = Router();

// GET /auth/login - show login form
router.get('/login', loginPage);

// POST /auth/login - process login
router.post('/login', postLogin);

// GET /auth/logout - destroy session and redirect
router.get('/logout', logout);

export default router;
