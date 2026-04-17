// services/bookingService.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { BookingModel } from "../models/bookingModel.js";

const canReserveAll = (sessions) =>
  sessions.every((s) => (s.bookedCount ?? 0) < (s.capacity ?? 0));

export async function bookCourseForUser(userId, courseId) {
  const course = await CourseModel.findById(courseId);
  if (!course) throw new Error("Course not found");
  const allSessions = await SessionModel.listByCourse(courseId);
  if (allSessions.length === 0) throw new Error("Course has no sessions");

  // Check if user already has a course booking
  const existingCourseBooking = await BookingModel.findByUserAndCourse(userId, courseId);
  if (existingCourseBooking) {
    throw new Error("You are already booked for this entire course");
  }

  // Filter out sessions the user is already booked for (if drop-ins allowed)
  let sessionsToBook = allSessions;
  if (course.allowDropIn) {
    const alreadyBookedSessionIds = new Set();
    
    // Check each session individually
    for (const session of allSessions) {
      const existingBooking = await BookingModel.findByUserAndSession(userId, session._id);
      if (existingBooking) {
        alreadyBookedSessionIds.add(session._id);
      }
    }
    
    sessionsToBook = allSessions.filter(s => !alreadyBookedSessionIds.has(s._id));
    
    if (sessionsToBook.length === 0) {
      throw new Error("You are already booked for all sessions in this course");
    }
  }

  let status = "CONFIRMED";
  if (!canReserveAll(sessionsToBook)) {
    status = "WAITLISTED";
  } else {
    for (const s of sessionsToBook) await SessionModel.incrementBookedCount(s._id, 1);
  }

  return BookingModel.create({
    userId,
    courseId,
    type: "COURSE",
    sessionIds: sessionsToBook.map((s) => s._id),
    status,
  });
}

export async function bookSessionForUser(userId, sessionId) {
  const session = await SessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");
  const course = await CourseModel.findById(session.courseId);
  if (!course) throw new Error("Course not found");

  // Check if user already has a booking for this session
  const existingBooking = await BookingModel.findByUserAndSession(userId, sessionId);
  if (existingBooking) {
    throw new Error("You are already booked for this session");
  }

  if (!course.allowDropIn && course.type === "WEEKLY_BLOCK") {
    const err = new Error("Drop-in not allowed for this course");
    err.code = "DROPIN_NOT_ALLOWED";
    throw err;
  }

  let status = "CONFIRMED";
  if ((session.bookedCount ?? 0) >= (session.capacity ?? 0)) {
    status = "WAITLISTED";
  } else {
    await SessionModel.incrementBookedCount(session._id, 1);
  }

  return BookingModel.create({
    userId,
    courseId: course._id,
    type: "SESSION",
    sessionIds: [session._id],
    status,
  });
}
