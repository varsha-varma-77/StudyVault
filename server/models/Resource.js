import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  courseCode: { type: String, required: true, uppercase: true, trim: true },
  department: { type: String, required: true },
  fileFormat: { type: String, required: true, uppercase: true },
  fileSize: { type: String },
  filePath: { type: String },        // server-side path (multer)
  downloadUrl: { type: String, default: '#' },
  semester: { type: Number, min: 1, max: 8, default: 1 },
  uploader: {
    name: String,
    email: String,
    college: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  uploadDate: { type: String },
  downloadsCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  description: { type: String, default: '' },
}, { timestamps: true });

// Full-text search index
resourceSchema.index({ title: 'text', courseCode: 'text', department: 'text', description: 'text' });

export default mongoose.model('Resource', resourceSchema);
