
// models/bookingModel.js
import { bookingsDb } from './_db.js';

export const BookingModel = {
  async create(booking) {
    return bookingsDb.insert({ ...booking, createdAt: new Date().toISOString() });
  },
  async findById(id) {
    return bookingsDb.findOne({ _id: id });
  },
  async listByUser(userId) {
    return bookingsDb.find({ userId }).sort({ createdAt: -1 });
  },
  async listBySession(sessionId) {
    // Find bookings that include this session in their sessionIds array
    const allBookings = await bookingsDb.find({});
    return allBookings.filter(booking => 
      booking.sessionIds && booking.sessionIds.includes(sessionId)
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async findByUserAndSession(userId, sessionId) {
    // Find any active booking for this user that includes this session
    const userBookings = await this.listByUser(userId);
    return userBookings.find(booking => 
      booking.status !== 'CANCELLED' && 
      booking.sessionIds && 
      booking.sessionIds.includes(sessionId)
    );
  },
  async findByUserAndCourse(userId, courseId) {
    return bookingsDb.findOne({ 
      userId, 
      courseId,
      type: 'COURSE',
      status: { $ne: 'CANCELLED' }
    });
  },
  async cancel(id) {
    await bookingsDb.update({ _id: id }, { $set: { status: 'CANCELLED' } });
    return this.findById(id);
  }
};
``
