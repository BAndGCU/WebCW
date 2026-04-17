// routes/organiser.js
// Organiser management routes (course & session CRUD)
// All routes require organiser role

import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  dashboardPage,
  newCoursePage,
  createCourse,
  courseDetailPage,
  editCoursePage,
  updateCourse,
  deleteCourse,
  newSessionPage,
  createSession,
  editSessionPage,
  updateSession,
  deleteSession,
  usersListPage,
  newUserPage,
  createUser,
  updateUserRole,
  deleteUser,
  sessionAttendeesPage,
} from "../controllers/organiserController.js";

const router = Router();

// All organiser routes require authentication + organiser role
router.use(requireAuth);
router.use(requireRole("organiser"));

// Dashboard
router.get("/", dashboardPage);

// Course routes
router.get("/courses/new", newCoursePage);
router.post("/courses", createCourse);
router.get("/courses/:id", courseDetailPage);
router.get("/courses/:id/edit", editCoursePage);
router.post("/courses/:id", updateCourse);
router.post("/courses/:id/delete", deleteCourse);

// Session routes
router.get("/courses/:courseId/sessions/new", newSessionPage);
router.post("/sessions", createSession);
router.get("/sessions/:id/edit", editSessionPage);
router.post("/sessions/:id", updateSession);
router.post("/sessions/:id/delete", deleteSession);
router.get("/sessions/:id/attendees", sessionAttendeesPage);

// User management routes
router.get("/users", usersListPage);
router.get("/users/new", newUserPage);
router.post("/users", createUser);
router.post("/users/:id/role", updateUserRole);
router.post("/users/:id/delete", deleteUser);

export default router;
