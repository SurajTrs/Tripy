// models/User.ts
import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  createdAt: String
});
export default mongoose.models.User || mongoose.model('User', userSchema);
