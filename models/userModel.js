
// models/userModel.js
import { usersDb } from './_db.js';
import bcrypt from 'bcryptjs';

export const UserModel = {
  async create(user) {
    return usersDb.insert(user);
  },
  async createWithPassword(name, email, password, role = 'student') {
    // Hash password with bcryptjs (salt rounds: 10)
    const passwordHash = await bcrypt.hash(password, 10);
    return usersDb.insert({
      name,
      email,
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    });
  },
  async findByEmail(email) {
    return usersDb.findOne({ email });
  },
  async findById(id) {
    return usersDb.findOne({ _id: id });
  },
  async verifyPassword(user, plainPassword) {
    // Compare plain password with hashed version
    if (!user.passwordHash) return false;
    return bcrypt.compare(plainPassword, user.passwordHash);
  },
  async list() {
    // Get all users (for organiser user management)
    return usersDb.find({});
  },
  async delete(id) {
    // Remove user by id
    await usersDb.remove({ _id: id });
  },
  async updateRole(id, newRole) {
    // Change user's role
    await usersDb.update({ _id: id }, { $set: { role: newRole } });
    return this.findById(id);
  }
};
``
