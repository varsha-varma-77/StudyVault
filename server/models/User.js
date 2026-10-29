import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  college: { type: String, default: 'University Campus' },
  department: { type: String, default: 'General' },
  semester: { type: Number, default: 1, min: 1, max: 8 },
  role: { type: String, default: 'Student' },
  bookmarks: [{ type: String }], // stores resource _id strings
  joinedDate: { type: String }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  next();
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return safe public object (strip password)
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    college: this.college,
    department: this.department,
    semester: this.semester,
    role: this.role,
    joinedDate: this.joinedDate,
    bookmarks: this.bookmarks,
  };
};

export default mongoose.model('User', userSchema);
