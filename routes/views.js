// routes/views.js
// Server-side rendered (SSR) view routes for the public website

import { Router } from "express";
import {
  homePage,
  courseDetailPage,
  postBookCourse,
  postBookSession,
  bookingConfirmationPage,
} from "../controllers/viewsController.js";
import { coursesListPage } from "../controllers/coursesListController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Public routes (no auth required)
router.get("/", homePage);
router.get("/courses", coursesListPage);
router.get("/courses/:id", courseDetailPage);

// Protected routes (authentication required)
router.post("/courses/:id/book", requireAuth, postBookCourse);
router.post("/sessions/:id/book", requireAuth, postBookSession);
router.get("/bookings/:bookingId", requireAuth, bookingConfirmationPage);

export default router;
