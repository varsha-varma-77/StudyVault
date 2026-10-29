import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GET /api/resources — public, filterable
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, courseCode, department, format, sort, limit = 50 } = req.query;
    let query = {};

    if (q) {
      query['$or'] = [
        { title: { $regex: q, $options: 'i' } },
        { courseCode: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    if (courseCode && courseCode !== 'ALL') query.courseCode = courseCode.toUpperCase();
    if (department && department !== 'ALL') query.department = { $regex: department, $options: 'i' };
    if (format && format !== 'ALL') query.fileFormat = format.toUpperCase();

    let sortObj = { createdAt: -1 };
    if (sort === 'popular') sortObj = { downloadsCount: -1 };
    else if (sort === 'likes') sortObj = { likesCount: -1 };

    const resources = await Resource.find(query).sort(sortObj).limit(Number(limit));
    res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/resources/user/uploads — must be BEFORE /:id
router.get('/user/uploads', protect, async (req, res) => {
  try {
    const resources = await Resource.find({ 'uploader.userId': req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/resources/:id
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/resources — protected, multipart/form-data with optional file
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, courseCode, department, semester, fileFormat, description, fileSize: bodySize } = req.body;
    if (!title || !courseCode || !department) {
      return res.status(400).json({ success: false, message: 'Title, course code, and department are required' });
    }

    let filePath = null;
    let fileSize = bodySize || 'Unknown';
    let downloadUrl = '#';

    if (req.file) {
      filePath = req.file.path;
      const bytes = req.file.size;
      fileSize = bytes > 1048576
        ? (bytes / 1048576).toFixed(1) + ' MB'
        : Math.round(bytes / 1024) + ' KB';
      downloadUrl = '/uploads/' + req.file.filename;
    }

    const detectedFormat = req.file
      ? path.extname(req.file.originalname).slice(1).toUpperCase()
      : (fileFormat || 'PDF').toUpperCase();

    const resource = await Resource.create({
      title: title.trim(),
      courseCode: courseCode.toUpperCase().trim(),
      department,
      fileFormat: detectedFormat,
      fileSize,
      filePath,
      downloadUrl,
      semester: Number(semester) || 1,
      uploader: {
        name: req.user.name,
        email: req.user.email,
        college: req.user.college,
        userId: req.user._id,
      },
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      description: (description || '').trim(),
    });

    res.status(201).json({ success: true, message: 'Resource uploaded successfully', data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/resources/:id — uploader only
router.delete('/:id', protect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    if (String(resource.uploader.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this resource' });
    }
    if (resource.filePath && fs.existsSync(resource.filePath)) fs.unlinkSync(resource.filePath);
    await resource.deleteOne();
    await User.updateMany({}, { $pull: { bookmarks: req.params.id } });
    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/resources/:id/download — increment download counter
router.post('/:id/download', async (req, res) => {
  try {
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloadsCount: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
