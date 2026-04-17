// middlewares/auth.js
// Authentication and authorization middleware

import { UserModel } from "../models/userModel.js";

/**
 * Middleware: Load user from session into req.user and res.locals
 * Runs on every request. User is optional (null if not logged in).
 */
export const loadUser = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await UserModel.findById(req.session.userId);
      if (user) {
        user.isOrganiser = user.role === 'organiser';
        req.user = user;
        res.locals.user = user; // available in templates
      } else {
        // Session references deleted user; clear session
        req.session.destroy(() => {});
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware: Require authenticated user
 * Redirects to login if not authenticated
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  next();
};

/**
 * Middleware: Require user to have organiser role
 * Use after requireAuth
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: `You do not have permission to access this page. Required role: ${role}.`,
      });
    }
    next();
  };
};
