// controllers/organiserController.js
// Organiser course and session management

import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { UserModel } from "../models/userModel.js";

/**
 * Formatting helpers for date/time display
 */
const fmtDate = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDateOnly = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const fmtTimeOnly = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * GET /organiser
 * Organiser dashboard: list all courses
 */
export const dashboardPage = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const coursesList = await Promise.all(
      courses.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          startDate: c.startDate ? fmtDateOnly(c.startDate) : "TBA",
          endDate: c.endDate ? fmtDateOnly(c.endDate) : "TBA",
          price: c.price ? `£${c.price.toFixed(2)}` : "TBA",
          location: c.location || "TBA",
          sessionCount: sessions.length,
        };
      })
    );
    res.render("organiser-dashboard", {
      title: "Organiser Dashboard",
      courses: coursesList,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /organiser/courses/new
 * Show course creation form
 */
export const newCoursePage = (req, res) => {
  res.render("course-form", {
    title: "Create New Course",
    course: {},
    isNew: true,
    level: {
      isBeginner: false,
      isIntermediate: false,
      isAdvanced: false,
    },
    type: {
      isWeeklyBlock: false,
      isWeekendWorkshop: false,
      isSingleSession: false,
      isRetreat: false,
    },
  });
};

/**
 * POST /organiser/courses
 * Create new course
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, level, type, allowDropIn, startDate, endDate, price, location } =
      req.body;

    // Validation
    if (!title || !level || !type) {
      return res.status(400).render("course-form", {
        title: "Create New Course",
        course: req.body,
        isNew: true,
        error: "Title, level, and type are required.",
      });
    }

    const course = await CourseModel.create({
      title,
      description,
      level,
      type,
      allowDropIn: allowDropIn === "on" || allowDropIn === "true",
      startDate: startDate || null,
      endDate: endDate || null,
      price: price ? parseFloat(price) : null,
      location,
      sessionIds: [],
      createdAt: new Date().toISOString(),
    });

    res.redirect(`/organiser/courses/${course._id}`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /organiser/courses/:id
 * Show course detail page with sessions list
 */
export const courseDetailPage = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res.status(404).render("error", {
        title: "Not found",
        message: "Course not found",
      });

    const sessions = await SessionModel.listByCourse(courseId);
    const sessionsList = sessions.map((s) => ({
      id: s._id,
      startDateTime: s.startDateTime,
      startDate: fmtDateOnly(s.startDateTime),
      startTime: fmtTimeOnly(s.startDateTime),
      endDate: fmtDateOnly(s.endDateTime),
      endTime: fmtTimeOnly(s.endDateTime),
      location: s.location || course.location || "TBA",
      capacity: s.capacity,
      booked: s.bookedCount ?? 0,
    }));

    res.render("course-detail-organiser", {
      title: course.title,
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        level: course.level,
        type: course.type,
        allowDropIn: course.allowDropIn,
        startDate: course.startDate ? fmtDateOnly(course.startDate) : "",
        endDate: course.endDate ? fmtDateOnly(course.endDate) : "",
        price: course.price ? `£${course.price.toFixed(2)}` : "TBA",
        location: course.location || "TBA",
      },
      sessions: sessionsList,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /organiser/courses/:id/edit
 * Show course edit form
 */
export const editCoursePage = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res.status(404).render("error", {
        title: "Not found",
        message: "Course not found",
      });

    res.render("course-form", {
      title: `Edit: ${course.title}`,
      course: {
        id: course._id,
        ...course,
      },
      isNew: false,
      level: {
        isBeginner: course.level === "beginner",
        isIntermediate: course.level === "intermediate",
        isAdvanced: course.level === "advanced",
      },
      type: {
        isWeeklyBlock: course.type === "WEEKLY_BLOCK",
        isWeekendWorkshop: course.type === "WEEKEND_WORKSHOP",
        isSingleSession: course.type === "SINGLE_SESSION",
        isRetreat: course.type === "RETREAT",
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /organiser/courses/:id
 * Update course
 */
export const updateCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const { title, description, level, type, allowDropIn, startDate, endDate, price, location } =
      req.body;

    if (!title || !level || !type) {
      return res.status(400).render("course-form", {
        title: "Edit Course",
        course: { id: courseId, ...req.body },
        isNew: false,
        error: "Title, level, and type are required.",
      });
    }

    const updated = await CourseModel.update(courseId, {
      title,
      description,
      level,
      type,
      allowDropIn: allowDropIn === "on" || allowDropIn === "true",
      startDate: startDate || null,
      endDate: endDate || null,
      price: price ? parseFloat(price) : null,
      location,
    });

    res.redirect(`/organiser/courses/${courseId}`);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /organiser/courses/:id/delete
 * Delete course
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res.status(404).render("error", {
        title: "Not found",
        message: "Course not found",
      });

    // Delete all associated sessions
    const sessions = await SessionModel.listByCourse(courseId);
    for (const session of sessions) {
      await SessionModel.delete(session._id);
    }

    // Delete course
    await CourseModel.delete(courseId);
    res.redirect("/organiser");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /organiser/courses/:courseId/sessions/new
 * Show session creation form
 */
export const newSessionPage = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res.status(404).render("error", {
        title: "Not found",
        message: "Course not found",
      });

    res.render("session-form", {
      title: `New Session for: ${course.title}`,
      courseId,
      courseName: course.title,
      session: { courseId },
      isNew: true,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /organiser/sessions
 * Create new session
 */
export const createSession = async (req, res, next) => {
  try {
    const { courseId, startDateTime, endDateTime, capacity, location } = req.body;

    if (!courseId || !startDateTime || !endDateTime || !capacity) {
      return res.status(400).render("session-form", {
        title: "Create New Session",
        courseId,
        session: req.body,
        isNew: true,
        error: "Course, start date/time, end date/time, and capacity are required.",
      });
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).render("error", {
        title: "Not found",
        message: "Course not found",
      });
    }

    const session = await SessionModel.create({
      courseId,
      startDateTime,
      endDateTime,
      capacity: parseInt(capacity),
      location: location || null,
      bookedCount: 0,
      createdAt: new Date().toISOString(),
    });

    res.redirect(`/organiser/courses/${courseId}`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /organiser/sessions/:id/edit
 * Show session edit form
 */
export const editSessionPage = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await SessionModel.findById(sessionId);
    if (!session)
      return res.status(404).render("error", {
        title: "Not found",
        message: "Session not found",
      });

    const course = await CourseModel.findById(session.courseId);

    res.render("session-form", {
      title: `Edit Session`,
      courseId: session.courseId,
      courseName: course ? course.title : "Unknown",
      session: {
        id: session._id,
        courseId: session.courseId,
        startDateTime: session.startDateTime,
        endDateTime: session.endDateTime,
        capacity: session.capacity,
        location: session.location,
      },
      isNew: false,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /organiser/sessions/:id
 * Update session
 */
export const updateSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { startDateTime, endDateTime, capacity, location } = req.body;

    if (!startDateTime || !endDateTime || !capacity) {
      const session = await SessionModel.findById(sessionId);
      return res.status(400).render("session-form", {
        title: "Edit Session",
        session: { id: sessionId, ...req.body },
        isNew: false,
        error: "Start date/time, end date/time, and capacity are required.",
      });
    }

    const session = await SessionModel.findById(sessionId);
    if (!session)
      return res.status(404).render("error", {
        title: "Not found",
        message: "Session not found",
      });

    const updated = await SessionModel.update(sessionId, {
      startDateTime,
      endDateTime,
      capacity: parseInt(capacity),
      location: location || null,
    });

    res.redirect(`/organiser/courses/${session.courseId}`);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /organiser/sessions/:id/delete
 * Delete session
 */
export const deleteSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await SessionModel.findById(sessionId);
    if (!session)
      return res.status(404).render("error", {
        title: "Not found",
        message: "Session not found",
      });

    const courseId = session.courseId;
    await SessionModel.delete(sessionId);
    res.redirect(`/organiser/courses/${courseId}`);
  } catch (err) {
    next(err);
  }
};

/**
 * ========== USER MANAGEMENT ==========
 */

/**
 * GET /organiser/users
 * List all users with role and actions
 */
export const usersListPage = async (req, res, next) => {
  try {
    const users = await UserModel.list();
    const usersList = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB") : "N/A",
      isStudent: u.role === "student",
      isOrganiser: u.role === "organiser",
      isCurrentUser: u._id === req.user._id,
    }));

    res.render("users-list", {
      title: "User Management",
      users: usersList,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /organiser/users/new
 * Show user creation form
 */
export const newUserPage = (req, res) => {
  res.render("user-form", {
    title: "Create New User",
    user: {},
    isNew: true,
    role: {
      isStudent: true, // Default to student
      isOrganiser: false,
    },
  });
};

/**
 * POST /organiser/users
 * Create new user account
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm, role } = req.body;

    // Validation
    if (!name || !email || !password || !passwordConfirm || !role) {
      return res.status(400).render("user-form", {
        title: "Create New User",
        user: req.body,
        isNew: true,
        error: "All fields are required.",
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).render("user-form", {
        title: "Create New User",
        user: req.body,
        isNew: true,
        error: "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.status(400).render("user-form", {
        title: "Create New User",
        user: req.body,
        isNew: true,
        error: "Password must be at least 6 characters.",
      });
    }

    // Check if email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).render("user-form", {
        title: "Create New User",
        user: req.body,
        isNew: true,
        error: "Email is already in use.",
      });
    }

    // Validate role
    if (!["student", "organiser"].includes(role)) {
      return res.status(400).render("user-form", {
        title: "Create New User",
        user: req.body,
        isNew: true,
        error: "Invalid role.",
      });
    }

    // Create user with password
    const newUser = await UserModel.createWithPassword(name, email, password, role);

    res.redirect("/organiser/users");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /organiser/users/:id/role
 * Change user role (student ↔ organiser)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!["student", "organiser"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    const user = await UserModel.findById(userId);
    if (!user)
      return res.status(404).json({ error: "User not found" });

    // Cannot change own role
    if (userId === req.user._id) {
      return res.status(400).json({ error: "Cannot change your own role." });
    }

    await UserModel.updateRole(userId, role);
    res.redirect("/organiser/users");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /organiser/users/:id/delete
 * Delete user account
 */
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await UserModel.findById(userId);
    if (!user)
      return res.status(404).render("error", {
        title: "Not found",
        message: "User not found",
      });

    // Cannot delete self
    if (userId === req.user._id) {
      return res.status(400).render("error", {
        title: "Cannot delete account",
        message: "You cannot delete your own account.",
      });
    }

    await UserModel.delete(userId);
    res.redirect("/organiser/users");
  } catch (err) {
    next(err);
  }
};

/**
 * ========== CLASS ROSTER ==========
 */

/**
 * GET /organiser/sessions/:id/attendees
 * View attendees for a session (class roster)
 */
export const sessionAttendeesPage = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await SessionModel.findById(sessionId);
    if (!session)
      return res.status(404).render("error", {
        title: "Not found",
        message: "Session not found",
      });

    const course = await CourseModel.findById(session.courseId);
    const bookings = await BookingModel.listBySession(sessionId);

    // Enrich bookings with user details
    const attendees = await Promise.all(
      bookings.map(async (b) => {
        const user = await UserModel.findById(b.userId);
        return {
          id: b._id,
          userName: user ? user.name : "Unknown User",
          userEmail: user ? user.email : "N/A",
          bookingDate: new Date(b.createdAt).toLocaleDateString("en-GB"),
          status: b.status || "CONFIRMED",
        };
      })
    );

    res.render("session-attendees", {
      title: `Class Roster: ${course ? course.title : "Unknown Course"}`,
      sessionDate: fmtDate(session.startDateTime),
      sessionTime: `${fmtTimeOnly(session.startDateTime)} – ${fmtTimeOnly(session.endDateTime)}`,
      attendeeCount: attendees.length,
      attendees: attendees,
      courseId: session.courseId,
      sessionId: sessionId,
    });
  } catch (err) {
    next(err);
  }
};
