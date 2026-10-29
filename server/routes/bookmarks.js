import express from 'express';
import User from '../models/User.js';
import Resource from '../models/Resource.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/bookmarks — get user's bookmarked resource IDs
router.get('/', protect, async (req, res) => {
  try {
    res.json({ success: true, data: req.user.bookmarks || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookmarks/resources — get full resource objects for bookmarks
router.get('/resources', protect, async (req, res) => {
  try {
    const ids = req.user.bookmarks || [];
    const resources = await Resource.find({ _id: { $in: ids } });
    res.json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/bookmarks/:resourceId — toggle bookmark
router.post('/:resourceId', protect, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const user = await User.findById(req.user._id);
    const idx = user.bookmarks.indexOf(resourceId);
    let isBookmarked;

    if (idx > -1) {
      user.bookmarks.splice(idx, 1);
      isBookmarked = false;
    } else {
      user.bookmarks.push(resourceId);
      isBookmarked = true;
    }

    await user.save();
    res.json({ success: true, isBookmarked, bookmarks: user.bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
